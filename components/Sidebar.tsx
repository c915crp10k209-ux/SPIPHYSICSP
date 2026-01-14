
import React, { useState, useEffect } from 'react';
import { AppView, Topic, UserProgress, QuizMode, GamificationState } from '../types';
import { TOPICS, CURRICULUM_ORDER } from '../constants';
import { audioService } from '../services/audioService';
import { getGameState, syncAllDataWithCloud } from '../services/persistenceService';
import { HarveyAvatar } from './HarveyAvatar';
import { checkCloudStatus } from '../services/supabaseClient';

interface SidebarProps {
  currentView: AppView;
  currentTopic: Topic | null;
  onNavigate: (view: AppView, topic?: Topic, mode?: QuizMode) => void;
  userProgress?: UserProgress;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, currentTopic, onNavigate, userProgress = {} }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [game, setGame] = useState<GamificationState>(getGameState());
  const [cloudActive, setCloudActive] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);

  useEffect(() => {
    const updateGame = () => setGame(getGameState());
    window.addEventListener('storage', updateGame);
    
    const initCloud = async () => {
      const active = await checkCloudStatus();
      setCloudActive(active);
      if (active) await syncAllDataWithCloud();
    };
    initCloud();

    return () => window.removeEventListener('storage', updateGame);
  }, []);

  const handleNav = (view: AppView, topic?: Topic, mode?: QuizMode) => {
    audioService.playClick();
    setShowNavMenu(false);
    onNavigate(view, topic, mode);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioService.setMute(next);
    if (!next) audioService.playClick();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-20 xl:w-24 bg-slate-950 border-r border-white/5 h-full relative z-[200] overflow-visible shrink-0">
        
        {/* Top Section: Harvey Navigator */}
        <div className="flex flex-col items-center py-10 border-b border-white/5 space-y-8 relative">
           <div 
              className="relative group cursor-pointer"
              onMouseEnter={() => setShowNavMenu(true)}
              onMouseLeave={() => setShowNavMenu(false)}
           >
              <div className="absolute inset-0 bg-medical-500/20 blur-xl rounded-full scale-150 animate-pulse-slow"></div>
              
              <div className="scale-75 hover:scale-90 transition-transform duration-500 z-10 relative">
                 <HarveyAvatar level={game.level} size="sm" activeSkin={game.activeSkin} isThinking={showNavMenu} />
              </div>

              {/* Bot Navigation Overlay Menu */}
              {showNavMenu && (
                <div className="absolute left-full ml-4 top-0 w-64 bg-slate-900/95 border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl p-6 animate-in slide-in-from-left-4 fade-in duration-300 z-[300]">
                   <h5 className="text-[10px] font-black text-medical-500 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-2">Neural Shortcuts</h5>
                   <div className="space-y-2">
                      <NavShortcut icon="fa-microphone" label="Voice Consultation" color="text-fuchsia-400" onClick={() => handleNav(AppView.TOPIC, Topic.PHYSICS)} />
                      <NavShortcut icon="fa-bolt" label="Initiate Mock Exam" color="text-orange-400" onClick={() => handleNav(AppView.QUIZ, Topic.ALL, QuizMode.REGISTRY_SIM)} />
                      <NavShortcut icon="fa-microchip" label="Neuro Deck" color="text-teal-400" onClick={() => handleNav(AppView.NEURO_DECK)} />
                      <NavShortcut icon="fa-tools" label="Neural Repair Unit" color="text-teal-400" onClick={() => handleNav(AppView.VAULT, Topic.PHYSICS)} />
                      <NavShortcut icon="fa-home" label="Return to Portal" color="text-white" onClick={() => handleNav(AppView.HOME)} />
                   </div>
                </div>
              )}
           </div>
           
           <div className="flex flex-col items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${cloudActive ? 'bg-teal-500 shadow-[0_0_10px_#14b8a6] animate-pulse' : 'bg-slate-800'}`}></div>
              <span className="text-[7px] font-black text-slate-700 uppercase tracking-tighter">{cloudActive ? 'SYNCED' : 'LOCAL'}</span>
           </div>
        </div>

        {/* Main Nav Cluster */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-10 flex flex-col items-center space-y-6">
           <NavIcon icon="fa-th-large" label="Portal" active={currentView === AppView.HOME} onClick={() => handleNav(AppView.HOME)} />
           <NavIcon icon="fa-brain" label="Sync" active={currentView === AppView.TOPIC} onClick={() => handleNav(AppView.TOPIC, currentTopic || Topic.PHYSICS)} />
           <NavIcon icon="fa-microphone" label="Live Voice" active={false} onClick={() => handleNav(AppView.TOPIC, currentTopic || Topic.PHYSICS)} />
           <NavIcon icon="fa-book-open" label="Lexicon" active={currentView === AppView.GLOSSARY} onClick={() => handleNav(AppView.GLOSSARY)} />
           <NavIcon icon="fa-vault" label="Archive" active={currentView === AppView.VAULT} onClick={() => handleNav(AppView.VAULT)} />
        </div>

        <div className="py-10 border-t border-white/5 flex flex-col items-center space-y-6">
           <NavIcon icon={isMuted ? "fa-volume-xmark" : "fa-volume-high"} label="Signal" active={false} onClick={toggleMute} />
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[500] bg-slate-950/95 border-t border-white/10 flex justify-around items-center backdrop-blur-3xl px-2 py-4 pb-safe shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
        <MobileNavButton icon="fa-home-alt" label="Home" active={currentView === AppView.HOME} onClick={() => handleNav(AppView.HOME)} />
        <MobileNavButton icon="fa-microphone" label="Voice" active={false} onClick={() => handleNav(AppView.TOPIC, currentTopic || Topic.PHYSICS)} />
        
        <div className="relative -mt-12 group">
          <div className="absolute inset-0 bg-medical-500/20 blur-xl rounded-full scale-125 animate-pulse"></div>
          <button 
            onClick={() => handleNav(AppView.NEURO_DECK)}
            className="w-16 h-16 bg-slate-900 border-4 border-medical-500 rounded-[2rem] flex items-center justify-center relative z-10 shadow-2xl active:scale-90 transition-all"
          >
            <HarveyAvatar level={game.level} size="sm" activeSkin={game.activeSkin} />
          </button>
        </div>

        <MobileNavButton icon="fa-archive" label="Vault" active={currentView === AppView.VAULT} onClick={() => handleNav(AppView.VAULT)} />
        <MobileNavButton icon="fa-dna" label="Sync" active={currentView === AppView.TOPIC} onClick={() => handleNav(AppView.TOPIC, currentTopic || Topic.PHYSICS)} />
      </nav>
    </>
  );
};

const NavShortcut: React.FC<{ icon: string; label: string; color: string; onClick: () => void }> = ({ icon, label, color, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center space-x-4 p-4 bg-white/5 rounded-2xl hover:bg-medical-500 transition-all group border border-transparent hover:border-white/20"
  >
    <div className={`w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center ${color} group-hover:text-white transition-colors shadow-lg`}>
      <i className={`fas ${icon} text-xs`}></i>
    </div>
    <span className="text-[10px] font-black uppercase text-slate-300 group-hover:text-white tracking-widest">{label}</span>
  </button>
);

const NavIcon: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
      ${active ? 'bg-medical-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)]' : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'}`}
  >
    <i className={`fas ${icon} text-lg`}></i>
  </button>
);

const MobileNavButton: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center gap-1.5 transition-all flex-1 py-1 ${active ? 'text-medical-400' : 'text-slate-600'}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${active ? 'bg-medical-500/10' : 'bg-transparent'}`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none">{label}</span>
  </button>
);
