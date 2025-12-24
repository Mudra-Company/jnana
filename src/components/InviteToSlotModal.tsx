import React, { useState } from 'react';
import { X, UserPlus, Target, Mail, User as UserIcon } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { RequiredProfile, SeniorityLevel } from '../../types';

interface InviteToSlotModalProps {
  jobTitle: string;
  requiredProfile?: RequiredProfile;
  onInvite: (data: { firstName: string; lastName: string; email: string }) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const InviteToSlotModal: React.FC<InviteToSlotModalProps> = ({
  jobTitle,
  requiredProfile,
  onInvite,
  onClose,
  isLoading = false
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'Il nome è obbligatorio';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Il cognome è obbligatorio';
    }
    
    if (!email.trim()) {
      newErrors.email = "L'email è obbligatoria";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Inserisci un indirizzo email valido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onInvite({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[130] flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold dark:text-gray-100 flex items-center gap-2">
            <UserPlus size={20} className="text-primary" /> Invita Persona
          </h3>
          <button onClick={onClose} disabled={isLoading}>
            <X className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        {/* Job Title Banner */}
        <div className="p-3 bg-primary/10 rounded-xl mb-4 border border-primary/20">
          <div className="text-xs font-bold uppercase text-primary/70 mb-1">Ruolo</div>
          <div className="text-lg font-bold text-primary">{jobTitle}</div>
        </div>

        <div className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.firstName ? 'border-red-500' : ''}`}
                  placeholder="Mario"
                  value={firstName}
                  onChange={e => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                  }}
                  disabled={isLoading}
                />
              </div>
              {errors.firstName && <span className="text-xs text-red-500 mt-1">{errors.firstName}</span>}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Cognome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="Rossi"
                value={lastName}
                onChange={e => {
                  setLastName(e.target.value);
                  if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                }}
                disabled={isLoading}
              />
              {errors.lastName && <span className="text-xs text-red-500 mt-1">{errors.lastName}</span>}
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                className={`w-full pl-10 pr-3 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.email ? 'border-red-500' : ''}`}
                placeholder="mario.rossi@company.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                disabled={isLoading}
              />
            </div>
            {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
          </div>

          {/* Required Profile Preview (Read-only) */}
          {requiredProfile && (requiredProfile.hardSkills?.length || requiredProfile.softSkills?.length || requiredProfile.seniority) && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-1">
                <Target size={12} /> Requisiti per questo ruolo
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2 text-sm">
                {requiredProfile.seniority && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Seniority:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{requiredProfile.seniority}</span>
                  </div>
                )}
                {requiredProfile.hardSkills && requiredProfile.hardSkills.length > 0 && (
                  <div>
                    <span className="text-gray-500">Hard Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {requiredProfile.hardSkills.map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {requiredProfile.softSkills && requiredProfile.softSkills.length > 0 && (
                  <div>
                    <span className="text-gray-500">Soft Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {requiredProfile.softSkills.map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button fullWidth onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Invio in corso...' : 'Invia Invito'}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Annulla
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
