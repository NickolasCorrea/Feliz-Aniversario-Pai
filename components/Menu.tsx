import React, { useEffect, useState } from 'react';
import { Play, LogOut, Image as ImageIcon, Trophy, Star, Crown, Gamepad2, Car, Settings, Wrench, Zap, LockOpen } from 'lucide-react';
import { Button } from './Button';
import { AppState } from '../types';
import { generatePhotos, PhotoItem } from './Gallery';

interface MenuProps {
  setAppState: (state: AppState) => void;
}

export const Menu: React.FC<MenuProps> = ({ setAppState }) => {
  const [unlockedPhotos, setUnlockedPhotos] = useState<PhotoItem[]>([]);
  const [isCheatUsed, setIsCheatUsed] = useState(false);

  useEffect(() => {
    const savedLevelStr = localStorage.getItem('unlockedLevel');
    const savedLevel = savedLevelStr ? parseInt(savedLevelStr, 10) : 1;
    
    const allPhotos = generatePhotos();
    // Show photos from levels strictly less than the current unlocked level (or all if completed)
    const available = allPhotos.filter(p => p.level < savedLevel);
    
    // If no photos unlocked yet (Level 1), take a few random ones just for preview with very low opacity
    if (available.length === 0) {
       setUnlockedPhotos(allPhotos.slice(0, 12)); 
    } else {
       setUnlockedPhotos(available);
    }
  }, [isCheatUsed]);

  const unlockAll = () => {
    localStorage.setItem('unlockedLevel', '4'); // 4 means all 3 levels done
    setIsCheatUsed(true);
    alert("Cheat Ativado! Todos os níveis e fotos desbloqueados.");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
      
      {/* Cheat Button (Top Right) */}
      <button 
        onClick={unlockAll}
        className="absolute top-4 right-4 z-50 p-2 bg-slate-800/50 text-slate-600 hover:text-amber-400 hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-amber-500/30"
        title="Desbloquear Tudo"
      >
        <LockOpen size={20} />
      </button>

      {/* Dynamic Photo Background (Moving Grid) */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
         <div className="grid grid-cols-3 md:grid-cols-6 gap-4 transform -rotate-12 scale-150 animate-[float_20s_linear_infinite]">
            {unlockedPhotos.slice(0, 24).map((photo, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-800 shadow-2xl">
                 <img src={photo.url} alt="" className="w-full h-full object-cover grayscale mix-blend-luminosity opacity-70" />
              </div>
            ))}
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/60" />
         <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950" />
      </div>

      {/* Impressive Moving Symbols Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Rotating Gear (Engineering) */}
        <div className="absolute top-[-10%] right-[-10%] text-slate-800/50 animate-[spin_20s_linear_infinite]">
           <Settings size={400} strokeWidth={0.5} />
        </div>
        
        {/* Floating Car */}
        <div className="absolute bottom-[10%] left-[-5%] text-blue-900/20 animate-[float_8s_ease-in-out_infinite]">
           <Car size={300} strokeWidth={0.5} />
        </div>

        {/* Floating Game Controller */}
        <div className="absolute top-[20%] left-[5%] text-amber-900/20 animate-[float_6s_ease-in-out_infinite_reverse]">
           <Gamepad2 size={150} strokeWidth={1} className="rotate-12" />
        </div>

        {/* Tools */}
        <div className="absolute bottom-[20%] right-[10%] text-slate-700/30 animate-bounce-slow">
           <Wrench size={120} strokeWidth={1} className="-rotate-45" />
        </div>

        {/* Shiny Particles */}
        <div className="absolute top-1/4 right-1/3 text-amber-400/20 animate-pulse">
           <Zap size={60} />
        </div>
        <div className="absolute top-2/3 left-1/4 text-amber-400/20 animate-pulse delay-700">
           <Star size={40} />
        </div>
      </div>

      <div className="z-10 flex flex-col items-center w-full max-w-4xl px-6 animate-fade-in-up">
        
        {/* Badge LEVEL 58 */}
        <div className="relative mb-10 group cursor-default transform hover:scale-110 transition-transform duration-500">
          <div className="absolute -inset-8 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-full opacity-40 blur-3xl animate-pulse"></div>
          <div className="relative flex items-center justify-center w-48 h-48 md:w-56 md:h-56 bg-slate-900 border-4 border-amber-500 rounded-full shadow-[0_0_50px_rgba(245,158,11,0.3)] ring-4 ring-amber-900/50">
            <div className="text-center">
              <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-[0.3em] mb-2">Level</p>
              <span className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 drop-shadow-sm font-display">
                58
              </span>
            </div>
            <div className="absolute -top-8 animate-bounce-slow">
              <Crown className="w-16 h-16 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Player Info */}
        <div className="text-center mb-12 space-y-4 relative">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-800/80 border border-amber-500/30 text-amber-400 text-sm font-mono mb-2 shadow-lg backdrop-blur-md">
            <Trophy size={16} /> <span className="font-bold tracking-wider">PLAYER 1: SUPER PAI</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight drop-shadow-2xl">
            MARCO CORRÊA
          </h1>
          <div className="flex items-center justify-center gap-6 text-slate-400 text-lg font-light">
             <span className="text-3xl text-amber-400 font-display italic drop-shadow-md animate-pulse">Feliz aniversário, pai!</span>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl relative">
           {/* Decorative borders for the menu area */}
           <div className="absolute -inset-4 border border-white/5 rounded-3xl backdrop-blur-[2px] -z-10"></div>

          <div className="md:col-span-3">
            <Button 
              variant="primary" 
              onClick={() => setAppState(AppState.GAME)}
              icon={<Play className="w-8 h-8 fill-current" />}
              className="w-full py-8 text-3xl shadow-[0_0_30px_rgba(245,158,11,0.4)] border-t border-white/20 tracking-widest uppercase font-black hover:tracking-[0.2em] transition-all"
            >
              INICIAR MISSÃO
            </Button>
          </div>

          <div className="md:col-span-2">
            <Button 
              variant="secondary" 
              onClick={() => setAppState(AppState.PHOTOS)}
              icon={<ImageIcon className="w-5 h-5" />}
              className="w-full h-full bg-slate-800/80 hover:bg-slate-700 backdrop-blur border-slate-700"
            >
              Galeria de Conquistas
            </Button>
          </div>
          
          <div className="md:col-span-1">
            <Button 
              variant="danger" 
              onClick={() => setAppState(AppState.EXIT)}
              icon={<LogOut className="w-5 h-5" />}
              className="w-full h-full backdrop-blur opacity-80 hover:opacity-100"
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-6 w-full text-center text-slate-500 text-xs font-mono flex justify-center uppercase tracking-widest opacity-60">
         <span>Feito por Nickolas Corrêa (seu filho) - 2025</span>
      </footer>
    </div>
  );
};