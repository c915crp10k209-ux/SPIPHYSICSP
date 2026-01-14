
import React, { useState, useEffect } from 'react';
import { RegistryReport } from '../types';
import { generateReadinessReport } from '../services/geminiService';
import { getProgress, saveReadinessReport, getReadinessReport } from '../services/persistenceService';
import { audioService } from '../services/audioService';
import { HarveyAvatar } from './HarveyAvatar';

export const ReadinessPredictor: React.FC = () => {
  const [report, setReport] = useState<RegistryReport | null>(getReadinessReport());
  const [loading, setLoading] = useState(false);
  const progress = getProgress();

  const handlePredict = async () => {
    audioService.playHarveySync();
    setLoading(true);
    try {
      const data = await generateReadinessReport(progress);
      setReport(data);
      saveReadinessReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = report ? (report.probability >= 85 ? 'text-teal-400' : report.probability >= 65 ? 'text-amber-400' : 'text-red-400') : '';

  return (
    <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-medical-500/0 via-medical-500/50 to-medical-500/0"></div>
      
      {!report && !loading && (
        <div className="text-center max-w-2xl">
          <div className="mb-10 flex justify-center">
             <HarveyAvatar level={15} size="lg" />
          </div>
          <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Registry Readiness Analysis</h3>
          <p className="text-slate-400 text-lg mb-10 font-serif italic">
            "I'll analyze your current neural synchronization levels and predict your certification probability. Ready for the hard truth, student?"
          </p>
          <button 
            onClick={handlePredict}
            className="px-12 py-5 bg-medical-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-medical-500/20 hover:scale-105 transition-all"
          >
            Initiate Full Diagnostic
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center">
          <div className="relative mb-12">
            <div className="w-40 h-40 border-4 border-slate-800 border-t-medical-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-microchip text-4xl text-medical-500/40 animate-pulse"></i>
            </div>
          </div>
          <h4 className="text-xl font-black text-white tracking-[0.2em] uppercase mb-2">Simulating Registry Core</h4>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Harvey is crunching your stats...</p>
        </div>
      )}

      {report && !loading && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className="flex flex-col lg:flex-row gap-12 items-start">
              
              {/* Score Meter */}
              <div className="lg:w-1/3 flex flex-col items-center bg-black/40 p-10 rounded-[3rem] border border-white/5 w-full">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Certification Probability</p>
                  <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" 
                           strokeDasharray={552.9} 
                           strokeDashoffset={552.9 - (552.9 * report.probability / 100)} 
                           className={scoreColor} />
                      </svg>
                      <span className={`absolute text-6xl font-black ${scoreColor}`}>{Math.round(report.probability)}%</span>
                  </div>
                  <div className="mt-10 text-center">
                      <p className="text-white font-serif italic text-lg leading-relaxed mb-4">"{report.verdict}"</p>
                      <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">Diagnostic Timestamp: {new Date(report.timestamp).toLocaleTimeString()}</span>
                  </div>
              </div>

              {/* Data Lists */}
              <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                  <div className="space-y-8">
                      <div>
                        <h5 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                            <i className="fas fa-check-circle mr-2"></i> Peak Sync Areas
                        </h5>
                        <ul className="space-y-3">
                            {report.strengths.map((s, i) => (
                                <li key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 text-slate-300 text-sm font-bold flex items-center">
                                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-4"></div> {s}
                                </li>
                            ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                            <i className="fas fa-exclamation-triangle mr-2"></i> Sync Dropouts
                        </h5>
                        <ul className="space-y-3">
                            {report.weaknesses.map((w, i) => (
                                <li key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 text-slate-300 text-sm font-bold flex items-center">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-4"></div> {w}
                                </li>
                            ))}
                        </ul>
                      </div>
                  </div>

                  <div className="bg-medical-500/5 p-8 rounded-[2.5rem] border border-medical-500/20">
                      <h5 className="text-[10px] font-black text-medical-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                          <i className="fas fa-route mr-2"></i> Recommended Study Vector
                      </h5>
                      <div className="space-y-6">
                        {report.studyPlan.map((step, i) => (
                            <div key={i} className="flex space-x-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-medical-500 flex items-center justify-center text-white text-[10px] font-black">{i + 1}</span>
                                <p className="text-slate-300 text-sm leading-snug font-medium pt-1">{step}</p>
                            </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => { audioService.playClick(); handlePredict(); }}
                        className="w-full mt-10 py-4 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                        Recalibrate Data
                      </button>
                  </div>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};
