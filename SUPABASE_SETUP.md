# Supabase Setup Guide for I Mobile E-commerce

This guide will help you set up Supabase as the backend for your e-commerce website.

## 📋 Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js installed on your machine
3. Basic understanding of SQL

## 🚀 Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in your project details:
   - Name: `i-mobile-ecommerce`
   - Database Password: (save this securely!)
   - Region: Choose closest to your users
4. Wait for the project to be created (takes 2-3 minutes)

## 🔑 Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbG...`)

## ⚙️ Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root (copy from `.env.local.example`)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🗄️ Step 4: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Copy the entire SQL content
4. Paste it into the SQL Editor
5. Click **Run** to execute

This will create:
- ✅ Tables (profiles, products, cart_items, orders, messages, reviews)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for auto-updating timestamps
- ✅ Function to create profiles on user signup

## 📦 Step 5: Create Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create two buckets:

### Bucket 1: `product-images`
- **Public**: ✅ Yes (uncheck "Private bucket")
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### Bucket 2: `avatars`
- **Public**: ✅ Yes
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

3. For each bucket, set up policies:
   - Go to **Policies** tab
   - Click **New Policy** → **For full customization**
   - Use these policies:

**For `product-images` bucket:**
```sql
-- Allow public read
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated users to upload (admins)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update own uploads
CREATE POLICY "Users can update own uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**For `avatars` bucket:**
```sql
-- Allow public read
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 📥 Step 6: Install Dependencies

Run in your project directory:

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase JavaScript client
- `@supabase/ssr` - Supabase SSR utilities for Next.js

## 🔐 Step 7: Set Up Admin User

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - **Email**: `imobile.admin@gmail.com`
   - **Password**: `123456` (or your preferred password)
   - **Auto Confirm User**: ✅ Yes
4. This user will have admin access based on the email check in RLS policies

## 🧪 Step 8: Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Try signing up a new user
3. Check Supabase dashboard:
   - **Authentication** → **Users** - should see new user
   - **Table Editor** → **profiles** - should see user profile
   - **Storage** - should be able to upload images

## 📚 Step 9: Generate TypeScript Types (Optional but Recommended)

For better TypeScript support:

```bash
npx supabase gen types typescript --project-id your-project-id > lib/supabase/types.ts
```

Or use the Supabase CLI:
```bash
supabase gen types typescript --project-id your-project-id > lib/supabase/types.ts
```

## 🎯 Features Included

✅ **Authentication**: Sign up, sign in, password reset
✅ **Products**: CRUD operations with images
✅ **Shopping Cart**: Persistent cart per user
✅ **Orders**: Order management with order items
✅ **Messages**: Contact form submissions
✅ **Reviews**: Product reviews system
✅ **Storage**: Image uploads for products and avatars
✅ **Row Level Security**: Secure data access
✅ **Real-time**: Can enable real-time subscriptions

## 🔧 Next Steps

1. **Update your stores** to use Supabase services (see migration guide)
2. **Add authentication** to your sign in/sign up pages
3. **Connect product pages** to Supabase database
4. **Enable real-time** for live updates
5. **Set up email templates** in Supabase dashboard

## 🆘 Troubleshooting

### "Invalid API key" error
- Check your `.env.local` file has correct keys
- Restart your dev server after adding env variables

### "relation does not exist" error
- Make sure you ran the schema SQL script
- Check all tables are created in Table Editor

### "new row violates row-level security policy" error
- Check RLS policies are correctly set up
- Verify user authentication status
- Check admin email matches exactly

### Images not uploading
- Verify storage buckets exist
- Check bucket policies are set correctly
- Ensure bucket is public (for reading)

## 📖 Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🎉 You're All Set!

Your Supabase backend is now ready. You can start using the service functions in your application!
