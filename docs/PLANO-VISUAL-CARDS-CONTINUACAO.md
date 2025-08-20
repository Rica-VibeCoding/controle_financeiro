# 🎨 PLANO VISUAL CARDS - CONTINUAÇÃO IMPLEMENTAÇÃO

**Data:** 20/08/2025  
**Desenvolvedor:** Ricardo  
**Objetivo:** Finalizar ajustes visuais dos cards para ficar idêntico ao dashboard.html  
**Status:** Fase 1 concluída, Fases 2-3 pendentes

---

## 📊 **CONTEXTO ATUAL**

### **✅ FASE 1 CONCLUÍDA:**
- **Objetivo:** Adicionar texto "vs mês anterior" nos cards 1-3
- **Implementação:** 
  - Adicionada prop `valorAnterior?: number` na interface `CardMetricaProps`
  - Texto condicional: `vs {valorAnterior} mês anterior`
  - Integrado no dashboard para Receitas, Despesas e Saldo
- **Resultado:** Cards agora mostram comparativo conforme referência visual
- **Status:** ✅ **CONCLUÍDA E TESTADA**

### **🎯 REFERÊNCIA VISUAL:**
Baseado na imagem: `/mnt/c/Users/ricar/OneDrive/Documentos/ShareX/Screenshots/2025-08/chrome_GZYqbsJ9cF.png`

**Card Cartões tem estrutura diferente:**
```
┌─────────────────────────────────────┐
│ 🟣 Cartões                     43%  │
│                                     │
│ R$ 2.150,00                        │
│ de R$ 5.000,00 limite              │
│ ████████████████████░░░░░░░░░░      │ <- Barra de progresso
└─────────────────────────────────────┘
```

---

## 🚀 **FASE 2: CARD CARTÕES COM BARRA DE PROGRESSO**

### **📋 Objetivo:**
Implementar barra de progresso no card Cartões para ficar idêntico ao dashboard.html

### **📝 Tarefas Detalhadas:**

#### **1. Modificar componente CardMetrica**
**Arquivo:** `src/componentes/dashboard/card-metrica.tsx`

**Adições necessárias:**
```typescript
interface CardMetricaProps {
  // Props existentes...
  mostrarBarraProgresso?: boolean
  valorLimite?: number
}
```

#### **2. Implementar lógica condicional**
```typescript
// Para card Cartões
if (icone === 'cartoes' && mostrarBarraProgresso) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 card-hover animate-slide-up">
      {/* Header igual aos outros */}
      
      {/* Seção de valores modificada */}
      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-900">{valorFormatado}</p>
        {valorLimite && (
          <p className="text-sm text-gray-500 mt-1">
            de {valorLimite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} limite
          </p>
        )}
      </div>
      
      {/* Barra de progresso */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="gradient-purple h-2 rounded-full transition-all duration-500" 
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  )
}
```

#### **3. Atualizar uso no dashboard**
**Arquivo:** `src/app/dashboard/page.tsx`

```typescript
<CardMetrica
  titulo="Cartões"
  valor={cards?.gastosCartao.atual}
  valorLimite={cards?.gastosCartao.limite}  // <- Adicionar
  mostrarBarraProgresso={true}              // <- Adicionar
  icone="cartoes"
  percentual={cards?.gastosCartao.percentual || 0}
  cor="purple"
  loading={isLoading}
/>
```

#### **4. Validações obrigatórias:**
- ✅ `npx tsc --noEmit` - TypeScript sem erros
- ✅ Testar servidor de desenvolvimento
- ✅ Verificar proporções visuais

### **⚠️ Riscos identificados:** BAIXO
- Mudança isolada apenas no card cartões
- Dados já existem no backend
- Layout testado na referência visual

---

## 🎨 **FASE 3: GRADIENTES CSS E POLIMENTOS**

### **📋 Objetivo:**
Adicionar classes CSS de gradientes e animações para ficar 100% idêntico

### **📝 Tarefas Detalhadas:**

#### **1. Adicionar gradientes CSS**
**Arquivo:** `src/app/globals.css` ou criar `src/styles/dashboard.css`

```css
/* Gradientes do dashboard.html */
.gradient-purple {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.gradient-green {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.gradient-red {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.gradient-blue {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

/* Animações slideUp com delays */
.animate-slide-up {
    animation: slideUp 0.5s ease-out forwards;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

#### **2. Aplicar delays nas animações**
**Arquivo:** `src/app/dashboard/page.tsx`

Adicionar `style` inline nos cards:
```typescript
// Card 1: Receitas
style={{ animationDelay: '0.1s' }}

// Card 2: Despesas  
style={{ animationDelay: '0.2s' }}

// Card 3: Saldo
style={{ animationDelay: '0.3s' }}

// Card 4: Cartões
style={{ animationDelay: '0.4s' }}
```

#### **3. Ajustar skeleton loading**
Aplicar também delays no estado de loading para manter consistência.

### **⚠️ Riscos identificados:** MÍNIMO
- Apenas CSS e animações
- Não afeta funcionalidade
- Melhora experiência do usuário

---

## 📋 **CHECKLIST IMPLEMENTAÇÃO**

### **Para próximo desenvolvedor:**

**Antes de começar:**
- [ ] Ler `docs/Resumo.md` para contexto do projeto
- [ ] Verificar se Fase 1 está funcionando (texto "vs mês anterior")
- [ ] Confirmar que dashboard está acessível em `/dashboard`

**Fase 2 - Barra Progresso:**
- [ ] Modificar `CardMetricaProps` interface
- [ ] Implementar lógica condicional para card cartões
- [ ] Atualizar props no dashboard
- [ ] Validar TypeScript (`npx tsc --noEmit`)
- [ ] Testar servidor (`npx next dev`)
- [ ] Verificar visualmente se barra aparece

**Fase 3 - CSS/Animações:**
- [ ] Adicionar classes gradient no CSS
- [ ] Implementar animação slideUp
- [ ] Aplicar delays nos cards
- [ ] Testar animações no navegador

**Validação final:**
- [ ] Comparar com screenshot referência
- [ ] Proporções visuais corretas
- [ ] Animações fluidas
- [ ] Dados reais carregando

---

## 🎯 **DADOS NECESSÁRIOS**

**Já implementado e funcionando:**
```javascript
// Cards data structure (do SWR)
{
  receitas: { atual: 7285.17, anterior: X, percentual: Y },
  despesas: { atual: 5050.20, anterior: X, percentual: Y },
  saldo: { atual: 2234.97, anterior: X, percentual: Y },
  gastosCartao: { 
    atual: 4000.00,    // <- Para valor principal
    limite: 8000.00,   // <- Para texto "de R$ X limite"
    percentual: 50.0   // <- Para largura da barra
  }
}
```

**Formatação moeda:**
```javascript
valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
```

---

## 🔗 **ARQUIVOS ENVOLVIDOS**

### **Principais:**
- `src/componentes/dashboard/card-metrica.tsx` - Componente principal
- `src/app/dashboard/page.tsx` - Uso dos cards
- `src/app/globals.css` - Estilos CSS

### **Dependências:**
- `src/hooks/usar-cards-dados.ts` - Hook SWR (já funciona)
- `src/servicos/supabase/dashboard-queries.ts` - Queries (já funciona)
- `src/tipos/dashboard.ts` - Interfaces TypeScript

### **Referências:**
- `dashboard.html` - Referência visual completa
- Screenshot: `chrome_GZYqbsJ9cF.png` - Cards específicos

---

## ⚡ **COMANDOS ÚTEIS**

```bash
# Validar TypeScript
npx tsc --noEmit

# Servidor desenvolvimento
npx next dev --turbopack

# Build para verificar se não quebrou nada
npm run build
```

---

**🎯 RESULTADO ESPERADO:** Cards visualmente idênticos ao dashboard.html com barra de progresso funcional e animações suaves.

**⏱️ TEMPO ESTIMADO:** 
- Fase 2: 15 minutos
- Fase 3: 10 minutos
- **Total: 25 minutos**