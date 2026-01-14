
import React, { useState, useEffect, useRef } from 'react';
import { getNarration, getNarrationCacheKey } from '../services/geminiService';
import { getAudioSessionCache, getGameState } from '../services/persistenceService';
import { audioService } from '../services/audioService';

interface AudioNarratorProps {
  text: string;
  voiceName: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export const AudioNarrator: React.FC<AudioNarratorProps> = ({ text, voiceName: defaultVoice, autoPlay = false, onEnded }) => {
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastRequestTextRef = useRef<string>("");
  
  const game = getGameState();
  const activeVoice = game.preferredVoice || defaultVoice;
  const activeRate = game.preferredRate || 1.25;

  useEffect(() => {
    const key = getNarrationCacheKey(text, activeVoice);
    const cached = getAudioSessionCache(key);
    setIsCached(!!cached);
  }, [text, activeVoice]);

  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) { }
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const playNarration = async () => {
    if (isPlaying && lastRequestTextRef.current === text) {
      audioService.playClick();
      stopAudio();
      return;
    }

    setLoading(true);
    setIsRateLimited(false);
    lastRequestTextRef.current = text;
    
    if (!isCached) {
        audioService.playHarveySync();
    }

    try {
      const audioData = await getNarration(text, activeVoice);
      setIsCached(true); 
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBuffer = await decodeAudioData(new Uint8Array(audioData), audioContextRef.current);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = activeRate;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        if (onEnded) onEnded();
      };
      
      sourceRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Playback failed", err);
      const errStr = JSON.stringify(err);
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
        setIsRateLimited(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoPlay) {
      const t = setTimeout(() => {
        if (text) playNarration();
      }, 500);
      return () => {
        clearTimeout(t);
        stopAudio();
      };
    }
    return () => stopAudio();
  }, [text, activeVoice, autoPlay]);

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); playNarration(); }}
      disabled={loading}
      className={`flex items-center space-x-3 px-5 py-2.5 rounded-full transition-all border-2 relative overflow-hidden ${
        isRateLimited 
          ? 'bg-red-900/50 text-red-400 border-red-500/50' 
          : isPlaying 
            ? 'bg-amber-400 text-black border-amber-500 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.5)]' 
            : 'bg-slate-900/50 text-amber-400/80 border-slate-800 hover:border-amber-400/50'
      }`}
    >
      {isPlaying && (
        <div className="absolute inset-x-0 bottom-0 h-full flex items-end justify-center space-x-0.5 opacity-20 pointer-events-none px-4">
           {[...Array(8)].map((_, i) => (
             <div key={i} className="bg-black w-1 rounded-t-full animate-waveform-pulse" style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }}></div>
           ))}
        </div>
      )}

      {isCached && !isPlaying && !isRateLimited && (
        <div className="absolute top-1.5 right-2.5 w-2 h-2 bg-teal-400 rounded-full animate-pulse shadow-[0_0_10px_#14b8a6]"></div>
      )}
      
      {loading ? (
        <i className="fas fa-circle-notch fa-spin"></i>
      ) : isRateLimited ? (
        <i className="fas fa-hourglass-half text-red-400"></i>
      ) : (
        <i className={`fas ${isPlaying ? 'fa-stop-circle' : 'fa-play-circle'} text-lg relative z-10`}></i>
      )}
      
      <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
        {isRateLimited ? 'AI Cooling' : isPlaying ? 'Stop Sync' : isCached ? 'Cached Link' : `Narrate`}
      </span>

      <style>{`
        @keyframes waveform-pulse {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.2); }
        }
        .animate-waveform-pulse {
          animation: waveform-pulse 0.4s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </button>
  );
};
