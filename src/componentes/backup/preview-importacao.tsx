'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import type { PreviewImportacao, ResumoValidacao } from '@/tipos/backup'
import { Database, AlertCircle, CheckCircle2, Info } from 'lucide-react'

interface PreviewImportacaoProps {
  previews: PreviewImportacao[]
  resumoValidacao?: ResumoValidacao
  className?: string
}

function Badge({ children, variant = 'default', className = '' }: { 
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string 
}) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }
  
  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function PreviewImportacaoComponent({
  previews,
  resumoValidacao,
  className = ''
}: PreviewImportacaoProps) {
  const formatarValor = (valor: any): string => {
    if (valor === null || valor === undefined) return '-'
    if (typeof valor === 'number') {
      return valor.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      })
    }
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
    return String(valor)
  }

  const formatarNomeTabela = (nome: string): string => {
    const nomes: { [key: string]: string } = {
      'Categorias': '📁 Categorias',
      'Subcategorias': '📂 Subcategorias',
      'Contas': '🏦 Contas',
      'Formas de Pagamento': '💳 Formas de Pagamento',
      'Centros de Custo': '🎯 Centros de Custo',
      'Transações': '💰 Transações',
      'Metas Mensais': '📊 Metas Mensais'
    }
    return nomes[nome] || nome
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Resumo da Validação */}
      {resumoValidacao && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {resumoValidacao.arquivoValido ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              Validação do Arquivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-700">Total de Registros</div>
                <div className="text-2xl font-bold text-blue-900">
                  {resumoValidacao.totalRegistros.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-700">Tabelas Encontradas</div>
                <div className="text-2xl font-bold text-green-900">
                  {resumoValidacao.tabelasEncontradas.length}
                </div>
              </div>
            </div>

            {/* Registros por Tabela */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Registros por Tabela:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(resumoValidacao.registrosPorTabela).map(([tabela, qtd]) => (
                  <Badge key={tabela} variant="secondary">
                    {tabela.replace('fp_', '')}: {qtd}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Erros de Validação */}
            {resumoValidacao.errosValidacao.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-red-700">
                    Erros de Validação ({resumoValidacao.errosValidacao.length})
                  </span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {resumoValidacao.errosValidacao.slice(0, 10).map((erro, index) => (
                    <div key={index} className="text-sm text-red-600">
                      <span className="font-medium">{erro.tabela}:</span> {erro.mensagem}
                      {erro.linha && <span className="text-red-500"> (linha {erro.linha})</span>}
                    </div>
                  ))}
                  {resumoValidacao.errosValidacao.length > 10 && (
                    <div className="text-xs text-red-500">
                      ... e mais {resumoValidacao.errosValidacao.length - 10} erros
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Advertências */}
            {resumoValidacao.advertencias.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-yellow-700">
                    Advertências ({resumoValidacao.advertencias.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {resumoValidacao.advertencias.map((advertencia, index) => (
                    <div key={index} className="text-sm text-yellow-600">
                      {advertencia}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview dos Dados */}
      {previews.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Preview dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {previews.map((preview, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{formatarNomeTabela(preview.tabela)}</h4>
                  <Badge variant="secondary">
                    {preview.totalRegistros} registros
                  </Badge>
                </div>

                {/* Amostra dos Dados */}
                {preview.amostra.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Amostra ({Math.min(preview.amostra.length, 3)} de {preview.totalRegistros}):
                    </div>
                    
                    <div className="space-y-3">
                      {preview.amostra.slice(0, 3).map((registro, regIndex) => (
                        <div key={regIndex} className="bg-white p-3 rounded border text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            {preview.colunas.slice(0, 4).map((coluna) => (
                              <div key={coluna}>
                                <span className="font-medium text-gray-600 capitalize">
                                  {coluna.replace('_', ' ')}:
                                </span>
                                <span className="ml-2 text-gray-900">
                                  {formatarValor(registro[coluna])}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Mostrar mais campos se houver */}
                          {Object.keys(registro).length > 4 && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="text-xs text-gray-500">
                                + {Object.keys(registro).length - 4} outros campos
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {preview.totalRegistros > 3 && (
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        ... e mais {preview.totalRegistros - 3} registros
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {previews.length === 0 && !resumoValidacao && (
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum dado para preview
            </h3>
            <p className="text-gray-600">
              Selecione e valide um arquivo de backup para ver o preview dos dados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}