import React, { useState } from 'react';
import { seedAdminUser } from '../../utils/seedAdmin';

const SeedDataView: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Seed Database</h1>
          <p className="text-muted-foreground mb-6">
            Click the button below to create the admin user and seed the database.
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
              <div className={`p-4 rounded-lg ${status.includes('✅') ? 'bg-green-100 text-green-800' : status.includes('❌') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeedDataView;
