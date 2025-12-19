import React, { useState } from 'react';
import { UserPlus, ArrowRight, Eye } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CompanyProfile, User, ViewState } from '../../types';
import { calculateCultureAnalysis } from '../../services/riasecService';

interface AdminDashboardProps {
  activeCompany: CompanyProfile;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  setView: (view: ViewState) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardProps> = ({ activeCompany, users, onUpdateUsers, setView }) => {
    const companyUsers = users.filter(u => u.companyId === activeCompany.id);
    const completedCount = companyUsers.filter(u => u.status === 'completed').length;

    // --- INVITE MODAL ---
    const [showInvite, setShowInvite] = useState(false);
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('');

    const handleInviteUser = () => {
        if (!inviteName || !inviteEmail) return;
        const newUser: User = {
            id: `u_${Date.now()}`,
            firstName: inviteName.split(' ')[0],
            lastName: inviteName.split(' ')[1] || '',
            email: inviteEmail,
            companyId: activeCompany.id,
            status: 'invited',
            jobTitle: inviteRole
        };
        const updatedUsers = [...users, newUser];
        onUpdateUsers(updatedUsers);
        setShowInvite(false);
        setInviteName('');
        setInviteEmail('');
        setInviteRole('');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 relative">

            {showInvite && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md animate-scale-in">
                        <h3 className="text-lg font-bold mb-4">Invita Nuovo Utente</h3>
                        <div className="space-y-3">
                            <input
                                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Nome e Cognome"
                                value={inviteName}
                                onChange={e => setInviteName(e.target.value)}
                            />
                            <input
                                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Email Aziendale"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                            />
                            <input
                                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Ruolo (Opzionale)"
                                value={inviteRole}
                                onChange={e => setInviteRole(e.target.value)}
                            />
                            <div className="flex gap-2 pt-2">
                                <Button fullWidth onClick={handleInviteUser}>Invia Invito</Button>
                                <Button variant="ghost" onClick={() => setShowInvite(false)}>Annulla</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                 <div>
                    <h1 className="text-3xl font-brand font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard {activeCompany.name}</h1>
                    <p className="text-gray-600">Panoramica dello stato del capitale umano.</p>
                 </div>
                 <Button onClick={() => setShowInvite(true)}><UserPlus size={18} className="mr-2"/> Invita Utenti</Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Totale Dipendenti</span>
                    <span className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{companyUsers.length}</span>
                </Card>
                <Card className="flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Test Completati</span>
                    <span className="text-3xl font-bold text-jnana-sage mt-2">{completedCount}</span>
                </Card>
                <Card className="flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">In Attesa</span>
                    <span className="text-3xl font-bold text-amber-500 mt-2">{companyUsers.length - completedCount}</span>
                </Card>
                <Card className="flex flex-col justify-between bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-0 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setView({ type: 'ADMIN_IDENTITY_HUB' })}>
                    <div className="flex justify-between items-start">
                        <span className="text-purple-100 text-xs font-bold uppercase tracking-wider">Culture Match</span>
                        <ArrowRight size={16} className="text-white"/>
                    </div>
                    <span className="text-3xl font-bold mt-2">{calculateCultureAnalysis(activeCompany, users).matchScore}%</span>
                </Card>
            </div>

            {/* User Table */}
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Elenco Dipendenti / Candidati</h3>
                    <div className="flex gap-2">
                         <input placeholder="Cerca..." className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-jnana-sage dark:text-white" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Utente</th>
                                <th className="px-4 py-3">Ruolo</th>
                                <th className="px-4 py-3">Stato</th>
                                <th className="px-4 py-3">Profilo</th>
                                <th className="px-4 py-3 text-right rounded-r-lg">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {companyUsers.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                {u.firstName[0]}{u.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 dark:text-gray-200">{u.firstName} {u.lastName}</div>
                                                <div className="text-xs text-gray-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.jobTitle || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                            u.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                            u.status === 'invited' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold text-gray-600 dark:text-gray-300">{u.profileCode || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => setView({ type: 'USER_RESULT', userId: u.id })} // Admin views user result
                                            disabled={u.status !== 'completed'} // Keep this check or remove to allow seeing climate data only
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-jnana-sage disabled:opacity-20"
                                            title="Vedi Profilo"
                                        >
                                            <Eye size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};