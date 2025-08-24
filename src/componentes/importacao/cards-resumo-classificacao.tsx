import { Card, CardContent } from '@/componentes/ui/card'
import { ResumoClassificacao } from '@/tipos/importacao'

interface CardsResumoProps {
  resumo: ResumoClassificacao
}

export function CardsResumoClassificacao({ resumo }: CardsResumoProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      {/* Verde - Reconhecidas */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {resumo.reconhecidas}
          </div>
          <div className="text-sm text-green-700 flex items-center justify-center gap-1">
            <span>✅</span>
            Reconhecidas
          </div>
          <div className="text-xs text-green-600 mt-1">
            Classificação automática
          </div>
        </CardContent>
      </Card>

      {/* Amarelo - Pendentes */}  
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {resumo.pendentes}
          </div>
          <div className="text-sm text-yellow-700 flex items-center justify-center gap-1">
            <span>⏳</span>
            Pendentes
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Precisam classificação
          </div>
        </CardContent>
      </Card>

      {/* Vermelho - Duplicadas */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {resumo.duplicadas}
          </div>
          <div className="text-sm text-red-700 flex items-center justify-center gap-1">
            <span>🚫</span>
            Duplicadas
          </div>
          <div className="text-xs text-red-600 mt-1">
            Serão ignoradas
          </div>
        </CardContent>
      </Card>
    </div>
  )
}