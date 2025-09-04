# 🚀 PRÓXIMOS PASSOS - FASE 3: MODAIS RESTANTES

## 📋 **CONTEXTO ATUAL**
- ✅ **FASE 1**: Infraestrutura base completa
- ✅ **FASE 2**: 2 modais principais implementados (ModalCategoria, ModalConta)  
- 🎯 **FASE 3**: 3 modais simples restantes

---

## 🎯 **MODAIS A IMPLEMENTAR (ORDEM DE PRIORIDADE)**

### **1. ModalSubcategoria** - PRIORIDADE ALTA
**Complexidade**: ⭐ SIMPLES  
**Estrutura**: SEM ABAS (formulário direto)  
**Arquivo**: `/src/componentes/modais/modal-subcategoria.tsx`

**Campos necessários**:
```typescript
{
  nome: string                    // Campo texto obrigatório
  categoria_id: string           // Dropdown das categorias
  ativo: boolean                 // Checkbox (padrão: true)
  workspace_id: string          // Automático via hook
}
```

**Dependências a criar**:
- [ ] `validarSubcategoria()` em `/src/utilitarios/validacao.ts`
- [ ] `obterSubcategoriaPorId()` em `/src/servicos/supabase/subcategorias.ts`
- [ ] Configuração no `CamposEssenciaisGenericos` (já parcialmente pronta)

---

### **2. ModalFormaPagamento** - PRIORIDADE ALTA
**Complexidade**: ⭐ SIMPLES  
**Estrutura**: SEM ABAS (formulário direto)  
**Arquivo**: `/src/componentes/modais/modal-forma-pagamento.tsx`

**Campos necessários**:
```typescript
{
  nome: string                    // Campo texto obrigatório
  tipo: string                   // Select com opções predefinidas
  permite_parcelamento: boolean  // Checkbox
  ativo: boolean                 // Checkbox (padrão: true)
  workspace_id: string          // Automático via hook
}
```

**Opções do tipo**:
- 'dinheiro', 'pix', 'debito', 'credito', 'transferencia', 'boleto', 'outros'

**Dependências a criar**:
- [ ] `validarFormaPagamento()` em `/src/utilitarios/validacao.ts`
- [ ] `obterFormaPagamentoPorId()` em `/src/servicos/supabase/formas-pagamento.ts`
- [ ] Configuração no `CamposEssenciaisGenericos` (já pronta)

---

### **3. ModalCentroCusto** - PRIORIDADE MÉDIA  
**Complexidade**: ⭐ SIMPLES  
**Estrutura**: SEM ABAS (formulário direto)  
**Arquivo**: `/src/componentes/modais/modal-centro-custo.tsx`

**Campos necessários**:
```typescript
{
  nome: string                    // Campo texto obrigatório
  descricao?: string             // Campo texto opcional
  ativo: boolean                 // Checkbox (padrão: true)
  workspace_id: string          // Automático via hook
}
```

**Dependências a criar**:
- [ ] `validarCentroCusto()` em `/src/utilitarios/validacao.ts`
- [ ] `obterCentroCustoPorId()` em `/src/servicos/supabase/centros-custo.ts`
- [ ] Configuração no `CamposEssenciaisGenericos` (já pronta)

---

## 🔧 **TEMPLATE PARA IMPLEMENTAÇÃO**

### **Passo 1: Validação (5 min)**
```typescript
// Adicionar em /src/utilitarios/validacao.ts
export function validarSubcategoria(subcategoria: Partial<NovaSubcategoria>): string[] {
  const erros: string[] = []

  // Nome obrigatório
  if (!subcategoria.nome || subcategoria.nome.trim().length === 0) {
    erros.push('Nome da subcategoria é obrigatório')
  } else if (subcategoria.nome.trim().length < 2) {
    erros.push('Nome da subcategoria deve ter pelo menos 2 caracteres')
  }

  // Categoria pai obrigatória
  if (!subcategoria.categoria_id) {
    erros.push('Categoria pai é obrigatória')
  }

  // Workspace ID obrigatório
  if (!subcategoria.workspace_id) {
    erros.push('ID do workspace é obrigatório')
  }

  return erros
}
```

### **Passo 2: Serviço (5 min)**
```typescript
// Adicionar em /src/servicos/supabase/subcategorias.ts
export async function obterSubcategoriaPorId(id: string): Promise<Subcategoria> {
  const { data, error } = await supabase
    .from('fp_subcategorias')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Subcategoria não encontrada')
    }
    throw new Error(`Erro ao buscar subcategoria: ${error.message}`)
  }

  return data
}
```

### **Passo 3: Modal (15 min)**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { ModalBase } from './modal-base'
import { CamposEssenciaisGenericos } from '@/componentes/comum/campos-essenciais-genericos'
import { BotoesAcaoModal } from '@/componentes/comum/botoes-acao-modal'
import { useModalForm } from '@/hooks/usar-modal-form'
import { useModais } from '@/contextos/modais-contexto'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'
import { criarSubcategoria, atualizarSubcategoria, obterSubcategoriaPorId } from '@/servicos/supabase/subcategorias'
import { validarSubcategoria } from '@/utilitarios/validacao'

interface ModalSubcategoriaProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  subcategoriaId?: string
}

const ESTADO_INICIAL = {
  nome: '',
  categoria_id: '',
  ativo: true,
  workspace_id: ''
}

export function ModalSubcategoria({
  isOpen,
  onClose,
  onSuccess,
  subcategoriaId
}: ModalSubcategoriaProps) {
  const { subcategoria } = useModais()
  const { categorias } = useDadosAuxiliares()

  const {
    dados,
    erros,
    carregandoDados,
    salvando,
    editando,
    atualizarCampo,
    inicializarEdicao,
    limparFormulario,
    submeter,
    formularioValido
  } = useModalForm({
    estadoInicial: ESTADO_INICIAL,
    validar: validarSubcategoria,
    salvar: async (dadosSubcategoria) => {
      if (editando && subcategoriaId) {
        await atualizarSubcategoria(subcategoriaId, dadosSubcategoria)
      } else {
        await criarSubcategoria(dadosSubcategoria as any, dadosSubcategoria.workspace_id!)
      }
    },
    carregar: async (id: string) => {
      const subcategoria = await obterSubcategoriaPorId(id)
      return subcategoria
    },
    onSucesso: () => {
      onSuccess?.()
      subcategoria.fechar()
    },
    limparAposSucesso: true
  })

  // Inicializar edição quando modal abrir com ID
  useEffect(() => {
    if (isOpen && subcategoriaId && !editando) {
      inicializarEdicao(subcategoriaId)
    } else if (isOpen && !subcategoriaId) {
      limparFormulario()
    }
  }, [isOpen, subcategoriaId, editando, inicializarEdicao, limparFormulario])

  const handleClose = () => {
    limparFormulario()
    onClose()
  }

  const titulo = editando ? 'Editar Subcategoria' : 'Nova Subcategoria'

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleClose}
      title={titulo}
      fixedWidth="500px"
    >
      <div className="space-y-6">
        <CamposEssenciaisGenericos
          tipo="subcategoria"
          dados={dados}
          onChange={atualizarCampo}
          erros={erros}
          carregando={carregandoDados}
          dadosAuxiliares={{ categorias }}
        />
        
        {erros.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Erros encontrados:</h4>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {erros.map((erro, index) => (
                <li key={index}>{erro}</li>
              ))}
            </ul>
          </div>
        )}
        
        <BotoesAcaoModal
          onCancelar={handleClose}
          onSalvar={submeter}
          salvando={salvando}
          desabilitarSalvar={!formularioValido}
          textoSalvar={editando ? 'Atualizar' : 'Criar'}
          carregando={carregandoDados}
        />
      </div>
    </ModalBase>
  )
}
```

---

## ✅ **CHECKLIST POR MODAL**

### **ModalSubcategoria**
- [ ] Adicionar `validarSubcategoria` em validacao.ts
- [ ] Adicionar `obterSubcategoriaPorId` em subcategorias.ts  
- [ ] Criar arquivo modal-subcategoria.tsx
- [ ] Testar compilação TypeScript
- [ ] Testar funcionamento básico
- [ ] Atualizar documentação

### **ModalFormaPagamento**
- [ ] Adicionar `validarFormaPagamento` em validacao.ts
- [ ] Adicionar `obterFormaPagamentoPorId` em formas-pagamento.ts
- [ ] Criar arquivo modal-forma-pagamento.tsx  
- [ ] Testar compilação TypeScript
- [ ] Testar funcionamento básico
- [ ] Atualizar documentação

### **ModalCentroCusto**
- [ ] Adicionar `validarCentroCusto` em validacao.ts
- [ ] Adicionar `obterCentroCustoPorId` em centros-custo.ts
- [ ] Criar arquivo modal-centro-custo.tsx
- [ ] Testar compilação TypeScript  
- [ ] Testar funcionamento básico
- [ ] Atualizar documentação

---

## 🎯 **COMANDOS PARA VALIDAÇÃO**

### **Depois de cada modal implementado**:
```bash
# Validar TypeScript
npx tsc --noEmit

# Testar build (se dependências permitirem)
npm run build

# Verificar se não há imports não utilizados
npm run lint
```

---

## 📈 **ESTIMATIVA DE TEMPO**

### **Por Modal (25 min cada)**:
- Validação: 5 min
- Serviço: 5 min  
- Modal: 15 min

### **Total Estimado**: 1h 15min para os 3 modais

### **Cronograma Sugerido**:
- **Dia 1**: ModalSubcategoria (25 min)
- **Dia 2**: ModalFormaPagamento (25 min)  
- **Dia 3**: ModalCentroCusto (25 min)
- **Dia 4**: Testes e documentação (30 min)

---

## 🔗 **ARQUIVOS DE REFERÊNCIA**

### **Templates Existentes**:
- **Modal Complexo**: `/src/componentes/modais/modal-categoria.tsx`
- **Modal Médio**: `/src/componentes/modais/modal-conta.tsx`
- **Hook**: `/src/hooks/usar-modal-form.ts`
- **Componentes**: `/src/componentes/comum/campos-essenciais-genericos.tsx`

### **Configurações Existentes**:
- **Validação**: `/src/utilitarios/validacao.ts` (validarCategoria, validarConta)
- **Contexto**: `/src/contextos/modais-contexto.tsx` (já configurado)
- **Campos**: Configuração já existe em `CONFIGURACOES_CAMPOS`

---

**💡 Com a infraestrutura já pronta, implementar estes 3 modais simples é questão de copiar o template e adaptar os campos. Todos os componentes reutilizáveis já funcionam perfeitamente!**