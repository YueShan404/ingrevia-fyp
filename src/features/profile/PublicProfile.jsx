import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import IngreviaLoader from "@/components/IngreviaLoader";
import CommunityRecipeCard from "@/components/CommunityRecipeCard";
import { appApi } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Copy, UserCheck, UserPlus } from "lucide-react";

export default function PublicProfile() {
  const { publicUserId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      appApi.profiles.getPublicByPublicId(publicUserId),
      appApi.entities.CommunityRecipe.list("-created_date", 200),
    ])
      .then(async ([profileRow, recipeRows]) => {
        if (!active) return;
        setProfile(profileRow);
        setRecipes(recipeRows || []);
        if (profileRow?.id && profileRow.id !== user?.id) {
          setFollowing(await appApi.social.isFollowing(profileRow.id).catch(() => false));
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [publicUserId, user?.id]);

  const userRecipes = useMemo(
    () => recipes.filter((recipe) => recipe.user_id === profile?.id && recipe.status === "approved"),
    [recipes, profile?.id]
  );
  const canFollow = profile?.id && profile.id !== user?.id;
  const profileUrl = `${window.location.origin}/u/${publicUserId}`;

  if (loading) {
    return (
      <Layout>
        <IngreviaLoader compact message="Loading profile..." />
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="mb-4 text-muted-foreground">This community profile was not found.</p>
          <Link to="/community" className="inline-flex items-center gap-2 font-bold text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to community
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link to="/community" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to community
        </Link>

        <section className="rounded-[28px] border border-border/60 bg-card p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-[24px] object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] brand-gradient text-2xl font-black text-white">
                  {(profile.full_name || "I").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate font-heading text-3xl font-extrabold">{profile.full_name || "Ingrevia member"}</h1>
                <p className="mt-1 text-sm font-bold text-primary">@{profile.public_user_id}</p>
                <p className="mt-1 text-sm text-muted-foreground">{userRecipes.length} shared recipes</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(profileUrl)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold"
              >
                <Copy className="h-4 w-4" /> Copy link
              </button>
              {canFollow && (
                <button
                  type="button"
                  onClick={async () => {
                    if (following) {
                      await appApi.social.unfollow(profile.id);
                      setFollowing(false);
                    } else {
                      await appApi.social.follow(profile.id);
                      setFollowing(true);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                >
                  {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {following ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {userRecipes.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No approved community recipes from this member yet.
            </div>
          ) : (
            userRecipes.map((recipe, index) => <CommunityRecipeCard key={recipe.id} recipe={recipe} index={index} />)
          )}
        </section>
      </div>
    </Layout>
  );
}
