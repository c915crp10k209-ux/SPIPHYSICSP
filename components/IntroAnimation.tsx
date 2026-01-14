import React, { useEffect, useState } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Prevent scrolling during intro
    document.body.style.overflow = 'hidden';

    // Timeline sequence
    const timers = [
      setTimeout(() => setStep(1), 800),  // "Physics"
      setTimeout(() => setStep(2), 2000), // "Artifacts"
      setTimeout(() => setStep(3), 3200), // "Mastery"
      setTimeout(() => setStep(4), 4500), // Logo Reveal
    ];
    
    return () => {
      timers.forEach(clearTimeout);
      // Restore scroll only if not exiting yet (onComplete will handle final cleanup in App)
      document.body.style.overflow = '';
    };
  }, []);

  const handleStart = () => {
    setExiting(true);
    setTimeout(() => {
        document.body.style.overflow = ''; // Ensure overflow is restored
        onComplete();
    }, 800);
  };

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950 overflow-hidden transition-all duration-1000 ${exiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Dynamic Background Waves (Pulse Effect) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="absolute border border-teal-500/20 rounded-full animate-sonar-pulse"
            style={{ 
              width: '0px', 
              height: '0px',
              animationDelay: `${i * 1.5}s`
            }}
          ></div>
        ))}
      </div>

      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none">
         <div className="absolute inset-0" 
              style={{ 
                  backgroundImage: 'radial-gradient(circle, #2dd4bf 1px, transparent 1px)', 
                  backgroundSize: '60px 60px' 
              }}>
         </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 text-center px-4 w-full max-w-lg">
        
        {/* Animated Text Sequence */}
        <div className="h-24 md:h-32 flex items-center justify-center mb-8">
            {step === 1 && (
                <h2 className="text-3xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-teal-400 animate-fade-in-up tracking-[0.2em] uppercase">
                    Physics
                </h2>
            )}
            {step === 2 && (
                <h2 className="text-3xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-medical-300 to-medical-500 animate-fade-in-up tracking-[0.2em] uppercase">
                    Artifacts
                </h2>
            )}
            {step === 3 && (
                <h2 className="text-3xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-medical-400 animate-fade-in-up tracking-[0.2em] uppercase">
                    Mastery
                </h2>
            )}
        </div>

        {/* Final Logo Reveal */}
        <div className={`transition-all duration-1000 transform ${step >= 4 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>
             <div className="relative inline-block mb-10">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 border-2 border-teal-500/30 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent"></div>
                    <i className="fas fa-wave-square text-3xl md:text-4xl text-teal-400"></i>
                </div>
                {/* Outer Glow Ring */}
                <div className="absolute -inset-4 border border-teal-500/10 rounded-full animate-pulse"></div>
             </div>

             <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-3 tracking-tighter uppercase">
                SPIPHYSIC<span className="text-teal-400">.COM</span>
             </h1>
             <p className="text-slate-500 text-sm md:text-base font-bold mb-12 tracking-[0.4em] uppercase opacity-80">
                Registry Readiness Protocol
             </p>

             <button 
                onClick={handleStart}
                className="group relative px-12 py-5 bg-teal-500 text-white overflow-hidden rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-teal-500/20"
             >
                <div className="absolute inset-0 w-full h-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 font-black text-[10px] md:text-xs tracking-[0.3em] uppercase flex items-center justify-center">
                    Initiate Link <i className="fas fa-arrow-right ml-4 group-hover:translate-x-2 transition-transform"></i>
                </span>
             </button>
        </div>

      </div>

      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sonar-pulse {
            0% { width: 0; height: 0; opacity: 0.8; border-width: 4px; }
            100% { width: 1500px; height: 1500px; opacity: 0; border-width: 1px; }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-sonar-pulse {
            animation: sonar-pulse 4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};