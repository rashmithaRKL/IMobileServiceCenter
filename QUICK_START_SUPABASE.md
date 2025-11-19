# ⚡ Quick Start: Enhanced Supabase Backend

## 🚀 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Supabase (5 minutes)
1. Go to https://supabase.com and create account
2. Create new project
3. Copy API keys to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Step 3: Run Database Schema
1. In Supabase dashboard → SQL Editor
2. Copy content from `supabase/schema.sql`
3. Run the SQL
4. Copy content from `supabase/functions.sql`
5. Run the SQL

### Step 4: Create Storage Buckets
1. Storage → New bucket: `product-images` (public)
2. Storage → New bucket: `avatars` (public)

### Step 5: You're Done! 🎉
Start using enhanced backend immediately!

## 🎯 Quick Usage Examples

### Use Products with Real-Time
```typescript
import { useProducts } from '@/lib/supabase/hooks'

const { products, loading } = useProducts({ realtime: true })
```

### Use Cart
```typescript
import { useCart } from '@/lib/supabase/hooks'

const { cartItems, addItem, totalPrice } = useCart(true)
```

### Use Auth
```typescript
import { useAuth } from '@/lib/supabase/hooks'

const { user, signIn, signOut } = useAuth()
```

### Paginated Products
```typescript
import { usePaginatedProducts } from '@/lib/supabase/hooks'

const { products, loadMore, hasMore } = usePaginatedProducts()
```

## 📚 Full Documentation

- **Setup**: `SUPABASE_SETUP.md`
- **Migration**: `MIGRATION_GUIDE.md`
- **Features**: `supabase/enhanced-features.md`
- **Overview**: `BACKEND_OVERVIEW.md`

## 🎉 That's It!

Your backend is production-ready with:
- ✅ Real-time updates
- ✅ Auto-retry on errors
- ✅ Pagination
- ✅ Caching
- ✅ Analytics
- ✅ Security

Start building! 🚀
