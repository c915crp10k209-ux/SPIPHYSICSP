
export enum AppView {
  HOME = 'HOME',
  TOPIC = 'TOPIC',
  QUIZ = 'QUIZ',
  FLASHCARDS = 'FLASHCARDS',
  VAULT = 'VAULT',
  GLOSSARY = 'GLOSSARY',
  NEURO_DECK = 'NEURO_DECK'
}

export enum Topic {
  PHYSICS = 'Waves & Sound',
  TRANSDUCERS = 'Transducers',
  PULSED_WAVE = 'Pulsed Wave',
  DOPPLER = 'Doppler Effect',
  ARTIFACTS = 'Imaging Artifacts',
  SAFETY = 'Bioeffects & Safety',
  HEMODYNAMICS = 'Hemodynamics',
  QA = 'Quality Assurance',
  RESOLUTION = 'Resolution (Axial/Lat)',
  HARMONICS = 'Harmonics',
  INSTRUMENTATION = 'Instrumentation',
  ALL = 'Full Mock Exam'
}

export enum QuizMode {
  STANDARD = 'STANDARD',
  MISTAKE_ANALYSIS = 'MISTAKE_ANALYSIS',
  REGISTRY_SIM = 'REGISTRY_SIM'
}

export interface UserProfile {
  name: string;
  birthdate: string;
  saveDetails: boolean;
  onboardingCompleted: boolean;
}

export interface SubTopic {
  id: string;
  title: string;
  simulationId: string;
  description: string;
  challenges?: string[];
}

export type NeuralVoice = 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';

export interface VisionAnalysis {
  artifact: string;
  physicsPrinciple: string;
  confidence: number;
  explanation: string;
  knobFix: string;
}

export interface StudyDay {
  day: number;
  focusTopic: Topic;
  rationale: string;
  tasks: string[];
  estimatedTime: string;
}

export interface PersonalizedStudyPlan {
  title: string;
  overview: string;
  briefingScript: string;
  days: StudyDay[];
  timestamp: string;
}

export interface SolverDiagnosticResponses {
  primaryIssue: string;
  imagingMode: string;
  currentKnobSettings: string;
}

export interface SolverResult {
  compositeScore: number;
  esotericMode: boolean;
  l1_l2_summary: { text: string; topProblems: string[] };
  l3_archetypes: {
    primary: { name: string; desc: string; icon: string };
    secondary: { name: string; desc: string; icon: string };
    shadow: { name: string; desc: string; warning: string };
  };
  l4_nervous_system: {
    type: string;
    peakWindows: string[];
    energizing: string[];
    draining: string[];
  };
  l5_temporal: { phase: string; optimalEngagement: string };
  weeklyActionPlan: { tasks: string[]; derivedFrom: string };
  timestamp: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  commonErrorIndex?: number;
  explanation: string;
  domain?: string;
}

export interface MissedQuestion {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  topic: Topic;
  timestamp: string;
}

// Fixed: Added completedChallenges and vaultedMnemonics to resolve persistenceService errors
export interface UserProgress {
  [key: string]: {
    attempts: number;
    bestScore: number;
    lastScore: number;
    simMastery?: string[];
    completedSubTopics?: string[];
    missedHistory?: MissedQuestion[];
    completedChallenges?: string[];
    vaultedMnemonics?: string[];
  };
}

export interface VaultItem {
  id: string;
  topic: Topic;
  title: string;
  content: string;
  type: 'mnemonic' | 'explanation' | 'insight' | 'study_plan';
  date: string;
}

export interface GamificationState {
  level: number;
  xp: number;
  bits: number;
  streak: number;
  lastActiveDate: string;
  unlockedSkins: string[];
  activeSkin: string;
  preferredVoice?: NeuralVoice;
  preferredRate?: number;
  achievements: string[];
  dailyQuests: any[];
  questRefreshDate: string;
}

export interface ChatThread {
  id: string;
  topic: Topic;
  title: string;
  messages: any[];
  lastUpdated: number;
}

export interface Flashcard { front: string; back: string; }
export interface Achievement { id: string; title: string; description: string; icon: string; }
export interface DailyQuest { id: string; label: string; target: number; current: number; completed: boolean; rewardBits: number; }
export interface DailyInsight { text: string; timestamp: number; }

// Fixed: Added missing types to resolve various compilation errors in constants.ts, geminiService.ts, and UI components
export interface TopicMetadata {
  id: Topic;
  icon: string;
  color: string;
  voice: NeuralVoice;
  description: string;
  keyConcepts: string[];
  subTopics: SubTopic[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isSaved?: boolean;
}

export interface QuizResult {
  topic: Topic;
  score: number;
  total: number;
  date: string;
  missedQuestions: MissedQuestion[];
}

export interface RegistryReport {
  probability: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  studyPlan: string[];
  timestamp: string;
}

export interface ClinicalScenario {
  id: string;
  topic: Topic;
  title: string;
  scenario: string;
  questions: string[];
}
