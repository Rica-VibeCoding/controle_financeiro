import { TransacaoClassificada } from '@/tipos/importacao'

interface LinhaTransacaoProps {
  transacao: TransacaoClassificada
  onClick?: () => void
}

export function LinhaTransacaoClassificada({ 
  transacao, 
  onClick 
}: LinhaTransacaoProps) {
  
  const getStatusConfig = () => {
    switch (transacao.status_classificacao) {
      case 'reconhecida':
        return {
          icon: '✅',
          bgColor: 'bg-green-50 hover:bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          clickable: false
        }
      case 'pendente':
        return {
          icon: '⏳',
          bgColor: 'bg-yellow-50 hover:bg-yellow-100 cursor-pointer',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          clickable: true
        }
      case 'duplicada':
        return {
          icon: '🚫',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          clickable: false
        }
    }
  }

  const config = getStatusConfig()
  
  // Limpar descrição (remove info do cartão)
  const descricaoLimpa = transacao.descricao
    .replace(/- •••\.\d+\.\d+-•• - .+$/, '')
    .trim()

  return (
    <div 
      className={`
        flex justify-between items-center p-3 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        ${config.clickable ? 'transition-colors' : ''}
      `}
      onClick={config.clickable ? onClick : undefined}
      role={config.clickable ? 'button' : undefined}
      tabIndex={config.clickable ? 0 : undefined}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-sm">
            {descricaoLimpa}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(transacao.data).toLocaleDateString('pt-BR')}
          </div>
          {/* Mostrar classificação se reconhecida */}
          {transacao.status_classificacao === 'reconhecida' && 
           transacao.classificacao_automatica && (
            <div className="text-xs text-green-600 mt-1">
              Auto-classificada
            </div>
          )}
        </div>
      </div>
      <div className={`font-bold text-sm shrink-0 ${config.textColor}`}>
        {transacao.tipo === 'receita' ? '+' : '-'}R$ {transacao.valor.toFixed(2)}
      </div>
    </div>
  )
}