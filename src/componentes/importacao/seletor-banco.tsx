'use client'

import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { TemplateBanco } from '@/tipos/importacao'
import { listarTemplatesBancos, obterTemplateGenerico } from '@/servicos/importacao/templates-banco'

interface SeletorBancoProps {
  isOpen: boolean
  onClose: () => void
  onBancoSelecionado: (template: TemplateBanco) => void
}

export function SeletorBanco({
  isOpen,
  onClose,
  onBancoSelecionado
}: SeletorBancoProps) {
  const templatesBancos = listarTemplatesBancos()
  const templateGenerico = obterTemplateGenerico()

  const handleSelecionarBanco = (template: TemplateBanco) => {
    onBancoSelecionado(template)
  }

  const handleSelecionarGenerico = () => {
    onBancoSelecionado(templateGenerico)
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="📂 Selecione seu banco"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Descrição */}
        <p className="text-sm text-gray-600">
          Escolha o banco do seu extrato para garantir que o CSV seja importado corretamente.
        </p>

        {/* Grid de bancos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {templatesBancos.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelecionarBanco(template)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="mb-2 flex justify-center">
                {template.iconeComponent ? (
                  <template.iconeComponent className="w-12 h-12" />
                ) : (
                  <span className="text-4xl">{template.icone}</span>
                )}
              </div>
              <div className="text-sm font-medium text-gray-900">{template.nome}</div>
            </button>
          ))}
        </div>

        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Ou</span>
          </div>
        </div>

        {/* Opção genérica */}
        <button
          onClick={handleSelecionarGenerico}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">{templateGenerico.icone}</span>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">
                {templateGenerico.nome}
              </div>
              <div className="text-xs text-gray-500">
                Para bancos não listados acima
              </div>
            </div>
          </div>
        </button>

        {/* Botões */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </ModalBase>
  )
}
