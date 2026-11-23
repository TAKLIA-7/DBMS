import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Local storage overrides for settings screen
const STORAGE_KEY_URL = 'csec_supabase_url';
const STORAGE_KEY_KEY = 'csec_supabase_key';
const STORAGE_KEY_DEMO_FORCE = 'csec_force_demo_mode';

export function getStoredConfig() {
  const customUrl = localStorage.getItem(STORAGE_KEY_URL);
  const customKey = localStorage.getItem(STORAGE_KEY_KEY);
  const forceDemo = localStorage.getItem(STORAGE_KEY_DEMO_FORCE) === 'true';

  const supabaseUrl = customUrl || envUrl;
  const supabaseKey = customKey || envAnonKey;
  const isConfigured = Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));

  return {
    supabaseUrl,
    supabaseKey,
    forceDemo,
    isConfigured,
  };
}

export function saveStoredConfig(url: string, key: string, forceDemo: boolean) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url);
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (key) localStorage.setItem(STORAGE_KEY_KEY, key);
  else localStorage.removeItem(STORAGE_KEY_KEY);

  localStorage.setItem(STORAGE_KEY_DEMO_FORCE, forceDemo ? 'true' : 'false');
  resetClient();
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { supabaseUrl, supabaseKey, forceDemo, isConfigured } = getStoredConfig();
  if (forceDemo || !isConfigured) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export function resetClient() {
  supabaseInstance = null;
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; tablesFound?: string[] }> {
  try {
    const config = getStoredConfig();
    const testUrl = url || config.supabaseUrl;
    const testKey = key || config.supabaseKey;

    if (!testUrl || !testKey) {
      return { success: false, message: 'Supabase URL or Anon Key is missing.' };
    }

    const testClient = createClient(testUrl, testKey);
    // Test basic query to users table
    const { data: usersData, error: usersErr } = await testClient.from('users').select('id').limit(1);

    if (usersErr) {
      return { success: false, message: `Connected to Supabase, but query to 'users' table returned: ${usersErr.message} (Check RLS policies or tables in Supabase SQL editor).` };
    }

    return { 
      success: true, 
      message: 'Successfully connected to Supabase PostgreSQL database!',
      tablesFound: ['users', 'roles', 'cloud_accounts', 'cloud_resources', 'incidents']
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network connection failed.' };
  }
}
