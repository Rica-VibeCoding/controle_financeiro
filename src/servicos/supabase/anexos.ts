import { supabase } from './cliente'

// Configurações do Storage - conforme Estrutura do Projeto
export const STORAGE_BUCKET = 'anexos-transacoes'
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'application/pdf'
]

interface UploadResult {
  url: string
  fileName: string
  size: number
  type: string
}

export class AnexosService {
  
  /**
   * Upload de arquivo para o Storage do Supabase
   * Conforme configurações da documentação
   */
  static async uploadAnexo(file: File, transacaoId?: string): Promise<UploadResult> {
    // Validar tipo de arquivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido. Aceitos: ${ALLOWED_FILE_TYPES.join(', ')}`)
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`)
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomStr}${transacaoId ? `_${transacaoId}` : ''}.${extension}`

    // Upload para o Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Erro no upload: ${error.message}`)
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    return {
      url: publicUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    }
  }

  /**
   * Excluir anexo do Storage
   */
  static async excluirAnexo(fileName: string): Promise<void> {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileName])

    if (error) {
      throw new Error(`Erro ao excluir anexo: ${error.message}`)
    }
  }

  /**
   * Obter URL pública de um anexo
   */
  static getUrlPublica(fileName: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    return publicUrl
  }

  /**
   * Validar se arquivo é válido para upload
   */
  static validarArquivo(file: File): { valido: boolean; erro?: string } {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valido: false,
        erro: `Tipo não permitido. Aceitos: JPG, PNG, WebP, PDF`
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
      return {
        valido: false,
        erro: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`
      }
    }

    return { valido: true }
  }

  /**
   * Extrair nome do arquivo de uma URL
   */
  static extrairNomeArquivo(url: string): string | null {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      return pathParts[pathParts.length - 1]
    } catch {
      return null
    }
  }

  /**
   * Formatar tamanho do arquivo para exibição
   */
  static formatarTamanho(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Obter ícone baseado no tipo de arquivo
   */
  static obterIconeArquivo(type: string): string {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    return '📎'
  }
}