'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Icone } from '@/componentes/ui/icone'
import { Skeleton } from '@/componentes/ui/skeleton'

type TipoEntidade = 'categoria' | 'conta' | 'subcategoria' | 'forma-pagamento' | 'centro-custo'

interface SecaoPreviewProps {
  tipo: TipoEntidade
  dados: Record<string, any>
  titulo?: string
  carregando?: boolean
}

/**
 * Formatar tipo de conta para exibição
 */
const formatarTipoConta = (tipo: string): string => {
  const tipos: Record<string, string> = {
    conta_corrente: 'Conta Corrente',
    conta_poupanca: 'Conta Poupança',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    dinheiro: 'Dinheiro',
    investimento: 'Investimento'
  }
  return tipos[tipo] || tipo
}

/**
 * Formatar tipo de categoria para exibição
 */
const formatarTipoCategoria = (tipo: string): string => {
  const tipos: Record<string, string> = {
    receita: 'Receita',
    despesa: 'Despesa',
    ambos: 'Ambos'
  }
  return tipos[tipo] || tipo
}

/**
 * Formatar tipo de forma de pagamento para exibição
 */
const formatarTipoFormaPagamento = (tipo: string): string => {
  const tipos: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    debito: 'Cartão de Débito',
    credito: 'Cartão de Crédito',
    transferencia: 'Transferência Bancária',
    boleto: 'Boleto',
    outros: 'Outros'
  }
  return tipos[tipo] || tipo
}

/**
 * Obter cor padrão por tipo de entidade
 */
const obterCorPadrao = (tipo: TipoEntidade): string => {
  const cores: Record<TipoEntidade, string> = {
    categoria: '#3B82F6',
    conta: '#10B981',
    subcategoria: '#8B5CF6',
    'forma-pagamento': '#F59E0B',
    'centro-custo': '#EF4444'
  }
  return cores[tipo]
}

/**
 * Obter ícone padrão por tipo de entidade
 */
const obterIconePadrao = (tipo: TipoEntidade): string => {
  const icones: Record<TipoEntidade, string> = {
    categoria: 'tag',
    conta: 'credit-card',
    subcategoria: 'folder',
    'forma-pagamento': 'dollar-sign',
    'centro-custo': 'building'
  }
  return icones[tipo]
}

export function SecaoPreview({ 
  tipo, 
  dados, 
  titulo,
  carregando = false 
}: SecaoPreviewProps) {
  const tituloFinal = titulo || `Preview da ${tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('-', ' ')}`
  
  if (carregando) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  const nome = dados.nome || 'Sem nome'
  const cor = dados.cor || obterCorPadrao(tipo)
  const icone = dados.icone || obterIconePadrao(tipo)

  const renderizarDetalhes = () => {
    switch (tipo) {
      case 'categoria':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tipo:</span>
              <span className="text-sm font-medium">{formatarTipoCategoria(dados.tipo || 'despesa')}</span>
            </div>
            {dados.cor && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cor:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border" 
                    style={{ backgroundColor: dados.cor }}
                  />
                  <span className="text-xs font-mono">{dados.cor}</span>
                </div>
              </div>
            )}
          </div>
        )

      case 'conta':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tipo:</span>
              <span className="text-sm font-medium">{formatarTipoConta(dados.tipo || 'conta_corrente')}</span>
            </div>
            {dados.banco && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Banco:</span>
                <span className="text-sm font-medium">{dados.banco}</span>
              </div>
            )}
            {dados.tipo === 'cartao_credito' && dados.limite && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Limite:</span>
                <span className="text-sm font-medium">R$ {Number(dados.limite).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {dados.tipo === 'cartao_credito' && dados.data_fechamento && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data Fechamento:</span>
                <span className="text-sm font-medium">Todo dia {dados.data_fechamento}</span>
              </div>
            )}
          </div>
        )

      case 'subcategoria':
        return (
          <div className="space-y-2">
            {dados.categoria_nome && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Categoria Pai:</span>
                <span className="text-sm font-medium">{dados.categoria_nome}</span>
              </div>
            )}
          </div>
        )

      case 'forma-pagamento':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tipo:</span>
              <span className="text-sm font-medium">{formatarTipoFormaPagamento(dados.tipo || 'dinheiro')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Permite Parcelamento:</span>
              <span className="text-sm font-medium">
                {dados.permite_parcelamento ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        )

      case 'centro-custo':
        return (
          <div className="space-y-2">
            {dados.descricao && (
              <div>
                <span className="text-sm text-gray-600">Descrição:</span>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded text-gray-700">
                  {dados.descricao}
                </p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900">
          {tituloFinal}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Cabeçalho com ícone e nome */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ backgroundColor: cor }}
          >
            <Icone name={icone} size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{nome}</h3>
            <p className="text-sm text-gray-500 capitalize">
              {tipo.replace('-', ' ')}
            </p>
          </div>
        </div>

        {/* Detalhes específicos */}
        {renderizarDetalhes()}

        {/* Status ativo */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Ativo
            </span>
          </div>
        </div>

        {/* Aviso se campos obrigatórios estão em falta */}
        {!nome && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            ⚠️ Preencha o nome para ver o preview completo
          </div>
        )}
      </CardContent>
    </Card>
  )
}