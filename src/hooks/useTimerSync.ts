import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { timerSyncManager, SyncStatus } from '../services/TimerSyncManager';
import { Database } from '../lib/database.types';

type Timer = Database['public']['Tables']['timers']['Row'];

interface UseTimerSyncReturn {
  timer: Timer | null;
  loading: boolean;
  updating: boolean;
  connected: boolean;
  syncStatus: SyncStatus | null;
  currentTime: number;
  elapsed: number;
  isOverrun: boolean;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  adjustTimer: (seconds: number) => Promise<void>;
  refreshTimer: () => Promise<void>;
}

export function useTimerSync(roomId: string | null): UseTimerSyncReturn {
  const [timer, setTimer] = useState<Timer | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isOverrun, setIsOverrun] = useState(false);
  const updateInProgressRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const updateCalculatedTime = useCallback(() => {
    if (!roomId) return;

    const calculated = timerSyncManager.getCalculatedTime(roomId);
    if (calculated) {
      setCurrentTime(calculated.currentTime);
      setElapsed(calculated.elapsed);
      setIsOverrun(calculated.isOverrun);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      setTimer(null);
      return;
    }

    const unsubscribeTimer = timerSyncManager.subscribe(roomId, (newTimer) => {
      setTimer(newTimer);
      setLoading(false);
      updateCalculatedTime();
    });

    const unsubscribeStatus = timerSyncManager.subscribeToStatus(roomId, (status) => {
      setSyncStatus(status);
    });

    const animate = () => {
      updateCalculatedTime();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      unsubscribeTimer();
      unsubscribeStatus();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [roomId, updateCalculatedTime]);

  const startTimer = useCallback(async () => {
    if (!timer || updateInProgressRef.current || timer.state === 'running') {
      return;
    }

    updateInProgressRef.current = true;
    setUpdating(true);

    try {
      const startedAt = new Date().toISOString();
      const { error } = await supabase
        .from('timers')
        .update({
          state: 'running',
          started_at: startedAt,
        })
        .eq('id', timer.id);

      if (error) {
        console.error('[useTimerSync] Error starting timer:', error);
      }
    } catch (error) {
      console.error('[useTimerSync] Exception starting timer:', error);
    } finally {
      setUpdating(false);
      updateInProgressRef.current = false;
    }
  }, [timer]);

  const pauseTimer = useCallback(async () => {
    if (!timer || timer.state !== 'running' || updateInProgressRef.current) {
      return;
    }

    updateInProgressRef.current = true;
    setUpdating(true);

    try {
      const { data: currentTimer, error: fetchError } = await supabase
        .from('timers')
        .select('*')
        .eq('id', timer.id)
        .maybeSingle();

      if (fetchError || !currentTimer || !currentTimer.started_at) {
        console.error('[useTimerSync] Error fetching timer for pause:', fetchError);
        return;
      }

      const startedAt = new Date(currentTimer.started_at).getTime();
      const now = Date.now();
      const additionalElapsed = Math.floor((now - startedAt) / 1000);
      const totalElapsed = currentTimer.elapsed_sec + additionalElapsed;

      const { error: updateError } = await supabase
        .from('timers')
        .update({
          state: 'paused',
          elapsed_sec: totalElapsed,
          started_at: null,
        })
        .eq('id', timer.id);

      if (updateError) {
        console.error('[useTimerSync] Error pausing timer:', updateError);
      }
    } catch (error) {
      console.error('[useTimerSync] Exception pausing timer:', error);
    } finally {
      setUpdating(false);
      updateInProgressRef.current = false;
    }
  }, [timer]);

  const resetTimer = useCallback(async () => {
    if (!timer || updateInProgressRef.current) {
      return;
    }

    updateInProgressRef.current = true;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('timers')
        .update({
          state: 'idle',
          started_at: null,
          elapsed_sec: 0,
          overrun_sec: 0,
        })
        .eq('id', timer.id);

      if (error) {
        console.error('[useTimerSync] Error resetting timer:', error);
      }
    } catch (error) {
      console.error('[useTimerSync] Exception resetting timer:', error);
    } finally {
      setUpdating(false);
      updateInProgressRef.current = false;
    }
  }, [timer]);

  const adjustTimer = useCallback(async (seconds: number) => {
    if (!timer || updateInProgressRef.current) {
      return;
    }

    updateInProgressRef.current = true;
    setUpdating(true);

    try {
      const newBaseSec = Math.max(0, timer.base_sec + seconds);

      if (timer.state === 'running') {
        const { data: currentTimer } = await supabase
          .from('timers')
          .select('*')
          .eq('id', timer.id)
          .maybeSingle();

        if (!currentTimer || !currentTimer.started_at) return;

        const startedAt = new Date(currentTimer.started_at).getTime();
        const now = Date.now();
        const additionalElapsed = Math.floor((now - startedAt) / 1000);
        const totalElapsed = currentTimer.elapsed_sec + additionalElapsed;
        const newStartedAt = new Date().toISOString();

        const { error } = await supabase
          .from('timers')
          .update({
            base_sec: newBaseSec,
            elapsed_sec: totalElapsed,
            started_at: newStartedAt,
          })
          .eq('id', timer.id);

        if (error) {
          console.error('[useTimerSync] Error adjusting running timer:', error);
        }
      } else {
        const { error } = await supabase
          .from('timers')
          .update({
            base_sec: newBaseSec,
          })
          .eq('id', timer.id);

        if (error) {
          console.error('[useTimerSync] Error adjusting paused timer:', error);
        }
      }
    } catch (error) {
      console.error('[useTimerSync] Exception adjusting timer:', error);
    } finally {
      setUpdating(false);
      updateInProgressRef.current = false;
    }
  }, [timer]);

  const refreshTimer = useCallback(async () => {
    if (!roomId) return;
    await timerSyncManager.refreshTimer(roomId);
  }, [roomId]);

  return {
    timer,
    loading,
    updating,
    connected: syncStatus?.connected ?? true,
    syncStatus,
    currentTime,
    elapsed,
    isOverrun,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTimer,
    refreshTimer,
  };
}
