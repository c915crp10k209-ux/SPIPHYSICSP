
import React, { useState, useMemo } from 'react';
import { AppView, Topic } from '../types';
import { audioService } from '../services/audioService';
import { chatWithTutor } from '../services/geminiService';
import { VisualAid } from '../components/VisualAid';

interface GlossaryTerm {
  term: string;
  definition: string;
  mnemonic?: string;
  topic: Topic;
  visualId?: string;
}

const GLOSSARY_DATA: GlossaryTerm[] = [
  {
    term: "Axial Resolution",
    definition: "The ability of a system to display two structures that are very close together when the structures are parallel to the sound beam's main axis.",
    mnemonic: "LARRD: Longitudinal, Axial, Range, Radial, Depth.",
    topic: Topic.RESOLUTION,
    visualId: "resolution"
  },
  {
    term: "Lateral Resolution",
    definition: "The ability to distinctly identify two structures that are very close together when they are side by side or perpendicular to the sound beam's main axis.",
    mnemonic: "LATA: Lateral, Angular, Transverse, Azimuthal.",
    topic: Topic.RESOLUTION,
    visualId: "resolution"
  },
  {
    term: "Snell's Law",
    definition: "A physics principle that defines the physics of refraction—the bending of a sound wave as it passes from one medium into another.",
    topic: Topic.PHYSICS,
    visualId: "refraction"
  },
  {
    term: "Nyquist Limit",
    definition: "The highest Doppler frequency or velocity that can be measured without the appearance of aliasing.",
    mnemonic: "Limit = 1/2 PRF.",
    topic: Topic.DOPPLER,
    visualId: "doppler"
  },
  {
    term: "Aliasing",
    definition: "An artifact that occurs when the Doppler shift exceeds the Nyquist limit, causing the spectral display or color Doppler to 'wrap around'.",
    topic: Topic.DOPPLER,
    visualId: "doppler"
  },
  {
    term: "Mechanical Index (MI)",
    definition: "A calculation used to estimate the potential for bioeffects resulting from cavitation.",
    topic: Topic.SAFETY
  },
  {
    term: "Thermal Index (TI)",
    definition: "A calculation used to estimate the potential for a rise in tissue temperature resulting from ultrasound exposure.",
    topic: Topic.SAFETY
  },
  {
    term: "ALARA",
    definition: "As Low As Reasonably Achievable; a safety principle that states ultrasound exposure should be kept to the minimum necessary for a diagnosis.",
    topic: Topic.SAFETY
  },
  {
    term: "Duty Factor",
    definition: "The percentage or fraction of time that the system transmits a pulse.",
    topic: Topic.PULSED_WAVE,
    visualId: "wave"
  },
  {
    term: "Pulse Repetition Frequency (PRF)",
    definition: "The number of pulses that an ultrasound system transmits into the body each second.",
    topic: Topic.PULSED_WAVE,
    visualId: "wave"
  },
  {
    term: "Piezoelectric Effect",
    definition: "The property of certain materials to create a voltage when they are mechanically deformed or when pressure is applied to them.",
    topic: Topic.TRANSDUCERS,
    visualId: "pzt"
  },
  {
    term: "Curie Point",
    definition: "The temperature at which PZT is polarized. Heating the transducer above this point results in depolarization (loss of piezoelectric properties).",
    topic: Topic.TRANSDUCERS,
    visualId: "pzt"
  },
  {
    term: "Matching Layer",
    definition: "The component of the transducer that has an impedance between those of the active element and the skin to increase the efficiency of sound transmission.",
    topic: Topic.TRANSDUCERS,
    visualId: "pzt"
  },
  {
    term: "Attenuation",
    definition: "The decrease in intensity, power, and amplitude as sound travels through a medium.",
    topic: Topic.PHYSICS,
    visualId: "wavelength"
  },
  {
    term: "Rayleigh Scattering",
    definition: "A special form of scattering that occurs when the structure's dimensions are much smaller than the beam's wavelength (e.g., red blood cells).",
    topic: Topic.PHYSICS,
    visualId: "wave"
  },
  {
    term: "Bernoulli's Principle",
    definition: "Describes the relationship between pressure and velocity in moving fluid—where velocity increases, pressure decreases.",
    topic: Topic.HEMODYNAMICS
  },
  {
    term: "Poiseuille's Law",
    definition: "Relationship between pressure, viscosity, and flow in a vessel.",
    topic: Topic.HEMODYNAMICS
  },
  {
    term: "Harmonic Frequency",
    definition: "Twice the fundamental (transmitted) frequency; created by non-linear propagation of sound waves in tissue.",
    topic: Topic.HARMONICS,
    visualId: "wave"
  }
];

interface GlossaryPageProps {
  onNavigate: (view: AppView, topic?: Topic) => void;
}

export const GlossaryPage: React.FC<GlossaryPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | 'ALL'>('ALL');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [activeVisual, setActiveVisual] = useState<string | null>(null);
  const [harveyInsight, setHarveyInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const filteredTerms = useMemo(() => {
    return GLOSSARY_DATA.filter(t => {
      const matchesSearch = t.term.toLowerCase().includes(search.toLowerCase()) || 
                           t.definition.toLowerCase().includes(search.toLowerCase());
      const matchesTopic = selectedTopic === 'ALL' || t.topic === selectedTopic;
      return matchesSearch && matchesTopic;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [search, selectedTopic]);

  const handleDeepSync = async (term: string) => {
    audioService.playClick();
    setLoadingInsight(true);
    setExpandedTerm(term);
    setActiveVisual(null);
    setHarveyInsight(null);
    try {
      const insight = await chatWithTutor(Topic.PHYSICS, `Can you give me a more detailed, expert explanation of the term "${term}" as it relates to the SPI exam? Use a good clinical analogy.`, []);
      setHarveyInsight(insight);
    } catch (e) {
      setHarveyInsight("Connection lost. Try syncing again later, student.");
    } finally {
      setLoadingInsight(false);
    }
  };

  const toggleVisual = (term: string) => {
    audioService.playClick();
    if (activeVisual === term) {
        setActiveVisual(null);
    } else {
        setActiveVisual(term);
        setExpandedTerm(null);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto h-full flex flex-col overflow-hidden bg-slate-50/10">
      
      <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tight mb-2">
            The <span className="text-medical-500">Glossary</span>
          </h1>
          <p className="text-slate-500 font-medium">Quick reference for the SPI physics lexicon.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search for terms or keywords..." 
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-medical-500 transition-all shadow-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto space-x-2 pb-2 md:pb-0 scrollbar-hide no-scrollbar">
          <button 
            onClick={() => { audioService.playClick(); setSelectedTopic('ALL'); }}
            className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap ${selectedTopic === 'ALL' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:border-medical-300'}`}
          >
            All
          </button>
          {[Topic.PHYSICS, Topic.TRANSDUCERS, Topic.RESOLUTION, Topic.DOPPLER, Topic.SAFETY, Topic.HEMODYNAMICS].map(topic => (
            <button 
              key={topic}
              onClick={() => { audioService.playClick(); setSelectedTopic(topic); }}
              className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap ${selectedTopic === topic ? 'bg-medical-500 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:border-medical-300'}`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-32">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((item) => (
            <div key={item.term} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-medical-500 tracking-[0.2em] mb-2 block">{item.topic}</span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{item.term}</h3>
                  </div>
                  <div className="flex space-x-2">
                    {item.visualId && (
                        <button 
                            onClick={() => toggleVisual(item.term)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${activeVisual === item.term ? 'bg-medical-500 text-white border-medical-600' : 'bg-medical-50 text-medical-500 border-medical-100 hover:bg-medical-100'}`}
                        >
                            <i className={`fas ${activeVisual === item.term ? 'fa-eye-slash' : 'fa-wave-square'} ${activeVisual !== item.term ? 'animate-pulse' : ''}`}></i> 
                            {activeVisual === item.term ? 'Close Visual' : 'Visual Link'}
                        </button>
                    )}
                    <button 
                      onClick={() => handleDeepSync(item.term)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${expandedTerm === item.term ? 'bg-slate-900 text-white border-slate-950' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-medical-300 hover:text-medical-500'}`}
                    >
                      <i className="fas fa-robot mr-2"></i> Deep Sync
                    </button>
                    <button 
                      onClick={() => onNavigate(AppView.TOPIC, item.topic)}
                      className="px-4 py-2 bg-teal-50 text-teal-600 border border-teal-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all"
                    >
                      <i className="fas fa-graduation-cap mr-2"></i> View Module
                    </button>
                  </div>
                </div>

                <p className="text-slate-600 text-lg font-medium font-serif italic mb-6 leading-relaxed">
                  "{item.definition}"
                </p>

                {item.mnemonic && (
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start space-x-4 mb-6 animate-in slide-in-from-left-4 duration-300">
                    <i className="fas fa-lightbulb text-amber-500 text-lg mt-1"></i>
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Neural Mnemonic</p>
                      <p className="text-amber-900 font-bold">{item.mnemonic}</p>
                    </div>
                  </div>
                )}

                {/* Interactive Visual Section */}
                {activeVisual === item.term && item.visualId && (
                  <div className="mt-6 pt-6 border-t border-slate-100 animate-in zoom-in-95 duration-500">
                     <div className="bg-slate-950 rounded-[2rem] p-4 md:p-8 border border-medical-500/20 shadow-inner">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-medical-500/10 flex items-center justify-center text-medical-500">
                                    <i className="fas fa-vial text-xs"></i>
                                </div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calibration Bench: {item.term}</h5>
                            </div>
                            <div className="flex gap-1">
                                <div className="w-1 h-1 bg-medical-500 rounded-full animate-ping"></div>
                                <div className="w-1 h-1 bg-medical-500/40 rounded-full"></div>
                            </div>
                        </div>
                        <VisualAid id={item.visualId} caption={`Interactive simulation for ${item.term}. Adjust parameters to observe physics behavior.`} />
                     </div>
                  </div>
                )}

                {/* AI Deep Sync Section */}
                {expandedTerm === item.term && (
                  <div className="mt-6 pt-6 border-t border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-medical-400">
                            <i className="fas fa-brain text-xs"></i>
                        </div>
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Harvey's Calibration Data</h5>
                    </div>
                    
                    {loadingInsight ? (
                      <div className="flex items-center space-x-3 py-4">
                        <div className="w-2 h-2 bg-medical-500 rounded-full animate-ping"></div>
                        <span className="text-xs font-black text-medical-500/50 uppercase tracking-widest">Accessing Knowledge Core...</span>
                      </div>
                    ) : (
                      <div className="prose prose-sm prose-medical max-w-none text-slate-700 bg-slate-50 p-8 rounded-3xl border border-slate-100 leading-relaxed font-sans text-lg italic">
                        {harveyInsight}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <i className="fas fa-search text-slate-200 text-5xl mb-6"></i>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No terms found</h3>
            <p className="text-slate-400">Try searching for a different keyword or topic.</p>
          </div>
        )}
      </div>
    </div>
  );
};
