
import React, { useState, useMemo } from 'react';
import { audioService } from '../services/audioService';

export const FormulaLab: React.FC = () => {
  const [activeFormula, setActiveFormula] = useState<'DOPPLER' | 'RANGE'>('DOPPLER');
  
  // Doppler States
  const [velocity, setVelocity] = useState(100); // cm/s
  const [frequency, setFrequency] = useState(5); // MHz
  const [angle, setAngle] = useState(60); // Degrees
  
  // Range States
  const [depth, setDepth] = useState(7); // cm
  const [speed, setSpeed] = useState(1540); // m/s

  const dopplerShift = useMemo(() => {
    const angleRad = (angle * Math.PI) / 180;
    // fd = (2 * f * v * cos(theta)) / c
    return (2 * frequency * 1000000 * velocity * 0.01 * Math.cos(angleRad)) / 1540;
  }, [velocity, frequency, angle]);

  const goTime = useMemo(() => {
    // 13us rule check: time = (depth * 2) / (speed / 10000)
    return (depth * 2 * 10000) / speed; // in microseconds
  }, [depth, speed]);

  return (
    <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-medical-500/5 blur-[100px] pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center">
            <i className="fas fa-flask mr-4 text-medical-500"></i> Neural Formula Lab
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Mathematical Relation Visualizer</p>
        </div>
        
        <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5">
          <button 
            onClick={() => { audioService.playClick(); setActiveFormula('DOPPLER'); }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFormula === 'DOPPLER' ? 'bg-medical-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Doppler Equation
          </button>
          <button 
            onClick={() => { audioService.playClick(); setActiveFormula('RANGE'); }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFormula === 'RANGE' ? 'bg-medical-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Range Equation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-8">
          {activeFormula === 'DOPPLER' ? (
            <>
              <div className="space-y-6">
                <FormulaSlider 
                  label="Blood Velocity (v)" 
                  unit="cm/s" 
                  value={velocity} 
                  min={20} 
                  max={300} 
                  onChange={setVelocity} 
                  color="text-medical-400"
                />
                <FormulaSlider 
                  label="Transducer Freq (f)" 
                  unit="MHz" 
                  value={frequency} 
                  min={2} 
                  max={12} 
                  onChange={setFrequency} 
                  color="text-teal-400"
                />
                <FormulaSlider 
                  label="Doppler Angle (θ)" 
                  unit="°" 
                  value={angle} 
                  min={0} 
                  max={85} 
                  onChange={setAngle} 
                  color="text-amber-400"
                />
              </div>
              <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Calculated Shift (f<sub>d</sub>)</p>
                <div className="text-4xl font-mono font-black text-white">
                  {Math.round(dopplerShift)} <span className="text-sm text-slate-500">Hz</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-6">
                <FormulaSlider 
                  label="Reflector Depth" 
                  unit="cm" 
                  value={depth} 
                  min={1} 
                  max={20} 
                  onChange={setDepth} 
                  color="text-medical-400"
                />
                <FormulaSlider 
                  label="Propagation Speed" 
                  unit="m/s" 
                  value={speed} 
                  min={300} 
                  max={4000} 
                  onChange={setSpeed} 
                  color="text-teal-400"
                />
              </div>
              <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Round Trip Time</p>
                <div className="text-4xl font-mono font-black text-white">
                  {goTime.toFixed(1)} <span className="text-sm text-slate-500">μs</span>
                </div>
                <p className="text-[9px] font-bold text-slate-500 mt-4 italic">
                  *The 13μs rule assumes speed = 1540m/s
                </p>
              </div>
            </>
          )}
        </div>

        {/* Visualization Column */}
        <div className="lg:col-span-7 bg-black/60 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center p-8 relative min-h-[400px]">
          {activeFormula === 'DOPPLER' ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <svg viewBox="0 0 400 200" className="w-full h-auto">
                {/* Original Wave */}
                <path 
                  d={generateWavePath(400, 50, frequency * 2, 0)} 
                  fill="none" 
                  stroke="#1e293b" 
                  strokeWidth="2" 
                />
                {/* Shifted Wave */}
                <path 
                  d={generateWavePath(400, 50, frequency * 2 + (dopplerShift / 200), Date.now() / 1000)} 
                  fill="none" 
                  stroke={angle > 60 ? "#ef4444" : "#14b8a6"} 
                  strokeWidth="3" 
                  className="transition-colors duration-500"
                />
                <text x="10" y="190" fill="#14b8a6" className="text-[10px] font-black uppercase">Received Echo Spectrum</text>
              </svg>
              <div className="mt-8 flex items-center space-x-6">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mb-2 ${angle > 60 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-teal-500'}`}></div>
                  <span className="text-[8px] font-black text-slate-500 uppercase">Accuracy</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-lg font-black text-white">{Math.cos(angle * Math.PI / 180).toFixed(2)}</div>
                  <span className="text-[8px] font-black text-slate-500 uppercase">Cosine θ</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
               <div className="relative w-full h-32 bg-slate-800/30 rounded-2xl overflow-hidden mb-8 border border-white/5">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-medical-500"></div>
                  {/* Pulse */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-medical-500/50 rounded-full animate-ping-horizontal"
                    style={{ left: `${(Date.now() % 2000) / 20}%` }}
                  ></div>
                  {/* Target */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-12 bg-white rounded-lg shadow-[0_0_15px_white]"
                    style={{ left: `${(depth / 20) * 100}%` }}
                  ></div>
               </div>
               <div className="text-center">
                  <p className="text-white font-black text-xl mb-2">Target Locked at {depth} cm</p>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Calculated using C = {speed} m/s</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FormulaSlider: React.FC<{ label: string; unit: string; value: number; min: number; max: number; onChange: (v: number) => void; color: string }> = ({ label, unit, value, min, max, onChange, color }) => (
  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
    <div className="flex justify-between items-center mb-4">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <span className={`font-mono text-sm font-black ${color}`}>{value} {unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={(e) => { audioService.playClick(); onChange(parseInt(e.target.value)); }} 
      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
    />
  </div>
);

const generateWavePath = (width: number, height: number, freq: number, phase: number) => {
  let path = `M 0 ${height}`;
  for (let x = 0; x <= width; x++) {
    const y = height + Math.sin((x / width) * Math.PI * 2 * freq + phase) * 30;
    path += ` L ${x} ${y}`;
  }
  return path;
};
