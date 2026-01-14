
import { QuizResult, UserProgress, Topic, VaultItem, GamificationState, AppView, QuizMode, QuizQuestion, UserProfile, DailyInsight, NeuralVoice, DailyQuest, Achievement, MissedQuestion, ChatThread, RegistryReport } from '../types';
import { supabase } from './supabaseClient';

const PROGRESS_KEY = 'spi_prep_progress_v1';
const VAULT_KEY = 'spi_vault_v1';
const CHAT_THREADS_KEY = 'spi_chat_threads_v1';
const GAME_STATE_KEY = 'spi_gamification_v1';
const APP_STATE_KEY = 'spi_app_nav_state_v1';
const ACTIVE_QUIZ_KEY = 'spi_active_quiz_v1';
const PROFILE_KEY = 'spi_user_profile_v1';
const DAILY_INSIGHT_KEY = 'spi_daily_insight_v1';
const READINESS_REPORT_KEY = 'spi_readiness_report_v1';
const REPAIR_BRIEFING_KEY = 'spi_repair_briefing_v1';
const TOPIC_SESSION_PREFIX = 'spi_topic_session_';
const CONTENT_CACHE_KEY_PREFIX = 'spi_content_cache_';
const AUDIO_SESSION_CACHE_PREFIX = 'spi_audio_session_';
const LESSON_SCENE_KEY = 'spi_lesson_scenes_v1';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_sync', title: 'Sync Established', description: 'Complete your first module protocol.', icon: 'fa-link' },
  { id: 'quiz_master', title: 'Perfect Pulse', description: 'Score 100% on any module quiz.', icon: 'fa-star' },
  { id: 'sim_expert', title: 'Wave Tamer', description: 'Complete all challenges in a simulation lab.', icon: 'fa-vial' },
  { id: 'streak_3', title: 'Temporal Flow', description: 'Maintain a 3-day learning streak.', icon: 'fa-fire' },
  { id: 'bits_1000', title: 'Data Mogul', description: 'Accumulate 1,000 Sonal Bits.', icon: 'fa-coins' },
  { id: 'registry_ready', title: 'Registry Veteran', description: 'Complete the Full Mock Exam.', icon: 'fa-id-card' },
];

export const QUEST_POOLS: Omit<DailyQuest, 'completed' | 'current'>[] = [
  { id: 'q_sync', label: 'Sync Modules', target: 2, rewardBits: 50 },
  { id: 'q_quiz', label: 'Pass Quizzes', target: 1, rewardBits: 40 },
  { id: 'q_vault', label: 'Archive Insights', target: 3, rewardBits: 30 },
  { id: 'q_flash', label: 'Flip Flashcards', target: 10, rewardBits: 20 },
  { id: 'q_lab', label: 'Master Lab Tasks', target: 2, rewardBits: 60 },
];

const INITIAL_GAME_STATE: GamificationState = { 
  level: 1, 
  xp: 0, 
  bits: 100, 
  streak: 0, 
  lastActiveDate: new Date().toISOString(), 
  unlockedSkins: ['Default'], 
  activeSkin: 'Default',
  preferredVoice: 'Zephyr',
  preferredRate: 1.25,
  achievements: [],
  dailyQuests: [],
  questRefreshDate: ''
};

export const getGameState = (): GamificationState => {
  const stored = localStorage.getItem(GAME_STATE_KEY);
  let state: GamificationState = stored ? JSON.parse(stored) : { ...INITIAL_GAME_STATE };
  
  const today = new Date().toDateString();
  const lastDate = state.lastActiveDate ? new Date(state.lastActiveDate).toDateString() : '';

  if (lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    state.streak = (lastDate === yesterday) ? state.streak + 1 : 1;
    state.lastActiveDate = new Date().toISOString();
    if (state.streak >= 3) unlockAchievement('streak_3', state);
    saveGameState(state);
  }

  if (state.questRefreshDate !== today) {
    state.dailyQuests = QUEST_POOLS.sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(q => ({ ...q, current: 0, completed: false }));
    state.questRefreshDate = today;
    saveGameState(state);
  }

  return state;
};

export const saveGameState = (state: GamificationState) => {
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
};

export const deductBits = (amount: number): boolean => {
  const state = getGameState();
  if (state.bits >= amount) {
    state.bits -= amount;
    saveGameState(state);
    return true;
  }
  return false;
};

export const updateQuestProgress = (type: string, amount: number = 1) => {
  const state = getGameState();
  let changed = false;
  state.dailyQuests = state.dailyQuests.map(q => {
    if (q.id.includes(type) && !q.completed) {
      q.current += amount;
      if (q.current >= q.target) {
        q.completed = true;
        state.bits += q.rewardBits;
        state.xp += q.rewardBits * 2;
        changed = true;
      }
    }
    return q;
  });
  if (changed) saveGameState(state);
  return state;
};

export const unlockAchievement = (id: string, stateArg?: GamificationState) => {
  const state = stateArg || getGameState();
  if (!state.achievements.includes(id)) {
    state.achievements.push(id);
    state.xp += 500;
    state.bits += 100;
    saveGameState(state);
    if (typeof (window as any).triggerAchievement === 'function') {
      (window as any).triggerAchievement(id);
    }
    return true;
  }
  return false;
};

export const getProgress = (): UserProgress => {
  const stored = localStorage.getItem(PROGRESS_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch (e) {
    return {};
  }
};

export const completeChallenge = (topic: Topic, challengeId: string) => {
  const current = getProgress();
  if (!current[topic]) current[topic] = { attempts: 0, bestScore: 0, lastScore: 0 };
  if (!current[topic].completedChallenges) current[topic].completedChallenges = [];
  
  if (!current[topic].completedChallenges?.includes(challengeId)) {
    current[topic].completedChallenges?.push(challengeId);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(current));
    addXP(100, 20);
    updateQuestProgress('lab');
    return true;
  }
  return false;
};

export const saveQuizResult = (result: QuizResult): { progress: UserProgress, levelUp: boolean } => {
  const current = getProgress();
  const topicStats = current[result.topic] || { attempts: 0, bestScore: 0, lastScore: 0, missedHistory: [] };
  const percentage = Math.round((result.score / result.total) * 100);
  
  const xpReward = result.score * 50;
  const bitReward = result.score * 5;
  const gameState = getGameState();
  const oldLevel = gameState.level;
  
  updateQuestProgress('quiz');
  if (percentage === 100) unlockAchievement('quiz_master', gameState);
  if (gameState.bits >= 1000) unlockAchievement('bits_1000', gameState);

  const newState = addXP(xpReward, bitReward);
  
  const newMissed = result.missedQuestions || [];
  const updatedMissedHistory = [...(topicStats.missedHistory || []), ...newMissed].slice(-15);

  const updatedProgress = {
    ...current,
    [result.topic]: {
      ...topicStats,
      attempts: topicStats.attempts + 1,
      bestScore: Math.max(topicStats.bestScore, percentage),
      lastScore: percentage,
      missedHistory: updatedMissedHistory
    }
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(updatedProgress));
  return { progress: updatedProgress, levelUp: newState.level > oldLevel };
};

export const addXP = (amount: number, bitAmount: number = 0): GamificationState => {
  const state = getGameState();
  state.xp += amount;
  state.bits += bitAmount;
  const xpNeeded = state.level * 1000;
  if (state.xp >= xpNeeded) {
    state.level += 1;
    state.xp -= xpNeeded;
  }
  saveGameState(state);
  return state;
};

export const saveTopicSession = (topic: Topic, subTopicId: string, mode: string) => {
  localStorage.setItem(TOPIC_SESSION_PREFIX + topic, JSON.stringify({ subTopicId, mode }));
};

export const getTopicSession = (topic: Topic): { subTopicId: string, mode: string } | null => {
  const stored = localStorage.getItem(TOPIC_SESSION_PREFIX + topic);
  return stored ? JSON.parse(stored) : null;
};

// Added saveLessonProgress and getLessonProgress to track scene completion within a lecture
export const saveLessonProgress = (subTopicId: string, completedScenes: number[]) => {
  try {
    const stored = localStorage.getItem(LESSON_SCENE_KEY);
    const progress = stored ? JSON.parse(stored) : {};
    progress[subTopicId] = completedScenes;
    localStorage.setItem(LESSON_SCENE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save lesson progress", e);
  }
};

export const getLessonProgress = (subTopicId: string): number[] => {
  const stored = localStorage.getItem(LESSON_SCENE_KEY);
  if (!stored) return [];
  try {
    const progress = JSON.parse(stored);
    return progress[subTopicId] || [];
  } catch (e) {
    return [];
  }
};

export const getDailyInsight = (): DailyInsight | null => {
  const stored = localStorage.getItem(DAILY_INSIGHT_KEY);
  if (!stored) return null;
  const insight: DailyInsight = JSON.parse(stored);
  const oneDay = 24 * 60 * 60 * 1000;
  if (Date.now() - insight.timestamp > oneDay) {
    localStorage.removeItem(DAILY_INSIGHT_KEY);
    return null;
  }
  return insight;
};

export const saveDailyInsight = (text: string) => {
  const insight: DailyInsight = { text, timestamp: Date.now() };
  localStorage.setItem(DAILY_INSIGHT_KEY, JSON.stringify(insight));
};

export const vaultMnemonicToProgress = (topic: Topic, mnemonic: string) => {
  const progress = getProgress();
  if (!progress[topic]) progress[topic] = { attempts: 0, bestScore: 0, lastScore: 0 };
  if (!progress[topic].vaultedMnemonics) progress[topic].vaultedMnemonics = [];
  if (!progress[topic].vaultedMnemonics?.includes(mnemonic)) {
    progress[topic].vaultedMnemonics?.push(mnemonic);
  }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return progress;
};

export interface AppState { currentView: AppView; currentTopic: Topic | null; quizMode: QuizMode; }
export const saveAppState = (state: AppState) => localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
export const getAppState = (): AppState | null => {
  const stored = localStorage.getItem(APP_STATE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};
export const getUserProfile = (): UserProfile => {
  const stored = localStorage.getItem(PROFILE_KEY);
  return stored ? JSON.parse(stored) : { name: '', birthdate: '', saveDetails: true, onboardingCompleted: false };
};

export interface ActiveQuizState { topic: Topic; mode: QuizMode; questions: QuizQuestion[]; userAnswers: number[]; currentQIndex: number; }
export const saveActiveQuiz = (state: ActiveQuizState) => localStorage.setItem(ACTIVE_QUIZ_KEY, JSON.stringify(state));
export const getActiveQuiz = (): ActiveQuizState | null => {
  const stored = localStorage.getItem(ACTIVE_QUIZ_KEY);
  return stored ? JSON.parse(stored) : null;
};
export const clearActiveQuiz = () => localStorage.removeItem(ACTIVE_QUIZ_KEY);

export const saveReadinessReport = (report: RegistryReport) => {
  localStorage.setItem(READINESS_REPORT_KEY, JSON.stringify(report));
};
export const getReadinessReport = (): RegistryReport | null => {
    const stored = localStorage.getItem(READINESS_REPORT_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const saveRepairBriefing = (text: string) => {
    localStorage.setItem(REPAIR_BRIEFING_KEY, JSON.stringify({ text, timestamp: Date.now() }));
};

export const getRepairBriefing = (): { text: string; timestamp: number } | null => {
    const stored = localStorage.getItem(REPAIR_BRIEFING_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const saveContentCache = (key: string, content: string) => {
    const cacheObj = { content, timestamp: Date.now() };
    localStorage.setItem(CONTENT_CACHE_KEY_PREFIX + key, JSON.stringify(cacheObj));
};

export const getContentCache = (key: string): string | null => {
    const stored = localStorage.getItem(CONTENT_CACHE_KEY_PREFIX + key);
    if (!stored) return null;
    const cacheObj = JSON.parse(stored);
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - cacheObj.timestamp > weekInMs) {
        localStorage.removeItem(CONTENT_CACHE_KEY_PREFIX + key);
        return null;
    }
    return cacheObj.content;
};

export const getAudioSessionCache = (key: string): string | null => {
  return sessionStorage.getItem(AUDIO_SESSION_CACHE_PREFIX + key);
};

export const setAudioSessionCache = (key: string, base64: string) => {
  try {
    sessionStorage.setItem(AUDIO_SESSION_CACHE_PREFIX + key, base64);
  } catch (e) {
    console.warn("Audio session cache full, skipping save.");
  }
};

export const updateVoicePreferences = (voice: NeuralVoice, rate: number): GamificationState => {
  const state = getGameState();
  state.preferredVoice = voice;
  state.preferredRate = rate;
  saveGameState(state);
  return state;
};

export const updateSkin = (skin: string): GamificationState => {
  const state = getGameState();
  state.activeSkin = skin;
  saveGameState(state);
  return state;
};

export const vaultItem = (item: Omit<VaultItem, 'id' | 'date'>) => {
  const vault = getVault();
  const newItem: VaultItem = { ...item, id: crypto.randomUUID(), date: new Date().toISOString() };
  addXP(100, 5);
  updateQuestProgress('vault');
  const updatedVault = [newItem, ...vault];
  localStorage.setItem(VAULT_KEY, JSON.stringify(updatedVault));
  return newItem;
};
export const getVault = (): VaultItem[] => {
  const stored = localStorage.getItem(VAULT_KEY);
  return stored ? JSON.parse(stored) : [];
};
export const removeFromVault = (id: string) => {
  const vault = getVault().filter(i => i.id !== id);
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
};

export const getChatThreads = (): ChatThread[] => {
  const stored = localStorage.getItem(CHAT_THREADS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveChatThread = (thread: ChatThread) => {
  const threads = getChatThreads();
  const idx = threads.findIndex(t => t.id === thread.id);
  if (idx !== -1) {
    threads[idx] = { ...thread, lastUpdated: Date.now() };
  } else {
    threads.unshift({ ...thread, lastUpdated: Date.now() });
  }
  const trimmed = threads.sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, 20);
  localStorage.setItem(CHAT_THREADS_KEY, JSON.stringify(trimmed));
};

export const deleteChatThread = (id: string) => {
  const threads = getChatThreads().filter(t => t.id !== id);
  localStorage.setItem(CHAT_THREADS_KEY, JSON.stringify(threads));
};

export const getStorageStats = async () => {
    return { audioCount: Object.keys(sessionStorage).filter(k => k.startsWith(AUDIO_SESSION_CACHE_PREFIX)).length, contentCount: getVault().length };
};

export const clearAllCaches = async () => { 
  sessionStorage.clear();
  localStorage.clear();
  return true; 
};

// Fixed missing exports for UI state and cloud sync
export const saveChatDraft = (topic: Topic, draft: string) => localStorage.setItem('spi_chat_draft_' + topic, draft);
export const getChatDraft = (topic: Topic) => localStorage.getItem('spi_chat_draft_' + topic) || '';
export const saveCommandDraft = (draft: string) => localStorage.setItem('spi_command_draft', draft);
export const getCommandDraft = () => localStorage.getItem('spi_command_draft') || '';

export const syncAllDataWithCloud = async () => {
  const profile = getUserProfile();
  const progress = getProgress();
  const gameState = getGameState();
  const vault = getVault();

  if (!profile.name) return false;

  try {
    const { error } = await supabase
      .from('user_sync')
      .upsert({ 
        user_id: profile.name, 
        progress: JSON.stringify(progress),
        game_state: JSON.stringify(gameState),
        vault: JSON.stringify(vault),
        last_sync: new Date().toISOString()
      });
    return !error;
  } catch (e) {
    return false;
  }
};
