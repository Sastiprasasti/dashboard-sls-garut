import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lifjyyfoilglhsvshxmm.supabase.co";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_iTEHan1eNkm8BtokuvXrVQ_YNj_Xtmy"; // Anon key Anda

// Simpan di global context agar tidak memicu multiple instance saat Hot Reload
const globalForSupabase = globalThis as unknown as { supabaseClientInstance: any };

export const supabase =
  globalForSupabase.supabaseClientInstance ||
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Menghindari bentrok GoTrueClient di storage browser
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabaseClientInstance = supabase;
}
