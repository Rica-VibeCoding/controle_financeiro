'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select } from '@/componentes/ui/select'
import { criarConta } from '@/servicos/supabase/contas'
import { usarToast } from '@/hooks/usar-toast'

const TIPOS_CONTA = [
  { valor: 'conta_corrente', label: '🏦 Conta Corrente', icone: '🏦' },
  { valor: 'poupanca', label: '💰 Poupança', icone: '💰' },
  { valor: 'cartao_credito', label: '💳 Cartão de Crédito', icone: '💳' },
  { valor: 'dinheiro', label: '💵 Dinheiro', icone: '💵' }
]

const BANCOS_POPULARES = [
  'Banco do Brasil',
  'Caixa Econômica Federal', 
  'Itaú',
  'Bradesco',
  'Santander',
  'Nubank',
  'Inter',
  'C6 Bank',
  'PagBank',
  'BTG Pactual',
  'Sicoob',
  'Sicredi',
  'Outro'
]

export default function NovaContaPage() {
  const router = useRouter()
  const { toast } = usarToast()
  
  const [carregando, setCarregando] = useState(false)
  const [dados, setDados] = useState({
    nome: '',
    tipo: '' as 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'dinheiro' | '',
    banco: '',
    limite: '' as string | number | '',
    data_fechamento: '' as string | number | '',
    ativo: true
  })
  const [erros, setErros] = useState<string[]>([])

  const validarFormulario = () => {
    const novosErros: string[] = []

    if (!dados.nome.trim()) {
      novosErros.push('Nome é obrigatório')
    } else if (dados.nome.trim().length < 2) {
      novosErros.push('Nome deve ter pelo menos 2 caracteres')
    }

    if (!dados.tipo) {
      novosErros.push('Tipo é obrigatório')
    }
    // Limite é obrigatório para cartão de crédito; aceita 0 e centavos
    if (dados.tipo === 'cartao_credito') {
      const valorLimite = dados.limite === '' ? '' : Number(dados.limite)
      if (valorLimite === '') {
        novosErros.push('Limite é obrigatório para cartão de crédito')
      } else if (isNaN(valorLimite) || valorLimite < 0) {
        novosErros.push('Limite deve ser um número maior ou igual a 0')
      }

      // Data de fechamento obrigatória para cartão de crédito
      const diaFechamento = dados.data_fechamento === '' ? '' : Number(dados.data_fechamento)
      if (diaFechamento === '') {
        novosErros.push('Data de fechamento é obrigatória para cartão de crédito')
      } else if (isNaN(diaFechamento) || diaFechamento < 1 || diaFechamento > 31) {
        novosErros.push('Data de fechamento deve ser entre 1 e 31')
      }
    }

    // Banco é opcional, mas se preenchido deve ter pelo menos 2 caracteres
    if (dados.banco && dados.banco.trim().length < 2) {
      novosErros.push('Nome do banco deve ter pelo menos 2 caracteres')
    }

    setErros(novosErros)
    return novosErros.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarFormulario()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros antes de continuar.",
        variant: "error"
      })
      return
    }

    try {
      setCarregando(true)
      
      await criarConta({
        nome: dados.nome.trim(),
        tipo: dados.tipo as 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'dinheiro',
        banco: dados.banco.trim() || null,
        limite: dados.tipo === 'cartao_credito' ? Number(dados.limite) || null : null,
        data_fechamento: dados.tipo === 'cartao_credito' ? Number(dados.data_fechamento) || null : null,
        ativo: dados.ativo
      })

      toast({
        title: "Conta criada!",
        description: `A conta "${dados.nome}" foi criada com sucesso.`,
        variant: "success"
      })

      router.push('/contas')
    } catch (error) {
      toast({
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "error"
      })
    } finally {
      setCarregando(false)
    }
  }

  const handleVoltar = () => {
    router.push('/contas')
  }

  const tipoSelecionado = TIPOS_CONTA.find(t => t.valor === dados.tipo)

  return (
    <LayoutPrincipal>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleVoltar}
            disabled={carregando}
          >
            ← Voltar
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Nova Conta</h1>
          </div>
        </div>

        {erros.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="text-destructive space-y-1">
                <p className="font-medium">Corrija os seguintes erros:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {erros.map((erro, index) => (
                    <li key={index}>{erro}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>
              Preencha os dados da nova conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Conta *</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Conta Corrente BB, Cartão Nubank, Dinheiro..."
                  value={dados.nome}
                  onChange={(e) => setDados(prev => ({ ...prev, nome: e.target.value }))}
                  disabled={carregando}
                  className={erros.some(e => e.includes('Nome')) ? 'border-destructive' : ''}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={dados.tipo}
                  onChange={(e) => setDados(prev => ({ ...prev, tipo: e.target.value as typeof dados.tipo }))}
                  disabled={carregando}
                  className={erros.some(e => e.includes('Tipo')) ? 'border-destructive' : ''}
                >
                  <option value="">Selecione o tipo da conta</option>
                  {TIPOS_CONTA.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Banco (apenas se não for dinheiro) */}
              {dados.tipo && dados.tipo !== 'dinheiro' && (
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco (opcional)</Label>
                  <Select
                    value={dados.banco}
                    onChange={(e) => setDados(prev => ({ ...prev, banco: e.target.value }))}
                    disabled={carregando}
                    className={erros.some(e => e.includes('banco')) ? 'border-destructive' : ''}
                  >
                    <option value="">Selecione o banco</option>
                    {BANCOS_POPULARES.map((banco) => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </Select>
                  
                  {dados.banco === 'Outro' && (
                    <Input
                      type="text"
                      placeholder="Digite o nome do banco"
                      value={dados.banco === 'Outro' ? '' : dados.banco}
                      onChange={(e) => setDados(prev => ({ ...prev, banco: e.target.value }))}
                      disabled={carregando}
                      className="mt-2"
                    />
                  )}
                </div>
              )}

              {/* Limite e Data de Fechamento (apenas para cartão de crédito) */}
              {dados.tipo === 'cartao_credito' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="limite">Limite do cartão (R$) *</Label>
                    <Input
                      id="limite"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Ex: 5000.00"
                      value={dados.limite}
                      onChange={(e) => setDados(prev => ({ ...prev, limite: e.target.value }))}
                      disabled={carregando}
                      className={erros.some(e => e.toLowerCase().includes('limite')) ? 'border-destructive' : ''}
                    />
                    <p className="text-xs text-muted-foreground">Aceita centavos e permite 0.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_fechamento">Dia de fechamento da fatura *</Label>
                    <Input
                      id="data_fechamento"
                      type="number"
                      min="1"
                      max="31"
                      inputMode="numeric"
                      placeholder="Ex: 15"
                      value={dados.data_fechamento}
                      onChange={(e) => setDados(prev => ({ ...prev, data_fechamento: e.target.value }))}
                      disabled={carregando}
                      className={erros.some(e => e.toLowerCase().includes('fechamento')) ? 'border-destructive' : ''}
                    />
                    <p className="text-xs text-muted-foreground">Dia do mês que a fatura fecha (1 a 31).</p>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="space-y-2">
                <Label>Visualização</Label>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {tipoSelecionado?.icone || '💳'}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium">
                          {dados.nome || 'Nome da conta'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tipoSelecionado?.label.replace(/^[🏦💰💳💵]\s/, '') || 'Selecione o tipo'}
                          {dados.banco && dados.banco !== 'Outro' && (
                            <span> • {dados.banco}</span>
                          )}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          ✅ Conta ativa
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Informações importantes */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <h4 className="font-medium text-foreground">💡 Dicas importantes:</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Use nomes claros para identificar facilmente</li>
                      <li>Cartões de crédito mostram limite disponível</li>
                      <li>Contas correntes/poupança mostram saldo real</li>
                      <li>Você pode editar essas informações depois</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVoltar}
                  disabled={carregando}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={carregando}
                  className="flex-1"
                >
                  {carregando ? 'Criando...' : 'Criar Conta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}