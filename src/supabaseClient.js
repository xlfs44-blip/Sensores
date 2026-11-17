import { createClient } from '@supabase/supabase-js'

// Etapa 3: URL del proyecto y clave publishable leídas desde variables de entorno
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)
