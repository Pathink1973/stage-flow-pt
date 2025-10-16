import React, { useMemo } from 'react';
import { Database } from '../../lib/database.types';
import { useTimerColorSettings } from '../../hooks/useTimerColorSettings';

type Timer = Database['public']['Tables']['timers']['Row'];

interface TimerDisplayProps {
  timer: Timer | null;
  currentTime: number;
  elapsed: number;
  isOverrun: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showProgress?: boolean;
  progressStyle?: 'bar' | 'ring';
  roomId?: string | null;
}

export function TimerDisplay({ timer, currentTime, elapsed, isOverrun, size = 'xl', showProgress = true, progressStyle = 'bar', roomId = null }: TimerDisplayProps) {
  const { settings } = useTimerColorSettings(roomId);

  const colorState = useMemo((): 'normal' | 'warning' | 'critical' => {
    if (!timer || timer.type !== 'countdown' || !settings) return 'normal';

    const remaining = currentTime;

    if (remaining <= settings.critical_threshold_sec && remaining > 0) {
      return 'critical';
    }

    if (remaining <= settings.warning_threshold_sec && remaining > 0) {
      return 'warning';
    }

    return 'normal';
  }, [timer, currentTime, settings]);


  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = useMemo(() => {
    return timer && timer.base_sec > 0
      ? Math.min(100, (elapsed / timer.base_sec) * 100)
      : 0;
  }, [timer, elapsed]);

  const sizeClasses = {
    sm: 'text-4xl',
    md: 'text-6xl',
    lg: 'text-8xl',
    xl: 'text-9xl',
  };

  if (!timer) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className={`${sizeClasses[size]} font-bold text-[var(--fg)] opacity-30`}>
          00:00
        </span>
      </div>
    );
  }

  const getTimerColor = () => {
    if (isOverrun) return 'text-red-600 animate-pulse';
    if (colorState === 'critical') return 'text-red-500';
    if (colorState === 'warning') return 'text-orange-500';
    return 'text-[var(--fg)]';
  };

  const getProgressColor = () => {
    if (isOverrun) return 'bg-red-600';
    if (colorState === 'critical') return 'bg-red-500';
    if (colorState === 'warning') return 'bg-orange-500';
    return 'bg-[var(--accent)]';
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 h-full">
      <div className={`
        ${sizeClasses[size]}
        font-bold
        tabular-nums
        transition-colors
        duration-300
        ${getTimerColor()}
      `}>
        {isOverrun && '-'}
        {formatTime(currentTime)}
      </div>

      {showProgress && progressStyle === 'bar' && (
        <div className="w-full max-w-2xl">
          <div className="h-4 rounded-full neumo-inset overflow-hidden bg-[var(--bg)]">
            <div
              className={`h-full transition-all duration-150 ease-linear ${getProgressColor()}`}
              style={{ width: `${isOverrun ? 100 : progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
