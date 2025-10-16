import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, LogOut, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, PROJECT_ID } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Database } from '../lib/database.types';

type Room = Database['public']['Tables']['rooms']['Row'];

export function Dashboard() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('owner_id', user.id)
      .eq('project_id', PROJECT_ID)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRooms(data);
    }
    setLoading(false);
  };

  const createRoom = async () => {
    if (!user || !roomName.trim()) return;

    setError('');

    const slug = roomName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substr(2, 6);

    const { error: insertError } = await supabase
      .from('rooms')
      .insert({
        owner_id: user.id,
        name: roomName.trim(),
        slug,
        project_id: PROJECT_ID,
      });

    if (insertError) {
      console.error('Error creating room:', insertError);
      setError(insertError.message || 'Failed to create room');
      return;
    }

    setRoomName('');
    setShowCreate(false);
    await fetchRooms();
  };

  const deleteRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (deleteConfirm !== roomId) {
      setDeleteConfirm(roomId);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    await supabase.from('rooms').delete().eq('id', roomId);
    setDeleteConfirm(null);
    await fetchRooms();
  };

  const deleteAllRooms = async () => {
    if (!user) return;
    if (!confirm(t('dashboard.deleteAllConfirm'))) return;

    await supabase.from('rooms').delete().eq('owner_id', user.id).eq('project_id', PROJECT_ID);
    await fetchRooms();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-[var(--fg)] opacity-50">{t('app.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--accent)]" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{t('app.name')}</h1>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('auth.signOut')}</span>
          </Button>
        </div>

        <Card className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('dashboard.title')}</h2>
              <p className="text-sm sm:text-base text-[var(--fg)] opacity-70">
                {t('dashboard.subtitle')}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              {rooms.length > 0 && (
                <Button onClick={deleteAllRooms} variant="danger" size="md">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{t('dashboard.deleteAll')}</span>
                </Button>
              )}
              <Button onClick={() => setShowCreate(!showCreate)} variant="primary" size="md">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{t('dashboard.newRoom')}</span>
              </Button>
            </div>
          </div>

          {showCreate && (
            <div className="mt-4 sm:mt-6 space-y-3">
              {error && (
                <div className="p-3 rounded-lg bg-[var(--danger)] bg-opacity-20 text-[var(--danger)] text-sm">
                  {error}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Input
                  value={roomName}
                  onChange={setRoomName}
                  placeholder={t('dashboard.eventName')}
                  className="flex-1"
                />
                <div className="flex gap-2 sm:gap-3">
                  <Button onClick={createRoom} variant="success" size="md" disabled={!roomName.trim()} className="flex-1 sm:flex-none">
                    <span>{t('dashboard.createRoom')}</span>
                  </Button>
                  <Button onClick={() => {
                    setShowCreate(false);
                    setError('');
                  }} variant="ghost" size="md" className="flex-1 sm:flex-none">
                    <span>{t('dashboard.cancel')}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="cursor-pointer hover:scale-105 transition-transform relative"
              onClick={() => navigate(`/room/${room.slug}/control`)}
            >
              <Button
                variant={deleteConfirm === room.id ? 'danger' : 'ghost'}
                size="sm"
                className="absolute top-2 sm:top-3 right-2 sm:right-3"
                onClick={(e) => deleteRoom(room.id, e)}
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {deleteConfirm === room.id && <span className="ml-1 text-xs sm:text-sm">{t('common.sure')}</span>}
              </Button>
              <h3 className="text-lg sm:text-xl font-bold mb-2 pr-10 sm:pr-12">{room.name}</h3>
              <p className="text-sm text-[var(--fg)] opacity-60">
                {t('dashboard.created')} {new Date(room.created_at).toLocaleDateString('pt-PT')}
              </p>
              <div className="mt-4 text-sm font-medium text-[var(--accent)]">
                {t('dashboard.openControlRoom')}
              </div>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && !showCreate && (
          <div className="text-center py-16">
            <p className="text-[var(--fg)] opacity-50 mb-4">
              {t('dashboard.noRooms')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
