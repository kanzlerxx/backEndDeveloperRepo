import dotenv from 'dotenv'
dotenv.config()

import { createClient } from '@supabase/supabase-js'

console.log("SUPABASE_URL:", process.env.SUPABASE_URL)
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "OK" : "EMPTY")

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)
