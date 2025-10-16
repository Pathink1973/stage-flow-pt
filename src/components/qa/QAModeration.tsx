import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Check, X, MessageCircle, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';

type QASubmission = Database['public']['Tables']['qa_submissions']['Row'];

interface QAModerationProps {
  roomId: string;
  roomSlug: string;
}

export function QAModeration({ roomId, roomSlug }: QAModerationProps) {
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<QASubmission[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSubmissions();

    const channel = supabase
      .channel(`qa:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qa_submissions',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, filter]);

  const fetchSubmissions = async () => {
    let query = supabase
      .from('qa_submissions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;

    if (data) {
      setSubmissions(data);
    }
  };

  const updateStatus = async (
    id: string,
    status: 'approved' | 'rejected' | 'answered'
  ) => {
    await supabase
      .from('qa_submissions')
      .update({ status })
      .eq('id', id);
  };

  const deleteSubmission = async (id: string) => {
    if (confirm(t('qa.deleteQuestion'))) {
      await supabase
        .from('qa_submissions')
        .delete()
        .eq('id', id);
    }
  };

  const deleteAllSubmissions = async () => {
    if (confirm(t('messages.deleteAllConfirm'))) {
      await supabase
        .from('qa_submissions')
        .delete()
        .eq('room_id', roomId);
    }
  };

  const qaUrl = `${window.location.origin}/room/${roomSlug}/qa`;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubmissions();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-[var(--success)] bg-opacity-20 text-[var(--success)]';
      case 'rejected':
        return 'bg-[var(--danger)] bg-opacity-20 text-[var(--danger)]';
      case 'answered':
        return 'bg-[var(--accent)] bg-opacity-20 text-[var(--accent)]';
      default:
        return 'bg-[var(--warn)] bg-opacity-20 text-[var(--warn)]';
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{t('qa.title')}</span>
          <span className="sm:hidden">{t('qa.titleShort')}</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-[var(--bg)] hover:bg-opacity-50 transition-all ml-1"
            title={t('qa.refreshQuestions')}
          >
            <RefreshCw className={`w-4 h-4 text-[var(--fg)] opacity-60 ${refreshing ? 'animate-refresh' : ''}`} />
          </button>
        </h3>
        <Button
          variant="soft"
          size="sm"
          onClick={() => window.open(qaUrl, '_blank')}
        >
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Link</span>
        </Button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'pending' ? 'primary' : 'soft'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            <span className="text-xs sm:text-sm">{t('qa.pending')}</span>
          </Button>
          <Button
            variant={filter === 'approved' ? 'primary' : 'soft'}
            size="sm"
            onClick={() => setFilter('approved')}
          >
            <span className="text-xs sm:text-sm">{t('qa.approved')}</span>
          </Button>
          <Button
            variant={filter === 'all' ? 'primary' : 'soft'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            <span className="text-xs sm:text-sm">{t('common.all', { defaultValue: 'Tudo' })}</span>
          </Button>
        </div>
        {submissions.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={deleteAllSubmissions}
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{t('messages.deleteAll')}</span>
          </Button>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-[var(--fg)] opacity-30 mx-auto mb-3" />
            <p className="text-[var(--fg)] opacity-50 text-sm">
              {t('qa.noQuestions')}
            </p>
          </div>
        ) : (
          submissions.map((submission) => (
            <div
              key={submission.id}
              className="p-3 sm:p-4 rounded-lg neumo-raised space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {submission.author && (
                      <span className="font-medium text-sm sm:text-base text-[var(--fg)]">
                        {submission.author}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(
                        submission.status
                      )}`}
                    >
                      {t(`qa.${submission.status}`)}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-[var(--fg)]">{submission.body}</p>
                  <p className="text-xs text-[var(--fg)] opacity-50 mt-2">
                    {new Date(submission.created_at).toLocaleString('pt-PT')}
                  </p>
                </div>
                <button
                  onClick={() => deleteSubmission(submission.id)}
                  className="p-2 rounded-full hover:bg-[var(--danger)] hover:bg-opacity-20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-[var(--danger)]" />
                </button>
              </div>

              {submission.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => updateStatus(submission.id, 'approved')}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('qa.approve')}</span>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => updateStatus(submission.id, 'rejected')}
                    className="flex-1"
                  >
                    <X className="w-4 h-4" />
                    <span>{t('qa.reject')}</span>
                  </Button>
                </div>
              )}

              {submission.status === 'approved' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => updateStatus(submission.id, 'answered')}
                  className="w-full"
                >
                  <Check className="w-4 h-4" />
                  <span>{t('qa.markAnswered', { defaultValue: 'Marcar como Respondida' })}</span>
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
