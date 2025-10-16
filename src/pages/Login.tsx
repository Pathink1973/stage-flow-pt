import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Login() {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--accent)]" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">{t('app.name')}</h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-[var(--fg)] opacity-70">
            {t('app.tagline')}
          </p>
        </div>

        <Card>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
            {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Input
                label={t('auth.name')}
                value={name}
                onChange={setName}
                placeholder={t('auth.yourName')}
              />
            )}

            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder={t('auth.emailPlaceholder')}
            />

            <Input
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
            />

            {error && (
              <div className="text-[var(--danger)] text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? t('auth.loading') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-[var(--accent)] hover:underline"
            >
              {isSignUp
                ? t('auth.alreadyHaveAccount')
                : t('auth.noAccount')}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
