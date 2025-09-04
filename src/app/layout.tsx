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
        {/* Preload recursos críticos */}
        <link rel="preload" href="/icon-192.png" as="image" type="image/png" />
        {/* Preconnect para APIs externas */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch para Supabase */}
        <link rel="dns-prefetch" href="//nzgifjdewdfibcopolof.supabase.co" />
        {/* Silenciar avisos de preload desnecessários em desenvolvimento */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Silenciar avisos específicos de preload em desenvolvimento
              if (typeof window !== 'undefined') {
                const originalConsoleWarn = console.warn;
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('was preloaded using link preload but not used')) {
                    return; // Silenciar este aviso específico
                  }
                  originalConsoleWarn.apply(console, args);
                };
              }
            `,
          }}
        />
        {/* Service Worker registration otimizado */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && typeof window !== 'undefined') {
                // Verifica se já existe um SW registrado antes de registrar novamente
                navigator.serviceWorker.getRegistration('/sw.js').then(function(registration) {
                  if (!registration) {
                    window.addEventListener('load', () => {
                      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'all' })
                        .catch((error) => {
                          // Silenciosamente falha sem logar
                        });
                    });
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SWRConfig
            value={{
              revalidateOnFocus: false,
              revalidateOnReconnect: true,
              refreshInterval: 60000,
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
