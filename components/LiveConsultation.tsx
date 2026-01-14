
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Topic } from '../types';
import { audioService } from '../services/audioService';

interface LiveConsultationProps {
  topic: Topic;
  onClose: () => void;
}

export const LiveConsultation: React.FC<LiveConsultationProps> = ({ topic, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const sessionRef = useRef<any>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    audioService.playHarveySync();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            setError("Synchronization failure. Retrying link...");
          },
          onclose: () => {
            setIsActive(false);
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: `You are Harvey, a seasoned and paternal Ultrasound Physics expert. 
          You are currently in a live link with a student discussing ${topic}. 
          Keep your answers brisk, encouraging, and highly technical yet clear. 
          Reference clinical analogies frequently.`,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or link corrupted.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    sourcesRef.current.forEach(s => s.stop());
    setIsActive(false);
  };

  const decode = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const createBlob = (data: Float32Array): Blob => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white relative overflow-hidden">
      {/* Background Pulse */}
      <div className={`absolute inset-0 bg-medical-500/5 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-medical-500/10 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-10">
          {!isActive && !isConnecting && (
              <div className="text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 border-2 border-medical-500 flex items-center justify-center text-3xl mb-8 mx-auto shadow-2xl">
                      <i className="fas fa-microphone text-medical-400"></i>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Harvey Live Sync</h3>
                  <p className="text-slate-500 text-sm font-serif italic mb-10 max-w-sm mx-auto">
                    "Ready to discuss ${topic} in real-time? I'll be listening to your queries through the neural link."
                  </p>
                  <button 
                    onClick={startSession}
                    className="px-12 py-5 bg-medical-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
                  >
                    Establish Live Link
                  </button>
              </div>
          )}

          {isConnecting && (
              <div className="text-center flex flex-col items-center">
                  <div className="w-32 h-32 border-4 border-slate-900 border-t-medical-500 rounded-full animate-spin mb-10"></div>
                  <p className="text-medical-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Syncing Protocols...</p>
              </div>
          )}

          {isActive && (
              <div className="w-full h-full flex flex-col items-center">
                  {/* Real-time Waveform Visualization */}
                  <div className="flex-1 flex items-center justify-center space-x-1.5 h-32 w-full max-w-md">
                      {[...Array(24)].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-1.5 bg-medical-500 rounded-full transition-all duration-150 animate-waveform-bounce"
                            style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.05}s` }}
                          ></div>
                      ))}
                  </div>

                  <div className="w-full max-w-2xl bg-slate-900/60 p-10 rounded-[3rem] border border-white/10 backdrop-blur-md mb-12">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Real-time Briefing Stream</p>
                      <div className="h-40 overflow-y-auto font-serif italic text-xl text-medical-100 leading-relaxed custom-scrollbar">
                          {transcription || "Listening for student input..."}
                      </div>
                  </div>

                  <button 
                    onClick={stopSession}
                    className="px-12 py-5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all"
                  >
                    Disconnect Link
                  </button>
              </div>
          )}

          {error && (
              <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-xs font-black uppercase tracking-widest flex items-center">
                  <i className="fas fa-exclamation-triangle mr-3"></i> {error}
              </div>
          )}
      </div>

      <style>{`
        @keyframes waveform-bounce {
            0%, 100% { transform: scaleY(0.6); }
            50% { transform: scaleY(1.3); }
        }
        .animate-waveform-bounce {
            animation: waveform-bounce 0.6s ease-in-out infinite;
            transform-origin: center;
        }
      `}</style>
    </div>
  );
};
