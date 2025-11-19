# hCaptcha & Email Verification Setup Guide

This guide will help you configure hCaptcha verification and ensure email verification works properly in your Supabase project.

## 🔐 Part 1: hCaptcha Configuration

### Step 1: Get Your hCaptcha Site Key from Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings**
3. Scroll down to **Captcha** section
4. You should see your **hCaptcha Site Key** (it looks like: `10000000-ffff-ffff-ffff-000000000001` for test, or a real key for production)
5. Copy this site key

### Step 2: Add hCaptcha Site Key to Environment Variables

1. Open your `.env.local` file in the project root
2. Add the following line:

```env
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-hcaptcha-site-key-here
```

**Important:** 
- Do **not** leave this empty or use the public test key (`10000000-ffff-ffff-ffff-000000000001`). Supabase will reject captcha verification unless the key matches the one configured in your project settings.
- If you don't have a `.env.local` file, create one in the project root
- The key must start with `NEXT_PUBLIC_` to be accessible in the browser

### Step 3: Restart Your Development Server

After adding the environment variable, restart your Next.js development server:

```bash
npm run dev
```

### Step 4: Verify hCaptcha is Working

1. Go to the signup page (`/signup`)
2. You should see an hCaptcha widget before the "Create Account" button
3. Complete the captcha challenge
4. The submit button should become enabled after completing the captcha

## 📧 Part 2: Email Verification Configuration

### Step 1: Enable Email Confirmation in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, ensure:
   - ✅ **Enable email confirmations** is checked
   - ✅ **Enable email signup** is checked
   - ✅ **Secure email change** is checked (optional but recommended)

### Step 2: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Click on **Confirm signup** template
3. Verify the template includes:
   - A verification link: `{{ .ConfirmationURL }}`
   - Or an OTP code: `{{ .Token }}`
4. Customize the template if needed (optional)

### Step 3: Set Up Site URL (Important!)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your application URL:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
   - `http://localhost:3000/**` (for development - allows all localhost routes)
   - `https://yourdomain.com/**` (for production - allows all your domain routes)

### Step 4: Configure Email Provider (For Production)

By default, Supabase uses its built-in email service, which has limitations. For production, configure a custom SMTP:

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Choose one of these options:

**Option A: Use Resend (Recommended)**
- Sign up at [resend.com](https://resend.com)
- Get your API key
- Configure in Supabase:
  - **SMTP Host**: `smtp.resend.com`
  - **SMTP Port**: `465` (SSL) or `587` (TLS)
  - **SMTP User**: `resend`
  - **SMTP Password**: Your Resend API key
  - **Sender Email**: Your verified domain email (e.g., `noreply@yourdomain.com`)

**Option B: Use Custom SMTP**
- Use your email provider's SMTP settings
- Common providers: Gmail, SendGrid, Mailgun, etc.

**Option C: Keep Default (For Testing Only)**
- Supabase default email service works for testing
- May have deliverability issues in production
- Check spam folder if emails don't arrive

### Step 5: Enable OTP Codes (Optional)

If you want users to enter 6-digit codes instead of clicking links:

1. Go to **Authentication** → **Settings**
2. Under **Email Auth**, you can configure:
   - **OTP Expiry**: How long codes are valid (default: 60 minutes)
   - **OTP Length**: Length of verification code (default: 6)

**Note:** The app supports both methods:
- **Magic Links**: Users click the link in email (default)
- **OTP Codes**: Users enter the 6-digit code on `/verify-email` page

## 🧪 Testing Email Verification

### Test the Complete Flow

1. **Sign Up:**
   - Go to `/signup`
   - Fill out the form
   - Complete the hCaptcha challenge
   - Submit the form

2. **Check Email:**
   - Check your email inbox
   - **Also check spam/junk folder** (important!)
   - You should receive a verification email

3. **Verify Account:**
   - **Option 1:** Click the verification link in the email
   - **Option 2:** Go to `/verify-email` and enter the 6-digit code

4. **Sign In:**
   - After verification, go to `/signin`
   - Sign in with your credentials

### Troubleshooting Email Issues

**Problem: No verification email received**

1. ✅ Check spam/junk folder
2. ✅ Verify email confirmation is enabled in Supabase
3. ✅ Check Supabase logs: **Logs** → **Auth Logs** (look for email sending errors)
4. ✅ Verify Site URL and Redirect URLs are configured correctly
5. ✅ Check SMTP settings if using custom SMTP
6. ✅ Try resending from `/verify-email` page
7. ✅ Verify your email address is correct

**Problem: Verification link doesn't work**

1. ✅ Check Redirect URLs include your callback URL
2. ✅ Verify Site URL matches your application URL
3. ✅ Check browser console for errors
4. ✅ Ensure `/auth/callback` route exists (it should - it's in `app/auth/callback/route.ts`)

**Problem: hCaptcha not showing**

1. ✅ Verify `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` is set in `.env.local`
2. ✅ Restart your development server after adding the env variable
3. ✅ Check browser console for errors
4. ✅ Verify the site key is correct in Supabase dashboard

**Problem: hCaptcha verification fails**

1. ✅ Check Supabase dashboard → Authentication → Settings → Captcha
2. ✅ Verify hCaptcha is enabled
3. ✅ Check that the site key matches between Supabase and your `.env.local`
4. ✅ Try refreshing the page and completing captcha again

## 📝 Environment Variables Checklist

Make sure your `.env.local` file includes:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# hCaptcha Configuration
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-hcaptcha-site-key
```

## ✅ Verification Checklist

Before going to production, verify:

- [ ] hCaptcha widget appears on signup page
- [ ] hCaptcha verification works (no errors in console)
- [ ] Email confirmation is enabled in Supabase
- [ ] Site URL is configured correctly
- [ ] Redirect URLs include your callback URL
- [ ] Test email verification works (check inbox and spam)
- [ ] Verification link works when clicked
- [ ] OTP code entry works on `/verify-email` page
- [ ] Resend verification email works
- [ ] Users can sign in after verification

## 🔗 Related Files

- Signup page: `app/signup/page.tsx`
- Auth service: `lib/supabase/services/auth.ts`
- Verify email page: `app/verify-email/page.tsx`
- Auth callback: `app/auth/callback/route.ts`

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [hCaptcha Documentation](https://docs.hcaptcha.com/)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

