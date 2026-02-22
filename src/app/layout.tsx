import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { InstallPrompt } from "@/components/install-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#0d9488" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "RoomManager - Gestión de Alquileres",
    template: "%s | RoomManager",
  },
  description: "Gestiona tus propiedades, habitaciones e incidencias de alquiler de forma sencilla. App PWA optimizada para móvil y escritorio.",
  keywords: ["alquiler", "habitaciones", "gestión", "propiedades", "incidencias", "inquilinos", "PWA"],
  authors: [{ name: "RoomManager" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.svg", color: "#10b981" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RoomManager",
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
  openGraph: {
    type: "website",
    siteName: "RoomManager",
    title: "RoomManager - Gestión de Alquileres",
    description: "Gestiona tus propiedades, habitaciones e incidencias de alquiler de forma sencilla",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "RoomManager Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoomManager - Gestión de Alquileres",
    description: "Gestiona tus propiedades, habitaciones e incidencias de alquiler",
    images: ["/icons/icon-512x512.png"],
  },
  applicationName: "RoomManager",
  generators: ["Next.js"],
  referrer: "origin-when-cross-origin",
  creator: "RoomManager",
  publisher: "RoomManager",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RoomManager" />
        <meta name="application-name" content="RoomManager" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Theme Colors */}
        <meta name="theme-color" content="#10b981" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0d9488" media="(prefers-color-scheme: dark)" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        
        {/* PWA Shortcuts */}
        <link rel="shortcut icon" href="/favicon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <InstallPrompt />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registrado:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('SW error:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
