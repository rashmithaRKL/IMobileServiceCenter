import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  
  // Check for error parameters
  const error = requestUrl.searchParams.get('error')
  const errorCode = requestUrl.searchParams.get('error_code')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle errors from Supabase auth
  if (error || errorCode) {
    const errorMessage = errorDescription 
      ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
      : error || 'An authentication error occurred'
    
    // Redirect to signin page with error message
    const signInUrl = new URL('/signin', requestUrl.origin)
    signInUrl.searchParams.set('error', errorCode || error || 'auth_error')
    signInUrl.searchParams.set('message', errorMessage)
    
    return NextResponse.redirect(signInUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      const signInUrl = new URL('/signin', requestUrl.origin)
      signInUrl.searchParams.set('error', exchangeError.message || 'session_error')
      signInUrl.searchParams.set('message', exchangeError.message || 'Failed to complete authentication')
      return NextResponse.redirect(signInUrl)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}

