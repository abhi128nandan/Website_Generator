import { LayoutGrid, Settings, FolderClosed, Terminal, AlertCircle, CopyPlus, ShieldCheck } from 'lucide-react';
import { useAppStore, ViewType } from '../store';

export function Sidebar() {
  const { activeView, setActiveView, addToast, isSidebarOpen, setSidebarOpen } = useAppStore();

  const navItems: { view: ViewType | string; icon: typeof LayoutGrid; label: string; action?: () => void }[] = [
    { view: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { view: 'projects', icon: FolderClosed, label: 'Projects' },
    { view: 'templates', icon: CopyPlus, label: 'Templates' },
    { view: 'failed', icon: AlertCircle, label: 'Failed' },
    { view: 'qa', icon: ShieldCheck, label: 'QA Center' },
    { view: 'terminal', icon: Terminal, label: 'Logs' },
  ];

  const handleNav = (item: typeof navItems[0]) => {
    if (item.action) {
      item.action();
    } else {
      setActiveView(item.view as ViewType);
    }
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`fixed inset-y-0 left-0 w-[60px] bg-[#0B1020] border-r border-[#18233D] flex flex-col items-center py-4 gap-1 z-50 transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:flex'}`}>
        {/* Logo */}
        <div className="w-9 h-9 bg-gradient-to-br from-[#4F8CFF] to-[#6C63FF] rounded-xl flex items-center justify-center shrink-0 cursor-default mb-4 shadow-lg shadow-blue-500/20">
          <span className="font-black text-white text-sm tracking-tight">P</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 w-full px-2 flex-1">
          {navItems.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button 
                key={item.view}
                className={`sidebar-tooltip p-2.5 rounded-lg transition-all duration-200 w-full flex justify-center relative group ${
                  isActive 
                    ? 'bg-[#18233D] text-[#4F8CFF]'
                    : 'text-gray-500 hover:bg-[#121A2F] hover:text-gray-300'
                }`}
                onClick={() => handleNav(item)}
                data-tooltip={item.label}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#4F8CFF] rounded-r-full shadow-[0_0_8px_rgba(79,140,255,0.4)]" />
                )}
                <item.icon size={18} />
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="w-full px-2 pb-2 mt-auto">
          <button 
            className={`sidebar-tooltip p-2.5 rounded-lg transition-all duration-200 w-full flex justify-center relative group ${
              activeView === 'settings'
                ? 'bg-[#18233D] text-[#4F8CFF]'
                : 'text-gray-500 hover:bg-[#121A2F] hover:text-gray-300'
            }`}
            onClick={() => { setActiveView('settings'); setSidebarOpen(false); }}
            data-tooltip="Settings"
          >
            {activeView === 'settings' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#4F8CFF] rounded-r-full shadow-[0_0_8px_rgba(79,140,255,0.4)]" />
            )}
            <Settings size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
