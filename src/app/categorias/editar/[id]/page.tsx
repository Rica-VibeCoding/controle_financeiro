'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select } from '@/componentes/ui/select'
import { obterCategorias, atualizarCategoria } from '@/servicos/supabase/categorias'
import { usarToast } from '@/hooks/usar-toast'
import type { Categoria } from '@/tipos/database'

const ICONES_CATEGORIAS = [
  '🍕', '🛒', '🏠', '🚗', '💊', '🎓', '🎮', '🎭',
  '💼', '💳', '🛍️', '⛽', '🍽️', '🚇', '🏥', '🎸',
  '📚', '🧾', '💰', '📱', '💡', '🚲', '✈️', '🎯'
]

const CORES_CATEGORIAS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#dc2626', '#ea580c', '#ca8a04',
  '#16a34a', '#0891b2', '#2563eb', '#7c3aed'
]

export default function EditarCategoriaPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = usarToast()
  
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [categoria, setCategoria] = useState<Categoria | null>(null)
  const [dados, setDados] = useState({
    nome: '',
    tipo: '' as 'receita' | 'despesa' | 'ambos' | '',
    icone: '🏷️',
    cor: '#3b82f6',
    ativo: true
  })
  const [erros, setErros] = useState<string[]>([])

  // Carregar categoria atual
  useEffect(() => {
    async function carregarCategoria() {
      try {
        setCarregando(true)
        const categorias = await obterCategorias(true) // incluir inativas
        const categoriaEncontrada = categorias.find(c => c.id === params.id)
        
        if (!categoriaEncontrada) {
          toast({
            title: "Categoria não encontrada",
            description: "A categoria que você tentou editar não existe.",
            variant: "error"
          })
          router.push('/categorias')
          return
        }

        setCategoria(categoriaEncontrada)
        setDados({
          nome: categoriaEncontrada.nome,
          tipo: categoriaEncontrada.tipo,
          icone: categoriaEncontrada.icone,
          cor: categoriaEncontrada.cor,
          ativo: categoriaEncontrada.ativo
        })
      } catch (error) {
        toast({
          title: "Erro ao carregar categoria",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "error"
        })
        router.push('/categorias')
      } finally {
        setCarregando(false)
      }
    }

    if (params.id) {
      carregarCategoria()
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

    if (!dados.icone) {
      novosErros.push('Ícone é obrigatório')
    }

    if (!dados.cor) {
      novosErros.push('Cor é obrigatória')
    }

    setErros(novosErros)
    return novosErros.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoria) return

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
      
      await atualizarCategoria(categoria.id, {
        nome: dados.nome.trim(),
        tipo: dados.tipo as 'receita' | 'despesa' | 'ambos',
        icone: dados.icone,
        cor: dados.cor,
        ativo: dados.ativo
      })

      toast({
        title: "Categoria atualizada!",
        description: `A categoria "${dados.nome}" foi atualizada com sucesso.`,
        variant: "success"
      })

      router.push('/categorias')
    } catch (error) {
      toast({
        title: "Erro ao atualizar categoria",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "error"
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleVoltar = () => {
    router.push('/categorias')
  }

  if (carregando) {
    return (
      <LayoutPrincipal>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Carregando categoria...
              </div>
            </CardContent>
          </Card>
        </div>
      </LayoutPrincipal>
    )
  }

  if (!categoria) {
    return (
      <LayoutPrincipal>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                Categoria não encontrada
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
              Editar Categoria
            </h1>
            <p className="text-muted-foreground">
              Atualize os dados da categoria "{categoria.nome}"
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
            <CardTitle>Informações da Categoria</CardTitle>
            <CardDescription>
              Atualize os dados da categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Categoria *</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Alimentação, Transporte, Salário..."
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
                  <option value="">Selecione o tipo da categoria</option>
                  <option value="receita">💰 Receita</option>
                  <option value="despesa">💸 Despesa</option>
                  <option value="ambos">🔄 Ambos (Receita e Despesa)</option>
                </Select>
              </div>

              {/* Ícone */}
              <div className="space-y-2">
                <Label>Ícone *</Label>
                <div className="grid grid-cols-8 gap-2">
                  {ICONES_CATEGORIAS.map((icone) => (
                    <button
                      key={icone}
                      type="button"
                      onClick={() => setDados(prev => ({ ...prev, icone }))}
                      disabled={salvando}
                      className={`
                        p-3 text-xl rounded-lg border-2 transition-colors
                        hover:bg-accent hover:text-accent-foreground
                        ${dados.icone === icone 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border'
                        }
                      `}
                    >
                      {icone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cor */}
              <div className="space-y-2">
                <Label>Cor *</Label>
                <div className="grid grid-cols-8 gap-2">
                  {CORES_CATEGORIAS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setDados(prev => ({ ...prev, cor }))}
                      disabled={salvando}
                      style={{ backgroundColor: cor }}
                      className={`
                        w-8 h-8 rounded-full border-2 transition-transform
                        hover:scale-110
                        ${dados.cor === cor 
                          ? 'border-foreground border-4' 
                          : 'border-border'
                        }
                      `}
                    />
                  ))}
                </div>
              </div>

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
                      <span className="text-2xl">{dados.icone}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: dados.cor }}>●</span>
                          <span className="font-medium">
                            {dados.nome || 'Nome da categoria'}
                          </span>
                          {!dados.ativo && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              INATIVA
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dados.tipo === 'receita' ? '💰 Receita' : 
                           dados.tipo === 'despesa' ? '💸 Despesa' : 
                           dados.tipo === 'ambos' ? '🔄 Ambos' : 'Selecione o tipo'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

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