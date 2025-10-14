'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

// Tipos de modais existentes + novos
type TipoModal = 
  | 'transferencia' 
  | 'lancamento' 
  | 'parcelamento' 
  | 'importacao'
  | 'categoria' 
  | 'conta' 
  | 'subcategoria' 
  | 'forma-pagamento' 
  | 'centro-custo'
  | 'gestao-usuarios'
  | null

// Estado individual de cada modal novo
interface EstadoModal {
  isOpen: boolean
  entidadeId?: string
}

interface ModaisContextoType {
  // Sistema antigo (manter compatibilidade)
  modalAberto: TipoModal
  dadosModal: any
  abrirModal: (tipo: TipoModal, dados?: any) => void
  fecharModal: () => void
  
  // Sistema novo - Estados dos modais
  modalCategoria: EstadoModal
  modalConta: EstadoModal
  modalSubcategoria: EstadoModal
  modalFormaPagamento: EstadoModal
  modalCentroCusto: EstadoModal
  modalGestaoUsuarios: EstadoModal
  modalCliente: boolean
  modalFornecedor: boolean
  
  // Sistema novo - Ações específicas por modal
  categoria: {
    abrir: (id?: string) => void
    fechar: () => void
  }
  
  conta: {
    abrir: (id?: string) => void
    fechar: () => void
  }
  
  subcategoria: {
    abrir: (id?: string) => void
    fechar: () => void
  }
  
  formaPagamento: {
    abrir: (id?: string) => void
    fechar: () => void
  }
  
  centroCusto: {
    abrir: (id?: string) => void
    fechar: () => void
  }
  
  gestaoUsuarios: {
    abrir: (id?: string) => void
    fechar: () => void
  }

  cliente: {
    abrir: (id?: string) => void
    fechar: () => void
    clienteId?: string
  }

  fornecedor: {
    abrir: (id?: string) => void
    fechar: () => void
    fornecedorId?: string
  }

  // Sistema novo - Métodos unificados
  abrirModalNovo: (tipo: Exclude<TipoModal, null>, id?: string) => void
  fecharModalNovo: (tipo: Exclude<TipoModal, null>) => void
  fecharTodosModais: () => void
  
  // Sistema novo - Utilidades
  algumModalAberto: boolean
  quantidadeModaisAbertos: number
}

const ModaisContexto = createContext<ModaisContextoType | undefined>(undefined)

interface ModaisProviderProps {
  children: ReactNode
}

// Estado inicial dos modais
const ESTADO_INICIAL_MODAL: EstadoModal = {
  isOpen: false,
  entidadeId: undefined
}

export function ModaisProvider({ children }: ModaisProviderProps) {
  // Sistema antigo (manter compatibilidade)
  const [modalAberto, setModalAberto] = useState<TipoModal>(null)
  const [dadosModal, setDadosModal] = useState<any>(null)

  // Sistema novo - Estados individuais dos modais
  const [modalCategoria, setModalCategoria] = useState<EstadoModal>(ESTADO_INICIAL_MODAL)
  const [modalConta, setModalConta] = useState<EstadoModal>(ESTADO_INICIAL_MODAL)
  const [modalSubcategoria, setModalSubcategoria] = useState<EstadoModal>(ESTADO_INICIAL_MODAL)
  const [modalFormaPagamento, setModalFormaPagamento] = useState<EstadoModal>(ESTADO_INICIAL_MODAL)
  const [modalCentroCusto, setModalCentroCusto] = useState<EstadoModal>(ESTADO_INICIAL_MODAL)
  const [modalGestaoUsuarios, setModalGestaoUsuarios] = useState<EstadoModal>(ESTADO_INICIAL_MODAL)

  const [modalCliente, setModalCliente] = useState(false)
  const [clienteId, setClienteId] = useState<string | undefined>()

  const [modalFornecedor, setModalFornecedor] = useState(false)
  const [fornecedorId, setFornecedorId] = useState<string | undefined>()

  // Sistema antigo (manter compatibilidade)
  const abrirModal = (tipo: TipoModal, dados?: any) => {
    setModalAberto(tipo)
    setDadosModal(dados || null)
  }

  const fecharModal = () => {
    setModalAberto(null)
    setDadosModal(null)
  }

  // Sistema novo - Mapear tipos para setters
  const settersMap = {
    categoria: setModalCategoria,
    conta: setModalConta,
    subcategoria: setModalSubcategoria,
    'forma-pagamento': setModalFormaPagamento,
    'centro-custo': setModalCentroCusto,
    'gestao-usuarios': setModalGestaoUsuarios
  }

  // Sistema novo - Mapear tipos para estados
  const estadosMap = {
    categoria: modalCategoria,
    conta: modalConta,
    subcategoria: modalSubcategoria,
    'forma-pagamento': modalFormaPagamento,
    'centro-custo': modalCentroCusto,
    'gestao-usuarios': modalGestaoUsuarios
  }

  // Sistema novo - Função genérica para abrir modal
  const abrirModalNovo = (tipo: Exclude<TipoModal, null>, id?: string) => {
    const setter = settersMap[tipo as keyof typeof settersMap]
    if (setter) {
      setter({
        isOpen: true,
        entidadeId: id
      })
    }
  }

  // Sistema novo - Função genérica para fechar modal
  const fecharModalNovo = (tipo: Exclude<TipoModal, null>) => {
    const setter = settersMap[tipo as keyof typeof settersMap]
    if (setter) {
      setter(ESTADO_INICIAL_MODAL)
    }
  }

  // Sistema novo - Fechar todos os modais
  const fecharTodosModais = () => {
    // Fechar sistema antigo
    setModalAberto(null)
    setDadosModal(null)
    
    // Fechar sistema novo
    Object.values(settersMap).forEach(setter => {
      setter(ESTADO_INICIAL_MODAL)
    })
  }

  // Sistema novo - Ações específicas por modal
  const categoria = {
    abrir: (id?: string) => abrirModalNovo('categoria', id),
    fechar: () => fecharModalNovo('categoria')
  }

  const conta = {
    abrir: (id?: string) => abrirModalNovo('conta', id),
    fechar: () => fecharModalNovo('conta')
  }

  const subcategoria = {
    abrir: (id?: string) => abrirModalNovo('subcategoria', id),
    fechar: () => fecharModalNovo('subcategoria')
  }

  const formaPagamento = {
    abrir: (id?: string) => abrirModalNovo('forma-pagamento', id),
    fechar: () => fecharModalNovo('forma-pagamento')
  }

  const centroCusto = {
    abrir: (id?: string) => abrirModalNovo('centro-custo', id),
    fechar: () => fecharModalNovo('centro-custo')
  }

  const gestaoUsuarios = {
    abrir: (id?: string) => abrirModalNovo('gestao-usuarios', id),
    fechar: () => fecharModalNovo('gestao-usuarios')
  }

  const cliente = {
    abrir: (id?: string) => {
      setClienteId(id)
      setModalCliente(true)
    },
    fechar: () => {
      setModalCliente(false)
      setClienteId(undefined)
    },
    clienteId
  }

  const fornecedor = {
    abrir: (id?: string) => {
      setFornecedorId(id)
      setModalFornecedor(true)
    },
    fechar: () => {
      setModalFornecedor(false)
      setFornecedorId(undefined)
    },
    fornecedorId
  }

  // Sistema novo - Utilidades
  const modaisNovosAbertos = Object.values(estadosMap).filter(estado => estado.isOpen)
  const algumModalAberto = Boolean(modalAberto) || modaisNovosAbertos.length > 0
  const quantidadeModaisAbertos = (modalAberto ? 1 : 0) + modaisNovosAbertos.length

  return (
    <ModaisContexto.Provider value={{
      // Sistema antigo (compatibilidade)
      modalAberto,
      dadosModal,
      abrirModal,
      fecharModal,
      
      // Sistema novo - Estados
      modalCategoria,
      modalConta,
      modalSubcategoria,
      modalFormaPagamento,
      modalCentroCusto,
      modalGestaoUsuarios,
      modalCliente,
      modalFornecedor,

      // Sistema novo - Ações específicas
      categoria,
      conta,
      subcategoria,
      formaPagamento,
      centroCusto,
      gestaoUsuarios,
      cliente,
      fornecedor,
      
      // Sistema novo - Métodos unificados
      abrirModalNovo,
      fecharModalNovo,
      fecharTodosModais,
      
      // Sistema novo - Utilidades
      algumModalAberto,
      quantidadeModaisAbertos
    }}>
      {children}
    </ModaisContexto.Provider>
  )
}

export function useModais() {
  const context = useContext(ModaisContexto)
  if (context === undefined) {
    throw new Error('useModais deve ser usado dentro de ModaisProvider')
  }
  return context
}

// Hook para modal específico (mais conveniente)
export function useModal(tipo: Exclude<TipoModal, null>) {
  const contexto = useModais()
  
  // Mapear tipos para estados do contexto
  const estadoMap = {
    categoria: contexto.modalCategoria,
    conta: contexto.modalConta,
    subcategoria: contexto.modalSubcategoria,
    'forma-pagamento': contexto.modalFormaPagamento,
    'centro-custo': contexto.modalCentroCusto,
    'gestao-usuarios': contexto.modalGestaoUsuarios
  }
  
  // Mapear tipos para ações do contexto
  const acaoMap = {
    categoria: contexto.categoria,
    conta: contexto.conta,
    subcategoria: contexto.subcategoria,
    'forma-pagamento': contexto.formaPagamento,
    'centro-custo': contexto.centroCusto,
    'gestao-usuarios': contexto.gestaoUsuarios
  }
  
  const estado = estadoMap[tipo as keyof typeof estadoMap]
  const acoes = acaoMap[tipo as keyof typeof acaoMap]
  
  return {
    ...estado,
    ...acoes
  }
}