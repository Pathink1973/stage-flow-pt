import React from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, Plus, Minus, Loader2, WifiOff, Wifi } from 'lucide-react';
import { Button } from '../ui/Button';
import { Database } from '../../lib/database.types';

type Timer = Database['public']['Tables']['timers']['Row'];

interface TimerControlsProps {
  timer: Timer | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAdjust: (seconds: number) => void;
  disabled?: boolean;
  connected?: boolean;
}

export function TimerControls({
  timer,
  onStart,
  onPause,
  onReset,
  onAdjust,
  disabled = false,
  connected = true,
}: TimerControlsProps) {
  const { t } = useTranslation();
  const isRunning = timer?.state === 'running';

  return (
    <div className="space-y-4">
      {!connected && (
        <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-orange-500 bg-orange-50 dark:bg-orange-950 dark:bg-opacity-20 px-4 py-3 rounded-lg font-medium">
          <WifiOff className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{t('timer.reconnecting')}</span>
        </div>
      )}
      {connected && disabled && (
        <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-blue-500 bg-blue-50 dark:bg-blue-950 dark:bg-opacity-20 px-4 py-3 rounded-lg font-medium">
          <Wifi className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          <span>{t('timer.syncing')}</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <Button
          onClick={onStart}
          variant="primary"
          size="lg"
          disabled={disabled || !timer || isRunning}
          className="!w-24 !h-24 sm:!w-28 sm:!h-28 md:!w-32 md:!h-32 !rounded-full !p-0 shadow-lg"
        >
          {disabled && !isRunning ? (
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 animate-spin-720" />
          ) : (
            <Play className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />
          )}
        </Button>

        <Button
          onClick={onPause}
          variant="soft"
          size="lg"
          disabled={disabled || !timer || !isRunning}
          className="!w-24 !h-24 sm:!w-28 sm:!h-28 md:!w-32 md:!h-32 !rounded-full !p-0 shadow-lg"
        >
          {disabled && isRunning ? (
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 animate-spin-720" />
          ) : (
            <Pause className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />
          )}
        </Button>

        <Button
          onClick={onReset}
          variant="soft"
          size="lg"
          disabled={disabled || !timer}
          className="!w-20 !h-20 sm:!w-24 sm:!h-24 md:!w-28 md:!h-28 !rounded-full !p-0 shadow-lg"
        >
          <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
        </Button>
      </div>

      <div className="flex gap-2 sm:gap-3 w-full justify-center pt-2">
        <Button
          onClick={() => onAdjust(-30)}
          variant="soft"
          size="lg"
          disabled={disabled || !timer}
          className="flex-1 sm:flex-none sm:min-w-[120px] !h-12 sm:!h-14"
        >
          <Minus className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-bold text-base sm:text-lg">30s</span>
        </Button>
        <Button
          onClick={() => onAdjust(30)}
          variant="soft"
          size="lg"
          disabled={disabled || !timer}
          className="flex-1 sm:flex-none sm:min-w-[120px] !h-12 sm:!h-14"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-bold text-base sm:text-lg">30s</span>
        </Button>
      </div>
    </div>
  );
}
