import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";
import { getCanonicalLoginUrl } from "@/lib/authReturnTo";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "ingrevia-uploads";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env.local.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

const tableByEntity = {
  Ingredient: "ingredients",
  Recipe: "recipes",
  CommunityRecipe: "community_recipes",
  ScanHistory: "scan_history",
};

const applySort = (query, sort) => {
  if (!sort) return query;
  const ascending = !sort.startsWith("-");
  const column = ascending ? sort : sort.slice(1);
  return query.order(column, { ascending });
};

const createEntityApi = (entityName) => {
  const table = tableByEntity[entityName];

  return {
    async list(sort, limit) {
      let query = supabase.from(table).select("*");
      query = applySort(query, sort);
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },

    async create(values) {
      const { data, error } = await supabase.from(table).insert(values).select("*").single();
      if (error) throw error;
      return data;
    },

    async update(id, values) {
      const { data, error } = await supabase.from(table).update(values).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return true;
    },
  };
};

const getRedirectUrl = (returnTo = "/") => {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  return new URL(returnTo, baseUrl).toString();
};

export const appApi = {
  entities: {
    Ingredient: createEntityApi("Ingredient"),
    Recipe: createEntityApi("Recipe"),
    CommunityRecipe: createEntityApi("CommunityRecipe"),
    ScanHistory: createEntityApi("ScanHistory"),
  },

  auth: {
    async me() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        throw new Error("Authentication required");
      }

      return {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || (isAdminEmail(user.email) ? "admin" : "user"),
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        ...user.user_metadata,
      };
    },

    async loginViaEmailPassword(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async register({ email, password }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: getRedirectUrl("/") },
      });
      if (error) throw error;
      return data;
    },

    async verifyOtp({ email, otpCode }) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "signup",
      });
      if (error) throw error;
      return {
        ...data,
        access_token: data.session?.access_token,
      };
    },

    async resendOtp(email) {
      const { data, error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      return data;
    },

    async loginWithProvider(provider, returnTo = "/") {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getRedirectUrl(returnTo) },
      });
      if (error) throw error;
      return data;
    },

    async resetPasswordRequest(email) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl("/reset-password"),
      });
      if (error) throw error;
      return data;
    },

    async resetPassword({ newPassword }) {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    },

    async logout(returnTo) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      if (returnTo) window.location.href = returnTo;
    },

    redirectToLogin(returnTo = "/") {
      window.location.href = getCanonicalLoginUrl(returnTo);
    },

    setToken() {
      // Supabase persists sessions internally; kept for legacy call compatibility.
    },
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        const extension = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from(storageBucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;

        const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
        return { file_url: data.publicUrl };
      },
    },
  },

  functions: {
    async invoke(name, payload) {
      const { data, error } = await supabase.functions.invoke(name, { body: payload });
      if (error) throw error;
      return { data };
    },
  },
};
