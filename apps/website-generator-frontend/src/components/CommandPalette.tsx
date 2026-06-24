import { useState, useEffect, useRef } from 'react';
import { Search, Compass, Settings, Sparkles, FolderOpen, ChevronRight, Cpu, Layers, CornerDownLeft } from 'lucide-react';
import { commandRegistry, Command } from '../store/commandRegistry';
import { useAppStore } from '../store';

interface PaletteItem {
  type: 'command' | 'project';
  id: string;
  label: string;
  category: string;
  shortcut?: string[];
  execute: () => void;
  subtitle?: string;
  icon?: any;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState<Command[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { setActiveView, setCurrentProject } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Load commands
      const updateCommands = () => {
        setCommands(commandRegistry.getCommands());
      };
      updateCommands();
      const unsubscribe = commandRegistry.subscribe(updateCommands);

      // Fetch projects
      const fetchProjects = async () => {
        try {
          const res = await fetch('http://localhost:3000/api/projects');
          if (res.ok) {
            const data = await res.json();
            setProjects(data);
          }
        } catch (e) {
          console.error('Failed to load projects for command palette', e);
        }
      };
      fetchProjects();

      setTimeout(() => inputRef.current?.focus(), 50);
      return () => { unsubscribe(); };
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Map commands and projects into a flat list of PaletteItems
  const commandItems: PaletteItem[] = commands.map(cmd => {
    let icon = Compass;
    if (cmd.category === 'Preferences') icon = Settings;
    if (cmd.category === 'Navigation') icon = Compass;
    if (cmd.category === 'Actions') icon = Sparkles;
    if (cmd.category === 'Project Workspace') icon = Layers;
    
    return {
      type: 'command',
      id: cmd.id,
      label: cmd.label,
      category: cmd.category,
      shortcut: cmd.shortcut,
      execute: cmd.execute,
      icon
    };
  });

  const projectItems: PaletteItem[] = projects.map(p => {
    const meta = p.metadata as any;
    const type = meta?.classifiedMode || (p.metadata?.backend?.length ? 'Fullstack' : 'Frontend Only');
    
    return {
      type: 'project',
      id: p.id,
      label: p.name,
      category: 'Projects',
      subtitle: `${type} • QA Score: ${meta?.reliability?.score || 85}/100`,
      icon: FolderOpen,
      execute: () => {
        setCurrentProject(p.id);
        setActiveView('projects');
      }
    };
  });

  const allItems = [...commandItems, ...projectItems];

  const filteredItems = allItems.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  // Auto-scroll to selected element
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].execute();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  // Group items by category to render
  const categoriesOrder = ['Navigation', 'Preferences', 'Actions', 'Project Workspace', 'Projects'];
  
  const sortedFilteredItems = [...filteredItems].sort((a, b) => {
    const indexA = categoriesOrder.indexOf(a.category);
    const indexB = categoriesOrder.indexOf(b.category);
    const orderA = indexA === -1 ? 99 : indexA;
    const orderB = indexB === -1 ? 99 : indexB;
    return orderA - orderB;
  });

  const activeItem = sortedFilteredItems[selectedIndex];

  return (
    <div className="fixed inset-0 bg-[#060813]/85 backdrop-blur-md z-[100] flex items-start justify-center pt-[15vh] p-4 animate-fade-in">
      <div 
        className="bg-[#0B1020]/95 border border-white/10 rounded-2xl shadow-[0_0_50px_-12px_rgba(79,140,255,0.2)] w-full max-w-2xl overflow-hidden flex flex-col glass-card"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-white/5 bg-[#0E1528]/50">
          <Search size={22} className="text-[#4F8CFF] mr-3 shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            className="bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 w-full text-base font-semibold"
            placeholder="Type a command or search projects..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono">
              ESC
            </span>
          </div>
        </div>

        {/* Command List */}
        <div 
          ref={listRef} 
          className="max-h-[50vh] overflow-y-auto py-2 no-scrollbar"
        >
          {sortedFilteredItems.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
              <Cpu size={24} className="text-gray-600 animate-bounce" />
              <span>No matching commands or projects found.</span>
            </div>
          ) : (
            (() => {
              let currentCategory = '';
              return sortedFilteredItems.map((item) => {
                const showCategoryHeader = item.category !== currentCategory;
                if (showCategoryHeader) {
                  currentCategory = item.category;
                }
                const isSelected = activeItem?.id === item.id && activeItem?.type === item.type;
                const IconComponent = item.icon || ChevronRight;

                return (
                  <div key={`${item.type}-${item.id}`}>
                    {showCategoryHeader && (
                      <div className="px-4 py-1.5 text-[9px] font-black tracking-widest text-[#4F8CFF] uppercase font-mono bg-white/[0.02] border-y border-white/[0.02] select-none my-1">
                        {item.category}
                      </div>
                    )}
                    <div 
                      data-selected={isSelected ? 'true' : 'false'}
                      className={`flex items-center justify-between px-4 py-2.5 mx-2 my-0.5 rounded-xl cursor-pointer select-none transition-all duration-150 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-[#1E2E5D]/80 to-[#121B3A]/80 border border-white/10 text-white shadow-md' 
                          : 'border border-transparent text-gray-300 hover:bg-white/[0.02] hover:text-gray-100'
                      }`}
                      onClick={() => {
                        item.execute();
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => {
                        const sortedIdx = sortedFilteredItems.findIndex(i => i.id === item.id && i.type === item.type);
                        if (sortedIdx !== -1) setSelectedIndex(sortedIdx);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                          isSelected ? 'bg-[#4F8CFF]/20 text-[#4F8CFF]' : 'bg-white/5 text-gray-400'
                        }`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                            {item.label}
                          </span>
                          {item.subtitle && (
                            <span className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.shortcut ? (
                        <div className="flex gap-1 shrink-0">
                          {item.shortcut.map(key => (
                            <kbd key={key} className="text-[9px] font-bold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                              {key}
                            </kbd>
                          ))}
                        </div>
                      ) : (
                        isSelected && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-[#4F8CFF] opacity-80 shrink-0 font-mono">
                            <span>Open</span>
                            <CornerDownLeft size={10} />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-[#080D1A] text-[10px] text-gray-500 font-mono select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-white/5 px-1 rounded border border-white/10 text-gray-400">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white/5 px-1 rounded border border-white/10 text-gray-400">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white/5 px-1 rounded border border-white/10 text-gray-400">esc</kbd> Dismiss
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <span>Powered by</span>
            <span className="font-bold text-[#4F8CFF] bg-[#4F8CFF]/10 px-1.5 py-0.5 rounded border border-[#4F8CFF]/20">Antigravity V3</span>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
    </div>
  );
}
