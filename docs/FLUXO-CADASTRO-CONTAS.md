# 📋 Fluxo de Cadastro de Contas e Saldo Inicial

**Data:** 19/08/2025
**Autor:** Sistema de Controle Financeiro
**Status:** Definido

---

## 🎯 Objetivo

Definir o fluxo correto para o cadastro de uma nova conta financeira (ex: conta corrente, cartão de crédito), garantindo que o saldo inicial seja registrado de forma consistente e que a integridade dos dados seja mantida.

---

## 🔑 Princípio Fundamental: Transação de Saldo Inicial

A regra mais importante é que o saldo de uma conta é sempre **calculado** a partir da soma de suas transações. Ele **não é armazenado** como um valor fixo na tabela de contas.

Para registrar o saldo que uma conta possui no momento em que é cadastrada no sistema, a aplicação deve criar uma **transação especial de "Saldo Inicial"**.

---

## 🌊 Fluxo de Implementação

1.  **Interface de Usuário (UI):**
    *   Ao adicionar uma nova conta, o formulário deve solicitar, além dos dados da conta (nome, tipo, etc.), o campo **"Qual o saldo atual?"** para contas correntes/poupança, ou **"Qual o valor da fatura em aberto?"** para cartões de crédito.

2.  **Lógica de Backend/Serviço (`criarConta`):**
    *   Quando o usuário salva, a aplicação executa duas operações em sequência:
        1.  **Cria a conta:** Insere um novo registro na tabela `fp_contas`.
        2.  **Cria a Transação Inicial:** Usa o "saldo inicial" fornecido pelo usuário para criar um primeiro registro na tabela `fp_transacoes` associado à nova conta.

---

## ⚙️ Detalhes por Tipo de Conta

### 1. Conta Corrente, Poupança ou Dinheiro

*   **Input do Usuário:** "Saldo Atual: R$ 1.250,50"
*   **Ação do Sistema:** Criar uma transação do tipo `receita`.

**Exemplo de Transação Inicial (Receita):**
```json
{
  "descricao": "Saldo Inicial",
  "valor": 1250.50,
  "tipo": "receita",
  "conta_id": "uuid-da-nova-conta-corrente",
  "data": "2025-08-19",
  "status": "realizado",
  "categoria_id": null,
  "recorrente": false,
  "parcela_atual": 1,
  "total_parcelas": 1
}
```

### 2. Cartão de Crédito

*   **Input do Usuário:** "Valor da Fatura Aberta: R$ 870,00"
*   **Ação do Sistema:** Criar uma transação do tipo `despesa`. Isso representa o valor que o usuário já deve no cartão.

**Exemplo de Transação Inicial (Despesa):**
```json
{
  "descricao": "Saldo Inicial da Fatura",
  "valor": 870.00,
  "tipo": "despesa",
  "conta_id": "uuid-do-novo-cartao-de-credito",
  "data": "2025-08-19",
  "status": "previsto",
  "categoria_id": null,
  "recorrente": false,
  "parcela_atual": 1,
  "total_parcelas": 1
}
```

---

## ✅ Vantagens desta Abordagem

*   **Integridade dos Dados:** A "fonte da verdade" (tabela de transações) é sempre consistente. O saldo é sempre uma consequência do histórico.
*   **Transparência:** O usuário pode ver a transação de "Saldo Inicial" em seu extrato, entendendo a origem do valor.
*   **Simplicidade no Schema:** Evita a necessidade de uma coluna `saldo_atual` na tabela `fp_contas`, que seria complexa de manter sincronizada.
*   **Flexibilidade:** O usuário pode editar ou excluir a transação de saldo inicial se cometeu um erro, corrigindo facilmente o balanço da conta.

---
