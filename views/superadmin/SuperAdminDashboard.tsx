import React from 'react';
import { Building, Plus } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CompanyProfile, User } from '../../types';

interface SuperAdminDashboardProps {
  companies: CompanyProfile[];
  users: User[];
  onImpersonate: (companyId: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ companies, users, onImpersonate }) => (
  <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
          <h1 className="text-3xl font-brand font-bold text-gray-800 dark:text-white">Console Super Admin</h1>
          <p className="text-gray-500">Gestione multi-tenant e configurazione globale.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(company => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow border-t-4 border-t-amber-500">
                  <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          {company.logoUrl ? (
                              <img 
                                src={company.logoUrl} 
                                alt={company.name} 
                                className="w-full h-full object-contain p-1" 
                              />
                          ) : (
                              <Building className="text-gray-500" />
                          )}
                      </div>
                      <Button size="sm" onClick={() => onImpersonate(company.id)}>
                          Impersona Admin
                      </Button>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{company.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{company.industry} • {company.sizeRange} dip.</p>
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4">
                      <div>
                          <span className="block font-bold text-lg text-gray-800 dark:text-white">{users.filter(u => u.companyId === company.id).length}</span>
                          <span className="text-xs uppercase text-gray-400">Utenti</span>
                      </div>
                      <div>
                          <span className="block font-bold text-lg text-green-600">{users.filter(u => u.companyId === company.id && u.status === 'completed').length}</span>
                          <span className="text-xs uppercase text-gray-400">Completati</span>
                      </div>
                  </div>
              </Card>
          ))}
          <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600 bg-transparent flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[200px]" onClick={() => alert("Funzione crea azienda in arrivo")}>
              <Plus size={40} className="mb-2"/>
              <span className="font-bold">Aggiungi Tenant</span>
          </Card>
      </div>
  </div>
);