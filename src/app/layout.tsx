import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TransacoesProvider } from '@/contextos/transacoes-contexto'
import { ModaisProvider } from '@/contextos/modais-contexto'
import { DadosAuxiliaresProvider } from '@/contextos/dados-auxiliares-contexto'
import { SWRConfig } from 'swr'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            refreshInterval: 60000, // 1 minuto para dados financeiros
            dedupingInterval: 10000, // evita requests duplicados
            errorRetryCount: 3,
            errorRetryInterval: 5000
          }}
        >
          <DadosAuxiliaresProvider>
            <ModaisProvider>
              <TransacoesProvider>
                {children}
              </TransacoesProvider>
            </ModaisProvider>
          </DadosAuxiliaresProvider>
        </SWRConfig>
      </body>
    </html>
  );
}
