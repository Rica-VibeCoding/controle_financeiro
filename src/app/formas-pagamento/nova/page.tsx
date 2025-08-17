'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select } from '@/componentes/ui/select'
import { criarFormaPagamento } from '@/servicos/supabase/formas-pagamento'

export default function NovaFormaPagamentoPage() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'vista' as 'vista' | 'credito' | 'debito',
    permite_parcelamento: false,
    ativo: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      setErro('Nome é obrigatório')
      return
    }
    
    if (!formData.tipo) {
      setErro('Tipo é obrigatório')
      return
    }

    try {
      setCarregando(true)
      setErro(null)
      
      await criarFormaPagamento({
        nome: formData.nome.trim(),
        tipo: formData.tipo,
        permite_parcelamento: formData.permite_parcelamento,
        ativo: formData.ativo
      })
      
      router.push('/formas-pagamento')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar forma de pagamento')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <LayoutPrincipal>
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            ← Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Nova Forma de Pagamento
            </h1>
            <p className="text-muted-foreground">
              Crie uma nova forma de pagamento para suas transações
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Forma de Pagamento *</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: PIX, Dinheiro, Cartão Visa..."
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  disabled={carregando}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as 'vista' | 'credito' | 'debito' }))}
                  disabled={carregando}
                >
                  <option value="vista">💵 À Vista</option>
                  <option value="credito">💳 Crédito</option>
                  <option value="debito">💳 Débito</option>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="permite_parcelamento"
                  type="checkbox"
                  checked={formData.permite_parcelamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, permite_parcelamento: e.target.checked }))}
                  disabled={carregando}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="permite_parcelamento" className="text-sm font-medium">
                  Permite parcelamento
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="ativo"
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                  disabled={carregando}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="ativo" className="text-sm font-medium">
                  Forma de pagamento ativa
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={carregando}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={carregando || !formData.nome.trim() || !formData.tipo}
                  className="flex-1"
                >
                  {carregando ? 'Criando...' : 'Criar Forma de Pagamento'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💡 Dicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>PIX:</strong> Configure como "À Vista" - não permite parcelamento</p>
              <p>• <strong>Dinheiro:</strong> Configure como "À Vista" - não permite parcelamento</p>
              <p>• <strong>Cartão de Crédito:</strong> Configure como "Crédito" - permite parcelamento</p>
              <p>• <strong>Cartão de Débito:</strong> Configure como "Débito" - não permite parcelamento</p>
              <p>• Use nomes específicos: "Cartão Nubank", "PIX" ao invés de "Cartão"</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}