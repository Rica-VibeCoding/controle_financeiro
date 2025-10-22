import {
  ConviteRateLimiter,
  ValidadorCodigoConvite,
  ValidadorDadosConvite,
  SanitizadorConvite,
  validarConviteCompleto
} from '../validador-convites'

describe('Validadores de Convites', () => {
  
  describe('ValidadorCodigoConvite', () => {
    describe('validarFormato()', () => {
      test('Deve aceitar códigos válidos', () => {
        const codigosValidos = ['4YU2L0', 'SUTOOJ', 'ABC123', 'XYZ789']
        
        codigosValidos.forEach(codigo => {
          const resultado = ValidadorCodigoConvite.validarFormato(codigo)
          expect(resultado.valid).toBe(true)
          expect(resultado.error).toBeUndefined()
        })
      })

      test('Deve rejeitar códigos inválidos', () => {
        const codigosInvalidos = [
          { codigo: '', erro: 'Código não pode estar vazio' },
          { codigo: '123', erro: 'Código deve ter 6 caracteres alfanuméricos' },
          { codigo: '1234567', erro: 'Código deve ter 6 caracteres alfanuméricos' },
          { codigo: 'ABC-123', erro: 'Código deve ter 6 caracteres alfanuméricos' },
          { codigo: 'abc123', erro: false }, // Deve ser convertido para maiúsculo
          { codigo: '   ABC123   ', erro: false }, // Deve ser trimmed
        ]
        
        codigosInvalidos.forEach(({ codigo, erro }) => {
          const resultado = ValidadorCodigoConvite.validarFormato(codigo)
          if (erro) {
            expect(resultado.valid).toBe(false)
            expect(resultado.error).toContain(erro.toString())
          } else {
            expect(resultado.valid).toBe(true) // Casos que devem passar após limpeza
          }
        })
      })

      test('Deve tratar códigos em minúsculo', () => {
        const resultado = ValidadorCodigoConvite.validarFormato('abc123')
        expect(resultado.valid).toBe(true)
      })

      test('Deve tratar espaços em branco', () => {
        const resultado = ValidadorCodigoConvite.validarFormato('  4YU2L0  ')
        expect(resultado.valid).toBe(true)
      })
    })

    describe('gerarCodigo()', () => {
      test('Deve gerar código com 6 caracteres', () => {
        const codigo = ValidadorCodigoConvite.gerarCodigo()
        expect(codigo).toHaveLength(6)
        expect(/^[A-Z0-9]{6}$/.test(codigo)).toBe(true)
      })

      test('Deve gerar códigos únicos', () => {
        const codigos = new Set()
        
        // Gerar 100 códigos e verificar unicidade
        for (let i = 0; i < 100; i++) {
          codigos.add(ValidadorCodigoConvite.gerarCodigo())
        }
        
        // Deve ter alta probabilidade de códigos únicos
        expect(codigos.size).toBeGreaterThan(95)
      })
    })

    describe('formatarCodigo()', () => {
      test('Deve formatar código com hífen', () => {
        expect(ValidadorCodigoConvite.formatarCodigo('4YU2L0')).toBe('4YU-2L0')
        expect(ValidadorCodigoConvite.formatarCodigo('SUTOOJ')).toBe('SUT-OOJ')
      })

      test('Deve tratar códigos malformados', () => {
        expect(ValidadorCodigoConvite.formatarCodigo('abc')).toBe('ABC')
        expect(ValidadorCodigoConvite.formatarCodigo('  4yu2l0  ')).toBe('4YU-2L0')
      })
    })

    describe('limparCodigo()', () => {
      test('Deve remover caracteres especiais', () => {
        expect(ValidadorCodigoConvite.limparCodigo('4YU-2L0')).toBe('4YU2L0')
        expect(ValidadorCodigoConvite.limparCodigo('4yu 2l0')).toBe('4YU2L0')
        expect(ValidadorCodigoConvite.limparCodigo('4yu@2l0#')).toBe('4YU2L0')
      })
    })
  })

  describe('ValidadorDadosConvite', () => {
    describe('validarCriacao()', () => {
      test('Deve aceitar workspace ID válido', () => {
        const workspaceIdValido = '123e4567-e89b-12d3-a456-426614174000'
        const resultado = ValidadorDadosConvite.validarCriacao(workspaceIdValido)
        expect(resultado.valid).toBe(true)
      })

      test('Deve rejeitar workspace ID inválido', () => {
        const idsInvalidos = [
          '',
          'não-é-uuid',
          '123',
          'workspace-123',
          null,
          undefined
        ]
        
        idsInvalidos.forEach(id => {
          const resultado = ValidadorDadosConvite.validarCriacao(id as string)
          expect(resultado.valid).toBe(false)
          expect(resultado.error).toBeDefined()
        })
      })
    })

    describe('validarExpiracao()', () => {
      test('Deve aceitar datas futuras', () => {
        const dataFutura = new Date(Date.now() + 86400000) // 1 dia no futuro
        const resultado = ValidadorDadosConvite.validarExpiracao(dataFutura)
        expect(resultado.valid).toBe(true)
      })

      test('Deve aceitar strings de data futuras', () => {
        const dataFutura = new Date(Date.now() + 86400000).toISOString()
        const resultado = ValidadorDadosConvite.validarExpiracao(dataFutura)
        expect(resultado.valid).toBe(true)
      })

      test('Deve rejeitar datas passadas', () => {
        const dataPassada = new Date(Date.now() - 86400000) // 1 dia no passado
        const resultado = ValidadorDadosConvite.validarExpiracao(dataPassada)
        expect(resultado.valid).toBe(false)
        expect(resultado.error).toBe('Convite expirado')
      })

      test('Deve rejeitar datas inválidas', () => {
        const datasInvalidas = ['data-inválida', '']
        
        datasInvalidas.forEach(data => {
          const resultado = ValidadorDadosConvite.validarExpiracao(data as string)
          expect(resultado.valid).toBe(false)
          expect(resultado.error).toBe('Data de expiração inválida')
        })

        // Testar null e undefined separadamente
        const resultadoNull = ValidadorDadosConvite.validarExpiracao(null as any)
        expect(resultadoNull.valid).toBe(false)

        const resultadoUndefined = ValidadorDadosConvite.validarExpiracao(undefined as any)
        expect(resultadoUndefined.valid).toBe(false)
      })
    })

    describe('validarAceitacao()', () => {
      test('Deve aceitar dados válidos', () => {
        const resultado = ValidadorDadosConvite.validarAceitacao(
          'user-123',
          'workspace-456',
          false
        )
        expect(resultado.valid).toBe(true)
      })

      test('Deve rejeitar usuário não autenticado', () => {
        const resultado = ValidadorDadosConvite.validarAceitacao(
          '',
          'workspace-456',
          false
        )
        expect(resultado.valid).toBe(false)
        expect(resultado.error).toBe('Usuário não autenticado')
      })

      test('Deve rejeitar workspace inválido', () => {
        const resultado = ValidadorDadosConvite.validarAceitacao(
          'user-123',
          '',
          false
        )
        expect(resultado.valid).toBe(false)
        expect(resultado.error).toBe('Workspace inválido')
      })

      test('Deve rejeitar se usuário já está no workspace', () => {
        const resultado = ValidadorDadosConvite.validarAceitacao(
          'user-123',
          'workspace-456',
          true
        )
        expect(resultado.valid).toBe(false)
        expect(resultado.error).toBe('Você já é membro deste workspace')
      })
    })
  })

  describe('SanitizadorConvite', () => {
    describe('sanitizarCodigo()', () => {
      test('Deve sanitizar códigos corretamente', () => {
        expect(SanitizadorConvite.sanitizarCodigo('4yu-2l0')).toBe('4YU2L0')
        expect(SanitizadorConvite.sanitizarCodigo('  abc 123  ')).toBe('ABC123')
        expect(SanitizadorConvite.sanitizarCodigo('x@y#z$1%2&3')).toBe('XYZ123')
      })
    })

    describe('sanitizarDadosUsuario()', () => {
      test('Deve sanitizar dados do usuário', () => {
        const dadosInput = {
          id: 'user-123',
          workspace_id: 'ws-456',
          nome: '<script>alert("xss")</script>João Silva',
          role: 'member',
          ativo: 'true'
        }

        const dadosLimpos = SanitizadorConvite.sanitizarDadosUsuario(dadosInput)

        expect(dadosLimpos).toEqual({
          id: 'user-123',
          workspace_id: 'ws-456',
          nome: 'João Silva', // Script removido
          role: 'member',
          ativo: true // Convertido para boolean
        })
      })

      test('Deve tratar role owner corretamente', () => {
        const dadosOwner = {
          id: 'user-123',
          workspace_id: 'ws-456',
          nome: 'Owner User',
          role: 'owner',
          ativo: true
        }

        const resultado = SanitizadorConvite.sanitizarDadosUsuario(dadosOwner)
        expect(resultado.role).toBe('owner')
      })

      test('Deve tratar roles inválidos como member', () => {
        const dadosInvalidos = {
          id: 'user-123',
          workspace_id: 'ws-456',
          nome: 'User',
          role: 'admin', // Role inválido
          ativo: true
        }

        const resultado = SanitizadorConvite.sanitizarDadosUsuario(dadosInvalidos)
        expect(resultado.role).toBe('member')
      })

      test('Deve limitar tamanho do nome', () => {
        const nomeGigante = 'A'.repeat(300)
        const dados = {
          id: 'user-123',
          workspace_id: 'ws-456',
          nome: nomeGigante,
          role: 'member',
          ativo: true
        }

        const resultado = SanitizadorConvite.sanitizarDadosUsuario(dados)
        expect(resultado.nome.length).toBeLessThanOrEqual(255)
      })

      test('Deve usar nome padrão se não fornecido', () => {
        const dados = {
          id: 'user-123',
          workspace_id: 'ws-456',
          role: 'member',
          ativo: true
        }

        const resultado = SanitizadorConvite.sanitizarDadosUsuario(dados)
        expect(resultado.nome).toBe('Usuário')
      })
    })
  })

  describe('ConviteRateLimiter', () => {
    // Mock localStorage para testes
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    
    beforeEach(() => {
      jest.clearAllMocks()
      // @ts-expect-error - Mock para testes
      global.localStorage = localStorageMock
      // @ts-expect-error - Mock para testes
      global.window = { localStorage: localStorageMock }
    })

    afterEach(() => {
      // @ts-expect-error - Mock para testes
      global.window = undefined
      // @ts-expect-error - Mock para testes
      global.localStorage = undefined
    })

    describe('podecriarConvite()', () => {
      test('Deve permitir primeiro convite', () => {
        localStorageMock.getItem.mockReturnValue(null)
        
        const resultado = ConviteRateLimiter.podecriarConvite('workspace-123')
        expect(resultado.valid).toBe(true)
      })

      test('Deve permitir convites dentro do limite', () => {
        const rateLimitData = {
          count: 5,
          firstAttempt: Date.now() - 1000,
          lastAttempt: Date.now()
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData))
        
        const resultado = ConviteRateLimiter.podecriarConvite('workspace-123')
        expect(resultado.valid).toBe(true)
      })

      test('Deve bloquear quando limite é atingido', () => {
        const rateLimitData = {
          count: 10, // Limite máximo
          firstAttempt: Date.now() - 1000,
          lastAttempt: Date.now()
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData))
        
        const resultado = ConviteRateLimiter.podecriarConvite('workspace-123')
        expect(resultado.valid).toBe(false)
        expect(resultado.error).toContain('Limite de 10 convites por dia atingido')
      })

      test('Deve resetar limite após 24 horas', () => {
        const rateLimitData = {
          count: 10,
          firstAttempt: Date.now() - (25 * 60 * 60 * 1000), // 25 horas atrás
          lastAttempt: Date.now() - (25 * 60 * 60 * 1000)
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData))
        
        const resultado = ConviteRateLimiter.podecriarConvite('workspace-123')
        expect(resultado.valid).toBe(true)
        expect(localStorageMock.removeItem).toHaveBeenCalled()
      })
    })

    describe('registrarConvite()', () => {
      test('Deve registrar primeiro convite', () => {
        localStorageMock.getItem.mockReturnValue(null)
        
        ConviteRateLimiter.registrarConvite('workspace-123')
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'fp_convites_rate_limit_workspace-123',
          expect.stringContaining('"count":1')
        )
      })

      test('Deve incrementar contador', () => {
        const rateLimitData = {
          count: 3,
          firstAttempt: Date.now() - 1000,
          lastAttempt: Date.now() - 500
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData))
        
        ConviteRateLimiter.registrarConvite('workspace-123')
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'fp_convites_rate_limit_workspace-123',
          expect.stringContaining('"count":4')
        )
      })
    })
  })

  describe('validarConviteCompleto()', () => {
    test('Deve validar criação de convite completa', () => {
      const dados = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Mock localStorage vazio (sem rate limit)
      const localStorageMock = { getItem: jest.fn(() => null) }
      // @ts-expect-error - Mock para testes
      global.localStorage = localStorageMock
      // @ts-expect-error - Mock para testes
      global.window = {}

      const resultado = validarConviteCompleto('criar', dados)
      expect(resultado.valid).toBe(true)
    })

    test('Deve validar aceitação de convite completa', () => {
      const dados = {
        codigo: '4YU2L0',
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      }

      const resultado = validarConviteCompleto('aceitar', dados)
      expect(resultado.valid).toBe(true)
    })

    test('Deve falhar com ação inválida', () => {
      const resultado = validarConviteCompleto('invalid' as any, {})
      expect(resultado.valid).toBe(false)
      expect(resultado.error).toBe('Ação inválida')
    })

    test('Deve propagar erros de validação específica', () => {
      const dados = {
        workspaceId: 'invalid-workspace-id'
      }

      // @ts-expect-error - Mock para testes
      global.window = {}

      const resultado = validarConviteCompleto('criar', dados)
      expect(resultado.valid).toBe(false)
      expect(resultado.error).toContain('Workspace ID inválido')
    })
  })

  describe('Integração com Códigos Reais do Banco', () => {
    test('Códigos 4YU2L0 e SUTOOJ devem passar na validação', () => {
      const codigosReais = ['4YU2L0', 'SUTOOJ']
      
      codigosReais.forEach(codigo => {
        const validacao = ValidadorCodigoConvite.validarFormato(codigo)
        expect(validacao.valid).toBe(true)
        expect(validacao.error).toBeUndefined()
      })
    })

    test('Códigos reais devem ser sanitizados corretamente', () => {
      expect(SanitizadorConvite.sanitizarCodigo('4yu2l0')).toBe('4YU2L0')
      expect(SanitizadorConvite.sanitizarCodigo('sutooj')).toBe('SUTOOJ')
    })

    test('Validação completa deve funcionar com códigos reais', () => {
      const dadosAceitacao = {
        codigo: '4YU2L0',
        expiresAt: '2025-12-31T00:00:00.000Z'
      }

      const resultado = validarConviteCompleto('aceitar', dadosAceitacao)
      expect(resultado.valid).toBe(true)
    })
  })
})