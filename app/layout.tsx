import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Cairo, Geist_Mono } from "next/font/google"
import { AppProvider } from "@/lib/contexts/AppContext"
import { AuthProvider } from "@/lib/contexts/AuthContext"
import { SessionTracker } from "@/components/session-tracker"
import "./globals.css"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-cairo",
})
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Melegy - Egyptian AI Assistant",
  description: "مساعد ذكاء اصطناعي متطور يوفر لك إجابات دقيقة، بحث متقدم، وتوليد محتوى إبداعي",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/icon-512x512.png", sizes: "192x192", type: "image/png" },
      { url: "/images/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/images/icon-512x512.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/images/icon-512x512.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Melegy",
  },
  openGraph: {
    title: "Melegy - Egyptian AI Assistant",
    description: "مساعد ذكاء اصطناعي متطور يوفر لك إجابات دقيقة، بحث متقدم، وتوليد محتوى إبداعي",
    images: [
      {
        url: "/images/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Melegy - Egyptian AI Assistant",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Melegy - Egyptian AI Assistant",
    description: "مساعد ذكاء اصطناعي متطور يوفر لك إجابات دقيقة، بحث متقدم، وتوليد محتوى إبداعي",
    images: ["/icons/icon-512x512.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" className="bg-background" suppressHydrationWarning>
    <head>
        {/* Theme initialization FIRST - before any CSS loads to prevent flicker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Force light theme by default - remove dark class immediately
                document.documentElement.classList.remove('dark');
                // Only enable dark if explicitly saved in localStorage
                const saved = localStorage.getItem('theme');
                if (saved === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        
        <meta charSet="UTF-8" />
        <meta name="description" content={metadata.description || "Egyptian AI Assistant"} />
        <meta name="theme-color" content="#f8f9fa" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />

        {/* Android PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Melegy" />

        {/* iOS PWA — required for Add to Home Screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Melegy" />
        <link rel="apple-touch-icon" href="/images/icon-512x512.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/images/icon-512x512.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/images/icon-512x512.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/images/icon-512x512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/icon-512x512.png" />
        {/* iOS Splash Screens */}
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/images/icon-512x512.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/images/icon-512x512.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/images/icon-512x512.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/images/icon-512x512.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/images/icon-512x512.png" />
        <link rel="apple-touch-startup-image" href="/images/icon-512x512.png" />
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="192x192" href="/images/icon-512x512.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/images/icon-512x512.png" />
        <link rel="shortcut icon" href="/images/icon-512x512.png" />

        {/* Service Worker Registration */}
        <Script src="/register-sw.js" strategy="lazyOnload" />
        
        {/* Dynamic theme-color update when dark mode toggles */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function updateThemeColor() {
                const isDark = document.documentElement.classList.contains('dark');
                const themeColor = document.querySelector('meta[name="theme-color"]');
                if (themeColor) {
                  themeColor.setAttribute('content', isDark ? '#1a1a1a' : '#f8f9fa');
                }
              }
              
              updateThemeColor();
              const observer = new MutationObserver(updateThemeColor);
              observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            `,
          }}
        />
      </head>
      <body className={`${cairo.className} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <AppProvider>
            <SessionTracker />
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
