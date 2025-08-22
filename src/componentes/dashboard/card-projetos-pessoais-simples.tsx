'use client'

import React from 'react'
import { Plus } from 'lucide-react'

interface CardProjetosPessoaisProps {
  limite?: number
}

export function CardProjetosPessoais({ limite = 5 }: CardProjetosPessoaisProps) {
  // Versão simples sem hooks para teste
  const projetos = [
    {
      id: '1',
      nome: 'Casa do Mato',
      status: 'Meta: 78%',
      resultado: '+R$ 4.900',
      cor: 'verde'
    },
    {
      id: '2', 
      nome: 'Conecta',
      status: 'Meta: 0%',
      resultado: 'R$ 0',
      cor: 'cinza'
    },
    {
      id: '3',
      nome: 'WoodPro+', 
      status: 'ROI: 0%',
      resultado: 'R$ 0',
      cor: 'cinza'
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Projetos Pessoais</h3>
        <span className="text-xs text-gray-500">3 ativos</span>
      </div>

      {/* Lista de projetos */}
      <div className="space-y-3">
        {projetos.slice(0, limite).map((projeto) => (
          <div 
            key={projeto.id} 
            className="cursor-pointer group hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
          >
            {/* Linha principal: Nome + Status */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className={`w-4 h-4 rounded flex items-center justify-center ${
                  projeto.cor === 'verde' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                </div>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {projeto.nome}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                projeto.cor === 'verde' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
              }`}>
                {projeto.status}
              </span>
            </div>

            {/* Linha secundária: Resultado financeiro */}
            <div className="ml-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Resultado:
                </span>
                <span className={`font-medium ${
                  projeto.resultado.includes('+') ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {projeto.resultado}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer com ação */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <button className="w-full inline-flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg py-2 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Projeto</span>
        </button>
      </div>
    </div>
  )
}