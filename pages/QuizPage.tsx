
import React, { useEffect, useState, useRef } from 'react';
import { AppView, QuizQuestion, Topic, QuizMode, MissedQuestion, GamificationState } from '../types';
import { generateQuizQuestions, generateCommonMistakesMock, generateHarveyHint, generateWeightedMock } from '../services/geminiService';
import { saveQuizResult, saveActiveQuiz, getActiveQuiz, clearActiveQuiz, getGameState, deductBits } from '../services/persistenceService';
import { audioService } from '../services/audioService';
import { AudioNarrator } from '../components/AudioNarrator';
import { HarveyAvatar } from '../components/HarveyAvatar';

interface QuizPageProps {
  topic: Topic;
  mode?: QuizMode;
  onNavigate: (view: AppView, topic?: Topic, mode?: QuizMode) => void;
}

type QuizPhase = 'BRIEFING' | 'LOADING' | 'ACTIVE' | 'REVIEW';

export const QuizPage: React.FC<QuizPageProps> = ({ topic, mode = QuizMode.STANDARD, onNavigate }) => {
  const [phase, setPhase] = useState<QuizPhase>('BRIEFING');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [game, setGame] = useState<GamificationState>(getGameState());
  const [syncStatus, setSyncStatus] = useState<string[]>([]);
  const [hints, setHints] = useState<Record<number, string>>({});
  const [hintLoading, setHintLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120 * 60);

  const timerRef = useRef<number | null>(null);
  const isRegistryMode = mode === QuizMode.REGISTRY_SIM;

  const startMission = async () => {
    setPhase('LOADING');
    audioService.playHarveySync();
    try {
      let data: QuizQuestion[];
      if (mode === QuizMode.MISTAKE_ANALYSIS) {
         setSyncStatus(['Scanning Missed Patterns', 'Synthesizing Traps']);
         data = await generateCommonMistakesMock();
      } else if (isRegistryMode) {
         setSyncStatus(['Establishing Registry Link', 'Blueprinting Weighted Domains']);
         data = await generateWeightedMock();
      } else {
         setSyncStatus(['Connecting Node Path', 'Verifying Logic Gates']);
         data = await generateQuizQuestions(topic, 10);
      }
      
      const cleaned = data.map(q => ({
          ...q,
          question: q.question.replace(/[*#`]/g, ''),
          explanation: q.explanation.replace(/[*#`]/g, ''),
          options: q.options.map(o => o.replace(/[*#`]/g, ''))
      }));

      setQuestions(cleaned);
      setUserAnswers(new Array(cleaned.length).fill(-1));
      setCurrentQIndex(0);
      setPhase('ACTIVE');
    } catch (err) { 
      console.error(err); 
      setPhase('BRIEFING');
    }
  };

  useEffect(() => {
    if (phase === 'ACTIVE') audioService.toggleFocusAmbience?.('GAMMA');
    if (isRegistryMode && phase === 'ACTIVE') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => { if (prev <= 0) { finishQuiz(); return 0; } return prev - 1; });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, isRegistryMode]);

  const handleOptionSelect = (idx: number) => {
    audioService.playClick();
    const next = [...userAnswers];
    next[currentQIndex] = idx;
    setUserAnswers(next);
    saveActiveQuiz({ topic, mode, questions, userAnswers: next, currentQIndex });
  };

  const useHint = async () => {
    if (hints[currentQIndex] || hintLoading) return;
    const success = deductBits(100);
    if (success) {
      setGame(getGameState());
      audioService.playHarveySync();
      setHintLoading(true);
      try {
        const hint = await generateHarveyHint(questions[currentQIndex].question);
        setHints({ ...hints, [currentQIndex]: hint.replace(/[*#`]/g, '') });
      } finally { setHintLoading(false); }
    }
  };

  const finishQuiz = () => {
    audioService.playLevelUp();
    const score = userAnswers.reduce((acc, ans, idx) => ans === questions[idx].correctAnswerIndex ? acc + 1 : acc, 0);
    saveQuizResult({ 
      topic, score, total: questions.length, date: new Date().toISOString(), 
      missedQuestions: questions.map((q, i) => userAnswers[i] !== q.correctAnswerIndex ? { question: q.question, userAnswer: q.options[userAnswers[i]], correctAnswer: q.options[q.correctAnswerIndex], topic, timestamp: new Date().toISOString() } : null).filter(Boolean) as MissedQuestion[]
    });
    setPhase('REVIEW');
    clearActiveQuiz();
  };

  if (phase === 'BRIEFING') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center relative overflow-y-auto py-24 pb-44">
      <div className="absolute inset-0 bg-medical-500/5 blur-[120px] rounded-full animate-pulse-slow"></div>
      <div className="max-w-2xl w-full space-y-12 relative z-10">
          <div className="flex justify-center scale-110 mb-6">
              <HarveyAvatar level={game.level} size="md" activeSkin={game.activeSkin} />
          </div>
          <div className="space-y-4">
              <h2 className="text-[10px] font-black text-medical-500 uppercase tracking-[0.5em]">Neural Briefing Active</h2>
              <h1 className="text-4xl md:text-7xl font-display font-black text-white leading-none uppercase tracking-tighter italic">
                Sector: {topic}
              </h1>
          </div>
          <p className="text-slate-400 text-lg md:text-2xl font-serif italic leading-relaxed">
            I have prepped a series of logic nodes to test your synchronization. Errors will cause signal degradation.
          </p>
          <div className="flex flex-col gap-4 justify-center pt-8">
              <button 
                onClick={startMission}
                className="w-full md:w-auto px-12 py-6 bg-medical-500 text-white rounded-3xl font-black uppercase text-[10px] md:text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
              >
                  Initiate Sync Mission
              </button>
              <button 
                onClick={() => onNavigate(AppView.HOME)}
                className="w-full md:w-auto px-12 py-6 bg-slate-900 text-slate-500 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] border border-white/5 active:scale-95 transition-all"
              >
                  Abort Protocol
              </button>
          </div>
      </div>
    </div>
  );

  if (phase === 'LOADING') return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 p-10">
      <div className="relative mb-12">
          <div className="w-20 h-20 border-2 border-slate-900 border-t-medical-500 rounded-full animate-spin"></div>
          <i className="fas fa-satellite absolute inset-0 flex items-center justify-center text-xl text-medical-500 animate-pulse"></i>
      </div>
      <div className="text-center space-y-4">
        <h2 className="text-sm font-black text-white uppercase tracking-[0.5em]">Establishing Protocol</h2>
        <div className="space-y-1">
            {syncStatus.map((s, i) => (
                <p key={i} className="text-[8px] font-mono text-slate-600 uppercase tracking-widest animate-pulse">{s}</p>
            ))}
        </div>
      </div>
    </div>
  );

  const activeQ = questions[currentQIndex];
  const isLast = currentQIndex === questions.length - 1;

  if (phase === 'REVIEW') {
      const score = userAnswers.reduce((acc, ans, idx) => ans === questions[idx].correctAnswerIndex ? acc + 1 : acc, 0);
      const percent = Math.round((score / questions.length) * 100);
      return (
        <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar p-6 md:p-20 pb-56">
            <div className="max-w-4xl mx-auto w-full space-y-16">
                <div className="text-center space-y-8 pt-10">
                    <div className="flex justify-center">
                        <HarveyAvatar level={game.level} size="md" isSmiling={percent > 70} activeSkin={game.activeSkin} />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-medical-500 uppercase tracking-[0.4em] mb-4">Diagnostic Debriefing</h2>
                        <h1 className="text-7xl md:text-[10rem] font-display font-black text-white tracking-tighter leading-none">{percent}%</h1>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <button onClick={() => onNavigate(AppView.HOME)} className="px-10 py-5 bg-medical-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Archive Sync</button>
                    </div>
                </div>

                <div className="space-y-10">
                    {questions.map((q, i) => (
                        <div key={i} className={`p-6 md:p-14 rounded-[2rem] md:rounded-[3rem] border-2 transition-all ${userAnswers[i] === q.correctAnswerIndex ? 'bg-teal-500/5 border-teal-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                             <div className="flex gap-6 mb-6 items-start">
                                <span className={`w-10 h-10 md:w-16 md:h-16 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-lg text-white ${userAnswers[i] === q.correctAnswerIndex ? 'bg-teal-500' : 'bg-red-500'}`}>
                                    {i+1}
                                </span>
                                <h4 className="text-lg md:text-3xl font-bold text-white leading-tight">{q.question}</h4>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white overflow-hidden relative h-full">
        
        {/* HUD Progress */}
        <div className="absolute top-0 left-0 right-0 h-1 flex gap-0.5 z-50 p-1">
            {questions.map((_, i) => (
                <div key={i} className={`flex-1 h-full rounded-full transition-all duration-700 ${i === currentQIndex ? 'bg-medical-500 shadow-[0_0_15px_#0ea5e9]' : userAnswers[i] !== -1 ? 'bg-teal-500' : 'bg-white/10'}`}></div>
            ))}
        </div>

        {/* Tactical Header */}
        <div className="pt-10 px-6 flex justify-between items-start shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-medical-500/10 border border-medical-500/20 rounded-xl flex items-center justify-center text-medical-400">
                    <i className="fas fa-microchip"></i>
                </div>
                <div>
                    <p className="text-[8px] font-black text-medical-500 uppercase tracking-widest">Node {currentQIndex + 1}</p>
                </div>
            </div>
        </div>

        {/* The Node (Question Stage) */}
        <div className="flex-1 flex flex-col items-center justify-start px-6 md:px-20 py-8 overflow-y-auto custom-scrollbar pb-56">
            <div className="max-w-3xl w-full text-center space-y-10 mb-12">
                <h2 className="text-xl md:text-5xl font-display font-black tracking-tighter uppercase leading-snug">
                    {activeQ.question}
                </h2>

                {hints[currentQIndex] && (
                    <div className="bg-teal-600/10 border border-teal-500/30 p-6 rounded-[2rem] animate-in zoom-in-95 duration-500 text-left">
                        <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-2">Navigator Briefing</p>
                        <p className="text-teal-50 text-sm md:text-2xl font-serif italic leading-relaxed">
                            {hints[currentQIndex]}
                        </p>
                    </div>
                )}
            </div>

            {/* Answer Options Grid */}
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
                {activeQ.options.map((opt, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        className={`flex items-center gap-4 p-5 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden
                        ${userAnswers[currentQIndex] === idx ? 'bg-medical-500 border-white text-white shadow-xl' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                    >
                        <span className={`w-8 h-8 md:w-14 md:h-14 shrink-0 rounded-lg md:rounded-2xl border flex items-center justify-center font-black text-xs md:text-xl ${userAnswers[currentQIndex] === idx ? 'bg-white text-medical-500' : 'border-slate-800'}`}>
                            {String.fromCharCode(65+idx)}
                        </span>
                        <span className="font-bold text-sm md:text-2xl leading-tight relative z-10">{opt}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Action Tray - Spaced high to avoid mobile nav bar overlap */}
        <div className="absolute bottom-20 left-0 right-0 bg-black/80 border-t border-white/5 p-4 md:p-6 shrink-0 backdrop-blur-2xl z-[400]">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <button 
                    onClick={useHint}
                    disabled={hintLoading || !!hints[currentQIndex]}
                    className="flex items-center gap-3 px-5 py-4 bg-white/5 border border-white/10 text-slate-500 hover:text-teal-400 rounded-2xl font-black uppercase text-[8px] tracking-widest transition-all"
                >
                    <i className={`fas ${hintLoading ? 'fa-circle-notch fa-spin' : 'fa-brain'}`}></i>
                    <span className="hidden sm:inline">Sync Hint</span>
                </button>

                <button 
                    onClick={() => isLast ? finishQuiz() : setCurrentQIndex(prev => prev + 1)}
                    disabled={userAnswers[currentQIndex] === -1}
                    className={`flex-1 md:flex-none px-12 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4
                    ${userAnswers[currentQIndex] !== -1 ? 'bg-medical-500 text-white hover:scale-105 shadow-medical-500/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                    {isLast ? 'Finalize' : 'Next Node'}
                    <i className="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    </div>
  );
};
