import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, AlertTriangle, Activity } from 'lucide-react';
import { SyncStatus } from '../../services/TimerSyncManager';

interface SyncStatusIndicatorProps {
  status: SyncStatus | null;
  compact?: boolean;
}

export function SyncStatusIndicator({ status, compact = false }: SyncStatusIndicatorProps) {
  const { t } = useTranslation();

  if (!status) {
    return null;
  }

  const getStatusIcon = () => {
    if (!status.connected) {
      return <WifiOff className="w-4 h-4" />;
    }

    switch (status.health) {
      case 'excellent':
        return <Wifi className="w-4 h-4" />;
      case 'good':
        return <Activity className="w-4 h-4" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />;
      case 'poor':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <Wifi className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    if (!status.connected) {
      return 'text-red-500 bg-red-50 dark:bg-red-950 dark:bg-opacity-20';
    }

    switch (status.health) {
      case 'excellent':
        return 'text-green-500 bg-green-50 dark:bg-green-950 dark:bg-opacity-20';
      case 'good':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950 dark:bg-opacity-20';
      case 'degraded':
        return 'text-orange-500 bg-orange-50 dark:bg-orange-950 dark:bg-opacity-20';
      case 'poor':
        return 'text-red-500 bg-red-50 dark:bg-red-950 dark:bg-opacity-20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-950 dark:bg-opacity-20';
    }
  };

  const getStatusText = () => {
    if (!status.connected) {
      return t('timer.reconnecting');
    }

    switch (status.health) {
      case 'excellent':
        return t('sync.synced');
      case 'good':
        return t('sync.goodConnection', { defaultValue: 'Boa Conexão' });
      case 'degraded':
        return t('sync.slowConnection', { defaultValue: 'Conexão Lenta' });
      case 'poor':
        return t('sync.poorConnection', { defaultValue: 'Conexão Fraca' });
      default:
        return t('timer.connected');
    }
  };

  const timeSinceSync = Date.now() - status.lastSync;
  const shouldShowWarning = timeSinceSync > 5000;

  if (compact) {
    return (
      <div
        className={`hidden items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
        title={`${getStatusText()} - Drift: ${Math.abs(status.drift)}ms`}
      >
        {getStatusIcon()}
      </div>
    );
  }

  if (status.health === 'excellent' && !shouldShowWarning) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor()}`}
    >
      {getStatusIcon()}
      <div className="flex flex-col">
        <span>{getStatusText()}</span>
        {status.drift > 100 && (
          <span className="text-xs opacity-70">
            Drift: {Math.abs(status.drift)}ms
          </span>
        )}
      </div>
    </div>
  );
}
