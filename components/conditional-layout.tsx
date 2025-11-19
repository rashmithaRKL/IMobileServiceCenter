"use client"

import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { MessageCircle } from "lucide-react"
import { motion } from "framer-motion"

// Dynamic imports for components that need ssr: false or are heavy
const PageLoadAnimation = dynamic(() => import("@/components/page-load-animation"), { ssr: false })
const ScrollToTop = dynamic(() => import("@/components/scroll-to-top"), { ssr: false })
const ScrollToTopOnNavigation = dynamic(() => import("@/components/scroll-to-top-on-navigation"), { ssr: false })
const PerformanceMonitor = dynamic(() => import("@/components/performance-monitor"), { ssr: false })
const BottomNavigation = dynamic(() => import("@/components/bottom-navigation"))

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // For admin pages, only render the children (no navbar/footer)
  if (pathname.startsWith('/admin')) {
    return <>{children}</>
  }
  
  // For regular pages, render with navbar, footer, and other client-side components
  return (
    <>
      <ScrollToTopOnNavigation />
      <PageLoadAnimation />
      <Navbar />
      <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
      <Footer />
      <ScrollToTop />
      <PerformanceMonitor />
      
      {/* Floating WhatsApp Button - Mobile Only */}
      <motion.a
        href="https://wa.me/1234567890"
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white lg:hidden"
        aria-label="Contact via WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.a>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </>
  )
}
