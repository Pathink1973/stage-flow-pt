import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send, CheckCircle } from 'lucide-react';
import { supabase, PROJECT_ID } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Database } from '../lib/database.types';

type Room = Database['public']['Tables']['rooms']['Row'];

export function QASubmission() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [author, setAuthor] = useState('');
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
      }
    };

    fetchRoom();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !question.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from('qa_submissions')
      .insert({
        room_id: room.id,
        author: author.trim() || null,
        body: question.trim(),
        project_id: PROJECT_ID,
      });

    if (!error) {
      setSubmitted(true);
      setQuestion('');
      setTimeout(() => setSubmitted(false), 3000);
    }

    setLoading(false);
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-[var(--fg)] opacity-50">{t('app.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card>
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{room.name}</h1>
            <p className="text-base sm:text-lg md:text-xl text-[var(--fg)] opacity-70">
              {t('qa.submitTitle')}
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-8 sm:py-12">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--success)] mx-auto mb-3 sm:mb-4" />
              <p className="text-xl sm:text-2xl font-bold text-[var(--success)] mb-2">
                {t('qa.questionSubmitted')}
              </p>
              <p className="text-sm sm:text-base text-[var(--fg)] opacity-70">
                {t('qa.submittedMessage')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <Input
                label={t('qa.yourName')}
                value={author}
                onChange={setAuthor}
                placeholder={t('qa.anonymous')}
              />

              <div>
                <label className="text-sm font-medium text-[var(--fg)] mb-2 block">
                  {t('qa.yourQuestion')}
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t('qa.questionPlaceholder')}
                  rows={5}
                  className="
                    w-full
                    bg-[var(--bg)]
                    text-[var(--fg)]
                    px-4 py-3
                    rounded-[var(--radius-sm)]
                    neumo-inset
                    outline-none
                    transition-all
                    focus:ring-2
                    focus:ring-[var(--accent)]
                    focus:ring-opacity-50
                    resize-none
                  "
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !question.trim()}
                className="w-full"
              >
                <Send className="w-5 h-5 mr-2" />
                {t('qa.submit')}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
