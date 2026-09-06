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
  source?: string;
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
  ]
    .filter(Boolean)
    .map((term) => normalize(String(term)));

const BROAD_LABELS = new Set([
  "food",
  "ingredient",
  "vegetable",
  "leaf vegetable",
  "terrestrial plant",
  "plant",
  "produce",
  "natural foods",
  "whole food",
  "herb",
  "greens",
  "leaf",
]);

const EXTRA_ALIASES: Record<string, string[]> = {
  kangkung: ["water spinach", "morning glory", "chinese water spinach", "swamp cabbage", "ong choy", "kangkong"],
  cabbage: ["cabbage", "round cabbage", "green cabbage"],
  "chinese cabbage": ["chinese cabbage", "napa cabbage", "wong bok"],
  "bok choy": ["bok choy", "pak choy", "bok choy sum", "choy sum"],
};

const allIngredientTerms = (ingredient: Ingredient) => {
  const baseTerms = ingredientTerms(ingredient);
  const aliases = baseTerms.flatMap((term) => EXTRA_ALIASES[term] || []);
  return [...new Set([...baseTerms, ...aliases.map(normalize)])];
};

const scoreMatch = (ingredient: Ingredient, detection: Detection) => {
  const queries = [
    detection.ingredient_name,
    ...(detection.common_names || []),
  ]
    .filter(Boolean)
    .map((term) => normalize(String(term)));

  return queries.reduce((bestScore, query) => {
    if (!query || BROAD_LABELS.has(query)) return bestScore;

    const score = allIngredientTerms(ingredient).reduce((termBest, term) => {
      if (!query || !term) return termBest;
      if (query === term) return Math.max(termBest, 98);
      if (query.includes(term) || term.includes(query)) return Math.max(termBest, 86);

      const queryWords = query.split(" ").filter((word) => word.length > 2);
      const termWords = term.split(" ").filter((word) => word.length > 2);
      const overlap = queryWords.filter((word) => termWords.includes(word)).length;
      const hasSpecificOverlap = overlap > 0 && !queryWords.every((word) => BROAD_LABELS.has(word));
      return hasSpecificOverlap ? Math.max(termBest, Math.min(70, 36 + overlap * 10)) : termBest;
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

async function detectWithGoogleVision(imageUrl: string): Promise<Detection> {
  const apiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");

  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_VISION_API_KEY is not set in Supabase secrets.");
  }

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { source: { imageUri: imageUrl } },
          features: [{ type: "LABEL_DETECTION", maxResults: 10 }],
        },
      ],
    }),
  });

  const payload = await response.json();
  const googleError = payload.responses?.[0]?.error || payload.error;

  if (!response.ok || googleError) {
    const message = googleError?.message || response.statusText || "Unknown Google Vision error.";
    throw new Error(`Google Vision recognition failed (${response.status}): ${message}`);
  }

  const labels = payload.responses?.[0]?.labelAnnotations || [];
  const best = labels[0];

  if (!best?.description) {
    throw new Error("Google Vision returned no readable labels for this image.");
  }

  return {
    ingredient_name: best.description,
    common_names: labels
      .slice(1, 8)
      .map((label: { description?: string }) => label.description)
      .filter(Boolean),
    category: "food",
    confidence: Math.max(0, Math.min(100, Math.round((best.score || 0) * 100))),
    description: "Detected using Google Vision label detection and matched against the Ingrevia ingredient catalogue.",
    source: "google_vision",
  };
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
    const detection = await detectWithGoogleVision(image_url);
    const ranked = ingredients
      .map((ingredient) => ({
        ingredient,
        score: scoreMatch(ingredient, detection),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    const second = ranked[1];
    const isClearMatch = Boolean(best && best.score >= 86 && (!second || best.score - second.score >= 8));
    const matchedIngredient = isClearMatch ? best.ingredient : null;
    const confidence = Math.max(0, Math.min(100, Math.round(detection.confidence || 0)));

    return json(
      {
        ingredient_name: detection.ingredient_name,
        common_names: detection.common_names || [],
        detected_category: detection.category || "",
        confidence,
        description: matchedIngredient
          ? detection.description
          : `${detection.description} This ingredient was detected but is not currently in the Ingrevia catalogue.`,
        matched_ingredient: matchedIngredient,
        matched: Boolean(matchedIngredient),
        suggestions: ranked.slice(0, 5).map((item) => item.ingredient),
        source: "google_vision",
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
