import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimizações de performance
  compress: true,

  // Resolver problema de cache de contextos React em desenvolvimento
  reactStrictMode: true,
  
  // Otimizar bundle
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@supabase/supabase-js",
      "recharts",
      "papaparse"
    ]
  },

  // Code splitting estratégico
  webpack: (config, { dev }) => {
    // Configurações mais leves para desenvolvimento
    if (dev) {
      // Manter cache padrão do Next.js para estabilidade
      config.cache = {
        type: 'filesystem',
        allowCollectingMemory: false,
      }
    }
    // Resolver problema dependências nativas
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    }

    // Ignorar módulos nativos problemáticos
    config.externals = config.externals || []
    config.externals.push({
      'lightningcss': 'lightningcss',
      '@next/swc-win32-x64-msvc': '@next/swc-win32-x64-msvc',
      '@tailwindcss/oxide': '@tailwindcss/oxide'
    })

    // TEMPORARIAMENTE REMOVIDO - Causando problemas de chunk naming em produção
    // Deixar Next.js gerenciar chunks automaticamente
    /*
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        recharts: {
          test: /[\\/]node_modules[\\/]recharts[\\/]/,
          name: 'recharts',
          chunks: 'all',
          priority: 20
        },
        supabase: {
          test: /[\\/]node_modules[\\/]@supabase[\\/]/,
          name: 'supabase',
          chunks: 'all',
          priority: 20
        }
      }
    }
    */
    return config
  },

  // Configurações de build
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Headers de segurança e performance otimizados
  async headers() {
    const isProd = process.env.NODE_ENV === 'production'
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Segurança básica
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // HSTS apenas em produção
          ...(isProd ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }] : []),
          // Cache apropriado por ambiente (menos agressivo)
          {
            key: 'Cache-Control',
            value: isProd ? 'public, max-age=3600, s-maxage=86400' : 'private, max-age=0, no-cache',
          },
        ],
      },
      // Headers específicos para rotas de API
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      // Headers para rotas de auth (segurança extra)
      {
        source: '/auth/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Headers para arquivos CSS (corrigir MIME type)
      {
        source: '/_next/static/css/(.*\\.css)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Headers para arquivos JavaScript (corrigir MIME type)
      {
        source: '/_next/static/(.*\\.js)',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Headers para assets estáticos
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// Configurações de ambiente
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Aplicando configurações de produção com segurança avançada')
} else {
  console.log('🛠️ Aplicando configurações de desenvolvimento')
}

export default nextConfig;
