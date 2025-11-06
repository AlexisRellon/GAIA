/**
 * Authentication Hooks using React Query
 * 
 * Provides React Query-powered hooks for authentication operations:
 * - useUserProfile: Cached user profile with 5-min stale time
 * - useSignIn: Login mutation with automatic cache invalidation
 * - useSignOut: Logout mutation with cache clearing
 * 
 * Benefits:
 * - Automatic caching and deduplication
 * - Eliminates duplicate profile fetches
 * - Optimistic updates for better UX
 * - Built-in loading/error states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';

export type UserRole = 'master_admin' | 'validator' | 'lgu_responder' | 'citizen';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_activation';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  organization: string | null;
  department: string | null;
  position: string | null;
  last_login: string | null;
  onboarding_completed: boolean;
}

/**
 * Fetch user profile from database with schema specification
 */
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const startTime = performance.now();
  
  try {
    console.log('[useAuth] Fetching profile for user:', userId);
    
    // 5-second timeout to prevent hangs
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timeout after 5s')), 5000)
    );
    
    const fetchPromise = supabase
      .schema('gaia')
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    const duration = performance.now() - startTime;
    console.log(`[useAuth] Profile fetch took ${duration.toFixed(2)}ms`);

    if (error) {
      console.error('[useAuth] Error fetching user profile:', error);
      throw error;
    }

    console.log('[useAuth] Profile fetched successfully:', data?.email);
    return data as UserProfile;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`[useAuth] Exception in fetchUserProfile after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Hook to fetch current authenticated user
 * Uses React Query for automatic caching and deduplication
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[useAuth] User retrieval error:', error.message);
        
        // Clear invalid sessions
        if (error.message.includes('session_not_found') || 
            error.message.includes('invalid') ||
            error.message.includes('JWT') ||
            error.message.includes('expired')) {
          console.warn('[useAuth] Clearing invalid session');
          await supabase.auth.signOut();
          localStorage.clear();
        }
        throw error;
      }
      
      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - profile rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    retry: 1, // Only retry once for auth errors
  });
}

/**
 * Hook to fetch user profile with React Query caching
 * Automatically deduplicates requests and caches for 5 minutes
 * 
 * @param userId - User ID to fetch profile for
 * @param enabled - Whether the query should run (default: true if userId exists)
 */
export function useUserProfile(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.profile(userId),
    queryFn: () => fetchUserProfile(userId!),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 (profile not found)
      const errorWithStatus = error as { status?: number };
      if (errorWithStatus?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook for sign-in mutation
 * Automatically invalidates and refetches user profile on success
 * Supports Cloudflare Turnstile captcha verification
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      captchaToken 
    }: { 
      email: string; 
      password: string; 
      captchaToken?: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? {
          captchaToken,
        } : undefined,
      });

      if (error) throw error;
      
      // Fetch profile to check status
      const profile = await fetchUserProfile(data.user.id);
      
      if (profile && profile.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error(`Account is ${profile.status}. Contact ICTD administrator.`);
      }
      
      return { user: data.user, profile };
    },
    onSuccess: (data) => {
      // Invalidate and refetch current user and profile
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
      queryClient.setQueryData(queryKeys.auth.profile(data.user.id), data.profile);
      console.log('[useAuth] Sign-in successful, cache updated');
    },
    onError: (error) => {
      console.error('[useAuth] Sign-in error:', error);
    },
  });
}

/**
 * Hook for sign-out mutation
 * Clears all cached data on success
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      // Clear all cached auth data
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.clear(); // Clear entire cache for security
      console.log('[useAuth] Sign-out successful, cache cleared');
    },
    onError: (error) => {
      console.error('[useAuth] Sign-out error:', error);
    },
  });
}
