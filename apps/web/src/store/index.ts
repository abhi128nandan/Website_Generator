import { create } from 'zustand';

export type ViewType = 'dashboard' | 'projects' | 'terminal' | 'settings';

interface AppState {
  currentProjectId: string | null;
  setCurrentProject: (id: string) => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentProjectId: null,
  setCurrentProject: (id) => set({ currentProjectId: id }),
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
}));
