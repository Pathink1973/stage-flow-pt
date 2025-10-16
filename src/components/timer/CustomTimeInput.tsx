import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CustomTimeInputProps {
  onSetTime: (minutes: number) => void;
}

export function CustomTimeInput({ onSetTime }: CustomTimeInputProps) {
  const { t } = useTranslation();
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;

    const totalMinutes = h * 60 + m + s / 60;

    if (totalMinutes > 0) {
      onSetTime(totalMinutes);
      setHours('');
      setMinutes('');
      setSeconds('');
    }
  };

  const handleNumberInput = (
    value: string,
    setter: (val: string) => void,
    max: number
  ) => {
    const num = value.replace(/\D/g, '');
    if (num === '' || parseInt(num) <= max) {
      setter(num);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1 grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-[var(--fg)] opacity-60 block mb-1">
            {t('timer.hours')}
          </label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={hours}
            onChange={(val) => handleNumberInput(val, setHours, 23)}
            className="text-center"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--fg)] opacity-60 block mb-1">
            {t('timer.mins')}
          </label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={minutes}
            onChange={(val) => handleNumberInput(val, setMinutes, 59)}
            className="text-center"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--fg)] opacity-60 block mb-1">
            {t('timer.secs')}
          </label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={seconds}
            onChange={(val) => handleNumberInput(val, setSeconds, 59)}
            className="text-center"
          />
        </div>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={!hours && !minutes && !seconds}
      >
        <Clock className="w-5 h-5" />
        <span className="font-semibold">{t('timer.setTimer')}</span>
      </Button>
    </form>
  );
}
