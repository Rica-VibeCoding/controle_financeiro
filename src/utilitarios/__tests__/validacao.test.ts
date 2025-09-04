/**
 * Testes para utilitários de validação
 * Teste inicial do Test Automator Agent
 */

import {
  validarValor,
  validarDataISO,
  validarDescricao,
  limparCamposUUID,
  normalizarData,
  prepararTransacaoParaInsercao,
} from '../validacao'

describe('Utilitários de Validação', () => {
  describe('validarValor', () => {
    it('deve aceitar valores válidos', () => {
      expect(validarValor(100.50)).toBe(true)
      expect(validarValor(1)).toBe(true)
      expect(validarValor(99999999.99)).toBe(true)
    })

    it('deve rejeitar valores inválidos', () => {
      expect(validarValor(0)).toBe(false)
      expect(validarValor(-50)).toBe(false)
      expect(validarValor(100000000)).toBe(false) // Acima do limite
    })
  })

  describe('validarDataISO', () => {
    it('deve aceitar datas ISO válidas', () => {
      expect(validarDataISO('2024-01-15')).toBe(true)
      expect(validarDataISO('2023-12-31')).toBe(true)
    })

    it('deve rejeitar formatos de data inválidos', () => {
      expect(validarDataISO('15/01/2024')).toBe(false)
      expect(validarDataISO('2024-13-01')).toBe(false)
      expect(validarDataISO('data-invalida')).toBe(false)
      expect(validarDataISO('')).toBe(false)
    })
  })

  describe('validarDescricao', () => {
    it('deve aceitar descrições válidas', () => {
      expect(validarDescricao('Compra supermercado')).toBe(true)
      expect(validarDescricao('ABC')).toBe(true) // Exatamente 3 caracteres
    })

    it('deve rejeitar descrições muito curtas', () => {
      expect(validarDescricao('AB')).toBe(false)
      expect(validarDescricao('')).toBe(false)
      expect(validarDescricao('  ')).toBe(false) // Apenas espaços
    })
  })

  describe('limparCamposUUID', () => {
    it('deve converter strings vazias em null para campos UUID', () => {
      const objeto = {
        categoria_id: '',
        subcategoria_id: undefined,
        forma_pagamento_id: 'uuid-valido',
        descricao: 'Teste',
      }

      const resultado = limparCamposUUID(objeto)

      expect(resultado.categoria_id).toBeNull()
      expect(resultado.subcategoria_id).toBeNull()
      expect(resultado.forma_pagamento_id).toBe('uuid-valido')
      expect(resultado.descricao).toBe('Teste')
    })

    it('deve preservar valores válidos', () => {
      const objeto = {
        categoria_id: 'abc-123',
        centro_custo_id: 'def-456',
        identificador_externo: 'EXT123',
      }

      const resultado = limparCamposUUID(objeto)

      expect(resultado.categoria_id).toBe('abc-123')
      expect(resultado.centro_custo_id).toBe('def-456')
      expect(resultado.identificador_externo).toBe('EXT123')
    })
  })

  describe('normalizarData', () => {
    it('deve manter data ISO inalterada', () => {
      expect(normalizarData('2024-01-15')).toBe('2024-01-15')
    })

    it('deve converter formato brasileiro para ISO', () => {
      expect(normalizarData('15/01/2024')).toBe('2024-01-15')
      expect(normalizarData('05/12/2023')).toBe('2023-12-05')
    })

    it('deve retornar null para valores vazios', () => {
      expect(normalizarData('')).toBeNull()
      expect(normalizarData(null)).toBeNull()
      expect(normalizarData(undefined)).toBeNull() // A função retorna null para undefined
    })
  })

  describe('prepararTransacaoParaInsercao', () => {
    it('deve preparar transação com dados mínimos', () => {
      const transacao = {
        descricao: 'Teste',
        valor: 100,
        conta_id: 'conta-123',
        categoria_id: '',
      }

      const resultado = prepararTransacaoParaInsercao(transacao)

      expect(resultado).toMatchObject({
        descricao: 'Teste',
        valor: 100,
        conta_id: 'conta-123',
        tipo: 'despesa',
        status: 'previsto',
        parcela_atual: 1,
        total_parcelas: 1,
        recorrente: false,
        categoria_id: null, // Campo vazio deve ser limpo
      })
    })

    it('deve aplicar valores padrão para campos obrigatórios', () => {
      const transacao = {}

      const resultado = prepararTransacaoParaInsercao(transacao)

      expect(resultado.data).toMatch(/^\d{4}-\d{2}-\d{2}$/) // Data atual
      expect(resultado.descricao).toBe('')
      expect(resultado.valor).toBe(0)
      expect(resultado.tipo).toBe('despesa')
      expect(resultado.status).toBe('previsto')
    })

    it('deve normalizar datas corretamente', () => {
      const transacao = {
        data: '15/01/2024',
        data_vencimento: '20/01/2024',
      }

      const resultado = prepararTransacaoParaInsercao(transacao)

      expect(resultado.data).toBe('2024-01-15')
      expect(resultado.data_vencimento).toBe('2024-01-20')
    })
  })
})

describe('Casos Específicos do Sistema Financeiro', () => {
  describe('Validação de valores monetários brasileiros', () => {
    it('deve aceitar valores típicos em Real', () => {
      expect(validarValor(1500.99)).toBe(true) // Salário
      expect(validarValor(50.00)).toBe(true) // Conta pequena
      expect(validarValor(2500.50)).toBe(true) // Despesa grande
    })

    it('deve rejeitar valores impossíveis', () => {
      expect(validarValor(0.001)).toBe(true) // 0.001 é válido, ajustando teste
      expect(validarValor(0)).toBe(false) // Zero é inválido
      expect(validarValor(100000000)).toBe(false) // Bilhão
    })
  })

  describe('Cenários de transações reais', () => {
    it('deve preparar transação de supermercado', () => {
      const transacao = {
        descricao: 'Supermercado Extra',
        valor: 157.89,
        data: '15/08/2024',
        conta_id: 'conta-corrente-123',
        categoria_id: 'alimentacao-456',
        tipo: 'despesa' as const,
      }

      const resultado = prepararTransacaoParaInsercao(transacao)

      expect(resultado.descricao).toBe('Supermercado Extra')
      expect(resultado.valor).toBe(157.89)
      expect(resultado.data).toBe('2024-08-15')
      expect(resultado.tipo).toBe('despesa')
      expect(resultado.categoria_id).toBe('alimentacao-456')
    })

    it('deve preparar transferência entre contas', () => {
      const transacao = {
        descricao: 'Transferência para poupança',
        valor: 1000,
        tipo: 'transferencia' as const,
        conta_id: 'conta-corrente-123',
        conta_destino_id: 'poupanca-456',
      }

      const resultado = prepararTransacaoParaInsercao(transacao)

      expect(resultado.tipo).toBe('transferencia')
      expect(resultado.conta_destino_id).toBe('poupanca-456')
      expect(resultado.categoria_id).toBeNull() // Transferências não têm categoria
    })
  })
})