export interface Workspace {
  id: string
  nome: string
  owner_id: string
  plano: 'free' | 'pro' | 'enterprise'
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  workspace_id: string
  nome: string
  email?: string
  avatar_url?: string
  role: 'owner' | 'member'
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ConviteLink {
  id: string
  workspace_id: string
  codigo: string
  criado_por: string
  ativo: boolean
  expires_at: string
  created_at: string
}