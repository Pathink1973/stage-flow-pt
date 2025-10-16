import React, { useEffect, useState, useCallback } from 'react';
import { ExternalLink, Copy, CheckCircle, Monitor, HelpCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTimerSync } from '../../hooks/useTimerSync';
import { TimerDisplay } from '../timer/TimerDisplay';
import { Button } from '../ui/Button';
import { Database } from '../../lib/database.types';

type Room = Database['public']['Tables']['rooms']['Row'];
type Cue = Database['public']['Tables']['cues']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface StageDisplayPreviewProps {
  roomId: string;
  roomSlug: string;
}

export function StageDisplayPreview({ roomId, roomSlug }: StageDisplayPreviewProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentCue, setCurrentCue] = useState<Cue | null>(null);
  const [nextCue, setNextCue] = useState<Cue | null>(null);
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [stageTheme, setStageTheme] = useState<'light' | 'dark'>('light');
  const [copied, setCopied] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { timer, currentTime, elapsed, isOverrun } = useTimerSync(roomId);

  const baseUrl = window.location.origin;
  const links = {
    stage: `${baseUrl}/room/${roomSlug}/stage`,
    qa: `${baseUrl}/room/${roomSlug}/qa`,
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const fetchRoom = useCallback(async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .maybeSingle();

    if (data) {
      setRoom(data);
      setStageTheme(data.stage_theme_mode);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`preview_theme_${room.id}_${Date.now()}`)
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

  const fetchCues = useCallback(async () => {
    if (!timer?.cue_id) {
      setCurrentCue(null);
      setNextCue(null);
      return;
    }

    const { data: cue } = await supabase
      .from('cues')
      .select('*')
      .eq('id', timer.cue_id!)
      .maybeSingle();

    if (cue) {
      setCurrentCue(cue);

      const { data: nextCueData } = await supabase
        .from('cues')
        .select('*')
        .eq('room_id', roomId)
        .gt('idx', cue.idx)
        .order('idx')
        .limit(1)
        .maybeSingle();

      setNextCue(nextCueData || null);
    }
  }, [roomId, timer?.cue_id]);

  useEffect(() => {
    fetchCues();
  }, [fetchCues]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`preview_cues_${roomId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cues',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchCues();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, fetchCues]);

  const fetchActiveMessage = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setActiveMessage(data);
  }, [roomId]);

  useEffect(() => {
    fetchActiveMessage();
  }, [fetchActiveMessage]);

  useEffect(() => {
    const channel = supabase
      .channel(`preview_messages_${roomId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchActiveMessage();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, fetchActiveMessage]);

  const handleOpenStageDisplay = () => {
    window.open(links.stage, '_blank', 'noopener,noreferrer');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchRoom(),
      fetchCues(),
      fetchActiveMessage(),
    ]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const themeStyles = stageTheme === 'dark'
    ? 'bg-gray-900 text-white'
    : 'bg-gray-50 text-gray-900';

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-[var(--fg)] opacity-70 uppercase tracking-wider">
          Stage Preview
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 rounded hover:bg-[var(--bg)] hover:bg-opacity-50 transition-all disabled:opacity-50"
            title="Refresh preview"
          >
            <RefreshCw className={`w-4 h-4 text-[var(--fg)] opacity-50 ${refreshing ? 'animate-spin-720' : ''}`} />
          </button>
          <button
            onClick={handleOpenStageDisplay}
            className="p-1 rounded hover:bg-[var(--bg)] hover:bg-opacity-50 transition-all"
            title="Open Stage Display in new window"
          >
            <ExternalLink className="w-4 h-4 text-[var(--fg)] opacity-50" />
          </button>
        </div>
      </div>

      <div
        className="relative neumo-raised rounded-lg overflow-hidden mb-3"
        style={{ aspectRatio: '16/9' }}
      >
        <div className={`w-full h-full flex flex-col ${themeStyles} transition-colors duration-300`}>
          <div className="px-3 py-2 border-b border-current border-opacity-10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold truncate">
                  {room?.name || 'Loading...'}
                </h5>
                {currentCue && (
                  <div className="mt-1">
                    <p className="text-[10px] font-semibold truncate">
                      {currentCue.title}
                    </p>
                    {currentCue.speaker && (
                      <p className="text-[9px] opacity-70 truncate">
                        {currentCue.speaker}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {currentCue && nextCue && (
                <div className="text-right min-w-0 max-w-[40%]">
                  <p className="text-[8px] opacity-50 uppercase tracking-wider">
                    Next
                  </p>
                  <p className="text-[9px] opacity-70 font-medium truncate">
                    {nextCue.title}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 relative">
            <div className="scale-[0.35] origin-center">
              <TimerDisplay timer={timer} currentTime={currentTime} elapsed={elapsed} isOverrun={isOverrun} size="xl" showProgress={false} roomId={roomId} />
            </div>

            {activeMessage && activeMessage.kind === 'overlay' && (
              <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center p-2">
                <div
                  className={`
                    neumo-raised
                    rounded-md
                    p-2
                    max-w-[90%]
                    ${activeMessage.level === 'info' ? 'bg-blue-500' : ''}
                    ${activeMessage.level === 'warn' ? 'bg-orange-500' : ''}
                    ${activeMessage.level === 'alert' ? 'bg-red-500' : ''}
                  `}
                >
                  <p className="text-white text-[10px] font-bold text-center leading-tight">
                    {activeMessage.body}
                  </p>
                </div>
              </div>
            )}

            {activeMessage && activeMessage.kind === 'ticker' && (
              <div className="absolute bottom-0 left-0 right-0 border-t border-current border-opacity-10">
                <div
                  className={`
                    py-1 px-2
                    ${activeMessage.level === 'info' ? 'bg-blue-500' : ''}
                    ${activeMessage.level === 'warn' ? 'bg-orange-500' : ''}
                    ${activeMessage.level === 'alert' ? 'bg-red-500' : ''}
                  `}
                >
                  <p className="text-white text-[9px] font-bold text-center truncate">
                    {activeMessage.body}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none ring-2 ring-[var(--fg)] ring-opacity-10 rounded-lg" />
      </div>

      <div className="space-y-2">
        <div className="p-2 rounded-lg neumo-inset">
          <div className="flex items-center gap-2 mb-1.5">
            <Monitor className="w-3 h-3 text-[var(--accent)]" />
            <span className="text-xs font-medium">Stage Display</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={links.stage}
              readOnly
              className="flex-1 bg-transparent text-[10px] text-[var(--fg)] opacity-70 outline-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(links.stage, 'stage')}
            >
              {copied === 'stage' ? (
                <CheckCircle className="w-3 h-3 text-[var(--success)]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>

        <div className="p-2 rounded-lg neumo-inset">
          <div className="flex items-center gap-2 mb-1.5">
            <HelpCircle className="w-3 h-3 text-[var(--accent)]" />
            <span className="text-xs font-medium">Q&A Submission</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={links.qa}
              readOnly
              className="flex-1 bg-transparent text-[10px] text-[var(--fg)] opacity-70 outline-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(links.qa, 'qa')}
            >
              {copied === 'qa' ? (
                <CheckCircle className="w-3 h-3 text-[var(--success)]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
