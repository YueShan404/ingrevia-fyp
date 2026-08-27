const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Ingredient = {
  id: string;
  name: string;
  name_bm?: string | null;
  name_zh?: string | null;
  name_ta?: string | null;
  category?: string | null;
  description?: string | null;
  image_url?: string | null;
};

type VisionResult = {
  ingredient_name: string;
  confidence: number;
  description: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalize = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getIngredientNames = (ingredient: Ingredient) =>
  [ingredient.name, ingredient.name_bm, ingredient.name_zh, ingredient.name_ta]
    .filter(Boolean)
    .map((name) => String(name));

const findMatch = (detectedName: string, ingredients: Ingredient[]) => {
  const detected = normalize(detectedName);
  if (!detected) return null;

  let bestMatch: Ingredient | null = null;
  let bestScore = 0;

  for (const ingredient of ingredients) {
    for (const name of getIngredientNames(ingredient)) {
      const candidate = normalize(name);
      if (!candidate) continue;

      let score = 0;
      if (candidate === detected) score = 100;
      else if (candidate.includes(detected) || detected.includes(candidate)) score = 85;
      else {
        const detectedWords = new Set(detected.split(" "));
        const candidateWords = candidate.split(" ");
        const overlap = candidateWords.filter((word) => detectedWords.has(word)).length;
        score = Math.round((overlap / Math.max(candidateWords.length, detectedWords.size)) * 70);
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = ingredient;
      }
    }
  }

  return bestScore >= 60 ? bestMatch : null;
};

const loadIngredients = async (supabaseUrl: string, serviceRoleKey: string) => {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/ingredients?select=id,name,name_bm,name_zh,name_ta,category,description,image_url`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load ingredients: ${await response.text()}`);
  }

  return (await response.json()) as Ingredient[];
};

const analyzeImage = async (imageUrl: string, ingredients: Ingredient[]) => {
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) {
    throw new Error("Missing OPENAI_API_KEY Supabase secret.");
  }

  const catalog = ingredients
    .slice(0, 250)
    .map((ingredient) => getIngredientNames(ingredient).join(" / "))
    .join(", ");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_VISION_MODEL") || "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You identify food ingredients from images for an educational app. Return only valid JSON with ingredient_name, confidence, and description. Confidence must be a number from 0 to 100. Prefer an ingredient from the provided catalog when it visually fits. Do not give medical advice.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Identify the main visible ingredient in this image. Ingredient catalog: ${catalog}`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI vision request failed: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content) as Partial<VisionResult>;

  return {
    ingredient_name: String(parsed.ingredient_name || "").trim(),
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence || 0))),
    description: String(parsed.description || "").trim(),
  };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing Supabase Edge Function environment variables." }, 500);
    }

    const { image_url } = await request.json();
    if (!image_url || typeof image_url !== "string") {
      return json({ error: "image_url is required." }, 400);
    }

    const ingredients = await loadIngredients(supabaseUrl, serviceRoleKey);
    const result = await analyzeImage(image_url, ingredients);
    const matchedIngredient = findMatch(result.ingredient_name, ingredients);

    return json({
      ingredient_name: result.ingredient_name,
      confidence: result.confidence,
      description: result.description,
      matched_ingredient: matchedIngredient,
    });
  } catch (error) {
    console.error(error);
    return json(
      {
        error: "Ingredient recognition failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
