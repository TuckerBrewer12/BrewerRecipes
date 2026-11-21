# Family Recipes

A private recipe site for the Brewer family: scan a recipe card and an AI turns it into a structured recipe, share photos of what you cooked to a family feed, and keep a log of who made what.

Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Supabase (Postgres + Storage) · Vercel AI SDK.

## How it works

- **Login** is a phone-number allowlist with no password and no SMS code. `/login` checks the number against `members` and sets a signed, httpOnly cookie that lasts a year. Removing someone on the admin page signs them out on their next request.
- **Data access** happens only on the server, through the Supabase service role key. The browser never talks to Supabase. RLS is on for every table with no policies, so the public anon key can't read anything.
- **Photos** (meal posts and original recipe scans) live in a private `photos` bucket and are shown through short-lived signed URLs. The browser shrinks them to about 2000px before uploading.
- **Scanning** sends the photos to Claude Sonnet in one call (`src/lib/ai.ts`). It returns the recipe, including which ingredients and earlier steps each step uses. Those links power the grid view. Lines the model couldn't read well come back flagged "Check" in the review form.
- **Read aloud** records in the browser, transcribes with OpenAI, then runs the same parser.

## Setup

1. **Supabase.** Create a project, then apply the schema with either the CLI:
   ```sh
   pnpm supabase link --project-ref <ref>
   pnpm supabase db push
   ```
   or by pasting `supabase/migrations/*_init.sql` into the SQL editor.
2. **Add yourself.** Edit the phone number in `supabase/seed.sql` and run it in the SQL editor. It creates you as an admin and adds one sample recipe (the espresso brownies).
3. **Environment.** `cp .env.example .env.local` and fill it in.
4. **Run it.**
   ```sh
   pnpm install
   pnpm dev
   ```
5. **Deploy.** Import the repo in Vercel and add the same environment variables. Scanning can take 15–30 seconds, so the scan and voice routes allow up to 60 seconds.

Add family members from **Admin** (avatar menu → Admin).

## Scripts

| | |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm test` | Unit tests (quantity parsing, scaling, unit conversion, grid layout) |
| `pnpm typecheck` | Route types + `tsc` |
| `pnpm lint` | ESLint |

## Layout

```
src/
  app/
    login/                 phone login
    (app)/                 everything behind login
      page.tsx             feed (home)
      recipes/             library, recipe page, new, edit
      share/               post a meal
      cook-log/            family cook log
      members/[id]/        profile + personal cook log
      admin/               members, large text, deleted recipes
    actions/               server actions
    api/scan, api/voice    photo and audio → draft recipe
  components/ui/           shadcn/ui components
  lib/
    recipe/                draft schema, quantity math, grid layout (+ tests)
    ai.ts                  model choice and the parsing prompt
    queries.ts             all reads
    auth.ts, session.ts    cookie session
  proxy.ts                 redirects signed-out visitors to /login
supabase/
  migrations/              schema
  seed.sql                 first admin + sample recipe
```

## Brand

Butter v2: stock shadcn neutrals, navy primary `#172A4D`, butter accent `#F2C14E` (used only on "I made this"). Fraunces with the soft axis turned up for recipe titles and the wordmark, Geist for everything else. Tokens are in `src/app/globals.css`. Large-text mode sets `html[data-text="large"]`, which scales the whole site to 125%.
