import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = "https://rantpxnpbbyujnhaggbg.supabase.co"
  const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbnRweG5wYmJ5dWpuaGFnZ2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDY5NzUsImV4cCI6MjA3NDA4Mjk3NX0.cYkqh4Z99_RF9K1pDrAvyLEeI9YZOm1IYG4uI4hOWVQ"

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
