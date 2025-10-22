import { 
  aceitarConvite, 
  usarCodigoConvite,
  verificarSeEmailJaTemConta,
  criarLinkConvite,
  desativarConvite
} from '../convites-simples'
import { supabase } from '../cliente'

// Mock do Supabase client
jest.mock('../cliente', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      admin: {
        listUsers: jest.fn()
      }
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          limit: jest.fn(),
          gte: jest.fn()
        })),
        limit: jest.fn()
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}))

// Mock do middleware
jest.mock('./middleware-workspace', () => ({
  validarOwnerWorkspace: jest.fn()
}))

// Mock dos validadores
jest.mock('../convites/validador-convites', () => ({
  ConviteRateLimiter: {
    podecriarConvite: jest.fn(() => ({ valid: true })),
    registrarConvite: jest.fn()
  },
  ValidadorCodigoConvite: {
    gerarCodigo: jest.fn(() => '4YU2L0'),
    formatarCodigo: jest.fn((codigo) => codigo),
    validarFormato: jest.fn(() => ({ valid: true }))
  },
  ValidadorDadosConvite: {
    validarExpiracao: jest.fn(() => ({ valid: true }))
  },
  SanitizadorConvite: {
    sanitizarCodigo: jest.fn((codigo) => codigo.toUpperCase()),
    sanitizarDadosUsuario: jest.fn((dados) => dados)
  },
  validarConviteCompleto: jest.fn(() => ({ valid: true }))
}))

describe('Sistema de Convites - Testes Críticos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console para capturar logs nos testes
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('aceitarConvite() - Função Modificada CRÍTICA', () => {
    const mockWorkspace = {
      id: 'ws-123',
      nome: 'Meu Workspace'
    }

    beforeEach(() => {
      // Mock da função usarCodigoConvite
      jest.doMock('../convites-simples', () => ({
        ...jest.requireActual('../convites-simples'),
        usarCodigoConvite: jest.fn(() => Promise.resolve({
          workspace: mockWorkspace,
          criadorNome: 'Ricardo'
        }))
      }))
    })

    test('CASO 1: Usuário já autenticado deve funcionar', async () => {
      // Configurar mocks para usuário autenticado
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'teste@teste.com',
            user_metadata: { full_name: 'Teste User' }
          }
        }
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null }) // Usuário não existe na workspace
          })
        }),
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      const resultado = await aceitarConvite('4YU2L0')

      expect(resultado.success).toBe(true)
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usuário autenticado encontrado'))
    })

    test('CASO 2: Usuário recém-criado com email e nome deve funcionar', async () => {
      // Usuário não autenticado ainda
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      })

      // Mock da busca por admin.listUsers()
      ;(supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: {
          users: [{
            id: 'new-user-123',
            email: 'novousuario@teste.com'
          }]
        }
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null }) // Usuário não existe na workspace
          })
        }),
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      const resultado = await aceitarConvite('4YU2L0', 'novousuario@teste.com', 'Novo Usuário')

      expect(resultado.success).toBe(true)
      expect(supabase.auth.admin.listUsers).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usuário recém-criado encontrado'))
    })

    test('CASO 3: Falha quando usuário recém-criado não é encontrado', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      })

      // Usuário não encontrado no admin.listUsers
      ;(supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: { users: [] }
      })

      const resultado = await aceitarConvite('4YU2L0', 'naoexiste@teste.com', 'Usuario Inexistente')

      expect(resultado.success).toBe(false)
      expect(resultado.error).toContain('Usuário não encontrado')
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Usuário não encontrado'))
    })

    test('CASO 4: Usuário já possui workspace - deve falhar', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-existing',
            email: 'existente@teste.com'
          }
        }
      })

      // Mock usuário já existe em workspace
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { 
                id: 'user-existing', 
                workspace_id: 'other-workspace-123' 
              } 
            })
          })
        })
      })

      const resultado = await aceitarConvite('4YU2L0')

      expect(resultado.success).toBe(false)
      expect(resultado.error).toContain('já possui conta no sistema')
    })
  })

  describe('verificarSeEmailJaTemConta()', () => {
    test('Deve detectar email existente via admin.listUsers', async () => {
      ;(supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: {
          users: [{
            email: 'existente@teste.com'
          }]
        }
      })

      const resultado = await verificarSeEmailJaTemConta('existente@teste.com')
      
      expect(resultado).toBe(true)
      expect(supabase.auth.admin.listUsers).toHaveBeenCalled()
    })

    test('Deve fallback para fp_usuarios quando admin falha', async () => {
      ;(supabase.auth.admin.listUsers as jest.Mock).mockRejectedValue(new Error('Admin error'))
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ email: 'existente@teste.com' }],
              error: null
            })
          })
        })
      })

      const resultado = await verificarSeEmailJaTemConta('existente@teste.com')
      
      expect(resultado).toBe(true)
    })

    test('Deve retornar false em caso de erro (permitir convite)', async () => {
      ;(supabase.auth.admin.listUsers as jest.Mock).mockRejectedValue(new Error('Error'))
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              error: new Error('DB Error')
            })
          })
        })
      })

      const resultado = await verificarSeEmailJaTemConta('erro@teste.com')
      
      expect(resultado).toBe(false)
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Erro ao verificar email'))
    })
  })

  describe('usarCodigoConvite()', () => {
    test('Deve validar código e retornar workspace com criador', async () => {
      const mockConvite = {
        codigo: '4YU2L0',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // 1 dia no futuro
        fp_workspaces: {
          id: 'ws-123',
          nome: 'Workspace Teste'
        },
        criador: {
          nome: 'Ricardo'
        }
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockConvite })
              })
            })
          })
        })
      })

      const resultado = await usarCodigoConvite('4YU2L0')

      expect(resultado.workspace).toEqual(mockConvite.fp_workspaces)
      expect(resultado.criadorNome).toBe('Ricardo')
      expect(resultado.error).toBeUndefined()
    })

    test('Deve falhar com código expirado', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null })
              })
            })
          })
        })
      })

      const resultado = await usarCodigoConvite('EXPIRED')

      expect(resultado.error).toBe('Código inválido ou expirado')
      expect(resultado.workspace).toBeUndefined()
    })
  })

  describe('Fluxo Completo de Registro com Convite', () => {
    test('Simular fluxo completo page.tsx linha 94-114', async () => {
      // Cenário: Usuário novo registrando com convite válido
      const dadosConvite = {
        codigo: '4YU2L0',
        workspace: { id: 'ws-123', nome: 'Meu Workspace' }
      }
      const email = 'novo@teste.com'
      const nome = 'Novo Usuário'

      // 1. verificarSeEmailJaTemConta deve retornar false
      ;(supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: { users: [] }
      })

      const emailJaExiste = await verificarSeEmailJaTemConta(email)
      expect(emailJaExiste).toBe(false)

      // 2. Após signUp, simular aceitarConvite
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null } // Usuário ainda não autenticado
      })

      ;(supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: {
          users: [{
            id: 'new-user-id',
            email: email
          }]
        }
      })

      // Mock do insert e outras operações
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null })
          })
        }),
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      // 3. aceitarConvite(dadosConvite.codigo, email, nome)
      const resultado = await aceitarConvite(dadosConvite.codigo, email, nome)

      expect(resultado.success).toBe(true)
      expect(supabase.auth.admin.listUsers).toHaveBeenCalled()
    })
  })

  describe('Dados do Banco - Códigos Válidos', () => {
    test('Código 4YU2L0 deve ser aceito', async () => {
      const mockWorkspace = {
        id: 'ws-ricardo',
        nome: 'Meu Workspace'
      }

      // Simular que o código existe no banco
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    codigo: '4YU2L0',
                    ativo: true,
                    expires_at: new Date(Date.now() + 86400000).toISOString(),
                    fp_workspaces: mockWorkspace,
                    criador: { nome: 'Ricardo' }
                  }
                })
              })
            })
          })
        })
      })

      const resultado = await usarCodigoConvite('4YU2L0')
      
      expect(resultado.workspace).toEqual(mockWorkspace)
      expect(resultado.criadorNome).toBe('Ricardo')
    })

    test('Código SUTOOJ deve ser aceito', async () => {
      const mockWorkspace = {
        id: 'ws-ricardo-2',
        nome: 'Workspace Secundário'
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    codigo: 'SUTOOJ',
                    ativo: true,
                    expires_at: new Date(Date.now() + 86400000).toISOString(),
                    fp_workspaces: mockWorkspace,
                    criador: { nome: 'Ricardo' }
                  }
                })
              })
            })
          })
        })
      })

      const resultado = await usarCodigoConvite('SUTOOJ')
      
      expect(resultado.workspace).toEqual(mockWorkspace)
    })
  })

  describe('Casos Extremos', () => {
    test('Email já existente deve ser rejeitado no registro', async () => {
      ;(supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: {
          users: [{
            email: 'jaexiste@teste.com'
          }]
        }
      })

      const emailJaExiste = await verificarSeEmailJaTemConta('jaexiste@teste.com')
      
      expect(emailJaExiste).toBe(true)
    })

    test('Convite expirado deve ser rejeitado', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null })
              })
            })
          })
        })
      })

      const resultado = await usarCodigoConvite('EXPIRED')
      
      expect(resultado.error).toBe('Código inválido ou expirado')
    })

    test('Código inválido deve ser rejeitado', async () => {
      const { SanitizadorConvite, ValidadorCodigoConvite } = require('../convites/validador-convites')
      
      ValidadorCodigoConvite.validarFormato.mockReturnValue({
        valid: false,
        error: 'Código inválido'
      })

      const resultado = await usarCodigoConvite('INVALID')
      
      expect(resultado.error).toBe('Código inválido')
    })
  })

  describe('Logs e Auditoria', () => {
    test('Deve registrar logs corretos no console', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'teste@teste.com'
          }
        }
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null })
          })
        }),
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      await aceitarConvite('4YU2L0')

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Iniciando aceitarConvite'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Workspace do convite'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Convite aceito com sucesso'))
    })

    test('Deve registrar auditoria no banco', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      
      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'fp_audit_logs') {
          return { insert: mockInsert }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null })
            })
          }),
          insert: jest.fn().mockResolvedValue({ error: null })
        }
      })

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'teste@teste.com'
          }
        }
      })

      await aceitarConvite('4YU2L0')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'convite_usado',
          entity_type: 'convite'
        })
      )
    })
  })
})