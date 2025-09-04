import { supabase } from './cliente'
import { prepararTransacaoParaInsercao, validarTransacao, limparCamposUUID, corrigirTransacaoRecorrente, normalizarData } from '@/utilitarios/validacao'
import type { 
  Transacao, 
  NovaTransacao
} from '@/tipos/database'
import type {
  FiltrosTransacao,
  ParametrosPaginacao,
  RespostaPaginada
} from '@/tipos/filtros'

type TransacaoComRelacoes = Transacao & {
  categoria?: { nome: string; cor: string; icone: string }
  subcategoria?: { nome: string }
  conta?: { nome: string; tipo: string }
  conta_destino?: { nome: string; tipo: string }
  forma_pagamento?: { nome: string; tipo: string }
  centro_custo?: { nome: string; cor: string }
}

type AtualizarTransacao = Partial<NovaTransacao>

/**
 * Buscar todas as transações com filtros e paginação
 */
export async function obterTransacoes(
  filtros: FiltrosTransacao = {},
  paginacao: ParametrosPaginacao = { pagina: 1, limite: 50 },
  workspaceId: string
): Promise<RespostaPaginada<TransacaoComRelacoes>> {
  let query = supabase
    .from('fp_transacoes')
    .select(`
      *,
      categoria:categoria_id(nome, cor, icone),
      subcategoria:subcategoria_id(nome),
      conta:conta_id(nome, tipo),
      conta_destino:conta_destino_id(nome, tipo),
      forma_pagamento:forma_pagamento_id(nome, tipo),
      centro_custo:centro_custo_id(nome, cor)
    `, { count: 'exact' })

  // Aplicar filtro workspace_id (obrigatório)
  query = query.eq('workspace_id', workspaceId)

  // Aplicar filtros
  if (filtros.data_inicio) {
    query = query.gte('data', filtros.data_inicio)
  }
  if (filtros.data_fim) {
    query = query.lte('data', filtros.data_fim)
  }
  if (filtros.categoria_id) {
    query = query.eq('categoria_id', filtros.categoria_id)
  }
  if (filtros.subcategoria_id) {
    query = query.eq('subcategoria_id', filtros.subcategoria_id)
  }
  if (filtros.conta_id) {
    query = query.eq('conta_id', filtros.conta_id)
  }
  if (filtros.tipo) {
    query = query.eq('tipo', filtros.tipo)
  }
  if (filtros.status) {
    query = query.eq('status', filtros.status)
  }
  if (filtros.valor_min !== undefined) {
    query = query.gte('valor', filtros.valor_min)
  }
  if (filtros.valor_max !== undefined) {
    query = query.lte('valor', filtros.valor_max)
  }
  if (filtros.recorrente !== undefined) {
    query = query.eq('recorrente', filtros.recorrente)
  }
  if (filtros.busca) {
    query = query.ilike('descricao', `%${filtros.busca}%`)
  }

  // Aplicar paginação e ordenação
  const inicio = (paginacao.pagina - 1) * paginacao.limite
  query = query
    .order(paginacao.ordenacao || 'data', { 
      ascending: paginacao.direcao === 'asc' 
    })
    .range(inicio, inicio + paginacao.limite - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Erro ao buscar transações: ${error.message}`)

  return {
    dados: data || [],
    total: count || 0,
    pagina: paginacao.pagina,
    limite: paginacao.limite,
    total_paginas: Math.ceil((count || 0) / paginacao.limite)
  }
}

/**
 * Buscar transação por ID
 */
export async function obterTransacaoPorId(id: string, workspaceId: string): Promise<TransacaoComRelacoes | null> {
  let query = supabase
    .from('fp_transacoes')
    .select(`
      *,
      categoria:categoria_id(nome, cor, icone),
      subcategoria:subcategoria_id(nome),
      conta:conta_id(nome, tipo),
      conta_destino:conta_destino_id(nome, tipo),
      forma_pagamento:forma_pagamento_id(nome, tipo),
      centro_custo:centro_custo_id(nome, cor)
    `)
    .eq('id', id)
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query.single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Erro ao buscar transação: ${error.message}`)
  }

  return data
}

/**
 * Criar nova transação
 */
export async function criarTransacao(transacao: NovaTransacao, workspaceId: string): Promise<Transacao> {
  // Validar dados antes de inserir
  const errosValidacao = validarTransacao(transacao)
  if (errosValidacao.length > 0) {
    throw new Error(`Dados inválidos: ${errosValidacao.join(', ')}`)
  }

  // Preparar transação (limpar campos vazios para null)
  const transacaoPreparada = prepararTransacaoParaInsercao(transacao)
  
  // Adicionar workspace_id manualmente após preparação
  const transacaoComWorkspace = { ...transacaoPreparada, workspace_id: workspaceId }

  const { data, error } = await supabase
    .from('fp_transacoes')
    .insert([transacaoComWorkspace])
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar transação: ${error.message}`)
  return data
}



/**
 * Atualizar transação
 */
export async function atualizarTransacao(
  id: string, 
  atualizacoes: AtualizarTransacao,
  workspaceId: string
): Promise<void> {
  // Debug: Log dos dados recebidos
  console.log('🔍 DEBUG atualizarTransacao - dados recebidos:', atualizacoes)
  
  // Limpar campos UUID vazios antes de atualizar
  const atualizacoesLimpas = limparCamposUUID(atualizacoes)
  
  // Normalizar datas para formato ISO se necessário
  const atualizacoesNormalizadas = {
    ...atualizacoesLimpas,
    ...(atualizacoesLimpas.data && { data: normalizarData(atualizacoesLimpas.data) })
  }

  // Tratar data_vencimento especialmente para evitar erro de string vazia (mesmo fix das recorrentes)
  if (atualizacoesLimpas.data_vencimento !== undefined) {
    // Se é string vazia, pular completamente (não enviar ao banco)
    if (atualizacoesLimpas.data_vencimento === '') {
      // Não adiciona data_vencimento ao update - remove do objeto se existir
    } else {
      const dataVencimentoNormalizada = normalizarData(atualizacoesLimpas.data_vencimento)
      // Só adiciona ao update se for uma data válida (não null/undefined)
      if (dataVencimentoNormalizada !== null && dataVencimentoNormalizada !== undefined) {
        atualizacoesNormalizadas.data_vencimento = dataVencimentoNormalizada
      }
    }
  }

  // Tratar proxima_recorrencia especialmente para evitar erro de string vazia
  if (atualizacoesLimpas.proxima_recorrencia !== undefined) {
    const proximaDataNormalizada = normalizarData(atualizacoesLimpas.proxima_recorrencia)
    // Só adiciona ao update se for uma data válida (não null/undefined)
    if (proximaDataNormalizada !== null && proximaDataNormalizada !== undefined) {
      atualizacoesNormalizadas.proxima_recorrencia = proximaDataNormalizada
    }
  }
  
  console.log('🔍 DEBUG atualizarTransacao - dados normalizados:', atualizacoesNormalizadas)
  
  const { error } = await supabase
    .from('fp_transacoes')
    .update(atualizacoesNormalizadas)
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao atualizar transação: ${error.message}`)
}

/**
 * Excluir transação
 */
export async function excluirTransacao(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('fp_transacoes')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao excluir transação: ${error.message}`)
}

/**
 * Calcular saldo por conta
 */
export async function calcularSaldoConta(contaId: string, workspaceId: string): Promise<number> {
    // Receitas e despesas da conta
    const queryTransacoes = supabase
      .from('fp_transacoes')
      .select('valor, tipo')
      .eq('conta_id', contaId)
      .eq('status', 'realizado')
    
    queryTransacoes.eq('workspace_id', workspaceId)
    
    const { data: transacoes, error: errorTransacoes } = await queryTransacoes

    if (errorTransacoes) {
      throw new Error(`Erro ao calcular saldo: ${errorTransacoes.message}`)
    }

    // Transferências recebidas (conta destino)
    const queryTransferenciasRecebidas = supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('conta_destino_id', contaId)
      .eq('tipo', 'transferencia')
      .eq('status', 'realizado')
    
    queryTransferenciasRecebidas.eq('workspace_id', workspaceId)
    
    const { data: transferenciasRecebidas, error: errorRecebidas } = await queryTransferenciasRecebidas

    if (errorRecebidas) {
      throw new Error(`Erro ao calcular transferências: ${errorRecebidas.message}`)
    }

    let saldo = 0

    // Calcular receitas e despesas
    transacoes?.forEach(t => {
      if (t.tipo === 'receita') {
        saldo += t.valor
      } else if (t.tipo === 'despesa') {
        saldo -= t.valor
      } else if (t.tipo === 'transferencia') {
        saldo -= t.valor // Saída da conta origem
      }
    })

    // Adicionar transferências recebidas
    transferenciasRecebidas?.forEach(t => {
      saldo += t.valor
    })

    return saldo
  }

/**
 * Calcular saldo total de todas as contas
 */
export async function calcularSaldoTotal(workspaceId: string): Promise<number> {
  const queryContas = supabase
    .from('fp_contas')
    .select('id')
    .eq('ativo', true)
  
  queryContas.eq('workspace_id', workspaceId)
  
  const { data: contas } = await queryContas

  if (!contas) return 0

  let saldoTotal = 0
  for (const conta of contas) {
    saldoTotal += await calcularSaldoConta(conta.id, workspaceId)
  }

  return saldoTotal
}

/**
 * Criar transação parcelada (múltiplas transações)
 */
export async function criarTransacaoParcelada(
  transacaoBase: NovaTransacao,
  numeroParcelas: number,
  workspaceId: string
): Promise<Transacao[]> {
  const grupoParcelamento = Date.now() // ID único para agrupar (BIGINT)
  const valorParcela = Number((transacaoBase.valor / numeroParcelas).toFixed(2))
  
  const parcelas: NovaTransacao[] = []
  const dataBase = new Date(transacaoBase.data)
  
  for (let i = 1; i <= numeroParcelas; i++) {
    const dataParcela = new Date(dataBase)
    dataParcela.setMonth(dataParcela.getMonth() + (i - 1))
    
    // 1ª parcela: status escolhido pelo usuário, demais: sempre "previsto"
    const statusParcela = i === 1 ? transacaoBase.status : 'previsto'
    
    parcelas.push({
      ...transacaoBase,
      valor: valorParcela,
      parcela_atual: i,
      total_parcelas: numeroParcelas,
      grupo_parcelamento: grupoParcelamento,
      data: dataParcela.toISOString().split('T')[0],
      data_vencimento: dataParcela.toISOString().split('T')[0],
      status: statusParcela,
      descricao: `${transacaoBase.descricao} (${i}/${numeroParcelas})`
    })
  }

  // Preparar todas as parcelas (limpar campos UUID vazios e adicionar workspace_id)
  const parcelasPreparadas = parcelas.map(parcela => {
    const parcelaPreparada = prepararTransacaoParaInsercao(parcela)
    return { ...parcelaPreparada, workspace_id: workspaceId }
  })

  const { data, error } = await supabase
    .from('fp_transacoes')
    .insert(parcelasPreparadas)
    .select()

  if (error) throw new Error(`Erro ao criar transação parcelada: ${error.message}`)
  return data
}

/**
 * Excluir todas as parcelas de um grupo
 */
export async function excluirGrupoParcelamento(grupoParcelamento: number, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('fp_transacoes')
    .delete()
    .eq('grupo_parcelamento', grupoParcelamento)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao excluir parcelas: ${error.message}`)
}

/**
 * Buscar parcelas de um grupo
 */
export async function buscarParcelasPorGrupo(grupoParcelamento: number, workspaceId: string): Promise<Transacao[]> {
  let query = supabase
    .from('fp_transacoes')
    .select(`
      *,
      categoria:categoria_id(nome, cor, icone),
      subcategoria:subcategoria_id(nome),
      conta:conta_id(nome, tipo),
      forma_pagamento:forma_pagamento_id(nome, tipo),
      centro_custo:centro_custo_id(nome, cor)
    `)
    .eq('grupo_parcelamento', grupoParcelamento)
    .order('parcela_atual')
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar parcelas: ${error.message}`)
  return data || []
}

/**
 * Buscar transações recorrentes que precisam ser processadas
 */
export async function obterTransacoesRecorrentesVencidas(workspaceId: string): Promise<Transacao[]> {
  const hoje = new Date().toISOString().split('T')[0]
  
  let query = supabase
    .from('fp_transacoes')
    .select('*')
    .eq('recorrente', true)
    .lte('proxima_recorrencia', hoje)
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar recorrências: ${error.message}`)
  return data || []
}

/**
 * Processar recorrência - gerar próxima transação
 */
export async function processarRecorrencia(transacaoBase: Transacao, workspaceId: string): Promise<Transacao> {
  // Auto-corrigir transação recorrente com dados inconsistentes
  const transacaoCorrigida = corrigirTransacaoRecorrente(transacaoBase)
  
  if (!transacaoCorrigida.recorrente || !transacaoCorrigida.proxima_recorrencia || !transacaoCorrigida.frequencia_recorrencia) {
    throw new Error('Transação não é recorrente ou dados incompletos')
  }

  // Atualizar a transação original se foi corrigida
  if (transacaoCorrigida !== transacaoBase) {
    await atualizarTransacao(transacaoBase.id, {
      frequencia_recorrencia: transacaoCorrigida.frequencia_recorrencia,
      proxima_recorrencia: transacaoCorrigida.proxima_recorrencia
    }, workspaceId)
  }

  // Calcular próxima data baseada na proxima_recorrencia (que é a data de vencimento)
  const proximaData = calcularProximaDataRecorrencia(
    transacaoCorrigida.proxima_recorrencia!, 
    transacaoCorrigida.frequencia_recorrencia as 'diario' | 'semanal' | 'mensal' | 'anual'
  )

  // Criar nova transação recorrente (usar dados corrigidos)
  const novaTransacao: NovaTransacao = {
    data: transacaoCorrigida.proxima_recorrencia!,
    descricao: transacaoCorrigida.descricao,
    valor: transacaoCorrigida.valor,
    tipo: transacaoCorrigida.tipo,
    conta_id: transacaoCorrigida.conta_id,
    conta_destino_id: transacaoCorrigida.conta_destino_id,
    categoria_id: transacaoCorrigida.categoria_id,
    subcategoria_id: transacaoCorrigida.subcategoria_id,
    forma_pagamento_id: transacaoCorrigida.forma_pagamento_id,
    centro_custo_id: transacaoCorrigida.centro_custo_id,
    status: 'previsto', // Conforme PRD - sempre nasce previsto
    parcela_atual: 1,
    total_parcelas: 1,
    recorrente: true,
    frequencia_recorrencia: transacaoCorrigida.frequencia_recorrencia,
    proxima_recorrencia: proximaData,
    data_vencimento: proximaData, // Próxima recorrência vira data de vencimento da nova transação
    observacoes: transacaoCorrigida.observacoes
  }

  // Preparar transação (limpar campos UUID vazios)
  const transacaoPreparada = prepararTransacaoParaInsercao(novaTransacao)
  
  // Adicionar workspace_id manualmente após preparação
  const transacaoComWorkspace = { ...transacaoPreparada, workspace_id: workspaceId }

  // Inserir nova transação
  const { data, error } = await supabase
    .from('fp_transacoes')
    .insert([transacaoComWorkspace])
    .select()
    .single()

  if (error) throw new Error(`Erro ao processar recorrência: ${error.message}`)

  // Atualizar transação original com nova data de recorrência
  await supabase
    .from('fp_transacoes')
    .update({ proxima_recorrencia: proximaData })
    .eq('id', transacaoBase.id)

  return data
}

/**
 * Calcular próxima data de recorrência conforme frequência
 */
function calcularProximaDataRecorrencia(
  dataAtual: string, 
  frequencia: 'diario' | 'semanal' | 'mensal' | 'anual'
): string {
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

  return data.toISOString().split('T')[0]
}

/**
 * Excluir recorrência (hard delete da configuração)
 * Mantém transações já criadas para preservar histórico e valores
 */
export async function excluirRecorrencia(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('fp_transacoes')
    .delete()
    .eq('id', id)
    .eq('recorrente', true) // Segurança: só deleta se realmente for recorrente
    .eq('workspace_id', workspaceId)
  
  if (error) throw new Error(`Erro ao excluir recorrência: ${error.message}`)
}

/**
 * @deprecated Use excluirRecorrencia() - mantido para compatibilidade
 * Parar recorrência de uma transação (soft delete)
 */
export async function pararRecorrencia(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('fp_transacoes')
    .update({ 
      recorrente: false,
      proxima_recorrencia: null,
      frequencia_recorrencia: null
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao parar recorrência: ${error.message}`)
}

/**
 * Buscar todas as transações recorrentes ativas
 */
export async function buscarTransacoesRecorrentes(workspaceId: string): Promise<Transacao[]> {
  let query = supabase
    .from('fp_transacoes')
    .select(`
      *,
      categoria:categoria_id(nome, cor, icone),
      subcategoria:subcategoria_id(nome),
      conta:conta_id(nome, tipo, banco),
      forma_pagamento:forma_pagamento_id(nome, tipo),
      centro_custo:centro_custo_id(nome, cor)
    `)
    .eq('recorrente', true)
    .order('proxima_recorrencia')
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar transações recorrentes: ${error.message}`)
  return data || []
}

/**
 * Corrigir transações recorrentes com dados inconsistentes
 */
export async function corrigirTransacoesRecorrentesInconsistentes(workspaceId: string): Promise<void> {
  try {
    // Buscar transações recorrentes com frequência nula
    const queryInconsistentes = supabase
      .from('fp_transacoes')
      .select('*')
      .eq('recorrente', true)
      .is('frequencia_recorrencia', null)
    
    queryInconsistentes.eq('workspace_id', workspaceId)
    
    const { data: transacoesInconsistentes, error } = await queryInconsistentes

    if (error) throw new Error(`Erro ao buscar transações inconsistentes: ${error.message}`)

    if (!transacoesInconsistentes || transacoesInconsistentes.length === 0) {
      console.log('Não há transações recorrentes inconsistentes')
      return
    }

    console.log(`Encontradas ${transacoesInconsistentes.length} transações recorrentes inconsistentes`)

    // Corrigir cada transação
    for (const transacao of transacoesInconsistentes) {
      await supabase
        .from('fp_transacoes')
        .update({ 
          frequencia_recorrencia: 'mensal' // Padrão para transações sem frequência
        })
        .eq('id', transacao.id)

      console.log(`Corrigida transação recorrente: ${transacao.descricao} (${transacao.id})`)
    }

    console.log(`Corrigidas ${transacoesInconsistentes.length} transações recorrentes`)

  } catch (error) {
    console.error('Erro ao corrigir transações recorrentes:', error)
    throw error
  }
}