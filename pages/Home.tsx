
import React, { useEffect, useState } from 'react';
import { AppView, Topic, QuizMode, GamificationState, UserProgress, UserProfile } from '../types';
import { TOPICS, CURRICULUM_ORDER } from '../constants';
import { generateDailyInsight } from '../services/geminiService';
import { getGameState, getUserProfile, getDailyInsight, saveDailyInsight, getProgress } from '../services/persistenceService';
import { HarveyAvatar } from '../components/HarveyAvatar';
import { audioService } from '../services/audioService';

interface HomeProps {
  onNavigate: (view: AppView, topic?: Topic, mode?: QuizMode) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [progress, setProgress] = useState<UserProgress>(getProgress());
  const [game, setGame] = useState<GamificationState>(getGameState());
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [dailyInsight, setDailyInsightState] = useState<string>('');
  const [hoveredTopic, setHoveredTopic] = useState<Topic | null>(null);

  useEffect(() => {
    setProgress(getProgress());
    setGame(getGameState());
    setProfile(getUserProfile());
    loadDailyInsight();
  }, []);

  const loadDailyInsight = async () => {
    const cached = getDailyInsight();
    if (cached) {
      setDailyInsightState(cached.text);
    } else {
      try {
        const fresh = await generateDailyInsight();
        saveDailyInsight(fresh);
        setDailyInsightState(fresh);
      } catch (e) {
        setDailyInsightState("Neural link established. Protocol readiness is optimal.");
      }
    }
  };

  const avgMastery = Math.round((Object.values(progress).reduce((acc: number, p: any) => acc + (p.bestScore || 0), 0) as number) / 11) || 0;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 pb-40">
      <div className="max-w-[1600px] mx-auto p-6 md:p-14 lg:p-24 space-y-16 animate-in fade-in duration-1000">
        
        {/* Command Deck Header */}
        <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center justify-between">
           <div className="flex items-center gap-10 w-full lg:w-auto">
              <div className="relative group shrink-0 transform-gpu hover:scale-110 transition-transform duration-700">
                 <div className="absolute inset-0 bg-medical-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                 <HarveyAvatar level={game.level} size="md" activeSkin={game.activeSkin} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                   <span className="px-4 py-1.5 bg-medical-500/10 border border-medical-500/30 rounded-full text-[10px] font-black text-medical-400 uppercase tracking-[0.3em] animate-pulse">Protocol Online</span>
                   <span className="text-slate-600 font-mono text-[10px] tracking-widest uppercase">Node: {profile.name?.substring(0, 3).toUpperCase() || 'USR'}-CORE</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-display font-black text-white tracking-tighter uppercase leading-[0.8] italic">
                  Command <span className="text-medical-500 not-italic">Deck</span>
                </h1>
              </div>
           </div>

           <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              <StatPill icon="fa-bolt" label="Mission Streak" value={game.streak} color="text-orange-400" />
              <StatPill icon="fa-brain" label="Global Sync" value={`${avgMastery}%`} color="text-medical-400" />
              <StatPill icon="fa-coins" label="Neural Bits" value={game.bits} color="text-teal-400" />
           </div>
        </div>

        {/* Deployment Sector Map */}
        <div className="bg-slate-900/40 rounded-[4rem] p-10 md:p-20 border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none rotate-12">
                <i className="fas fa-satellite-dish text-[300px] text-white"></i>
            </div>
            
            <div className="mb-16 flex justify-between items-end">
                <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-3">Registry Deployment Map</h4>
                    <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Active Missions</h3>
                </div>
                {hoveredTopic && (
                   <div className="hidden lg:block text-right animate-in fade-in slide-in-from-right-4 duration-300">
                      <p className="text-[10px] font-black text-medical-500 uppercase tracking-widest mb-1">Target Sector</p>
                      <p className="text-xl font-bold text-white uppercase italic">{hoveredTopic}</p>
                   </div>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 relative z-10">
                {CURRICULUM_ORDER.map((topicId, idx) => {
                    const topic = TOPICS[topicId];
                    const stats = progress[topicId];
                    const mastery = stats?.bestScore || 0;
                    const isUnlocked = idx === 0 || (progress[CURRICULUM_ORDER[idx-1]]?.bestScore || 0) >= 35;
                    
                    return (
                        <div key={topicId} className="flex flex-col items-center">
                            <button 
                                disabled={!isUnlocked}
                                onMouseEnter={() => setHoveredTopic(topicId)}
                                onMouseLeave={() => setHoveredTopic(null)}
                                onClick={() => { audioService.playClick(); onNavigate(AppView.TOPIC, topicId); }}
                                className={`group relative w-full aspect-square rounded-[2.5rem] border-4 transition-all duration-700 flex flex-col items-center justify-center overflow-hidden
                                ${isUnlocked 
                                    ? mastery >= 75 ? 'border-teal-500/40 bg-teal-500/10 shadow-[0_0_60px_rgba(20,184,166,0.15)]' : 'border-white/5 bg-white/5 hover:border-medical-500/60 hover:bg-white/10 hover:-translate-y-2' 
                                    : 'border-transparent bg-slate-900/50 opacity-10 cursor-not-allowed grayscale'}`}
                            >
                                <i className={`fas ${topic.icon} text-4xl mb-6 transition-all group-hover:scale-125 group-hover:rotate-6 ${mastery >= 75 ? 'text-teal-400' : 'text-medical-400'}`}></i>
                                <span className="text-[9px] md:text-[11px] font-black uppercase text-white tracking-[0.2em] text-center px-6 leading-tight opacity-80 group-hover:opacity-100">{topicId}</span>
                                {isUnlocked && mastery > 0 && (
                                    <div className="absolute bottom-0 left-0 w-full h-2 bg-black/40">
                                        <div className={`h-full transition-all duration-[2000ms] ease-out ${mastery >= 75 ? 'bg-teal-500 shadow-[0_0_10px_#14b8a6]' : 'bg-medical-500'}`} style={{ width: `${mastery}%` }}></div>
                                    </div>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Tactical Feed & Special Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 bg-slate-900/60 rounded-[3.5rem] p-10 md:p-16 border-l-8 border-l-teal-500 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-[0.05]"><i className="fas fa-brain text-[150px] text-teal-400"></i></div>
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400"><i className="fas fa-satellite-dish"></i></div>
                   <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.5em]">Neural Insight Stream</h4>
                </div>
                <p className="text-2xl md:text-4xl font-serif italic text-white leading-snug mb-12 selection:bg-teal-500/30">
                   "{dailyInsight || 'Calibrating neural paths for high-frequency synchronization.'}"
                </p>
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-teal-400 border border-teal-500/20 shadow-xl"><i className="fas fa-robot text-xl"></i></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Knowledge Core v4.2</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Protocol status: optimal</p>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900/60 rounded-[3.5rem] p-10 md:p-16 border-l-8 border-l-orange-500 group overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 blur-[100px] pointer-events-none group-hover:bg-orange-500/10 transition-all duration-1000"></div>
                <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em] mb-8 flex items-center">
                    <i className="fas fa-radiation mr-3 animate-pulse"></i> Lockdown Simulator
                </h4>
                <h3 className="text-4xl md:text-5xl font-display font-black text-white leading-none uppercase mb-8 italic">Full Mock<br/>Deployment</h3>
                <p className="text-slate-500 text-lg leading-relaxed mb-12 max-w-sm">Strips the interface to raw Pearson VUE specifications. No Navigator. High stakes. Pure physics endurance.</p>
                <button 
                    onClick={() => onNavigate(AppView.QUIZ, Topic.ALL, QuizMode.REGISTRY_SIM)}
                    className="w-full py-6 bg-orange-600 hover:bg-orange-500 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.4em] transition-all shadow-2xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-4"
                >
                    Initialize Lockdown <i className="fas fa-lock"></i>
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

const StatPill: React.FC<{ icon: string; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-slate-900/80 border border-white/5 px-8 py-5 rounded-[2rem] flex items-center gap-6 shadow-2xl backdrop-blur-xl group hover:border-white/20 transition-all">
     <div className={`w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform`}>
        <i className={`fas ${icon} text-xl`}></i>
     </div>
     <div className="text-left">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-2">{label}</p>
        <p className="text-2xl font-black text-white leading-none tracking-tight">{value}</p>
     </div>
  </div>
);
