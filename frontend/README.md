This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Deploy on Vercel (monorepo)

Este repo incluye `backend/` (NestJS en **Render**) y `frontend/` (esta app). En Vercel importá solo el **frontend**:

1. **New Project** → repo `STORE-GYM-BIGBOYS` → branch `main`.
2. **Root Directory:** `frontend` (obligatorio).
3. No desplegues el Nest del `backend` en Vercel; el API público es `https://store-gym-bigboys-api.onrender.com`.
4. Variables de entorno: ver [`.env.production.example`](.env.production.example) y [DOCS/vercel-new-project-checklist.md](../DOCS/vercel-new-project-checklist.md).

Archivo [vercel.json](vercel.json) fija framework Next.js y comandos de build en esta carpeta.

Más detalle: [Next.js deployment](https://nextjs.org/docs/app/building-your-application/deploying).
