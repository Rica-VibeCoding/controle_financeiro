// Tipos auxiliares para Centro de Custo
import { Database } from './database'

export type CentroCusto = Database['public']['Tables']['fp_centros_custo']['Row']
export type NovoCentroCusto = Database['public']['Tables']['fp_centros_custo']['Insert']
export type AtualizarCentroCusto = Database['public']['Tables']['fp_centros_custo']['Update']