import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/Button';
import { User } from '../../types';

interface UserWelcomeViewProps {
  user: User;
  onStart: () => void;
}

export const UserWelcomeView: React.FC<UserWelcomeViewProps> = ({ user, onStart }) => (
  <div className="max-w-2xl mx-auto text-center p-8 mt-12">
      <h1 className="text-4xl font-brand font-bold mb-6">Benvenuto in Jnana</h1>
      <p className="text-gray-500 text-lg mb-8 leading-relaxed">
         Stai per iniziare un percorso di scoperta delle tue attitudini professionali.
         Il test RIASEC ti aiuterà a capire meglio i tuoi punti di forza e le tue inclinazioni naturali.
      </p>
      <Button size="lg" onClick={onStart}>
          Inizia il Test <ArrowRight className="ml-2"/>
      </Button>
  </div>
);