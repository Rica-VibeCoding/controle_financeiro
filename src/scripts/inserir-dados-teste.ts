// Script para inserir dados de teste no banco
// Execute: npx tsx src/scripts/inserir-dados-teste.ts

import { supabase } from '../servicos/supabase/cliente'

async function inserirDadosTeste() {
  console.log('🚀 Inserindo dados de teste...')

  try {
    // 1. Inserir categorias de teste
    console.log('📋 Inserindo categorias...')
    const { data: categorias, error: errorCategorias } = await supabase
      .from('fp_categorias')
      .insert([
        {
          nome: 'Alimentação',
          tipo: 'despesa',
          icone: '🍕',
          cor: '#ef4444',
          ativo: true
        },
        {
          nome: 'Transporte',
          tipo: 'despesa', 
          icone: '🚗',
          cor: '#f97316',
          ativo: true
        },
        {
          nome: 'Salário',
          tipo: 'receita',
          icone: '💰',
          cor: '#22c55e',
          ativo: true
        }
      ])
      .select()

    if (errorCategorias) {
      console.log('ℹ️ Categorias já existem ou erro:', errorCategorias.message)
    } else {
      console.log('✅ Categorias inseridas:', categorias?.length)
    }

    // 2. Inserir contas de teste
    console.log('🏦 Inserindo contas...')
    const { data: contas, error: errorContas } = await supabase
      .from('fp_contas')
      .insert([
        {
          nome: 'Conta Corrente',
          tipo: 'conta_corrente',
          banco: 'Banco do Brasil',
          ativo: true
        },
        {
          nome: 'Cartão de Crédito',
          tipo: 'cartao_credito',
          banco: 'Nubank',
          ativo: true
        }
      ])
      .select()

    if (errorContas) {
      console.log('ℹ️ Contas já existem ou erro:', errorContas.message)
    } else {
      console.log('✅ Contas inseridas:', contas?.length)
    }

    // 3. Buscar IDs para usar nas transações
    const { data: categoriasExistentes } = await supabase
      .from('fp_categorias')
      .select('id, nome')
      .limit(3)

    const { data: contasExistentes } = await supabase
      .from('fp_contas')
      .select('id, nome')
      .limit(2)

    if (!categoriasExistentes?.length || !contasExistentes?.length) {
      console.log('❌ Não foi possível encontrar categorias ou contas para criar transações')
      return
    }

    console.log('📊 Categorias disponíveis:', categoriasExistentes.map(c => c.nome))
    console.log('🏦 Contas disponíveis:', contasExistentes.map(c => c.nome))

    // 4. Inserir transações de teste
    console.log('💳 Inserindo transações...')
    const hoje = new Date()
    const umaSemanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
    const doisDiasAtras = new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000)

    const transacoesTeste = [
      {
        data: hoje.toISOString().split('T')[0],
        descricao: 'Salário do mês',
        valor: 5000.00,
        tipo: 'receita',
        categoria_id: categoriasExistentes.find(c => c.nome === 'Salário')?.id,
        conta_id: contasExistentes[0].id,
        status: 'realizado',
        parcela_atual: 1,
        total_parcelas: 1,
        recorrente: true,
        frequencia_recorrencia: 'mensal',
        data_registro: hoje.toISOString()
      },
      {
        data: doisDiasAtras.toISOString().split('T')[0],
        descricao: 'Almoço no restaurante',
        valor: 45.50,
        tipo: 'despesa',
        categoria_id: categoriasExistentes.find(c => c.nome === 'Alimentação')?.id,
        conta_id: contasExistentes[1].id,
        status: 'realizado',
        parcela_atual: 1,
        total_parcelas: 1,
        recorrente: false,
        observacoes: 'Restaurante italiano',
        data_registro: doisDiasAtras.toISOString()
      },
      {
        data: umaSemanaAtras.toISOString().split('T')[0],
        descricao: 'Uber para trabalho',
        valor: 25.30,
        tipo: 'despesa',
        categoria_id: categoriasExistentes.find(c => c.nome === 'Transporte')?.id,
        conta_id: contasExistentes[0].id,
        status: 'realizado',
        parcela_atual: 1,
        total_parcelas: 1,
        recorrente: false,
        data_registro: umaSemanaAtras.toISOString()
      }
    ]

    const { data: transacoes, error: errorTransacoes } = await supabase
      .from('fp_transacoes')
      .insert(transacoesTeste)
      .select()

    if (errorTransacoes) {
      console.log('❌ Erro ao inserir transações:', errorTransacoes.message)
    } else {
      console.log('✅ Transações inseridas:', transacoes?.length)
    }

    // 5. Verificar se as transações foram inseridas
    console.log('🔍 Verificando transações no banco...')
    const { data: todasTransacoes, error: errorVerificacao } = await supabase
      .from('fp_transacoes')
      .select(`
        *,
        categoria:fp_categorias(nome, cor, icone),
        conta:fp_contas(nome, tipo)
      `)
      .order('data', { ascending: false })

    if (errorVerificacao) {
      console.log('❌ Erro ao verificar transações:', errorVerificacao.message)
    } else {
      console.log('📊 Total de transações no banco:', todasTransacoes?.length)
      console.log('📋 Transações encontradas:')
      todasTransacoes?.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.descricao} - ${t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${t.tipo})`)
      })
    }

    console.log('🎉 Dados de teste inseridos com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao inserir dados de teste:', error)
  }
}

// Executar o script
inserirDadosTeste()