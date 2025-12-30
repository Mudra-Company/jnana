import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordViewProps {
  onSuccess: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Link di reset non valido o scaduto. Richiedi un nuovo link.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError('Si è verificato un errore. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-jnana-bg via-white to-jnana-powder/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-jnana-charcoal dark:text-white tracking-tight">
            JNANA
          </h1>
          <p className="text-jnana-text/60 dark:text-gray-400 mt-2">
            People Analytics Platform
          </p>
        </div>

        <Card className="p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-jnana-charcoal dark:text-white mb-2">
                Password Aggiornata!
              </h2>
              <p className="text-jnana-text/70 dark:text-gray-400">
                Reindirizzamento in corso...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-jnana-powder/50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-jnana-charcoal dark:text-gray-300" />
                </div>
                <h2 className="text-xl font-semibold text-jnana-charcoal dark:text-white mb-2">
                  Nuova Password
                </h2>
                <p className="text-jnana-text/70 dark:text-gray-400 text-sm">
                  Inserisci la tua nuova password
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-jnana-text dark:text-gray-300 mb-1">
                    Nuova Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jnana-text/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 border border-jnana-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-jnana-text dark:text-white focus:ring-2 focus:ring-jnana-charcoal/20 focus:border-jnana-charcoal transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-jnana-text/40 hover:text-jnana-text/60"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-jnana-text/50 dark:text-gray-500">
                    Minimo 6 caratteri
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-jnana-text dark:text-gray-300 mb-1">
                    Conferma Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jnana-text/40" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 border border-jnana-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-jnana-text dark:text-white focus:ring-2 focus:ring-jnana-charcoal/20 focus:border-jnana-charcoal transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-jnana-text/40 hover:text-jnana-text/60"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-jnana-charcoal hover:bg-jnana-charcoal/90 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Aggiornamento...
                    </span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 inline-block mr-2" />
                      Aggiorna Password
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-jnana-text/50 dark:text-gray-500">
          © 2024 JNANA People Analytics
        </p>
      </div>
    </div>
  );
};
