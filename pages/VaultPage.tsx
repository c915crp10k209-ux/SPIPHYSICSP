import React, { useState, useEffect, useMemo } from 'react';
import { AppView, VaultItem, Topic, GamificationState, UserProgress } from '../types';
import { getVault, removeFromVault, getStorageStats, getGameState, updateSkin, ACHIEVEMENTS, getProgress, saveRepairBriefing, getRepairBriefing, saveGameState } from '../services/persistenceService';
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
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'REPAIR' | 'ACHIEVEMENTS' | 'FORMULAS' | 'READINESS' | 'SETTINGS' | 'PREMIUM'>('RECORDS');
  const [cloudStatus, setCloudStatus] = useState(false);
  
  const [repairBriefing, setRepairBriefing] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [consolidatedBriefing, setConsolidatedBriefing] = useState<string | null>(null);
  const [isConsolidating, setIsConsolidating] = useState(false);

  const AVAILABLE_SKINS = [
    { id: 'Default', label: 'Default Sync', cost: 0, tier: 'Standard', desc: 'Harvey\'s base registry-grade chassis.' },
    { id: 'Medical', label: 'Clinical Blue', cost: 300, tier: 'Standard', desc: 'Standard ultrasound clinic aesthetic.' },
    { id: 'Stealth', label: 'Silent Pulse', cost: 800, tier: 'Rare', desc: 'Low-emission profile for deep study.' },
    { id: 'Neon', label: 'Flow State', cost: 1500, tier: 'Epic', desc: 'High-frequency fuchsia resonator.' },
    { id: 'Void', label: 'Event Horizon', cost: 3000, tier: 'Legendary', desc: 'Bypass physical sound limits.' },
    { id: 'Quantum', label: 'Infinite Pulse', cost: 6000, tier: 'Mythic', desc: 'Sync with every possible registry outcome.' },
    { id: 'Overclock', label: 'Thermal Lock', cost: 0, tier: 'Special', desc: 'Harvey is running hot. (Level 50 Required)' },
  ];

  const PRICING_PACKAGES = [
    { id: 'monthly', label: 'Monthly Sync', price: 26, period: 'month', desc: 'Perfect for short-term intensive study.', popular: false, icon: 'fa-calendar-day' },
    { id: 'yearly', label: 'Yearly Access', price: 143, period: 'year', desc: 'The preferred choice for registry prep.', popular: true, icon: 'fa-calendar-alt', badge: 'Best Value' },
    { id: 'lifetime', label: 'Lifetime Link', price: 280, period: 'forever', desc: 'Permanent neural bond. No expirations.', popular: false, icon: 'fa-infinity', badge: 'Professional' }
  ];

  useEffect(() => {
    setVault(getVault());
    setGame(getGameState());
    setProgress(getProgress());
    updateStats();
    checkCloudStatus().then(setCloudStatus);
    
    const cachedRepair = getRepairBriefing();
    if (cachedRepair) setRepairBriefing(cachedRepair.text);
  }, []);

  const updateStats = async () => {
    const stats = await getStorageStats();
    setStorageStats(stats);
  };

  const missedQuestions = useMemo(() => {
    return (Object.values(progress) as any[]).flatMap(p => p.missedHistory || []);
  }, [progress]);

  const handlePurchaseOrEquip = (skinId: string, cost: number) => {
    const isOwned = game.unlockedSkins.includes(skinId);
    
    if (skinId === 'Overclock' && game.level < 50) {
        audioService.playSystemAlert();
        return;
    }

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

  const handleNeuralRepair = async () => {
    if (missedQuestions.length === 0) return;
    setIsRepairing(true);
    try {
      const briefing = await generateNeuralRepair(missedQuestions);
      setRepairBriefing(briefing);
      saveRepairBriefing(briefing);
    } catch (e) { console.error(e); }
    setIsRepairing(false);
  };

  const handleConsolidate = async () => {
    if (vault.length === 0) return;
    setIsConsolidating(true);
    try {
      const briefing = await generateConsolidatedBriefing(vault);
      setConsolidatedBriefing(briefing);
    } catch (e) { console.error(e); }
    setIsConsolidating(false);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 custom-scrollbar relative pb-32">
      <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-medical-500/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-16">
        
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
                     <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{game.bits} Neural Bits Available</span>
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
                { id: 'SETTINGS', label: 'Chassis', icon: 'fa-robot' },
                { id: 'PREMIUM', label: 'Pro Portal', icon: 'fa-crown' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => { audioService.playClick(); setActiveTab(tab.id as any); }} 
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                    ${activeTab === tab.id ? 'bg-medical-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <i className={`fas ${tab.icon} ${tab.id === 'PREMIUM' && activeTab !== 'PREMIUM' ? 'text-amber-400' : ''}`}></i>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
           </div>
        </div>

        {activeTab === 'RECORDS' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             {vault.length > 1 && !consolidatedBriefing && (
                <div className="bg-slate-900/60 p-12 rounded-[3.5rem] border border-medical-500/20 shadow-2xl relative overflow-hidden group">
                   <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                      <div className="text-center md:text-left">
                         <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Syndicate Sync</h3>
                         <p className="text-slate-500 font-serif italic text-lg max-w-xl leading-relaxed">
                            "Synthesize your {vault.length} scattered records into a single high-yield briefing."
                         </p>
                      </div>
                      <button onClick={handleConsolidate} disabled={isConsolidating} className="w-full md:w-auto px-10 py-5 bg-teal-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:scale-105 transition-all">
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
                      <button onClick={() => setConsolidatedBriefing(null)} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
                   </div>
                   <div className="prose prose-invert prose-lg max-w-none text-slate-300 font-serif italic leading-relaxed"><ReactMarkdown>{consolidatedBriefing}</ReactMarkdown></div>
                </div>
             )}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vault.map(item => (
                   <div key={item.id} className="group relative bg-slate-900/60 p-8 rounded-[2rem] border border-white/5 hover:border-medical-500/30 transition-all duration-500 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                         <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[7px] font-black text-slate-500 uppercase tracking-widest">{item.topic}</span>
                         <button onClick={() => { audioService.playError(); removeFromVault(item.id); setVault(getVault()); }} className="text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i className="fas fa-trash-alt text-xs"></i></button>
                      </div>
                      <h5 className="text-lg font-black text-white uppercase mb-4 leading-tight">{item.title}</h5>
                      <div className="text-slate-400 font-serif italic mb-8 line-clamp-4 leading-relaxed"><ReactMarkdown>{item.content}</ReactMarkdown></div>
                      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                         <span className="text-[7px] font-mono text-slate-700 uppercase">{new Date(item.date).toLocaleDateString()}</span>
                         <AudioNarrator text={item.content} voiceName={game.preferredVoice || 'Zephyr'} />
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'PREMIUM' && (
          <div className="space-y-16 animate-in fade-in duration-700 pb-20">
             <div className="text-center space-y-4 max-w-3xl mx-auto">
                <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight italic">
                  Neural <span className="text-amber-400">Pro Portal</span>
                </h3>
                <p className="text-slate-500 text-lg font-serif italic">
                  "Upgrade to a high-frequency connection. Unlock the full physics spectrum and master every clinical registry domain."
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PRICING_PACKAGES.map((pkg) => (
                   <div 
                    key={pkg.id} 
                    className={`relative p-10 rounded-[3rem] border-2 transition-all duration-500 flex flex-col group
                    ${pkg.popular ? 'bg-medical-500/10 border-medical-500 shadow-[0_30px_100px_-20px_rgba(14,165,233,0.3)] scale-105 z-10' : 'bg-slate-900/60 border-white/5 shadow-2xl'}`}
                   >
                      {pkg.badge && (
                        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg
                          ${pkg.popular ? 'bg-medical-500 text-white' : 'bg-amber-400 text-slate-950'}`}>
                          {pkg.badge}
                        </div>
                      )}

                      <div className="mb-10 text-center md:text-left">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner
                           ${pkg.popular ? 'bg-medical-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <i className={`fas ${pkg.icon}`}></i>
                         </div>
                         <h4 className="text-xl font-black text-white uppercase mb-2">{pkg.label}</h4>
                         <p className="text-[11px] text-slate-500 font-serif italic leading-relaxed">"{pkg.desc}"</p>
                      </div>

                      <div className="mb-10">
                         <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white">${pkg.price}</span>
                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">/ {pkg.period}</span>
                         </div>
                      </div>

                      <div className="space-y-4 mb-12">
                         {[
                           'Unlimited Neural Repair Cycles',
                           'Full Mock Registry Simulator',
                           'All Botface Chassis Unlocked',
                           'Priority Voice Synchronization',
                           'Advanced Clinical Image Audit'
                         ].map((benefit, i) => (
                            <div key={i} className="flex items-center gap-3">
                               <i className={`fas fa-check-circle text-xs ${pkg.popular ? 'text-medical-400' : 'text-slate-700'}`}></i>
                               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{benefit}</span>
                            </div>
                         ))}
                      </div>

                      <button 
                        onClick={() => { audioService.playLevelUp(); }}
                        className={`mt-auto w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] transition-all shadow-xl
                        ${pkg.popular ? 'bg-medical-500 text-white hover:bg-medical-400' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                      >
                         Initialize Link
                      </button>
                   </div>
                ))}
             </div>

             {/* Footer Trust Section */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-10 border-t border-white/5">
                {[
                  { icon: 'fa-lock', title: 'Encrypted Link', desc: 'Secure payment processing protocol.' },
                  { icon: 'fa-undo', title: '7-Day Reset', desc: 'Neural refund period available.' },
                  { icon: 'fa-headset', title: '24/7 Support', desc: 'Harvey is always standing by.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500"><i className={`fas ${item.icon}`}></i></div>
                     <div>
                        <h6 className="text-[10px] font-black text-white uppercase tracking-widest">{item.title}</h6>
                        <p className="text-[9px] text-slate-600 uppercase font-bold">{item.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
           <div className="space-y-12 animate-in fade-in duration-700 pb-20">
              <div className="bg-slate-900/60 p-10 md:p-20 rounded-[4rem] border border-white/5 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none rotate-12"><i className="fas fa-robot text-[300px] text-white"></i></div>
                 
                 <div className="mb-16">
                     <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-6 italic">
                        Chassis <span className="text-medical-500 not-italic">Evolution Lab</span>
                     </h3>
                     <p className="text-slate-500 text-lg font-serif italic max-w-2xl">"Spend Neural Bits to upgrade my physical chassis. Higher tier botfaces feature improved resonators and unique visual protocols."</p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {AVAILABLE_SKINS.map(skin => {
                        const isOwned = game.unlockedSkins.includes(skin.id);
                        const isActive = game.activeSkin === skin.id;
                        const isLocked = skin.id === 'Overclock' && game.level < 50;

                        return (
                           <button 
                            key={skin.id} 
                            onClick={() => handlePurchaseOrEquip(skin.id, skin.cost)}
                            className={`group relative p-10 rounded-[2.5rem] border-2 transition-all duration-700 flex flex-col items-center text-center overflow-hidden
                              ${isActive ? 'bg-medical-500/10 border-medical-500 shadow-2xl' : isLocked ? 'bg-black/40 border-slate-800 opacity-50 grayscale cursor-not-allowed' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                           >
                              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border
                                ${skin.tier === 'Mythic' ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400' : 
                                  skin.tier === 'Legendary' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 
                                  'bg-white/10 border-white/10 text-slate-500'}`}>
                                 {skin.tier} Tier
                              </div>

                              <div className="mb-8 transform group-hover:scale-110 transition-transform duration-700">
                                 <HarveyAvatar level={game.level} size="sm" activeSkin={skin.id} />
                              </div>

                              <h5 className="text-lg font-black text-white uppercase mb-2">{skin.label}</h5>
                              <p className="text-[10px] text-slate-500 font-serif italic mb-6 leading-relaxed line-clamp-2 px-2">"{skin.desc}"</p>

                              <div className={`mt-auto w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all
                                ${isActive ? 'bg-medical-500 text-white' : 
                                  isOwned ? 'bg-white/10 text-white' : 
                                  isLocked ? 'bg-slate-900 text-slate-600' : 'bg-slate-900 text-teal-400 hover:bg-teal-500 hover:text-white'}`}>
                                 {isActive ? 'Active Link' : isOwned ? 'Equip Chassis' : isLocked ? 'Level 50 Required' : `${skin.cost} Bits`}
                              </div>
                           </button>
                        )
                    })}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'REPAIR' && (
           <div className="animate-in slide-in-from-bottom-8 duration-700 text-center py-20">
              <div className="flex justify-center mb-10"><HarveyAvatar level={game.level} size="md" isThinking={isRepairing} activeSkin={game.activeSkin} /></div>
              <h3 className="text-5xl font-display font-black text-white uppercase italic mb-8">Neural Repair Unit</h3>
              <p className="text-slate-400 text-2xl font-serif italic mb-12 max-w-2xl mx-auto">"Found {missedQuestions.length} logical fractures in your memory path. Let's patch the signal."</p>
              <button onClick={handleNeuralRepair} disabled={missedQuestions.length === 0 || isRepairing} className={`px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${missedQuestions.length > 0 ? 'bg-red-600 text-white shadow-xl' : 'bg-slate-800 text-slate-600'}`}>
                 {isRepairing ? 'Patching...' : 'Initiate Repair Cycle'}
              </button>
              {repairBriefing && <div className="mt-12 bg-white/5 p-12 rounded-[3rem] border border-red-500/20 text-left prose prose-invert prose-lg max-w-4xl mx-auto"><ReactMarkdown>{repairBriefing}</ReactMarkdown></div>}
           </div>
        )}

        {activeTab === 'FORMULAS' && <div className="animate-in fade-in duration-700"><FormulaLab /></div>}
        {activeTab === 'READINESS' && <div className="animate-in fade-in duration-700"><ReadinessPredictor /></div>}

      </div>
    </div>
  );
};