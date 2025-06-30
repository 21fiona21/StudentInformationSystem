// src/lib/db.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Supabase DB-URL aus Settings
})

export default pool