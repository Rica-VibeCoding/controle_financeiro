'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select } from '@/componentes/ui/select'
import { 
  obterSubcategoriaPorId, 
  atualizarSubcategoria 
} from '@/servicos/supabase/subcategorias'
import { obterCategorias } from '@/servicos/supabase/categorias'
import type { Categoria, Subcategoria } from '@/tipos/database'

export default function EditarSubcategoriaPage() {
  const router = useRouter()
  const params = useParams()
  const subcategoriaId = params.id as string
  
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategoria, setSubcategoria] = useState<Subcategoria | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    categoria_id: '',
    ativo: true
  })

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro(null)
        
        const [dadosSubcategoria, dadosCategorias] = await Promise.all([
          obterSubcategoriaPorId(subcategoriaId),
          obterCategorias()
        ])
        
        if (!dadosSubcategoria) {
          setErro('Subcategoria não encontrada')
          return
        }
        
        setSubcategoria(dadosSubcategoria)
        setCategorias(dadosCategorias)
        setFormData({
          nome: dadosSubcategoria.nome,
          categoria_id: dadosSubcategoria.categoria_id || '',
          ativo: dadosSubcategoria.ativo
        })
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Erro ao carregar dados')
      } finally {
        setCarregando(false)
      }
    }
    
    if (subcategoriaId) {
      carregarDados()
    }
  }, [subcategoriaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      setErro('Nome é obrigatório')
      return
    }
    
    if (!formData.categoria_id) {
      setErro('Categoria é obrigatória')
      return
    }

    try {
      setSalvando(true)
      setErro(null)
      
      await atualizarSubcategoria(subcategoriaId, {
        nome: formData.nome.trim(),
        categoria_id: formData.categoria_id,
        ativo: formData.ativo
      })
      
      router.push('/subcategorias')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar subcategoria')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <LayoutPrincipal>
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            Carregando subcategoria...
          </div>
        </div>
      </LayoutPrincipal>
    )
  }

  if (erro && !subcategoria) {
    return (
      <LayoutPrincipal>
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">❌ Erro</h4>
            <p className="text-sm text-red-700">{erro}</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/subcategorias')}
              className="mt-3"
            >
              Voltar para Subcategorias
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
              Editar Subcategoria
            </h1>
            <p className="text-muted-foreground">
              Altere as informações da subcategoria {subcategoria?.nome}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Subcategoria</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Subcategoria *</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Supermercado, Restaurante, Gasolina..."
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  disabled={salvando}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                  disabled={salvando}
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </Select>
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
                  Subcategoria ativa
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
                  disabled={salvando || !formData.nome.trim() || !formData.categoria_id}
                  className="flex-1"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {subcategoria && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>ID:</strong> {subcategoria.id}</p>
                <p><strong>Criada em:</strong> {new Date(subcategoria.created_at).toLocaleDateString('pt-BR')}</p>
                <p><strong>Status:</strong> {subcategoria.ativo ? 'Ativa' : 'Inativa'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutPrincipal>
  )
}