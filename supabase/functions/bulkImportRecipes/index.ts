import { numberOrNull, parseCsv, pgArrayToTextArray } from "../_shared/csv.ts";

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

const textOrNull = (value: string) => value || null;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Missing Supabase environment variables." }, 500);

    const { file_url } = await request.json();
    if (!file_url) return json({ error: "file_url is required." }, 400);

    const file = await fetch(file_url);
    if (!file.ok) throw new Error(`Could not download CSV: ${await file.text()}`);

    const rows = parseCsv(await file.text()).map((row) => ({
      title: row.title,
      title_bm: textOrNull(row.title_bm),
      title_zh: textOrNull(row.title_zh),
      title_ta: textOrNull(row.title_ta),
      cuisine: row.cuisine || "other",
      image_url: textOrNull(row.image_url),
      description: textOrNull(row.description),
      ingredients: pgArrayToTextArray(row.ingredients),
      steps: pgArrayToTextArray(row.steps),
      prep_time: numberOrNull(row.prep_time),
      cook_time: numberOrNull(row.cook_time),
      servings: numberOrNull(row.servings) || 2,
      spice_level: row.spice_level || "mild",
      zero_waste_tip: textOrNull(row.zero_waste_tip),
      ingredient_tags: pgArrayToTextArray(row.ingredient_tags),
      nutrient_tags: pgArrayToTextArray(row.nutrient_tags),
    })).filter((row) => row.title);

    const response = await fetch(`${supabaseUrl}/rest/v1/recipes`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rows),
    });

    if (!response.ok) throw new Error(await response.text());
    return json({ imported: rows.length });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
