import { createClient } from '@supabase/supabase-js'

// Ganti ini dengan URL dan Anon Key dari Supabase Project kamu
const supabaseUrl = 'https://ifhmcpwplhdgiwiuwtxp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmaG1jcHdwbGhkZ2l3aXV3dHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzYzMTIsImV4cCI6MjA2OTk1MjMxMn0.NBZbkiKCpM7prOQ_29rRRwvnUd6glIH-9i8Za2cPeXw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)