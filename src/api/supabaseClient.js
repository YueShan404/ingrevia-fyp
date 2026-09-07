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
  Feedback: "feedback_reports",
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

const createAuthError = (type, message, details = {}) => {
  const error = new Error(message);
  error.type = type;
  Object.assign(error, details);
  return error;
};

const getProfileCooldown = (profileUpdatedAt, role) => {
  if (role === "admin") return { locked: false, nextChangeDate: null };
  if (!profileUpdatedAt) return { locked: false, nextChangeDate: null };
  const nextChangeDate = new Date(profileUpdatedAt);
  nextChangeDate.setDate(nextChangeDate.getDate() + 7);
  return { locked: nextChangeDate > new Date(), nextChangeDate };
};

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Authentication required");
  return user;
};

export const appApi = {
  entities: {
    Ingredient: createEntityApi("Ingredient"),
    Recipe: createEntityApi("Recipe"),
    CommunityRecipe: createEntityApi("CommunityRecipe"),
    ScanHistory: createEntityApi("ScanHistory"),
  },

  scanHistory: {
    async create(values) {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from("scan_history")
        .insert({ ...values, user_id: user.id })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async listRecent(days = 30, limit = 50) {
      const since = new Date();
      since.setDate(since.getDate() - days);

      await supabase.rpc("delete_expired_scan_history").catch(() => {});

      const { data, error } = await supabase
        .from("scan_history")
        .select("*")
        .gte("created_date", since.toISOString())
        .order("created_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  },

  activity: {
    async listMine() {
      const user = await getCurrentUser();
      await supabase.rpc("delete_expired_scan_history").catch(() => {});

      const [scans, bookmarks, likes, comments] = await Promise.all([
        supabase
          .from("scan_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_date", { ascending: false })
          .limit(50),
        supabase
          .from("recipe_bookmarks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_date", { ascending: false })
          .limit(50),
        supabase
          .from("community_recipe_likes")
          .select("*, community_recipes(*)")
          .eq("user_id", user.id)
          .order("created_date", { ascending: false })
          .limit(50),
        supabase
          .from("community_recipe_comments")
          .select("*, community_recipes(*)")
          .eq("user_id", user.id)
          .order("created_date", { ascending: false })
          .limit(50),
      ]);

      if (scans.error) throw scans.error;
      if (bookmarks.error) console.warn("Saved recipe history unavailable.", bookmarks.error);
      if (likes.error) console.warn("Liked recipe history unavailable.", likes.error);
      if (comments.error) console.warn("Comment history unavailable.", comments.error);

      const bookmarkRows = bookmarks.error ? [] : bookmarks.data || [];
      const recipeIds = bookmarkRows.filter((item) => item.recipe_type === "recipe").map((item) => item.recipe_id);
      const communityRecipeIds = bookmarkRows
        .filter((item) => item.recipe_type === "community_recipe")
        .map((item) => item.recipe_id);

      const [recipeRows, communityRecipeRows] = await Promise.all([
        recipeIds.length
          ? supabase.from("recipes").select("*").in("id", recipeIds)
          : Promise.resolve({ data: [], error: null }),
        communityRecipeIds.length
          ? supabase.from("community_recipes").select("*").in("id", communityRecipeIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (recipeRows.error) console.warn("Recipe bookmark details unavailable.", recipeRows.error);
      if (communityRecipeRows.error) console.warn("Community bookmark details unavailable.", communityRecipeRows.error);

      const recipesById = Object.fromEntries((recipeRows.data || []).map((recipe) => [recipe.id, recipe]));
      const communityRecipesById = Object.fromEntries((communityRecipeRows.data || []).map((recipe) => [recipe.id, recipe]));
      const saved = bookmarkRows.map((item) => ({
        ...item,
        recipe: item.recipe_type === "recipe" ? recipesById[item.recipe_id] : communityRecipesById[item.recipe_id],
      }));

      return {
        scans: scans.data || [],
        saved,
        liked: likes.error ? [] : likes.data || [],
        commented: comments.error ? [] : comments.data || [],
      };
    },
  },

  feedback: {
    async create(values) {
      const user = await getCurrentUser();
      const payload = {
        type: values.type || "feedback",
        subject: String(values.subject || "").trim(),
        message: String(values.message || "").trim(),
        page_url: values.page_url || window.location.href,
        user_id: user.id,
      };
      if (!payload.subject || !payload.message) throw new Error("Subject and message are required.");

      const { data, error } = await supabase.from("feedback_reports").insert(payload).select("*").single();
      if (error) throw error;
      return data;
    },

    async listForAdmin() {
      const { data, error } = await supabase
        .from("feedback_reports")
        .select("*, profiles:user_id(email,full_name,public_user_id)")
        .order("created_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },

    async setStatus(id, status) {
      const { data, error } = await supabase
        .from("feedback_reports")
        .update({ status })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  },

  auth: {
    async me() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        throw new Error("Authentication required");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role,status,full_name,email,avatar_url,public_user_id,profile_updated_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        throw createAuthError(
          "profile_required",
          "Your login worked, but your profile setup is missing. Please ask the administrator to repair your profile record.",
          { authUser: user }
        );
      }

      if (profile.status === "blocked") {
        throw createAuthError(
          "account_blocked",
          "This account is blocked. Please contact the administrator.",
          { authUser: user, profile }
        );
      }

      const role = isAdminEmail(user.email) ? "admin" : profile.role || user.user_metadata?.role || "user";

      return {
        id: user.id,
        email: user.email,
        status: profile.status,
        full_name: profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        avatar_url: profile.avatar_url,
        public_user_id: profile.public_user_id,
        profile_updated_at: profile.profile_updated_at,
        ...user.user_metadata,
        role,
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
        const user = await getCurrentUser();
        const extension = file.name.split(".").pop();
        const safeExtension = extension ? extension.toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${safeExtension}`;
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
      if (error) {
        try {
          const details = await error.context?.json?.();
          const message = details?.message || details?.error;
          if (message) throw new Error(message);
        } catch (detailsError) {
          if (detailsError instanceof Error && detailsError.message !== "Body is unusable") {
            throw detailsError;
          }
        }
        throw error;
      }
      return { data };
    },
  },

  profiles: {
    getCooldown(profile) {
      return getProfileCooldown(profile?.profile_updated_at, profile?.role);
    },

    async updateOwnProfile({ full_name, avatar_url }) {
      const user = await getCurrentUser();

      const { data: current, error: currentError } = await supabase
        .from("profiles")
        .select("profile_updated_at,role")
        .eq("id", user.id)
        .single();
      if (currentError) throw currentError;

      const cooldown = getProfileCooldown(current?.profile_updated_at, current?.role);
      if (cooldown.locked) {
        throw new Error(`Profile can only be changed every 7 days. Next change: ${cooldown.nextChangeDate.toLocaleDateString()}`);
      }

      const values = {
        full_name: String(full_name || "").trim(),
        avatar_url: avatar_url || null,
        profile_updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(values)
        .eq("id", user.id)
        .select("id,email,full_name,role,status,avatar_url,public_user_id,profile_updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async getPublicByUserId(userId) {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url,public_user_id,created_date")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getPublicByPublicId(publicUserId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url,public_user_id,created_date")
        .eq("public_user_id", publicUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async listForAdmin() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,full_name,avatar_url,public_user_id,role,status,created_date,updated_date")
        .order("created_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async setStatus(userId, status) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId)
        .select("id,email,full_name,role,status")
        .single();
      if (error) throw error;
      return data;
    },
  },

  social: {
    async getRecipeEngagement(recipeId) {
      const user = await getCurrentUser();
      const [likes, ownLike, comments] = await Promise.all([
        supabase.from("community_recipe_likes").select("id", { count: "exact", head: true }).eq("recipe_id", recipeId),
        supabase.from("community_recipe_likes").select("id").eq("recipe_id", recipeId).eq("user_id", user.id).maybeSingle(),
        supabase
          .from("community_recipe_comments")
          .select("*")
          .eq("recipe_id", recipeId)
          .order("created_date", { ascending: false }),
      ]);

      const error = likes.error || (ownLike.error && ownLike.error.code !== "PGRST116" ? ownLike.error : null) || comments.error;
      if (error) throw error;

      const authorIds = [...new Set((comments.data || []).map((comment) => comment.user_id).filter(Boolean))];
      const { data: profiles, error: profileError } = authorIds.length
        ? await supabase.from("profiles").select("id,full_name,avatar_url,public_user_id").in("id", authorIds)
        : { data: [], error: null };
      if (profileError) throw profileError;

      const profileById = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));

      return {
        likeCount: likes.count || 0,
        liked: Boolean(ownLike.data),
        comments: (comments.data || []).map((comment) => ({
          ...comment,
          author: profileById[comment.user_id] || null,
        })),
      };
    },

    async toggleRecipeLike(recipeId, liked) {
      const user = await getCurrentUser();
      if (liked) {
        const { error } = await supabase
          .from("community_recipe_likes")
          .delete()
          .eq("recipe_id", recipeId)
          .eq("user_id", user.id);
        if (error) throw error;
        return false;
      }

      const { error } = await supabase
        .from("community_recipe_likes")
        .insert({ recipe_id: recipeId, user_id: user.id });
      if (error && error.code !== "23505") throw error;
      return true;
    },

    async addComment(recipeId, body) {
      const user = await getCurrentUser();
      const text = String(body || "").trim();
      if (!text) throw new Error("Comment cannot be empty.");

      const { data, error } = await supabase
        .from("community_recipe_comments")
        .insert({ recipe_id: recipeId, user_id: user.id, body: text })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async deleteComment(commentId) {
      const { error } = await supabase.from("community_recipe_comments").delete().eq("id", commentId);
      if (error) throw error;
      return true;
    },

    async isFollowing(followingId) {
      const { data, error } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("following_id", followingId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },

    async follow(followingId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Authentication required");
      const { error } = await supabase.from("user_follows").insert({ follower_id: user.id, following_id: followingId });
      if (error) throw error;
      return true;
    },

    async unfollow(followingId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Authentication required");
      const { error } = await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", followingId);
      if (error) throw error;
      return true;
    },

    async listFollowers(userId) {
      const { data, error } = await supabase.from("user_follows").select("follower_id").eq("following_id", userId);
      if (error) throw error;
      return (data || []).map((row) => row.follower_id);
    },

    async notifyFollowers({ followerIds, actorUserId, recipeId, recipeTitle }) {
      const rows = [...new Set(followerIds || [])].map((userId) => ({
        user_id: userId,
        actor_user_id: actorUserId,
        recipe_id: recipeId,
        type: "new_recipe",
        message: `New recipe shared: ${recipeTitle}`,
      }));
      if (!rows.length) return [];
      const { data, error } = await supabase.from("notifications").insert(rows).select("*");
      if (error) throw error;
      return data || [];
    },

    async listNotifications(limit = 20) {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  },
};
