'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select } from '@/componentes/ui/select'
import { 
  obterFormaPagamentoPorId, 
  atualizarFormaPagamento 
} from '@/servicos/supabase/formas-pagamento'
import type { FormaPagamento } from '@/tipos/database'

export default function EditarFormaPagamentoPage() {
  const router = useRouter()
  const params = useParams()
  const formaPagamentoId = params.id as string
  
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'vista' as 'vista' | 'credito' | 'debito',
    permite_parcelamento: false,
    ativo: true
  })

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro(null)
        
        const dados = await obterFormaPagamentoPorId(formaPagamentoId)
        
        if (!dados) {
          setErro('Forma de pagamento não encontrada')
          return
        }
        
        setFormaPagamento(dados)
        setFormData({
          nome: dados.nome,
          tipo: dados.tipo as 'vista' | 'credito' | 'debito',
          permite_parcelamento: dados.permite_parcelamento,
          ativo: dados.ativo
        })
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Erro ao carregar dados')
      } finally {
        setCarregando(false)
      }
    }
    
    if (formaPagamentoId) {
      carregarDados()
    }
  }, [formaPagamentoId])

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
      setSalvando(true)
      setErro(null)
      
      await atualizarFormaPagamento(formaPagamentoId, {
        nome: formData.nome.trim(),
        tipo: formData.tipo,
        permite_parcelamento: formData.permite_parcelamento,
        ativo: formData.ativo
      })
      
      router.push('/formas-pagamento')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar forma de pagamento')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <LayoutPrincipal>
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            Carregando forma de pagamento...
          </div>
        </div>
      </LayoutPrincipal>
    )
  }

  if (erro && !formaPagamento) {
    return (
      <LayoutPrincipal>
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">❌ Erro</h4>
            <p className="text-sm text-red-700">{erro}</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/formas-pagamento')}
              className="mt-3"
            >
              Voltar para Formas de Pagamento
            </Button>
          </div>
        </div>
      </LayoutPrincipal>
    )
  }

  return (
    <LayoutPrincipal>
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <Icone name="chevron-left" className="w-4 h-4 mr-1" aria-hidden="true" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Editar Forma de Pagamento
            </h1>
            <p className="text-muted-foreground">
              Altere as informações da forma de pagamento {formaPagamento?.nome}
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
                  disabled={salvando}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as 'vista' | 'credito' | 'debito' }))}
                  disabled={salvando}
                >
                  <option value="vista">À Vista</option>
                  <option value="credito">Crédito</option>
                  <option value="debito">Débito</option>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="permite_parcelamento"
                  type="checkbox"
                  checked={formData.permite_parcelamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, permite_parcelamento: e.target.checked }))}
                  disabled={salvando}
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
                  disabled={salvando}
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
                  disabled={salvando}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={salvando || !formData.nome.trim() || !formData.tipo}
                  className="flex-1"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {formaPagamento && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icone name="file-text" className="w-4 h-4" aria-hidden="true" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>ID:</strong> {formaPagamento.id}</p>
                <p><strong>Criada em:</strong> {new Date(formaPagamento.created_at).toLocaleDateString('pt-BR')}</p>
                <p><strong>Status:</strong> {formaPagamento.ativo ? 'Ativa' : 'Inativa'}</p>
                <p><strong>Permite Parcelamento:</strong> {formaPagamento.permite_parcelamento ? 'Sim' : 'Não'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutPrincipal>
  )
}