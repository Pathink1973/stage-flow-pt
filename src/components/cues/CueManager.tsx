import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, GripVertical, Save, X, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { StageDisplayPreview } from '../stage/StageDisplayPreview';
import { Database } from '../../lib/database.types';

type Cue = Database['public']['Tables']['cues']['Row'];

interface CueManagerProps {
  cues: Cue[];
  activeCueId: string | null;
  onLoadCue: (cue: Cue) => void;
  onCreateCue: (cue: Omit<Cue, 'id' | 'created_at'>) => Promise<void>;
  onUpdateCue: (id: string, updates: Partial<Cue>) => Promise<void>;
  onDeleteCue: (id: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  roomId: string;
  roomSlug: string;
}

export function CueManager({
  cues,
  activeCueId,
  onLoadCue,
  onCreateCue,
  onUpdateCue,
  onDeleteCue,
  onRefresh,
  roomId,
  roomSlug,
}: CueManagerProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    speaker: '',
    duration_sec: 300,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await onUpdateCue(editingId, formData);
      setEditingId(null);
    } else {
      await onCreateCue({
        ...formData,
        room_id: cues[0]?.room_id || '',
        idx: cues.length,
        auto_advance: true,
      });
    }

    setFormData({ title: '', speaker: '', duration_sec: 300, notes: '' });
    setShowForm(false);
  };

  const handleEdit = (cue: Cue) => {
    setFormData({
      title: cue.title,
      speaker: cue.speaker || '',
      duration_sec: cue.duration_sec,
      notes: cue.notes || '',
    });
    setEditingId(cue.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ title: '', speaker: '', duration_sec: 300, notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="space-y-4">
      <StageDisplayPreview roomId={roomId} roomSlug={roomSlug} />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg sm:text-xl font-bold">{t('cues.rundown')}</h3>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg hover:bg-[var(--bg)] hover:bg-opacity-50 transition-all"
              title={t('cues.refreshRundown')}
            >
              <RefreshCw className={`w-4 h-4 text-[var(--fg)] opacity-60 ${refreshing ? 'animate-refresh' : ''}`} />
            </button>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">{t('cues.addCue')}</span>
        </Button>
      </div>

      {showForm && (
        <Card className="p-3 sm:p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              label={t('cues.title')}
              value={formData.title}
              onChange={(val) => setFormData({ ...formData, title: val })}
              placeholder={t('cues.sessionTitle')}
            />
            <Input
              label={t('cues.speaker')}
              value={formData.speaker}
              onChange={(val) => setFormData({ ...formData, speaker: val })}
              placeholder={t('cues.speakerName')}
            />
            <div>
              <label className="text-sm font-medium text-[var(--fg)] mb-2 block">
                {t('cues.duration')}
              </label>
              <input
                type="number"
                value={Math.floor(formData.duration_sec / 60)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_sec: parseInt(e.target.value) * 60,
                  })
                }
                min="1"
                className="w-full bg-[var(--bg)] text-[var(--fg)] px-4 py-3 rounded-[var(--radius-sm)] neumo-inset outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--fg)] mb-2 block">
                {t('cues.notes')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('cues.privateNotes')}
                rows={3}
                className="w-full bg-[var(--bg)] text-[var(--fg)] px-4 py-3 rounded-[var(--radius-sm)] neumo-inset outline-none resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="success" size="md" className="flex-1">
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-sm sm:text-base">{editingId ? t('cues.update') : t('cues.create')}</span>
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={handleCancel}>
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {cues.length === 0 ? (
          <p className="text-[var(--fg)] opacity-50 text-sm text-center py-8">
            {t('cues.noCues')}
          </p>
        ) : (
          cues.map((cue, index) => (
            <div
              key={cue.id}
              className={`
                relative p-2 sm:p-3 rounded-lg transition-all cursor-pointer
                ${activeCueId === cue.id
                  ? 'neumo-inset bg-[var(--accent)] bg-opacity-10'
                  : 'neumo-raised hover:scale-[1.02]'
                }
              `}
            >
              <div className="flex items-start gap-2 sm:gap-3" onClick={() => onLoadCue(cue)}>
                <div className="mt-1">
                  <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--fg)] opacity-30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-medium text-[var(--fg)] truncate">
                    {index + 1}. {cue.title}
                  </div>
                  {cue.speaker && (
                    <div className="text-xs sm:text-sm text-[var(--fg)] opacity-60 truncate">
                      {cue.speaker}
                    </div>
                  )}
                  <div className="text-xs sm:text-sm text-[var(--accent)] font-medium mt-1">
                    {formatDuration(cue.duration_sec)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(cue);
                    }}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-[var(--bg)] hover:bg-opacity-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--fg)] opacity-60" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t('cues.deleteCueConfirm'))) {
                        onDeleteCue(cue.id);
                      }
                    }}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-[var(--danger)] hover:bg-opacity-20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--danger)]" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
