'use client'

import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { useState, useEffect } from 'react'
import { useMetasMensais } from '@/hooks/usar-metas-mensais'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'
import { gerarMesReferencia, formatarMesReferencia } from '@/utilitarios/metas-helpers'
import { obterIconePorNome } from '@/componentes/ui/icone-picker'
import { Loader2, Save, Check } from 'lucide-react'

export default function ConfiguracaoMetasPage() {
  const { dados, recarregarDados } = useDadosAuxiliares()
  const { categorias } = dados
  const { 
    metasDoMes, 
    loading, 
    carregarMetasDoMes 
  } = useMetasMensais()
  
  const [valoresEdicao, setValoresEdicao] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState<Record<string, boolean>>({})
  const [salvos, setSalvos] = useState<Record<string, boolean>>({})
  
  const mesAtual = gerarMesReferencia()

  useEffect(() => {
    carregarMetasDoMes(mesAtual)
  }, [carregarMetasDoMes, mesAtual])

  // Recarregar quando categorias mudarem (nova categoria, alteração de cor/ícone)
  useEffect(() => {
    if (categorias.length > 0) {
      // Força recarregamento das metas para sincronizar com novas categorias
      carregarMetasDoMes(mesAtual)
    }
  }, [categorias.length, carregarMetasDoMes, mesAtual])

  useEffect(() => {
    const novosValores: Record<string, string> = {}
    metasDoMes.forEach(meta => {
      novosValores[meta.categoria_id] = meta.valor_meta.toString()
    })
    setValoresEdicao(novosValores)
  }, [metasDoMes])

  const obterValorMeta = (categoriaId: string): string => {
    return valoresEdicao[categoriaId] || '0'
  }

  const atualizarValor = (categoriaId: string, valor: string) => {
    const valorNumerico = valor.replace(/[^\d]/g, '')
    setValoresEdicao(prev => ({
      ...prev,
      [categoriaId]: valorNumerico
    }))
  }

  const salvarMetaLocal = async (categoriaId: string) => {
    const valor = parseFloat(valoresEdicao[categoriaId] || '0')
    
    if (valor < 0) return

    setSalvando(prev => ({ ...prev, [categoriaId]: true }))
    
    try {
      // Simulação de salvamento por enquanto
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSalvos(prev => ({ ...prev, [categoriaId]: true }))
      setTimeout(() => {
        setSalvos(prev => ({ ...prev, [categoriaId]: false }))
      }, 2000)
      
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    } finally {
      setSalvando(prev => ({ ...prev, [categoriaId]: false }))
    }
  }

  const handleEnterPress = (categoriaId: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      salvarMetaLocal(categoriaId)
    }
  }

  // Formatação simples de moeda
  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (loading) {
    return (
      <LayoutPrincipal>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </LayoutPrincipal>
    )
  }

  return (
    <LayoutPrincipal>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            🎯 Configurar Metas
          </h1>
          <p className="text-muted-foreground mt-1">
            {formatarMesReferencia(mesAtual)}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Metas por Categoria</CardTitle>
            <CardDescription>
              Defina o valor máximo que deseja gastar em cada categoria neste mês
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {categorias.map((categoria) => (
                <div 
                  key={categoria.id} 
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span style={{ color: categoria.cor }} className="text-lg">●</span>
                    {(() => {
                      const IconeComponente = obterIconePorNome(categoria.icone)
                      return <IconeComponente 
                        key={`${categoria.id}-${categoria.icone}-${categoria.cor}`}
                        size={20} 
                        style={{ color: categoria.cor }} 
                      />
                    })()}
                    <div className="font-medium text-foreground">
                      {categoria.nome}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      value={formatarMoeda(parseFloat(obterValorMeta(categoria.id)) || 0)}
                      onChange={(e) => atualizarValor(categoria.id, e.target.value)}
                      onKeyDown={(e) => handleEnterPress(categoria.id, e)}
                      className="w-32 text-right"
                      placeholder="0,00"
                    />
                    <Button
                      size="sm"
                      onClick={() => salvarMetaLocal(categoria.id)}
                      disabled={salvando[categoria.id]}
                      variant={salvos[categoria.id] ? "default" : "outline"}
                      className="w-10 h-10 p-0 shrink-0"
                    >
                      {salvando[categoria.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : salvos[categoria.id] ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {categorias.length === 0 && (
              <div className="text-center py-12 text-muted-foreground px-6">
                <div className="space-y-2">
                  <div className="text-4xl">🎯</div>
                  <p>Nenhuma categoria encontrada</p>
                  <p className="text-sm">
                    Cadastre categorias primeiro em Cadastramento → Categorias
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>💡 <strong>Dicas:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Pressione Enter para salvar rapidamente</li>
                <li>Use R$ 0 para categorias sem limite</li>
                <li>As metas se renovam automaticamente todo mês</li>
                <li>Cores e ícones sincronizam com as categorias</li>
                <li>Novas categorias aparecem automaticamente aqui</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}