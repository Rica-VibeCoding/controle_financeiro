'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/contextos/auth-contexto'
import { useEffect, useState } from 'react'
import { obterCategorias } from '@/servicos/supabase/categorias'

export default function DebugWorkspacePage() {
  const { user, workspace, loading } = useAuth()
  const [categorias, setCategorias] = useState<any[]>([])
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const carregarCategorias = async () => {
      if (workspace) {
        try {
          const cats = await obterCategorias(true, workspace.id) // incluir inativas
          setCategorias(cats)
        } catch (error) {
          setErro(error instanceof Error ? error.message : 'Erro desconhecido')
        }
      }
    }
    
    carregarCategorias()
  }, [workspace])

  if (loading) return <div>Carregando...</div>

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">🔧 Debug - Workspace e Usuário</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">👤 Usuário Logado</h2>
          {user ? (
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify({
                id: user.id,
                email: user.email,
                created_at: user.created_at
              }, null, 2)}
            </pre>
          ) : (
            <p className="text-red-500">❌ Usuário não logado</p>
          )}
        </div>

        <div className="bg-blue-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">🏢 Workspace</h2>
          {workspace ? (
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(workspace, null, 2)}
            </pre>
          ) : (
            <p className="text-red-500">❌ Workspace não encontrado</p>
          )}
        </div>

        <div className="bg-green-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">📁 Categorias ({categorias.length})</h2>
          {erro ? (
            <p className="text-red-500">❌ Erro: {erro}</p>
          ) : categorias.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categorias.map((cat, index) => (
                <div key={cat.id || index} className="text-sm">
                  <strong>{cat.nome}</strong> - {cat.tipo} ({cat.ativo ? 'Ativa' : 'Inativa'})
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma categoria encontrada</p>
          )}
        </div>

        <div className="bg-yellow-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">🔗 Links de Teste</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Dashboard:</strong> <a href="/dashboard" className="text-blue-600 underline">/dashboard</a></div>
            <div><strong>Categorias:</strong> <a href="/categorias" className="text-blue-600 underline">/categorias</a></div>
            <div><strong>Nova Categoria:</strong> <a href="/categorias/nova" className="text-blue-600 underline">/categorias/nova</a></div>
            <div><strong>Usuários:</strong> <a href="/configuracoes/usuarios" className="text-blue-600 underline">/configuracoes/usuarios</a></div>
          </div>
        </div>
      </div>

      <div className="bg-red-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">⚠️ Possíveis Problemas</h2>
        <div className="text-sm space-y-1">
          {!user && <div>❌ Usuário não está logado</div>}
          {!workspace && <div>❌ Workspace não foi encontrado</div>}
          {user && workspace && categorias.length === 0 && (
            <div>⚠️ Usuário logado mas sem categorias no workspace</div>
          )}
        </div>
      </div>
    </div>
  )
}