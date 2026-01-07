import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Eye, EyeOff, Building, Sparkles, ArrowLeft } from 'lucide-react';
import { ForgotPasswordView } from './ForgotPasswordView';

type AuthMode = 'select' | 'jnana' | 'karma';

interface AuthViewProps {
  onSuccess?: () => void;
  onKarmaSignup?: () => void;
  initialMode?: AuthMode;
  onBackToLanding?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onKarmaSignup, initialMode = 'select', onBackToLanding }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
          // For Karma signup, trigger callback
          if (mode === 'karma') {
            onKarmaSignup?.();
          } else {
            setSuccessMessage('Account creato! Ora puoi accedere.');
            setIsLogin(true);
          }
        }
      }
    } catch (err) {
      setError('Si è verificato un errore. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show forgot password view
  if (showForgotPassword) {
    return <ForgotPasswordView onBack={() => setShowForgotPassword(false)} />;
  }

  // Platform Selection Screen
  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-jnana-bg via-white to-jnana-powder/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <div className="w-full max-w-2xl">
          {/* Logo */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-jnana-charcoal dark:text-white tracking-tight">
              MUDRA
            </h1>
            <p className="text-jnana-text/60 dark:text-gray-400 mt-2">
              People Analytics Platform
            </p>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* JNANA Card */}
            <Card 
              className="p-8 cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-jnana-sage group"
              onClick={() => setMode('jnana')}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-jnana-sage/10 rounded-2xl flex items-center justify-center group-hover:bg-jnana-sage/20 transition-colors">
                  <Building className="w-8 h-8 text-jnana-sage" />
                </div>
                <h2 className="text-2xl font-bold text-jnana-charcoal dark:text-white mb-2">
                  JNANA
                </h2>
                <p className="text-lg text-jnana-text/70 dark:text-gray-400 mb-4">
                  Per le Aziende
                </p>
                <p className="text-sm text-jnana-text/50 dark:text-gray-500">
                  Invitato dalla tua azienda? Accedi qui per completare il tuo profilo.
                </p>
                <Button className="mt-6 bg-jnana-sage hover:bg-jnana-sage/90 text-white w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Accedi
                </Button>
              </div>
            </Card>

            {/* KARMA Card */}
            <Card 
              className="p-8 cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-violet-500 group"
              onClick={() => { setMode('karma'); setIsLogin(false); }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-colors">
                  <Sparkles className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-2xl font-bold text-jnana-charcoal dark:text-white mb-2">
                  KARMA
                </h2>
                <p className="text-lg text-jnana-text/70 dark:text-gray-400 mb-4">
                  Per i Talenti
                </p>
                <p className="text-sm text-jnana-text/50 dark:text-gray-500">
                  Crea il tuo profilo pubblico e scopri le opportunità giuste per te.
                </p>
                <Button className="mt-6 bg-violet-600 hover:bg-violet-700 text-white w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Inizia Ora
                </Button>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <p className="text-center mt-8 text-sm text-jnana-text/50 dark:text-gray-500">
            © 2024 Mudra People Analytics
          </p>
        </div>
      </div>
    );
  }

  // Auth Form (JNANA or KARMA)
  const isKarma = mode === 'karma';
  const brandColor = isKarma ? 'violet' : 'jnana-sage';
  const brandName = isKarma ? 'KARMA' : 'JNANA';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-jnana-bg via-white to-jnana-powder/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => onBackToLanding ? onBackToLanding() : setMode('select')}
          className="flex items-center gap-2 text-jnana-text/60 dark:text-gray-400 hover:text-jnana-text dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {onBackToLanding ? 'Torna alla home' : 'Torna alla selezione'}
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold tracking-tight ${isKarma ? 'text-violet-600 dark:text-violet-400' : 'text-jnana-charcoal dark:text-white'}`}>
            {brandName}
          </h1>
          <p className="text-jnana-text/60 dark:text-gray-400 mt-2">
            {isKarma ? 'Crea il tuo profilo pubblico' : 'Accesso Aziendale'}
          </p>
        </div>

        <Card className="p-8">
          {/* Tabs */}
          <div className="flex mb-6 bg-jnana-bg dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? `bg-white dark:bg-gray-600 ${isKarma ? 'text-violet-600' : 'text-jnana-charcoal'} dark:text-white shadow-sm`
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
                  ? `bg-white dark:bg-gray-600 ${isKarma ? 'text-violet-600' : 'text-jnana-charcoal'} dark:text-white shadow-sm`
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
              {!isLogin && (
                <p className="mt-1 text-xs text-jnana-text/50 dark:text-gray-500">
                  Minimo 6 caratteri
                </p>
              )}
            </div>

            {/* Remember me & Forgot password (login only) */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-jnana-border text-jnana-charcoal focus:ring-jnana-charcoal/20"
                  />
                  <span className="text-sm text-jnana-text/70 dark:text-gray-400">Ricordami</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-jnana-charcoal dark:text-gray-400 hover:underline"
                >
                  Password dimenticata?
                </button>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 font-medium rounded-lg transition-all disabled:opacity-50 ${
                isKarma 
                  ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                  : 'bg-jnana-charcoal hover:bg-jnana-charcoal/90 text-white'
              }`}
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
                  {isKarma ? <Sparkles className="w-4 h-4 inline-block mr-2" /> : <UserPlus className="w-4 h-4 inline-block mr-2" />}
                  {isKarma ? 'Crea Profilo Karma' : 'Crea Account'}
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-jnana-text/50 dark:text-gray-500">
          © 2024 {isKarma ? 'KARMA' : 'JNANA'} People Analytics
        </p>
      </div>
    </div>
  );
};
