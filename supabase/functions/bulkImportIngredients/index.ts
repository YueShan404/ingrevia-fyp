import { numberOrNull, parseCsv } from "../_shared/csv.ts";

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
      name: row.name,
      name_bm: textOrNull(row.name_bm),
      name_zh: textOrNull(row.name_zh),
      name_ta: textOrNull(row.name_ta),
      category: row.category || "other",
      image_url: textOrNull(row.image_url),
      description: textOrNull(row.description),
      culinary_uses: textOrNull(row.culinary_uses),
      origin: textOrNull(row.origin),
      benefits: textOrNull(row.benefits),
      calories: numberOrNull(row.calories),
      protein: numberOrNull(row.protein),
      carbs: numberOrNull(row.carbs),
      sugar: numberOrNull(row.sugar),
      fiber: numberOrNull(row.fiber),
      fat: numberOrNull(row.fat),
      saturated_fat: numberOrNull(row.saturated_fat),
      sodium: numberOrNull(row.sodium),
      potassium: numberOrNull(row.potassium),
      source: row.source || "Curated dataset",
    })).filter((row) => row.name);

    const response = await fetch(`${supabaseUrl}/rest/v1/ingredients`, {
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
