# Margin

Margin is a mobile-first private book club MVP built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase-ready auth/data wiring.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run the SQL in [`supabase/schema.sql`](/Users/limdy/Documents/Codex/margin/supabase/schema.sql).
4. Install dependencies with `npm install`.
5. Start the app with `npm run dev`.

If Supabase env vars are missing, the app falls back to a mock workspace so the UI and route structure remain usable.

## Route map

- `/` entry/auth
- `/groups`
- `/create-group`
- `/join`
- `/group/[groupId]`
- `/group/[groupId]/log`
- `/group/[groupId]/members`
- `/group/[groupId]/books`
- `/group/[groupId]/weekly`
- `/group/[groupId]/settings`

## Project shape

- `src/app`: routes, layouts, server actions
- `src/components`: reusable layout, UI, domain, and form components
- `src/lib`: data queries, mock data, tokens, helpers, Supabase clients, validation
- `src/proxy.ts`: Supabase SSR session refresh
- `supabase/schema.sql`: schema and RLS policies

## Notes

- The design system uses semantic tokens in [`src/app/globals.css`](/Users/limdy/Documents/Codex/margin/src/app/globals.css).
- Shared components are intended to be reused before building page-specific variants.
- Group routes are deliberately lightweight and avoid enterprise-style complexity.
