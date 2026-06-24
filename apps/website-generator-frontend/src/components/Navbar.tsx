import { useState, useEffect } from 'react';
import { Menu, ChevronRight, Keyboard } from 'lucide-react';
import { useAppStore } from '../store';

const viewLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  terminal: 'System Logs',
  settings: 'Settings',
};

export function Navbar() {
  const [health, setHealth] = useState<any>(null);
  const { activeView, isSidebarOpen, setSidebarOpen } = useAppStore();

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/ai/status');
        if (res.ok) {
          setHealth(await res.json());
        }
      } catch (e) {
        setHealth({ aiStatus: 'offline', message: 'Backend unreachable' });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!health) return 'bg-gray-500';
    if (health.aiStatus === 'ok') return 'bg-green-500';
    if (health.message?.includes('Missing API Key')) return 'bg-yellow-500';
    if (health.message?.includes('Invalid API Key')) return 'bg-red-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (!health) return 'Connecting...';
    if (health.aiStatus === 'ok') return 'Connected';
    if (health.message?.includes('Missing API Key')) return 'Missing Key';
    if (health.message?.includes('Invalid API Key')) return 'Invalid Key';
    return 'Offline';
  };

  return (
    <header className="h-11 border-b border-[#18233D] bg-[#0B1020] flex items-center px-4 justify-between shrink-0 z-20 sticky top-0">
      <div className="flex items-center gap-3">
        <button 
          className="md:hidden text-gray-400 hover:text-gray-200"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          <Menu size={18} />
        </button>
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-500 font-medium">WebsiteGenerator</span>
          <ChevronRight size={12} className="text-gray-600" />
          <span className="text-gray-200 font-bold">{viewLabels[activeView] || activeView}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Keyboard shortcut hint */}
        <button className="hidden md:flex items-center gap-1.5 bg-[#121A2F] border border-[#18233D] px-2 py-1 rounded-md text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
          <Keyboard size={11} />
          <span className="font-mono">⌘K</span>
        </button>

        {/* AI Status */}
        <div className="flex items-center gap-2 bg-[#121A2F] border border-[#18233D] px-2.5 py-1 rounded-md text-[11px] font-medium shadow-sm">
          <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`}></div>
          <span className="text-gray-400">
            {health?.provider ? health.provider.charAt(0).toUpperCase() + health.provider.slice(1) : 'AI'}: <span className="text-gray-300">{getStatusText()}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
