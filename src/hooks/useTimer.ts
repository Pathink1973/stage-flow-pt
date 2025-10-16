import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Timer = Database['public']['Tables']['timers']['Row'];

interface UseTimerState {
  timer: Timer | null;
  loading: boolean;
  updating: boolean;
  connected: boolean;
  lastUpdate: number;
}

export function useTimer(roomId: string | null) {
  const [timer, setTimer] = useState<Timer | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [connected, setConnected] = useState(true);
  const updateInProgressRef = useRef(false);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimestamp = useRef<number>(0);

  const fetchTimer = useCallback(async (force = false) => {
    if (!roomId) {
      setLoading(false);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('timers')
        .select('*')
        .eq('room_id', roomId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const dataTimestamp = new Date(data.updated_at).getTime();

        // Only update if this data is newer or force refresh
        if (force || dataTimestamp > lastUpdateTimestamp.current) {
          lastUpdateTimestamp.current = dataTimestamp;
          setTimer(data);
        }
        return data;
      }
      setLoading(false);
      return null;
    } catch (error) {
      console.error('Error fetching timer:', error);
      setLoading(false);
      return null;
    }
  }, [roomId]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!roomId) return null;

    const channel = supabase
      .channel(`timer_${roomId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timers',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Timer update received:', payload);

          if (payload.eventType === 'DELETE') {
            setTimer(null);
            lastUpdateTimestamp.current = Date.now();
          } else if (payload.new) {
            const newTimer = payload.new as Timer;
            const newTimestamp = new Date(newTimer.updated_at).getTime();

            // Only apply update if it's newer than our last known update
            if (newTimestamp > lastUpdateTimestamp.current) {
              lastUpdateTimestamp.current = newTimestamp;
              setTimer({ ...newTimer });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Timer subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setConnected(true);
          reconnectAttempts.current = 0;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnected(false);

          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts.current < 5) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
            reconnectAttempts.current++;

            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(`Attempting to reconnect (attempt ${reconnectAttempts.current})`);
              channel.subscribe();
            }, delay);
          }
        }
      });

    return channel;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    fetchTimer(true);
    const channel = setupRealtimeSubscription();

    // Heartbeat to check connection every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (!connected && reconnectAttempts.current === 0) {
        console.log('Connection lost, attempting to reconnect...');
        channel?.subscribe();
      }
    }, 30000);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(heartbeatInterval);
      channel?.unsubscribe();
    };
  }, [roomId, fetchTimer, setupRealtimeSubscription, connected]);

  const startTimer = async () => {
    if (!timer || updateInProgressRef.current) {
      console.log('Cannot start timer: no timer available or update in progress');
      return;
    }

    updateInProgressRef.current = true;
    setUpdating(true);
    console.log('Starting timer:', timer.id, 'current state:', timer.state);

    // Optimistic update
    const startedAt = new Date().toISOString();
    const optimisticTimer = {
      ...timer,
      state: 'running' as const,
      started_at: startedAt,
    };
    setTimer(optimisticTimer);

    try {
      const { error } = await supabase
        .from('timers')
        .update({
          state: 'running',
          started_at: startedAt,
        })
        .eq('id', timer.id);

      if (error) {
        console.error('Error starting timer:', error);
        // Revert optimistic update on error
        await fetchTimer(true);
      } else {
        console.log('Timer started successfully');
      }
    } catch (error) {
      console.error('Exception starting timer:', error);
      await fetchTimer(true);
    } finally {
      setUpdating(false);
      updateInProgressRef.current = false;
    }
  };

  const pauseTimer = async () => {
    if (!timer || timer.state !== 'running' || updateInProgressRef.current) {
      console.log('Cannot pause timer:', { timer, state: timer?.state });
      return;
    }

    updateInProgressRef.current = true;
    setUpdating(true);
    console.log('Pausing timer:', timer.id);

    try {
      // Get the current timer state from database to ensure accuracy
      const { data: currentTimer, error: fetchError } = await supabase
        .from('timers')
        .select('*')
        .eq('id', timer.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching timer for pause:', fetchError);
        return;
      }

      if (!currentTimer || !currentTimer.started_at) {
        console.log('No current timer or started_at:', currentTimer);
        return;
      }

      const startedAt = new Date(currentTimer.started_at).getTime();
      const now = Date.now();
      const additionalElapsed = Math.floor((now - startedAt) / 1000);
      const totalElapsed = currentTimer.elapsed_sec + additionalElapsed;

      console.log('Pausing timer with elapsed:', totalElapsed);

      // Optimistic update
      const optimisticTimer = {
        ...currentTimer,
        state: 'paused' as const,
        elapsed_sec: totalElapsed,
        started_at: null,
      };
      setTimer(optimisticTimer);

      const { error: updateError } = await supabase
        .from('timers')
        .update({
          state: 'paused',
          elapsed_sec: totalElapsed,
          started_at: null,
        })
        .eq('id', timer.id);

      if (updateError) {
        console.error('Error updating timer to paused:', updateError);
        // Revert optimistic update on error
        await fetchTimer(true);
      } else {
        console.log('Timer paused successfully');
      }
    } catch (error) {
      console.error('Exception pausing timer:', error);
      await fetchTimer(true);
    } finally {
      setUpdating(false);
      updateInProgressRef.current = false;
    }
  };

  const resetTimer = async () => {
    if (!timer || updateInProgressRef.current) return;

    updateInProgressRef.current = true;
    setUpdating(true);

    // Optimistic update
    const optimisticTimer = {
      ...timer,
      state: 'idle' as const,
      started_at: null,
      elapsed_sec: 0,
      overrun_sec: 0,
    };
    setTimer(optimisticTimer);

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
        console.error('Error resetting timer:', error);
        await fetchTimer(true);
      }
    } catch (error) {
      console.error('Exception resetting timer:', error);
      await fetchTimer(true);
    } finally {
      setUpdating(false);
      updateInProgressRef.current = false;
    }
  };

  const adjustTimer = async (seconds: number) => {
    if (!timer || updateInProgressRef.current) return;

    updateInProgressRef.current = true;
    setUpdating(true);

    const newBaseSec = Math.max(0, timer.base_sec + seconds);

    try {
      // If timer is running, we need to maintain running state with adjustment
      if (timer.state === 'running') {
        // Get current elapsed time
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

        // Optimistic update
        const optimisticTimer = {
          ...currentTimer,
          base_sec: newBaseSec,
          elapsed_sec: totalElapsed,
          started_at: newStartedAt,
        };
        setTimer(optimisticTimer);

        // Update with new base and current elapsed, restart the timer
        const { error } = await supabase
          .from('timers')
          .update({
            base_sec: newBaseSec,
            elapsed_sec: totalElapsed,
            started_at: newStartedAt,
          })
          .eq('id', timer.id);

        if (error) {
          console.error('Error adjusting running timer:', error);
          await fetchTimer(true);
        }
      } else {
        // If paused or idle, just update the base
        const optimisticTimer = {
          ...timer,
          base_sec: newBaseSec,
        };
        setTimer(optimisticTimer);

        const { error } = await supabase
          .from('timers')
          .update({
            base_sec: newBaseSec,
          })
          .eq('id', timer.id);

        if (error) {
          console.error('Error adjusting paused timer:', error);
          await fetchTimer(true);
        }
      }
    } catch (error) {
      console.error('Exception adjusting timer:', error);
      await fetchTimer(true);
    } finally {
      setUpdating(false);
      updateInProgressRef.current = false;
    }
  };

  return {
    timer,
    loading,
    updating,
    connected,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTimer,
    refreshTimer: () => fetchTimer(true),
  };
}
