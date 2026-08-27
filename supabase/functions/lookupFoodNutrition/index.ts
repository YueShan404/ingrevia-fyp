const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const nutrientMap: Record<number, string> = {
  1008: "calories",
  1003: "protein",
  1005: "carbs",
  2000: "sugar",
  1079: "fiber",
  1004: "fat",
  1258: "saturated_fat",
  1093: "sodium",
  1092: "potassium",
};

const toNutrition = (food: any) => {
  const nutrition: Record<string, number | null> = {
    calories: null,
    protein: null,
    carbs: null,
    sugar: null,
    fiber: null,
    fat: null,
    saturated_fat: null,
    sodium: null,
    potassium: null,
  };

  for (const nutrient of food.foodNutrients || []) {
    const nutrientId = nutrient.nutrientId || nutrient.nutrient?.id;
    const field = nutrientMap[nutrientId];
    if (!field) continue;

    const value = nutrient.value ?? nutrient.amount;
    nutrition[field] = typeof value === "number" ? value : Number(value);
  }

  return nutrition;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("USDA_FDC_API_KEY");
    if (!apiKey) {
      return json({ error: "Missing USDA_FDC_API_KEY Supabase secret." }, 500);
    }

    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return json({ error: "query is required." }, 400);
    }

    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        pageSize: 5,
        dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
      }),
    });

    if (!response.ok) {
      throw new Error(`USDA FoodData Central request failed: ${await response.text()}`);
    }

    const data = await response.json();
    const foods = (data.foods || []).map((food: any) => ({
      fdc_id: food.fdcId,
      description: food.description,
      data_type: food.dataType,
      source: "USDA FoodData Central",
      source_url: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/nutrients`,
      ...toNutrition(food),
    }));

    return json({ query, foods });
  } catch (error) {
    console.error(error);
    return json(
      {
        error: "Food nutrition lookup failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
