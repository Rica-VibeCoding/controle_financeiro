/**
 * TESTE DE INTEGRAÇÃO - MODAL DE PERMISSÕES
 * 
 * Valida se o componente ModalPermissoes renderiza corretamente
 * e manipula todas as 9 permissões granulares conforme esperado
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ModalPermissoes } from '../modal-permissoes'
import { TODAS_PERMISSOES, ROTULOS_PERMISSOES, PERMISSOES_PADRAO_MEMBER } from '@/tipos/permissoes'
import type { Usuario } from '@/tipos/auth'
import type { PermissoesUsuario, ResultadoPermissoes } from '@/tipos/permissoes'

// Mock dos contextos necessários
jest.mock('@/contextos/toast-contexto', () => ({
  useToast: () => ({
    sucesso: jest.fn(),
    erro: jest.fn()
  })
}))

// Mock do ModalBase
jest.mock('@/componentes/modais/modal-base', () => ({
  ModalBase: ({ children, isOpen, title }: any) => 
    isOpen ? (
      <div data-testid="modal-base">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null
}))

// Mock do Icone
jest.mock('@/componentes/ui/icone', () => ({
  Icone: ({ name, className }: any) => (
    <span data-testid={`icon-${name}`} className={className}>{name}</span>
  )
}))

// Mock do Button
jest.mock('@/componentes/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  )
}))

describe('ModalPermissoes', () => {
  const mockUsuario: Usuario = {
    id: 'user-123',
    nome: 'João Silva',
    email: 'joao@exemplo.com',
    role: 'member',
    ativo: true,
    workspace_id: 'workspace-123',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    permissoes: PERMISSOES_PADRAO_MEMBER
  }

  const mockOnSave = jest.fn<Promise<ResultadoPermissoes>, [string, PermissoesUsuario]>()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnSave.mockResolvedValue({ success: true })
  })

  describe('Renderização do Modal', () => {
    
    test('deve renderizar modal quando isOpen=true', () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByTestId('modal-base')).toBeInTheDocument()
      expect(screen.getByText('🔐 Permissões: João Silva')).toBeInTheDocument()
    })

    test('não deve renderizar modal quando isOpen=false', () => {
      render(
        <ModalPermissoes
          isOpen={false}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.queryByTestId('modal-base')).not.toBeInTheDocument()
    })

    test('não deve renderizar modal quando usuario=null', () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={null}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.queryByTestId('modal-base')).not.toBeInTheDocument()
    })
  })

  describe('Exibição das 9 Permissões', () => {
    
    test('deve exibir todas as 9 permissões granulares', () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Verificar se todas as 9 permissões estão sendo exibidas
      TODAS_PERMISSOES.forEach(permissao => {
        expect(screen.getByText(ROTULOS_PERMISSOES[permissao])).toBeInTheDocument()
      })
    })

    test('deve exibir contadores corretos de permissões', () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Para MEMBER com permissões padrão (todas desabilitadas)
      expect(screen.getByText('📊 0 de 9 funcionalidades liberadas')).toBeInTheDocument()
      expect(screen.getByText('Membro')).toBeInTheDocument()
    })

    test('deve exibir ícones para todas as permissões', () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Verificar ícones específicos importantes
      expect(screen.getByTestId('icon-layout-dashboard')).toBeInTheDocument() // dashboard
      expect(screen.getByTestId('icon-clock')).toBeInTheDocument() // previstas (ícone corrigido)
      expect(screen.getByTestId('icon-database')).toBeInTheDocument() // cadastramentos (nova permissão)
    })
  })

  describe('Interação com Switches de Permissão', () => {
    
    test('deve permitir alternar permissões com toggle switches', async () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Encontrar todos os toggle buttons (switches)
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('rounded-full')
      )

      expect(toggleButtons).toHaveLength(9) // Uma para cada permissão

      // Clicar no primeiro toggle (dashboard) usando fireEvent
      fireEvent.click(toggleButtons[0])

      // Verificar se o contador foi atualizado
      await waitFor(() => {
        expect(screen.getByText('📊 1 de 9 funcionalidades liberadas')).toBeInTheDocument()
      })
    })

    test('deve exibir status ON/OFF corretamente', () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Para usuário MEMBER com permissões padrão, todos devem estar OFF
      const statusElements = screen.getAllByText('OFF')
      expect(statusElements).toHaveLength(9)

      // Não deve haver nenhum status ON
      expect(screen.queryByText('ON')).not.toBeInTheDocument()
    })
  })

  describe('Salvamento de Permissões', () => {
    
    test('deve chamar onSave com permissões corretas', async () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Ativar algumas permissões
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('rounded-full')
      )

      // Ativar dashboard e receitas (primeiros 2 toggles)
      fireEvent.click(toggleButtons[0]) // dashboard
      fireEvent.click(toggleButtons[1]) // receitas

      // Clicar em "Salvar Alterações"
      const salvarButton = screen.getByText('Salvar Alterações')
      fireEvent.click(salvarButton)

      // Verificar se onSave foi chamado com as permissões corretas
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('user-123', expect.objectContaining({
          dashboard: true,
          receitas: true,
          despesas: false,
          recorrentes: false,
          previstas: false,
          relatorios: false,
          configuracoes: false,
          cadastramentos: false,
          backup: false
        }))
      })
    })

    test('deve exibir loading durante salvamento', async () => {
      // Mock onSave para demorar um tempo
      mockOnSave.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ success: true }), 100)
      ))
      
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const salvarButton = screen.getByText('Salvar Alterações')
      fireEvent.click(salvarButton)

      // Verificar se mostra estado de loading
      expect(screen.getByText('Salvando...')).toBeInTheDocument()
      
      // Aguardar conclusão
      await waitFor(() => {
        expect(screen.queryByText('Salvando...')).not.toBeInTheDocument()
      }, { timeout: 200 })
    })
  })

  describe('Validações de Usuário Owner', () => {
    
    test('deve exibir "Proprietário" para usuários owner', () => {
      const ownerUser: Usuario = {
        ...mockUsuario,
        role: 'owner'
      }

      render(
        <ModalPermissoes
          isOpen={true}
          usuario={ownerUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('Proprietário')).toBeInTheDocument()
    })
  })

  describe('Testes da Nova Permissão "Cadastramentos"', () => {
    
    test('deve incluir permissão "cadastramentos" na lista', () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('Cadastramentos')).toBeInTheDocument()
      expect(screen.getByTestId('icon-database')).toBeInTheDocument()
    })

    test('deve permitir ativar apenas permissão cadastramentos', async () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Encontrar o toggle para cadastramentos (8º na lista)
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('rounded-full')
      )

      // Ativar apenas cadastramentos
      fireEvent.click(toggleButtons[7]) // cadastramentos é o 8º item (índice 7)

      // Salvar
      const salvarButton = screen.getByText('Salvar Alterações')
      fireEvent.click(salvarButton)

      // Verificar se foi salvo com apenas cadastramentos ativo
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('user-123', expect.objectContaining({
          dashboard: false,
          receitas: false,
          despesas: false,
          recorrentes: false,
          previstas: false,
          relatorios: false,
          configuracoes: false,
          cadastramentos: true,
          backup: false
        }))
      })
    })
  })

  describe('Cancelamento e Fechamento', () => {
    
    test('deve chamar onClose ao clicar em Cancelar', () => {
      render(
        <ModalPermissoes
          isOpen={true}
          usuario={mockUsuario}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const cancelarButton = screen.getByText('Cancelar')
      fireEvent.click(cancelarButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})