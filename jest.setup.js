require('@testing-library/jest-dom')

// Mock simples para evitar erros de módulos não encontrados
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  })),
}))

// Mock para next/navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useParams: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock para next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return require('react').createElement('a', { href, ...props }, children)
  }
})

// Configuração global para testes
global.console = {
  ...console,
  // Silenciar warnings desnecessários nos testes
  warn: jest.fn(),
}

// Mock globals para testes de multiusuário
global.confirm = jest.fn(() => true)
global.alert = jest.fn()

// Mock do clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
  writable: true,
})

// Mock do window.location
delete window.location
window.location = {
  href: 'http://localhost:3005',
  origin: 'http://localhost:3005',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}