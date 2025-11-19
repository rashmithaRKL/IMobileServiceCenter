import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for browser/client-side usage.
 * 
 * Uses @supabase/ssr for proper cookie handling and SSR compatibility
 * with Next.js App Router middleware session refresh.
 * 
 * For server-side usage, use lib/supabase/server.ts instead.
 */
export function createClient() {
  // Get environment variables - these MUST be prefixed with NEXT_PUBLIC_
  // to be accessible in the browser
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 
      'Supabase environment variables are not configured.\n\n' +
      'Please check your .env.local file and ensure:\n' +
      '1. NEXT_PUBLIC_SUPABASE_URL is set\n' +
      '2. NEXT_PUBLIC_SUPABASE_ANON_KEY is set\n' +
      '3. You have restarted your dev server after adding/changing .env.local\n\n' +
      'Current status:\n' +
      `- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}\n` +
      `- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set' : '✗ Missing'}`
    
    console.error(errorMsg)
    throw new Error('Supabase environment variables are not configured')
  }

  try {
    // createBrowserClient from @supabase/ssr is the recommended approach
    // for Next.js App Router as it properly handles:
    // - Cookie-based authentication
    // - Middleware session refresh
    // - SSR compatibility
    // Type cast is used to avoid strict typing requirements for SSR cookies here,
    // which are not needed in the browser client.
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      // When passing custom options to createBrowserClient, @supabase/ssr expects
      // a cookies object to exist. Providing an empty object lets the library
      // fall back to document.cookie handling instead of throwing when it tries
      // to access cookies.get.
      cookies: {},
      // Extend auth cookie lifetime so users stay signed in for ~30 days
      cookieOptions: {
        // 30 days in seconds
        maxAge: 60 * 60 * 24 * 30,
      },
      db: { schema: 'public' },
      // Use the browser's native fetch; custom wrappers can break SDK internals that
      // expect standard Headers/Response behavior.
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    } as any)
  } catch (error: any) {
    console.error('Failed to create Supabase client:', error)
    throw new Error(`Failed to initialize Supabase client: ${error.message}`)
  }
}
