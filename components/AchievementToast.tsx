
import React, { useEffect, useState } from 'react';
import { Achievement } from '../types';
import { audioService } from '../services/audioService';

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[2000] transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
      <div className="bg-slate-900 border-2 border-teal-500/50 rounded-[2.5rem] p-6 shadow-[0_0_50px_rgba(20,184,166,0.3)] flex items-center space-x-6 min-w-[320px] backdrop-blur-xl">
        <div className="relative">
          <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg shadow-teal-500/20 animate-bounce">
            <i className={`fas ${achievement.icon}`}></i>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-slate-900 font-black border-2 border-slate-900 animate-pulse">
            XP
          </div>
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em] mb-1">Matrix Synchronization Complete</p>
          <h4 className="text-white font-black text-xl tracking-tight leading-none mb-2">{achievement.title}</h4>
          <p className="text-slate-400 text-xs font-serif italic">"{achievement.description}"</p>
        </div>
      </div>
    </div>
  );
};
