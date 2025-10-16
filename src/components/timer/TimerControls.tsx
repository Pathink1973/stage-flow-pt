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
    <div className="space-y-3">
      {!connected && (
        <div className="flex items-center justify-center gap-2 text-sm text-orange-500 bg-orange-50 dark:bg-orange-950 dark:bg-opacity-20 px-3 py-2 rounded-lg">
          <WifiOff className="w-4 h-4" />
          <span>{t('timer.reconnecting')}</span>
        </div>
      )}
      {connected && disabled && (
        <div className="flex items-center justify-center gap-2 text-sm text-blue-500 bg-blue-50 dark:bg-blue-950 dark:bg-opacity-20 px-3 py-2 rounded-lg">
          <Wifi className="w-4 h-4 animate-pulse" />
          <span>{t('timer.syncing')}</span>
        </div>
      )}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
      <Button
        onClick={onStart}
        variant="primary"
        size="lg"
        disabled={disabled || !timer || isRunning}
        className="!w-20 !h-20 sm:!w-24 sm:!h-24 md:!w-28 md:!h-28 !rounded-full !p-0 relative"
      >
        {disabled && !isRunning ? (
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 animate-spin" />
        ) : (
          <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
        )}
      </Button>

      <Button
        onClick={onPause}
        variant="soft"
        size="lg"
        disabled={disabled || !timer || !isRunning}
        className="!w-20 !h-20 sm:!w-24 sm:!h-24 md:!w-28 md:!h-28 !rounded-full !p-0 relative"
      >
        {disabled && isRunning ? (
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 animate-spin" />
        ) : (
          <Pause className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
        )}
      </Button>

      <Button
        onClick={onReset}
        variant="soft"
        size="lg"
        disabled={disabled || !timer}
        className="!w-16 !h-16 sm:!w-18 sm:!h-18 md:!w-20 md:!h-20 !rounded-full !p-0"
      >
        <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
      </Button>

      <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-center">
        <Button
          onClick={() => onAdjust(-30)}
          variant="soft"
          size="md"
          disabled={disabled || !timer}
          className="flex-1 sm:flex-none"
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-semibold text-sm sm:text-base">30s</span>
        </Button>
        <Button
          onClick={() => onAdjust(30)}
          variant="soft"
          size="md"
          disabled={disabled || !timer}
          className="flex-1 sm:flex-none"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-semibold text-sm sm:text-base">30s</span>
        </Button>
      </div>
    </div>
    </div>
  );
}
