import React, { useState, useEffect } from 'react';
import { Moon, Sun, Palette, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ThemeControlsProps {
  roomId?: string;
}

export function ThemeControls({ roomId }: ThemeControlsProps = {}) {
  const { mode, intensity, toggleMode, setIntensity } = useTheme();
  const [stageThemeMode, setStageThemeMode] = useState<'light' | 'dark'>('light');
  const [isSavingStageTheme, setIsSavingStageTheme] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoomTheme = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('stage_theme_mode')
        .eq('id', roomId)
        .maybeSingle();

      if (data) {
        setStageThemeMode(data.stage_theme_mode);
      }
    };

    fetchRoomTheme();

    const channel = supabase
      .channel(`room_theme:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload: any) => {
          if (payload.new.stage_theme_mode) {
            setStageThemeMode(payload.new.stage_theme_mode);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const toggleStageTheme = async () => {
    if (!roomId) return;

    const newMode = stageThemeMode === 'light' ? 'dark' : 'light';
    setIsSavingStageTheme(true);

    await supabase
      .from('rooms')
      .update({ stage_theme_mode: newMode })
      .eq('id', roomId);

    setStageThemeMode(newMode);
    setIsSavingStageTheme(false);
  };

  return (
    <Card>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Palette className="w-6 h-6" />
        Theme
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[var(--fg)] mb-2 block">
            Control Room Theme
          </label>
          <Button
            onClick={toggleMode}
            variant="soft"
            size="md"
            className="w-full"
          >
            {mode === 'light' ? (
              <>
                <Moon className="w-5 h-5" />
                <span>Switch to Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5" />
                <span>Switch to Light</span>
              </>
            )}
          </Button>
        </div>

        {roomId && (
          <div>
            <label className="text-sm font-medium text-[var(--fg)] mb-2 block">
              Stage Display Theme
            </label>
            <Button
              onClick={toggleStageTheme}
              variant="soft"
              size="md"
              className="w-full"
              disabled={isSavingStageTheme}
            >
              <Monitor className="w-5 h-5" />
              {stageThemeMode === 'light' ? (
                <>
                  <Moon className="w-5 h-5" />
                  <span>Stage: Light Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-5 h-5" />
                  <span>Stage: Dark Mode</span>
                </>
              )}
            </Button>
            <p className="text-xs text-[var(--fg)] opacity-60 mt-2">
              Changes the theme for the stage display window
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-[var(--fg)] mb-2 block">
            Neumorphism Intensity
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => setIntensity('low')}
              variant={intensity === 'low' ? 'primary' : 'soft'}
              size="sm"
              className="flex-1"
            >
              <span>Low</span>
            </Button>
            <Button
              onClick={() => setIntensity('medium')}
              variant={intensity === 'medium' ? 'primary' : 'soft'}
              size="sm"
              className="flex-1"
            >
              <span>Medium</span>
            </Button>
            <Button
              onClick={() => setIntensity('high')}
              variant={intensity === 'high' ? 'primary' : 'soft'}
              size="sm"
              className="flex-1"
            >
              <span>High</span>
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--fg)] border-opacity-10">
          <p className="text-xs text-[var(--fg)] opacity-60">
            Theme changes apply in real-time
          </p>
        </div>
      </div>
    </Card>
  );
}
