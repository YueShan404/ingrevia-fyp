const allowedOrigins = (Deno.env.get("APP_ALLOWED_ORIGINS") || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

type Ingredient = {
  id: string;
  name: string;
  name_bm?: string;
  name_zh?: string;
  name_ta?: string;
  category?: string;
  description?: string;
};

type Detection = {
  ingredient_name: string;
  common_names: string[];
  category: string;
  confidence: number;
  description: string;
};

const normalize = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const ingredientTerms = (ingredient: Ingredient) =>
  [
    ingredient.name,
    ingredient.name_bm,
    ingredient.name_zh,
    ingredient.name_ta,
    ingredient.category,
    ingredient.description,
  ]
    .filter(Boolean)
    .map((term) => normalize(String(term)));

const scoreMatch = (ingredient: Ingredient, detection: Detection) => {
  const queries = [
    detection.ingredient_name,
    detection.category,
    ...(detection.common_names || []),
  ]
    .filter(Boolean)
    .map((term) => normalize(String(term)));

  return queries.reduce((bestScore, query) => {
    const score = ingredientTerms(ingredient).reduce((termBest, term) => {
      if (!query || !term) return termBest;
      if (query === term) return Math.max(termBest, 98);
      if (query.includes(term) || term.includes(query)) return Math.max(termBest, 86);

      const queryWords = query.split(" ").filter((word) => word.length > 2);
      const termWords = term.split(" ").filter((word) => word.length > 2);
      const overlap = queryWords.filter((word) => termWords.includes(word)).length;
      return overlap > 0 ? Math.max(termBest, Math.min(78, 44 + overlap * 12)) : termBest;
    }, 0);
    return Math.max(bestScore, score);
  }, 0);
};

const json = (body: unknown, status: number, corsHeaders: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const assertAllowedImageUrl = (imageUrl: string) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const bucket = Deno.env.get("SUPABASE_STORAGE_BUCKET") || "ingrevia-uploads";

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is missing.");
  }

  const parsed = new URL(imageUrl);
  const expected = new URL(supabaseUrl);
  const allowedPath = `/storage/v1/object/public/${bucket}/`;

  if (parsed.origin !== expected.origin || !parsed.pathname.startsWith(allowedPath)) {
    throw new Error("Only images uploaded through Ingrevia storage can be scanned.");
  }
};

async function assertAuthenticated(authHeader: string | null) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey || !authHeader?.startsWith("Bearer ")) {
    throw new Error("Authentication is required for image scanning.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    throw new Error("Authentication is required for image scanning.");
  }
}

async function loadIngredients(authHeader: string): Promise<Ingredient[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase function environment is missing SUPABASE_URL or SUPABASE_ANON_KEY.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/ingredients?select=*&order=name.asc&limit=500`,
    {
      headers: {
        apikey: anonKey,
        Authorization: authHeader,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to load ingredient catalogue (${response.status}).`);
  }

  return await response.json();
}

async function detectIngredient(imageUrl: string, ingredients: Ingredient[]): Promise<Detection> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_VISION_MODEL") || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set for the recognizeIngredient Supabase function.");
  }

  const knownIngredients = ingredients
    .slice(0, 160)
    .map((ingredient) => ingredient.name)
    .filter(Boolean)
    .join(", ");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Identify the main edible ingredient in this image for a Malaysian food-learning app. " +
                "If the ingredient is visible but not in the known catalogue, still name it. " +
                "Prefer the most specific common ingredient name. Return only the requested JSON fields. " +
                "Use confidence 0-100. Known catalogue examples: " +
                knownIngredients,
            },
            {
              type: "input_image",
              image_url: imageUrl,
              detail: "high",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "ingredient_detection",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              ingredient_name: { type: "string" },
              common_names: {
                type: "array",
                items: { type: "string" },
              },
              category: { type: "string" },
              confidence: { type: "number" },
              description: { type: "string" },
            },
            required: ["ingredient_name", "common_names", "category", "confidence", "description"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI vision recognition failed (${response.status}): ${detail}`);
  }

  const payload = await response.json();
  const text =
    payload.output_text ||
    payload.output
      ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || [])
      ?.find((item: { text?: string }) => item.text)
      ?.text;

  if (!text) {
    throw new Error("OpenAI vision recognition returned no readable result.");
  }

  return JSON.parse(text);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (allowedOrigins.length > 0 && (!origin || !allowedOrigins.includes(origin))) {
    return json({ error: true, message: "Origin is not allowed." }, 403, corsHeaders);
  }

  if (req.method !== "POST") {
    return json({ error: true, message: "Method not allowed." }, 405, corsHeaders);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    await assertAuthenticated(authHeader);

    const { image_url } = await req.json();

    if (!image_url || typeof image_url !== "string") {
      return json({ error: true, message: "image_url is required." }, 400, corsHeaders);
    }

    assertAllowedImageUrl(image_url);

    const ingredients = await loadIngredients(authHeader as string);
    const detection = await detectIngredient(image_url, ingredients);
    const ranked = ingredients
      .map((ingredient) => ({
        ingredient,
        score: scoreMatch(ingredient, detection),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    const matchedIngredient = best?.score >= 72 ? best.ingredient : null;
    const confidence = Math.max(0, Math.min(100, Math.round(detection.confidence || 0)));

    return json(
      {
        ingredient_name: detection.ingredient_name,
        common_names: detection.common_names || [],
        detected_category: detection.category || "",
        confidence,
        description: matchedIngredient
          ? detection.description
          : `${detection.description} This ingredient was detected by AI but is not currently in the Ingrevia catalogue.`,
        matched_ingredient: matchedIngredient,
        matched: Boolean(matchedIngredient),
        suggestions: ranked.slice(0, 5).map((item) => item.ingredient),
        source: "openai_vision",
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error(error);
    return json(
      {
        error: true,
        message: error instanceof Error ? error.message : "Ingredient recognition failed.",
      },
      500,
      corsHeaders,
    );
  }
});
