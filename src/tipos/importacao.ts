export interface TransacaoImportada {
  data: string
  valor: number
  identificador_externo: string
  descricao: string
  conta_id: string
  tipo: 'receita' | 'despesa'
  status?: 'previsto' | 'realizado' // FASE 1: Status baseado no tipo da conta
}

export interface ResultadoImportacao {
  total: number
  importadas: number
  duplicadas: number
  erros: string[]
}

// ============================================
// FASE 1 - STATUS BASEADO NO TIPO DA CONTA
// ============================================

export type TipoConta = 'conta_corrente' | 'conta_poupanca' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'investimento'

export type StatusTransacao = 'previsto' | 'realizado'

export interface ConfiguracaoStatusConta {
  tipoConta: TipoConta
  statusPadrao: StatusTransacao
  descricao: string
}

export interface ContaComStatusPadrao {
  id: string
  nome: string
  tipo: TipoConta
  statusPadrao: StatusTransacao
  descricaoStatus: string
}

// ============================================
// NOVOS TIPOS - MOTOR DE CLASSIFICAÇÃO
// ============================================

export interface DadosClassificacao {
  categoria_id: string
  subcategoria_id: string | null // Subcategoria é opcional
  forma_pagamento_id: string
  centro_custo_id?: string | null // Centro de custo é opcional
  contato_id?: string | null // Cliente vinculado (CSV Conta Simples)
}

export type TipoLancamento = 'gasto_real' | 'ajuste_contabil' | 'pagamento_credito' | 'taxa_juro'

export interface SinalizacaoLancamento {
  tipo: TipoLancamento
  icone: string
  descricao: string
  tooltip: string
}

export interface TransacaoClassificada extends TransacaoImportada {
  classificacao_automatica?: DadosClassificacao
  status_classificacao: 'reconhecida' | 'pendente' | 'duplicada'
  categoria_id?: string
  subcategoria_id?: string | null // Pode ser null (opcional)
  forma_pagamento_id?: string
  centro_custo_id?: string | null // Centro de custo opcional
  contato_id?: string | null // Cliente vinculado (CSV Conta Simples)
  formato_origem?: string // Para identificar se veio de cartão, nubank, etc.
  sinalizacao?: SinalizacaoLancamento
  selecionada?: boolean // Para controle de seleção individual
}

export interface ResumoClassificacao {
  reconhecidas: number    // Verde - já classificadas automaticamente
  pendentes: number      // Amarelo - precisam classificação manual
  duplicadas: number     // Vermelho - ignoradas (sistema atual)
}

// Para modal de classificação manual
export interface ClassificacaoManual {
  transacao: TransacaoClassificada
  dados: DadosClassificacao
}

// ============================================
// TEMPLATES DE BANCO - PRÉ-SELEÇÃO CSV
// ============================================

export interface ConfiguracaoCSV {
  separador: ',' | ';'
  encoding: 'UTF-8' | 'ISO-8859-1'
  decimal: '.' | ','
  minColunas: number
  linhasIgnorar?: number      // Número de linhas de cabeçalho para ignorar (ex: Conta Simples tem 7)
}

export interface ColunasTemplate {
  data: string[]              // Aceita variações: ['date', 'Data']
  valor?: string[]            // ['amount', 'Valor'] - Opcional se usar creditoDebito
  descricao: string[]         // ['title', 'Descrição']
  identificador?: string[]    // Opcional: ['id', 'Identificador']
  // Para bancos que separam crédito/débito (ex: Conta Simples)
  creditoDebito?: {
    credito: string[]         // ['Crédito R$']
    debito: string[]          // ['Débito R$']
  }
  // Campos extras opcionais
  observacoes?: string[]      // ['Descrição', 'Observações']
  categoria?: string[]        // ['Categoria'] - Importar se existir
  centroCusto?: string[]      // ['Centro de Custo']
  saldo?: string[]            // ['Saldo R$']
}

export interface InstrucoesTemplate {
  linkTutorial: string        // URL do help do banco
  tituloResumido: string      // Texto curto de como exportar
}

export interface ExemploCSV {
  headers: string             // "date,amount,title"
  linha1: string              // Exemplo de linha 1
  linha2: string              // Exemplo de linha 2
}

export interface TemplateBanco {
  id: string                  // Formato: banco_tipo (ex: nubank_cartao)
  nome: string                // Nome para exibição
  icone?: string              // Emoji do banco (opcional se usar iconeComponent)
  iconeComponent?: React.ComponentType<{ className?: string }>  // Componente SVG customizado
  categoria: 'cartao' | 'conta'
  colunas: ColunasTemplate
  validacao: ConfiguracaoCSV
  instrucoes: InstrucoesTemplate
  exemplo: ExemploCSV
}

export interface ResultadoValidacaoTemplate {
  valido: boolean
  erro?: string
  sugestao?: string           // Sugestão de template alternativo
}