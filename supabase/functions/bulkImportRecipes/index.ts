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
const ADMIN_EMAIL = "shanyuew416@gmail.com";

const assertAdmin = async (request: Request, supabaseUrl: string, serviceRoleKey: string) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) throw new Error("Authentication required.");

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: authHeader,
    },
  });

  if (!response.ok) throw new Error("Could not verify current user.");
  const user = await response.json();
  if (String(user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    throw new Error("Admin access required.");
  }
};

const downloadImportFile = async (payload: { bucket?: string; file_path?: string }, serviceRoleKey: string, supabaseUrl: string) => {
  const expectedBucket = Deno.env.get("SUPABASE_STORAGE_BUCKET") || "ingrevia-uploads";
  if (payload.bucket !== expectedBucket || !payload.file_path) {
    throw new Error(`Import file must be uploaded to ${expectedBucket}.`);
  }
  if (payload.file_path.includes("..") || payload.file_path.startsWith("/")) {
    throw new Error("Invalid import file path.");
  }

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${expectedBucket}/${payload.file_path}`,
    { headers: { Authorization: `Bearer ${serviceRoleKey}` } },
  );
  if (!response.ok) throw new Error(`Could not download import file: ${await response.text()}`);
  return response.text();
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Missing Supabase environment variables." }, 500);

    await assertAdmin(request, supabaseUrl, serviceRoleKey);
    const payload = await request.json();

    const rows = parseCsv(await downloadImportFile(payload, serviceRoleKey, supabaseUrl)).map((row) => ({
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
