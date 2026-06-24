import { create } from 'zustand';

export type ViewType = 'dashboard' | 'projects' | 'terminal' | 'settings' | 'templates' | 'failed' | 'qa';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  currentProjectId: string | null;
  setCurrentProject: (id: string | null) => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  focusFile: string | null;
  setFocusFile: (path: string | null) => void;
  toasts: Toast[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentProjectId: null,
  setCurrentProject: (id) => set({ currentProjectId: id }),
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  focusFile: null,
  setFocusFile: (path) => set({ focusFile: path }),
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
