import type { Stream } from "@/lib/api";

export type Selection = {
  stream: Stream; // matches backend courseTaxonomy.js
  course: string; // e.g. "B.E/B.Tech"
  category: string;
  branches: string[];
  year: number;
};

const KEY = "cutoffsaathi_selection";

export function saveSelection(selection: Selection) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(selection));
}

export function loadSelection(): Selection | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Selection;
  } catch {
    return null;
  }
}

export function clearSelection() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
