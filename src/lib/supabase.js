import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

/** Save a lead to the blueprint_leads table. Silently fails if Supabase is not configured. */
export async function saveLead(email, blueprintData = null) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('blueprint_leads')
      .upsert({ email, blueprint_data: blueprintData, updated_at: new Date().toISOString() }, { onConflict: 'email' })
      .select()
      .single();
    if (error) console.warn('Lead save failed:', error.message);
    return data;
  } catch {
    return null;
  }
}
