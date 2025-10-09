import Papa from 'papaparse'
import { TemplateBanco } from '@/tipos/importacao'

/**
 * FASE 2 - Processador CSV Genérico
 *
 * Simplificado para retornar dados genéricos que serão processados
 * pelo mapeador genérico único.
 */
export async function processarCSV(arquivo: File): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(arquivo, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors)
        } else {
          resolve(results.data as unknown[])
        }
      }
    })
  })
}

/**
 * Processador CSV com Template Específico
 *
 * Usa configurações do template (separador, encoding, decimal)
 * para processar o CSV corretamente.
 *
 * Fallback: Se falhar, tenta auto-detect.
 */
export async function processarCSVComTemplate(
  arquivo: File,
  template: TemplateBanco
): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    // Configurações do Papa Parse
    const config = {
      header: true,
      skipEmptyLines: true,
      encoding: template.validacao.encoding,
      delimiter: template.validacao.separador,
      // Se template tem linhasIgnorar, pular essas linhas antes do header
      ...(template.validacao.linhasIgnorar && {
        preview: 0, // Não limitar preview
        beforeFirstChunk: (chunk: string) => {
          // Remover BOM (Byte Order Mark) se existir
          const cleanChunk = chunk.replace(/^\uFEFF/, '')
          // Remover primeiras N linhas antes de processar
          const linhas = cleanChunk.split('\n')
          return linhas.slice(template.validacao.linhasIgnorar).join('\n')
        }
      })
    }

    // Primeira tentativa: usar configurações do template
    Papa.parse(arquivo, {
      ...config,
      complete: (results) => {
        if (results.errors.length > 0) {
          // Fallback: tentar auto-detect se template falhar
          Papa.parse(arquivo, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: (fallbackResults) => {
              if (fallbackResults.errors.length > 0) {
                reject(new Error(`Erro ao processar CSV: ${fallbackResults.errors[0]?.message || 'Formato inválido'}`))
              } else {
                resolve(fallbackResults.data as unknown[])
              }
            }
          })
        } else {
          resolve(results.data as unknown[])
        }
      }
    })
  })
}