/**
 * Mensagens padronizadas do sistema de convites
 *
 * Centraliza todas as mensagens de erro, sucesso e informação
 * usadas no fluxo de convites por link do sistema multiusuário.
 *
 * Organizado por categorias para facilitar manutenção e futuro i18n.
 */

/**
 * Mensagens de erro relacionadas a autenticação
 */
export const ERROS_AUTENTICACAO = {
  USUARIO_NAO_AUTENTICADO: 'Usuário não autenticado',
  USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado. Tente novamente após confirmar o email.',
  EMAIL_NAO_FORNECIDO: 'Usuário não autenticado e email não fornecido',
} as const

/**
 * Mensagens de erro relacionadas a permissões
 */
export const ERROS_PERMISSOES = {
  APENAS_OWNER_CRIAR: 'Apenas proprietários podem criar convites',
  APENAS_OWNER_DELETAR: 'Apenas proprietários podem deletar convites',
  APENAS_OWNER_REMOVER: 'Apenas proprietários podem remover usuários',
  APENAS_OWNER_ALTERAR_ROLE: 'Apenas proprietários podem alterar roles',
} as const

/**
 * Mensagens de erro relacionadas a convites
 */
export const ERROS_CONVITE = {
  DADOS_INVALIDOS: 'Dados inválidos',
  CODIGO_INVALIDO: 'Código inválido',
  CODIGO_INVALIDO_OU_EXPIRADO: 'Código inválido ou expirado',
  CONVITE_EXPIRADO: 'Convite expirado',
  CONVITE_NAO_ENCONTRADO: 'Convite não encontrado',
  LIMITE_EXCEDIDO: 'Limite de convites excedido',
  ERRO_CRIAR: 'Erro ao criar convite',
  ERRO_VALIDAR: 'Erro ao validar código',
  ERRO_PROCESSAR: 'Erro ao processar convite',
  ERRO_PROCESSAR_SUPORTE: 'Erro ao processar convite. Entre em contato com o suporte.',
  ERRO_DESATIVAR: 'Erro ao desativar convite',
} as const

/**
 * Mensagens de erro relacionadas a workspace
 */
export const ERROS_WORKSPACE = {
  NAO_ENCONTRADO: 'Workspace não encontrado',
  ERRO_VERIFICAR: 'Erro ao verificar workspace do usuário',
  ULTIMO_PROPRIETARIO: 'Não é possível remover o último proprietário do workspace',
  ULTIMO_PROPRIETARIO_REBAIXAR: 'Não é possível rebaixar o último proprietário do workspace',
  AUTO_REBAIXAMENTO: 'Você não pode se rebaixar sendo o único proprietário do workspace',
} as const

/**
 * Mensagens de erro relacionadas a usuários
 */
export const ERROS_USUARIO = {
  NAO_ENCONTRADO_WORKSPACE: 'Usuário não encontrado no workspace',
  NAO_ATIVO: 'Usuário não está ativo no workspace',
  ERRO_BUSCAR: 'Erro ao buscar usuário',
  ERRO_ADICIONAR: 'Erro ao adicionar usuário ao workspace',
  ERRO_REMOVER: 'Erro ao remover usuário',
  ERRO_ALTERAR_ROLE: 'Erro ao alterar role do usuário',
} as const

/**
 * Mensagens de sucesso
 */
export const MENSAGENS_SUCESSO = {
  CONVITE_CRIADO: 'Convite criado!',
  CONVITE_CRIADO_LINK_COPIADO: 'Link copiado para área de transferência',
  CONVITE_ACEITO: 'Convite aceito com sucesso',
  USUARIO_REMOVIDO: 'Usuário removido do workspace',
  ROLE_ALTERADA: 'Role alterada com sucesso',
} as const

/**
 * Mensagens informativas
 */
export const MENSAGENS_INFO = {
  USUARIO_JA_NO_WORKSPACE: 'Usuário já está no workspace',
  PROCESSANDO_CONVITE: 'Processando convite para usuário recém-criado...',
  CONVITE_DELETADO: 'Convite deletado permanentemente',
} as const

/**
 * Objeto consolidado com todas as mensagens (para compatibilidade)
 */
export const MENSAGENS_CONVITES = {
  ...ERROS_AUTENTICACAO,
  ...ERROS_PERMISSOES,
  ...ERROS_CONVITE,
  ...ERROS_WORKSPACE,
  ...ERROS_USUARIO,
  ...MENSAGENS_SUCESSO,
  ...MENSAGENS_INFO,
} as const

/**
 * Tipo derivado das mensagens de convites
 */
export type MensagemConvite = typeof MENSAGENS_CONVITES[keyof typeof MENSAGENS_CONVITES]
