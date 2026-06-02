
import { LayoutGrid, Settings, FolderClosed, Terminal } from 'lucide-react';
import { useAppStore, ViewType } from '../store';

export function Sidebar() {
  const { activeView, setActiveView } = useAppStore();

  const getButtonClass = (view: ViewType) => {
    const baseClass = "p-2 rounded-lg transition-colors w-full flex justify-center";
    return activeView === view 
      ? `${baseClass} bg-gray-800 text-blue-400`
      : `${baseClass} text-gray-400 hover:bg-gray-800 hover:text-gray-200`;
  };

  return (
    <div className="w-16 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-4 gap-6 z-10 shrink-0">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
        <span className="font-bold text-white text-lg">P</span>
      </div>
      <nav className="flex flex-col gap-4 w-full px-3">
        <button 
          className={getButtonClass('dashboard')} 
          onClick={() => setActiveView('dashboard')}
          title="Dashboard"
        >
          <LayoutGrid size={20} />
        </button>
        <button 
          className={getButtonClass('projects')} 
          onClick={() => setActiveView('projects')}
          title="Generated Workspace"
        >
          <FolderClosed size={20} />
        </button>
        <button 
          className={getButtonClass('terminal')} 
          onClick={() => setActiveView('terminal')}
          title="Terminal"
        >
          <Terminal size={20} />
        </button>
      </nav>
      <div className="mt-auto w-full px-3">
        <button 
          className={getButtonClass('settings')} 
          onClick={() => setActiveView('settings')}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}
