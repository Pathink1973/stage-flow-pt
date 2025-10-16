import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send, AlertCircle, Info, AlertTriangle, X, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];

interface MessageCenterProps {
  roomId: string;
}

export function MessageCenter({ roomId }: MessageCenterProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'ticker' | 'overlay'>('ticker');
  const [messageLevel, setMessageLevel] = useState<'info' | 'warn' | 'alert'>('info');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setMessages(data);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    await supabase.from('messages').insert({
      room_id: roomId,
      body: newMessage.trim(),
      kind: messageKind,
      level: messageLevel,
      is_active: true,
    });

    setNewMessage('');
    setLoading(false);
  };

  const dismissMessage = async (id: string) => {
    await supabase
      .from('messages')
      .update({ is_active: false })
      .eq('id', id);
  };

  const deleteMessage = async (id: string) => {
    if (confirm('Permanently delete this message?')) {
      await supabase
        .from('messages')
        .delete()
        .eq('id', id);
    }
  };

  const deleteAllMessages = async () => {
    if (confirm(t('messages.deleteAllConfirm'))) {
      setLoading(true);
      await supabase
        .from('messages')
        .delete()
        .eq('room_id', roomId);
      setLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'alert':
        return <AlertCircle className="w-4 h-4" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'alert':
        return 'text-[var(--danger)]';
      case 'warn':
        return 'text-[var(--warn)]';
      default:
        return 'text-[var(--accent)]';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{t('messages.title')}</span>
          <span className="sm:hidden">{t('messages.titleShort')}</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-[var(--bg)] hover:bg-opacity-50 transition-all ml-1"
            title={t('messages.refreshMessages')}
          >
            <RefreshCw className={`w-4 h-4 text-[var(--fg)] opacity-60 ${refreshing ? 'animate-refresh' : ''}`} />
          </button>
        </h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Input
            value={newMessage}
            onChange={setNewMessage}
            placeholder={t('messages.messagePlaceholder')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--fg)] mb-2 block">
                {t('messages.type')}
              </label>
              <select
                value={messageKind}
                onChange={(e) => setMessageKind(e.target.value as 'ticker' | 'overlay')}
                className="w-full bg-[var(--bg)] text-[var(--fg)] px-4 py-3 rounded-[var(--radius-sm)] neumo-inset outline-none"
              >
                <option value="ticker">{t('messages.ticker')}</option>
                <option value="overlay">{t('messages.overlay')}</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--fg)] mb-2 block">
                {t('messages.priority')}
              </label>
              <select
                value={messageLevel}
                onChange={(e) => setMessageLevel(e.target.value as 'info' | 'warn' | 'alert')}
                className="w-full bg-[var(--bg)] text-[var(--fg)] px-4 py-3 rounded-[var(--radius-sm)] neumo-inset outline-none"
              >
                <option value="info">{t('messages.info')}</option>
                <option value="warn">{t('messages.warn')}</option>
                <option value="alert">{t('messages.alert')}</option>
              </select>
            </div>
          </div>

          <Button
            onClick={sendMessage}
            variant="primary"
            size="md"
            disabled={loading || !newMessage.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">{t('messages.sendToStage')}</span>
          </Button>
        </div>

        <div className="border-t border-[var(--fg)] border-opacity-10 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-[var(--fg)] opacity-70">
              {t('messages.recentMessages')}
            </h4>
            {messages.length > 0 && (
              <button
                onClick={deleteAllMessages}
                disabled={loading}
                className="text-xs text-[var(--danger)] hover:text-[var(--danger)] hover:opacity-80 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--danger)] hover:bg-opacity-10 transition-all disabled:opacity-50"
                title={t('messages.deleteAll')}
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">{t('messages.deleteAll')}</span>
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`
                  p-3 rounded-lg neumo-raised
                  ${msg.is_active ? 'bg-[var(--accent)] bg-opacity-10' : 'opacity-50'}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={getLevelColor(msg.level)}>
                        {getLevelIcon(msg.level)}
                      </span>
                      <span className="text-xs text-[var(--fg)] opacity-60">
                        {msg.kind}
                      </span>
                      {msg.is_active && (
                        <span className="text-xs bg-[var(--success)] text-white px-2 py-0.5 rounded-full">
                          {t('messages.active')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--fg)]">{msg.body}</p>
                  </div>
                  <div className="flex gap-1">
                    {msg.is_active && (
                      <button
                        onClick={() => dismissMessage(msg.id)}
                        className="p-1 rounded-full hover:bg-[var(--warn)] hover:bg-opacity-20 transition-colors"
                        title={t('messages.dismiss')}
                      >
                        <X className="w-4 h-4 text-[var(--warn)]" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1 rounded-full hover:bg-[var(--danger)] hover:bg-opacity-20 transition-colors"
                      title={t('messages.deleteMessage')}
                    >
                      <Trash2 className="w-4 h-4 text-[var(--danger)]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
