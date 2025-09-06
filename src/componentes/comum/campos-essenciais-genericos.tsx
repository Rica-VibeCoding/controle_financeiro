'use client'

import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { SkeletonInput, SkeletonLabel } from '@/componentes/ui/skeleton'
import { IconePicker } from '@/componentes/ui/icone-picker'
import { Icone } from '@/componentes/ui/icone'

type TipoEntidade = 'categoria' | 'conta' | 'subcategoria' | 'forma-pagamento' | 'centro-custo'

interface CampoConfig {
  nome: string
  tipo: 'text' | 'select' | 'number' | 'icone' | 'cor' | 'checkbox'
  obrigatorio?: boolean
  placeholder?: string
  opcoes?: { value: string; label: string }[]
  condicional?: (dados: any) => boolean
  validacao?: (valor: any) => string | null
}

interface CamposEssenciaisGenericosProps {
  tipo: TipoEntidade
  dados: Record<string, any>
  onChange: (campo: string, valor: any) => void
  erros?: string[]
  carregando?: boolean
  dadosAuxiliares?: {
    categorias?: any[]
    contas?: any[]
    tiposConta?: string[]
  }
}

// Configurações de campos por tipo de entidade
const CONFIGURACOES_CAMPOS: Record<TipoEntidade, CampoConfig[]> = {
  categoria: [
    {
      nome: 'nome',
      tipo: 'text',
      obrigatorio: true,
      placeholder: 'Ex: Alimentação, Transporte, Salário...'
    },
    {
      nome: 'tipo',
      tipo: 'select',
      obrigatorio: true,
      opcoes: [
        { value: 'receita', label: 'Receita' },
        { value: 'despesa', label: 'Despesa' },
        { value: 'ambos', label: 'Ambos' }
      ]
    },
    {
      nome: 'icone',
      tipo: 'icone',
      obrigatorio: false
    },
    {
      nome: 'cor',
      tipo: 'cor',
      obrigatorio: false
    }
  ],
  conta: [
    {
      nome: 'nome',
      tipo: 'text',
      obrigatorio: true,
      placeholder: 'Ex: Conta Corrente Banco do Brasil'
    },
    {
      nome: 'tipo',
      tipo: 'select',
      obrigatorio: true,
      opcoes: [
        { value: 'conta_corrente', label: 'Conta Corrente' },
        { value: 'conta_poupanca', label: 'Conta Poupança' },
        { value: 'cartao_credito', label: 'Cartão de Crédito' },
        { value: 'cartao_debito', label: 'Cartão de Débito' },
        { value: 'dinheiro', label: 'Dinheiro' },
        { value: 'investimento', label: 'Investimento' }
      ]
    },
    {
      nome: 'banco',
      tipo: 'text',
      obrigatorio: false,
      placeholder: 'Ex: Banco do Brasil, Nubank, Inter...'
    },
    {
      nome: 'limite',
      tipo: 'number',
      obrigatorio: false,
      condicional: (dados) => dados.tipo === 'cartao_credito',
      placeholder: '0.00'
    },
    {
      nome: 'data_fechamento',
      tipo: 'number',
      obrigatorio: false,
      condicional: (dados) => dados.tipo === 'cartao_credito',
      placeholder: 'Dia do mês (1-31)'
    }
  ],
  subcategoria: [
    {
      nome: 'nome',
      tipo: 'text',
      obrigatorio: true,
      placeholder: 'Ex: Supermercado, Restaurantes, Combustível...'
    },
    {
      nome: 'categoria_id',
      tipo: 'select',
      obrigatorio: true,
      opcoes: [] // Será preenchido dinamicamente
    }
  ],
  'forma-pagamento': [
    {
      nome: 'nome',
      tipo: 'text',
      obrigatorio: true,
      placeholder: 'Ex: PIX, Dinheiro, Cartão de Crédito...'
    },
    {
      nome: 'tipo',
      tipo: 'select',
      obrigatorio: true,
      opcoes: [
        { value: 'dinheiro', label: 'Dinheiro' },
        { value: 'pix', label: 'PIX' },
        { value: 'debito', label: 'Cartão de Débito' },
        { value: 'credito', label: 'Cartão de Crédito' },
        { value: 'transferencia', label: 'Transferência Bancária' },
        { value: 'boleto', label: 'Boleto' },
        { value: 'outros', label: 'Outros' }
      ]
    },
    {
      nome: 'permite_parcelamento',
      tipo: 'checkbox',
      obrigatorio: false
    }
  ],
  'centro-custo': [
    {
      nome: 'nome',
      tipo: 'text',
      obrigatorio: true,
      placeholder: 'Ex: Casa, Trabalho, Projeto X...'
    },
    {
      nome: 'descricao',
      tipo: 'text',
      obrigatorio: false,
      placeholder: 'Descrição opcional do centro de custo'
    },
    {
      nome: 'cor',
      tipo: 'cor',
      obrigatorio: false
    }
  ]
}

/**
 * Formata o valor para exibição no input de cor
 */
const formatarCor = (cor: string | undefined): string => {
  if (!cor) return '#3B82F6' // Azul padrão
  if (cor.startsWith('#')) return cor
  return `#${cor}`
}

export function CamposEssenciaisGenericos({
  tipo,
  dados,
  onChange,
  erros = [],
  carregando = false,
  dadosAuxiliares = {}
}: CamposEssenciaisGenericosProps) {
  const configuracao = CONFIGURACOES_CAMPOS[tipo]
  
  // Preparar opções dinâmicas
  const prepararOpcoes = (campo: CampoConfig): { value: string; label: string }[] => {
    if (campo.nome === 'categoria_id' && dadosAuxiliares.categorias) {
      return dadosAuxiliares.categorias.map((cat: any) => ({
        value: cat.id,
        label: cat.nome
      }))
    }
    return campo.opcoes || []
  }

  const renderizarCampo = (campo: CampoConfig) => {
    // Verificar se campo é condicional ANTES de gerar qualquer coisa
    if (campo.condicional && !campo.condicional(dados)) {
      return null
    }

    const id = `campo-${tipo}-${campo.nome}`
    const valor = dados[campo.nome] || ''
    const temErro = erros.some(erro => erro.includes(campo.nome))

    if (carregando) {
      return (
        <div key={campo.nome}>
          <SkeletonLabel />
          <SkeletonInput />
        </div>
      )
    }

    const labelTexto = campo.nome.charAt(0).toUpperCase() + campo.nome.slice(1).replace(/_/g, ' ')
    const label = (
      <Label htmlFor={id}>
        {labelTexto} {campo.obrigatorio && <span className="text-red-500">*</span>}
      </Label>
    )

    switch (campo.tipo) {
      case 'text':
      case 'number':
        return (
          <div key={campo.nome}>
            {label}
            <Input
              id={id}
              type={campo.tipo}
              placeholder={campo.placeholder}
              value={valor}
              onChange={(e) => onChange(campo.nome, campo.tipo === 'number' ? Number(e.target.value) : e.target.value)}
              required={campo.obrigatorio}
              className={temErro ? 'border-red-500' : ''}
              step={campo.tipo === 'number' ? '0.01' : undefined}
              min={campo.tipo === 'number' ? '0' : undefined}
            />
          </div>
        )

      case 'select':
        const opcoes = prepararOpcoes(campo)
        return (
          <div key={campo.nome}>
            {label}
            <Select
              id={id}
              value={valor}
              onChange={(e) => onChange(campo.nome, e.target.value)}
              required={campo.obrigatorio}
              className={temErro ? 'border-red-500' : ''}
            >
              <option value="">Selecione uma opção</option>
              {opcoes.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </Select>
          </div>
        )

      case 'icone':
        return (
          <div key={campo.nome} className="md:col-span-2">
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">
                Ícone {campo.obrigatorio && <span className="text-red-500">*</span>}
              </span>
            </div>
            <IconePicker
              iconeSelecionado={valor}
              onIconeChange={(icone: string) => onChange(campo.nome, icone)}
            />
          </div>
        )

      case 'cor':
        return (
          <div key={campo.nome}>
            {label}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer flex items-center justify-center hover:shadow-sm transition-shadow"
                style={{ backgroundColor: formatarCor(valor) }}
                onClick={() => document.getElementById(`color-input-${campo.nome}`)?.click()}
                title="Clique para escolher a cor"
              >
                <span className="text-white text-sm">🎨</span>
              </div>
              <input
                id={`color-input-${campo.nome}`}
                type="color"
                value={formatarCor(valor)}
                onChange={(e) => onChange(campo.nome, e.target.value)}
                className="sr-only"
              />
              <Input
                id={id}
                type="text"
                placeholder="#3B82F6"
                value={valor}
                onChange={(e) => onChange(campo.nome, e.target.value)}
                className="font-mono text-sm flex-1"
              />
            </div>
          </div>
        )

      case 'checkbox':
        return (
          <div key={campo.nome} className="flex items-center gap-2">
            <input
              id={id}
              type="checkbox"
              checked={Boolean(valor)}
              onChange={(e) => onChange(campo.nome, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor={id} className="cursor-pointer">
              {labelTexto}
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {configuracao.map(renderizarCampo)}
    </div>
  )
}