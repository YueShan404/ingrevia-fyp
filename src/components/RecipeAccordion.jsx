import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useI18n, localized } from "@/lib/i18n";
import { useFavorites } from "@/lib/favorites";
import RecipeHealthBadges from "@/components/RecipeHealthBadges";
import { computeRecipeNutritionSummary } from "@/lib/recipeHealth";
import { ChevronDown, ChefHat, Clock, Heart, ShieldCheck, Users, Minus, Plus, ArrowLeft } from "lucide-react";

const ingredientPattern = /^(\d+(?:\.\d+)?|\d+\/\d+)?\s*([a-zA-Z]+|tbsp|tsp|cup|cups|g|kg|ml|l)?\s*(.*)$/i;

function scaleAmount(value, ratio) {
  if (!value) return "";
  if (value.includes("/")) {
    const [top, bottom] = value.split("/").map(Number);
    if (!top || !bottom) return value;
    return `${((top / bottom) * ratio).toFixed(2).replace(/\.?0+$/, "")}`;
  }
  return `${(Number(value) * ratio).toFixed(2).replace(/\.?0+$/, "")}`;
}

function parseIngredient(line, ratio) {
  const match = String(line || "").trim().match(ingredientPattern);
  if (!match) return { amount: "", unit: "", name: line };
  const [, amount, unit, name] = match;
  return {
    amount: scaleAmount(amount, ratio),
    unit: unit || "",
    name: name || line,
  };
}

export default function RecipeAccordion({ recipes = [], ingredients = [] }) {
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [activePanel, setActivePanel] = useState("overview");
  const [selectedServings, setSelectedServings] = useState({});
  const activeRef = useRef(null);

  const handleToggle = (recipe) => {
    setActiveRecipeId((current) => {
      const next = current === recipe.id ? null : recipe.id;
      if (next) {
        setActivePanel("overview");
        setSelectedServings((values) => ({
          ...values,
          [recipe.id]: values[recipe.id] || recipe.servings || 2,
        }));
      }
      return next;
    });
  };

  useEffect(() => {
    if (!activeRecipeId || !activeRef.current) return;
    activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeRecipeId]);

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {recipes.map((recipe, index) => (
        <RecipeAccordionItem
          key={recipe.id}
          refEl={activeRecipeId === recipe.id ? activeRef : null}
          recipe={recipe}
          ingredients={ingredients}
          index={index}
          isOpen={activeRecipeId === recipe.id}
          activePanel={activePanel}
          servings={selectedServings[recipe.id] || recipe.servings || 2}
          onToggle={() => handleToggle(recipe)}
          onPanelChange={setActivePanel}
          onServingsChange={(value) => setSelectedServings((values) => ({ ...values, [recipe.id]: value }))}
        />
      ))}
    </div>
  );
}

const RecipeAccordionItem = memo(function RecipeAccordionItem({
  refEl,
  recipe,
  ingredients,
  index,
  isOpen,
  activePanel,
  servings,
  onToggle,
  onPanelChange,
  onServingsChange,
}) {
  const { t, lang } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const reduceMotion = useReducedMotion();
  const title = localized(recipe, "title", lang);
  const englishTitle = lang === "en" ? "" : recipe.title;
  const description = localized(recipe, "description", lang);
  const recipeIngredients = localized(recipe, "ingredients", lang) || recipe.ingredients || [];
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const panelId = `recipe-panel-${recipe.id}`;
  const headerId = `recipe-header-${recipe.id}`;
  const ratio = servings / (recipe.servings || 2);
  const nutrition = useMemo(() => computeRecipeNutritionSummary(recipe, ingredients), [recipe, ingredients]);
  const fav = isFavorite(recipe.id);
  const duration = reduceMotion ? 0 : 0.35;

  return (
    <motion.article
      ref={refEl}
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.32, delay: Math.min(index * 0.035, 0.25) }}
      className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors ${
        isOpen ? "border-primary/45 shadow-lg shadow-primary/10" : "border-border/70 hover:border-primary/30"
      }`}
    >
      <button
        id={headerId}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-[92px] w-full items-center gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4 sm:p-4"
      >
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-20 sm:w-24">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={title} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center forest-gradient">
              <ChefHat className="h-7 w-7 text-white/70" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              {t(`kitchen.cuisines.${recipe.cuisine}`)}
            </span>
            <VerifiedBadge />
          </div>
          <h3 className="line-clamp-1 font-heading text-base font-extrabold text-foreground sm:text-lg">{title}</h3>
          {englishTitle && <p className="line-clamp-1 text-xs text-muted-foreground">{englishTitle}</p>}
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {totalTime} {t("common.minutes")}</span>
            <span>{t(`kitchen.spice.${recipe.spice_level || "medium"}`)}</span>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-border/60"
          >
            <AnimatePresence mode="wait" initial={false}>
              {activePanel === "ingredients" ? (
                <IngredientPreview
                  key="ingredients"
                  recipe={recipe}
                  title={title}
                  ingredients={recipeIngredients}
                  servings={servings}
                  ratio={ratio}
                  onServingsChange={onServingsChange}
                  onBack={() => onPanelChange("overview")}
                  t={t}
                />
              ) : (
                <RecipeOverview
                  key="overview"
                  recipe={recipe}
                  title={title}
                  description={description}
                  totalTime={totalTime}
                  nutrition={nutrition}
                  fav={fav}
                  onFavorite={() => toggleFavorite(recipe.id)}
                  onIngredients={() => onPanelChange("ingredients")}
                  t={t}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
});

function RecipeOverview({ recipe, title, description, totalTime, nutrition, fav, onFavorite, onIngredients, t }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.24 }}
      className="grid gap-4 p-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
    >
      <div className="overflow-hidden rounded-2xl bg-secondary">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={title} loading="lazy" className="aspect-[4/3] h-full w-full object-cover" />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center forest-gradient">
            <ChefHat className="h-12 w-12 text-white/70" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <VerifiedBadge />
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">{t(`kitchen.cuisines.${recipe.cuisine}`)}</span>
        </div>
        <h3 className="font-heading text-xl font-extrabold text-foreground">{title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <RecipeHealthBadges recipe={recipe} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <InfoChip icon={Clock} text={`${totalTime} ${t("common.minutes")}`} />
          <InfoChip icon={Users} text={`${recipe.servings || 2} ${t("common.servings")}`} />
          <InfoChip icon={ChefHat} text={t(`kitchen.spice.${recipe.spice_level || "medium"}`)} />
        </div>
        {nutrition && (
          <div className="mt-3 rounded-2xl bg-secondary/50 p-3 text-xs text-muted-foreground">
            {t("common.nutrition")}: {Math.round(nutrition.calories || 0)} kcal, {Math.round(nutrition.protein || 0)}g {t("nutrition.protein").toLowerCase()}
          </div>
        )}
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <button type="button" onClick={onIngredients} className="min-h-11 rounded-full bg-secondary px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t("recipe_accordion.view_ingredients")}
          </button>
          <Link to={`/recipe/${recipe.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t("recipe_accordion.view_full")}
          </Link>
          <button type="button" onClick={onFavorite} aria-label={fav ? t("community.bookmark_remove") : t("community.bookmark_add")} className="min-h-11 rounded-full bg-card px-4 text-primary ring-1 ring-border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Heart className={`mx-auto h-5 w-5 ${fav ? "fill-red-500 text-red-500" : ""}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function IngredientPreview({ recipe, title, ingredients, servings, ratio, onServingsChange, onBack, t }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.24 }}
      className="p-4"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-xl font-extrabold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground" aria-live="polite">{servings} {t("common.servings")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onServingsChange(Math.max(1, servings - 1))} aria-label={t("recipe_accordion.decrease_servings")} className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-8 text-center font-heading text-2xl font-extrabold text-primary">{servings}</span>
          <button type="button" onClick={() => onServingsChange(servings + 1)} aria-label={t("recipe_accordion.increase_servings")} className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-background/70">
        {ingredients.map((line, i) => {
          const parsed = parseIngredient(line, ratio);
          return (
            <li key={`${line}-${i}`} className="grid grid-cols-[4.5rem_4rem_1fr] gap-2 p-3 text-sm">
              <span className="font-semibold text-primary">{parsed.amount || "-"}</span>
              <span className="text-muted-foreground">{parsed.unit}</span>
              <span className="min-w-0 text-foreground">{parsed.name}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold text-foreground hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="h-4 w-4" /> {t("recipe_accordion.back_overview")}
        </button>
        <Link to={`/recipe/${recipe.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {t("recipe_accordion.start_cooking")}
        </Link>
      </div>
    </motion.div>
  );
}

function InfoChip({ icon: Icon, text }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-secondary/60 px-3">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {text}
    </span>
  );
}

function VerifiedBadge() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
      <ShieldCheck className="h-3 w-3" />
      {t("recipe_accordion.verified")}
    </span>
  );
}
