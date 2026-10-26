# Life OS

App personal de productividad (React + Vite + Tailwind CSS v4 + Supabase).

## Ejecutar en local
```bash
pnpm install
pnpm dev        # http://localhost:5173
```
Sin credenciales de Supabase funciona en **modo local** (datos en el navegador, sin sincronización).

## Conectar Supabase
1. Crea un proyecto en https://supabase.com.
2. SQL Editor → pega y ejecuta `supabase/schema.sql`.
3. Project Settings → API: copia la *Project URL* y la clave *publishable* (o *anon*). Nunca la `service_role`.
4. `cp .env.example .env.local` y rellena los dos valores. Reinicia `pnpm dev`.

## Publicar
`pnpm build` genera `dist/`. Hay un workflow para GitHub Pages en `.github/workflows/deploy.yml`
(añade los dos valores como *Repository secrets* con los mismos nombres de `.env.example`).
