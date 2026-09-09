import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import { useCommunityFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import SpeakButton from "@/components/SpeakButton";
import IngreviaLoader from "@/components/IngreviaLoader";
import { Image } from "@/components/ui/image";
import { ArrowLeft, Clock, Bookmark, Recycle, ChefHat, Sparkles, UserPlus, UserCheck, Heart, MessageCircle, Send, Trash2 } from "lucide-react";

export default function CommunityRecipeDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useCommunityFavorites();
  const [recipe, setRecipe] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [following, setFollowing] = useState(false);
  const [engagement, setEngagement] = useState({ likeCount: 0, liked: false, comments: [] });
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const commentRestricted = user?.status === "comment_restricted" || user?.status === "profile_blocked";
  const [loading, setLoading] = useState(true);

  const loadEngagement = React.useCallback(() => {
    if (!id || !isAuthenticated) return;
    appApi.social.getRecipeEngagement(id).then(setEngagement).catch(() => {});
  }, [id, isAuthenticated]);

  useEffect(() => {
    appApi.entities.CommunityRecipe
      .get(id)
      .then((data) => {
        setRecipe(data);
        if (data?.user_id) {
          appApi.profiles.getPublicByUserId(data.user_id).then(setAuthorProfile).catch(() => {});
          appApi.social.isFollowing(data.user_id).then(setFollowing).catch(() => {});
        }
        loadEngagement();
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, loadEngagement]);

  if (loading)
    return (
      <Layout>
        <IngreviaLoader compact message={t("loading.community_detail")} />
      </Layout>
    );

  if (!recipe)
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">{t("community.not_found")}</p>
          <Link to="/community" className="inline-flex items-center gap-1.5 text-primary font-medium">
            <ArrowLeft className="w-4 h-4" /> {t("community.back")}
          </Link>
        </div>
      </Layout>
    );

  const fav = isFavorite(recipe.id);
  const canFollow = isAuthenticated && authorProfile?.id && authorProfile.id !== user?.id;
  const title = localized(recipe, "title", lang);
  const description = localized(recipe, "description", lang);
  const ingredients = localized(recipe, "ingredients", lang) || [];
  const steps = localized(recipe, "steps", lang) || [];
  const zeroWaste = localized(recipe, "zero_waste_tip", lang);
  const cookTime = recipe.cook_time ?? recipe.prep_time ?? null;
  const recipeSpeech = [
    title,
    description,
    `${t("common.ingredients")}: ${ingredients.join(". ")}`,
    `${t("common.steps")}: ${steps.join(". ")}`,
    zeroWaste ? `${t("recipe_detail.zero_waste_title")}: ${zeroWaste}` : "",
  ].filter(Boolean).join(". ");

  const toggleLike = async () => {
    if (!isAuthenticated) return;
    const nextLiked = !engagement.liked;
    setEngagement((current) => ({
      ...current,
      liked: nextLiked,
      likeCount: Math.max(0, current.likeCount + (nextLiked ? 1 : -1)),
    }));

    try {
      await appApi.social.toggleRecipeLike(recipe.id, engagement.liked);
    } catch {
      loadEngagement();
    }
  };

  const addComment = async () => {
    if (commentRestricted) return;
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      await appApi.social.addComment(recipe.id, commentText);
      setCommentText("");
      loadEngagement();
    } finally {
      setCommenting(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm(t("community.comment_delete_confirm"))) return;
    await appApi.social.deleteComment(commentId);
    loadEngagement();
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {t("community.back")}
        </Link>

        {/* Hero */}
        <div className="glass-card rounded-3xl overflow-hidden border border-border/60 mb-6">
          <div className="relative h-56 sm:h-64">
            {recipe.image_url ? (
              <Image src={recipe.image_url} fittingType="fill" className="w-full h-full" alt={title} />
            ) : (
              <div className="w-full h-full brand-gradient" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/90 text-primary mb-2">
                {t(`kitchen.cuisines.${recipe.cuisine}`) || recipe.cuisine}
              </span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl drop-shadow-lg">{title}</h1>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-muted-foreground leading-relaxed flex-1 text-sm">{description}</p>
              <div className="flex shrink-0 items-center gap-2">
                <SpeakButton text={recipeSpeech} />
                <button
                  onClick={() => toggleFavorite(recipe.id)}
                  aria-label={fav ? t("community.bookmark_remove") : t("community.bookmark_add")}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                    fav ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${fav ? "fill-primary" : ""}`} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-primary" /> {t("community.contributed_by")}{" "}
                {authorProfile?.public_user_id ? (
                  <Link to={`/u/${authorProfile.public_user_id}`} className="font-semibold text-primary hover:underline">
                    {authorProfile.full_name || recipe.author}
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground/80">{recipe.author}</span>
                )}
              </span>
              {cookTime != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> {cookTime} {t("common.minutes")}
                </span>
              )}
              {recipe.status && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  recipe.status === "approved" ? "bg-accent/15 text-accent" : "bg-secondary text-primary"
                }`}>
                  {t(`community.status_${recipe.status}`)}
                </span>
              )}
            </div>
            {fav && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary font-medium">
                <Bookmark className="w-3.5 h-3.5 fill-primary" /> {t("community.bookmarked")}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/40 pt-4">
              <button
                type="button"
                onClick={toggleLike}
                disabled={!isAuthenticated}
                title={!isAuthenticated ? t("community.login_to_comment") : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  engagement.liked ? "bg-red-100 text-red-700" : "bg-secondary text-foreground/75 hover:text-primary"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Heart className={`h-4 w-4 ${engagement.liked ? "fill-current" : ""}`} />
                {engagement.likeCount} {t("community.likes")}
              </button>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-foreground/75">
                <MessageCircle className="h-4 w-4" />
                {engagement.comments.length} {t("community.comments")}
              </div>
            </div>
            {canFollow && (
              <button
                type="button"
                onClick={async () => {
                  if (following) {
                    await appApi.social.unfollow(authorProfile.id);
                    setFollowing(false);
                  } else {
                    await appApi.social.follow(authorProfile.id);
                    setFollowing(true);
                  }
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                {following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                {following ? t("profile.following") : t("profile.follow")}
              </button>
            )}
          </div>
        </div>

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div className="glass-card rounded-3xl border border-border/60 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-primary">{t("common.ingredients")}</h2>
              <SpeakButton text={`${t("common.ingredients")}: ${ingredients.join(". ")}`} />
            </div>
            <ul className="space-y-2.5">
              {ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="flex-1">{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div className="glass-card rounded-3xl border border-border/60 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-primary">{t("common.steps")}</h2>
              <SpeakButton text={`${t("common.steps")}: ${steps.join(". ")}`} />
            </div>
            <ol className="space-y-4">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full brand-gradient text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Zero-waste tip */}
        {zeroWaste && (
          <div className="glass-card rounded-3xl border border-accent/25 bg-accent/5 p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-11 h-11 rounded-2xl bg-accent/15 flex items-center justify-center">
                <Recycle className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading font-bold text-base mb-1 text-accent">{t("recipe_detail.zero_waste_title")}</h2>
                <p className="text-xs text-muted-foreground mb-2">{t("recipe_detail.zero_waste_subtitle")}</p>
                <p className="text-sm leading-relaxed">{zeroWaste}</p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card rounded-3xl border border-border/60 p-5 mb-6">
          <h2 className="font-heading font-bold text-lg text-primary flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> {t("community.comments")}
          </h2>
          {isAuthenticated ? (
            commentRestricted ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{t("community.comment_restricted")}</p>
            ) : (
            <div className="mt-4 flex gap-2">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                maxLength={500}
                placeholder={t("community.comment_placeholder")}
                className="min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={addComment}
                disabled={commenting || !commentText.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-60"
                aria-label={t("community.comment_send")}
                title={t("community.comment_send")}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            )
          ) : (
            <Link
              to="/login"
              className="mt-4 inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary/70"
            >
              {t("community.login_to_comment")}
            </Link>
          )}
          <div className="mt-4 space-y-3">
            {engagement.comments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-secondary/40 p-5 text-center text-sm text-muted-foreground">
                {t("community.comment_empty")}
              </p>
            ) : engagement.comments.map((comment) => (
              <div key={comment.id} className="rounded-2xl border border-border/60 bg-background p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{comment.author?.full_name || t("profile.default_user")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(comment.created_date).toLocaleString()}</p>
                  </div>
                  {(comment.user_id === user?.id || user?.role === "admin") && (
                    <button
                      type="button"
                      onClick={() => deleteComment(comment.id)}
                      className="rounded-full bg-red-50 p-2 text-red-600 hover:bg-red-100"
                      aria-label={t("community.comment_delete")}
                      title={t("community.comment_delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Share CTA */}
        <div className="rounded-3xl bg-secondary/60 border border-border/60 p-6 text-center">
          <Sparkles className="w-7 h-7 text-accent mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{t("community.share_prompt")}</p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:scale-105 transition-transform"
          >
            <ChefHat className="w-4 h-4" /> {t("nav.submit")}
          </Link>
        </div>
      </div>
    </Layout>
  );
}
