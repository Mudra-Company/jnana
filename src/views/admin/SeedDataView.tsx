import React, { useState } from 'react';
import { seedAdminUser } from '../../utils/seedAdmin';
import { supabase } from '../../integrations/supabase/client';

const SeedDataView: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string>('');
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [rolesStatus, setRolesStatus] = useState<string>('');

  const handleSeed = async () => {
    setIsLoading(true);
    setStatus('Creating admin user...');
    
    try {
      const result = await seedAdminUser();
      if (result.success) {
        setStatus(`✅ Admin user created successfully! User ID: ${result.userId}`);
      } else {
        setStatus(`❌ Error: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDemoUsers = async () => {
    setIsDemoLoading(true);
    setDemoStatus('Creating 18 demo users with all data...');
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-demo-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        const successCount = data.results?.filter((r: any) => r.success).length || 0;
        const failCount = data.results?.filter((r: any) => !r.success).length || 0;
        setDemoStatus(`✅ ${data.message || `Created ${successCount} users, ${failCount} failed`}`);
      } else {
        setDemoStatus(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setDemoStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSeedRoles = async () => {
    setIsRolesLoading(true);
    setRolesStatus('Creating 18 roles with full mansionario data...');
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-company-roles`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        const successCount = data.results?.filter((r: any) => r.success !== false).length || 0;
        setRolesStatus(`✅ ${data.message || `Processed ${successCount} roles`}`);
      } else {
        setRolesStatus(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setRolesStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRolesLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Admin User Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">1. Create Admin User</h1>
          <p className="text-muted-foreground mb-6">
            Create the super admin user to access the admin dashboard.
          </p>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Admin User Details:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Email: giuseppe.ciniero@mudra.team</li>
                <li>Password: Mudra2025!</li>
                <li>Role: Super Admin</li>
                <li>Company: Dürr Dental Italia</li>
              </ul>
            </div>

            <button 
              onClick={handleSeed} 
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Admin User'}
            </button>

            {status && (
              <div className={`p-4 rounded-lg ${status.includes('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : status.includes('❌') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                {status}
              </div>
            )}
          </div>
        </div>

        {/* Demo Users Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">2. Seed Demo Users</h1>
          <p className="text-muted-foreground mb-6">
            Create 18 demo users for Dürr Dental Italia with complete data (profiles, RIASEC, Karma, Climate).
          </p>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Demo Users Include:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 18 employees across all departments</li>
                <li>• Complete RIASEC assessment results</li>
                <li>• Karma session data (soft skills, values, risks)</li>
                <li>• Climate survey responses</li>
                <li>• Company membership with department assignments</li>
              </ul>
            </div>

            <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                ⚠️ Run this AFTER creating the admin user. Demo users will have password: <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">DemoUser2024!</code>
              </p>
            </div>

            <button 
              onClick={handleSeedDemoUsers} 
              disabled={isDemoLoading}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50"
            >
              {isDemoLoading ? 'Creating demo users...' : 'Seed Demo Users (18)'}
            </button>

            {demoStatus && (
              <div className={`p-4 rounded-lg ${demoStatus.includes('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : demoStatus.includes('❌') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                {demoStatus}
              </div>
            )}
          </div>
        </div>
        {/* Company Roles Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">3. Seed Company Roles (18)</h1>
          <p className="text-muted-foreground mb-6">
            Create all 18 company roles with full mansionario data (responsibilities, KPIs, skills) from the PDF and assign each to the correct person.
          </p>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Roles Include:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• CEO, Head of Sales (update), Resp. Service, Resp. Logistica, Resp. Amm.</li>
                <li>• Area Manager, Sales Specialist, 2x Marketing Specialist</li>
                <li>• Commerciale Interno, 4x Tecnico Service, Product Specialist</li>
                <li>• Tecnico Service & Repair, Magazziniere, Segreteria e Amm.</li>
                <li>• Full mansionario: responsabilità, KPI, hard/soft skills, lingue, formazione</li>
              </ul>
            </div>

            <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                ⚠️ Run this AFTER seeding demo users. This is idempotent: re-running will clean up and recreate all roles (except Head of Sales which is updated).
              </p>
            </div>

            <button 
              onClick={handleSeedRoles} 
              disabled={isRolesLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isRolesLoading ? 'Creating roles...' : 'Seed Company Roles (18)'}
            </button>

            {rolesStatus && (
              <div className={`p-4 rounded-lg ${rolesStatus.includes('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : rolesStatus.includes('❌') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                {rolesStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeedDataView;
