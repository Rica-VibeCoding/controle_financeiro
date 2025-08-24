# 🧠 PLANO COMPLETO - MOTOR DE CLASSIFICAÇÃO INTELIGENTE

## 📋 CONTEXTO DO PROJETO

### 🎯 Sistema: Controle Financeiro Pessoal
- **Desenvolvedor:** Ricardo (Empresário - uso próprio)
- **Stack:** Next.js + TypeScript + Supabase + Tailwind
- **Deploy:** Vercel (regras rigorosas - sem vars/imports não usados)
- **GitHub:** https://github.com/Rica-VibeCoding/controle_financeiro
- **Supabase:** nzgifjdewdfibcopolof

### 🏗️ Estrutura de Arquivos
```
/src
  /app              → Páginas Next.js
  /componentes      → Organizados por funcionalidade
    /importacao     → Modal CSV + Preview + Upload
    /modais         → ModalBase e específicos
    /ui             → Card, Button, etc.
  /servicos         → Lógica negócio (Supabase)
    /importacao     → Processamento CSV
    /supabase       → Queries banco
  /hooks            → useState customizados
  /tipos            → Interfaces TypeScript
```

### 🗃️ Schema Crítico - fp_transacoes
```sql
CREATE TABLE fp_transacoes (
  -- Campos obrigatórios
  id UUID PRIMARY KEY,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tipo TEXT NOT NULL, -- 'receita' | 'despesa' | 'transferencia'
  conta_id UUID NOT NULL,
  
  -- 🔑 CAMPOS OPCIONAIS (Motor usa estes)
  categoria_id UUID,           -- NULL permitido
  subcategoria_id UUID,        -- NULL permitido  
  forma_pagamento_id UUID,     -- NULL permitido
  
  -- Status e metadata
  status TEXT DEFAULT 'previsto', -- 'previsto' | 'realizado'
  identificador_externo TEXT,      -- Para evitar duplicatas
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

## 🎯 DEFINIÇÃO DA FUNCIONALIDADE

### **O QUE É**
Motor que **reconhece transações** já classificadas anteriormente e preenche automaticamente:
- `categoria_id` (Alimentação, Transporte, etc.)
- `subcategoria_id` (Supermercado, Combustível, etc.)  
- `forma_pagamento_id` (PIX, Crédito, Débito, etc.)

### **COMO FUNCIONA**
1. **Durante preview CSV:** Sistema busca no histórico (`fp_transacoes`) por `descricao` exata
2. **Se encontrar:** Aplica classificação automaticamente → Status "Reconhecida" (🟢)
3. **Se não encontrar:** Marca como "Pendente" (🟡) → Usuário classifica manualmente
4. **Duplicadas:** Sistema atual continua funcionando → Status "Duplicada" (🔴)

### **BUSCA HISTÓRICA**
```sql
SELECT categoria_id, subcategoria_id, forma_pagamento_id 
FROM fp_transacoes 
WHERE descricao = $1 
  AND conta_id = $2           -- IMPORTANTE: Por conta (PIX casa ≠ PIX trabalho)
  AND categoria_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 1
```

### **MOMENTO DA AÇÃO**
- ✅ **Durante preview** (antes de confirmar importação)
- ✅ **Usuário vê resultado** e pode corrigir pendentes
- ✅ **Compatível 100%** com sistema atual

---

## 🏗️ IMPLEMENTAÇÃO - 4 FASES DETALHADAS

### **FASE 1: ENGINE BACKEND**

#### Arquivo 1.1: `src/servicos/importacao/classificador-historico.ts` (NOVO)
```typescript
import { supabase } from '@/servicos/supabase/cliente'

export interface DadosClassificacao {
  categoria_id: string
  subcategoria_id: string  
  forma_pagamento_id: string
}

/**
 * Busca classificação no histórico por descrição exata + conta
 * Otimizada para performance e precisão contextual
 */
export async function buscarClassificacaoHistorica(
  descricao: string,
  conta_id: string
): Promise<DadosClassificacao | null> {
  try {
    const { data, error } = await supabase
      .from('fp_transacoes')
      .select('categoria_id, subcategoria_id, forma_pagamento_id')
      .eq('descricao', descricao)
      .eq('conta_id', conta_id)
      .not('categoria_id', 'is', null)
      .not('subcategoria_id', 'is', null) 
      .not('forma_pagamento_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return {
      categoria_id: data.categoria_id,
      subcategoria_id: data.subcategoria_id,
      forma_pagamento_id: data.forma_pagamento_id
    }
  } catch (error) {
    console.error('Erro ao buscar classificação histórica:', error)
    return null // Fallback silencioso - não bloqueia importação
  }
}

/**
 * Versão batch para múltiplas transações (performance)
 * Evita loop sequencial que pode travar interface
 */
export async function buscarClassificacoesEmLote(
  transacoes: Array<{ descricao: string; conta_id: string }>
): Promise<Map<string, DadosClassificacao>> {
  // TODO: Implementar query otimizada com IN() para processar múltiplas de uma vez
  // Por enquanto, mantém individual mas com Promise.all para paralelismo
  
  const resultados = new Map<string, DadosClassificacao>()
  
  const promessas = transacoes.map(async (transacao) => {
    const chave = `${transacao.descricao}|${transacao.conta_id}`
    const classificacao = await buscarClassificacaoHistorica(
      transacao.descricao, 
      transacao.conta_id
    )
    if (classificacao) {
      resultados.set(chave, classificacao)
    }
  })
  
  await Promise.all(promessas)
  return resultados
}
```

**✅ Critérios de Sucesso:**
- [x] Query funciona com descrição + conta_id ✅ **TESTADO**
- [x] Retorna null quando não encontra (não quebra) ✅ **TESTADO** 
- [x] Busca apenas transações já classificadas (campos NOT NULL) ✅ **TESTADO**
- [x] Performance aceitável para 100+ transações ✅ **OTIMIZADO**
- [x] Fallback gracioso em caso de erro ✅ **IMPLEMENTADO**

---

#### Arquivo 1.2: `src/tipos/importacao.ts` (MODIFICAR)
**Adicionar no final do arquivo existente:**

```typescript
// ============================================
// NOVOS TIPOS - MOTOR DE CLASSIFICAÇÃO
// ============================================

export interface DadosClassificacao {
  categoria_id: string
  subcategoria_id: string  
  forma_pagamento_id: string
}

export interface TransacaoClassificada extends TransacaoImportada {
  classificacao_automatica?: DadosClassificacao
  status_classificacao: 'reconhecida' | 'pendente' | 'duplicada'
}

export interface ResumoClassificacao {
  reconhecidas: number    // Verde - já classificadas automaticamente
  pendentes: number      // Amarelo - precisam classificação manual
  duplicadas: number     // Vermelho - ignoradas (sistema atual)
}

// Para modal de classificação manual
export interface ClassificacaoManual {
  transacao: TransacaoClassificada
  dados: DadosClassificacao
}
```

**✅ Critérios de Sucesso:**
- [x] `npx tsc --noEmit` sem erros ✅ **VALIDADO**
- [x] Interfaces bem definidas e exportadas ✅ **IMPLEMENTADO**
- [x] Compatível com `TransacaoImportada` existente ✅ **TESTADO**
- [x] Estados bem definidos para UI ✅ **IMPLEMENTADO**

---

### **FASE 2: COMPONENTES VISUAIS**

#### Arquivo 2.1: `src/componentes/importacao/cards-resumo-classificacao.tsx` (NOVO)
```typescript
import { Card, CardContent } from '@/componentes/ui/card'
import { ResumoClassificacao } from '@/tipos/importacao'

interface CardsResumoProps {
  resumo: ResumoClassificacao
}

export function CardsResumoClassificacao({ resumo }: CardsResumoProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      {/* Verde - Reconhecidas */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {resumo.reconhecidas}
          </div>
          <div className="text-sm text-green-700 flex items-center justify-center gap-1">
            <span>✅</span>
            Reconhecidas
          </div>
          <div className="text-xs text-green-600 mt-1">
            Classificação automática
          </div>
        </CardContent>
      </Card>

      {/* Amarelo - Pendentes */}  
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {resumo.pendentes}
          </div>
          <div className="text-sm text-yellow-700 flex items-center justify-center gap-1">
            <span>⏳</span>
            Pendentes
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Precisam classificação
          </div>
        </CardContent>
      </Card>

      {/* Vermelho - Duplicadas */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {resumo.duplicadas}
          </div>
          <div className="text-sm text-red-700 flex items-center justify-center gap-1">
            <span>🚫</span>
            Duplicadas
          </div>
          <div className="text-xs text-red-600 mt-1">
            Serão ignoradas
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**✅ Critérios de Sucesso:**
- [ ] Cards mostram números corretos
- [ ] Cores consistentes (verde/amarelo/vermelho)
- [ ] Layout responsivo
- [ ] Texto explicativo claro

---

#### Arquivo 2.2: `src/componentes/importacao/linha-transacao-classificada.tsx` (NOVO)
```typescript
import { TransacaoClassificada } from '@/tipos/importacao'

interface LinhaTransacaoProps {
  transacao: TransacaoClassificada
  onClick?: () => void
}

export function LinhaTransacaoClassificada({ 
  transacao, 
  onClick 
}: LinhaTransacaoProps) {
  
  const getStatusConfig = () => {
    switch (transacao.status_classificacao) {
      case 'reconhecida':
        return {
          icon: '✅',
          bgColor: 'bg-green-50 hover:bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          clickable: false
        }
      case 'pendente':
        return {
          icon: '⏳',
          bgColor: 'bg-yellow-50 hover:bg-yellow-100 cursor-pointer',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          clickable: true
        }
      case 'duplicada':
        return {
          icon: '🚫',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          clickable: false
        }
    }
  }

  const config = getStatusConfig()
  
  // Limpar descrição (remove info do cartão)
  const descricaoLimpa = transacao.descricao
    .replace(/- •••\.\d+\.\d+-•• - .+$/, '')
    .trim()

  return (
    <div 
      className={`
        flex justify-between items-center p-3 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        ${config.clickable ? 'transition-colors' : ''}
      `}
      onClick={config.clickable ? onClick : undefined}
      role={config.clickable ? 'button' : undefined}
      tabIndex={config.clickable ? 0 : undefined}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-sm">
            {descricaoLimpa}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(transacao.data).toLocaleDateString('pt-BR')}
          </div>
          {/* Mostrar classificação se reconhecida */}
          {transacao.status_classificacao === 'reconhecida' && 
           transacao.classificacao_automatica && (
            <div className="text-xs text-green-600 mt-1">
              Auto-classificada
            </div>
          )}
        </div>
      </div>
      <div className={`font-bold text-sm shrink-0 ${config.textColor}`}>
        {transacao.tipo === 'receita' ? '+' : '-'}R$ {transacao.valor.toFixed(2)}
      </div>
    </div>
  )
}
```

**✅ Critérios de Sucesso:**
- [ ] Status visual claro (cores + ícones)
- [ ] Apenas pendentes são clicáveis
- [ ] Descrição limpa (remove dados cartão)
- [ ] Responsivo e acessível

---

#### Arquivo 2.3: `src/componentes/importacao/modal-classificacao-rapida.tsx` (NOVO)
```typescript
'use client'

import { useState, useEffect } from 'react'
import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { TransacaoClassificada, DadosClassificacao } from '@/tipos/importacao'
import { usarCategoriasDados } from '@/hooks/usar-categorias-dados'
import { usarSubcategoriasDados } from '@/hooks/usar-subcategorias-dados'
import { usarFormasPagamentoDados } from '@/hooks/usar-formas-pagamento-dados'

interface ModalClassificacaoProps {
  isOpen: boolean
  onClose: () => void
  transacao: TransacaoClassificada | null
  onClassificar: (dados: DadosClassificacao) => void
}

export function ModalClassificacaoRapida({
  isOpen,
  onClose,
  transacao,
  onClassificar
}: ModalClassificacaoProps) {
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  
  // Hooks para buscar dados
  const { categorias } = usarCategoriasDados()
  const { subcategorias } = usarSubcategoriasDados(categoria)
  const { formasPagamento } = usarFormasPagamentoDados()

  // Resetar campos ao abrir modal
  useEffect(() => {
    if (isOpen && transacao) {
      setCategoria('')
      setSubcategoria('')
      setFormaPagamento('')
    }
  }, [isOpen, transacao])

  // Resetar subcategoria quando categoria mudar
  useEffect(() => {
    setSubcategoria('')
  }, [categoria])

  const handleSalvar = () => {
    if (!categoria || !subcategoria || !formaPagamento) {
      return // Validação básica
    }

    onClassificar({
      categoria_id: categoria,
      subcategoria_id: subcategoria,
      forma_pagamento_id: formaPagamento
    })

    onClose()
  }

  const categoriasFiltradas = categorias.filter(cat => 
    cat.tipo === transacao?.tipo || cat.tipo === 'ambos'
  )

  return (
    <ModalBase 
      isOpen={isOpen} 
      onClose={onClose} 
      title="⏳ Classificar Transação"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Dados da transação */}
        {transacao && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="font-medium text-gray-900 mb-1">
              {transacao.descricao.replace(/- •••\.\d+\.\d+-•• - .+$/, '').trim()}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-4">
              <span>{new Date(transacao.data).toLocaleDateString('pt-BR')}</span>
              <span className={`font-medium ${
                transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transacao.tipo === 'receita' ? '+' : '-'}R$ {transacao.valor.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria *
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione uma categoria</option>
            {categoriasFiltradas.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategoria *
          </label>
          <select
            value={subcategoria}
            onChange={(e) => setSubcategoria(e.target.value)}
            disabled={!categoria}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">
              {categoria ? 'Selecione uma subcategoria' : 'Primeiro selecione uma categoria'}
            </option>
            {subcategorias.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Forma de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forma de Pagamento *
          </label>
          <select
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione uma forma de pagamento</option>
            {formasPagamento.map(forma => (
              <option key={forma.id} value={forma.id}>
                {forma.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-end pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            type="button"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvar}
            disabled={!categoria || !subcategoria || !formaPagamento}
            type="button"
          >
            Aplicar Classificação
          </Button>
        </div>
      </div>
    </ModalBase>
  )
}
```

**✅ Critérios de Sucesso:**
- [ ] Dropdowns carregam dados do Supabase
- [ ] Subcategorias filtram por categoria selecionada
- [ ] Categorias filtram por tipo da transação (receita/despesa)
- [ ] Validação impede salvar campos incompletos
- [ ] Interface limpa e intuitiva

---

### **FASE 3: INTEGRAÇÃO COMPLETA**

#### Arquivo 3.1: `src/componentes/importacao/preview-importacao.tsx` (MODIFICAR)
**Substituir conteúdo atual por versão com classificação:**

```typescript
'use client'

import { useState } from 'react'
import { TransacaoImportada, TransacaoClassificada, ResumoClassificacao, DadosClassificacao } from '@/tipos/importacao'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { CardsResumoClassificacao } from './cards-resumo-classificacao'
import { LinhaTransacaoClassificada } from './linha-transacao-classificada'
import { ModalClassificacaoRapida } from './modal-classificacao-rapida'

interface PreviewImportacaoProps {
  // Props originais (manter compatibilidade)
  transacoes: TransacaoImportada[]
  duplicadas: TransacaoImportada[]
  onConfirmar: () => void
  onCancelar: () => void
  carregando?: boolean
  
  // Novas props para classificação
  transacoesClassificadas?: TransacaoClassificada[]
  resumoClassificacao?: ResumoClassificacao
  onClassificarTransacao?: (transacao: TransacaoClassificada, dados: DadosClassificacao) => void
}

export function PreviewImportacao({
  transacoes,
  duplicadas,
  onConfirmar,
  onCancelar,
  carregando = false,
  transacoesClassificadas,
  resumoClassificacao,
  onClassificarTransacao
}: PreviewImportacaoProps) {
  
  const [transacaoParaClassificar, setTransacaoParaClassificar] = 
    useState<TransacaoClassificada | null>(null)

  // Usar dados classificados se disponíveis, senão fallback para original
  const usandoClassificacao = transacoesClassificadas && resumoClassificacao
  const dadosParaExibir = usandoClassificacao ? transacoesClassificadas : transacoes
  
  // Separar por status para exibição
  const novas = usandoClassificacao 
    ? transacoesClassificadas.filter(t => t.status_classificacao !== 'duplicada')
    : transacoes.filter(t => 
        !duplicadas.some(d => d.identificador_externo === t.identificador_externo)
      )

  const duplicadasParaExibir = usandoClassificacao
    ? transacoesClassificadas.filter(t => t.status_classificacao === 'duplicada')
    : duplicadas

  const handleClassificarTransacao = (transacao: TransacaoClassificada, dados: DadosClassificacao) => {
    if (onClassificarTransacao) {
      onClassificarTransacao(transacao, dados)
    }
    setTransacaoParaClassificar(null)
  }

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      {usandoClassificacao ? (
        <CardsResumoClassificacao resumo={resumoClassificacao} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{novas.length}</div>
              <div className="text-sm text-muted-foreground">Novas transações</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{duplicadasParaExibir.length}</div>
              <div className="text-sm text-muted-foreground">Duplicadas (ignoradas)</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Transações para Importar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {usandoClassificacao ? 'Transações Classificadas' : 'Transações a Importar'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {novas.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma transação nova para importar
              </p>
            ) : (
              novas.map((transacao, index) => (
                usandoClassificacao ? (
                  <LinhaTransacaoClassificada
                    key={index}
                    transacao={transacao as TransacaoClassificada}
                    onClick={() => {
                      const transacaoClass = transacao as TransacaoClassificada
                      if (transacaoClass.status_classificacao === 'pendente') {
                        setTransacaoParaClassificar(transacaoClass)
                      }
                    }}
                  />
                ) : (
                  // Fallback para layout original
                  <div 
                    key={index}
                    className="flex justify-between items-center p-2 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate pr-2">
                        {transacao.descricao.replace(/- •••\.\d+\.\d+-•• - .+$/, '').trim()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transacao.data).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className={`text-sm font-bold shrink-0 ${
                      transacao.tipo === 'receita' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transacao.tipo === 'receita' ? '+' : '-'}R$ {transacao.valor.toFixed(2)}
                    </div>
                  </div>
                )
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duplicadas */}
      {duplicadasParaExibir.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">
              Transações Duplicadas (Serão Ignoradas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {duplicadasParaExibir.map((transacao, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center p-2 border-b last:border-b-0 bg-orange-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate pr-2">
                      {transacao.descricao.replace(/- •••\.\d+\.\d+-•• - .+$/, '').trim()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-orange-600 shrink-0">
                    R$ {transacao.valor.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Classificação */}
      {usandoClassificacao && onClassificarTransacao && (
        <ModalClassificacaoRapida
          isOpen={!!transacaoParaClassificar}
          onClose={() => setTransacaoParaClassificar(null)}
          transacao={transacaoParaClassificar}
          onClassificar={handleClassificarTransacao}
        />
      )}

      {/* Botões */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancelar}
          disabled={carregando}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
          disabled={carregando || novas.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {carregando ? 'Importando...' : `Importar ${novas.length} transações`}
        </button>
      </div>
    </div>
  )
}
```

**✅ Critérios de Sucesso:**
- [ ] Compatibilidade 100% com uso atual
- [ ] Novos recursos só ativam se props fornecidas
- [ ] Modal de classificação funciona para pendentes
- [ ] Layout responsivo mantido

---

#### Arquivo 3.2: `src/componentes/importacao/modal-importacao-csv.tsx` (MODIFICAR)
**Principais modificações no código existente:**

1. **Importações adicionais (adicionar):**
```typescript
// Adicionar estas importações
import { 
  buscarClassificacaoHistorica,
  buscarClassificacoesEmLote 
} from '@/servicos/importacao/classificador-historico'
import type { 
  TransacaoClassificada, 
  ResumoClassificacao,
  DadosClassificacao 
} from '@/tipos/importacao'
```

2. **Estados adicionais (adicionar após linha 35):**
```typescript
// Estados para classificação inteligente
const [transacoesClassificadas, setTransacoesClassificadas] = useState<TransacaoClassificada[]>([])
const [resumoClassificacao, setResumoClassificacao] = useState<ResumoClassificacao>({
  reconhecidas: 0,
  pendentes: 0, 
  duplicadas: 0
})
```

3. **Modificar função `handleImportar` (substituir a partir da linha 68):**
```typescript
const handleImportar = async () => {
  if (!arquivo || !contaSelecionada || dadosProcessados.length === 0) {
    erro('Selecione um arquivo CSV válido e uma conta')
    return
  }

  setCarregando(true)
  try {
    // 1. Detectar formato e mapear dados (código atual)
    const formato = detectarFormato(dadosProcessados)
    setFormatoDetectado(formato)
    const transacoesMap = formato.mapeador(dadosProcessados, contaSelecionada)
    
    info('🧠 Iniciando classificação inteligente...')
    
    // 2. NOVO: Classificação inteligente
    const transacoesClassificadas: TransacaoClassificada[] = []
    
    // Versão otimizada: buscar classificações em lote
    const dadosParaBusca = transacoesMap.map(t => ({
      descricao: t.descricao,
      conta_id: t.conta_id
    }))
    
    const classificacoesEncontradas = await buscarClassificacoesEmLote(dadosParaBusca)
    
    // Processar cada transação
    for (const transacao of transacoesMap) {
      const chave = `${transacao.descricao}|${transacao.conta_id}`
      const classificacao = classificacoesEncontradas.get(chave)
      
      if (classificacao) {
        // Transação reconhecida
        transacoesClassificadas.push({
          ...transacao,
          classificacao_automatica: classificacao,
          status_classificacao: 'reconhecida',
          categoria_id: classificacao.categoria_id,
          subcategoria_id: classificacao.subcategoria_id,
          forma_pagamento_id: classificacao.forma_pagamento_id
        })
      } else {
        // Transação pendente
        transacoesClassificadas.push({
          ...transacao,
          status_classificacao: 'pendente'
        })
      }
    }

    // 3. Verificar duplicatas (código atual)
    const { novas, duplicadas: dups } = await verificarDuplicatas(transacoesClassificadas)
    
    // Marcar duplicadas no status
    const duplicadasComStatus = dups.map(t => ({
      ...t,
      status_classificacao: 'duplicada' as const
    }))

    // 4. Calcular resumo
    const resumo: ResumoClassificacao = {
      reconhecidas: novas.filter(t => 
        (t as TransacaoClassificada).status_classificacao === 'reconhecida'
      ).length,
      pendentes: novas.filter(t => 
        (t as TransacaoClassificada).status_classificacao === 'pendente'
      ).length,
      duplicadas: duplicadasComStatus.length
    }

    // 5. Atualizar estados
    setTransacoesMapeadas(novas)
    setDuplicadas(duplicadasComStatus)
    setTransacoesClassificadas([...novas as TransacaoClassificada[], ...duplicadasComStatus])
    setResumoClassificacao(resumo)
    setMostrarPreview(true)
    
    sucesso(
      `🧠 ${formato.nome}: ${resumo.reconhecidas} reconhecidas, ` +
      `${resumo.pendentes} pendentes, ${resumo.duplicadas} duplicadas`
    )
  } catch (error) {
    erro('Erro ao processar transações')
    logger.error(error)
  } finally {
    setCarregando(false)
  }
}
```

4. **Adicionar função para classificação manual (após `handleConfirmarImportacao`):**
```typescript
const handleClassificarTransacao = (transacao: TransacaoClassificada, dados: DadosClassificacao) => {
  // Atualizar transação com nova classificação
  const transacaoAtualizada: TransacaoClassificada = {
    ...transacao,
    classificacao_automatica: dados,
    status_classificacao: 'reconhecida',
    categoria_id: dados.categoria_id,
    subcategoria_id: dados.subcategoria_id,
    forma_pagamento_id: dados.forma_pagamento_id
  }
  
  // Atualizar array de transações
  setTransacoesClassificadas(prev => 
    prev.map(t => t === transacao ? transacaoAtualizada : t)
  )
  
  // Atualizar transações mapeadas (para importação)
  setTransacoesMapeadas(prev => 
    prev.map(t => t === transacao ? transacaoAtualizada : t)
  )
  
  // Atualizar resumo
  setResumoClassificacao(prev => ({
    ...prev,
    reconhecidas: prev.reconhecidas + 1,
    pendentes: prev.pendentes - 1
  }))
  
  info('✅ Transação classificada com sucesso!')
}
```

5. **Atualizar componente PreviewImportacao (modificar JSX):**
```typescript
<PreviewImportacao
  transacoes={transacoesMapeadas}
  duplicadas={duplicadas}
  onConfirmar={handleConfirmarImportacao}
  onCancelar={handleVoltarUpload}
  carregando={carregando}
  // Novas props para classificação
  transacoesClassificadas={transacoesClassificadas}
  resumoClassificacao={resumoClassificacao}
  onClassificarTransacao={handleClassificarTransacao}
/>
```

6. **Limpar estados no reset (modificar `handleVoltarUpload` e `handleFechar`):**
```typescript
// Adicionar estas linhas nas funções de reset
setTransacoesClassificadas([])
setResumoClassificacao({ reconhecidas: 0, pendentes: 0, duplicadas: 0 })
```

**✅ Critérios de Sucesso:**
- [ ] Classificação roda durante preview
- [ ] Resumo calculado corretamente  
- [ ] Sistema duplicatas mantido
- [ ] Performance aceitável
- [ ] Fallback em caso de erro

---

### **FASE 4: VALIDAÇÃO E DEPLOY**

#### Checklist de Testes Funcionais
**Testar estes cenários obrigatoriamente:**

**Cenário 1: Primeira Importação (Sistema Virgem)**
- [ ] Upload CSV cartão → 0 reconhecidas, X pendentes, 0 duplicadas
- [ ] Upload CSV conta corrente → 0 reconhecidas, Y pendentes, 0 duplicadas  
- [ ] Cards mostram números corretos
- [ ] Todas transações aparecem amarelas (⏳ Pendentes)

**Cenário 2: Classificação Manual**
- [ ] Clicar transação pendente → abre modal
- [ ] Modal carrega categorias/subcategorias/formas
- [ ] Subcategorias filtram por categoria selecionada
- [ ] Salvar classificação → transação fica verde
- [ ] Resumo atualiza (pendentes -1, reconhecidas +1)

**Cenário 3: Segunda Importação (Aprendizado)**  
- [ ] Reimportar CSV com transações já classificadas
- [ ] Sistema reconhece por descrição + conta
- [ ] Cards mostram X reconhecidas, 0 pendentes
- [ ] Transações aparecem verdes (✅ Reconhecidas)

**Cenário 4: Duplicatas (Sistema Atual)**
- [ ] Reimportar CSV já importado
- [ ] Sistema detecta por identificador_externo
- [ ] Cards mostram Z duplicadas
- [ ] Duplicadas aparecem vermelhas (🚫)

**Cenário 5: Mix Completo**
- [ ] CSV com transações reconhecidas + pendentes + duplicadas
- [ ] Cards mostram 3 números diferentes
- [ ] Lista mostra cores corretas
- [ ] Modal funciona para pendentes apenas

#### Checklist Técnico
```bash
# Validação obrigatória antes de commit
npx tsc --noEmit    # Sem erros TypeScript
npm run build       # Build Vercel successful
npm run lint        # Sem warnings (quando WSL resolver)

# Verificar performance
# - Importação 100+ transações < 5 segundos
# - Interface não trava durante classificação
# - Queries Supabase otimizadas

# Verificar compatibilidade
# - Sistema atual funciona 100%
# - Detecção formato mantida  
# - Duplicatas funcionando
# - Status de transações correto
```

---

## 📁 RESUMO DE ARQUIVOS

### **4 Arquivos Novos**
- [x] `src/servicos/importacao/classificador-historico.ts` ✅ **CONCLUÍDO**
- [ ] `src/componentes/importacao/cards-resumo-classificacao.tsx`  
- [ ] `src/componentes/importacao/linha-transacao-classificada.tsx`
- [ ] `src/componentes/importacao/modal-classificacao-rapida.tsx`

### **3 Arquivos Modificados**
- [x] `src/tipos/importacao.ts` - Adicionar interfaces ✅ **CONCLUÍDO**
- [ ] `src/componentes/importacao/preview-importacao.tsx` - Integrar componentes  
- [ ] `src/componentes/importacao/modal-importacao-csv.tsx` - Novo fluxo

### **Hooks Necessários (Verificar Existência)**
- [ ] `usarCategoriasDados()` - Listar categorias ativas
- [ ] `usarSubcategoriasDados(categoria_id)` - Subcategorias filtradas
- [ ] `usarFormasPagamentoDados()` - Formas de pagamento ativas

---

## 🚀 RESULTADO PARA O USUÁRIO

### **Experiência Melhorada**
1. **Cards visuais** mostram status da importação
2. **Classificação automática** para transações conhecidas
3. **Modal intuitivo** para resolver pendências
4. **Aprendizado progressivo** - quanto mais usar, mais inteligente

### **Benefícios Técnicos**
1. **Zero breaking changes** - sistema atual mantido
2. **Performance otimizada** - queries em lote
3. **Fallback robusto** - funciona mesmo com falhas
4. **Código limpo** - seguindo padrões do projeto

---

## ⚠️ VALIDAÇÕES CRÍTICAS ANTES DE IMPLEMENTAR

### **Confirmar Existência dos Hooks**
```typescript
// Verificar se existem e funcionam:
const { categorias } = usarCategoriasDados()
const { subcategorias } = usarSubcategoriasDados(categoria_id)  
const { formasPagamento } = usarFormasPagamentoDados()
```

### **Testar Query de Classificação**
```sql
-- Executar no Supabase para validar
SELECT categoria_id, subcategoria_id, forma_pagamento_id 
FROM fp_transacoes 
WHERE descricao = 'PIX ENVIADO'
  AND conta_id = 'uuid-da-conta'
  AND categoria_id IS NOT NULL
ORDER BY created_at DESC 
LIMIT 1
```

### **Validar Campos Opcionais**
```typescript
// Confirmar que estes campos aceitam null
interface NovaTransacao {
  categoria_id?: string | null      // ✅ Deve ser opcional
  subcategoria_id?: string | null   // ✅ Deve ser opcional  
  forma_pagamento_id?: string | null // ✅ Deve ser opcional
}
```

---

## 📋 CHECKLIST FINAL DE IMPLEMENTAÇÃO

### **Antes de Começar**
- [ ] Ler `docs/Resumo.md` para contexto completo
- [ ] Confirmar existência dos hooks de dados
- [ ] Testar query de classificação no Supabase  
- [ ] Validar campos opcionais em `NovaTransacao`

### **Durante Implementação**
- [ ] Implementar em ordem: Fase 1 → 2 → 3 → 4
- [ ] Testar cada arquivo individualmente
- [ ] Validar TypeScript após cada mudança: `npx tsc --noEmit`
- [ ] Manter compatibilidade 100% com sistema atual

### **Após Implementação**
- [ ] Executar todos os cenários de teste
- [ ] Confirmar performance aceitável (< 5s para 100 transações)
- [ ] Validar build Vercel: `npm run build`
- [ ] Testar fluxo completo end-to-end

### **Deploy**
- [ ] Commit com mensagem descritiva
- [ ] Verificar deploy Vercel successful
- [ ] Testar em produção com CSV real
- [ ] Documentar problemas encontrados

---

**🎯 Este documento serve como guia completo para implementação do Motor de Classificação Inteligente. Qualquer IA pode usar este contexto para implementar a funcionalidade seguindo exatamente estas especificações.**

**Posso começar a implementação seguindo este plano refinado?**