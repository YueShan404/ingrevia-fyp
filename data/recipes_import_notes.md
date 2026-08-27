# Recipe Dataset Import Notes

Use `recipes_template.csv` for Supabase Table Editor import.

## Required table

Import into:

```text
recipes
```

## Important columns

The app uses these fields heavily:

```text
title
cuisine
description
ingredients
steps
prep_time
cook_time
servings
spice_level
ingredient_tags
nutrient_tags
```

## Array columns

These columns are PostgreSQL `text[]` arrays:

```text
ingredients
steps
ingredient_tags
nutrient_tags
```

The CSV uses PostgreSQL-compatible array values such as:

```text
"{""Rice"",""Chicken Breast"",""Garlic""}"
```

## Link recipes to scanner results

`ingredient_tags` should match the `ingredients.name` values exactly. Example:

```text
Chicken Breast
Rice
Garlic
Ginger
```

That is what lets a scanned ingredient open related recipes in Little Kitchen.
