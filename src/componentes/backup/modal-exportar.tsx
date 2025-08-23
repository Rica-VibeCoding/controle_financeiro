'use client'

import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { usarBackupExportar } from '@/hooks/usar-backup-exportar'
import { Download, FileText, Database, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

// Componentes UI simplificados para o projeto
interface ProgressProps {
  value: number
  className?: string
}

function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary'
  className?: string
}

function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800'
  }
  
  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

interface CheckboxProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function Checkbox({ id, checked, onCheckedChange }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
    />
  )
}

interface ModalExportarProps {
  isOpen: boolean
  onClose: () => void
}

export function ModalExportar({ isOpen, onClose }: ModalExportarProps) {
  const {
    estado,
    configuracao,
    ultimoResumo,
    logs,
    exportarDados,
    atualizarConfiguracao,
    resetarConfiguracao,
    reiniciarEstado,
    obterEstatisticasConfiguracao,
    podeFazerExportacao,
    temDadosParaExportar,
    exportacaoCompleta
  } = usarBackupExportar()

  const stats = obterEstatisticasConfiguracao()

  const handleFechar = () => {
    if (!estado.exportando) {
      reiniciarEstado()
      onClose()
    }
  }

  const handleExportar = async () => {
    const sucesso = await exportarDados()
    if (!sucesso && estado.erro) {
      // Erro será mostrado na UI através do estado
    }
  }

  const opcoesConfiguracao = [
    { chave: 'incluirCategorias', label: 'Categorias', icon: '📁' },
    { chave: 'incluirSubcategorias', label: 'Subcategorias', icon: '📂' },
    { chave: 'incluirContas', label: 'Contas', icon: '🏦' },
    { chave: 'incluirFormasPagamento', label: 'Formas de Pagamento', icon: '💳' },
    { chave: 'incluirCentrosCusto', label: 'Centros de Custo', icon: '🎯' },
    { chave: 'incluirTransacoes', label: 'Transações', icon: '💰' },
    { chave: 'incluirMetas', label: 'Metas Mensais', icon: '📊' }
  ]

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleFechar}
      title="Exportar Backup dos Dados"
      maxWidth="2xl"
      showCloseButton={!estado.exportando}
    >
      <div className="space-y-6">
        {/* Configuração da Exportação */}
        {!estado.exportando && !exportacaoCompleta && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5" />
                Selecionar Dados para Exportação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {opcoesConfiguracao.map(({ chave, label, icon }) => (
                  <div key={chave} className="flex items-center space-x-2">
                    <Checkbox
                      id={chave}
                      checked={configuracao[chave as keyof typeof configuracao]}
                      onCheckedChange={(checked) =>
                        atualizarConfiguracao({ [chave]: !!checked })
                      }
                    />
                    <label
                      htmlFor={chave}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                    >
                      <span>{icon}</span>
                      {label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-sm text-gray-600">
                  {stats.tabelasSelecionadas} de {stats.totalTabelas} tabelas selecionadas
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetarConfiguracao}
                >
                  Selecionar Todas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progresso da Exportação */}
        {estado.exportando && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 animate-spin" />
                Exportando Dados...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{estado.etapaAtual}</span>
                  <span>{Math.round(estado.progresso)}%</span>
                </div>
                <Progress value={estado.progresso} className="w-full" />
              </div>

              {logs.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-medium text-gray-700 mb-2">Log da Exportação:</div>
                  {logs.slice(-5).map((log, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                      {log.status === 'concluido' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                      {log.status === 'erro' && <AlertCircle className="w-3 h-3 text-red-500" />}
                      <span>{log.etapa}: {log.detalhes}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resultado da Exportação */}
        {exportacaoCompleta && ultimoResumo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                Exportação Concluída!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-700">Total de Registros</div>
                  <div className="text-2xl font-bold text-blue-900">{ultimoResumo.totalRegistros.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-green-700">Tamanho do Arquivo</div>
                  <div className="text-2xl font-bold text-green-900">
                    {(ultimoResumo.tamanhoArquivo / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Registros por Tabela:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ultimoResumo.registrosPorTabela).map(([tabela, qtd]) => (
                    <Badge key={tabela} variant="secondary" className="text-xs">
                      {tabela.replace('fp_', '')}: {qtd}
                    </Badge>
                  ))}
                </div>
              </div>

              {estado.arquivoGerado && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Arquivo Gerado:</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {estado.arquivoGerado}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Erro */}
        {estado.erro && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Erro durante a exportação</span>
              </div>
              <div className="text-sm text-red-700 mt-2">{estado.erro}</div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex justify-between">
          {!estado.exportando ? (
            <>
              <Button variant="outline" onClick={handleFechar}>
                {exportacaoCompleta ? 'Fechar' : 'Cancelar'}
              </Button>
              
              {!exportacaoCompleta && (
                <Button
                  onClick={handleExportar}
                  disabled={!podeFazerExportacao || !temDadosParaExportar}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Dados
                </Button>
              )}

              {exportacaoCompleta && (
                <Button
                  onClick={() => {
                    reiniciarEstado()
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Nova Exportação
                </Button>
              )}
            </>
          ) : (
            <div className="w-full flex justify-center">
              <Badge variant="secondary" className="px-4 py-2">
                Exportação em andamento...
              </Badge>
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  )
}