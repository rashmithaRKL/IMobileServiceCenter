# Database Seed Instructions

## Overview
This document explains how to add categories and products to your Supabase database.

## Files Created

1. **`supabase/seed-data.sql`** - SQL script with all categories and example products
2. **Updated Services** - Products service now fetches categories with counts from database
3. **Updated Components** - FilterSidebar and ShopPage now load data from database

## How to Add Data to Database

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/seed-data.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the script

### Option 2: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db reset
# Or
psql -h your-db-host -U postgres -d postgres -f supabase/seed-data.sql
```

## What Gets Added

The seed script adds:
- **60+ categories** with at least one example product each
- **100+ products** covering all major categories
- **Mobile Phones** with 20+ brands as subcategories
- Products with proper images, prices, descriptions, and specifications

## Category Structure

Categories are stored in the `products` table with the `category` field. The system automatically:
- Counts products per category
- Groups brands under "Mobile Phones" as subcategories
- Formats category names for display

## After Seeding

Once you run the seed script:
1. Categories will automatically appear in the shop sidebar
2. Product counts will be calculated from actual database data
3. Filtering will work with real products
4. All categories will have at least one example product

## Adding More Products

You can add more products through:
1. **Admin Panel** - Use the admin interface at `/admin/products`
2. **SQL** - Insert directly into the `products` table
3. **API** - Use the products service `create()` method

## Notes

- Product images use existing paths from `/public` folder
- Prices are in the format used by your system
- Categories match the exact names from your filter sidebar
- Subcategories (brands) are automatically generated for Mobile Phones

