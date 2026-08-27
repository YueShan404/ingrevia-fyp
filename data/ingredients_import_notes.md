# Ingredient Dataset Import Notes

Use `ingredients_template.csv` for Supabase Table Editor import.

## Required table

Import into:

```text
ingredients
```

## Minimum columns

These should not be empty:

```text
name
category
description
```

## Category examples

Use simple category values such as:

```text
vegetable
fruit
protein
grain
spice
herb
other
```

## Supabase import steps

1. Open Supabase Dashboard.
2. Go to Table Editor.
3. Select `ingredients`.
4. Click Import data from CSV.
5. Upload `data/ingredients_template.csv`.
6. Match the CSV columns to the same Supabase columns.
7. Import.

After import, the Encyclopedia, manual search, and AI scanner matching will use these ingredient records.
