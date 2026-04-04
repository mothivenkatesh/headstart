const STORAGE_KEY = "fc_drafts";
const MAX_DRAFTS = 10;

export interface Draft {
  id: string;
  title: string;
  body: string;
  circleId: string;
  circleName: string;
  imageUrl: string;
  pollOptions: string[];
  pollDuration: number;
  showPoll: boolean;
  updatedAt: number;
}

export function getDrafts(): Draft[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

export function saveDraft(draft: Omit<Draft, "id" | "updatedAt">, existingId?: string): string {
  const drafts = getDrafts();
  const id = existingId || `draft-${Date.now()}`;
  const idx = drafts.findIndex((d) => d.id === id);
  const entry: Draft = { ...draft, id, updatedAt: Date.now() };
  if (idx >= 0) drafts[idx] = entry;
  else drafts.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts.slice(0, MAX_DRAFTS)));
  return id;
}

export function deleteDraft(id: string) {
  const drafts = getDrafts().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function clearAllDrafts() {
  localStorage.removeItem(STORAGE_KEY);
}
