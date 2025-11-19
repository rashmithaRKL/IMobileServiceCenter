import { create } from "zustand"

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  condition: "new" | "used"
}

export interface User {
  id: string
  name: string
  email: string
  whatsapp: string
}

interface CartStore {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addToCart: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id)
      if (existing) {
        return {
          items: state.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i)),
        }
      }
      return { items: [...state.items, item] }
    }),
  removeFromCart: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i))
        .filter((i) => i.quantity > 0),
    })),
  clearCart: () => set({ items: [] }),
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
  },
}))

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: async () => {
    try {
      const { authService } = await import('./supabase/services/auth')
      await authService.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      set({ user: null, isAuthenticated: false })
    }
  },
  initialize: async () => {
    try {
      const { createClient } = await import('./supabase/client')
      const { authService } = await import('./supabase/services/auth')
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        try {
          const profile = await authService.getProfile(session.user.id)
          set({
            user: {
              id: session.user.id,
              name: profile?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              whatsapp: profile?.whatsapp || '',
            },
            isAuthenticated: true,
          })
        } catch (profileError) {
          // If profile doesn't exist, use basic user info
          set({
            user: {
              id: session.user.id,
              name: session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              whatsapp: '',
            },
            isAuthenticated: true,
          })
        }
      } else {
        set({ user: null, isAuthenticated: false })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ user: null, isAuthenticated: false })
    }
  },
}))
