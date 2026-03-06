const KEY = "completedQuizzes";

function storageKey(userId: string): string {
  return `${KEY}_${userId}`;
}

function getCompleted(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markQuizCompleted(chapterId: string, userId: string): void {
  const set = getCompleted(userId);
  set.add(chapterId);
  localStorage.setItem(storageKey(userId), JSON.stringify([...set]));
}

export function hasCompletedQuiz(chapterId: string, userId: string): boolean {
  return getCompleted(userId).has(chapterId);
}

export function isChapterUnlocked(
  chapters: { _id: string }[],
  index: number,
  userId: string
): boolean {
  if (index === 0) return true;
  const prevId = chapters[index - 1]._id;
  return hasCompletedQuiz(prevId, userId);
}