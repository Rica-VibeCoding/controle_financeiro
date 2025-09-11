// =====================================================
// TIPOS PARA SISTEMA DE PERMISSÕES GRANULARES
// Definições TypeScript para controle de funcionalidades
// =====================================================

/**
 * Interface que define todas as permissões controláveis no sistema
 * Cada propriedade representa uma funcionalidade que pode ser liberada/bloqueada
 */
export interface PermissoesUsuario {
  /** Acesso ao dashboard principal com visão geral */
  dashboard: boolean
  
  /** Acesso à aba/página de receitas */
  receitas: boolean
  
  /** Acesso à aba/página de despesas */
  despesas: boolean
  
  /** Acesso à aba/página de transações recorrentes */
  recorrentes: boolean
  
  /** Acesso à aba/página de transações previstas */
  previstas: boolean
  
  /** Acesso à página de relatórios e gráficos */
  relatorios: boolean
  
  /** Acesso às configurações do sistema */
  configuracoes: boolean
  
  /** Acesso ao cadastramento de dados base (contas, categorias, etc.) */
  cadastramentos: boolean
  
  /** Acesso ao sistema de backup e importação */
  backup: boolean
}

/**
 * Tipos específicos de permissão para verificações granulares
 */
export type TipoPermissao = keyof PermissoesUsuario

/**
 * Array com todas as chaves de permissão para iteração
 */
export const TODAS_PERMISSOES: TipoPermissao[] = [
  'dashboard',
  'receitas', 
  'despesas',
  'recorrentes',
  'previstas',
  'relatorios',
  'configuracoes',
  'cadastramentos',
  'backup'
]

/**
 * Permissões padrão para novos usuários MEMBER (todas bloqueadas)
 */
export const PERMISSOES_PADRAO_MEMBER: PermissoesUsuario = {
  dashboard: false,
  receitas: false,
  despesas: false,
  recorrentes: false,
  previstas: false,
  relatorios: false,
  configuracoes: false,
  cadastramentos: false,
  backup: false
}

/**
 * Permissões padrão para usuários OWNER (todas liberadas)
 */
export const PERMISSOES_PADRAO_OWNER: PermissoesUsuario = {
  dashboard: true,
  receitas: true,
  despesas: true,
  recorrentes: true,
  previstas: true,
  relatorios: true,
  configuracoes: true,
  cadastramentos: true,
  backup: true
}

/**
 * Mapeamento de permissões para rótulos legíveis
 */
export const ROTULOS_PERMISSOES: Record<TipoPermissao, string> = {
  dashboard: 'Dashboard',
  receitas: 'Receitas',
  despesas: 'Despesas', 
  recorrentes: 'Recorrentes',
  previstas: 'Previstas',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
  cadastramentos: 'Cadastramentos',
  backup: 'Backup'
}

/**
 * Mapeamento de permissões para ícones (compatível com sistema de ícones existente)
 */
export const ICONES_PERMISSOES: Record<TipoPermissao, string> = {
  dashboard: 'layout-dashboard',
  receitas: 'trending-up',
  despesas: 'trending-down',
  recorrentes: 'refresh-ccw',
  previstas: 'clock',
  relatorios: 'line-chart',
  configuracoes: 'settings',
  cadastramentos: 'database',
  backup: 'file-text'
}

/**
 * Mapeamento de permissões para cores (classes Tailwind)
 */
export const CORES_PERMISSOES: Record<TipoPermissao, { ativo: string; inativo: string }> = {
  dashboard: { ativo: 'text-blue-600', inativo: 'text-gray-400' },
  receitas: { ativo: 'text-green-600', inativo: 'text-gray-400' },
  despesas: { ativo: 'text-red-600', inativo: 'text-gray-400' },
  recorrentes: { ativo: 'text-purple-600', inativo: 'text-gray-400' },
  previstas: { ativo: 'text-yellow-600', inativo: 'text-gray-400' },
  relatorios: { ativo: 'text-orange-600', inativo: 'text-gray-400' },
  configuracoes: { ativo: 'text-gray-600', inativo: 'text-gray-400' },
  cadastramentos: { ativo: 'text-emerald-600', inativo: 'text-gray-400' },
  backup: { ativo: 'text-indigo-600', inativo: 'text-gray-400' }
}

/**
 * Interface para resultado de operações de atualização de permissões
 */
export interface ResultadoPermissoes {
  success: boolean
  error?: string
  permissoesAtualizadas?: PermissoesUsuario
}

/**
 * Interface para contexto de verificação de permissões
 */
export interface ContextoPermissoes {
  /** Verificar se usuário atual tem uma permissão específica */
  verificarPermissao: (permissao: TipoPermissao) => boolean
  
  /** Verificar se usuário atual é owner */
  isOwner: boolean
  
  /** Permissões do usuário atual (null se não carregado) */
  permissoesUsuario: PermissoesUsuario | null
  
  /** Atualizar permissões de um usuário (apenas owners) */
  atualizarPermissoes: (usuarioId: string, novasPermissoes: PermissoesUsuario) => Promise<ResultadoPermissoes>
}

/**
 * Tipo para props de componentes que precisam de verificação de permissão
 */
export interface PropsProtegidas {
  /** Permissão necessária para mostrar o componente */
  permissaoNecessaria: TipoPermissao
  
  /** Conteúdo a ser mostrado se não tiver permissão */
  fallback?: React.ReactNode
}

/**
 * Função helper para verificar se um objeto tem todas as chaves de permissão válidas
 */
export function validarEstruturalPermissoes(obj: any): obj is PermissoesUsuario {
  if (!obj || typeof obj !== 'object') return false
  
  return TODAS_PERMISSOES.every(permissao => 
    typeof obj[permissao] === 'boolean'
  )
}

/**
 * Função helper para contar quantas permissões estão ativas
 */
export function contarPermissoesAtivas(permissoes: PermissoesUsuario): number {
  return Object.values(permissoes).filter(Boolean).length
}

/**
 * Função helper para verificar se usuário tem pelo menos uma permissão
 */
export function temAlgumaPermissao(permissoes: PermissoesUsuario): boolean {
  return contarPermissoesAtivas(permissoes) > 0
}

/**
 * Função helper para obter array de permissões ativas
 */
export function obterPermissoesAtivas(permissoes: PermissoesUsuario): TipoPermissao[] {
  return TODAS_PERMISSOES.filter(permissao => permissoes[permissao])
}

/**
 * Função helper para obter array de permissões inativas
 */
export function obterPermissoesInativas(permissoes: PermissoesUsuario): TipoPermissao[] {
  return TODAS_PERMISSOES.filter(permissao => !permissoes[permissao])
}