
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, Topic, Flashcard, ClinicalScenario, RegistryReport, UserProgress, MissedQuestion, SubTopic, VisionAnalysis, PersonalizedStudyPlan, SolverDiagnosticResponses, SolverResult, VaultItem } from "../types";
import { getContentCache, saveContentCache, getAudioSessionCache, setAudioSessionCache, getProgress } from "./persistenceService";

const MODEL_NAME = 'gemini-3-pro-preview';
const MODEL_FLASH = 'gemini-3-flash-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const HARVEY_SYSTEM_PROMPT = `
Act as HARVEY, a world-class ULTRASOUND PHYSICS expert. 
Your goal is "Meal-Prepping for the Brain."
CONTENT GUIDELINES: No asterisks, hashtags, or symbols. Plain prose briefings only. Use a paternal, brisk, expert tone.
`;

let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1200;

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_GAP) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP - elapsed));
  }
  lastRequestTime = Date.now();
}

async function withRetry<T>(fn: (ai: GoogleGenAI) => Promise<T>, maxRetries = 4): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await throttle();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      return await fn(ai);
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const getNarrationCacheKey = (text: string, voiceName: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0; 
  }
  return `tts-${voiceName}-${Math.abs(hash)}`;
};

const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
};

export const getNarration = async (text: string, voiceName: string): Promise<ArrayBuffer> => {
  const cacheKey = getNarrationCacheKey(text, voiceName);
  const cachedBase64 = getAudioSessionCache(cacheKey);
  if (cachedBase64) return base64ToArrayBuffer(cachedBase64);

  const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: `Harvey: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  }));

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("TTS Failure");
  setAudioSessionCache(cacheKey, base64Audio);
  return base64ToArrayBuffer(base64Audio);
};

export const generateConsolidatedBriefing = async (items: VaultItem[]): Promise<string> => {
  const data = items.map(i => `Topic: ${i.topic}, Title: ${i.title}, Content: ${i.content}`).join('\n\n---\n\n');
  const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
    model: MODEL_FLASH,
    contents: `Analyze these vaulted study records and provide a single, high-yield "Consolidated Matrix Briefing." Connect the concepts across different modules. No symbols.
    RECORDS:
    ${data}`,
    config: { systemInstruction: HARVEY_SYSTEM_PROMPT }
  }));
  return response.text || "Consolidation link failed.";
};

export const generatePersonalizedStudyPlan = async (progress: UserProgress): Promise<PersonalizedStudyPlan> => {
  const progressData = Object.entries(progress).map(([topic, stats]) => `Topic: ${topic}, Mastery: ${stats.bestScore}%`).join('\n');
  const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
    model: MODEL_NAME,
    contents: `As HARVEY, analyze this progress data and create a 7-day study schedule. Output valid JSON. No symbols.
    DATA:
    ${progressData}`,
    config: {
      systemInstruction: HARVEY_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 8000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          overview: { type: Type.STRING },
          briefingScript: { type: Type.STRING },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                focusTopic: { type: Type.STRING },
                rationale: { type: Type.STRING },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                estimatedTime: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  }));
  return { ...JSON.parse(response.text || "{}"), timestamp: new Date().toISOString() };
};

export const analyzeUltrasoundFrame = async (base64Image: string, mimeType: string): Promise<VisionAnalysis> => {
  const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
    model: MODEL_FLASH,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: "Perform a Neural Physics Audit. Identify artifacts, confidence level, the physics cause, and the specific machine knob fix. JSON only, no symbols." }
      ]
    },
    config: {
      systemInstruction: HARVEY_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          artifact: { type: Type.STRING },
          physicsPrinciple: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          explanation: { type: Type.STRING },
          knobFix: { type: Type.STRING }
        }
      }
    }
  }));
  return JSON.parse(response.text || "{}");
};

export const generateSolverReport = async (responses: SolverDiagnosticResponses): Promise<SolverResult> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `As HARVEY, synthesize this Problem Solver Diagnostic. No symbols.
      Data: ${JSON.stringify(responses)}`,
      config: {
        systemInstruction: HARVEY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            compositeScore: { type: Type.NUMBER },
            esotericMode: { type: Type.BOOLEAN },
            l1_l2_summary: {
              type: Type.OBJECT,
              properties: { text: { type: Type.STRING }, topProblems: { type: Type.ARRAY, items: { type: Type.STRING } } }
            },
            l3_archetypes: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, desc: { type: Type.STRING }, icon: { type: Type.STRING } } },
                secondary: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, desc: { type: Type.STRING }, icon: { type: Type.STRING } } },
                shadow: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, desc: { type: Type.STRING }, warning: { type: Type.STRING } } }
              }
            },
            l4_nervous_system: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                peakWindows: { type: Type.ARRAY, items: { type: Type.STRING } },
                energizing: { type: Type.ARRAY, items: { type: Type.STRING } },
                draining: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            l5_temporal: {
                type: Type.OBJECT,
                properties: { phase: { type: Type.STRING }, optimalEngagement: { type: Type.STRING } }
            },
            weeklyActionPlan: {
                type: Type.OBJECT,
                properties: { tasks: { type: Type.ARRAY, items: { type: Type.STRING } }, derivedFrom: { type: Type.STRING } }
            }
          }
        }
      }
    }));
    return { ...JSON.parse(response.text || "{}"), timestamp: new Date().toISOString() };
};

export const generateQuizQuestions = async (topic: Topic, count: number = 10): Promise<QuizQuestion[]> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate ${count} SPI questions for ${topic}. No symbols. JSON Output.`,
      config: {
        systemInstruction: HARVEY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    }));
    return JSON.parse(response.text || "[]");
};

export const generateLectureScript = async (topic: Topic, subTopic?: SubTopic): Promise<string> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a Story-Based lecture for ${topic}. No symbols.`,
      config: { systemInstruction: HARVEY_SYSTEM_PROMPT }
    }));
    return response.text || "Signal finalized.";
};

export const chatWithTutor = async (topic: Topic, message: string, history: any[]): Promise<string> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_NAME,
      contents: [...history.slice(-6), { role: 'user', parts: [{ text: message }] }],
      config: { systemInstruction: HARVEY_SYSTEM_PROMPT }
    }));
    return response.text || "Establishing link.";
};

export const generateHarveyHint = async (question: string): Promise<string> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Provide a hint for: "${question}". No symbols.`,
      config: { systemInstruction: HARVEY_SYSTEM_PROMPT }
    }));
    return response.text || "Focus on the axial resolution.";
};

export const generateCommonMistakesMock = async (): Promise<QuizQuestion[]> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Generate SPI Mock focusing on common traps. No symbols. JSON Output.",
      config: {
        systemInstruction: HARVEY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    }));
    return JSON.parse(response.text || "[]");
};

export const generateWeightedMock = async (): Promise<QuizQuestion[]> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Generate weighted ARDMS SPI mock. No symbols. JSON Output.",
      config: {
        systemInstruction: HARVEY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    }));
    return JSON.parse(response.text || "[]");
};

export const generateDailyInsight = async (): Promise<string> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_FLASH,
      contents: "Punchy SPI tip. No symbols.",
      config: { systemInstruction: HARVEY_SYSTEM_PROMPT }
    }));
    return response.text || "Keep scanning.";
};

export const generateNeuralRepair = async (missed: MissedQuestion[]): Promise<string> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Repair briefing for: ${JSON.stringify(missed)}. No symbols.`,
      config: { systemInstruction: HARVEY_SYSTEM_PROMPT }
    }));
    return response.text || "Neural paths stabilized.";
};

export const generateReadinessReport = async (progress: UserProgress): Promise<RegistryReport> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Registry readiness report. No symbols. JSON Output.`,
      config: {
        systemInstruction: HARVEY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            probability: { type: Type.NUMBER },
            verdict: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            studyPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }));
    return { ...JSON.parse(response.text || "{}"), timestamp: new Date().toISOString() };
};

export const generateFlashcards = async (topic: Topic): Promise<Flashcard[]> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `10 Flashcards for ${topic}. No symbols. JSON Output.`,
      config: {
        systemInstruction: HARVEY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { front: { type: Type.STRING }, back: { type: Type.STRING } }
          }
        }
      }
    }));
    return JSON.parse(response.text || "[]");
};

export const getMnemonics = async (topic: Topic): Promise<string> => {
    const response: GenerateContentResponse = await withRetry((ai) => ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Mnemonic for ${topic}. No symbols.`,
      config: { systemInstruction: HARVEY_SYSTEM_PROMPT }
    }));
    return response.text || "Memory link finalized.";
};
