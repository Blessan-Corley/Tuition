import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Logger } from './logger';

// Safe check: Modern React Native (SDK 50+) has native WHATWG URL support.
// Only attempt polyfill if global.URL is missing.
if (typeof global !== 'undefined' && typeof (global as any).URL === 'undefined') {
  try {
    require('react-native-url-polyfill/auto');
    Logger.info('Supabase', 'Applied react-native-url-polyfill fallback');
  } catch (err: any) {
    Logger.warn('Supabase', 'Could not apply url polyfill, relying on native runtime URL:', err?.message);
  }
}

export const DEFAULT_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ajgyovcfoaqubippqioi.supabase.co';
export const DEFAULT_SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

let cachedClient: SupabaseClient | null = null;
let currentKey = '';

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || DEFAULT_SUPABASE_URL;
  const key = customKey || DEFAULT_SUPABASE_KEY;

  if (!url || !key) {
    Logger.info(
      'Supabase',
      `Client not initialized: ${!url ? 'Missing URL' : 'Missing Publishable Anon Key'}. Running in 100% offline local storage mode.`
    );
    return null;
  }

  if (cachedClient && currentKey === key) {
    return cachedClient;
  }

  try {
    Logger.info('Supabase', `Initializing Supabase client for URL: ${url}`);
    cachedClient = createClient(url, key, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    currentKey = key;
    Logger.info('Supabase', 'Supabase client initialized successfully');
    return cachedClient;
  } catch (err: any) {
    Logger.error('Supabase', 'Failed to initialize Supabase client:', err?.message || err);
    return null;
  }
}
