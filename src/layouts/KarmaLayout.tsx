import React from 'react';
import { Outlet } from 'react-router-dom';

export const KarmaLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
      <main className="animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};
