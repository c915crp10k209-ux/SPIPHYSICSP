
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { HarveyAvatar } from './HarveyAvatar';
import { audioService } from '../services/audioService';
import { saveUserProfile, getUserProfile } from '../services/persistenceService';

interface OnboardingTutorialProps {
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());

  const totalSteps = 4;

  const handleNext = () => {
    audioService.playClick();
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      audioService.playSuccess();
      onComplete({ ...profile, onboardingCompleted: true });
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    const next = { ...profile, ...updates };
    setProfile(next);
    saveUserProfile(next);
  };

  const isNextDisabled = () => {
    if (step === 1 && !profile.name.trim()) return true;
    if (step === 2 && !profile.birthdate) return true;
    return false;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-medical-500/10 blur-[120px] rounded-full animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl shadow-medical-500/10 overflow-hidden flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
          <div 
            className="h-full bg-medical-500 transition-all duration-700 shadow-[0_0_10px_#0ea5e9]"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>

        <div className="p-8 md:p-12 flex-1 flex flex-col">
          {step === 0 && (
            <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
              <HarveyAvatar level={1} size="lg" />
              <h2 className="text-3xl font-display font-black text-white mt-10 mb-4 uppercase tracking-tight">System Initialized</h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 font-serif italic">
                "Hello there, student. I'm Harvey. I'll be your guide through the intricacies of sonography physics. Let's calibrate your profile to begin."
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center space-x-6 mb-8">
                <HarveyAvatar level={1} size="sm" />
                <h3 className="text-xl font-black text-white uppercase tracking-widest">Protocol: Identity</h3>
              </div>
              <p className="text-slate-400 mb-8 text-lg font-serif italic">"What should I call you during our sessions?"</p>
              <div className="relative group">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Enter your name..."
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && !isNextDisabled() && handleNext()}
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-8 py-5 text-xl text-white placeholder-slate-700 focus:border-medical-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center space-x-6 mb-8">
                <HarveyAvatar level={1} size="sm" />
                <h3 className="text-xl font-black text-white uppercase tracking-widest">Protocol: Temporal</h3>
              </div>
              <p className="text-slate-400 mb-8 text-lg font-serif italic">"And your date of origin? For the records, of course."</p>
              <input 
                type="date"
                value={profile.birthdate}
                onChange={(e) => updateProfile({ birthdate: e.target.value })}
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-8 py-5 text-xl text-white focus:border-medical-500 focus:outline-none transition-all shadow-inner color-scheme-dark"
              />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center space-x-6 mb-8">
                <HarveyAvatar level={1} size="sm" />
                <h3 className="text-xl font-black text-white uppercase tracking-widest">Archive Management</h3>
              </div>
              <p className="text-slate-400 mb-8 text-lg font-serif italic">"I can store your details in the Local Memory Vault for a persistent experience."</p>
              
              <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 space-y-6">
                <label className="flex items-start space-x-4 cursor-pointer group">
                  <div className="relative mt-1">
                    <input 
                      type="checkbox"
                      checked={profile.saveDetails}
                      onChange={(e) => updateProfile({ saveDetails: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="w-6 h-6 border-2 border-slate-700 rounded-lg bg-slate-900 transition-all peer-checked:bg-medical-500 peer-checked:border-medical-500"></div>
                    <i className="fas fa-check absolute inset-0 flex items-center justify-center text-[10px] text-white opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                  </div>
                  <div>
                    <span className="text-white font-bold text-lg block mb-1">Save my details locally</span>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Enabling this saves your name and progress to your browser's persistent storage.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-medical-500 text-white rounded-[2rem] flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(14,165,233,0.3)] mb-8">
                <i className="fas fa-check-double"></i>
              </div>
              <h2 className="text-3xl font-display font-black text-white mb-4 uppercase tracking-tight">Calibration Complete</h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 font-serif italic max-w-sm">
                "Splendid. You're all set, {profile.name}. Let's dive into the world of Ultrasound Physics."
              </p>
            </div>
          )}

          <div className="mt-auto pt-10 flex items-center justify-between">
            <div className="flex space-x-2">
              {[...Array(totalSteps + 1)].map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-medical-500' : 'w-1.5 bg-slate-800'}`}></div>
              ))}
            </div>
            
            <div className="flex space-x-4">
              {step > 0 && step < totalSteps && (
                <button 
                  onClick={() => { audioService.playClick(); setStep(step - 1); }}
                  className="px-6 py-4 text-slate-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-colors"
                >
                  Back
                </button>
              )}
              <button 
                onClick={handleNext}
                disabled={isNextDisabled()}
                className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center shadow-xl
                  ${isNextDisabled() ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-medical-500 text-white hover:scale-105 active:scale-95 shadow-medical-500/20'}`}
              >
                {step === totalSteps ? 'Enter System' : 'Proceed'} <i className="fas fa-arrow-right ml-3"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .color-scheme-dark {
          color-scheme: dark;
        }
      `}</style>
    </div>
  );
};
