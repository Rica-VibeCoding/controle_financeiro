import { supabase } from '@/servicos/supabase/cliente'
import { TransacaoImportada } from '@/tipos/importacao'

export async function verificarDuplicatas(
  transacoes: TransacaoImportada[]
): Promise<{
  novas: TransacaoImportada[]
  duplicadas: TransacaoImportada[]
}> {
  const uuids = transacoes.map(t => t.identificador_externo).filter(uuid => uuid)
  
  if (uuids.length === 0) {
    // Se não há UUIDs, todas são novas
    return { novas: transacoes, duplicadas: [] }
  }
  
  const { data: existentes, error } = await supabase
    .from('fp_transacoes')
    .select('identificador_externo')
    .in('identificador_externo', uuids)
  
  if (error) {
    throw new Error(`Erro ao verificar duplicatas: ${error.message}`)
  }
  
  const uuidsExistentes = new Set(
    existentes?.map(t => t.identificador_externo) || []
  )
  
  const novas = transacoes.filter(t => !t.identificador_externo || !uuidsExistentes.has(t.identificador_externo))
  const duplicadas = transacoes.filter(t => t.identificador_externo && uuidsExistentes.has(t.identificador_externo))
  
  return { novas, duplicadas }
}