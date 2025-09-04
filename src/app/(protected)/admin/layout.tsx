'use client'

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout para área administrativa
 * Adiciona contexto específico para super admin
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-area">
      {children}
    </div>
  );
}