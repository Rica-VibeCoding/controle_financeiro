import { supabase } from './cliente'

export interface DadosCards {
  receitas: number
  despesas: number
  saldo: number
  gastosCartao: number
}

export class DashboardService {
  static async buscarDadosCards(): Promise<DadosCards> {
    return await this._getDadosCards()
  }

  private static async _getDadosCards() {
    
    const { data: transacoes, error } = await supabase
      .from('fp_transacoes')
      .select('tipo, valor, fp_formas_pagamento(tipo)')
      .eq('tipo', 'receita')
      .eq('status', 'realizado')

    const { data: despesasData, error: despesasError } = await supabase
      .from('fp_transacoes')
      .select('tipo, valor, fp_formas_pagamento(tipo)')
      .eq('tipo', 'despesa')
      .eq('status', 'realizado')

    if (error) {
        console.error("Erro ao buscar receitas:", error)
        throw new Error("Erro ao buscar receitas")
    }

    if (despesasError) {
        console.error("Erro ao buscar despesas:", despesasError)
        throw new Error("Erro ao buscar despesas")
    }

    let receitas = 0;
    let despesas = 0;
    let gastosCartao = 0;

    // Processar receitas
    if (transacoes) {
      for (const t of transacoes) {
        const valor = Number(t.valor) || 0;
        receitas += valor;
      }
    }

    // Processar despesas
    if (despesasData) {
      for (const t of despesasData) {
        const valor = Number(t.valor) || 0;
        despesas += valor;
        // @ts-ignore
        if (t.fp_formas_pagamento?.tipo === 'credito') {
          gastosCartao += valor;
        }
      }
    }

    // Garantir que todos os valores são números válidos
    const receitasSeguras = Number(receitas) || 0;
    const despesasSeguras = Number(despesas) || 0;
    const gastosCartaoSeguras = Number(gastosCartao) || 0;
    const saldoSeguro = receitasSeguras - despesasSeguras;
    
    const resultado = { 
      receitas: receitasSeguras, 
      despesas: despesasSeguras, 
      saldo: saldoSeguro, 
      gastosCartao: gastosCartaoSeguras 
    };
    
    
    return resultado;
  }
}