import { create } from 'zustand';

export type ViewType = 'dashboard' | 'projects' | 'terminal' | 'settings';

interface AppState {
  currentProjectId: string | null;
  setCurrentProject: (id: string | null) => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  focusFile: string | null;
  setFocusFile: (path: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentProjectId: null,
  setCurrentProject: (id) => set({ currentProjectId: id }),
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  focusFile: null,
  setFocusFile: (path) => set({ focusFile: path }),
}));
