import { TemplateBanco } from '@/tipos/importacao'
import { NubankIcon } from '@/componentes/icones/NubankIcon'
import { ContaSimplesIcon } from '@/componentes/icones/ContaSimplesIcon'

/**
 * BIBLIOTECA DE TEMPLATES DE BANCO
 *
 * Cada banco tem configurações específicas de:
 * - Formato CSV (separador, encoding, decimal)
 * - Colunas esperadas
 * - Instruções de exportação
 * - Exemplo visual
 */

export const TEMPLATES_BANCOS: TemplateBanco[] = [
  // ========================================
  // NUBANK - CARTÃO DE CRÉDITO
  // ========================================
  {
    id: 'nubank_cartao',
    nome: 'Nubank - Cartão',
    icone: '💳',
    iconeComponent: NubankIcon,
    categoria: 'cartao',
    colunas: {
      data: ['date'],
      valor: ['amount'],
      descricao: ['title'],
      identificador: ['id']
    },
    validacao: {
      separador: ',',
      encoding: 'UTF-8',
      decimal: '.',
      minColunas: 3
    },
    instrucoes: {
      linkTutorial: 'https://blog.nubank.com.br/como-consultar-a-fatura-do-nubank/',
      tituloResumido: 'App Nubank > Cartão > Ver fatura > Enviar fatura (formato CSV)'
    },
    exemplo: {
      headers: 'date,amount,title',
      linha1: '2025-01-15,150.00,Uber Trip São Paulo',
      linha2: '2025-01-14,45.50,iFood - Restaurante'
    }
  },

  // ========================================
  // NUBANK - CONTA CORRENTE
  // ========================================
  {
    id: 'nubank_conta',
    nome: 'Nubank - Conta Corrente',
    icone: '🏦',
    iconeComponent: NubankIcon,
    categoria: 'conta',
    colunas: {
      data: ['Data'],
      valor: ['Valor'],
      descricao: ['Descrição', 'Descricao'],
      identificador: ['Identificador']
    },
    validacao: {
      separador: ',',
      encoding: 'UTF-8',
      decimal: '.',
      minColunas: 4
    },
    instrucoes: {
      linkTutorial: 'https://blog.nubank.com.br/extrato-nubank/',
      tituloResumido: 'App Nubank > Conta > Extrato > Exportar (escolher período)'
    },
    exemplo: {
      headers: 'Data,Valor,Identificador,Descrição',
      linha1: '15/01/2025,5000.00,ABC123,Salário',
      linha2: '14/01/2025,-150.00,DEF456,Transferência Pix'
    }
  },

  // ========================================
  // CONTA SIMPLES - CONTA EMPRESARIAL
  // ========================================
  {
    id: 'conta_simples',
    nome: 'Conta Simples - Conta Corrente',
    icone: '🏢',
    iconeComponent: ContaSimplesIcon,
    categoria: 'conta',
    colunas: {
      data: ['Data hora', 'Data', 'data'],
      descricao: ['Histórico', 'Historico', 'histórico', 'historico'],
      creditoDebito: {
        credito: ['Crédito R$', 'Credito R$', 'Crédito', 'Credito'],
        debito: ['Débito R$', 'Debito R$', 'Débito', 'Debito']
      },
      // Colunas extras disponíveis
      observacoes: ['Descrição', 'Descricao', 'descrição', 'descricao'],
      categoria: ['Categoria', 'categoria'],
      centroCusto: ['Centro de Custo', 'Centro de custo', 'centro de custo'],
      saldo: ['Saldo R$', 'Saldo', 'saldo'],
      identificador: ['CPF/CNPJ Origem/Destino', 'CPF/CNPJ', 'Documento']
    },
    validacao: {
      separador: ';',
      encoding: 'UTF-8',
      decimal: ',',
      minColunas: 8,
      linhasIgnorar: 7 // Ignora cabeçalho empresarial (linhas 1-7)
    },
    instrucoes: {
      linkTutorial: 'https://contasimples.com/',
      tituloResumido: 'Sistema Conta Simples > Extrato > Exportar (Excel) > Converter para CSV'
    },
    exemplo: {
      headers: 'Data hora;Histórico;Crédito R$;Débito R$;Saldo R$;Descrição;Categoria',
      linha1: '08/10/2025 16:20:00;PIX Enviado;;15000;132652,59;Fornecedor;Compras',
      linha2: '07/10/2025 13:35:00;Recebimento PIX;30000;;147652,59;Cliente;Vendas'
    }
  },

  // ========================================
  // GENÉRICO - FALLBACK
  // ========================================
  {
    id: 'generico',
    nome: 'CSV Genérico (qualquer banco)',
    icone: '📊',
    categoria: 'conta',
    colunas: {
      // Aceita qualquer variação comum
      data: ['data', 'Data', 'date', 'DATE', 'DATA'],
      valor: ['valor', 'Valor', 'amount', 'VALOR', 'AMOUNT', 'Amount'],
      descricao: ['descricao', 'Descricao', 'Descrição', 'DESCRIÇÃO', 'title', 'Title', 'historico', 'Histórico', 'HISTORICO'],
      identificador: ['id', 'ID', 'Id', 'identificador', 'Identificador', 'documento']
    },
    validacao: {
      separador: ',', // Tenta vírgula primeiro, depois auto-detect
      encoding: 'UTF-8',
      decimal: '.',
      minColunas: 3
    },
    instrucoes: {
      linkTutorial: '',
      tituloResumido: 'Formato flexível - aceita variações comuns de colunas'
    },
    exemplo: {
      headers: 'data,valor,descricao',
      linha1: '15/01/2025,150.00,Compra no mercado',
      linha2: '14/01/2025,-50.00,Pagamento conta'
    }
  }
]

/**
 * Busca template por ID
 */
export function obterTemplatePorId(id: string): TemplateBanco | null {
  return TEMPLATES_BANCOS.find(t => t.id === id) || null
}

/**
 * Lista todos os templates disponíveis
 */
export function listarTemplates(): TemplateBanco[] {
  return TEMPLATES_BANCOS
}

/**
 * Lista templates por categoria
 */
export function listarTemplatesPorCategoria(categoria: 'cartao' | 'conta'): TemplateBanco[] {
  return TEMPLATES_BANCOS.filter(t => t.categoria === categoria)
}

/**
 * Lista templates que não são genéricos (para exibição no seletor)
 */
export function listarTemplatesBancos(): TemplateBanco[] {
  return TEMPLATES_BANCOS.filter(t => t.id !== 'generico')
}

/**
 * Obtém template genérico
 */
export function obterTemplateGenerico(): TemplateBanco {
  return TEMPLATES_BANCOS.find(t => t.id === 'generico')!
}
