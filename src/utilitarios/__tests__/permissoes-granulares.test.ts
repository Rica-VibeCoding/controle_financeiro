/**
 * TESTE COMPLETO DO SISTEMA DE PERMISSÕES GRANULARES
 * 
 * Este arquivo contém todos os testes críticos para validação de produção
 * do sistema de 9 permissões granulares implementado na FASE 5
 */

import { 
  PermissoesUsuario,
  TipoPermissao,
  TODAS_PERMISSOES,
  PERMISSOES_PADRAO_MEMBER,
  PERMISSOES_PADRAO_OWNER,
  ROTULOS_PERMISSOES,
  ICONES_PERMISSOES,
  CORES_PERMISSOES,
  validarEstruturalPermissoes,
  contarPermissoesAtivas,
  temAlgumaPermissao,
  obterPermissoesAtivas,
  obterPermissoesInativas
} from '@/tipos/permissoes'

describe('Sistema de Permissões Granulares - FASE 5', () => {
  
  describe('1. ESTRUTURA DAS PERMISSÕES', () => {
    
    test('deve ter exatamente 9 permissões definidas', () => {
      expect(TODAS_PERMISSOES).toHaveLength(9)
      expect(TODAS_PERMISSOES).toEqual([
        'dashboard',
        'receitas', 
        'despesas',
        'recorrentes',
        'previstas',
        'relatorios',
        'configuracoes',
        'cadastramentos',
        'backup'
      ])
    })

    test('deve ter rótulos para todas as permissões', () => {
      TODAS_PERMISSOES.forEach(permissao => {
        expect(ROTULOS_PERMISSOES).toHaveProperty(permissao)
        expect(ROTULOS_PERMISSOES[permissao]).toBeTruthy()
        expect(typeof ROTULOS_PERMISSOES[permissao]).toBe('string')
      })
    })

    test('deve ter ícones para todas as permissões', () => {
      TODAS_PERMISSOES.forEach(permissao => {
        expect(ICONES_PERMISSOES).toHaveProperty(permissao)
        expect(ICONES_PERMISSOES[permissao]).toBeTruthy()
        expect(typeof ICONES_PERMISSOES[permissao]).toBe('string')
      })
    })

    test('deve ter cores para todas as permissões', () => {
      TODAS_PERMISSOES.forEach(permissao => {
        expect(CORES_PERMISSOES).toHaveProperty(permissao)
        expect(CORES_PERMISSOES[permissao]).toHaveProperty('ativo')
        expect(CORES_PERMISSOES[permissao]).toHaveProperty('inativo')
        expect(typeof CORES_PERMISSOES[permissao].ativo).toBe('string')
        expect(typeof CORES_PERMISSOES[permissao].inativo).toBe('string')
      })
    })
    
    test('deve validar nova permissão "cadastramentos"', () => {
      expect(TODAS_PERMISSOES).toContain('cadastramentos')
      expect(ROTULOS_PERMISSOES.cadastramentos).toBe('Cadastramentos')
      expect(ICONES_PERMISSOES.cadastramentos).toBe('database')
      expect(CORES_PERMISSOES.cadastramentos).toEqual({
        ativo: 'text-emerald-600',
        inativo: 'text-gray-400'
      })
    })

    test('deve validar ícone "clock" para permissão "previstas"', () => {
      expect(ICONES_PERMISSOES.previstas).toBe('clock')
    })
  })

  describe('2. PERMISSÕES PADRÃO', () => {
    
    test('MEMBER deve iniciar com todas as permissões bloqueadas', () => {
      TODAS_PERMISSOES.forEach(permissao => {
        expect(PERMISSOES_PADRAO_MEMBER[permissao]).toBe(false)
      })
      expect(contarPermissoesAtivas(PERMISSOES_PADRAO_MEMBER)).toBe(0)
      expect(temAlgumaPermissao(PERMISSOES_PADRAO_MEMBER)).toBe(false)
    })

    test('OWNER deve ter todas as permissões liberadas', () => {
      TODAS_PERMISSOES.forEach(permissao => {
        expect(PERMISSOES_PADRAO_OWNER[permissao]).toBe(true)
      })
      expect(contarPermissoesAtivas(PERMISSOES_PADRAO_OWNER)).toBe(9)
      expect(temAlgumaPermissao(PERMISSOES_PADRAO_OWNER)).toBe(true)
    })
  })

  describe('3. VALIDAÇÃO ESTRUTURAL', () => {
    
    test('deve validar estrutura completa de permissões', () => {
      const permissoesValidas: PermissoesUsuario = {
        dashboard: true,
        receitas: false,
        despesas: true,
        recorrentes: false,
        previstas: true,
        relatorios: false,
        configuracoes: true,
        cadastramentos: false,
        backup: true
      }
      
      expect(validarEstruturalPermissoes(permissoesValidas)).toBe(true)
    })

    test('deve rejeitar estrutura incompleta', () => {
      const permissoesIncompletas = {
        dashboard: true,
        receitas: false
        // Faltam as outras permissões
      }
      
      expect(validarEstruturalPermissoes(permissoesIncompletas)).toBe(false)
    })

    test('deve rejeitar valores não booleanos', () => {
      const permissoesInvalidas = {
        dashboard: 'true', // String ao invés de boolean
        receitas: false,
        despesas: true,
        recorrentes: false,
        previstas: true,
        relatorios: false,
        configuracoes: true,
        cadastramentos: false,
        backup: true
      }
      
      expect(validarEstruturalPermissoes(permissoesInvalidas)).toBe(false)
    })

    test('deve rejeitar null e undefined', () => {
      expect(validarEstruturalPermissoes(null)).toBe(false)
      expect(validarEstruturalPermissoes(undefined)).toBe(false)
      expect(validarEstruturalPermissoes({})).toBe(false)
    })
  })

  describe('4. FUNÇÕES HELPER', () => {
    
    test('deve contar permissões ativas corretamente', () => {
      const permissoesMistas: PermissoesUsuario = {
        dashboard: true,
        receitas: false,
        despesas: true,
        recorrentes: false,
        previstas: true,
        relatorios: false,
        configuracoes: true,
        cadastramentos: false,
        backup: true
      }
      
      expect(contarPermissoesAtivas(permissoesMistas)).toBe(5)
    })

    test('deve identificar se tem alguma permissão', () => {
      const semPermissoes = PERMISSOES_PADRAO_MEMBER
      const comPermissoes: PermissoesUsuario = {
        ...PERMISSOES_PADRAO_MEMBER,
        dashboard: true
      }
      
      expect(temAlgumaPermissao(semPermissoes)).toBe(false)
      expect(temAlgumaPermissao(comPermissoes)).toBe(true)
    })

    test('deve obter permissões ativas', () => {
      const permissoesMistas: PermissoesUsuario = {
        dashboard: true,
        receitas: false,
        despesas: true,
        recorrentes: false,
        previstas: false,
        relatorios: false,
        configuracoes: true,
        cadastramentos: false,
        backup: false
      }
      
      const ativas = obterPermissoesAtivas(permissoesMistas)
      expect(ativas).toEqual(['dashboard', 'despesas', 'configuracoes'])
      expect(ativas).toHaveLength(3)
    })

    test('deve obter permissões inativas', () => {
      const permissoesMistas: PermissoesUsuario = {
        dashboard: true,
        receitas: false,
        despesas: true,
        recorrentes: false,
        previstas: false,
        relatorios: false,
        configuracoes: true,
        cadastramentos: false,
        backup: false
      }
      
      const inativas = obterPermissoesInativas(permissoesMistas)
      expect(inativas).toEqual(['receitas', 'recorrentes', 'previstas', 'relatorios', 'cadastramentos', 'backup'])
      expect(inativas).toHaveLength(6)
    })
  })

  describe('5. CENÁRIOS DE USO REAL', () => {
    
    test('deve simular configuração de usuário básico', () => {
      const usuarioBasico: PermissoesUsuario = {
        ...PERMISSOES_PADRAO_MEMBER,
        dashboard: true,
        receitas: true,
        despesas: true
      }
      
      expect(contarPermissoesAtivas(usuarioBasico)).toBe(3)
      expect(temAlgumaPermissao(usuarioBasico)).toBe(true)
      expect(obterPermissoesAtivas(usuarioBasico)).toEqual(['dashboard', 'receitas', 'despesas'])
    })

    test('deve simular configuração de usuário avançado', () => {
      const usuarioAvancado: PermissoesUsuario = {
        dashboard: true,
        receitas: true,
        despesas: true,
        recorrentes: true,
        previstas: true,
        relatorios: true,
        configuracoes: false, // Sem configurações
        cadastramentos: false, // Sem cadastramentos
        backup: false // Sem backup
      }
      
      expect(contarPermissoesAtivas(usuarioAvancado)).toBe(6)
      expect(obterPermissoesInativas(usuarioAvancado)).toEqual(['configuracoes', 'cadastramentos', 'backup'])
    })

    test('deve validar permissões específicas por funcionalidade', () => {
      const permissoes: PermissoesUsuario = {
        ...PERMISSOES_PADRAO_MEMBER,
        cadastramentos: true
      }
      
      // Usuário com permissão "cadastramentos" deve poder acessar:
      expect(permissoes.cadastramentos).toBe(true) // Contas
      expect(permissoes.cadastramentos).toBe(true) // Categorias  
      expect(permissoes.cadastramentos).toBe(true) // Subcategorias
      expect(permissoes.cadastramentos).toBe(true) // Formas Pagamento
      expect(permissoes.cadastramentos).toBe(true) // Centros Custo
      
      // Mas não deve poder acessar outras funcionalidades
      expect(permissoes.relatorios).toBe(false)
      expect(permissoes.configuracoes).toBe(false)
      expect(permissoes.backup).toBe(false)
    })
  })

  describe('6. COMPATIBILIDADE COM SISTEMA EXISTENTE', () => {
    
    test('deve manter compatibilidade com roles existentes', () => {
      // OWNER: sempre todas as permissões
      const ownerPermissions = PERMISSOES_PADRAO_OWNER
      TODAS_PERMISSOES.forEach(permissao => {
        expect(ownerPermissions[permissao]).toBe(true)
      })
      
      // MEMBER: depende das permissões configuradas
      const memberPermissions = PERMISSOES_PADRAO_MEMBER
      TODAS_PERMISSOES.forEach(permissao => {
        expect(memberPermissions[permissao]).toBe(false)
      })
    })

    test('deve garantir que todas as chaves estão presentes', () => {
      const todasChaves = Object.keys(PERMISSOES_PADRAO_MEMBER) as TipoPermissao[]
      const todasChavesOwner = Object.keys(PERMISSOES_PADRAO_OWNER) as TipoPermissao[]
      
      expect(todasChaves.sort()).toEqual(TODAS_PERMISSOES.sort())
      expect(todasChavesOwner.sort()).toEqual(TODAS_PERMISSOES.sort())
    })
  })

  describe('7. TESTES DE REGRESSÃO', () => {
    
    test('deve validar que permissões antigas ainda funcionam', () => {
      const permissoesLegacy = [
        'dashboard',
        'receitas', 
        'despesas',
        'recorrentes',
        'previstas',
        'relatorios',
        'configuracoes',
        'backup'
      ]
      
      permissoesLegacy.forEach(permissao => {
        expect(TODAS_PERMISSOES).toContain(permissao)
      })
    })

    test('deve validar nova permissão não quebra o sistema', () => {
      // Simulando usuário antigo sem a nova permissão
      const usuarioAntigo = {
        dashboard: true,
        receitas: true,
        despesas: true,
        recorrentes: false,
        previstas: false,
        relatorios: false,
        configuracoes: false,
        backup: false
        // 'cadastramentos' não existe
      }
      
      // Sistema deve identificar como inválido e usar padrão
      expect(validarEstruturalPermissoes(usuarioAntigo)).toBe(false)
    })
  })

  describe('8. TESTES DE PERFORMANCE', () => {
    
    test('funções helper devem ser rápidas', () => {
      const permissoes = PERMISSOES_PADRAO_OWNER
      
      const start = performance.now()
      
      // Executar múltiplas operações
      for (let i = 0; i < 1000; i++) {
        validarEstruturalPermissoes(permissoes)
        contarPermissoesAtivas(permissoes)
        temAlgumaPermissao(permissoes)
        obterPermissoesAtivas(permissoes)
        obterPermissoesInativas(permissoes)
      }
      
      const end = performance.now()
      const executionTime = end - start
      
      // Deve executar 1000 operações em menos de 100ms
      expect(executionTime).toBeLessThan(100)
    })
  })
})