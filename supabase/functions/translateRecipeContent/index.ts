const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_LANGUAGES = {
  bm: "ms",
  zh: "zh-CN",
  ta: "ta",
};

type RecipeText = {
  title?: string;
  description?: string;
  ingredients?: string[];
  steps?: string[];
  zero_waste_tip?: string;
};

type RecipeTranslation = {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  zero_waste_tip: string;
};

const toText = (value?: string) => String(value || "").trim();

const decodeHtmlEntities = (value: string) => {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
  };

  return value.replace(/&(amp|lt|gt|quot|#39);/g, (match) => entities[match] || match);
};

async function translateBatch(values: string[], target: string): Promise<string[]> {
  const apiKey = Deno.env.get("GOOGLE_CLOUD_TRANSLATION_API_KEY") ||
    Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");

  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_TRANSLATION_API_KEY is not set in Supabase secrets.");
  }

  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: values,
      target,
      source: "en",
      format: "text",
    }),
  });

  const payload = await response.json();

  if (!response.ok || payload.error) {
    const message = payload.error?.message || response.statusText || "Unknown Google Translation error.";
    throw new Error(`Google Translation failed (${response.status}): ${message}`);
  }

  const translated = payload.data?.translations || [];
  return values.map((value, index) => {
    if (!value) return "";
    return decodeHtmlEntities(translated[index]?.translatedText || value);
  });
}

async function translateRecipe(source: RecipeText, target: string): Promise<RecipeTranslation> {
  const ingredients = Array.isArray(source.ingredients) ? source.ingredients.map(toText) : [];
  const steps = Array.isArray(source.steps) ? source.steps.map(toText) : [];
  const values = [
    toText(source.title),
    toText(source.description),
    toText(source.zero_waste_tip),
    ...ingredients,
    ...steps,
  ];

  const translated = await translateBatch(values, target);
  const ingredientStart = 3;
  const stepStart = ingredientStart + ingredients.length;

  return {
    title: translated[0] || "",
    description: translated[1] || "",
    zero_waste_tip: translated[2] || "",
    ingredients: translated.slice(ingredientStart, stepStart),
    steps: translated.slice(stepStart),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const source = await req.json() as RecipeText;
    const entries = await Promise.all(
      Object.entries(TARGET_LANGUAGES).map(async ([code, target]) => [
        code,
        await translateRecipe(source, target),
      ]),
    );

    return new Response(JSON.stringify(Object.fromEntries(entries)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed";
    return new Response(JSON.stringify({ error: true, message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
