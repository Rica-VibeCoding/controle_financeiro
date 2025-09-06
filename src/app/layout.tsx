import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contextos/auth-contexto'
import { TransacoesProvider } from '@/contextos/transacoes-contexto'
import { ModaisProvider } from '@/contextos/modais-contexto'
import { DadosAuxiliaresProvider } from '@/contextos/dados-auxiliares-contexto'
import { PeriodoProvider } from '@/contextos/periodo-contexto'
import { SWRConfig } from 'swr'
import { ToastProvider } from '@/contextos/toast-contexto'
import { ClientSideScripts } from '@/componentes/comum/client-side-scripts'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Controle Financeiro",
  description: "Sistema de controle financeiro pessoal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Controle Financeiro",
  },
  other: {
    "apple-mobile-web-app-status-bar-style": "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect para APIs externas */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch para Supabase */}
        <link rel="dns-prefetch" href="//nzgifjdewdfibcopolof.supabase.co" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientSideScripts />
        <AuthProvider>
          <SWRConfig
            value={{
              revalidateOnFocus: false,
              revalidateOnReconnect: false,
              refreshInterval: 0,
              dedupingInterval: 10000,
              errorRetryCount: 3,
              errorRetryInterval: 5000
            }}
          >
            <DadosAuxiliaresProvider>
              <PeriodoProvider>
                <ModaisProvider>
                  <TransacoesProvider>
                    <ToastProvider>
                      {children}
                    </ToastProvider>
                  </TransacoesProvider>
                </ModaisProvider>
              </PeriodoProvider>
            </DadosAuxiliaresProvider>
          </SWRConfig>
        </AuthProvider>
      </body>
    </html>
  );
}
