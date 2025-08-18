import Papa from 'papaparse'
import { LinhaCSV } from '@/tipos/importacao'

export async function processarCSV(arquivo: File): Promise<LinhaCSV[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(arquivo, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors)
        } else {
          resolve(results.data as LinhaCSV[])
        }
      }
    })
  })
}