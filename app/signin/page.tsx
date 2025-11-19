"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/lib/store"
import { authService } from "@/lib/supabase/services/auth"
import { validateEmail } from "@/lib/utils/auth-validation"
import { checkSupabaseConfig } from "@/lib/utils/supabase-check"
import { toast } from "sonner"
import HCaptcha from "@hcaptcha/react-hcaptcha"

export default function SignInPage() {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY
  const enableSignInCaptcha = process.env.NEXT_PUBLIC_ENABLE_SIGNIN_CAPTCHA === "true"
  const isCaptchaConfigured = enableSignInCaptcha && Boolean(hcaptchaSiteKey && hcaptchaSiteKey !== "10000000-ffff-ffff-ffff-000000000001")

  // Check for error parameters from auth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorCode = params.get("error")
    const errorMessage = params.get("message")

    if (errorCode || errorMessage) {
      if (errorCode === "otp_expired" || errorMessage?.includes("expired")) {
        setErrors({
          general: "Your email verification link has expired. Email links are valid for 1 hour. Please sign up again to receive a new verification email.",
        })
        toast.error("Verification link expired")
      } else if (errorMessage) {
        setErrors({ general: errorMessage })
        toast.error("Authentication error")
      }

      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Validate form
    const newErrors: Record<string, string> = {}
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      toast.error("Please fix the errors in the form")
      return
    }

    // Check Supabase configuration first
    const configCheck = checkSupabaseConfig()
    if (!configCheck.isConfigured) {
      const errorMsg = `Configuration Error: ${configCheck.errors.join('. ')}. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly, then restart your development server.`
      setErrors({ general: errorMsg })
      toast.error("Configuration error - Check console for details")
      setIsLoading(false)
      console.error("=== Supabase Configuration Check Failed ===")
      console.error("Errors:", configCheck.errors)
      console.error("Details:", configCheck.details)
      console.error("URL present:", configCheck.details.urlPresent)
      console.error("Key present:", configCheck.hasKey)
      if (configCheck.url) {
        console.error("URL value (first 30 chars):", configCheck.url.substring(0, 30) + "...")
      }
      console.error("==========================================")
      console.error("\nTo fix this:")
      console.error("1. Create a .env.local file in your project root")
      console.error("2. Add your Supabase credentials:")
      console.error("   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co")
      console.error("   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here")
      console.error("3. Restart your development server (npm run dev)")
      return
    }

    console.log("Supabase configuration check passed. Attempting sign in...")

    if (isCaptchaConfigured && !captchaToken) {
      setErrors({ general: "Please complete the captcha verification" })
      toast.error("Please complete the captcha verification")
      setIsLoading(false)
      return
    }

    try {
      // Add a resilience timeout in case the network call hangs
      const timeoutDuration = 100000
      let timeoutId: NodeJS.Timeout | undefined

      console.log("Calling authService.signIn...")
      const signInPromise = authService.signIn(
        formData.email,
        formData.password,
        captchaToken || undefined
      )

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(
            `Sign-in request timed out after ${timeoutDuration / 100000}s. This usually means:\n` +
            `1) Supabase URL or anon key is incorrect,\n` +
            `2) network connectivity issues, or\n` +
            `3) the Supabase project is paused.`
          ))
        }, timeoutDuration)
      })

      const result = await Promise.race([signInPromise, timeoutPromise])
      if (timeoutId) clearTimeout(timeoutId)

      console.log("Sign-in response:", result)
      const { user, session } = result as any

      if (user && session) {
        // Fetch user profile with timeout
        try {
          const profilePromise = authService.getProfile(user.id)
          const profileTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
          )
          
          let profile = null
          try {
            profile = await Promise.race([profilePromise, profileTimeoutPromise]) as any
          } catch (profileError) {
            console.warn("Profile fetch failed or timed out, using basic user info:", profileError)
          }
          
          setUser({
            id: user.id,
            name: profile?.name || user.email?.split("@")[0] || "User",
            email: user.email || formData.email,
            whatsapp: profile?.whatsapp || "",
          })

          toast.success("Signed in successfully!")
          router.push("/")
          return
        } catch (profileError: any) {
          // If profile doesn't exist, create a basic user object
          console.warn("Failed to fetch profile, using basic info:", profileError)
          setUser({
            id: user.id,
            name: user.email?.split("@")[0] || "User",
            email: user.email || formData.email,
            whatsapp: "",
          })
          toast.success("Signed in successfully!")
          router.push("/")
          return
        }
      } else {
        // No session returned - might need email verification
        setErrors({ general: "Sign in failed. Please check your email for verification or try again." })
        toast.error("Sign in failed")
      }
    } catch (error: any) {
      console.error("=== Sign In Error ===")
      console.error("Error object:", error)
      console.error("Error message:", error?.message)
      console.error("Error code:", error?.code)
      console.error("Error status:", error?.status)
      console.error("====================")
      
      // Handle specific error cases
      if (error?.message?.includes("timeout") || error?.message?.includes("Timeout") || error?.message?.includes("timed out")) {
        const timeoutMsg = error.message || "Request timed out. This usually indicates:\n\n1. Supabase URL or API key is incorrect\n2. Network connectivity issues\n3. Supabase project is paused or inaccessible\n\nPlease verify your .env.local file and ensure your Supabase project is active."
        setErrors({ general: timeoutMsg })
        toast.error("Request timed out - Check console for details")
        console.error("\n🔍 Troubleshooting steps:")
        console.error("1. Verify your .env.local file has correct values")
        console.error("2. Check if your Supabase project is active (not paused)")
        console.error("3. Verify your Supabase URL is correct")
        console.error("4. Check your internet connection")
        console.error("5. Try accessing your Supabase project URL in a browser")
      } else if (error?.message?.includes("Invalid login credentials") || error?.message?.includes("invalid_credentials") || error?.message?.includes("Invalid credentials")) {
        setErrors({ general: "Invalid email or password. Please check your credentials and try again." })
        toast.error("Invalid email or password")
      } else if (error?.message?.includes("Email not confirmed") || error?.message?.includes("email_not_confirmed") || error?.code === "email_not_confirmed") {
        const emailNotVerifiedMsg = `Your email address has not been verified yet. Please check your inbox for the verification email and click the link to verify your account.\n\nIf you didn't receive the email:\n1. Check your spam/junk folder\n2. Wait a few minutes (emails can be delayed)\n3. Make sure you used the correct email address\n\nYou can also enter your verification code on the verification page.`
        setErrors({ general: emailNotVerifiedMsg })
        toast.error("Email verification required", {
          description: "Please check your email and verify your account",
          duration: 5000,
          action: {
            label: "Verify Email",
            onClick: () => router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
          }
        })
      } else if (error?.message?.includes("Too many requests") || error?.message?.includes("too_many_requests")) {
        setErrors({ general: "Too many login attempts. Please wait a few minutes and try again." })
        toast.error("Too many login attempts")
      } else if (error?.message?.includes("Network") || error?.message?.includes("Failed to fetch") || error?.code === "ECONNREFUSED" || error?.message?.includes("ECONNREFUSED")) {
        setErrors({ general: "Unable to connect to Supabase. Please check:\n\n1. Your internet connection\n2. Your Supabase project URL is correct\n3. Your Supabase project is not paused" })
        toast.error("Connection error")
      } else if (error?.message?.includes("environment variables") || error?.message?.includes("not configured")) {
        setErrors({ general: error.message })
        toast.error("Configuration error")
      } else {
        const errorMessage = error?.message || error?.error_description || error?.error?.message || "Failed to sign in. Please check the console for more details."
        setErrors({ general: errorMessage })
        toast.error("Sign in failed - Check console")
        console.error("Unexpected error. Full error details:", JSON.stringify(error, null, 2))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center text-white mx-auto mb-4">
            📱
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your IMobile Service Center account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-destructive font-medium">Authentication Error</p>
                  <div className="text-sm text-destructive whitespace-pre-line">{errors.general}</div>
                </div>
              </div>
              {errors.general.includes("email") && errors.general.includes("verified") && (
                <div className="flex gap-2 pt-2 border-t border-destructive/20">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/signup")}
                    className="flex-1"
                  >
                    Sign Up Again
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Clear errors and allow user to try again
                      setErrors({})
                      toast.info("You can try signing in again after verifying your email")
                    }}
                    className="flex-1"
                  >
                    Got It
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="pl-10"
                required
              />
            </div>
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span>Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          {/* hCaptcha */}
          <div className="flex justify-center">
            {isCaptchaConfigured ? (
              <HCaptcha
                sitekey={hcaptchaSiteKey!}
                onVerify={(token) => {
                  setCaptchaToken(token)
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.general
                    return next
                  })
                }}
                onExpire={() => setCaptchaToken(null)}
                onError={() => {
                  setCaptchaToken(null)
                  setErrors({ general: "Captcha verification failed. Please try again." })
                  toast.error("Captcha verification failed")
                }}
              />
            ) : null}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading || (isCaptchaConfigured && !captchaToken)}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="bg-transparent">
              Google
            </Button>
            <Button type="button" variant="outline" className="bg-transparent">
              WhatsApp
            </Button>
          </div>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
