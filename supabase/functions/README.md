# Supabase Edge Functions

## recognizeIngredient

The scanner frontend uploads an image to Supabase Storage, then calls this function with:

```json
{
  "image_url": "https://your-project.supabase.co/storage/v1/object/sign/ingrevia-uploads/user-id/example.jpg?token=..."
}
```

The function:

1. Loads ingredient records from Supabase.
2. Sends the image URL and ingredient catalog to OpenAI Vision.
3. Matches the returned ingredient name against the local ingredient database.
4. Returns `ingredient_name`, `confidence`, `description`, and `matched_ingredient`.

### Required Supabase secrets

Set these in Supabase before deploying:

```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set OPENAI_VISION_MODEL=gpt-4o-mini
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in hosted Supabase Edge Functions.

### Deploy

```bash
supabase functions deploy recognizeIngredient
```

## lookupFoodNutrition

This function connects Ingrevia to the official USDA FoodData Central API for live nutrition lookup.

Call it with:

```json
{
  "query": "ginger"
}
```

It returns the closest FoodData Central matches with nutrition fields that fit the `ingredients` table:

```text
calories
protein
carbs
sugar
fiber
fat
saturated_fat
sodium
potassium
```

### Required Supabase secret

Get a FoodData Central API key from:

```text
https://fdc.nal.usda.gov/api-key-signup.html
```

Then set:

```bash
supabase secrets set USDA_FDC_API_KEY=your-usda-api-key
```

Deploy:

```bash
supabase functions deploy lookupFoodNutrition
```

## bulkImportIngredients and bulkImportRecipes

These functions support the Admin Control Panel CSV import buttons.

Deploy both after creating the Supabase Storage bucket:

```bash
supabase functions deploy bulkImportIngredients
supabase functions deploy bulkImportRecipes
```

The admin panel uploads CSV files to Supabase Storage first, then sends the file URL to the matching bulk import function.
Only `shanyuew416@gmail.com` can run these import functions. Deploy them with JWT verification enabled so the function receives the logged-in Supabase user token.
