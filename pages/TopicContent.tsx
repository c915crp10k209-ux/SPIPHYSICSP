
import React, { useState, useEffect } from 'react';
import { AppView, Topic, QuizMode, SubTopic, UserProgress } from '../types';
import { TOPICS } from '../constants';
import { GeminiTutor } from '../components/GeminiTutor';
import { SimulationStage } from '../components/SimulationStage';
import { LectureDisplay } from '../components/LectureDisplay';
import { LiveConsultation } from '../components/LiveConsultation';
import { audioService } from '../services/audioService';
import { getProgress, completeChallenge, saveTopicSession, getTopicSession } from '../services/persistenceService';

interface TopicContentProps {
  topic: Topic;
  onNavigate: (view: AppView, topic?: Topic, mode?: QuizMode) => void;
}

type ContentMode = 'LECTURE' | 'LAB' | 'LIVE';

export const TopicContent: React.FC<TopicContentProps> = ({ topic, onNavigate }) => {
  const metadata = TOPICS[topic];
  const [activeSubTopic, setActiveSubTopic] = useState<SubTopic>(metadata.subTopics[0]);
  const [mode, setMode] = useState<ContentMode>('LECTURE');
  const [tutorOpen, setTutorOpen] = useState(false);
  const [progress, setProgress] = useState<UserProgress>(getProgress());

  useEffect(() => {
    const session = getTopicSession(topic);
    if (session) {
      setMode(session.mode as any);
      const foundSub = metadata.subTopics.find(st => st.id === session.subTopicId);
      if (foundSub) setActiveSubTopic(foundSub);
    } else {
      setActiveSubTopic(metadata.subTopics[0]);
      setMode('LECTURE');
    }
    setProgress(getProgress());
  }, [topic, metadata.subTopics]);

  useEffect(() => {
    saveTopicSession(topic, activeSubTopic.id, mode);
  }, [topic, activeSubTopic, mode]);

  const handleChallengeComplete = (cid: string) => {
    const newlyDone = completeChallenge(topic, cid);
    if (newlyDone) {
        audioService.playSuccess();
        setProgress(getProgress());
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative h-full overflow-hidden">
      
      {/* Mode Navigation HUD - Properly Spaced for Mobile */}
      <div className="sticky top-0 z-[450] w-full p-4 flex justify-center bg-gradient-to-b from-slate-950 to-transparent pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl flex items-center w-full max-w-sm pointer-events-auto">
              <div className="flex flex-1 gap-1">
                  {[
                    { id: 'LECTURE', label: 'Story', icon: 'fa-book-open' },
                    { id: 'LAB', label: 'Lab', icon: 'fa-flask' },
                    { id: 'LIVE', label: 'Sync', icon: 'fa-microphone' }
                  ].map((m) => (
                    <button 
                      key={m.id}
                      onClick={() => { audioService.playClick(); setMode(m.id as any); }} 
                      className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${mode === m.id ? 'bg-medical-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <i className={`fas ${m.icon} text-[10px] mb-1`}></i>
                      <span className="text-[7px] font-black uppercase tracking-widest">{m.label}</span>
                    </button>
                  ))}
              </div>
          </div>
      </div>

      {/* Main Content Area - Significant padding-bottom to clear mobile nav and lecture controls */}
      <div className="flex-1 flex flex-col min-h-0">
          {mode === 'LECTURE' ? (
              <LectureDisplay 
                  topic={topic} 
                  subTopic={activeSubTopic} 
                  voiceName={metadata.voice} 
                  onNavigate={onNavigate} 
              />
          ) : mode === 'LAB' ? (
              <div className="flex-1 flex flex-col p-4 md:p-12 lg:p-24 pt-2 md:pt-4 space-y-6 overflow-y-auto custom-scrollbar pb-44 md:pb-40">
                  <div className="px-2">
                      <p className="text-[8px] font-black text-medical-500 uppercase tracking-[0.4em]">Calibration Node_{activeSubTopic.id}</p>
                      <h2 className="text-xl md:text-5xl font-black text-white uppercase tracking-tight italic leading-none">{activeSubTopic.title}</h2>
                  </div>
                  <div className="aspect-video min-h-[300px] md:min-h-[500px] rounded-3xl md:rounded-[3rem] overflow-hidden border-2 border-white/5 bg-black shadow-2xl shrink-0">
                      <SimulationStage simulationId={activeSubTopic.simulationId} onChallengeProgress={handleChallengeComplete} />
                  </div>
                  <div className="bg-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Protocol Overview</h4>
                      <p className="text-slate-300 text-sm md:text-lg leading-relaxed font-serif italic">{activeSubTopic.description}</p>
                  </div>
              </div>
          ) : (
              <div className="flex-1 flex flex-col pt-4 overflow-y-auto custom-scrollbar pb-44">
                  <LiveConsultation topic={topic} onClose={() => setMode('LECTURE')} />
              </div>
          )}
      </div>

      {/* Harvey Navigator Trigger - Repositioned to bottom-center-right to avoid the primary 'Advance' button and mobile nav bar */}
      <button 
        onClick={() => { audioService.playClick(); setTutorOpen(true); }} 
        className="fixed bottom-[110px] right-4 md:bottom-12 md:right-12 w-12 h-12 md:w-20 md:h-20 bg-slate-900 text-white rounded-full md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-2 border-medical-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-[500] group overflow-hidden"
        aria-label="Ask Harvey"
      >
        <div className="absolute inset-0 bg-medical-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <i className="fas fa-robot text-lg md:text-3xl text-medical-400 group-hover:text-white relative z-10"></i>
      </button>

      {/* Tutor Overlay */}
      {tutorOpen && (
        <div className="fixed inset-0 z-[1300] flex items-end justify-center sm:items-center p-0 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={() => setTutorOpen(false)}></div>
            <div className="w-full max-w-2xl h-[85dvh] sm:h-[90vh] bg-slate-900 sm:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                <GeminiTutor topic={topic} onTeleport={(v,t) => { setTutorOpen(false); onNavigate(v,t); }} />
                <button 
                  onClick={() => setTutorOpen(false)} 
                  className="absolute top-6 right-6 w-10 h-10 bg-black/40 rounded-xl text-white flex items-center justify-center hover:bg-red-500 transition-colors z-[1350]"
                >
                  <i className="fas fa-times"></i>
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
