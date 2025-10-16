import { useEffect, useState } from 'react';
import { supabase, PROJECT_ID } from '../lib/supabase';
import { Database } from '../lib/database.types';

type TimerColorSettings = Database['public']['Tables']['timer_color_settings']['Row'];

export function useTimerColorSettings(roomId: string | null) {
  const [settings, setSettings] = useState<TimerColorSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('timer_color_settings')
        .select('*')
        .eq('room_id', roomId)
        .eq('project_id', PROJECT_ID)
        .maybeSingle();

      if (!error && data) {
        setSettings(data);
      } else if (!data) {
        setSettings({
          id: '',
          room_id: roomId,
          project_id: PROJECT_ID,
          warning_threshold_sec: 60,
          critical_threshold_sec: 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      setLoading(false);
    };

    fetchSettings();

    const channel = supabase
      .channel(`timer_color_settings:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timer_color_settings',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSettings({
              id: '',
              room_id: roomId,
              project_id: PROJECT_ID,
              warning_threshold_sec: 60,
              critical_threshold_sec: 15,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } else {
            setSettings(payload.new as TimerColorSettings);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const saveSettings = async (
    warningThresholdSec: number,
    criticalThresholdSec: number
  ) => {
    if (!roomId) return;

    const { data: existing } = await supabase
      .from('timer_color_settings')
      .select('id')
      .eq('room_id', roomId)
      .eq('project_id', PROJECT_ID)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('timer_color_settings')
        .update({
          warning_threshold_sec: warningThresholdSec,
          critical_threshold_sec: criticalThresholdSec,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('timer_color_settings')
        .insert({
          room_id: roomId,
          warning_threshold_sec: warningThresholdSec,
          critical_threshold_sec: criticalThresholdSec,
          project_id: PROJECT_ID,
        });
    }
  };

  return {
    settings,
    loading,
    saveSettings,
  };
}
