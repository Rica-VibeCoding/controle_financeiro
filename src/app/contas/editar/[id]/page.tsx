'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select } from '@/componentes/ui/select'
import { obterContas, atualizarConta } from '@/servicos/supabase/contas'
import { usarToast } from '@/hooks/usar-toast'
import type { Conta } from '@/tipos/database'

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

export default function EditarContaPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = usarToast()
  
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [conta, setConta] = useState<Conta | null>(null)
  const [dados, setDados] = useState({
    nome: '',
    tipo: '' as 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'dinheiro' | '',
    banco: '',
    limite: '' as string | number | '',
    ativo: true
  })
  const [erros, setErros] = useState<string[]>([])

  // Carregar conta atual
  useEffect(() => {
    async function carregarConta() {
      try {
        setCarregando(true)
        const contas = await obterContas(true) // incluir inativas
        const contaEncontrada = contas.find(c => c.id === params.id)
        
        if (!contaEncontrada) {
          toast({
            title: "Conta não encontrada",
            description: "A conta que você tentou editar não existe.",
            variant: "error"
          })
          router.push('/contas')
          return
        }

        setConta(contaEncontrada)
        setDados({
          nome: contaEncontrada.nome,
          tipo: contaEncontrada.tipo as 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'dinheiro',
          banco: contaEncontrada.banco || '',
          limite: typeof (contaEncontrada as any).limite === 'number' && (contaEncontrada as any).limite !== null
            ? (contaEncontrada as any).limite
            : '',
          ativo: contaEncontrada.ativo
        })
      } catch (error) {
        toast({
          title: "Erro ao carregar conta",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "error"
        })
        router.push('/contas')
      } finally {
        setCarregando(false)
      }
    }

    if (params.id) {
      carregarConta()
    }
  }, [params.id, router, toast])

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

    // Banco é opcional, mas se preenchido deve ter pelo menos 2 caracteres
    if (dados.banco && dados.banco.trim().length < 2) {
      novosErros.push('Nome do banco deve ter pelo menos 2 caracteres')
    }

    // Limite obrigatório para cartão; aceita 0 e centavos
    if (dados.tipo === 'cartao_credito') {
      const valorLimite = dados.limite === '' ? '' : Number(dados.limite)
      if (valorLimite === '') {
        novosErros.push('Limite é obrigatório para cartão de crédito')
      } else if (isNaN(valorLimite) || valorLimite < 0) {
        novosErros.push('Limite deve ser um número maior ou igual a 0')
      }
    }

    setErros(novosErros)
    return novosErros.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!conta) return

    if (!validarFormulario()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros antes de continuar.",
        variant: "error"
      })
      return
    }

    try {
      setSalvando(true)
      
      await atualizarConta(conta.id, {
        nome: dados.nome.trim(),
        tipo: dados.tipo as 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'dinheiro',
        banco: dados.banco.trim() || null,
        limite: dados.tipo === 'cartao_credito' ? Number(dados.limite) || 0 : null,
        ativo: dados.ativo
      })

      toast({
        title: "Conta atualizada!",
        description: `A conta "${dados.nome}" foi atualizada com sucesso.`,
        variant: "success"
      })

      router.push('/contas')
    } catch (error) {
      toast({
        title: "Erro ao atualizar conta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "error"
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleVoltar = () => {
    router.push('/contas')
  }

  const tipoSelecionado = TIPOS_CONTA.find(t => t.valor === dados.tipo)

  if (carregando) {
    return (
      <LayoutPrincipal>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Carregando conta...
              </div>
            </CardContent>
          </Card>
        </div>
      </LayoutPrincipal>
    )
  }

  if (!conta) {
    return (
      <LayoutPrincipal>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                Conta não encontrada
              </div>
            </CardContent>
          </Card>
        </div>
      </LayoutPrincipal>
    )
  }

  return (
    <LayoutPrincipal>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleVoltar}
            disabled={salvando}
          >
            ← Voltar
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Editar Conta
            </h1>
            <p className="text-muted-foreground">
              Atualize os dados da conta "{conta.nome}"
            </p>
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
              Atualize os dados da conta
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
                  disabled={salvando}
                  className={erros.some(e => e.includes('Nome')) ? 'border-destructive' : ''}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={dados.tipo}
                  onChange={(e) => setDados(prev => ({ ...prev, tipo: e.target.value as typeof dados.tipo }))}
                  disabled={salvando}
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
                    disabled={salvando}
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
                      disabled={salvando}
                      className="mt-2"
                    />
                  )}
                </div>
              )}

              {/* Limite (apenas para cartão de crédito) */}
              {dados.tipo === 'cartao_credito' && (
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
                    disabled={salvando}
                    className={erros.some(e => e.toLowerCase().includes('limite')) ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">Aceita centavos e permite 0.</p>
                </div>
              )}

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ativo"
                      checked={dados.ativo === true}
                      onChange={() => setDados(prev => ({ ...prev, ativo: true }))}
                      disabled={salvando}
                    />
                    <span className="text-green-600">✅ Ativa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ativo"
                      checked={dados.ativo === false}
                      onChange={() => setDados(prev => ({ ...prev, ativo: false }))}
                      disabled={salvando}
                    />
                    <span className="text-red-600">❌ Inativa</span>
                  </label>
                </div>
              </div>

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
                          {!dados.ativo && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded ml-2">
                              INATIVA
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tipoSelecionado?.label.replace(/^[🏦💰💳💵]\s/, '') || 'Selecione o tipo'}
                          {dados.banco && dados.banco !== 'Outro' && (
                            <span> • {dados.banco}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {dados.ativo ? '✅ Conta ativa' : '❌ Conta inativa'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Aviso sobre inativação */}
              {!dados.ativo && (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-amber-600 space-y-1">
                      <h4 className="font-medium">⚠️ Atenção - Conta Inativa:</h4>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Não aparecerá nas listas de seleção</li>
                        <li>Não poderá receber novas transações</li>
                        <li>Transações existentes serão mantidas</li>
                        <li>Pode ser reativada a qualquer momento</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVoltar}
                  disabled={salvando}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={salvando}
                  className="flex-1"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}