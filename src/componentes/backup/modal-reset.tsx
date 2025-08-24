'use client'

import { useState } from 'react'
import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { usarResetPlanilha } from '@/hooks/usar-reset-planilha'
import { Trash2, AlertTriangle, Shield, FileText, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react'
import { Icone } from '@/componentes/ui/icone'

// Componentes UI simplificados para o projeto
interface ProgressProps {
  value: number
  className?: string
}

function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className="bg-red-600 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive'
  className?: string
}

function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800'
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
  disabled?: boolean
}

function Checkbox({ id, checked, onCheckedChange, disabled = false }: CheckboxProps) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:opacity-50"
    />
  )
}

interface ModalResetProps {
  isOpen: boolean
  onClose: () => void
}

export function ModalReset({ isOpen, onClose }: ModalResetProps) {
  const [etapaAtual, setEtapaAtual] = useState<'configuracao' | 'preview' | 'confirmacao' | 'execucao'>('configuracao')
  const [confirmacaoDigitada, setConfirmacaoDigitada] = useState('')
  const [mostrarResultado, setMostrarResultado] = useState(false)
  
  const {
    configuracao,
    estado,
    gerarPreview,
    executarReset,
    alterarConfiguracao,
    resetarEstado,
    obterResumoSelecao,
    validarSelecao,
    podeExecutar,
    temSelecao
  } = usarResetPlanilha()

  const handleClose = () => {
    if (!estado.resetando) {
      resetarEstado()
      setEtapaAtual('configuracao')
      setConfirmacaoDigitada('')
      setMostrarResultado(false)
      onClose()
    }
  }

  const handleProximaEtapa = async () => {
    if (etapaAtual === 'configuracao') {
      const preview = await gerarPreview()
      if (preview) {
        setEtapaAtual('preview')
      }
    } else if (etapaAtual === 'preview') {
      setEtapaAtual('confirmacao')
    }
  }

  const handleExecutarReset = async () => {
    setEtapaAtual('execucao')
    const resultado = await executarReset()
    if (resultado) {
      setMostrarResultado(true)
    }
  }

  const handleVoltarEtapa = () => {
    if (etapaAtual === 'preview') {
      setEtapaAtual('configuracao')
    } else if (etapaAtual === 'confirmacao') {
      setEtapaAtual('preview')
    }
  }

  const confirmacoesValidas = ['CONFIRMO', 'confirmo', 'Confirmo']
  const confirmacaoCorreta = confirmacoesValidas.includes(confirmacaoDigitada)

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleClose}
      title={
        etapaAtual === 'configuracao' ? 'Reset da Planilha' :
        etapaAtual === 'preview' ? 'Confirmação do Reset' :
        etapaAtual === 'confirmacao' ? 'Confirmação Final' :
        etapaAtual === 'execucao' ? 'Executando Reset' : 'Reset da Planilha'
      }
      maxWidth="2xl"
    >
      <div className="space-y-6">
        
        {/* Etapa: Configuração */}
        {etapaAtual === 'configuracao' && (
          <>
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <CardTitle className="text-red-800 text-lg">
                    ⚠️ Operação Irreversível
                  </CardTitle>
                </div>
                <p className="text-red-700 text-sm">
                  Esta operação apagará permanentemente os dados selecionados. 
                  Recomendamos criar um backup antes de continuar.
                </p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icone name="settings" className="w-4 h-4" />
                  Selecione o que deseja resetar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Opção: Backup Automático */}
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <label htmlFor="backup" className="text-sm font-medium text-blue-900 cursor-pointer">
                      Criar backup antes de resetar
                    </label>
                    <p className="text-xs text-blue-700 mt-1">
                      Recomendado: baixa automaticamente um backup dos dados selecionados
                    </p>
                  </div>
                  <Checkbox
                    id="backup"
                    checked={configuracao.criarBackupAntes}
                    onCheckedChange={(checked) => alterarConfiguracao({ criarBackupAntes: checked })}
                  />
                </div>

                {/* Grid de opções */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="transacoes"
                      checked={configuracao.incluirTransacoes}
                      onCheckedChange={(checked) => alterarConfiguracao({ incluirTransacoes: checked })}
                    />
                    <div>
                      <label htmlFor="transacoes" className="text-sm font-medium cursor-pointer">
                        Transações
                      </label>
                      <p className="text-xs text-gray-600">Todas as receitas e despesas</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="metas"
                      checked={configuracao.incluirMetas}
                      onCheckedChange={(checked) => alterarConfiguracao({ incluirMetas: checked })}
                    />
                    <div>
                      <label htmlFor="metas" className="text-sm font-medium cursor-pointer">
                        Metas Mensais
                      </label>
                      <p className="text-xs text-gray-600">Orçamentos por categoria</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="centros"
                      checked={configuracao.incluirCentrosCusto}
                      onCheckedChange={(checked) => alterarConfiguracao({ incluirCentrosCusto: checked })}
                    />
                    <div>
                      <label htmlFor="centros" className="text-sm font-medium cursor-pointer">
                        Centros de Custo
                      </label>
                      <p className="text-xs text-gray-600">Projetos pessoais</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="subcategorias"
                      checked={configuracao.incluirSubcategorias}
                      onCheckedChange={(checked) => alterarConfiguracao({ incluirSubcategorias: checked })}
                    />
                    <div>
                      <label htmlFor="subcategorias" className="text-sm font-medium cursor-pointer">
                        Subcategorias
                      </label>
                      <p className="text-xs text-gray-600">Subdivisões das categorias</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="formas"
                      checked={configuracao.incluirFormasPagamento}
                      onCheckedChange={(checked) => alterarConfiguracao({ incluirFormasPagamento: checked })}
                    />
                    <div>
                      <label htmlFor="formas" className="text-sm font-medium cursor-pointer">
                        Formas de Pagamento
                      </label>
                      <p className="text-xs text-gray-600">Dinheiro, cartão, PIX, etc.</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="contas"
                      checked={configuracao.incluirContas}
                      onCheckedChange={(checked) => alterarConfiguracao({ incluirContas: checked })}
                    />
                    <div>
                      <label htmlFor="contas" className="text-sm font-medium cursor-pointer">
                        Contas
                      </label>
                      <p className="text-xs text-gray-600">Bancos e cartões</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="categorias"
                      checked={configuracao.incluirCategorias}
                      onCheckedChange={(checked) => alterarConfiguracao({ incluirCategorias: checked })}
                    />
                    <div>
                      <label htmlFor="categorias" className="text-sm font-medium cursor-pointer">
                        Categorias
                      </label>
                      <p className="text-xs text-gray-600">Categorias personalizadas</p>
                    </div>
                  </div>
                </div>

                {/* Resumo da seleção */}
                {temSelecao && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Selecionado:</span> {obterResumoSelecao()}
                    </p>
                  </div>
                )}

              </CardContent>
            </Card>
          </>
        )}

        {/* Etapa: Preview */}
        {etapaAtual === 'preview' && estado.dadosParaReset && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Preview do Reset
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Os seguintes registros serão apagados permanentemente:
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {estado.dadosParaReset.totalRegistros}
                  </div>
                  <div className="text-sm text-red-700">Total de Registros</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {estado.dadosParaReset.tabelasSelecionadas.length}
                  </div>
                  <div className="text-sm text-orange-700">Tabelas Afetadas</div>
                </div>
              </div>

              {/* Detalhes por tabela */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Registros por tabela:</h4>
                {Object.entries(estado.dadosParaReset.registrosPorTabela).map(([tabela, quantidade]) => (
                  <div key={tabela} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm">{tabela}</span>
                    <Badge variant="destructive">{quantidade} registros</Badge>
                  </div>
                ))}
              </div>

              {configuracao.criarBackupAntes && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ✅ Um backup será criado automaticamente antes do reset
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        )}

        {/* Etapa: Confirmação */}
        {etapaAtual === 'confirmacao' && (
          <Card className="border-red-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirmação Final
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-800 font-medium mb-2">
                  ⚠️ Esta ação não pode ser desfeita!
                </p>
                <p className="text-red-700 text-sm">
                  Você está prestes a apagar <strong>{estado.dadosParaReset?.totalRegistros} registros</strong> das seguintes tabelas: {obterResumoSelecao()}
                </p>
              </div>

              <div className="space-y-3">
                <label htmlFor="confirmacao" className="text-sm font-medium">
                  Para continuar, digite <strong>CONFIRMO</strong> no campo abaixo:
                </label>
                <input
                  id="confirmacao"
                  type="text"
                  value={confirmacaoDigitada}
                  onChange={(e) => setConfirmacaoDigitada(e.target.value)}
                  placeholder="Digite CONFIRMO"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {confirmacaoDigitada && !confirmacaoCorreta && (
                  <p className="text-red-600 text-sm">Digite exatamente "CONFIRMO"</p>
                )}
              </div>

            </CardContent>
          </Card>
        )}

        {/* Etapa: Execução */}
        {etapaAtual === 'execucao' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {estado.resetando ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin" />
                    Executando Reset
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Reset Concluído
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {estado.resetando && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{estado.etapaAtual}</span>
                    <span>{Math.round(estado.progresso)}%</span>
                  </div>
                  <Progress value={estado.progresso} />
                </div>
              )}

              {!estado.resetando && mostrarResultado && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Reset executado com sucesso!</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Os dados selecionados foram removidos da planilha. 
                    {configuracao.criarBackupAntes && ' Um backup foi baixado automaticamente.'}
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        )}

        {/* Botões de ação */}
        <div className="flex justify-between pt-4">
          <div>
            {(etapaAtual === 'preview' || etapaAtual === 'confirmacao') && (
              <Button
                variant="outline"
                onClick={handleVoltarEtapa}
                disabled={estado.resetando}
              >
                Voltar
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={estado.resetando}
            >
              {mostrarResultado ? 'Fechar' : 'Cancelar'}
            </Button>

            {etapaAtual === 'configuracao' && (
              <Button
                onClick={handleProximaEtapa}
                disabled={!validarSelecao().valida}
                className="bg-red-600 hover:bg-red-700"
              >
                Continuar
              </Button>
            )}

            {etapaAtual === 'preview' && (
              <Button
                onClick={handleProximaEtapa}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirmar
              </Button>
            )}

            {etapaAtual === 'confirmacao' && (
              <Button
                onClick={handleExecutarReset}
                disabled={!confirmacaoCorreta}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Executar Reset
              </Button>
            )}
          </div>
        </div>

      </div>
    </ModalBase>
  )
}