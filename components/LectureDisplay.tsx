import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Topic, AppView, QuizMode, SubTopic } from '../types';
import { generateLectureScript } from '../services/geminiService';
import { PREGENERATED_CURRICULUM } from '../services/curriculumData';
import { AudioNarrator } from './AudioNarrator';
import { vaultItem, getGameState, getContentCache, addXP, saveContentCache, saveLessonProgress, getLessonProgress } from '../services/persistenceService';
import { audioService } from '../services/audioService';
import { InteractiveNode } from './InteractiveNode';
import { VisualAid } from './VisualAid';
import { HarveyAvatar } from './HarveyAvatar';

interface LectureDisplayProps {
  topic: Topic;
  subTopic?: SubTopic;
  voiceName: string;
  onNavigate: (view: AppView, topic?: Topic, mode?: QuizMode) => void;
}

export const LectureDisplay: React.FC<LectureDisplayProps> = ({ topic, subTopic, voiceName, onNavigate }) => {
  const [script, setScript] = useState<string>('');
  const [currentScene, setCurrentScene] = useState(0);
  const [phase, setPhase] = useState<'LOADING' | 'PRESENTATION'>('LOADING');
  const [completedScenes, setCompletedScenes] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [autoNarrate, setAutoNarrate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lectureRef = useRef<HTMLDivElement>(null);
  const game = getGameState();
  const subTopicId = subTopic?.id || 'main';
  const staticData = subTopic ? PREGENERATED_CURRICULUM[subTopic.id] : null;

  useEffect(() => {
    const fetchData = async () => {
        const cacheKey = `story_v9_${topic}_${subTopicId}`;
        const cachedScript = getContentCache(cacheKey);
        
        setPhase('LOADING');
        setCurrentScene(0);

        const progress = getLessonProgress(subTopicId);
        setCompletedScenes(new Set(progress));

        if (staticData?.fullLecture) {
            setScript(staticData.fullLecture);
            setPhase('PRESENTATION');
            return;
        }

        if (cachedScript) {
            setScript(cachedScript);
            setPhase('PRESENTATION');
            return;
        }

        try {
          const scriptData = await generateLectureScript(topic, subTopic);
          setScript(scriptData);
          setPhase('PRESENTATION');
          saveContentCache(cacheKey, scriptData);
        } catch (e) {
          setScript("Error re-establishing story link. Narrative corrupted.");
        }
    };
    fetchData();
  }, [topic, subTopicId, staticData]);

  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    audioService.playClick();
    if (!document.fullscreenElement) {
        lectureRef.current?.requestFullscreen().catch(err => {
            console.error(`Fullscreen Error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  const scenes = useMemo(() => {
    if (!script) return [];
    const cleanedScript = script.replace(/[*#`]/g, '');
    const rawParts = cleanedScript.split(/(Part \d:)/i).filter(p => p.trim() && !p.match(/Part \d:/i));
    const titles = ["The Core Principle", "Functional Logic", "Technical Manifest", "Clinical Evolution"];
    
    return rawParts.map((content, i) => ({
      id: i,
      title: titles[i] || `Chapter 0${i + 1}`,
      content: content.trim(),
      icon: ['fa-microscope', 'fa-wave-square', 'fa-stethoscope', 'fa-award'][i] || 'fa-atom'
    }));
  }, [script]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentScene]);

  const handleNext = () => {
    if (currentScene < scenes.length - 1) {
      setDirection('next');
      audioService.playClick();
      setCurrentScene(prev => prev + 1);
      
      const nextSet = new Set(completedScenes);
      nextSet.add(currentScene);
      setCompletedScenes(nextSet);
      saveLessonProgress(subTopicId, Array.from(nextSet) as number[]);
      addXP(50, 5);
    } else {
        audioService.playLevelUp();
        if (document.fullscreenElement) document.exitFullscreen();
        onNavigate(AppView.QUIZ, topic);
    }
  };

  const handleBack = () => {
    if (currentScene > 0) {
      setDirection('prev');
      audioService.playClick();
      setCurrentScene(prev => prev - 1);
    }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\{\{Concept:.*?\}\}|\[\[Diagram:.*?\]\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{Concept:')) {
        const nameMatch = part.match(/Concept: (.*?)(\||$| \||Def:)/);
        const defMatch = part.match(/Def: (.*?)(\||$| \||Tip:| Related:)/);
        return <InteractiveNode key={`tag-${i}`} topic={topic} name={nameMatch?.[1]?.trim() || 'Node'} definition={defMatch?.[1]?.trim() || 'Syncing...'} />;
      }
      if (part.startsWith('[[Diagram:')) {
        const idMatch = part.match(/Diagram: (.*?)(\||$| \||Caption:)/);
        return <div key={`diag-${i}`} className="my-8 scale-90 sm:scale-100"><VisualAid id={idMatch?.[1]?.trim() || 'wave'} /></div>;
      }
      return <span key={`text-${i}`}>{part}</span>;
    });
  };

  if (phase === 'LOADING') return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-10">
       <div className="relative mb-8">
           <div className="w-16 h-16 md:w-24 md:h-24 border-2 border-slate-900 border-t-medical-500 rounded-full animate-spin"></div>
           <i className="fas fa-book-open absolute inset-0 flex items-center justify-center text-xl md:text-2xl text-medical-500 animate-pulse"></i>
       </div>
       <p className="text-slate-500 font-black uppercase text-[8px] md:text-[10px] tracking-[0.4em]">Establishing Story Link...</p>
    </div>
  );

  const activeSceneData = scenes[currentScene];

  return (
    <div ref={lectureRef} className="h-full flex flex-col bg-slate-950 text-white overflow-hidden relative">
      {/* Progress HUD - Thin bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 flex gap-0.5 z-[100] p-1">
          {scenes.map((_, i) => (
              <div key={i} className={`flex-1 h-full rounded-full transition-all duration-700 ${i === currentScene ? 'bg-medical-500 shadow-[0_0_15px_#0ea5e9]' : i < currentScene ? 'bg-teal-500' : 'bg-white/10'}`}></div>
          ))}
      </div>

      {/* Main Narrative Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative px-6 md:px-12 pt-24 pb-64 lg:pb-44">
          <div className="max-w-3xl mx-auto">
              
              {/* Scene Branding */}
              <div className="flex flex-col items-center mb-16 text-center relative">
                  {/* Fullscreen Toggle Button */}
                  <button 
                    onClick={toggleFullscreen}
                    className="absolute -top-12 right-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-all flex items-center justify-center group"
                    title={isFullscreen ? "Exit Focus Mode" : "Enter Focus Mode"}
                  >
                    <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-xs group-hover:scale-110 transition-transform`}></i>
                  </button>

                  <div className="mb-6 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-medical-500 animate-pulse"></div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{isFullscreen ? 'Focus Mode Active' : 'Log Protocol'} / Node_{subTopicId}</span>
                  </div>
                  <div className="w-12 h-12 md:w-16 md:h-16 mb-4 bg-medical-500/10 border border-medical-500/20 rounded-2xl flex items-center justify-center text-xl md:text-2xl text-medical-400">
                      <i className={`fas ${activeSceneData.icon}`}></i>
                  </div>
                  <h2 className="text-2xl md:text-5xl font-display font-black tracking-tighter uppercase leading-tight italic bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500">{activeSceneData.title}</h2>
              </div>

              {/* The Narrative Content - Designed like a Storybook */}
              <div key={currentScene} className={`animate-in ${direction === 'next' ? 'slide-in-from-right-8' : 'slide-in-from-left-8'} duration-700 fade-in`}>
                  <div className="text-slate-200 font-serif italic text-2xl md:text-4xl leading-relaxed md:leading-[1.6] selection:bg-medical-500/30 first-letter:text-6xl md:first-letter:text-8xl first-letter:font-black first-letter:text-medical-500 first-letter:mr-2 first-letter:float-left first-letter:leading-[1]">
                      {renderContent(activeSceneData.content)}
                  </div>
                  
                  {currentScene === 0 && staticData?.harveyHint && (
                      <div className="bg-amber-500/5 border-l-4 border-amber-500/40 p-10 rounded-r-[2.5rem] mt-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><i className="fas fa-lightbulb text-[120px] text-amber-400"></i></div>
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4 flex items-center"><i className="fas fa-brain mr-2"></i> Logic Prompt</p>
                          <p className="text-amber-100/90 text-xl md:text-3xl font-medium leading-relaxed italic relative z-10">"{staticData.harveyHint.replace(/[*#`]/g, '')}"</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Floating Comms Bar */}
      <div className={`fixed bottom-24 lg:absolute lg:bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-[400] flex flex-col gap-4 ${isFullscreen ? 'bottom-8' : ''}`}>
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4">
              
              <div className="flex items-center gap-2">
                  <button 
                    onClick={handleBack} 
                    disabled={currentScene === 0} 
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border transition-all ${currentScene === 0 ? 'opacity-0 pointer-events-none' : 'bg-slate-900/90 backdrop-blur-xl border-white/10 text-slate-500 hover:text-white shadow-2xl'}`}
                  >
                      <i className="fas fa-chevron-left"></i>
                  </button>

                  <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 flex items-center gap-2 shadow-2xl">
                      <button 
                        onClick={() => { audioService.playClick(); setAutoNarrate(!autoNarrate); }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${autoNarrate ? 'bg-medical-500 text-white' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}
                        title="Toggle Neural Auto-Sync"
                      >
                        <i className={`fas ${autoNarrate ? 'fa-satellite-dish' : 'fa-volume-mute'} text-xs`}></i>
                      </button>
                      <AudioNarrator text={activeSceneData.content} voiceName={voiceName} autoPlay={autoNarrate} />
                  </div>
              </div>

              <button 
                onClick={handleNext} 
                className="group relative h-12 md:h-16 px-8 md:px-14 bg-medical-500 text-white rounded-2xl md:rounded-3xl font-black uppercase text-[10px] md:text-xs tracking-[0.3em] shadow-[0_20px_40px_rgba(14,165,233,0.4)] transition-all hover:scale-105 active:scale-95 overflow-hidden flex items-center justify-center"
              >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10 flex items-center">
                      {currentScene === scenes.length - 1 ? 'End Mission' : 'Advance'} 
                      <i className={`fas ${currentScene === scenes.length - 1 ? 'fa-flag-checkered' : 'fa-arrow-right'} ml-3 md:ml-4`}></i>
                  </span>
              </button>
          </div>
      </div>
    </div>
  );
};