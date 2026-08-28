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
