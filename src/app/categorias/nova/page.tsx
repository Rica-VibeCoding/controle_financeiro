'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select } from '@/componentes/ui/select'
import { criarCategoria } from '@/servicos/supabase/categorias'
import { usarToast } from '@/hooks/usar-toast'
import { IconePicker } from '@/componentes/ui/icone-picker'

const CORES_CATEGORIAS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#dc2626', '#ea580c', '#ca8a04',
  '#16a34a', '#0891b2', '#2563eb', '#7c3aed'
]

export default function NovaCategoriaPage() {
  const router = useRouter()
  const { toast } = usarToast()
  
  const [carregando, setCarregando] = useState(false)
  const [dados, setDados] = useState({
    nome: '',
    tipo: '' as 'receita' | 'despesa' | 'ambos' | '',
    icone: 'banknote',
    cor: '#3b82f6',
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
      
      await criarCategoria({
        nome: dados.nome.trim(),
        tipo: dados.tipo as 'receita' | 'despesa' | 'ambos',
        icone: dados.icone,
        cor: dados.cor,
        ativo: dados.ativo
      })

      toast({
        title: "Categoria criada!",
        description: `A categoria "${dados.nome}" foi criada com sucesso.`,
        variant: "default"
      })

      router.push('/categorias')
    } catch (error) {
      toast({
        title: "Erro ao criar categoria",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "error"
      })
    } finally {
      setCarregando(false)
    }
  }

  const handleVoltar = () => {
    router.push('/categorias')
  }

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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Nova Categoria
            </h1>
            <p className="text-muted-foreground">
              Crie uma nova categoria para organizar suas transações
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
              Preencha os dados da nova categoria
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
                  <option value="">Selecione o tipo da categoria</option>
                  <option value="receita">💰 Receita</option>
                  <option value="despesa">💸 Despesa</option>
                  <option value="ambos">🔄 Ambos (Receita e Despesa)</option>
                </Select>
              </div>

              {/* Ícone */}
              <IconePicker
                iconeSelecionado={dados.icone}
                onIconeChange={(icone) => setDados(prev => ({ ...prev, icone }))}
                disabled={carregando}
              />

              {/* Cor */}
              <div className="space-y-2">
                <Label>Cor *</Label>
                <div className="grid grid-cols-8 gap-2">
                  {CORES_CATEGORIAS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setDados(prev => ({ ...prev, cor }))}
                      disabled={carregando}
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
                  {carregando ? 'Criando...' : 'Criar Categoria'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}