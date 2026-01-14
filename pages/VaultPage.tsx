
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, VaultItem, Topic, GamificationState, NeuralVoice, Achievement, MissedQuestion, UserProgress } from '../types';
import { getVault, removeFromVault, getStorageStats, clearAllCaches, getGameState, updateSkin, updateVoicePreferences, ACHIEVEMENTS, getProgress, syncAllDataWithCloud, saveRepairBriefing, getRepairBriefing, saveGameState } from '../services/persistenceService';
import { generateNeuralRepair, generateConsolidatedBriefing } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { HarveyAvatar } from '../components/HarveyAvatar';
import { audioService } from '../services/audioService';
import { AudioNarrator } from '../components/AudioNarrator';
import { FormulaLab } from '../components/FormulaLab';
import { ReadinessPredictor } from '../components/ReadinessPredictor';
import { checkCloudStatus } from '../services/supabaseClient';

interface VaultPageProps {
  onNavigate: (view: AppView, topic?: Topic) => void;
}

export const VaultPage: React.FC<VaultPageProps> = ({ onNavigate }) => {
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [filter, setFilter] = useState<Topic | 'ALL'>('ALL');
  const [storageStats, setStorageStats] = useState({audioCount: 0, contentCount: 0});
  const [game, setGame] = useState<GamificationState>(getGameState());
  const [progress, setProgress] = useState<UserProgress>(getProgress());
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'REPAIR' | 'ACHIEVEMENTS' | 'FORMULAS' | 'READINESS' | 'SETTINGS'>('RECORDS');
  const [cloudStatus, setCloudStatus] = useState(false);
  
  const [repairBriefing, setRepairBriefing] = useState<string | null>(null);
  const [repairTimestamp, setRepairTimestamp] = useState<number | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);

  const [consolidatedBriefing, setConsolidatedBriefing] = useState<string | null>(null);
  const [isConsolidating, setIsConsolidating] = useState(false);

  const AVAILABLE_SKINS = [
    { id: 'Default', label: 'Default Sync', cost: 0, desc: 'Harvey\'s original registry-grade chassis.' },
    { id: 'Medical', label: 'Clinical Blue', cost: 250, desc: 'Professional medical aesthetic for lab environments.' },
    { id: 'Stealth', label: 'Silent Pulse', cost: 500, desc: 'A minimalist profile for late-night sessions.' },
    { id: 'Neon', label: 'Flow State', cost: 750, desc: 'High-energy fuchsia particles for synchronization.' },
    { id: 'Golden', label: 'Board Certified', cost: 1500, desc: 'The ultimate mark of a sonography physics veteran.' },
  ];

  useEffect(() => {
    setVault(getVault());
    setGame(getGameState());
    setProgress(getProgress());
    updateStats();
    checkCloudStatus().then(setCloudStatus);
    
    const cachedRepair = getRepairBriefing();
    if (cachedRepair) {
        setRepairBriefing(cachedRepair.text);
        setRepairTimestamp(cachedRepair.timestamp);
    }
  }, []);

  const updateStats = async () => {
    const stats = await getStorageStats();
    setStorageStats(stats);
  };

  const missedQuestions = useMemo(() => {
    return (Object.values(progress) as any[]).flatMap(p => p.missedHistory || []);
  }, [progress]);

  const handleNeuralRepair = async () => {
    if (missedQuestions.length === 0) return;
    audioService.playHarveySync();
    setIsRepairing(true);
    setRepairBriefing(null);
    try {
      const briefing = await generateNeuralRepair(missedQuestions);
      setRepairBriefing(briefing);
      setRepairTimestamp(Date.now());
      saveRepairBriefing(briefing);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleConsolidate = async () => {
    if (vault.length === 0) return;
    audioService.playHarveySync();
    setIsConsolidating(true);
    try {
      const briefing = await generateConsolidatedBriefing(vault);
      setConsolidatedBriefing(briefing);
    } catch (e) {
      console.error(e);
    } finally {
      setIsConsolidating(false);
    }
  };

  const handlePurchaseOrEquip = (skinId: string, cost: number) => {
    const isOwned = game.unlockedSkins.includes(skinId);
    if (isOwned) {
      audioService.playClick();
      const state = updateSkin(skinId);
      setGame(state);
    } else if (game.bits >= cost) {
      audioService.playLevelUp();
      const state = getGameState();
      state.unlockedSkins.push(skinId);
      state.bits -= cost;
      state.activeSkin = skinId;
      saveGameState(state);
      setGame({ ...state });
    } else {
      audioService.playError();
    }
  };

  const filteredItems = filter === 'ALL' ? vault : vault.filter(i => i.topic === filter);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 custom-scrollbar relative">
      
      <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-medical-500/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-16 pb-40">
        
        {/* Archive Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
           <div className="flex items-center gap-6">
              <div className="relative shrink-0 scale-75 md:scale-90">
                 <div className="absolute inset-0 bg-medical-500/20 blur-2xl rounded-full scale-150"></div>
                 <HarveyAvatar level={game.level} size="sm" activeSkin={game.activeSkin} />
              </div>
              <div>
                  <div className="flex items-center gap-3 mb-3">
                     <span className="px-3 py-1 bg-medical-500/10 border border-medical-500/20 rounded-full text-[8px] font-black text-medical-400 uppercase tracking-widest animate-pulse">Sync Active</span>
                  </div>
                  <h1 className="text-4xl md:text-8xl font-display font-black text-white tracking-tighter uppercase leading-[0.8] italic">
                    Neural <span className="text-medical-500 not-italic">Archive</span>
                  </h1>
              </div>
           </div>

           <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-2xl w-full lg:w-auto">
              {[
                { id: 'RECORDS', label: 'Matrix', icon: 'fa-database' },
                { id: 'REPAIR', label: 'Repair', icon: 'fa-tools' },
                { id: 'FORMULAS', label: 'Lab', icon: 'fa-flask' },
                { id: 'READINESS', label: 'Status', icon: 'fa-id-card' },
                { id: 'ACHIEVEMENTS', label: 'Awards', icon: 'fa-trophy' },
                { id: 'SETTINGS', label: 'Config', icon: 'fa-cog' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => { audioService.playClick(); setActiveTab(tab.id as any); }} 
                  className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                    ${activeTab === tab.id ? 'bg-medical-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
           </div>
        </div>

        {activeTab === 'RECORDS' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             {vault.length > 1 && !consolidatedBriefing && (
                <div className="bg-slate-900/60 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-medical-500/20 shadow-2xl relative overflow-hidden group">
                   <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                      <div className="text-center md:text-left">
                         <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">Syndicate Sync</h3>
                         <p className="text-slate-500 font-serif italic text-base md:text-lg max-w-xl leading-relaxed">
                            "I can synthesize your {vault.length} scattered records into a single high-yield briefing."
                         </p>
                      </div>
                      <button 
                        onClick={handleConsolidate}
                        disabled={isConsolidating}
                        className="w-full md:w-auto px-10 py-5 bg-teal-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-4"
                      >
                         {isConsolidating ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-bolt"></i>}
                         {isConsolidating ? 'Syncing...' : 'Initiate Sync'}
                      </button>
                   </div>
                </div>
             )}

             {consolidatedBriefing && (
                <div className="bg-teal-500/5 p-8 md:p-16 rounded-[3rem] border border-teal-500/20 animate-in zoom-in-95 duration-700">
                   <div className="flex items-center justify-between mb-8 border-b border-teal-500/10 pb-6">
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tight">The Data Syndicate</h4>
                      <button onClick={() => setConsolidatedBriefing(null)} className="text-slate-500 hover:text-white transition-colors">
                        <i className="fas fa-times"></i>
                      </button>
                   </div>
                   <div className="prose prose-invert prose-lg max-w-none text-slate-300 font-serif italic leading-relaxed">
                      <ReactMarkdown>{consolidatedBriefing}</ReactMarkdown>
                   </div>
                </div>
             )}

             <div className="space-y-8">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                   <button onClick={() => setFilter('ALL')} className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === 'ALL' ? 'bg-medical-500 text-white' : 'bg-white/5 text-slate-500'}`}>All Nodes</button>
                   {Object.values(Topic).map(t => (
                      <button key={t} onClick={() => setFilter(t)} className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === t ? 'bg-medical-500 text-white' : 'bg-white/5 text-slate-500'}`}>{t}</button>
                   ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredItems.map(item => (
                      <div key={item.id} className="group relative bg-slate-900/60 p-8 rounded-[2rem] border border-white/5 hover:border-medical-500/30 transition-all duration-500 flex flex-col">
                         <div className="flex justify-between items-start mb-6">
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[7px] font-black text-slate-500 uppercase tracking-widest">{item.topic}</span>
                            <button onClick={() => { audioService.playError(); removeFromVault(item.id); setVault(v => v.filter(i => i.id !== item.id)); }} className="text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                <i className="fas fa-trash-alt text-xs"></i>
                            </button>
                         </div>
                         <h5 className="text-lg font-black text-white uppercase mb-4 leading-tight">{item.title}</h5>
                         <div className="prose prose-invert prose-sm max-w-none text-slate-400 font-serif italic mb-8 line-clamp-4 leading-relaxed">
                            <ReactMarkdown>{item.content}</ReactMarkdown>
                         </div>
                         <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[7px] font-mono text-slate-700 uppercase tracking-tighter">{new Date(item.date).toLocaleDateString()}</span>
                            <AudioNarrator text={item.content} voiceName={game.preferredVoice || 'Zephyr'} />
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'REPAIR' && (
          <div className="animate-in slide-in-from-bottom-8 duration-1000 pb-20">
             <div className="bg-slate-900/40 p-8 md:p-24 rounded-[3rem] border border-white/5 shadow-2xl text-center">
                   <div className="flex justify-center mb-10"><HarveyAvatar level={game.level} size="md" isThinking={isRepairing} activeSkin={game.activeSkin} /></div>
                   <h3 className="text-3xl md:text-6xl font-display font-black text-white leading-none uppercase italic mb-8">Neural Repair Unit</h3>
                   <p className="text-slate-400 text-lg md:text-2xl font-serif italic mb-12">"Found {missedQuestions.length} logical fractures. Let's stabilize the circuit."</p>
                   <button 
                     onClick={handleNeuralRepair}
                     disabled={missedQuestions.length === 0 || isRepairing}
                     className={`px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all w-full md:w-auto ${missedQuestions.length > 0 ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'bg-slate-800 text-slate-600'}`}
                   >
                      {isRepairing ? 'Patching...' : 'Initiate Repair Cycle'}
                   </button>
             </div>
             {repairBriefing && (
                <div className="mt-12 bg-white/5 p-8 md:p-16 rounded-[3rem] border border-red-500/20 shadow-2xl">
                    <h4 className="text-2xl font-black text-white uppercase italic tracking-tight mb-8">Signal Recovery Log</h4>
                    <div className="prose prose-invert prose-lg max-w-none text-slate-300 font-serif italic leading-relaxed">
                        <ReactMarkdown>{repairBriefing}</ReactMarkdown>
                    </div>
                </div>
             )}
          </div>
        )}

        {activeTab === 'FORMULAS' && <div className="animate-in fade-in duration-700 pb-20"><FormulaLab /></div>}
        {activeTab === 'READINESS' && <div className="animate-in fade-in duration-700 pb-20"><ReadinessPredictor /></div>}
        {activeTab === 'ACHIEVEMENTS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700 pb-20">
                {ACHIEVEMENTS.map(ach => {
                    const isUnlocked = game.achievements.includes(ach.id);
                    return (
                        <div key={ach.id} className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center ${isUnlocked ? 'bg-teal-500/5 border-teal-500/30' : 'bg-white/5 border-white/5 opacity-40'}`}>
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 ${isUnlocked ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
                                <i className={`fas ${ach.icon}`}></i>
                            </div>
                            <h4 className="text-[10px] font-black text-white uppercase mb-2">{ach.title}</h4>
                            <p className="text-[9px] text-slate-500 font-serif italic">"{ach.description}"</p>
                        </div>
                    );
                })}
            </div>
        )}

        {activeTab === 'SETTINGS' && (
           <div className="space-y-12 animate-in fade-in duration-700 pb-20">
              <div className="bg-slate-900/60 p-8 md:p-16 rounded-[3rem] border border-white/5">
                 <h3 className="text-xl font-black text-white uppercase mb-10 flex items-center gap-4"><i className="fas fa-palette text-teal-400"></i> Chassis Evolution</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {AVAILABLE_SKINS.map(skin => (
                       <button 
                        key={skin.id} 
                        onClick={() => handlePurchaseOrEquip(skin.id, skin.cost)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${game.activeSkin === skin.id ? 'bg-teal-500/10 border-teal-500' : 'bg-white/5 border-white/5'}`}
                       >
                          <div className="scale-50 mb-2"><HarveyAvatar level={game.level} size="sm" activeSkin={skin.id} /></div>
                          <span className="text-[8px] font-black text-white uppercase">{skin.label}</span>
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};
