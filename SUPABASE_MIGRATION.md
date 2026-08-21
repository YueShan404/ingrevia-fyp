# Supabase migration notes

This project uses Supabase for authentication, database records, file uploads, and edge functions.

## Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_STORAGE_BUCKET`
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Create a public Storage bucket named `ingrevia-uploads`.
5. Enable Email auth and Google auth in Supabase Auth if you want both login methods.

## Data tables expected by the app

- `ingredients`
- `recipes`
- `community_recipes`
- `scan_history`

## Functions still needed

The scanner and admin import feature call Supabase Edge Functions through:

- `recognizeIngredient`
- `bulkImportIngredients`

The scanner and admin import functions still need Supabase Edge Function implementations before those features can run in production.
