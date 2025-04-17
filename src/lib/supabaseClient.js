import { createClient } from '@supabase/supabase-js'

// Ganti ini dengan URL dan Anon Key dari Supabase Project kamu
const supabaseUrl = 'https://kjhzutbagkubjcboxqvq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaHp1dGJhZ2t1YmpjYm94cXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NTYwODAsImV4cCI6MjA2MDQzMjA4MH0.k9pd_ZDnQGIz6NARKYkZLn7rE3v2OJOHRz2GK2HCE8k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)