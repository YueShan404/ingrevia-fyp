# Ingrevia

Ingrevia is a React and Vite app connected to Supabase for authentication, database records, file uploads, and edge functions.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local`.
3. Fill in your Supabase project values:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_STORAGE_BUCKET=ingrevia-uploads
```

4. Run `supabase/schema.sql` in the Supabase SQL editor.
5. Create a public Supabase Storage bucket named `ingrevia-uploads`.

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

## Backend Notes

The frontend expects these Supabase tables:

- `ingredients`
- `recipes`
- `community_recipes`
- `scan_history`

The scanner and bulk import features call Supabase Edge Functions named:

- `recognizeIngredient`
- `bulkImportIngredients`
