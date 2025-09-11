import { cn } from '@/utilitarios/cn'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ size = 'md', className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-primary',
          sizeClasses[size]
        )}
      />
    </div>
  )
}

export function LoadingText({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loading size="sm" />
      {children}
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loading size="lg" className="mb-4" />
        <p className="text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    </div>
  )
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-muted rounded', className)} />
  )
}

export function LoadingTransacoes() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-8 w-32" />
      </div>
      
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-32" />
              <LoadingSkeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}