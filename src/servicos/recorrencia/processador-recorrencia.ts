import { 
  obterTransacoesRecorrentesVencidas,
  processarRecorrencia
} from '@/servicos/supabase/transacoes'
import { Transacao } from '@/tipos/database'

/**
 * Serviço para processamento automático de recorrências
 * Conforme estrutura definida na documentação
 */
export class ProcessadorRecorrencia {
  
  /**
   * Processar todas as recorrências vencidas
   * Função principal do sistema de recorrência
   */
  static async processarTodasRecorrencias(workspaceId: string): Promise<{
    processadas: number,
    erros: number,
    detalhes: string[]
  }> {
    const resultado = {
      processadas: 0,
      erros: 0,
      detalhes: [] as string[]
    }

    try {
      // Buscar recorrências vencidas conforme PRD
      const recorrenciasVencidas = await obterTransacoesRecorrentesVencidas(workspaceId)
      
      if (recorrenciasVencidas.length === 0) {
        resultado.detalhes.push('Nenhuma recorrência vencida encontrada')
        return resultado
      }

      // Processar cada recorrência
      for (const transacao of recorrenciasVencidas) {
        try {
          await processarRecorrencia(transacao, workspaceId)
          resultado.processadas++
          resultado.detalhes.push(`✅ ${transacao.descricao} - ${this.formatarValor(transacao.valor)}`)
        } catch (error) {
          resultado.erros++
          const mensagem = error instanceof Error ? error.message : 'Erro desconhecido'
          resultado.detalhes.push(`❌ ${transacao.descricao} - ${mensagem}`)
        }
      }

      return resultado
    } catch (error) {
      resultado.erros++
      resultado.detalhes.push(`❌ Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      return resultado
    }
  }

  /**
   * Verificar quantas recorrências estão vencidas
   * Para exibição de notificações/alertas
   */
  static async contarRecorrenciasVencidas(workspaceId: string): Promise<number> {
    try {
      const recorrencias = await obterTransacoesRecorrentesVencidas(workspaceId)
      return recorrencias.length
    } catch (error) {
      console.error('Erro ao contar recorrências vencidas:', error)
      return 0
    }
  }

  /**
   * Validar se uma transação pode ter recorrência
   * Conforme regras do PRD
   */
  static validarTransacaoRecorrente(transacao: Partial<Transacao>): string[] {
    const erros: string[] = []

    if (!transacao.descricao) {
      erros.push('Descrição é obrigatória para transações recorrentes')
    }

    if (!transacao.valor || transacao.valor <= 0) {
      erros.push('Valor deve ser maior que zero')
    }

    if (!transacao.conta_id) {
      erros.push('Conta é obrigatória')
    }

    if (!transacao.frequencia_recorrencia) {
      erros.push('Frequência de recorrência é obrigatória')
    }

    if (!transacao.proxima_recorrencia) {
      erros.push('Data da próxima recorrência é obrigatória')
    }

    // Transferências recorrentes precisam de conta destino
    if (transacao.tipo === 'transferencia' && !transacao.conta_destino_id) {
      erros.push('Transferências recorrentes precisam de conta destino')
    }

    return erros
  }

  /**
   * Formatar valor para exibição
   */
  private static formatarValor(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  /**
   * Formatar frequência para exibição
   */
  static formatarFrequencia(freq: string): string {
    const frequencias = {
      'diario': 'Diário',
      'semanal': 'Semanal', 
      'mensal': 'Mensal',
      'anual': 'Anual'
    }
    return frequencias[freq as keyof typeof frequencias] || freq
  }

  /**
   * Calcular próxima data de execução
   * Baseado na frequência configurada
   */
  static calcularProximaExecucao(
    dataAtual: string,
    frequencia: 'diario' | 'semanal' | 'mensal' | 'anual'
  ): Date {
    const data = new Date(dataAtual)

    switch (frequencia) {
      case 'diario':
        data.setDate(data.getDate() + 1)
        break
      case 'semanal':
        data.setDate(data.getDate() + 7)
        break
      case 'mensal':
        data.setMonth(data.getMonth() + 1)
        break
      case 'anual':
        data.setFullYear(data.getFullYear() + 1)
        break
    }

    return data
  }

  /**
   * Verificar se uma data de recorrência está vencida
   */
  static isRecorrenciaVencida(proximaRecorrencia: string | null): boolean {
    if (!proximaRecorrencia) return false
    return new Date(proximaRecorrencia) <= new Date()
  }
}