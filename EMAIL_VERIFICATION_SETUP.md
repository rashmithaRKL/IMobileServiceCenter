# Email Verification Setup Guide

## Issues Fixed

1. ✅ **Database Profile Creation**: Fixed trigger to handle conflicts and added immediate profile creation in signup flow
2. ✅ **Verification Code Entry Page**: Created `/verify-email` page where users can enter verification codes
3. ✅ **Signup Flow**: Updated to redirect to verification page after signup
4. ✅ **Resend Verification**: Added functionality to resend verification emails

## Supabase Configuration Required

For email verification to work properly, you need to configure Supabase:

### 1. Enable Email Confirmation

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, ensure:
   - ✅ **Enable email confirmations** is checked
   - ✅ **Enable email signup** is checked

### 2. Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the **Confirm signup** template if needed
3. The default template includes a verification link

### 3. Email Provider Setup

Supabase uses its default email provider by default. For production, consider:

- **Custom SMTP**: Configure in **Project Settings** → **Auth** → **SMTP Settings**
- **Resend**: Recommended for better deliverability
- **SendGrid**: Alternative email provider

### 4. OTP vs Magic Links

By default, Supabase sends **magic links** (clickable links) in verification emails. 

**To enable OTP codes** (6-digit codes):
1. Go to **Authentication** → **Settings**
2. Under **Email Auth**, you can configure:
   - **OTP Expiry**: How long codes are valid (default: 60 minutes)
   - **OTP Length**: Length of verification code (default: 6)

**Note**: The verification page (`/verify-email`) supports both:
- **Magic Links**: Users click the link in their email (automatically handled)
- **OTP Codes**: Users enter the 6-digit code manually

## How It Works

### Signup Flow

1. User fills out signup form
2. Account is created in Supabase `auth.users` table
3. Profile is created in `profiles` table (via trigger + immediate upsert)
4. Verification email is sent automatically by Supabase
5. User is redirected to `/verify-email` page

### Verification Options

**Option 1: Magic Link (Default)**
- User receives email with verification link
- Clicks link → Redirected to `/auth/callback` → Automatically verified

**Option 2: OTP Code**
- User receives email with 6-digit code
- Goes to `/verify-email` page
- Enters code → Verified

### Resend Verification

If user doesn't receive email:
1. Go to `/verify-email` page
2. Click "Resend Verification Code"
3. New email will be sent

## Testing

### Test Email Verification

1. Sign up with a test email
2. Check your email inbox (and spam folder)
3. You should receive a verification email
4. Either:
   - Click the link in the email, OR
   - Go to `/verify-email` and enter the code

### Troubleshooting

**No verification email received?**
- Check spam/junk folder
- Verify email confirmation is enabled in Supabase
- Check Supabase logs: **Logs** → **Auth Logs**
- Verify SMTP settings if using custom SMTP

**Profile not created?**
- Check database trigger is active: `on_auth_user_created`
- Check RLS policies allow profile creation
- Verify trigger function: `handle_new_user()`
- Check Supabase logs for errors

**Verification code not working?**
- Ensure OTP is enabled in Supabase settings
- Check code hasn't expired (default: 60 minutes)
- Verify you're using the correct email address

## Database Schema Updates

The following updates were made to ensure profile creation works:

1. **Trigger Function**: Added `ON CONFLICT` handling to prevent errors
2. **Immediate Profile Creation**: Added upsert in signup service as fallback
3. **RLS Policies**: Ensured users can insert their own profiles

Run the updated `supabase/schema.sql` in your Supabase SQL Editor to apply these changes.

