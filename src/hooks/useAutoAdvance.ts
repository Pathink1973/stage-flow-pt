import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { timerSyncManager } from '../services/TimerSyncManager';
import { Database } from '../lib/database.types';

type Timer = Database['public']['Tables']['timers']['Row'];
type Cue = Database['public']['Tables']['cues']['Row'];

export function useAutoAdvance(
  timer: Timer | null,
  cues: Cue[],
  onLoadCue: (cue: Cue) => void
) {
  const lastTimerState = useRef<string | null>(null);
  const hasAutoAdvanced = useRef<boolean>(false);

  useEffect(() => {
    if (!timer || !timer.cue_id || !timer.room_id) return;

    const checkAutoAdvance = () => {
      if (timer.state === 'running' && lastTimerState.current !== 'running') {
        lastTimerState.current = 'running';
        hasAutoAdvanced.current = false;
        return;
      }

      if (timer.type === 'countdown' && timer.state === 'running' && !hasAutoAdvanced.current) {
        const calculated = timerSyncManager.getCalculatedTime(timer.room_id);

        if (calculated && calculated.currentTime === 0 && calculated.isOverrun === false) {
          const currentCue = cues.find(c => c.id === timer.cue_id);

          if (currentCue?.auto_advance) {
            hasAutoAdvanced.current = true;
            const currentIdx = cues.findIndex(c => c.id === timer.cue_id);
            const nextCue = cues[currentIdx + 1];

            if (nextCue) {
              setTimeout(() => {
                onLoadCue(nextCue);
              }, 1000);
            } else {
              supabase
                .from('timers')
                .update({ state: 'finished' })
                .eq('id', timer.id);
            }
          }
        }
      }

      lastTimerState.current = timer.state;
    };

    const interval = setInterval(checkAutoAdvance, 250);

    return () => clearInterval(interval);
  }, [timer, cues, onLoadCue]);
}
