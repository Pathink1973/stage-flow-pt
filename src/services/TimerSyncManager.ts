import { supabase, PROJECT_ID } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Timer = Database['public']['Tables']['timers']['Row'];

interface TimerState {
  timer: Timer;
  localTimestamp: number;
  serverTimestamp: number;
  syncVersion: number;
}

interface SyncStatus {
  connected: boolean;
  lastSync: number;
  drift: number;
  health: 'excellent' | 'good' | 'degraded' | 'poor';
}

type SyncCallback = (timer: Timer) => void;
type StatusCallback = (status: SyncStatus) => void;

class TimerSyncManager {
  private static instance: TimerSyncManager;
  private roomStates: Map<string, TimerState> = new Map();
  private subscriptions: Map<string, any> = new Map();
  private syncCallbacks: Map<string, Set<SyncCallback>> = new Map();
  private statusCallbacks: Map<string, Set<StatusCallback>> = new Map();
  private syncStatus: Map<string, SyncStatus> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): TimerSyncManager {
    if (!TimerSyncManager.instance) {
      TimerSyncManager.instance = new TimerSyncManager();
    }
    return TimerSyncManager.instance;
  }

  subscribe(roomId: string, callback: SyncCallback): () => void {
    if (!this.syncCallbacks.has(roomId)) {
      this.syncCallbacks.set(roomId, new Set());
      this.initializeRoom(roomId);
    }

    this.syncCallbacks.get(roomId)!.add(callback);

    const currentState = this.roomStates.get(roomId);
    if (currentState) {
      callback(currentState.timer);
    }

    return () => {
      const callbacks = this.syncCallbacks.get(roomId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.cleanupRoom(roomId);
        }
      }
    };
  }

  subscribeToStatus(roomId: string, callback: StatusCallback): () => void {
    if (!this.statusCallbacks.has(roomId)) {
      this.statusCallbacks.set(roomId, new Set());
    }

    this.statusCallbacks.get(roomId)!.add(callback);

    const currentStatus = this.syncStatus.get(roomId);
    if (currentStatus) {
      callback(currentStatus);
    }

    return () => {
      const callbacks = this.statusCallbacks.get(roomId);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  private async initializeRoom(roomId: string) {
    await this.fetchTimerState(roomId);
    this.setupRealtimeSubscription(roomId);
    this.startHeartbeat(roomId);
    this.updateSyncStatus(roomId, { connected: true, lastSync: Date.now(), drift: 0, health: 'excellent' });
  }

  private async fetchTimerState(roomId: string, force = false) {
    try {
      const { data, error } = await supabase
        .from('timers')
        .select('*')
        .eq('room_id', roomId)
        .eq('project_id', PROJECT_ID)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const serverTimestamp = new Date(data.updated_at).getTime();
        const localTimestamp = Date.now();
        const currentState = this.roomStates.get(roomId);
        const syncVersion = currentState ? currentState.syncVersion + 1 : 0;

        if (force || !currentState || serverTimestamp > currentState.serverTimestamp) {
          this.roomStates.set(roomId, {
            timer: data,
            localTimestamp,
            serverTimestamp,
            syncVersion,
          });

          this.notifySubscribers(roomId, data);
          this.updateSyncStatus(roomId, {
            connected: true,
            lastSync: localTimestamp,
            drift: localTimestamp - serverTimestamp,
            health: this.calculateHealth(localTimestamp - serverTimestamp),
          });
        }
      }
    } catch (error) {
      console.error('[TimerSyncManager] Error fetching timer:', error);
      this.updateSyncStatus(roomId, {
        connected: false,
        lastSync: Date.now(),
        drift: 0,
        health: 'poor',
      });
    }
  }

  private setupRealtimeSubscription(roomId: string) {
    if (this.subscriptions.has(roomId)) {
      return;
    }

    const channel = supabase
      .channel(`timer_sync_${roomId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timers',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          this.handleRealtimeUpdate(roomId, payload);
        }
      )
      .subscribe((status) => {
        this.handleSubscriptionStatus(roomId, status, channel);
      });

    this.subscriptions.set(roomId, channel);
  }

  private handleRealtimeUpdate(roomId: string, payload: any) {
    const localTimestamp = Date.now();

    if (payload.eventType === 'DELETE') {
      this.roomStates.delete(roomId);
      this.notifySubscribers(roomId, null as any);
      return;
    }

    if (payload.new) {
      const newTimer = payload.new as Timer;
      const serverTimestamp = new Date(newTimer.updated_at).getTime();
      const currentState = this.roomStates.get(roomId);

      if (!currentState || serverTimestamp >= currentState.serverTimestamp) {
        const syncVersion = currentState ? currentState.syncVersion + 1 : 0;

        this.roomStates.set(roomId, {
          timer: newTimer,
          localTimestamp,
          serverTimestamp,
          syncVersion,
        });

        this.notifySubscribers(roomId, newTimer);
        this.updateSyncStatus(roomId, {
          connected: true,
          lastSync: localTimestamp,
          drift: localTimestamp - serverTimestamp,
          health: this.calculateHealth(localTimestamp - serverTimestamp),
        });
      }
    }
  }

  private handleSubscriptionStatus(roomId: string, status: string, channel: any) {
    if (status === 'SUBSCRIBED') {
      this.reconnectAttempts.set(roomId, 0);
      this.updateSyncStatus(roomId, {
        connected: true,
        lastSync: Date.now(),
        drift: 0,
        health: 'excellent',
      });
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      this.updateSyncStatus(roomId, {
        connected: false,
        lastSync: Date.now(),
        drift: 0,
        health: 'poor',
      });

      const attempts = this.reconnectAttempts.get(roomId) || 0;
      if (attempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
        this.reconnectAttempts.set(roomId, attempts + 1);

        setTimeout(() => {
          channel.subscribe();
        }, delay);
      }
    }
  }

  private startHeartbeat(roomId: string) {
    if (this.heartbeatIntervals.has(roomId)) {
      return;
    }

    const interval = setInterval(async () => {
      const status = this.syncStatus.get(roomId);
      const timeSinceLastSync = Date.now() - (status?.lastSync || 0);

      if (!status?.connected && timeSinceLastSync > 30000) {
        const channel = this.subscriptions.get(roomId);
        if (channel) {
          channel.subscribe();
        }
      }

      if (timeSinceLastSync > 60000) {
        await this.fetchTimerState(roomId, true);
      }
    }, 15000);

    this.heartbeatIntervals.set(roomId, interval);
  }

  private cleanupRoom(roomId: string) {
    const channel = this.subscriptions.get(roomId);
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(roomId);
    }

    const interval = this.heartbeatIntervals.get(roomId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(roomId);
    }

    this.roomStates.delete(roomId);
    this.syncCallbacks.delete(roomId);
    this.statusCallbacks.delete(roomId);
    this.syncStatus.delete(roomId);
    this.reconnectAttempts.delete(roomId);
  }

  private notifySubscribers(roomId: string, timer: Timer) {
    const callbacks = this.syncCallbacks.get(roomId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(timer);
        } catch (error) {
          console.error('[TimerSyncManager] Error in subscriber callback:', error);
        }
      });
    }
  }

  private updateSyncStatus(roomId: string, status: SyncStatus) {
    this.syncStatus.set(roomId, status);

    const callbacks = this.statusCallbacks.get(roomId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(status);
        } catch (error) {
          console.error('[TimerSyncManager] Error in status callback:', error);
        }
      });
    }
  }

  private calculateHealth(drift: number): 'excellent' | 'good' | 'degraded' | 'poor' {
    const absDrift = Math.abs(drift);
    if (absDrift < 100) return 'excellent';
    if (absDrift < 500) return 'good';
    if (absDrift < 2000) return 'degraded';
    return 'poor';
  }

  getCurrentState(roomId: string): TimerState | null {
    return this.roomStates.get(roomId) || null;
  }

  getCalculatedTime(roomId: string): { currentTime: number; elapsed: number; isOverrun: boolean } | null {
    const state = this.roomStates.get(roomId);
    if (!state) {
      return null;
    }

    const { timer } = state;

    if (timer.state === 'running' && timer.started_at) {
      const startedAt = new Date(timer.started_at).getTime();
      const now = Date.now();
      const additionalElapsed = Math.floor((now - startedAt) / 1000);
      const totalElapsed = timer.elapsed_sec + additionalElapsed;

      if (timer.type === 'countdown') {
        const remaining = timer.base_sec - totalElapsed;
        return {
          currentTime: Math.max(0, remaining),
          elapsed: totalElapsed,
          isOverrun: remaining < 0,
        };
      } else {
        return {
          currentTime: totalElapsed,
          elapsed: totalElapsed,
          isOverrun: false,
        };
      }
    } else {
      if (timer.type === 'countdown') {
        const remaining = timer.base_sec - timer.elapsed_sec;
        return {
          currentTime: Math.max(0, remaining),
          elapsed: timer.elapsed_sec,
          isOverrun: remaining < 0,
        };
      } else {
        return {
          currentTime: timer.elapsed_sec,
          elapsed: timer.elapsed_sec,
          isOverrun: false,
        };
      }
    }
  }

  async refreshTimer(roomId: string): Promise<void> {
    await this.fetchTimerState(roomId, true);
  }
}

export const timerSyncManager = TimerSyncManager.getInstance();
export type { TimerState, SyncStatus };
