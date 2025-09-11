import { supabase } from '../supabase/cliente'
import { ExportadorDados } from './exportador-dados'
import type { 
  ConfiguracaoReset,
  ResultadoReset,
  PreviewReset,
  ConfiguracaoExportacao
} from '@/tipos/backup'

export class ResetadorDados {
  private onProgresso?: (progresso: number, etapa: string) => void
  private workspaceId: string

  constructor(workspaceId: string, onProgresso?: (progresso: number, etapa: string) => void) {
    this.workspaceId = workspaceId
    this.onProgresso = onProgresso
  }

  private atualizarProgresso(progresso: number, etapa: string) {
    if (this.onProgresso) {
      this.onProgresso(progresso, etapa)
    }
  }

  private async contarRegistros(nomeTabela: string): Promise<number> {
    const { count, error } = await supabase
      .from(nomeTabela)
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw new Error(`Erro ao contar registros da tabela ${nomeTabela}: ${error.message}`)
    }

    return count || 0
  }

  private async apagarTabela(nomeTabela: string): Promise<number> {
    // Para tabelas com campo 'ativo', fazer soft delete primeiro
    const tabelasComAtivo = ['fp_categorias', 'fp_subcategorias', 'fp_contas', 'fp_formas_pagamento', 'fp_centros_custo']
    
    if (tabelasComAtivo.includes(nomeTabela)) {
      // Contar registros ativos antes de apagar
      const { count } = await supabase
        .from(nomeTabela)
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      // Apagar registros ativos
      const { error } = await supabase
        .from(nomeTabela)
        .delete()
        .eq('ativo', true)

      if (error) {
        throw new Error(`Erro ao apagar registros da tabela ${nomeTabela}: ${error.message}`)
      }

      return count || 0
    } else {
      // Para outras tabelas, apagar todos os registros
      const { count } = await supabase
        .from(nomeTabela)
        .select('*', { count: 'exact', head: true })

      const { error } = await supabase
        .from(nomeTabela)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Apaga tudo exceto ID impossível

      if (error) {
        throw new Error(`Erro ao apagar registros da tabela ${nomeTabela}: ${error.message}`)
      }

      return count || 0
    }
  }

  async gerarPreview(configuracao: ConfiguracaoReset): Promise<PreviewReset> {
    const registrosPorTabela: { [tabela: string]: number } = {}
    const tabelasSelecionadas: string[] = []
    let totalRegistros = 0

    try {
      // Mapear configuração para nomes de tabelas
      const tabelasPorConfig = {
        incluirTransacoes: 'fp_transacoes',
        incluirCategorias: 'fp_categorias',
        incluirSubcategorias: 'fp_subcategorias',
        incluirContas: 'fp_contas',
        incluirFormasPagamento: 'fp_formas_pagamento',
        incluirCentrosCusto: 'fp_centros_custo',
        incluirMetas: 'fp_metas_mensais'
      }

      // Contar registros para cada tabela selecionada
      for (const [configKey, nomeTabela] of Object.entries(tabelasPorConfig)) {
        if (configuracao[configKey as keyof ConfiguracaoReset]) {
          const count = await this.contarRegistros(nomeTabela)
          registrosPorTabela[nomeTabela] = count
          tabelasSelecionadas.push(nomeTabela)
          totalRegistros += count
        }
      }

      return {
        totalRegistros,
        registrosPorTabela,
        tabelasSelecionadas,
        ultimoBackup: new Date().toISOString()
      }

    } catch (error) {
      throw new Error(`Erro ao gerar preview: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async resetarDados(configuracao: ConfiguracaoReset): Promise<ResultadoReset> {
    const inicioTempo = Date.now()
    let nomeBackup: string | undefined
    let backupCriado = false
    const erros: string[] = []
    const advertencias: string[] = []
    const registrosApagados: { [tabela: string]: number } = {}
    let totalApagados = 0

    try {
      this.atualizarProgresso(0, 'Iniciando reset...')

      // Criar backup antes de resetar (se solicitado)
      if (configuracao.criarBackupAntes) {
        try {
          this.atualizarProgresso(10, 'Criando backup de segurança...')
          
          const exportador = new ExportadorDados(this.workspaceId)
          const configExportacao: ConfiguracaoExportacao = {
            incluirCategorias: configuracao.incluirCategorias,
            incluirSubcategorias: configuracao.incluirSubcategorias,
            incluirContas: configuracao.incluirContas,
            incluirFormasPagamento: configuracao.incluirFormasPagamento,
            incluirCentrosCusto: configuracao.incluirCentrosCusto,
            incluirTransacoes: configuracao.incluirTransacoes,
            incluirMetas: configuracao.incluirMetas
          }

          const { arquivo, resumo } = await exportador.exportarTodosDados(configExportacao)
          
          // Gerar nome único para o backup
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
          nomeBackup = `backup-pre-reset-${timestamp}.zip`
          
          // Trigger download do backup
          const url = URL.createObjectURL(arquivo)
          const a = document.createElement('a')
          a.href = url
          a.download = nomeBackup
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          backupCriado = true
          
        } catch (error) {
          const mensagem = `Falha ao criar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          advertencias.push(mensagem)
          // Continua com o reset mesmo se o backup falhar
        }
      }

      // Mapear configuração para nomes de tabelas na ordem correta (dependências)
      const tabelasParaResetar = []
      
      if (configuracao.incluirTransacoes) tabelasParaResetar.push('fp_transacoes')
      if (configuracao.incluirMetas) tabelasParaResetar.push('fp_metas_mensais')
      if (configuracao.incluirSubcategorias) tabelasParaResetar.push('fp_subcategorias')
      if (configuracao.incluirCentrosCusto) tabelasParaResetar.push('fp_centros_custo')
      if (configuracao.incluirFormasPagamento) tabelasParaResetar.push('fp_formas_pagamento')
      if (configuracao.incluirContas) tabelasParaResetar.push('fp_contas')
      if (configuracao.incluirCategorias) tabelasParaResetar.push('fp_categorias')

      const incrementoProgresso = (90 - (backupCriado ? 30 : 20)) / tabelasParaResetar.length
      let progresso = backupCriado ? 30 : 20

      // Apagar dados das tabelas selecionadas
      for (const nomeTabela of tabelasParaResetar) {
        try {
          this.atualizarProgresso(progresso, `Resetando ${nomeTabela}...`)
          
          const apagados = await this.apagarTabela(nomeTabela)
          registrosApagados[nomeTabela] = apagados
          totalApagados += apagados
          
        } catch (error) {
          const mensagem = `Erro ao resetar ${nomeTabela}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          erros.push(mensagem)
        }
        
        progresso += incrementoProgresso
      }

      this.atualizarProgresso(100, 'Reset concluído!')

      const tempoExecucao = Date.now() - inicioTempo

      return {
        sucesso: erros.length === 0,
        totalApagados,
        registrosPorTabela: registrosApagados,
        backupCriado,
        nomeBackup,
        erros,
        advertencias,
        tempoExecucao
      }

    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido'
      erros.push(`Erro geral durante reset: ${mensagem}`)
      
      const tempoExecucao = Date.now() - inicioTempo

      return {
        sucesso: false,
        totalApagados,
        registrosPorTabela: registrosApagados,
        backupCriado,
        nomeBackup,
        erros,
        advertencias,
        tempoExecucao
      }
    }
  }
}