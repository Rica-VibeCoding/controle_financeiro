'use client'

import { Icone } from '@/componentes/ui/icone';

interface StatusSistema {
  online: boolean;
  ultimoBackup: string;
  uptime: string;
}

interface IndicadoresSaudeProps {
  status: StatusSistema;
}

/**
 * Formatar tempo desde último backup
 */
function formatarTempoBackup(data: string): string {
  try {
    const agora = new Date();
    const backup = new Date(data);
    const diffMs = agora.getTime() - backup.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHoras < 1) {
      const diffMinutos = Math.floor(diffMs / (1000 * 60));
      return `há ${diffMinutos}min`;
    }
    
    if (diffHoras < 24) {
      return `há ${diffHoras}h`;
    }
    
    const diffDias = Math.floor(diffHoras / 24);
    return `há ${diffDias} dia${diffDias > 1 ? 's' : ''}`;
  } catch {
    return 'Data inválida';
  }
}

/**
 * Componente de indicadores de saúde do sistema
 */
export function IndicadoresSaude({ status }: IndicadoresSaudeProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">⚡ Saúde do Sistema</h3>
        <p className="text-sm text-gray-600 mt-1">Status operacional e métricas</p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Online */}
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
            status.online ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Icone 
              name={status.online ? 'wifi' : 'wifi-off'} 
              className={`w-6 h-6 ${status.online ? 'text-green-600' : 'text-red-600'}`} 
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">Sistema</h4>
              <div className={`w-2 h-2 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <p className={`text-sm ${status.online ? 'text-green-600' : 'text-red-600'}`}>
              {status.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Uptime */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
            <Icone name="activity" className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Uptime</h4>
            <p className="text-sm text-blue-600 font-semibold">{status.uptime}</p>
          </div>
        </div>

        {/* Último Backup */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100">
            <Icone name="database" className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Backup</h4>
            <p className="text-sm text-purple-600">
              {formatarTempoBackup(status.ultimoBackup)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <p>Atualizado automaticamente</p>
          <p>Monitoramento em tempo real</p>
        </div>
      </div>
    </div>
  );
}