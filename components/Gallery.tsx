import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, ZoomIn, Image as ImageIcon, Lock } from 'lucide-react';
import { Button } from './Button';
import { AppState } from '../types';

interface GalleryProps {
  setAppState: (state: AppState) => void;
}

export interface PhotoItem {
  id: number;
  level: number;
  url: string;
  fullUrl: string;
  caption: string;
}

// Helper to generate placeholder photos for 3 levels (15 photos each)
export const generatePhotos = (): PhotoItem[] => {
  const photos = [];
  const themes = [
    "A Jornada Começa (Infância & Juventude)", 
    "Construindo a Vida (Família & Carreira)", 
    "O Legado de Sucesso (58 Anos de Glória)"
  ];
  
  // Unsplash IDs for variety
  const imageIds = [
    "1490578474895-699cd4e2cf59", "1513151233558-d860c5398176", "1511895426328-dc8714191300", "1529156069898-49953e39b3ac",
    "1534528741775-53994a69daeb", "1506869600155-024eec1bcbd7", "1520032554633-be0852b98699", "1472653431158-6364773b2a56",
    "1516382799247-87df95d790b7", "1523580494863-6f3031224c94", "1501901609772-df0848060b33"
  ];

  let idCounter = 1;
  // Only 3 Levels now
  for (let level = 1; level <= 3; level++) {
    // 15 photos per level
    for (let i = 0; i < 15; i++) {
      const imgId = imageIds[(level + i) % imageIds.length];
      photos.push({
        id: idCounter++,
        level: level,
        url: `https://images.unsplash.com/photo-${imgId}?q=80&w=600&auto=format&fit=crop`,
        fullUrl: `https://images.unsplash.com/photo-${imgId}?q=80&w=1200&auto=format&fit=crop`,
        caption: `${themes[level-1]} - Memória ${i + 1}`
      });
    }
  }
  return photos;
};

const PHOTOS_LIST = generatePhotos();

export const Gallery: React.FC<GalleryProps> = ({ setAppState }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState(1);

  useEffect(() => {
    const savedLevel = localStorage.getItem('unlockedLevel');
    if (savedLevel) {
      setUnlockedLevel(parseInt(savedLevel, 10));
    }
  }, []);

  // Group photos by level (Only 3 levels)
  const photosByLevel = [1, 2, 3].map(level => ({
    level,
    title: `Nível ${level}`,
    photos: PHOTOS_LIST.filter(p => p.level === level),
    // Logic Changed: Photos are locked if current level is <= the photo level.
    // Example: Start at Level 1. Level 1 photos locked (1 >= 1).
    // Beat Level 1 -> Level becomes 2. Level 1 photos unlocked (1 < 2). Level 2 locked (2 >= 2).
    isLocked: level >= unlockedLevel 
  }));

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h2 className="text-3xl font-display font-bold text-white">Galeria de Memórias</h2>
            <p className="text-slate-400">Desbloqueie 15 fotos por nível completado.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 px-4 py-2 rounded-lg text-sm text-amber-400 font-mono border border-slate-700">
              Nível Atual: {unlockedLevel > 3 ? 3 : unlockedLevel}
            </div>
            <Button 
              variant="secondary" 
              onClick={() => setAppState(AppState.MENU)}
              icon={<ArrowLeft className="w-4 h-4" />}
              className="shrink-0"
            >
              Voltar
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12 pb-12">
          {photosByLevel.map((section) => (
            <div key={section.level} className="space-y-4">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
                <h3 className={`text-2xl font-bold ${section.isLocked ? 'text-slate-600' : 'text-white'}`}>
                  {section.title}
                </h3>
                {section.isLocked && <Lock className="text-slate-600 w-5 h-5" />}
              </div>

              {section.isLocked ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-800/50 bg-slate-900/50 h-64 flex flex-col items-center justify-center text-center p-8 group">
                   <div className="absolute inset-0 backdrop-blur-xl bg-slate-900/50 z-10" />
                   {/* Blurred preview of first 3 photos */}
                   <div className="absolute inset-0 flex gap-2 opacity-20">
                      {section.photos.slice(0,3).map(p => (
                        <img key={p.id} src={p.url} className="h-full w-1/3 object-cover" alt="" />
                      ))}
                   </div>
                   
                   <div className="relative z-20 flex flex-col items-center">
                     <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl">
                       <Lock className="w-8 h-8 text-slate-500" />
                     </div>
                     <h4 className="text-xl font-bold text-slate-300 mb-2">Coleção Bloqueada</h4>
                     <p className="text-slate-500 max-w-md">
                       Derrote o Chefe do Nível {section.level} para revelar 15 fotos exclusivas.
                     </p>
                     <Button 
                       variant="primary" 
                       className="mt-6 !py-2 !px-6 !text-sm"
                       onClick={() => setAppState(AppState.GAME)}
                     >
                       Iniciar Missão
                     </Button>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {section.photos.map((photo) => (
                    <div 
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-amber-500/10 bg-slate-900"
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.caption}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center relative">
            <img 
              src={selectedPhoto.fullUrl} 
              alt={selectedPhoto.caption}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-slate-800"
            />
            <div className="mt-6 text-center">
               <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono mb-2 border border-amber-500/20">
                 Nível {selectedPhoto.level}
               </span>
               <p className="text-xl text-slate-200 font-display font-light tracking-wide">
                {selectedPhoto.caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};