import { cn } from '@/utilitarios/cn'

interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Componente Skeleton para loading states
 * Simula o layout enquanto carrega dados
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
      {...props}
    />
  )
}

/**
 * Skeleton para inputs/selects
 */
export function SkeletonInput({ className }: { className?: string }) {
  return <Skeleton className={cn("h-9 w-full", className)} />
}

/**
 * Skeleton para labels
 */
export function SkeletonLabel({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-20", className)} />
}

/**
 * Skeleton para botões
 */
export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-9 w-24", className)} />
}