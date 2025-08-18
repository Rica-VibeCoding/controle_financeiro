'use client'

import { 
  Banknote, Hammer, Briefcase, Home, Phone, Utensils, Car, Stethoscope,
  User, GraduationCap, Gamepad2, Landmark, Building, Users, Package,
  TrendingUp, CreditCard, ChartLine, Receipt, Send, Download, Coins,
  Settings, Fuel, Heart, Music, ShoppingCart
} from 'lucide-react'
import { Label } from '@/componentes/ui/label'

// Mapeamento de ícones com seus nomes
export const ICONES_CATEGORIAS = [
  { nome: 'banknote', componente: Banknote, categoria: 'Renda Principal' },
  { nome: 'hammer', componente: Hammer, categoria: 'Wood Pro Mais' },
  { nome: 'briefcase', componente: Briefcase, categoria: 'Renda Extra' },
  { nome: 'home', componente: Home, categoria: 'Moradia' },
  { nome: 'phone', componente: Phone, categoria: 'Comunicação' },
  { nome: 'utensils', componente: Utensils, categoria: 'Alimentação' },
  { nome: 'car', componente: Car, categoria: 'Transporte' },
  { nome: 'stethoscope', componente: Stethoscope, categoria: 'Saúde' },
  { nome: 'user', componente: User, categoria: 'Pessoais' },
  { nome: 'graduation-cap', componente: GraduationCap, categoria: 'Educação' },
  { nome: 'gamepad-2', componente: Gamepad2, categoria: 'Lazer' },
  { nome: 'landmark', componente: Landmark, categoria: 'Serviços Financeiros' },
  { nome: 'building', componente: Building, categoria: 'Empresa' },
  { nome: 'users', componente: Users, categoria: 'Dependentes' },
  { nome: 'package', componente: Package, categoria: 'Diversos' },
  { nome: 'trending-up', componente: TrendingUp, categoria: 'Financiamento' },
  { nome: 'credit-card', componente: CreditCard, categoria: 'Empréstimo' },
  { nome: 'chart-line', componente: ChartLine, categoria: 'Investimentos' },
  { nome: 'receipt', componente: Receipt, categoria: 'Pagamento de Fatura' },
  { nome: 'send', componente: Send, categoria: 'Envio Transf' },
  { nome: 'download', componente: Download, categoria: 'Receb Transf' },
  { nome: 'coins', componente: Coins, categoria: 'Outras Fontes Renda' },
  { nome: 'settings', componente: Settings, categoria: 'Outras' },
  { nome: 'fuel', componente: Fuel, categoria: 'Combustível' },
  { nome: 'heart', componente: Heart, categoria: 'Esposa' },
  { nome: 'music', componente: Music, categoria: 'Música' },
  { nome: 'shopping-cart', componente: ShoppingCart, categoria: 'Supermercado' }
]

interface IconePickerProps {
  iconeSelecionado: string
  onIconeChange: (icone: string) => void
  disabled?: boolean
}

export function IconePicker({ iconeSelecionado, onIconeChange, disabled = false }: IconePickerProps) {
  return (
    <div className="space-y-2">
      <Label>Ícone *</Label>
      <div className="grid grid-cols-6 gap-2">
        {ICONES_CATEGORIAS.map((item) => {
          const IconeComponente = item.componente
          return (
            <button
              key={item.nome}
              type="button"
              onClick={() => onIconeChange(item.nome)}
              disabled={disabled}
              title={item.categoria}
              className={`
                p-3 rounded-lg border-2 transition-colors
                hover:bg-accent hover:text-accent-foreground
                disabled:opacity-50 disabled:cursor-not-allowed
                ${iconeSelecionado === item.nome 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border text-muted-foreground'
                }
              `}
            >
              <IconeComponente size={20} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Função helper para obter componente do ícone pelo nome
export function obterIconePorNome(nomeIcone: string) {
  const icone = ICONES_CATEGORIAS.find(item => item.nome === nomeIcone)
  return icone ? icone.componente : Banknote // fallback
}