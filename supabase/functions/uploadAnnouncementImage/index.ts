const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAIL = "shanyuew416@gmail.com";
const PUBLIC_BUCKET = "ingrevia-public";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Missing Supabase environment variables." }, 500);

    await assertAdmin(request, supabaseUrl, serviceRoleKey);

    const { file_name, content_type, bytes } = await request.json();
    if (!file_name || !Array.isArray(bytes)) return json({ error: "file_name and bytes are required." }, 400);

    const extension = String(file_name).split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "png";
    const path = `announcements/${crypto.randomUUID()}.${extension}`;

    const response = await fetch(`${supabaseUrl}/storage/v1/object/${PUBLIC_BUCKET}/${path}`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": content_type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: new Uint8Array(bytes),
    });

    if (!response.ok) throw new Error(await response.text());

    return json({
      bucket: PUBLIC_BUCKET,
      file_path: path,
      file_url: `${supabaseUrl}/storage/v1/object/public/${PUBLIC_BUCKET}/${path}`,
    });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
