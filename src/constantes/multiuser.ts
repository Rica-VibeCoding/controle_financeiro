export const WORKSPACE_CONFIG = {
  // Limite de usuários por workspace (futuro)
  MAX_USERS_FREE: 3,
  MAX_USERS_PRO: 10,
  MAX_USERS_ENTERPRISE: -1, // ilimitado

  // Tempo de expiração de convites
  INVITE_EXPIRY_DAYS: 7,

  // Cache keys prefixes
  CACHE_PREFIX: {
    TRANSACOES: 'transacoes',
    CATEGORIAS: 'categorias',
    CONTAS: 'contas',
    DASHBOARD: 'dashboard'
  }
}

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/esqueci-senha',
  INVITE: '/auth/register', // Convites usam a mesma tela de registro
  ONBOARDING: '/onboarding'
}

export const PROTECTED_ROUTES = [
  '/',
  '/transacoes',
  '/relatorios',
  '/configuracoes'
]

export const OWNER_ONLY_ROUTES = [
  '/configuracoes/usuarios',
  '/configuracoes/billing'
]