'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type TipoModal = 'transferencia' | 'lancamento' | 'parcelamento' | null

interface ModaisContextoType {
  modalAberto: TipoModal
  dadosModal: any
  abrirModal: (tipo: TipoModal, dados?: any) => void
  fecharModal: () => void
}

const ModaisContexto = createContext<ModaisContextoType | undefined>(undefined)

interface ModaisProviderProps {
  children: ReactNode
}

export function ModaisProvider({ children }: ModaisProviderProps) {
  const [modalAberto, setModalAberto] = useState<TipoModal>(null)
  const [dadosModal, setDadosModal] = useState<any>(null)

  const abrirModal = (tipo: TipoModal, dados?: any) => {
    setModalAberto(tipo)
    setDadosModal(dados || null)
  }

  const fecharModal = () => {
    setModalAberto(null)
    setDadosModal(null)
  }

  return (
    <ModaisContexto.Provider value={{
      modalAberto,
      dadosModal,
      abrirModal,
      fecharModal
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