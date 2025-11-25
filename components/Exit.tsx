import React from 'react';
import { AppState } from '../types';
import { Button } from './Button';
import { Undo2 } from 'lucide-react';

interface ExitProps {
  setAppState: (state: AppState) => void;
}

export const Exit: React.FC<ExitProps> = ({ setAppState }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
         <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
       </div>

      <div className="text-center space-y-6 z-10 p-6">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
          Aproveite seu dia!
        </h1>
        <p className="text-xl text-slate-400 max-w-md mx-auto">
          Esperamos que seu aniversário de 58 anos seja inesquecível, Marco.
        </p>

        <div className="pt-8">
          <Button 
            variant="secondary" 
            onClick={() => setAppState(AppState.MENU)}
            icon={<Undo2 className="w-4 h-4" />}
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
};