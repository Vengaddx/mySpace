This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment setup

This app reads Supabase credentials from environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Recommended split:

1. Local development: create `.env.development.local` and use your development Supabase project.
2. Vercel preview: set preview-specific values in Vercel if you want a separate preview database.
3. Vercel production: set production values in Vercel Project Settings for the Production environment.

Useful files in this repo:

- `.env.example`: shared variable names
- `.env.development.example`: local development template
- `.env.production.example`: production template

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed in client components.
- `NEXT_PUBLIC_SUPABASE_URL` is safe to expose to the browser, but should still point to the correct Supabase project for each environment.
- Next.js loads `.env*` files automatically. Prefer `.env.development.local` for local work instead of committing real secrets.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
