'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select } from '@/componentes/ui/select'
import { criarSubcategoria } from '@/servicos/supabase/subcategorias'
import { obterCategorias } from '@/servicos/supabase/categorias'
import type { Categoria } from '@/tipos/database'

export default function NovaSubcategoriaPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    categoria_id: '',
    ativo: true
  })

  useEffect(() => {
    async function carregarCategorias() {
      try {
        const dados = await obterCategorias()
        setCategorias(dados)
      } catch (error) {
        setErro('Erro ao carregar categorias')
      }
    }
    carregarCategorias()
  }, [])

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
      setCarregando(true)
      setErro(null)
      
      await criarSubcategoria({
        nome: formData.nome.trim(),
        categoria_id: formData.categoria_id,
        ativo: formData.ativo
      })
      
      router.push('/subcategorias')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar subcategoria')
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
              Nova Subcategoria
            </h1>
            <p className="text-muted-foreground">
              Crie uma nova subcategoria para detalhar suas transações
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
                  disabled={carregando}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                  disabled={carregando}
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
                  disabled={carregando}
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
                  disabled={carregando}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={carregando || !formData.nome.trim() || !formData.categoria_id}
                  className="flex-1"
                >
                  {carregando ? 'Criando...' : 'Criar Subcategoria'}
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
              <p>• Use nomes específicos: "Supermercado" ao invés de "Compras"</p>
              <p>• Subcategorias ajudam a detalhar onde você gasta dentro de cada categoria</p>
              <p>• Exemplo: Categoria "Alimentação" → Subcategorias: "Supermercado", "Restaurante", "Delivery"</p>
              <p>• Você pode desativar subcategorias que não usa mais</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}