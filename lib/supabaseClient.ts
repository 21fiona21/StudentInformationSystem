// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wwzbeqcykvjzlwxwqert.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3emJlcWN5a3Zqemx3eHdxZXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1MzQ1MzQsImV4cCI6MjA1NzExMDUzNH0.-Tqi40tgi0Ce1TYqQP3lnBRLMrtWtSZmeiCsyKWez_g' // gekürzt

export const supabase = createClient(supabaseUrl, supabaseAnonKey)