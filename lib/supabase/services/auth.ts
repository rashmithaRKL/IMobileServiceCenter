import { createClient } from '../client'

export const authService = {
  // Sign up
  async signUp(email: string, password: string, name?: string, whatsapp?: string, captchaToken?: string) {
    // Route through our server API to avoid client-side network issues
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, whatsapp }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.error || 'Signup failed')
    }

    // If signup returned a session (email confirmations disabled), set client session
    try {
      if (data?.session?.access_token && data?.session?.refresh_token) {
        const supabase = createClient()
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
      }
    } catch (setErr) {
      console.warn('Failed to set client session after signup:', setErr)
    }

    // Ensure profile is created immediately if user exists
    if (data.user) {
      try {
        console.log('Signup succeeded via server API')
      } catch (profileErr) {
        console.warn('Profile creation attempt failed (non-critical):', profileErr)
        // Don't throw - trigger should handle it
      }
    }

    // The profile is automatically created by the database trigger
    // If we have whatsapp or name, we'll update it after ensuring the profile exists
    if (data.user && (whatsapp || name)) {
      // Use a retry mechanism to update profile with exponential backoff
      const updateProfileWithRetry = async (retries = 5, initialDelay = 500) => {
        for (let i = 0; i < retries; i++) {
          try {
            // Exponential backoff: 500ms, 1000ms, 2000ms, 4000ms, 8000ms
            const delay = initialDelay * Math.pow(2, i)
            await new Promise(resolve => setTimeout(resolve, delay))
            
            // First, check if profile exists
            try {
              const existingProfile = await this.getProfile(data.user!.id)
              console.log('Profile exists, updating...', existingProfile)
            } catch (profileCheckError: any) {
              // Profile doesn't exist yet, continue waiting
              console.log(`Profile not ready yet (attempt ${i + 1}/${retries}), waiting...`)
              if (i === retries - 1) {
                console.warn('Profile was not created after signup. This might be a database trigger issue.')
                return
              }
              continue
            }
            
            // Profile exists, try to update it
            const updates: { name?: string; whatsapp?: string } = {}
            if (name) updates.name = name
            if (whatsapp) updates.whatsapp = whatsapp
            
            await this.updateProfile(data.user!.id, updates)
            console.log('Profile updated successfully with:', updates)
            return // Success, exit retry loop
          } catch (err: any) {
            console.error(`Profile update attempt ${i + 1}/${retries} failed:`, err?.message || err)
            if (i === retries - 1) {
              // Last attempt failed
              console.error('Failed to update profile after all retries. Error details:', {
                message: err?.message,
                code: err?.code,
                status: err?.status,
                details: err?.details,
                hint: err?.hint,
              })
              // Don't throw - this is not critical for signup to succeed
            }
          }
        }
      }
      
      // Don't await this - let it run in background so signup can complete
      updateProfileWithRetry().catch(err => {
        console.error('Background profile update failed:', err)
      })
    }

    return data
  },

  // Sign in
  async signIn(email: string, password: string, captchaToken?: string) {
    try {
      // Run client and server sign-in in parallel and take the first success
      const supabase = createClient()

      const clientPromise = (async () => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
      })()

      const apiPromise = (async () => {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const apiData = await res.json()
        if (!res.ok) throw new Error(apiData?.error || 'Sign in failed')
        // Mirror session to client storage
        if (apiData?.session?.access_token && apiData?.session?.refresh_token) {
          await supabase.auth.setSession({
            access_token: apiData.session.access_token,
            refresh_token: apiData.session.refresh_token,
          })
        }
        return apiData
      })()

      const timeoutMs = 25000
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Sign-in timed out')), timeoutMs)
      )

      // whichever resolves first successfully wins
      const winner = await Promise.any([clientPromise, apiPromise, timeoutPromise])
      return winner
    } catch (error: any) {
      console.error("Auth service sign in error:", error)
      console.error("Error type:", error?.constructor?.name)
      console.error("Error message:", error?.message)
      
      // Re-throw with more context if needed
      if (error?.message?.includes("Failed to fetch") || error?.message?.includes("NetworkError") || error?.code === "ECONNREFUSED") {
        const networkError = new Error("Network error: Unable to connect to Supabase. Please check:\n1. Your internet connection\n2. Your Supabase URL is correct in .env.local\n3. Your Supabase project is active (not paused)")
        networkError.name = "NetworkError"
        throw networkError
      }
      
      // If it's already a Supabase error, throw it as-is
      if (error?.status || error?.message) {
        throw error
      }
      
      // Otherwise, wrap it
      throw new Error(error?.message || "Unknown error during sign in")
    }
  },

  // Sign out
  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Get user profile
  async getProfile(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  // Update profile
  async updateProfile(userId: string, updates: {
    name?: string
    whatsapp?: string
    avatar_url?: string
  }) {
    const supabase = createClient()
    
    // First, try to get the current user to ensure we're authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user || user.id !== userId) {
      throw new Error('Unauthorized: Cannot update profile for this user')
    }

    // Try to update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId,
        updates,
      })
      
      // If profile doesn't exist, try to create it
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        console.log('Profile does not exist, creating new profile...')
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: user.email || '',
            ...updates,
          })
          .select()
          .single()
        
        if (insertError) {
          console.error('Failed to create profile:', insertError)
          throw new Error(`Failed to create profile: ${insertError.message}`)
        }
        
        return newProfile
      }
      
      throw error
    }
    
    return data
  },

  // Reset password
  async resetPassword(email: string, redirectUrl?: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl || (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : ''),
    })
    if (error) throw error
  },

  // Resend email confirmation
  async resendEmailConfirmation(email: string, captchaToken?: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        captchaToken: captchaToken || undefined,
      },
    })
    if (error) throw error
  },

  // Update password
  async updatePassword(newPassword: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  },
}
