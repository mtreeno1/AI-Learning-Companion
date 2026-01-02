// import type React from "react"
// import type { Metadata } from "next"
// import { Inter } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
// import { AuthProvider } from "@/context/auth-context";
// import "./globals.css"

// const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "FocusFlow - AI Learning Companion",
//   description: "Your supportive AI-powered study companion with focus tracking",
//   generator: "v0.app",
//   icons: {
//     icon: [
//       {
//         url: "/icon-light-32x32.png",
//         media: "(prefers-color-scheme: light)",
//       },
//       {
//         url: "/icon-dark-32x32.png",
//         media: "(prefers-color-scheme: dark)",
//       },
//       {
//         url: "/icon.svg",
//         type: "image/svg+xml",
//       },
//     ],
//     apple: "/apple-icon.png",
//   },
// }

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode
// }>) {
//   return (
//     <html lang="en">
//       <body className={`font-sans antialiased ${inter.className}`}>
//         <AuthProvider>{children}</AuthProvider>
//         <Analytics />
//       </body>
//     </html>
//   );
// }

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata:  Metadata = {
  title:  "FocusFlow - AI Learning Companion",
  description: "AI-powered focus tracking for better learning",
}

export default function RootLayout({
  children,
}: {
  children: React. ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`font-sans antialiased ${inter.className}`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}