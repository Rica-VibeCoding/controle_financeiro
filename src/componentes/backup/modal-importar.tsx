'use client'

import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { UploaderArquivo } from './uploader-arquivo'
import { PreviewImportacaoComponent } from './preview-importacao'
import { usarBackupImportar } from '@/hooks/usar-backup-importar'
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Settings, 
  Database,
  FileCheck,
  Play
} from 'lucide-react'

interface ModalImportarProps {
  isOpen: boolean
  onClose: () => void
}

// Componentes UI simplificados
function Progress({ value, className = '' }: { value: number, className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
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

function RadioGroup({ 
  value, 
  onValueChange, 
  children, 
  className = '' 
}: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {children}
    </div>
  )
}

function RadioItem({ 
  value, 
  id, 
  selectedValue, 
  onSelect, 
  children 
}: {
  value: string
  id: string
  selectedValue: string
  onSelect: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id={id}
        name="modo-importacao"
        value={value}
        checked={selectedValue === value}
        onChange={() => onSelect(value)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
      />
      <label htmlFor={id} className="text-sm cursor-pointer">
        {children}
      </label>
    </div>
  )
}

export function ModalImportar({ isOpen, onClose }: ModalImportarProps) {
  const {
    estado,
    configuracao,
    arquivoSelecionado,
    ultimoResultado,
    logs,
    selecionarArquivo,
    removerArquivo,
    validarArquivo,
    executarImportacao,
    atualizarConfiguracao,
    reiniciarEstado,
    gerarPreviewDados,
    obterEstatisticasDados,
    podeValidarArquivo,
    arquivoValidado,
    podeImportar,
    importacaoCompleta,
    temErrosValidacao
  } = usarBackupImportar()

  const previews = gerarPreviewDados()
  const estatisticas = obterEstatisticasDados()

  const handleFechar = () => {
    if (!estado.importando) {
      reiniciarEstado()
      onClose()
    }
  }

  const handleValidar = async () => {
    await validarArquivo()
  }

  const handleImportar = async () => {
    const sucesso = await executarImportacao()
    if (!sucesso && estado.erro) {
      // Erro será mostrado na UI através do estado
    }
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleFechar}
      title="Importar Backup dos Dados"
      maxWidth="4xl"
      showCloseButton={!estado.importando}
    >
      <div className="space-y-6">
        {/* Etapa 1: Upload do Arquivo */}
        {!arquivoValidado && !estado.importando && !importacaoCompleta && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5" />
                1. Selecionar Arquivo de Backup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UploaderArquivo
                onArquivoSelecionado={selecionarArquivo}
                onArquivoRemovido={removerArquivo}
                arquivoSelecionado={arquivoSelecionado}
                disabled={estado.importando}
              />
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Configurações de Importação */}
        {arquivoSelecionado && !arquivoValidado && !estado.importando && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                2. Configurar Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="text-sm font-medium">Modo de Importação:</div>
                <RadioGroup 
                  value={configuracao.modoImportacao} 
                  onValueChange={(value) => atualizarConfiguracao({ modoImportacao: value as any })}
                >
                  <RadioItem
                    value="incremental"
                    id="modo-incremental"
                    selectedValue={configuracao.modoImportacao}
                    onSelect={(value) => atualizarConfiguracao({ modoImportacao: value as any })}
                  >
                    <div>
                      <div className="font-medium">Importação Incremental (Recomendado)</div>
                      <div className="text-xs text-gray-500">Mantém dados existentes, adiciona apenas novos registros</div>
                    </div>
                  </RadioItem>
                  
                  <RadioItem
                    value="limpo"
                    id="modo-limpo"
                    selectedValue={configuracao.modoImportacao}
                    onSelect={(value) => atualizarConfiguracao({ modoImportacao: value as any })}
                  >
                    <div>
                      <div className="font-medium">Importação Limpa</div>
                      <div className="text-xs text-gray-500">Remove todos os dados existentes antes de importar</div>
                    </div>
                  </RadioItem>
                </RadioGroup>
              </div>

              {configuracao.modoImportacao === 'limpo' && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-700">Atenção</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    Todos os dados existentes serão removidos permanentemente antes da importação.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Progresso da Validação */}
        {estado.importando && !arquivoValidado && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 animate-spin" />
                Validando Arquivo...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{estado.etapaAtual}</span>
                  <span>{Math.round(estado.progresso)}%</span>
                </div>
                <Progress value={estado.progresso} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 3: Preview dos Dados */}
        {arquivoValidado && !estado.importando && !importacaoCompleta && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-green-500" />
                  3. Confirmar Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {estatisticas && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-900">{estatisticas.totalRegistros}</div>
                      <div className="text-sm text-blue-700">Registros</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-900">{estatisticas.totalTabelas}</div>
                      <div className="text-sm text-green-700">Tabelas</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-900">{configuracao.modoImportacao}</div>
                      <div className="text-sm text-purple-700">Modo</div>
                    </div>
                  </div>
                )}

                {temErrosValidacao && (
                  <div className="bg-red-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-red-700">
                        Arquivo contém erros de validação
                      </span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      A importação pode falhar devido aos erros encontrados. Verifique o arquivo de backup.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <PreviewImportacaoComponent
              previews={previews}
              resumoValidacao={estado.resumoValidacao}
            />
          </>
        )}

        {/* Progresso da Importação */}
        {estado.importando && arquivoValidado && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 animate-pulse" />
                Importando Dados...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{estado.etapaAtual}</span>
                  <span>{Math.round(estado.progresso)}%</span>
                </div>
                <Progress value={estado.progresso} />
              </div>

              {logs.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-medium text-gray-700 mb-2">Log da Importação:</div>
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

        {/* Resultado da Importação */}
        {importacaoCompleta && ultimoResultado && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                Importação Concluída!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-green-700">Registros Importados</div>
                  <div className="text-2xl font-bold text-green-900">
                    {ultimoResultado.totalImportados.toLocaleString()}
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-700">Tempo de Execução</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {(ultimoResultado.tempoExecucao / 1000).toFixed(1)}s
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Registros por Tabela:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ultimoResultado.registrosPorTabela).map(([tabela, qtd]) => (
                    <Badge key={tabela} variant="success" className="text-xs">
                      {tabela.replace('fp_', '')}: {qtd}
                    </Badge>
                  ))}
                </div>
              </div>

              {ultimoResultado.advertencias.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-yellow-700 mb-1">Advertências:</div>
                  {ultimoResultado.advertencias.map((adv, index) => (
                    <div key={index} className="text-sm text-yellow-600">• {adv}</div>
                  ))}
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
                <span className="font-medium">
                  {estado.importando ? 'Erro durante a importação' : 'Erro na validação'}
                </span>
              </div>
              <div className="text-sm text-red-700 mt-2">{estado.erro}</div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex justify-between">
          {!estado.importando ? (
            <>
              <Button variant="outline" onClick={handleFechar}>
                {importacaoCompleta ? 'Fechar' : 'Cancelar'}
              </Button>
              
              <div className="flex gap-2">
                {podeValidarArquivo && (
                  <Button
                    onClick={handleValidar}
                    className="flex items-center gap-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    Validar Arquivo
                  </Button>
                )}

                {podeImportar && (
                  <Button
                    onClick={handleImportar}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Importar Dados
                  </Button>
                )}

                {importacaoCompleta && (
                  <Button
                    onClick={() => {
                      reiniciarEstado()
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Nova Importação
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <Badge variant="secondary" className="px-4 py-2">
                {estado.importando && !arquivoValidado ? 'Validação em andamento...' : 'Importação em andamento...'}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  )
}