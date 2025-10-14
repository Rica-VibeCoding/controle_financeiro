# 🔧 Personalização e Customização

> **Guia para desenvolvedores: hooks, componentes e customizações**

---

## 📚 Estrutura do Projeto

```
/src
  /app
    /(protected)     → Páginas protegidas por auth
    /auth            → Login, registro, callback
  /componentes       → Organizados por funcionalidade
  /contextos         → Auth, período, dados auxiliares
  /servicos          → Lógica de negócio (Supabase)
  /hooks             → Hooks customizados (usar-*)
  /tipos             → Interfaces TypeScript
```

---

## 🎣 Hooks Customizados Principais

### usar-transacoes

```typescript
import { usarTransacoes } from '@/hooks/usar-transacoes';

export function MeuComponente() {
  const { criar, criarParcelada, loading, error } = usarTransacoes();

  const criarTransacao = async () => {
    await criar({
      data: '2025-01-15',
      descricao: 'Compra Supermercado',
      valor: 150.00,
      tipo: 'despesa',
      conta_id: 'uuid-da-conta',
      status: 'realizado'
    });
  };

  return (
    <button onClick={criarTransacao} disabled={loading}>
      Criar Transação
    </button>
  );
}
```

### usar-cards-dados

```typescript
import { usarCardsDados } from '@/hooks/usar-cards-dados';

export function Dashboard() {
  const { dados, loading } = usarCardsDados();

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <p>Saldo Total: R$ {dados?.saldoTotal}</p>
      <p>Receitas Mês: R$ {dados?.receitasMes}</p>
      <p>Despesas Mês: R$ {dados?.despesasMes}</p>
    </div>
  );
}
```

### usar-metas-mensais

```typescript
import { usarMetasMensais } from '@/hooks/usar-metas-mensais';

export function Metas() {
  const { metas, progresso, criarMeta } = usarMetasMensais();

  return (
    <div>
      {metas.map(meta => (
        <div key={meta.id}>
          <span>{meta.nome}</span>
          <div className="progress-bar">
            <div style={{ width: `${progresso[meta.id]}%` }} />
          </div>
          <span>{progresso[meta.id]}% usado</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 Componentes UI Customizados

### Localização

```
/src/componentes/ui/
├── button.tsx           # Botões customizados
├── card.tsx             # Cards
├── input.tsx            # Inputs
├── modal.tsx            # Modais
├── tabs.tsx             # Tabs
├── dropdown-menu.tsx    # Dropdowns
└── ...
```

### Exemplo de Uso

```typescript
import { Button } from '@/componentes/ui/button';
import { Card } from '@/componentes/ui/card';
import { Input } from '@/componentes/ui/input';

export function MeuFormulario() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Nova Transação</h2>
      <div className="space-y-4">
        <Input placeholder="Descrição" />
        <Input placeholder="Valor" type="number" />
        <Button>Salvar</Button>
      </div>
    </Card>
  );
}
```

---

## 🗃️ Adicionar Nova Categoria

```typescript
import { criarCategoria } from '@/servicos/supabase/categorias';

await criarCategoria({
  nome: 'Pets',
  tipo: 'despesa',
  icone: 'heart',
  cor: '#F59E0B',
  ativo: true,
  workspace_id: 'uuid-workspace'
});
```

---

## 📊 Sistema de Importação CSV

```typescript
import { useState } from 'react';
import { importarTransacoes } from '@/servicos/importacao/importador-transacoes';
import { processarCSV } from '@/servicos/importacao/processador-csv';

export function MinhaImportacao() {
  const [preview, setPreview] = useState([]);

  const processarArquivo = async (file: File) => {
    // Processar CSV e detectar formato
    const { transacoes, formato } = await processarCSV(file);
    console.log(`Formato: ${formato}`); // "nubank_cartao" | "nubank_conta"

    setPreview(transacoes);
  };

  const confirmarImportacao = async () => {
    const resultado = await importarTransacoes(preview);
    console.log(`✅ ${resultado.importadas} transações importadas`);
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => processarArquivo(e.target.files?.[0])}
      />
      {preview.length > 0 && (
        <button onClick={confirmarImportacao}>
          Confirmar Importação
        </button>
      )}
    </div>
  );
}
```

---

## 💾 Sistema de Backup

```typescript
import { usarBackupExportar } from '@/hooks/usar-backup-exportar';
import { usarBackupImportar } from '@/hooks/usar-backup-importar';

export function MeuBackup() {
  const { exportar, progresso, exportando } = usarBackupExportar();
  const { importar, importando } = usarBackupImportar();

  const fazerBackup = async () => {
    const arquivo = await exportar({
      incluirTransacoes: true,
      incluirCategorias: true,
      incluirContas: true,
      incluirMetas: true
    });

    console.log('Backup realizado:', arquivo.nome);
  };

  const restaurarBackup = async (file: File) => {
    const resultado = await importar(file, {
      limparDadosExistentes: false,
      criarBackupAntes: true
    });

    console.log(`Restauração: ${resultado.sucesso ? 'OK' : 'ERRO'}`);
  };

  return (
    <div>
      <button onClick={fazerBackup} disabled={exportando}>
        {exportando ? `Exportando ${progresso}%...` : 'Fazer Backup'}
      </button>

      <input
        type="file"
        accept=".zip"
        onChange={(e) => restaurarBackup(e.target.files?.[0])}
      />
    </div>
  );
}
```

---

## 🎯 Hooks Avançados

### usar-cartoes-dados

```typescript
import { usarCartoesDados } from '@/hooks/usar-cartoes-dados';

const { cartoes, saldoTotal } = usarCartoesDados();

cartoes.map(cartao => (
  <div key={cartao.id}>
    <h3>{cartao.nome}</h3>
    <p>Saldo: R$ {cartao.saldo}</p>
    {cartao.limite && <p>Limite: R$ {cartao.limite}</p>}
  </div>
))
```

### usar-proximas-contas

```typescript
import { usarProximasContas } from '@/hooks/usar-proximas-contas';

const { contasVencendo, proximasContas } = usarProximasContas();

{contasVencendo.length > 0 && (
  <div className="alert">
    <h4>⚠️ {contasVencendo.length} contas vencendo</h4>
    {contasVencendo.map(conta => (
      <p key={conta.id}>{conta.descricao} - {conta.data_vencimento}</p>
    ))}
  </div>
)}
```

---

## 📋 Padrões do Projeto

### Nomenclatura

- **Arquivos:** `kebab-case` em português (`modal-transacao.tsx`)
- **Componentes:** `PascalCase` (`ModalTransacao`)
- **Variáveis:** `camelCase` (`dadosTransacao`)
- **Hooks:** `usar*` (`usarTransacoes`)
- **Tabelas:** Prefixo `fp_` (`fp_transacoes`)

### Importações

```typescript
// 1. React e Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Bibliotecas externas
import { format } from 'date-fns';

// 3. Componentes internos
import { Button } from '@/componentes/ui/button';

// 4. Hooks e serviços
import { usarTransacoes } from '@/hooks/usar-transacoes';

// 5. Tipos
import type { Transacao } from '@/tipos/database';

// 6. Estilos (se houver)
import styles from './componente.module.css';
```

---

## 🔗 Links Relacionados

- **[Performance](PERFORMANCE.md)** - Otimizações
- **[Testes](TESTES.md)** - Testes automatizados
- **[← Voltar ao índice](../README.txt)**
