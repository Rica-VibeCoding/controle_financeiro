'use client'

import React from 'react'
import type { LucideProps } from 'lucide-react'
import {
  LayoutDashboard,
  CreditCard,
  LineChart,
  Wallet,
  Settings,
  Building2,
  Tag,
  Tags,
  Folder,
  Image,
  Info,
  Paperclip,
  FileText,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  RefreshCcw,
  ArrowLeftRight,
  FileUp,
  Filter,
  List,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileSearch,
  PlusCircle,
  Banknote,
  User,
} from 'lucide-react'

type IconName =
  | 'layout-dashboard'
  | 'credit-card'
  | 'line-chart'
  | 'wallet'
  | 'settings'
  | 'building'
  | 'tag'
  | 'tags'
  | 'folder'
  | 'image'
  | 'info'
  | 'paperclip'
  | 'file-text'
  | 'eye'
  | 'pencil'
  | 'trash-2'
  | 'check-circle-2'
  | 'clock'
  | 'refresh-ccw'
  | 'arrow-left-right'
  | 'file-up'
  | 'filter'
  | 'list'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'file-search'
  | 'plus-circle'
  | 'banknote'
  | 'user'

const iconMap: Record<IconName, React.ComponentType<LucideProps>> = {
  'layout-dashboard': LayoutDashboard,
  'credit-card': CreditCard,
  'line-chart': LineChart,
  'wallet': Wallet,
  'settings': Settings,
  'building': Building2,
  'tag': Tag,
  'tags': Tags,
  'folder': Folder,
  'image': Image,
  'info': Info,
  'paperclip': Paperclip,
  'file-text': FileText,
  'eye': Eye,
  'pencil': Pencil,
  'trash-2': Trash2,
  'check-circle-2': CheckCircle2,
  'clock': Clock,
  'refresh-ccw': RefreshCcw,
  'arrow-left-right': ArrowLeftRight,
  'file-up': FileUp,
  'filter': Filter,
  'list': List,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'file-search': FileSearch,
  'plus-circle': PlusCircle,
  'banknote': Banknote,
  'user': User,
}

export interface IconeProps extends Omit<LucideProps, 'ref'> {
  name: IconName
}

export function Icone({ name, className, ...rest }: IconeProps) {
  const Cmp = iconMap[name]
  if (!Cmp) return null
  return <Cmp className={className} strokeWidth={2} {...rest} />
}


