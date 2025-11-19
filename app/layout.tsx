import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"
import { ThemeProvider } from "next-themes"
import ConditionalLayout from "@/components/conditional-layout"
import { AuthProvider } from "@/components/auth-provider"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IMobile Service Center - Your Perfect Smartphone",
  description: "Find your perfect smartphone at IMobile Service Center. New, used phones, accessories, and parts.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: '/imobile-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/imobile-logo.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/imobile-logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <ConditionalLayout children={children} />
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
