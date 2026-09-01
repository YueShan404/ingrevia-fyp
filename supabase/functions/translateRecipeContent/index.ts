const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGES = {
  bm: "Malay (Bahasa Melayu), natural Malaysian wording",
  zh: "Simplified Chinese, natural food and cooking wording",
  ta: "Tamil, natural food and cooking wording",
};

type RecipeText = {
  title?: string;
  description?: string;
  ingredients?: string[];
  steps?: string[];
  zero_waste_tip?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured for translateRecipeContent.");
    }

    const source = await req.json() as RecipeText;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_TRANSLATION_MODEL") || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [
              "Translate recipe content directly and accurately.",
              "Preserve measurements, quantities, ingredient names, cooking sequence, and food safety meaning.",
              "Return only strict JSON with keys bm, zh, ta.",
              "Each language object must contain title, description, ingredients, steps, and zero_waste_tip.",
              "Keep empty source fields empty.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              target_languages: LANGUAGES,
              recipe: source,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "recipe_translations",
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["bm", "zh", "ta"],
              properties: Object.fromEntries(Object.keys(LANGUAGES).map((code) => [
                code,
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "description", "ingredients", "steps", "zero_waste_tip"],
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    ingredients: { type: "array", items: { type: "string" } },
                    steps: { type: "array", items: { type: "string" } },
                    zero_waste_tip: { type: "string" },
                  },
                },
              ])),
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const rawText = data.output_text || data.output?.[0]?.content?.[0]?.text;
    const translations = JSON.parse(rawText);

    return new Response(JSON.stringify(translations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Translation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
