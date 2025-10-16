import React, { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useTimerColorSettings } from '../../hooks/useTimerColorSettings';

interface TimerColorSettingsProps {
  roomId: string | null;
}

export function TimerColorSettings({ roomId }: TimerColorSettingsProps) {
  const { settings, saveSettings } = useTimerColorSettings(roomId);
  const [warningMinutes, setWarningMinutes] = useState(1);
  const [warningSeconds, setWarningSeconds] = useState(0);
  const [criticalSeconds, setCriticalSeconds] = useState(15);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setWarningMinutes(Math.floor(settings.warning_threshold_sec / 60));
      setWarningSeconds(settings.warning_threshold_sec % 60);
      setCriticalSeconds(settings.critical_threshold_sec);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    const totalWarningSeconds = warningMinutes * 60 + warningSeconds;
    await saveSettings(totalWarningSeconds, criticalSeconds);
    setIsSaving(false);
  };

  const handleReset = () => {
    setWarningMinutes(1);
    setWarningSeconds(0);
    setCriticalSeconds(15);
  };

  const formatPreviewTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) {
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return `${s}s`;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-[var(--fg)] mb-3 block">
          Orange Warning Threshold
        </label>
        <p className="text-xs text-[var(--fg)] opacity-60 mb-3">
          Timer and progress bar will turn orange when this much time remains
        </p>
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="text-xs text-[var(--fg)] opacity-70 mb-1 block">Minutes</label>
            <Input
              type="number"
              min="0"
              max="59"
              value={warningMinutes}
              onChange={(val) => setWarningMinutes(Math.max(0, Math.min(59, parseInt(val) || 0)))}
              placeholder="0"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-[var(--fg)] opacity-70 mb-1 block">Seconds</label>
            <Input
              type="number"
              min="0"
              max="59"
              value={warningSeconds}
              onChange={(val) => setWarningSeconds(Math.max(0, Math.min(59, parseInt(val) || 0)))}
              placeholder="0"
            />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500"></div>
          <span className="text-sm text-[var(--fg)] opacity-70">
            Triggers at {formatPreviewTime(warningMinutes * 60 + warningSeconds)}
          </span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--fg)] mb-3 block">
          Red Critical Threshold
        </label>
        <p className="text-xs text-[var(--fg)] opacity-60 mb-3">
          Timer and progress bar will turn red when this much time remains
        </p>
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="text-xs text-[var(--fg)] opacity-70 mb-1 block">Seconds</label>
            <Input
              type="number"
              min="0"
              max="59"
              value={criticalSeconds}
              onChange={(val) => setCriticalSeconds(Math.max(0, Math.min(59, parseInt(val) || 0)))}
              placeholder="15"
            />
          </div>
          <div className="flex-1"></div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-[var(--fg)] opacity-70">
            Triggers at {formatPreviewTime(criticalSeconds)}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--fg)] border-opacity-10 flex gap-3">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button
          variant="ghost"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="p-4 rounded-lg neumo-inset bg-[var(--bg)] space-y-2">
        <h4 className="text-sm font-semibold text-[var(--fg)] mb-2">Color Preview</h4>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <span className="text-xs text-[var(--fg)] opacity-70 w-20">Normal</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600"></div>
          <span className="text-xs text-[var(--fg)] opacity-70 w-20">Warning</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-red-500 to-red-600"></div>
          <span className="text-xs text-[var(--fg)] opacity-70 w-20">Critical</span>
        </div>
      </div>
    </div>
  );
}
