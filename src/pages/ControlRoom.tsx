import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, PROJECT_ID } from '../lib/supabase';
import { useTimerSync } from '../hooks/useTimerSync';
import { useAutoAdvance } from '../hooks/useAutoAdvance';
import { useDeviceSession } from '../hooks/useDeviceSession';
import { TimerDisplay } from '../components/timer/TimerDisplay';
import { TimerControls } from '../components/timer/TimerControls';
import { CustomTimeInput } from '../components/timer/CustomTimeInput';
import { TimerErrorBoundary } from '../components/timer/TimerErrorBoundary';
import { CueManager } from '../components/cues/CueManager';
import { MessageCenter } from '../components/messages/MessageCenter';
import { QAModeration } from '../components/qa/QAModeration';
import { ThemeControls } from '../components/theme/ThemeControls';
import { RoomLinks } from '../components/sharing/RoomLinks';
import { TimerColorSettings } from '../components/timer/TimerColorSettings';
import { SyncStatusIndicator } from '../components/sync/SyncStatusIndicator';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Database } from '../lib/database.types';
import { Clock, ArrowLeft, Settings, Save, RefreshCw } from 'lucide-react';

type Room = Database['public']['Tables']['rooms']['Row'];
type Cue = Database['public']['Tables']['cues']['Row'];

export function ControlRoom() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [cues, setCues] = useState<Cue[]>([]);
  const [activeCueId, setActiveCueId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingRoomName, setEditingRoomName] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [refreshingTimer, setRefreshingTimer] = useState(false);
  const { timer, startTimer, pauseTimer, resetTimer, adjustTimer, refreshTimer, updating, connected, currentTime, elapsed, isOverrun, syncStatus } = useTimerSync(room?.id || null);

  const loadCue = useCallback(async (cue: Cue) => {
    if (!room) return;

    const { data: existingTimer } = await supabase
      .from('timers')
      .select('id')
      .eq('room_id', room.id)
      .eq('project_id', PROJECT_ID)
      .maybeSingle();

    if (existingTimer) {
      await supabase
        .from('timers')
        .update({
          cue_id: cue.id,
          type: 'countdown',
          base_sec: cue.duration_sec,
          state: 'idle',
          elapsed_sec: 0,
          overrun_sec: 0,
          started_at: null,
        })
        .eq('id', existingTimer.id);
    } else {
      await supabase
        .from('timers')
        .insert({
          room_id: room.id,
          cue_id: cue.id,
          type: 'countdown',
          base_sec: cue.duration_sec,
          project_id: PROJECT_ID,
        });
    }

    setActiveCueId(cue.id);
  }, [room]);

  useAutoAdvance(timer, cues, loadCue);
  useDeviceSession(room?.id || null, 'controller');

  useEffect(() => {
    if (!slug) return;

    const fetchRoom = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('slug', slug)
        .eq('project_id', PROJECT_ID)
        .maybeSingle();

      if (data) {
        setRoom(data);
        setRoomName(data.name);
      }
    };

    fetchRoom();
  }, [slug]);

  const fetchCues = useCallback(async () => {
    if (!room) return;

    const { data } = await supabase
      .from('cues')
      .select('*')
      .eq('room_id', room.id)
      .eq('project_id', PROJECT_ID)
      .order('idx');

    if (data) {
      setCues(data);
    }
  }, [room]);

  useEffect(() => {
    if (!room) return;

    fetchCues();

    const channel = supabase
      .channel(`control_room_cues_${room.id}`)
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

  const updateRoomName = async () => {
    if (!room || !roomName.trim()) return;

    await supabase
      .from('rooms')
      .update({ name: roomName.trim() })
      .eq('id', room.id);

    setRoom({ ...room, name: roomName.trim() });
    setEditingRoomName(false);
  };

  const addQuickTimer = async (minutes: number) => {
    if (!room) {
      console.error('No room found');
      return;
    }

    console.log('Adding quick timer:', minutes, 'minutes for room:', room.id);

    const { data: existingTimer, error: fetchError } = await supabase
      .from('timers')
      .select('id')
      .eq('room_id', room.id)
      .eq('project_id', PROJECT_ID)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching timer:', fetchError);
      return;
    }

    if (existingTimer) {
      console.log('Updating existing timer:', existingTimer.id);
      const { error: updateError } = await supabase
        .from('timers')
        .update({
          cue_id: null,
          type: 'countdown',
          base_sec: minutes * 60,
          state: 'idle',
          elapsed_sec: 0,
          overrun_sec: 0,
          started_at: null,
        })
        .eq('id', existingTimer.id);

      if (updateError) {
        console.error('Error updating timer:', updateError);
      } else {
        console.log('Timer updated successfully');
      }
    } else {
      console.log('Creating new timer');
      const { error: insertError } = await supabase
        .from('timers')
        .insert({
          room_id: room.id,
          type: 'countdown',
          base_sec: minutes * 60,
          project_id: PROJECT_ID,
        });

      if (insertError) {
        console.error('Error inserting timer:', insertError);
      } else {
        console.log('Timer created successfully');
      }
    }

    setActiveCueId(null);
  };

  const createCue = async (cue: Omit<Cue, 'id' | 'created_at' | 'project_id'>) => {
    if (!room) return;
    await supabase.from('cues').insert({ ...cue, room_id: room.id, project_id: PROJECT_ID });
  };

  const updateCue = async (id: string, updates: Partial<Cue>) => {
    await supabase.from('cues').update(updates).eq('id', id);
  };

  const deleteCue = async (id: string) => {
    await supabase.from('cues').delete().eq('id', id);
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-[var(--fg)] opacity-50">{t('app.loadingRoom')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">{room.name}</h1>
              <p className="text-sm sm:text-base text-[var(--fg)] opacity-70">{t('controlRoom.title')}</p>
            </div>
          </div>
          <Button
            variant={showSettings ? 'primary' : 'soft'}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
            <span className="hidden sm:inline">{t('controlRoom.settings')}</span>
          </Button>
        </div>

        {showSettings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <h3 className="text-xl font-bold mb-4">{t('controlRoom.eventInfo')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--fg)] mb-2 block">
                    {t('controlRoom.eventName')}
                  </label>
                  {editingRoomName ? (
                    <div className="flex gap-2">
                      <Input
                        value={roomName}
                        onChange={setRoomName}
                        placeholder={t('dashboard.eventName')}
                      />
                      <Button
                        variant="success"
                        size="md"
                        onClick={updateRoomName}
                        disabled={!roomName.trim()}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          setRoomName(room.name);
                          setEditingRoomName(false);
                        }}
                      >
                        {t('controlRoom.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-lg neumo-inset">
                      <span className="text-[var(--fg)] font-medium">{room.name}</span>
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => setEditingRoomName(true)}
                      >
                        {t('controlRoom.edit')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
            <RoomLinks roomSlug={room.slug} roomName={room.name} />
            <Card>
              <h3 className="text-xl font-bold mb-4">{t('controlRoom.timerWarningColors')}</h3>
              <TimerColorSettings roomId={room.id} />
            </Card>
            <ThemeControls roomId={room.id} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <TimerErrorBoundary>
                <div className="mb-3">
                  <SyncStatusIndicator status={syncStatus} />
                </div>
                <div className="h-48 sm:h-56 md:h-64">
                  <TimerDisplay timer={timer} currentTime={currentTime} elapsed={elapsed} isOverrun={isOverrun} size="lg" roomId={room.id} />
                </div>
                <div className="mt-4 sm:mt-6">
                  <TimerControls
                    timer={timer}
                    onStart={startTimer}
                    onPause={pauseTimer}
                    onReset={resetTimer}
                    onAdjust={adjustTimer}
                    disabled={updating}
                    connected={connected}
                  />
                </div>
              </TimerErrorBoundary>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  {t('timer.quickTimers')}
                  <button
                    onClick={async () => {
                      setRefreshingTimer(true);
                      await refreshTimer();
                      setRefreshingTimer(false);
                    }}
                    disabled={refreshingTimer}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg)] hover:bg-opacity-50 transition-all ml-1"
                    title={t('controlRoom.refreshTimer')}
                  >
                    <RefreshCw className={`w-4 h-4 text-[var(--fg)] opacity-60 ${refreshingTimer ? 'animate-refresh' : ''}`} />
                  </button>
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4">
                {[5, 10, 15, 30, 45].map((min) => (
                  <Button
                    key={min}
                    variant="soft"
                    size="md"
                    onClick={() => addQuickTimer(min)}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{min} {t('timer.minutes')}</span>
                  </Button>
                ))}
              </div>
              <div className="pt-4 border-t border-[var(--fg)] border-opacity-10">
                <p className="text-sm text-[var(--fg)] opacity-70 mb-3">{t('timer.customTime')}</p>
                <CustomTimeInput onSetTime={addQuickTimer} />
              </div>
            </Card>

            <MessageCenter roomId={room.id} />
            <QAModeration roomId={room.id} roomSlug={room.slug} />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CueManager
                cues={cues}
                activeCueId={activeCueId}
                onLoadCue={loadCue}
                onCreateCue={createCue}
                onUpdateCue={updateCue}
                onDeleteCue={deleteCue}
                onRefresh={fetchCues}
                roomId={room.id}
                roomSlug={room.slug}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
