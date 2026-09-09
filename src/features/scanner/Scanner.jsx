import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/Layout";
import { ScanLine, Upload, Camera, Search, ArrowRight, Image as ImageIcon } from "lucide-react";
import ScanResultCard from "@/components/ScanResultCard";
import IngreviaLoader from "@/components/IngreviaLoader";

const normalizeText = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const getIngredientTerms = (ingredient) =>
  [
    ingredient.name,
    ingredient.name_bm,
    ingredient.name_zh,
    ingredient.name_ta,
  ]
    .filter(Boolean)
    .map(normalizeText);

const BROAD_LABELS = new Set([
  "food",
  "ingredient",
  "vegetable",
  "leaf vegetable",
  "plant",
  "produce",
  "greens",
  "leaf",
  "natural foods",
]);

const EXTRA_ALIASES = {
  kangkung: ["water spinach", "morning glory", "chinese water spinach", "swamp cabbage", "ong choy", "kangkong"],
  cabbage: ["cabbage", "round cabbage", "green cabbage"],
  "chinese cabbage": ["chinese cabbage", "napa cabbage", "wong bok"],
  "bok choy": ["bok choy", "pak choy", "choy sum"],
  chili: ["chili", "chilli", "chile", "chili pepper", "chilli pepper", "bird's eye chili", "bird eye chili", "cayenne pepper", "red chili", "green chili", "pepper"],
  "chili pepper": ["chili", "chilli", "chile", "chili pepper", "chilli pepper", "bird's eye chili", "bird eye chili", "cayenne pepper", "red chili", "green chili", "pepper"],
};

const createScanThumbnail = (dataUrl) =>
  new Promise((resolve) => {
    if (!dataUrl?.startsWith("data:image/")) {
      resolve("");
      return;
    }
    const image = new Image();
    image.onload = () => {
      const maxSize = 180;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.65));
    };
    image.onerror = () => resolve("");
    image.src = dataUrl;
  });
const allIngredientTerms = (ingredient) => {
  const baseTerms = getIngredientTerms(ingredient);
  const aliases = baseTerms.flatMap((term) => EXTRA_ALIASES[term] || []);
  return [...new Set([...baseTerms, ...aliases.map(normalizeText)])];
};

const scoreIngredient = (ingredient, query) => {
  if (!query) return 0;
  if (BROAD_LABELS.has(query)) return 0;
  const terms = allIngredientTerms(ingredient);
  return terms.reduce((score, term) => {
    if (!term) return score;
    if (term === query) return Math.max(score, 96);
    if (term.includes(query) || query.includes(term)) return Math.max(score, 82);

    const queryWords = query.split(" ").filter((word) => word.length > 2);
    const termWords = term.split(" ").filter((word) => word.length > 2);
    const overlap = queryWords.filter((word) => termWords.includes(word)).length;
    if (overlap > 0) {
      return Math.max(score, Math.min(76, 46 + overlap * 12));
    }
    return score;
  }, 0);
};

const rankIngredientsFromDetection = (ingredients, detection) => {
  const queries = [
    detection?.ingredient_name,
    ...(detection?.common_names || []),
    detection?.detected_category,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .filter((query) => query && !BROAD_LABELS.has(query));

  return (ingredients || [])
    .map((ingredient) => ({
      ingredient,
      score: queries.reduce((best, query) => Math.max(best, scoreIngredient(ingredient, query)), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
};

const fallbackRecognize = ({ file, ingredients, imageUrl, cause }) => {
  const nameQuery = normalizeText(file?.name?.replace(/\.[^.]+$/, "") || "");
  const candidates = (ingredients || [])
    .map((ingredient) => ({
      ingredient,
      score: scoreIngredient(ingredient, nameQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const best = candidates[0];
  if (best?.score >= 65) {
    return {
      ingredient_name: best.ingredient.name,
      confidence: best.score,
      description: "AI recognition is unavailable, so Ingrevia matched this image using your ingredient catalogue.",
      matchedIngredient: best.ingredient,
      matched: true,
      image_url: imageUrl,
      fallback: true,
      suggestions: candidates.map((item) => item.ingredient),
    };
  }

  return {
    ingredient_name: "",
    confidence: 0,
    description:
      cause ||
      "AI recognition is unavailable right now. Search the ingredient name below or upload an image with a clearer file name.",
    matchedIngredient: null,
    matched: false,
    image_url: imageUrl,
    fallback: true,
    suggestions: candidates.map((item) => item.ingredient),
  };
};

export default function Scanner() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [analysisPhase, setAnalysisPhase] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Load ingredients + recipes so we can deep-link scan results to recipes
  React.useEffect(() => {
    Promise.all([
      appApi.entities.Ingredient.list(),
      appApi.entities.Recipe.list(),
    ]).then(([ings, recs]) => {
      setIngredients(ings || []);
      setRecipes(recs || []);
    }).catch(() => {});
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setAnalysisPhase("uploading");
    let previewUrl = "";
    try {
      previewUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setImagePreview(previewUrl);
    } catch {
      setResult({ error: true, description: "Unable to read this image. Please choose another image file." });
      setAnalyzing(false);
      setAnalysisPhase("");
      return;
    }

    try {
      let file_url = previewUrl;
      try {
        const uploaded = await appApi.integrations.Core.UploadFile({ file });
        file_url = uploaded.file_url;
      } catch (uploadError) {
        console.warn("Scanner upload failed; continuing with local fallback.", uploadError);
      }

      setAnalysisPhase("analyzing");
      let llmResult = null;
      let recognitionError = null;
      if (file_url && !file_url.startsWith("data:")) {
        try {
          const response = await appApi.functions.invoke("recognizeIngredient", { image_url: file_url });
          if (response.data?.error) {
            throw new Error(response.data.message || "AI recognition failed.");
          }
          llmResult = response.data;
        } catch (err) {
          recognitionError = err;
          console.warn("Scanner AI recognition failed; using catalogue fallback.", err);
        }
      }

      if (!llmResult || typeof llmResult !== "object") {
        llmResult = fallbackRecognize({
          file,
          ingredients,
          imageUrl: file_url,
          cause: recognitionError?.message,
        });
      }

      const rankedCatalogue = rankIngredientsFromDetection(ingredients, llmResult);
      const bestCatalogue = rankedCatalogue[0];
      const secondCatalogue = rankedCatalogue[1];
      const clearCatalogueMatch = Boolean(
        bestCatalogue &&
        bestCatalogue.score >= 86 &&
        (!secondCatalogue || bestCatalogue.score - secondCatalogue.score >= 8)
      );
      const fallbackMatchedIngredient = llmResult.matchedIngredient || llmResult.matched_ingredient;
      const candidateIngredient = clearCatalogueMatch ? bestCatalogue.ingredient : fallbackMatchedIngredient;
      const confidence = Math.max(Number(llmResult.confidence) || 0, clearCatalogueMatch ? bestCatalogue.score : 0);
      const matched = !!candidateIngredient && confidence >= 55 && (clearCatalogueMatch || Boolean(fallbackMatchedIngredient));
      const matchedIngredient = matched ? candidateIngredient : null;

      const scanResult = {
        ingredient_name: matched
          ? (matchedIngredient || fallbackMatchedIngredient)?.name || llmResult.ingredient_name || ""
          : llmResult.ingredient_name || "",
        confidence,
        description: llmResult.description || "",
        matchedIngredient,
        matched,
        image_url: file_url,
        fallback: Boolean(llmResult.fallback),
        source: llmResult.source || "catalogue_fallback",
        detected_category: llmResult.detected_category || "",
        common_names: llmResult.common_names || [],
        suggestions: rankedCatalogue.length ? rankedCatalogue.slice(0, 5).map((item) => item.ingredient) : llmResult.suggestions || [],
      };
      setResult(scanResult);

      // Save to scan history for the current user.
      const historyThumbnail = await createScanThumbnail(previewUrl);
      const historyName = scanResult.matchedIngredient?.name || llmResult.ingredient_name || t("scanner.not_matched");
      try {
        await appApi.scanHistory.create({
          ingredient_name: historyName,
          ingredient_id: scanResult.matched ? scanResult.matchedIngredient?.id || null : null,
          image_url: file_url && !file_url.startsWith("data:") ? file_url : "",
          image_thumbnail: historyThumbnail,
          confidence,
          matched: scanResult.matched,
        });
      } catch (historyError) {
        console.warn("Unable to save scan history.", historyError);
        toast({
          title: t("history.save_failed"),
          description: historyError?.message || t("history.save_failed_body"),
          variant: "destructive",
        });
      }
    } catch (err) {
      setResult({
        error: true,
        description: err?.message || "Recognition failed. Please try again or use manual search below.",
      });
    }
    setAnalyzing(false);
    setAnalysisPhase("");
  };

  const filteredIngredients = searchQuery
    ? ingredients.filter((i) => {
        const q = searchQuery.toLowerCase();
        return i.name?.toLowerCase().includes(q) ||
          i.name_bm?.toLowerCase().includes(q) ||
          i.name_zh?.includes(searchQuery) ||
          i.name_ta?.includes(searchQuery);
      }).slice(0, 6)
    : [];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl brand-gradient items-center justify-center mb-4 shadow-lg shadow-[hsl(18,71%,42%,0.3)]">
            <ScanLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl mb-2">{t("scanner.title")}</h1>
          <p className="text-muted-foreground">{t("scanner.subtitle")}</p>
        </div>

        {/* Upload zone */}
        {!imagePreview && (
          <div className="glass-card rounded-2xl sm:rounded-3xl border-2 border-dashed border-[hsl(18,71%,42%,0.3)] p-5 sm:p-10 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-[hsl(18,71%,42%,0.1)] flex items-center justify-center mb-5">
              <ImageIcon className="w-10 h-10 text-[hsl(126,24%,44%)]" />
            </div>
            <p className="text-muted-foreground mb-6">{t("scanner.no_image")}</p>
            <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
              <button onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full brand-gradient text-white font-semibold shadow-md hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" /> {t("scanner.upload")}
              </button>
              <button onClick={() => cameraRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-secondary text-foreground font-semibold hover:bg-secondary/70 transition-colors">
                <Camera className="w-5 h-5" /> {t("scanner.camera")}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        )}

        {/* Preview + analyzing */}
        {imagePreview && (
          <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden border border-border/50">
            <div className="relative">
              <img src={imagePreview} alt="scan" className="w-full max-h-80 object-contain bg-black/5" />
              {analyzing && (
                <div className="absolute inset-0 bg-white/88 backdrop-blur-sm flex items-center justify-center">
                  <IngreviaLoader
                    compact
                    message={analysisPhase === "uploading"
                      ? t("scanner.step_uploading")
                      : analysisPhase === "analyzing"
                        ? t("scanner.step_analyzing")
                        : t("scanner.analyzing")}
                  />
                </div>
              )}
            </div>
            {!analyzing && (
              <div className="p-4 flex justify-center">
                <button onClick={() => { setImagePreview(null); setResult(null); fileRef.current?.click(); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-foreground font-medium hover:bg-secondary/70 transition-colors">
                  <ScanLine className="w-4 h-4" /> {t("scanner.retake")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rich result panel — full ingredient details + direct recipe links */}
        <ScanResultCard result={result} recipes={recipes} />

        {/* Manual search fallback */}
        <div className="mt-8">
          <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-[hsl(126,24%,44%)]" /> {t("scanner.manual_search")}
          </h3>
          <div className="relative">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("encyclopedia.search_placeholder")}
              className="w-full px-4 py-3 pl-11 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)]" />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          {filteredIngredients.length > 0 && (
            <div className="mt-3 space-y-2">
              {filteredIngredients.map((ing) => (
                <Link key={ing.id} to={`/ingredient/${ing.id}`}
                  className="flex items-center gap-3 p-3 glass-card rounded-2xl border border-border/50 hover:shadow-md transition-all">
                  {ing.image_url && <img src={ing.image_url} alt="" className="w-10 h-10 rounded-xl object-cover" />}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{localized(ing, "name", lang)}</p>
                    <p className="text-xs text-muted-foreground">{t(`encyclopedia.categories.${ing.category}`)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
