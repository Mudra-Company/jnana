import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';

interface AuthViewProps {
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email o password non validi');
          } else {
            setError(error.message);
          }
        } else {
          onSuccess?.();
        }
      } else {
        const { error } = await signUp(email, password, firstName, lastName);
        if (error) {
          if (error.message.includes('User already registered')) {
            setError('Questo indirizzo email è già registrato');
          } else {
            setError(error.message);
          }
        } else {
          setSuccessMessage('Account creato! Ora puoi accedere.');
          setIsLogin(true);
        }
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
          {/* Tabs */}
          <div className="flex mb-6 bg-jnana-bg dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-white dark:bg-gray-600 text-jnana-charcoal dark:text-white shadow-sm'
                  : 'text-jnana-text/60 dark:text-gray-400 hover:text-jnana-text dark:hover:text-gray-200'
              }`}
            >
              <LogIn className="w-4 h-4 inline-block mr-2" />
              Accedi
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-white dark:bg-gray-600 text-jnana-charcoal dark:text-white shadow-sm'
                  : 'text-jnana-text/60 dark:text-gray-400 hover:text-jnana-text dark:hover:text-gray-200'
              }`}
            >
              <UserPlus className="w-4 h-4 inline-block mr-2" />
              Registrati
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name fields for signup */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-jnana-text dark:text-gray-300 mb-1">
                    Nome
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jnana-text/40" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-jnana-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-jnana-text dark:text-white focus:ring-2 focus:ring-jnana-charcoal/20 focus:border-jnana-charcoal transition-all"
                      placeholder="Mario"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-jnana-text dark:text-gray-300 mb-1">
                    Cognome
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-jnana-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-jnana-text dark:text-white focus:ring-2 focus:ring-jnana-charcoal/20 focus:border-jnana-charcoal transition-all"
                    placeholder="Rossi"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-jnana-text dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jnana-text/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-jnana-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-jnana-text dark:text-white focus:ring-2 focus:ring-jnana-charcoal/20 focus:border-jnana-charcoal transition-all"
                  placeholder="email@esempio.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-jnana-text dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jnana-text/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 border border-jnana-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-jnana-text dark:text-white focus:ring-2 focus:ring-jnana-charcoal/20 focus:border-jnana-charcoal transition-all"
                  placeholder="••••••••"
                />
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-jnana-text/50 dark:text-gray-500">
                  Minimo 6 caratteri
                </p>
              )}
            </div>

            {/* Submit button */}
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
                  Caricamento...
                </span>
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4 inline-block mr-2" />
                  Accedi
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 inline-block mr-2" />
                  Crea Account
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-jnana-text/50 dark:text-gray-500">
          © 2024 JNANA People Analytics
        </p>
      </div>
    </div>
  );
};
