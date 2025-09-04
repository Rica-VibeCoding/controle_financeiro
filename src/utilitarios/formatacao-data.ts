/**
 * Utilitários para formatação de datas no sistema
 */

/**
 * Formatar data para exibição de "última atividade"
 * Retorna texto amigável como "hoje", "ontem", "há 2 dias", etc.
 */
export function formatarUltimaAtividade(dataISO: string | null): string {
  if (!dataISO) return 'Nunca'

  const agora = new Date()
  const atividade = new Date(dataISO)
  
  // Verificar se a data é válida
  if (isNaN(atividade.getTime())) return 'Data inválida'

  const diferenca = agora.getTime() - atividade.getTime()
  const segundos = Math.floor(diferenca / 1000)
  const minutos = Math.floor(segundos / 60)
  const horas = Math.floor(minutos / 60)
  const dias = Math.floor(horas / 24)

  // Menos de 1 minuto
  if (segundos < 60) {
    return 'Agora mesmo'
  }

  // Menos de 1 hora
  if (minutos < 60) {
    return `há ${minutos} min`
  }

  // Menos de 24 horas (hoje)
  if (horas < 24) {
    // Verificar se é realmente hoje
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const atividadeData = new Date(atividade)
    atividadeData.setHours(0, 0, 0, 0)
    
    if (atividadeData.getTime() === hoje.getTime()) {
      return 'Hoje'
    } else {
      return `há ${horas}h`
    }
  }

  // Ontem
  if (dias === 1) {
    return 'Ontem'
  }

  // Até 7 dias
  if (dias <= 7) {
    return `há ${dias} dias`
  }

  // Mais de 7 dias - mostrar data formatada
  return atividade.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Determinar se usuário está inativo (mais de 30 dias sem atividade)
 */
export function isUsuarioInativo(dataISO: string | null): boolean {
  if (!dataISO) return true

  const agora = new Date()
  const atividade = new Date(dataISO)
  
  if (isNaN(atividade.getTime())) return true

  const diferenca = agora.getTime() - atividade.getTime()
  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24))

  return dias > 30
}

/**
 * Obter cor do indicador baseado na última atividade
 */
export function obterCorIndicadorAtividade(dataISO: string | null): string {
  if (!dataISO) return 'bg-gray-400' // Nunca

  const agora = new Date()
  const atividade = new Date(dataISO)
  
  if (isNaN(atividade.getTime())) return 'bg-gray-400'

  const diferenca = agora.getTime() - atividade.getTime()
  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24))

  if (dias === 0) return 'bg-green-400' // Hoje
  if (dias <= 7) return 'bg-yellow-400' // Até 1 semana
  if (dias <= 30) return 'bg-orange-400' // Até 1 mês
  return 'bg-red-400' // Mais de 1 mês
}