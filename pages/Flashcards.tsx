
import React, { useState, useEffect } from 'react';
import { AppView, Flashcard, Topic, QuizMode } from '../types';
import { generateFlashcards } from '../services/geminiService';
import { audioService } from '../services/audioService';

interface FlashcardsPageProps {
  topic: Topic;
  onNavigate: (view: AppView, topic?: Topic, mode?: QuizMode) => void;
}

export const FlashcardsPage: React.FC<FlashcardsPageProps> = ({ topic, onNavigate }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [masteredIndices, setMasteredIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      const data = await generateFlashcards(topic);
      setCards(data);
      setLoading(false);
    };
    loadCards();
  }, [topic]);

  const handleNext = () => {
    audioService.playClick();
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 200);
  };

  const handlePrev = () => {
    audioService.playClick();
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 200);
  };

  const toggleMastery = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(masteredIndices);
    if (next.has(currentIndex)) {
        next.delete(currentIndex);
    } else {
        next.add(currentIndex);
        audioService.playSuccess();
    }
    setMasteredIndices(next);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950">
        <div className="relative mb-12">
            <div className="w-24 h-24 border-4 border-slate-900 border-t-medical-500 rounded-full animate-spin"></div>
            <i className="fas fa-layer-group absolute inset-0 flex items-center justify-center text-2xl text-medical-500/50"></i>
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-[0.3em] mb-2">Neural Strengthening</h2>
        <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Generating high-yield cards for {topic}...</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isMastered = masteredIndices.has(currentIndex);

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative bg-slate-950 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-medical-500/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 blur-[120px] rounded-full"></div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 w-full px-8 flex justify-between items-center z-10">
        <button onClick={() => { audioService.playClick(); onNavigate(AppView.TOPIC, topic); }} className="px-6 py-2.5 bg-white/5 text-slate-400 hover:text-white border border-white/10 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
            <i className="fas fa-arrow-left mr-3"></i> Exit Loop
        </button>
        <div className="text-center">
            <p className="text-[10px] font-black text-medical-500 uppercase tracking-[0.3em] mb-1">Knowledge Strengthening</p>
            <h2 className="font-display font-black text-2xl text-white tracking-tight">{topic}</h2>
        </div>
        <div className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl flex items-center space-x-3">
             <i className="fas fa-brain text-teal-400 text-xs"></i>
             <span className="text-white font-black text-[10px] tracking-widest">{masteredIndices.size} / {cards.length} SYNCED</span>
        </div>
      </div>

      {/* Card Container */}
      <div className="perspective-1000 w-full max-w-2xl h-[400px] cursor-pointer group z-10" onClick={() => { audioService.playClick(); setIsFlipped(!isFlipped); }}>
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front */}
            <div className={`absolute w-full h-full bg-slate-900 border-2 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-12 backface-hidden transition-all duration-500 ${isMastered ? 'border-teal-500 shadow-teal-500/10' : 'border-slate-800'}`}>
                <div className="absolute top-10 left-10 flex items-center space-x-3">
                    <div className="w-2 h-2 bg-medical-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Question</span>
                </div>
                
                <h3 className="text-3xl font-black text-white text-center leading-tight tracking-tight">{currentCard.front}</h3>
                
                <div className="absolute bottom-10 flex items-center space-x-8">
                     <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] animate-bounce">
                        <i className="fas fa-hand-pointer mr-3"></i> Toggle Logic
                     </div>
                </div>
            </div>

            {/* Back */}
            <div className={`absolute w-full h-full bg-slate-900 border-2 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-12 rotate-y-180 backface-hidden transition-all duration-500 ${isMastered ? 'border-teal-500' : 'border-medical-500/50'}`}>
                <div className="absolute top-10 left-10 flex items-center space-x-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Neural Answer</span>
                </div>
                <p className="text-2xl font-medium text-slate-200 text-center leading-relaxed font-serif italic italic-medium">{currentCard.back}</p>
                
                <button 
                  onClick={toggleMastery}
                  className={`absolute bottom-10 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all
                    ${isMastered ? 'bg-teal-500 text-white shadow-xl shadow-teal-500/20' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-teal-500 hover:text-teal-400'}`}
                >
                    {isMastered ? <><i className="fas fa-check-circle mr-2"></i> Synced to Core</> : 'Mark as Synced'}
                </button>
            </div>

        </div>
      </div>

      {/* Controls */}
      <div className="mt-16 flex items-center space-x-12 z-10">
        <button onClick={handlePrev} className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white flex items-center justify-center text-xl transition-all active:scale-90">
            <i className="fas fa-arrow-left"></i>
        </button>
        <div className="bg-black/40 px-8 py-3 rounded-full border border-white/5">
            <span className="text-white font-black text-sm tracking-[0.3em] font-mono">
                {String(currentIndex + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
            </span>
        </div>
        <button onClick={handleNext} className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white flex items-center justify-center text-xl transition-all active:scale-90">
            <i className="fas fa-arrow-right"></i>
        </button>
      </div>

    </div>
  );
};
