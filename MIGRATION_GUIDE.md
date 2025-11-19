# Migration Guide: Zustand Stores → Supabase

This guide shows how to migrate from local Zustand stores to Supabase backend.

## 🔄 Migration Pattern

### Before (Zustand Store):
```typescript
const products = useProductStore(state => state.products)
const addProduct = useProductStore(state => state.addProduct)
```

### After (Supabase Service):
```typescript
import { productsService } from '@/lib/supabase/services/products'

// Fetch products
const products = await productsService.getAll()

// Add product
await productsService.create(newProduct)
```

## 📦 Store-by-Store Migration

### 1. Products Store → Supabase

**Before:**
```typescript
const { products, addProduct } = useProductStore()
```

**After:**
```typescript
import { productsService } from '@/lib/supabase/services/products'
import { useEffect, useState } from 'react'

const [products, setProducts] = useState([])

useEffect(() => {
  const fetchProducts = async () => {
    const data = await productsService.getAll()
    setProducts(data)
  }
  fetchProducts()
}, [])

// Add product
const handleAdd = async (product) => {
  await productsService.create(product)
  // Refresh list
  const updated = await productsService.getAll()
  setProducts(updated)
}
```

### 2. Cart Store → Supabase

**Before:**
```typescript
const { items, addToCart } = useCartStore()
```

**After:**
```typescript
import { cartService } from '@/lib/supabase/services/cart'
import { authService } from '@/lib/supabase/services/auth'

const [cartItems, setCartItems] = useState([])

useEffect(() => {
  const fetchCart = async () => {
    const user = await authService.getCurrentUser()
    if (user) {
      const items = await cartService.getCartItems(user.id)
      setCartItems(items)
    }
  }
  fetchCart()
}, [])

// Add to cart
const handleAddToCart = async (productId, quantity) => {
  const user = await authService.getCurrentUser()
  if (user) {
    await cartService.addItem(user.id, productId, quantity)
    // Refresh cart
    const updated = await cartService.getCartItems(user.id)
    setCartItems(updated)
  }
}
```

### 3. Auth Store → Supabase Auth

**Before:**
```typescript
const { user, setUser } = useAuthStore()
```

**After:**
```typescript
import { authService } from '@/lib/supabase/services/auth'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const [user, setUser] = useState(null)

useEffect(() => {
  const supabase = createClient()
  
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
  })

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null)
    }
  )

  return () => subscription.unsubscribe()
}, [])

// Sign in
const handleSignIn = async (email, password) => {
  const { user } = await authService.signIn(email, password)
  setUser(user)
}

// Sign out
const handleSignOut = async () => {
  await authService.signOut()
  setUser(null)
}
```

### 4. Orders Store → Supabase

**Before:**
```typescript
const { orders } = useOrderStore()
```

**After:**
```typescript
import { ordersService } from '@/lib/supabase/services/orders'

// Get orders
const orders = await ordersService.getByUserId(userId)

// Create order
const order = await ordersService.create({
  order_number: await ordersService.generateOrderNumber(),
  user_id: userId,
  customer_name: formData.name,
  customer_email: formData.email,
  // ... other fields
}, orderItems)
```

### 5. Messages Store → Supabase

**Before:**
```typescript
const { messages } = useMessageStore()
```

**After:**
```typescript
import { messagesService } from '@/lib/supabase/services/messages'

// Get all messages (admin)
const messages = await messagesService.getAll()

// Create message (contact form)
await messagesService.create({
  name: formData.name,
  email: formData.email,
  subject: formData.subject,
  message: formData.message,
})
```

## 🎯 Example: Updated Sign In Page

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/supabase/services/auth"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { user } = await authService.signIn(email, password)
      
      // Get user profile
      const profile = await authService.getProfile(user.id)
      
      // Store in context or state
      // Then redirect
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  // ... rest of component
}
```

## 🎯 Example: Updated Product Page

```typescript
"use client"

import { useEffect, useState } from "react"
import { productsService } from "@/lib/supabase/services/products"

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsService.getAll()
        setProducts(data)
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // ... rest of component
}
```

## 🔒 Authentication Context (Recommended)

Create a context to manage auth state:

```typescript
// contexts/AuthContext.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

const AuthContext = createContext<{
  user: User | null
  loading: boolean
}>({ user: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

## 📝 Notes

1. **Keep Zustand for UI State**: You can still use Zustand for client-side UI state that doesn't need persistence
2. **Cache Data**: Consider using React Query or SWR for better caching and data management
3. **Real-time Updates**: Use Supabase real-time subscriptions for live updates
4. **Error Handling**: Always wrap Supabase calls in try-catch blocks
5. **Loading States**: Show loading states while fetching data
6. **Optimistic Updates**: Update UI optimistically before server confirms

## ✅ Checklist

- [ ] Set up Supabase project
- [ ] Run database schema
- [ ] Create storage buckets
- [ ] Update environment variables
- [ ] Migrate auth to Supabase
- [ ] Migrate products to Supabase
- [ ] Migrate cart to Supabase
- [ ] Migrate orders to Supabase
- [ ] Migrate messages to Supabase
- [ ] Test all functionality
- [ ] Remove old Zustand stores (optional)
