
import React, { useState, useRef, useEffect } from 'react';
import { PersonalizedStudyPlan, VisionAnalysis, SolverResult, SolverDiagnosticResponses, Topic, AppView } from '../types';
import { analyzeUltrasoundFrame, generatePersonalizedStudyPlan, generateSolverReport } from '../services/geminiService';
import { getProgress, vaultItem, getGameState } from '../services/persistenceService';
import { audioService } from '../services/audioService';
import { HarveyAvatar } from './HarveyAvatar';
import { AudioNarrator } from './AudioNarrator';

export const NeuroDeck: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'VISION' | 'SCHEDULE' | 'SOLVER'>('VISION');
    const [loading, setLoading] = useState(false);
    const [visionResult, setVisionResult] = useState<VisionAnalysis | null>(null);
    const [plan, setPlan] = useState<PersonalizedStudyPlan | null>(null);
    const [solverResult, setSolverResult] = useState<SolverResult | null>(null);
    const [solverForm, setSolverForm] = useState<SolverDiagnosticResponses>({ primaryIssue: '', imagingMode: 'B-Mode', currentKnobSettings: '' });
    const game = getGameState();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleVisionAudit = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        audioService.playHarveySync();
        
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const result = await analyzeUltrasoundFrame(base64, file.type);
                setVisionResult(result);
                setLoading(false);
            };
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleGeneratePlan = async () => {
        setLoading(true);
        audioService.playHarveySync();
        const freshPlan = await generatePersonalizedStudyPlan(getProgress());
        setPlan(freshPlan);
        vaultItem({ topic: Topic.PHYSICS, title: "Neural Study Protocol", content: freshPlan.overview, type: 'study_plan' });
        setLoading(false);
    };

    const handleSolve = async () => {
        setLoading(true);
        audioService.playHarveySync();
        const result = await generateSolverReport(solverForm);
        setSolverResult(result);
        setLoading(false);
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-950 text-white overflow-hidden relative">
            {/* Header Tabs */}
            <div className="pt-12 px-6 md:px-12 flex items-center justify-between border-b border-white/5 bg-black/20 shrink-0">
                <div className="flex gap-8">
                    {[
                        { id: 'VISION', label: 'Vision Audit', icon: 'fa-eye' },
                        { id: 'SCHEDULE', label: 'Study Protocol', icon: 'fa-calendar-alt' },
                        { id: 'SOLVER', label: 'Logic Solver', icon: 'fa-microchip' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => { audioService.playClick(); setActiveTab(tab.id as any); }}
                            className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${activeTab === tab.id ? 'text-medical-500 border-medical-500' : 'text-slate-600 border-transparent hover:text-slate-400'}`}
                        >
                            <i className={`fas ${tab.icon} mr-3`}></i> {tab.label}
                        </button>
                    ))}
                </div>
                <div className="hidden md:flex items-center gap-4 pb-4">
                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Bot Status: Optimal</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 pb-32">
                <div className="max-w-4xl mx-auto space-y-12">
                    
                    {loading && (
                        <div className="flex flex-col items-center py-24 animate-pulse">
                            <HarveyAvatar level={game.level} size="md" isThinking={true} />
                            <h3 className="mt-8 text-xl font-black text-medical-500 uppercase tracking-[0.4em]">Processing Neural Data</h3>
                        </div>
                    )}

                    {!loading && activeTab === 'VISION' && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <div className="bg-slate-900/60 p-10 rounded-[3rem] border border-white/5 text-center">
                                <i className="fas fa-camera-retro text-4xl text-medical-500 mb-6"></i>
                                <h2 className="text-3xl font-display font-black tracking-tight mb-4 uppercase">Artifact Vision Lab</h2>
                                <p className="text-slate-500 font-serif italic text-lg mb-8">
                                    "Found an anomaly in your scan? Feed it to my neural net. I'll diagnose the physics root cause."
                                </p>
                                <input type="file" ref={fileInputRef} onChange={handleVisionAudit} className="hidden" accept="image/*" />
                                <button onClick={() => fileInputRef.current?.click()} className="px-10 py-5 bg-medical-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Initiate Lens Sync</button>
                            </div>

                            {visionResult && (
                                <div className="bg-white/5 rounded-[2.5rem] p-10 border border-teal-500/20 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Diagnostic Report</p>
                                            <h3 className="text-2xl font-black text-white uppercase">{visionResult.artifact}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Confidence</p>
                                            <p className="text-xl font-mono text-teal-400 font-black">{Math.round(visionResult.confidence * 100)}%</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Physics Core</p>
                                            <p className="text-slate-200 text-sm leading-relaxed">{visionResult.physicsPrinciple}</p>
                                        </div>
                                        <div className="bg-teal-500/10 p-6 rounded-2xl border border-teal-500/20">
                                            <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-3">Knobology Fix</p>
                                            <p className="text-teal-50 text-sm leading-relaxed font-bold">{visionResult.knobFix}</p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/5">
                                        <p className="text-slate-400 text-lg font-serif italic leading-relaxed selection:bg-teal-500/30">
                                            "{visionResult.explanation}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && activeTab === 'SCHEDULE' && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                             <div className="bg-slate-900/60 p-10 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center gap-10">
                                <div className="shrink-0"><HarveyAvatar level={game.level} size="sm" /></div>
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Personal Study Protocol</h2>
                                    <p className="text-slate-500 font-serif italic mb-6">"Based on your neural mastery scores, I can architect a path to certification."</p>
                                    <button onClick={handleGeneratePlan} className="px-10 py-5 bg-medical-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Generate Mission Path</button>
                                </div>
                             </div>

                             {plan && (
                                <div className="space-y-8 animate-in zoom-in-95 duration-700">
                                    <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5">
                                        <div className="flex items-center gap-4 mb-6">
                                            <i className="fas fa-satellite text-medical-500"></i>
                                            <p className="text-[10px] font-black text-medical-500 uppercase tracking-widest">Protocol Briefing</p>
                                        </div>
                                        <p className="text-slate-200 text-xl font-serif italic leading-relaxed mb-8">"{plan.briefingScript}"</p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {plan.days.map(d => (
                                                <div key={d.day} className="bg-black/40 p-6 rounded-[2rem] border border-white/5 hover:border-medical-500/20 transition-all">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="w-10 h-10 bg-medical-500/10 rounded-xl flex items-center justify-center text-medical-500 font-black text-sm">0{d.day}</span>
                                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{d.estimatedTime}</span>
                                                    </div>
                                                    <h4 className="text-lg font-black text-white uppercase mb-2">{d.focusTopic}</h4>
                                                    <p className="text-slate-500 text-xs mb-4 leading-relaxed">{d.rationale}</p>
                                                    <ul className="space-y-2">
                                                        {d.tasks.map((t, idx) => (
                                                            <li key={idx} className="flex items-center gap-3 text-[10px] font-bold text-slate-300">
                                                                <div className="w-1 h-1 rounded-full bg-teal-500"></div> {t}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}

                    {!loading && activeTab === 'SOLVER' && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                             <div className="bg-slate-900/60 p-10 rounded-[3rem] border border-white/5">
                                <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-4">
                                    <i className="fas fa-bug text-medical-500"></i> Logic Anomaly Solver
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Primary Issue</label>
                                        <input 
                                            value={solverForm.primaryIssue}
                                            onChange={e => setSolverForm({...solverForm, primaryIssue: e.target.value})}
                                            placeholder="e.g. My color signal is aliasing in a carotid jet..."
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 text-white placeholder-slate-800 focus:border-medical-500 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Modality</label>
                                            <select 
                                                value={solverForm.imagingMode}
                                                onChange={e => setSolverForm({...solverForm, imagingMode: e.target.value})}
                                                className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 text-white focus:border-medical-500 transition-all appearance-none"
                                            >
                                                <option>B-Mode</option>
                                                <option>Color Doppler</option>
                                                <option>Spectral Doppler</option>
                                                <option>M-Mode</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Knob Status</label>
                                            <input 
                                                value={solverForm.currentKnobSettings}
                                                onChange={e => setSolverForm({...solverForm, currentKnobSettings: e.target.value})}
                                                placeholder="e.g. Gain 40%, High PRF"
                                                className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 text-white placeholder-slate-800 focus:border-medical-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <button onClick={handleSolve} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Execute Solution Sync</button>
                                </div>
                             </div>

                             {solverResult && (
                                <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 animate-in slide-in-from-bottom-4 duration-700">
                                     <div className="flex items-center gap-4 mb-8">
                                         <i className="fas fa-terminal text-teal-400"></i>
                                         <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Correction Protocol v1.0</h4>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
                                        <div className="md:col-span-4 bg-black/60 p-8 rounded-[2.5rem] border border-white/5 text-center">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Sync Archetype</p>
                                            <i className={`fas ${solverResult.l3_archetypes.primary.icon} text-4xl text-medical-500 mb-4`}></i>
                                            <h5 className="text-xl font-black text-white uppercase">{solverResult.l3_archetypes.primary.name}</h5>
                                            <p className="text-slate-500 text-[10px] mt-2 italic">"{solverResult.l3_archetypes.primary.desc}"</p>
                                        </div>
                                        <div className="md:col-span-8 space-y-6">
                                            <div className="bg-teal-500/10 p-8 rounded-[2.5rem] border border-teal-500/20">
                                                <h5 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4">Clinical Verdict</h5>
                                                <p className="text-teal-50 text-xl font-serif italic leading-relaxed selection:bg-teal-500/40">"{solverResult.l1_l2_summary.text}"</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {solverResult.l1_l2_summary.topProblems.map((p, i) => (
                                                    <div key={i} className="px-5 py-3 bg-white/5 rounded-xl border border-white/10 text-slate-300 text-[10px] font-bold">
                                                        <i className="fas fa-chevron-right mr-3 text-medical-500"></i> {p}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                     </div>
                                     <div className="p-8 bg-red-500/5 rounded-[2rem] border border-red-500/10">
                                        <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-3"><i className="fas fa-exclamation-triangle"></i> Shadow Warnings</h5>
                                        <p className="text-slate-400 text-sm font-serif italic">"{solverResult.l3_archetypes.shadow.warning}"</p>
                                     </div>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
