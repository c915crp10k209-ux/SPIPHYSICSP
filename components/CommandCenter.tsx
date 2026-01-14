
import React, { useState, useEffect, useMemo } from 'react';
// Added QuizMode to types import to resolve compilation error
import { AppView, Topic, QuizMode } from '../types';
import { TOPICS } from '../constants';
import { getVault, getCommandDraft, saveCommandDraft } from '../services/persistenceService';
import { audioService } from '../services/audioService';

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  // Updated onNavigate type signature to include the optional QuizMode parameter
  onNavigate: (view: AppView, topic?: Topic, mode?: QuizMode) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ isOpen, onClose, onNavigate }) => {
  const [search, setSearch] = useState(getCommandDraft());
  const vaultItems = getVault();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : undefined; 
      }
      if (e.key === 'Escape') onClose();
    };

    const handleExternalOpen = (e: any) => {
        if (e.detail) {
            setSearch(e.detail);
            saveCommandDraft(e.detail);
        }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('open-command-center', handleExternalOpen);
    return () => {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('open-command-center', handleExternalOpen);
    };
  }, [isOpen, onClose]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    saveCommandDraft(val);
  };

  const results = useMemo(() => {
    if (!search.trim()) return [];
    
    const s = search.toLowerCase();
    const matches: any[] = [];

    // Modules
    Object.values(TOPICS).forEach(t => {
      if (t.id.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)) {
        matches.push({ type: 'MODULE', title: t.id, desc: t.description, id: t.id, icon: t.icon });
      }
    });

    // Vault
    vaultItems.forEach(v => {
      if (v.title.toLowerCase().includes(s) || v.content.toLowerCase().includes(s)) {
        matches.push({ type: 'VAULT', title: v.title, desc: v.content.substring(0, 60) + '...', id: v.id, icon: 'fa-bookmark' });
      }
    });

    return matches.slice(0, 8);
  }, [search, vaultItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-32 px-4 md:px-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-top-8 duration-500">
        <div className="p-8 border-b border-white/5 bg-black/20 flex items-center space-x-6">
          <i className="fas fa-search text-medical-500 text-xl"></i>
          <input 
            autoFocus
            type="text" 
            placeholder="Command Harvey: Search modules, records, or terms..."
            className="flex-1 bg-transparent border-none text-white text-xl placeholder-slate-700 focus:outline-none font-bold"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">ESC</div>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-4">
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((res, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    audioService.playClick();
                    onNavigate(res.type === 'MODULE' ? AppView.TOPIC : AppView.VAULT, res.id);
                    onClose();
                  }}
                  className="w-full flex items-center p-5 rounded-2xl hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5"
                >
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-medical-500 mr-6 group-hover:bg-medical-500 group-hover:text-white transition-all">
                    <i className={`fas ${res.icon}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">{res.type}</span>
                       <h4 className="text-white font-bold uppercase text-xs tracking-tight">{res.title}</h4>
                    </div>
                    <p className="text-slate-500 text-[10px] font-medium truncate">{res.desc}</p>
                  </div>
                  <i className="fas fa-arrow-right text-[10px] text-slate-700 group-hover:text-medical-500 group-hover:translate-x-1 transition-all"></i>
                </button>
              ))}
            </div>
          ) : search.trim() ? (
            <div className="py-20 text-center">
              <i className="fas fa-ghost text-4xl text-slate-800 mb-6"></i>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Neural Pattern Not Found</p>
            </div>
          ) : (
            <div className="p-10 text-center">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => { audioService.playClick(); onNavigate(AppView.TOPIC, Topic.PHYSICS); onClose(); }}
                    className="p-6 bg-white/5 rounded-3xl border border-white/5 text-left hover:bg-fuchsia-500/10 transition-all group"
                  >
                     <i className="fas fa-microphone text-fuchsia-400 mb-3 group-hover:scale-110 transition-transform"></i>
                     <p className="text-slate-500 text-[9px] font-black uppercase mb-1">Voice Link</p>
                     <p className="text-white text-[11px] font-bold">Start a live voice conversation with Harvey.</p>
                  </button>
                  <button 
                    onClick={() => { audioService.playClick(); onNavigate(AppView.QUIZ, Topic.ALL, QuizMode.REGISTRY_SIM); onClose(); }}
                    className="p-6 bg-white/5 rounded-3xl border border-white/5 text-left hover:bg-orange-500/10 transition-all group"
                  >
                     <i className="fas fa-bolt text-orange-400 mb-3 group-hover:scale-110 transition-transform"></i>
                     <p className="text-slate-500 text-[9px] font-black uppercase mb-1">Quick Move</p>
                     <p className="text-white text-[11px] font-bold">Launch a full-scale registry mock exam.</p>
                  </button>
               </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
           <span>Searching through 45+ logic nodes</span>
           <span>SPIPHYSIC.COM Neural Link</span>
        </div>
      </div>
    </div>
  );
};
