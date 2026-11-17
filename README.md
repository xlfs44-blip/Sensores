# Tablero de Sensores Ambientales – PoC (Supabase + React/Vite + deck.gl + Vercel)

1. En Supabase: SQL Editor > pegar y ejecutar `db/supabase.sql` (crea la tabla y carga los 40 registros).
2. Copiar `.env.example` a `.env` y completar URL y publishable key (Project Settings > API Keys).
3. `npm install` y `npm run dev` para probar local.
4. Subir a GitHub e importar el repo en https://vercel.com. Agregar las dos variables
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en Settings > Environment Variables y desplegar.
