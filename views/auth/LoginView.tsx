import React, { useState } from 'react';
import { Hexagon, ArrowRight, Shield, Building, UserCheck, Sparkles, LayoutDashboard } from 'lucide-react';
import { User } from '../../types';
import { Card } from '../../components/Card';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
  onAdminLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin, onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Find specific personas for the demo buttons
  // 1. CEO / Admin of Acme
  const demoAdmin = users.find(u => u.email === 'alessandro.visconti@acme.com');
  // 2. Completed User (Good profile)
  const demoEmployee = users.find(u => u.email === 'giulia.bianchi@acme.com');
  // 3. Pending User (Needs to take test)
  const demoNewHire = users.find(u => u.status === 'pending');

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    
    if (user) {
      onLogin(user);
    } else if (email.toLowerCase().includes('admin')) {
      // Fallback for custom admin email logic if needed, or redirect to super admin
      onAdminLogin();
    } else {
      setError('Utente non trovato. Prova uno dei profili demo qui sotto.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0F172A] p-6 font-sans transition-colors duration-300">
        
        {/* BRANDING */}
        <div className="mb-10 text-center animate-fade-in-up">
            <Hexagon size={64} className="text-jnana-sage dark:text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="text-5xl font-brand font-bold text-jnana-text dark:text-white mb-2 tracking-tight">jnana</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-light tracking-wide">Human Capital Intelligence Platform</p>
        </div>
        
        <div className="w-full max-w-2xl animate-scale-in space-y-8">
            
            {/* EMAIL LOGIN SECTION */}
            <Card className="p-8 shadow-xl border-0">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Accesso Utente
                    </label>
                    <div className="flex gap-3">
                        <input 
                            type="email" 
                            className="flex-1 p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-jnana-sage outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            placeholder="nome.cognome@azienda.com"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        />
                        <button 
                            type="submit"
                            className="bg-jnana-sage hover:bg-jnana-sageDark text-white px-6 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-jnana-sage/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!email}
                        >
                            Entra <ArrowRight size={20} />
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}
                </form>
            </Card>

            {/* DIVIDER */}
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold tracking-widest">Oppure seleziona un profilo demo</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* DEMO BUTTONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. SUPER ADMIN */}
                <button 
                    onClick={onAdminLogin}
                    className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all group text-left relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Shield size={64} />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-amber-600 transition-colors">Super Admin</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Gestione Multi-Tenant, Configurazione Globale</p>
                    </div>
                </button>

                {/* 2. CEO / HR ADMIN */}
                {demoAdmin && (
                    <button 
                        onClick={() => onLogin(demoAdmin)}
                        className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all group text-left relative overflow-hidden"
                    >
                         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Building size={64} />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Building size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-purple-600 transition-colors">CEO / HR Manager</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dashboard, Organigramma, Identity Hub</p>
                        </div>
                    </button>
                )}

                {/* 3. COMPLETED EMPLOYEE */}
                {demoEmployee && (
                    <button 
                        onClick={() => onLogin(demoEmployee)}
                        className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 hover:border-jnana-sage transition-all group text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <UserCheck size={64} />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-jnana-sage/20 text-jnana-sage flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-jnana-sage transition-colors">Dipendente (Senior)</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Visualizza Risultati, Radar, Feedback AI</p>
                        </div>
                    </button>
                )}

                {/* 4. NEW HIRE (PENDING) */}
                {demoNewHire && (
                    <button 
                        onClick={() => onLogin(demoNewHire)}
                        className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all group text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles size={64} />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors">Nuovo Assunto</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Simulazione Test RIASEC e Colloquio</p>
                        </div>
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};