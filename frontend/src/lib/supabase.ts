/**
 * Supabase Client Configuration
 * 
 * Initializes the Supabase client using environment variables from docker-compose.yml.
 * This singleton instance is used throughout the application for authentication,
 * database queries, and real-time subscriptions.
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables from docker-compose.yml
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in docker-compose.yml or .env file.'
  );
}

// Create Supabase client with gaia schema
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'gaia', // Use gaia schema instead of default 'public'
  },
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
