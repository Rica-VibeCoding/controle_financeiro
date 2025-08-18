import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TransacoesProvider } from '@/contextos/transacoes-contexto'
import { ModaisProvider } from '@/contextos/modais-contexto'
import { DadosAuxiliaresProvider } from '@/contextos/dados-auxiliares-contexto'

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
        <DadosAuxiliaresProvider>
          <ModaisProvider>
            <TransacoesProvider>
              {children}
            </TransacoesProvider>
          </ModaisProvider>
        </DadosAuxiliaresProvider>
      </body>
    </html>
  );
}
