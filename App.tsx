
import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { TopicContent } from './pages/TopicContent';
import { QuizPage } from './pages/QuizPage';
import { FlashcardsPage } from './pages/Flashcards';
import { VaultPage } from './pages/VaultPage';
import { GlossaryPage } from './pages/GlossaryPage';
import { NeuroDeck } from './components/NeuroDeck';
import { Sidebar } from './components/Sidebar';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { CinematicTransition } from './components/CinematicTransition';
import { AchievementToast } from './components/AchievementToast';
import { CommandCenter } from './components/CommandCenter';
import { AppView, Topic, QuizMode, UserProfile, Achievement } from './types';
import { IntroAnimation } from './components/IntroAnimation';
import { saveAppState, getAppState, getUserProfile, saveUserProfile, ACHIEVEMENTS, getProgress } from './services/persistenceService';
import { DynamicBackground } from './components/DynamicBackground';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const savedState = getAppState();
  const savedProfile = getUserProfile();
  
  const [currentView, setCurrentView] = useState<AppView>(savedState?.currentView || AppView.HOME);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(savedState?.currentTopic || null);
  const [quizMode, setQuizMode] = useState<QuizMode>(savedState?.quizMode || QuizMode.STANDARD);
  const [userProfile, setUserProfile] = useState<UserProfile>(savedProfile);
  const [userProgress, setUserProgress] = useState(getProgress());
  const [showIntro, setShowIntro] = useState(true);
  const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
  const [transitionData, setTransitionData] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    saveAppState({ currentView, currentTopic, quizMode });
  }, [currentView, currentTopic, quizMode]);

  useEffect(() => {
    setUserProgress(getProgress());
  }, [currentView]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    
    const handleExternalOpen = () => setIsCommandOpen(true);

    window.addEventListener('keydown', handleKey);
    window.addEventListener('open-command-center', handleExternalOpen);
    return () => {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('open-command-center', handleExternalOpen);
    };
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'spi_gamification_v1' && e.newValue) {
        const oldState = e.oldValue ? JSON.parse(e.oldValue) : null;
        const newState = JSON.parse(e.newValue);
        if (oldState && newState.achievements.length > oldState.achievements.length) {
          const newId = newState.achievements[newState.achievements.length - 1];
          const ach = ACHIEVEMENTS.find(a => a.id === newId);
          if (ach) setActiveAchievement(ach);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    (window as any).triggerAchievement = (id: string) => {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) setActiveAchievement(ach);
    };
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleNavigate = (view: AppView, topic?: Topic, mode: QuizMode = QuizMode.STANDARD) => {
    if (view === AppView.TOPIC && topic) {
      setTransitionData({ title: topic, subtitle: "Synchronizing Learning Module" });
      const finalizeNav = () => {
        setCurrentView(view);
        setCurrentTopic(topic);
        setQuizMode(mode);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTransitionData(null);
      };
      (window as any).pendingNav = finalizeNav;
    } else {
      setCurrentView(view);
      if (topic) setCurrentTopic(topic);
      setQuizMode(mode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    saveUserProfile(profile);
  };

  return (
    <>
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
      
      {activeAchievement && (
        <AchievementToast 
          achievement={activeAchievement} 
          onClose={() => setActiveAchievement(null)} 
        />
      )}

      {transitionData && (
        <CinematicTransition 
          title={transitionData.title} 
          subtitle={transitionData.subtitle} 
          onComplete={() => (window as any).pendingNav()}
        />
      )}

      <CommandCenter 
        isOpen={isCommandOpen} 
        onClose={() => setIsCommandOpen(false)} 
        onNavigate={handleNavigate} 
      />

      {!userProfile.onboardingCompleted && !showIntro && (
        <OnboardingTutorial onComplete={handleOnboardingComplete} />
      )}

      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 font-sans text-slate-800 relative overflow-hidden">
        <DynamicBackground />
        
        {/* Main Application Shell */}
        <div className="w-full min-h-screen lg:h-[95vh] lg:max-w-[1700px] lg:m-4 xl:m-6 bg-white/5 lg:bg-white lg:rounded-[4rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)] flex flex-col lg:flex-row relative overflow-hidden transition-all duration-700 ease-in-out z-10 lg:border lg:border-white/20">
          
          <Sidebar 
            currentView={currentView} 
            currentTopic={currentTopic} 
            onNavigate={handleNavigate} 
            userProgress={userProgress} 
          />

          <main className="flex-1 z-10 relative flex flex-col min-h-0 overflow-hidden">
            {/* Background Texture for Main Area */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]"></div>
            
            <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar flex flex-col h-full">
              {currentView === AppView.HOME && <Home onNavigate={handleNavigate} />}
              {currentView === AppView.TOPIC && currentTopic && <TopicContent topic={currentTopic} onNavigate={handleNavigate} />}
              {currentView === AppView.QUIZ && <QuizPage onNavigate={handleNavigate} topic={currentTopic || Topic.PHYSICS} mode={quizMode} />}
              {currentView === AppView.FLASHCARDS && currentTopic && <FlashcardsPage topic={currentTopic} onNavigate={handleNavigate} />}
              {currentView === AppView.VAULT && <VaultPage onNavigate={handleNavigate} />}
              {currentView === AppView.GLOSSARY && <GlossaryPage onNavigate={handleNavigate} />}
              {currentView === AppView.NEURO_DECK && <NeuroDeck />}
            </div>

            {/* Floating Command Trigger - Repositioned for Mobile Safety */}
            <button 
              onClick={() => { audioService.playClick(); setIsCommandOpen(true); }}
              className="fixed top-4 right-4 lg:top-auto lg:bottom-12 lg:right-12 w-12 h-12 md:w-16 md:h-16 bg-slate-900 text-medical-400 border-2 border-medical-500/20 rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[150] hover:bg-slate-950 group overflow-hidden"
              aria-label="Open Command Center"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-medical-500/10 to-transparent group-hover:opacity-100 transition-opacity opacity-0"></div>
               <i className="fas fa-terminal text-base md:text-xl group-hover:rotate-12 transition-transform relative z-10"></i>
               <div className="absolute -top-1 -right-1 w-2 h-2 md:w-4 md:h-4 bg-teal-500 rounded-full border border-white animate-pulse"></div>
            </button>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
