
import { QuizResult, UserProgress, Topic } from '../types';

const STORAGE_KEY = 'spi_prep_progress_v1';

export const saveQuizResult = (result: QuizResult): UserProgress => {
  const current = getProgress();
  const topicStats = current[result.topic] || { attempts: 0, bestScore: 0, lastScore: 0 };

  const percentage = Math.round((result.score / result.total) * 100);

  const updatedStats = {
    attempts: topicStats.attempts + 1,
    bestScore: Math.max(topicStats.bestScore, percentage),
    lastScore: percentage
  };

  const updatedProgress = {
    ...current,
    [result.topic]: updatedStats
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
  return updatedProgress;
};

export const getProgress = (): UserProgress => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch (e) {
    return {};
  }
};

export const getTopicMastery = (topic: Topic): number => {
  const progress = getProgress();
  return progress[topic]?.bestScore || 0;
};
