# Environment Variables Setup

This file explains how to set up your `.env.local` file for the e-commerce website.

## Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## How to Get These Values

### 1. Create a Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `i-mobile-ecommerce`
   - Database Password: (save this securely)
   - Region: Choose closest to your users

### 2. Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbG...`)

### 3. Add to `.env.local`

1. Create a new file named `.env.local` in the root of your project
2. Add the values you copied:

```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_key_here
```

## Important Notes

- ⚠️ **Never commit `.env.local` to git** - it's already in `.gitignore`
- ✅ The `.env.local` file is for local development
- ✅ For production deployments (Vercel, etc.), add these variables in your hosting platform's environment settings
- 🔄 After creating or modifying `.env.local`, restart your development server

## Quick Setup Checklist

- [ ] Created Supabase account
- [ ] Created Supabase project
- [ ] Copied Project URL
- [ ] Copied anon/public key
- [ ] Created `.env.local` file
- [ ] Added variables to `.env.local`
- [ ] Restarted development server

## Next Steps

After setting up the environment variables:

1. Run the database schema SQL (see `SUPABASE_SETUP.md`)
2. Create storage buckets (see `SUPABASE_SETUP.md`)
3. Start your development server: `npm run dev`

## Troubleshooting

### "Invalid API key" error
- Check your `.env.local` file has correct values
- Restart your dev server after adding env variables
- Ensure there are no extra spaces or quotes around the values

### Environment variables not loading
- Make sure the file is named exactly `.env.local` (with the dot at the start)
- Make sure it's in the root directory of your project
- Restart your development server

## Additional Resources

- See `SUPABASE_SETUP.md` for complete setup instructions
- See `QUICK_START_SUPABASE.md` for a 5-minute quick start
- See `MIGRATION_GUIDE.md` for integration help

