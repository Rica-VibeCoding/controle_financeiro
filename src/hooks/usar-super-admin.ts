/**
 * Hook para funcionalidades de Super Admin
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contextos/auth-contexto'
import { 
  verificarSuperAdmin, 
  buscarInfoSuperAdmin, 
  listarTodosWorkspaces, 
  buscarEstatisticasSistema,
  type SuperAdminInfo 
} from '@/servicos/supabase/super-admin'

export function usarSuperAdmin() {
  const { usuario } = useAuth()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [superAdminInfo, setSuperAdminInfo] = useState<SuperAdminInfo | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Verificar se é super admin ao carregar
  useEffect(() => {
    async function verificar() {
      if (!usuario) {
        setIsSuperAdmin(false)
        setSuperAdminInfo(null)
        setCarregando(false)
        return
      }

      try {
        const [isAdmin, adminInfo] = await Promise.all([
          verificarSuperAdmin(),
          buscarInfoSuperAdmin()
        ])

        setIsSuperAdmin(isAdmin)
        setSuperAdminInfo(adminInfo)
      } catch (error) {
        console.error('Erro ao verificar super admin:', error)
        setIsSuperAdmin(false)
        setSuperAdminInfo(null)
      } finally {
        setCarregando(false)
      }
    }

    verificar()
  }, [usuario])

  return {
    isSuperAdmin,
    superAdminInfo,
    carregando
  }
}

export function usarWorkspacesSistema() {
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = async () => {
    setCarregando(true)
    setErro(null)
    
    try {
      const dados = await listarTodosWorkspaces()
      setWorkspaces(dados || [])
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error)
      setErro('Erro ao carregar workspaces do sistema')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  return {
    workspaces,
    carregando,
    erro,
    recarregar: carregar
  }
}

export function usarEstatisticasSistema() {
  const [estatisticas, setEstatisticas] = useState<any>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = async () => {
    setCarregando(true)
    setErro(null)
    
    try {
      const dados = await buscarEstatisticasSistema()
      setEstatisticas(dados)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setErro('Erro ao carregar estatísticas do sistema')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  return {
    estatisticas,
    carregando,
    erro,
    recarregar: carregar
  }
}