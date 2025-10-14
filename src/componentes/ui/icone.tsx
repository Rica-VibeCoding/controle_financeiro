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
  PiggyBank,
  AlertTriangle,
  Loader2,
  Users,
  UserPlus,
  UserX,
  Link2,
  Copy,
  Target,
  Check,
  LogOut,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Database,
  Wifi,
  WifiOff,
  Shield,
  ShieldX,
  MoreHorizontal,
  Home,
  UserMinus,
  ExternalLink,
} from 'lucide-react'

export type IconName =
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
  | 'piggy-bank'
  | 'alert-triangle'
  | 'loader-2'
  | 'users'
  | 'user-plus'
  | 'user-x'
  | 'link-2'
  | 'copy'
  | 'target'
  | 'check'
  | 'log-out'
  | 'trending-up'
  | 'trending-down'
  | 'dollar-sign'
  | 'activity'
  | 'database'
  | 'wifi'
  | 'wifi-off'
  | 'shield'
  | 'shield-x'
  | 'more-horizontal'
  | 'home'
  | 'user-minus'
  | 'external-link'

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
  'piggy-bank': PiggyBank,
  'alert-triangle': AlertTriangle,
  'loader-2': Loader2,
  'users': Users,
  'user-plus': UserPlus,
  'user-x': UserX,
  'link-2': Link2,
  'copy': Copy,
  'target': Target,
  'check': Check,
  'log-out': LogOut,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'dollar-sign': DollarSign,
  'activity': Activity,
  'database': Database,
  'wifi': Wifi,
  'wifi-off': WifiOff,
  'shield': Shield,
  'shield-x': ShieldX,
  'more-horizontal': MoreHorizontal,
  'home': Home,
  'user-minus': UserMinus,
  'external-link': ExternalLink,
}

export interface IconeProps extends Omit<LucideProps, 'ref'> {
  name: IconName
}

export function Icone({ name, className, ...rest }: IconeProps) {
  const Cmp = iconMap[name]
  if (!Cmp) return null
  return <Cmp className={className} strokeWidth={2} {...rest} />
}


