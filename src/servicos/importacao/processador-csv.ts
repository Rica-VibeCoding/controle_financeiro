import Papa from 'papaparse'

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