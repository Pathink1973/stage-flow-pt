import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Maximize, RefreshCw } from 'lucide-react';
import { supabase, PROJECT_ID } from '../lib/supabase';
import { useTimerSync } from '../hooks/useTimerSync';
import { useDeviceSession } from '../hooks/useDeviceSession';
import { TimerDisplay } from '../components/timer/TimerDisplay';
import { SyncStatusIndicator } from '../components/sync/SyncStatusIndicator';
import { Database } from '../lib/database.types';

type Room = Database['public']['Tables']['rooms']['Row'];
type Cue = Database['public']['Tables']['cues']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

export function StageDisplay() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCue, setCurrentCue] = useState<Cue | null>(null);
  const [nextCue, setNextCue] = useState<Cue | null>(null);
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageTheme, setStageTheme] = useState<'light' | 'dark'>('light');
  const [refreshing, setRefreshing] = useState(false);
  const { timer, refreshTimer, currentTime, elapsed, isOverrun, syncStatus } = useTimerSync(room?.id || null);

  useDeviceSession(room?.id || null, 'stage_display');

  const fetchRoom = useCallback(async () => {
    if (!slug) {
      setError('No room slug provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[StageDisplay] Fetching room with slug:', slug);

      const { data, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('slug', slug)
        .eq('project_id', PROJECT_ID)
        .maybeSingle();

      console.log('[StageDisplay] Query result:', { data, fetchError, slug });

      if (fetchError) {
        console.error('[StageDisplay] Error fetching room:', fetchError);
        setError(`Error: ${fetchError.message} (${fetchError.code || 'unknown'})`);
        setLoading(false);
        return;
      }

      if (data) {
        console.log('[StageDisplay] Room loaded successfully:', data);
        setRoom(data);
        setStageTheme(data.stage_theme_mode);
        setError(null);
      } else {
        console.warn('[StageDisplay] No room found with slug:', slug);
        console.log('[StageDisplay] This likely means RLS is blocking access');
        setError('Room not found - Access denied. Please contact support.');
      }
    } catch (err) {
      console.error('[StageDisplay] Unexpected error:', err);
      setError('Failed to load room');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`stage_display_theme_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload: any) => {
          if (payload.new.stage_theme_mode) {
            setStageTheme(payload.new.stage_theme_mode);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [room]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', stageTheme === 'dark');
  }, [stageTheme]);

  const fetchCues = useCallback(async () => {
    if (!room || !timer?.cue_id) {
      setCurrentCue(null);
      setNextCue(null);
      return;
    }

    const { data: cue } = await supabase
      .from('cues')
      .select('*')
      .eq('id', timer.cue_id!)
      .eq('project_id', PROJECT_ID)
      .maybeSingle();

    if (cue) {
      setCurrentCue(cue);

      const { data: nextCueData } = await supabase
        .from('cues')
        .select('*')
        .eq('room_id', room.id)
        .eq('project_id', PROJECT_ID)
        .gt('idx', cue.idx)
        .order('idx')
        .limit(1)
        .maybeSingle();

      setNextCue(nextCueData || null);
    }
  }, [room, timer?.cue_id]);

  useEffect(() => {
    fetchCues();
  }, [fetchCues]);

  // Subscribe to cue changes
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`stage_display_cues_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cues',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          fetchCues();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [room, fetchCues]);

  const fetchActiveMessage = useCallback(async () => {
    if (!room) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', room.id)
      .eq('project_id', PROJECT_ID)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setActiveMessage(data);
  }, [room]);

  useEffect(() => {
    fetchActiveMessage();
  }, [fetchActiveMessage]);

  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`stage_display_messages_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          fetchActiveMessage();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [room, fetchActiveMessage]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchRoom(),
      fetchCues(),
      fetchActiveMessage(),
      refreshTimer(),
    ]);
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-2xl text-white opacity-50 mb-4">{t('app.loading')}</div>
          <div className="text-sm text-white opacity-30">{slug}</div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="text-center max-w-md">
          <div className="text-2xl text-red-400 mb-4">{error || t('stageDisplay.noTimer')}</div>
          <div className="text-sm text-white opacity-50 mb-4">Slug: {slug}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-lg transition-all"
          >
            {t('common.retry', { defaultValue: 'Tentar Novamente' })}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] relative">
      {!isFullscreen && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 flex items-start gap-1 sm:gap-2">
          <div className="mt-1">
            <SyncStatusIndicator status={syncStatus} compact />
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 sm:p-3 rounded-full neumo-raised bg-[var(--bg)] hover:scale-110 transition-transform disabled:opacity-50"
            title={t('stageDisplay.refresh', { defaultValue: 'Atualizar ecrã' })}
          >
            <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-[var(--fg)] ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:p-3 rounded-full neumo-raised bg-[var(--bg)] hover:scale-110 transition-transform"
            title={t('stageDisplay.toggleFullscreen', { defaultValue: 'Alternar ecrã inteiro' })}
          >
            <Maximize className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--fg)]" />
          </button>
        </div>
      )}

      <div className="neumo-raised bg-[var(--bg)] border-b-2 border-[var(--fg)] border-opacity-10">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--fg)] mb-1">
                {room.name}
              </h1>
              {currentCue && (
                <div className="mt-2 sm:mt-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-[var(--fg)]">
                    {currentCue.title}
                  </h2>
                  {currentCue.speaker && (
                    <p className="text-sm sm:text-base text-[var(--fg)] opacity-70 mt-1">
                      {currentCue.speaker}
                    </p>
                  )}
                </div>
              )}
            </div>
            {currentCue && nextCue && (
              <div className="text-left sm:text-right mt-2 sm:mt-0">
                <p className="text-xs text-[var(--fg)] opacity-50 uppercase tracking-wider mb-1">
                  {t('stageDisplay.nextUp', { defaultValue: 'A Seguir' })}
                </p>
                <p className="text-sm sm:text-base text-[var(--fg)] opacity-70 font-medium">
                  {nextCue.title}
                </p>
                {nextCue.speaker && (
                  <p className="text-xs sm:text-sm text-[var(--fg)] opacity-50">
                    {nextCue.speaker}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-6xl">
          <TimerDisplay timer={timer} currentTime={currentTime} elapsed={elapsed} isOverrun={isOverrun} size="xl" showProgress={true} progressStyle="bar" roomId={room.id} />
        </div>
      </div>

      {activeMessage && activeMessage.kind === 'overlay' && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 sm:p-6">
          <div
            className={`
              neumo-raised
              rounded-[var(--radius-md)]
              p-6 sm:p-8
              max-w-2xl
              w-full
              ${activeMessage.level === 'info' ? 'bg-[var(--accent)]' : ''}
              ${activeMessage.level === 'warn' ? 'bg-[var(--warn)]' : ''}
              ${activeMessage.level === 'alert' ? 'bg-[var(--danger)]' : ''}
            `}
          >
            <p className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-tight">
              {activeMessage.body}
            </p>
          </div>
        </div>
      )}

      {activeMessage && activeMessage.kind === 'ticker' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 neumo-raised border-t-2 border-[var(--fg)] border-opacity-10">
          <div
            className={`
              py-3 sm:py-4 px-4 sm:px-6 md:px-8
              ${activeMessage.level === 'info' ? 'bg-[var(--accent)]' : ''}
              ${activeMessage.level === 'warn' ? 'bg-[var(--warn)]' : ''}
              ${activeMessage.level === 'alert' ? 'bg-[var(--danger)]' : ''}
            `}
          >
            <p className="text-white text-lg sm:text-2xl md:text-3xl font-bold text-center">
              {activeMessage.body}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
