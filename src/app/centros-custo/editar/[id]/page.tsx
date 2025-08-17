'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { 
  obterCentroCustoPorId, 
  atualizarCentroCusto 
} from '@/servicos/supabase/centros-custo'
import type { CentroCusto } from '@/tipos/database'

const cores = [
  { nome: 'Azul', valor: '#3B82F6' },
  { nome: 'Verde', valor: '#22C55E' },
  { nome: 'Vermelho', valor: '#EF4444' },
  { nome: 'Laranja', valor: '#F97316' },
  { nome: 'Roxo', valor: '#A855F7' },
  { nome: 'Rosa', valor: '#EC4899' },
  { nome: 'Amarelo', valor: '#EAB308' },
  { nome: 'Ciano', valor: '#06B6D4' },
  { nome: 'Cinza', valor: '#6B7280' },
  { nome: 'Marrom', valor: '#A3782A' }
]

export default function EditarCentroCustoPage() {
  const router = useRouter()
  const params = useParams()
  const centroCustoId = params.id as string
  
  const [centroCusto, setCentroCusto] = useState<CentroCusto | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#6B7280',
    ativo: true
  })

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro(null)
        
        const dados = await obterCentroCustoPorId(centroCustoId)
        
        if (!dados) {
          setErro('Centro de custo não encontrado')
          return
        }
        
        setCentroCusto(dados)
        setFormData({
          nome: dados.nome,
          descricao: dados.descricao || '',
          cor: dados.cor,
          ativo: dados.ativo
        })
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Erro ao carregar dados')
      } finally {
        setCarregando(false)
      }
    }
    
    if (centroCustoId) {
      carregarDados()
    }
  }, [centroCustoId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      setErro('Nome é obrigatório')
      return
    }

    try {
      setSalvando(true)
      setErro(null)
      
      await atualizarCentroCusto(centroCustoId, {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        cor: formData.cor,
        ativo: formData.ativo
      })
      
      router.push('/centros-custo')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar centro de custo')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <LayoutPrincipal>
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            Carregando centro de custo...
          </div>
        </div>
      </LayoutPrincipal>
    )
  }

  if (erro && !centroCusto) {
    return (
      <LayoutPrincipal>
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">❌ Erro</h4>
            <p className="text-sm text-red-700">{erro}</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/centros-custo')}
              className="mt-3"
            >
              Voltar para Centros de Custo
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
            ← Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Editar Centro de Custo
            </h1>
            <p className="text-muted-foreground">
              Altere as informações do centro de custo {centroCusto?.nome}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Centro de Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Centro de Custo *</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Reforma da Casa, Viagem de Férias, Trabalho..."
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  disabled={salvando}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                <Input
                  id="descricao"
                  type="text"
                  placeholder="Descreva o propósito ou objetivos deste centro de custo..."
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  disabled={salvando}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Cor *</Label>
                <div className="grid grid-cols-5 gap-2">
                  {cores.map((cor) => (
                    <button
                      key={cor.valor}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, cor: cor.valor }))}
                      disabled={salvando}
                      className={`flex flex-col items-center p-2 rounded-lg border-2 transition-colors ${
                        formData.cor === cor.valor 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={cor.nome}
                    >
                      <div 
                        className="w-8 h-8 rounded-full border border-gray-300" 
                        style={{ backgroundColor: cor.valor }}
                      />
                      <span className="text-xs mt-1">{cor.nome}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Ou digite uma cor:</span>
                  <input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                    disabled={salvando}
                    className="w-8 h-8 rounded border border-gray-300"
                  />
                  <span className="text-sm font-mono">{formData.cor}</span>
                </div>
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
                  Centro de custo ativo
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
                  disabled={salvando || !formData.nome.trim()}
                  className="flex-1"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {centroCusto && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>ID:</strong> {centroCusto.id}</p>
                <p><strong>Criado em:</strong> {new Date(centroCusto.created_at).toLocaleDateString('pt-BR')}</p>
                <p><strong>Status:</strong> {centroCusto.ativo ? 'Ativo' : 'Inativo'}</p>
                <div className="flex items-center gap-2">
                  <strong>Cor:</strong>
                  <div 
                    className="w-4 h-4 rounded border border-gray-300" 
                    style={{ backgroundColor: centroCusto.cor }}
                  />
                  <span className="font-mono">{centroCusto.cor}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutPrincipal>
  )
}