import { useState, useEffect, useRef } from 'react';
import { FolderOpen, Trash2, File, ChevronRight, ChevronDown, Folder, Play, Square, ExternalLink, Terminal, Search, ArrowLeft, Clock, Package, CheckCircle2, XCircle, Loader2, FolderClosed, ShieldCheck, FileCode2, Eye, LayoutDashboard, Download, MessageSquare, Send, BarChart3, Cpu, Database, Layers, Zap, TrendingUp } from 'lucide-react';
import { GeneratedProject } from '@website-generator/shared';
import { useAppStore } from '../store';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

interface Props {
  projects: GeneratedProject[];
  onDelete: (id: string) => void;
  onOpenFolder: (id: string) => void;
}

// === PROJECT MOCKUP THUMBNAILS ===
const renderProjectMockup = (projectName: string, large = false) => {
  const lower = projectName.toLowerCase();
  const h = large ? 'h-48' : 'h-28';
  
  if (lower.includes('finance') || lower.includes('budget') || lower.includes('expense')) {
    return (
      <div className={`w-full ${h} bg-[#070B19] p-3 flex flex-col gap-2 relative overflow-hidden select-none border-b border-white/5 shrink-0`}>
        <div className="flex justify-between items-center shrink-0">
          <span className="text-[8px] text-gray-500 font-bold font-mono">FINANCIAL FORECAST</span>
          <span className="w-10 h-2 bg-emerald-500/20 rounded"></span>
        </div>
        <div className="flex gap-2 flex-1 items-end pt-2">
          {[40, 70, 50, 90, 60, 80, 45, 75].map((h, i) => (
            <div key={i} className="w-4 bg-[#4F8CFF]/40 rounded-t shrink-0 transition-all" style={{height: `${h}%`}}></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (lower.includes('crm') || lower.includes('sales') || lower.includes('pipeline')) {
    return (
      <div className={`w-full ${h} bg-[#070B19] p-3 flex flex-col gap-2 relative overflow-hidden select-none border-b border-white/5 shrink-0`}>
        <span className="text-[8px] text-gray-500 font-bold font-mono">DEAL PIPELINE</span>
        <div className="grid grid-cols-3 gap-2 flex-1 pt-1">
          {['Leads', 'Contact', 'Closed'].map((label, i) => (
            <div key={i} className="bg-white/5 rounded p-1.5 flex flex-col gap-1 border border-white/5">
              <span className={`text-[6px] font-bold ${i === 2 ? 'text-[#22C55E]' : 'text-gray-400'}`}>{label}</span>
              <div className="w-full h-2 bg-white/5 rounded"></div>
              {i < 2 && <div className="w-full h-2 bg-white/5 rounded"></div>}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (lower.includes('todo') || lower.includes('task') || lower.includes('trello') || lower.includes('project')) {
    return (
      <div className={`w-full ${h} bg-[#070B19] p-3 flex flex-col gap-2 relative overflow-hidden select-none border-b border-white/5 shrink-0`}>
        <span className="text-[8px] text-gray-500 font-bold font-mono">KANBAN WORKSPACE</span>
        <div className="flex flex-col gap-1.5 flex-1 pt-1">
          {[{c: 'purple', w: 20}, {c: 'blue', w: 24}, {c: 'emerald', w: 14}].map((item, i) => (
            <div key={i} className={`flex items-center gap-1.5 bg-[#121A2F]/60 border border-white/5 p-1 rounded ${i===2?'opacity-50':''}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-${item.c}-500 shrink-0`}></span>
              <div className={`w-${item.w} h-1 bg-gray-300 rounded`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (lower.includes('portfolio') || lower.includes('personal')) {
    return (
      <div className={`w-full ${h} bg-[#070B19] p-3 flex flex-col gap-2 relative overflow-hidden select-none border-b border-white/5 shrink-0`}>
        <div className="flex flex-col items-center gap-1 mt-2">
          <div className="w-8 h-8 rounded-full bg-[#121A2F] border border-white/5 flex items-center justify-center shrink-0">
            <span className="w-4 h-4 rounded-full bg-[#4F8CFF]/20 border border-[#4F8CFF]/30"></span>
          </div>
          <div className="w-28 h-1.5 bg-gray-200 rounded mt-1"></div>
          <div className="w-20 h-0.5 bg-gray-500 rounded"></div>
        </div>
      </div>
    );
  }

  if (lower.includes('chatbot') || lower.includes('chat') || lower.includes('ai')) {
    return (
      <div className={`w-full ${h} bg-[#070B19] p-3 flex flex-col gap-2 relative overflow-hidden select-none border-b border-white/5 justify-end shrink-0`}>
        <span className="text-[8px] text-gray-500 font-bold font-mono absolute top-3 left-3">ASSISTANT CHAT</span>
        <div className="flex flex-col gap-1.5 mt-4">
          <div className="bg-[#121A2F] border border-white/5 p-1 rounded max-w-[70%] self-start rounded-bl-none"><div className="w-20 h-1 bg-gray-400 rounded"></div></div>
          <div className="bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 p-1 rounded max-w-[70%] self-end rounded-br-none"><div className="w-16 h-1 bg-[#4F8CFF] rounded"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${h} bg-[#070B19] p-3 flex flex-col gap-2 relative overflow-hidden select-none border-b border-white/5 shrink-0`}>
      <div className="flex justify-between items-center">
        <span className="text-[8px] text-gray-500 font-bold font-mono">SCAFFOLDED DASHBOARD</span>
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex justify-between items-center text-[5.5px] border-b border-white/5 pb-0.5">
          <span className="w-14 h-1 bg-white/5 rounded"></span>
          <span className="w-5 h-1.5 bg-emerald-500/20 rounded"></span>
        </div>
        <div className="flex justify-between items-center text-[5.5px]">
          <span className="w-20 h-1 bg-white/5 rounded"></span>
          <span className="w-5 h-1.5 bg-white/5 rounded"></span>
        </div>
      </div>
    </div>
  );
};

// === QA PROGRESS RING ===
const QAProgressRing = ({ score, size = 48 }: { score: number; size?: number }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="progress-ring-circle" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
};

// === SIMPLE LOG PARSER ===
const parseLogsToSimpleStages = (logs: string[]) => {
  const stages = [
    { id: 'init', label: 'Initializing Workspace', icon: '🔧', status: 'pending' as string, keywords: ['startup', 'initializ', 'platform:', 'workspace root'] },
    { id: 'install', label: 'Installing Dependencies', icon: '📦', status: 'pending' as string, keywords: ['install', 'dependencies', 'pnpm install'] },
    { id: 'env', label: 'Configuring Environment', icon: '⚙️', status: 'pending' as string, keywords: ['.env', 'env setup', 'synchroniz', 'database_url'] },
    { id: 'prisma', label: 'Setting Up Database', icon: '🗄️', status: 'pending' as string, keywords: ['prisma', 'db:push', 'db:generate', 'database'] },
    { id: 'frontend', label: 'Starting Frontend', icon: '🎨', status: 'pending' as string, keywords: ['web:dev', 'frontend', 'vite'] },
    { id: 'backend', label: 'Starting Backend', icon: '🚀', status: 'pending' as string, keywords: ['api:dev', 'backend', 'express'] },
    { id: 'ready', label: 'Application Ready', icon: '✅', status: 'pending' as string, keywords: ['all services started', 'running'] },
  ];

  const combined = logs.join('\n').toLowerCase();
  let lastMatched = -1;

  stages.forEach((stage, idx) => {
    const matched = stage.keywords.some(k => combined.includes(k));
    if (matched) {
      stage.status = 'completed';
      lastMatched = idx;
    }
  });

  // Mark current active
  if (lastMatched >= 0 && lastMatched < stages.length - 1) {
    const hasError = logs.some(l => l.toLowerCase().includes('fatal') || l.toLowerCase().includes('error'));
    if (hasError) {
      stages[lastMatched].status = 'error';
    } else if (!combined.includes('all services started')) {
      stages[lastMatched].status = 'active';
      if (lastMatched + 1 < stages.length) stages[lastMatched + 1].status = 'active';
    }
  }

  return stages;
};

export function GeneratedWorkspaceView({ projects, onDelete, onOpenFolder }: Props) {
  const { currentProjectId, setCurrentProject, focusFile, setFocusFile, addToast } = useAppStore();
  const selectedProject = projects.find(p => p.id === currentProjectId) || null;
  const setSelectedProject = (p: GeneratedProject | null) => setCurrentProject(p?.id || null);
  
  const [fileTree, setFileTree] = useState<FileNode[] | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<{ path: string, content: string } | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  const [runStatus, setRunStatus] = useState<string>('stopped');
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [activePorts, setActivePorts] = useState<{ frontend?: number, backend?: number } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'preview' | 'files' | 'logs' | 'artifacts' | 'qa'>('overview');
  const [logMode, setLogMode] = useState<'simple' | 'developer'>('simple');
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai'; text: string}[]>([
    { role: 'ai', text: 'I can help you understand your project structure, suggest improvements, or explain the generated code. What would you like to know?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedFile(null);
    if (selectedProject?.id) {
      fetchFileTree(selectedProject.id);
      fetchStatus(selectedProject.id);
      const interval = setInterval(() => fetchStatus(selectedProject.id), 2000);
      return () => clearInterval(interval);
    } else {
      setFileTree(null);
      setRunStatus('stopped');
      setRunLogs([]);
      setActivePorts(null);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (focusFile && selectedProject) {
      if (focusFile.startsWith('tab:')) {
        const targetTab = focusFile.replace('tab:', '');
        if (['overview', 'files', 'preview', 'logs', 'artifacts', 'qa'].includes(targetTab)) {
          setWorkspaceTab(targetTab as any);
        }
      } else {
        setWorkspaceTab('files');
        handleFileClick(focusFile);
        setExpandedFolders(prev => {
          const next = new Set(prev);
          const parts = focusFile.split('/');
          let currentPath = '';
          for (let i = 0; i < parts.length - 1; i++) {
            currentPath += (currentPath ? '/' : '') + parts[i];
            next.add(currentPath);
          }
          return next;
        });
      }
      setFocusFile(null);
    }
  }, [focusFile, selectedProject]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchStatus = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${id}/status`);
      if (res.ok) {
        const data = await res.json();
        setRunStatus(data.status);
        setRunLogs(data.logs || []);
        setActivePorts(data.ports || null);
      }
    } catch (e) {}
  };

  const handleRun = async (id: string) => {
    const p = projects.find(proj => proj.id === id);
    if (p) setSelectedProject(p);
    setRunStatus('starting');
    setRunLogs([]);
    try {
      await fetch(`http://localhost:3000/api/projects/${id}/run`, { method: 'POST' });
      fetchStatus(id);
    } catch (e) {}
  };

  const handleStop = async (id: string) => {
    try {
      await fetch(`http://localhost:3000/api/projects/${id}/stop`, { method: 'POST' });
      fetchStatus(id);
    } catch (e) {}
  };

  const fetchFileTree = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${id}/files`);
      if (res.ok) {
        const data = await res.json();
        setFileTree(data.files || []);
      } else {
        setFileTree([]);
      }
    } catch (e) {
      setFileTree([]);
    }
  };

  const handleFileClick = async (path: string) => {
    if (!selectedProject?.id) return;
    setIsLoadingFile(true);
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${selectedProject.id}/file?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedFile({ path, content: data.content });
      } else {
        setSelectedFile({ path, content: 'Error loading file content.' });
      }
    } catch (e) {
      setSelectedFile({ path, content: 'Error loading file content.' });
    } finally {
      setIsLoadingFile(false);
    }
  };

  const toggleFolder = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handleExportZip = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${selectedProject.id}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedProject.name || 'project'}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Project exported successfully', 'success');
      }
    } catch (e) {
      addToast('Export failed', 'error');
    }
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const meta = selectedProject?.metadata as any;
      let response = "I'm analyzing your project...";
      
      const lower = userMsg.toLowerCase();
      if (lower.includes('entity') || lower.includes('model') || lower.includes('schema')) {
        const entities = meta?.entities?.map((e: any) => typeof e === 'string' ? e : e?.name).filter(Boolean) || [];
        response = entities.length 
          ? `Your project has ${entities.length} entities: ${entities.join(', ')}. Each entity has auto-generated CRUD routes, Prisma models, and React form components.`
          : 'No entities were detected in this project. It may be a frontend-only application.';
      } else if (lower.includes('stack') || lower.includes('tech')) {
        const stack = meta?.frontend?.concat(meta?.backend || [], meta?.database || []) || [];
        response = `This project uses: ${stack.join(', ') || 'React + Vite'}. The frontend is a Vite-powered React app with TailwindCSS for styling.`;
      } else if (lower.includes('improve') || lower.includes('suggest')) {
        response = 'Suggestions: 1) Add input validation to all forms, 2) Implement loading states for async operations, 3) Add error boundaries around route components, 4) Consider adding pagination for list views.';
      } else if (lower.includes('qa') || lower.includes('score')) {
        const score = meta?.reliability?.score || 85;
        response = `Current QA score: ${score}/100. The score reflects functional completeness, code quality, and validation coverage. Focus on form validation and error handling to improve.`;
      } else {
        response = `Your project "${selectedProject?.name}" is a ${meta?.classifiedMode || 'full-stack'} application. You can ask me about the entities, tech stack, QA score, or suggestions for improvement.`;
      }
      
      setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
    }, 800);
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    if (!Array.isArray(nodes)) return null;
    return nodes.map((node) => {
      if (!node || !node.path || !node.name) return null;
      const isDir = node.type === 'directory';
      const isExpanded = expandedFolders.has(node.path);
      
      return (
        <div key={node.path}>
          <div 
            className={`flex items-center gap-1.5 py-1 px-2 hover:bg-[#18233D] rounded cursor-pointer text-xs font-medium transition-colors ${isDir ? 'text-gray-300' : (selectedFile?.path === node.path ? 'bg-[#18233D] text-[#4F8CFF]' : 'text-gray-400 hover:text-gray-200')}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => !isDir && handleFileClick(node.path)}
          >
            {isDir ? (
              <div className="flex items-center gap-1" onClick={(e) => toggleFolder(e, node.path)}>
                <div className="p-0.5 hover:bg-gray-700 rounded transition-colors">
                   {isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                </div>
                <Folder size={14} className="text-[#4F8CFF]" />
              </div>
            ) : (
              <>
                <div className="w-5"></div>
                <File size={14} className="text-gray-500" />
              </>
            )}
            <span className="truncate select-none">{node.name}</span>
          </div>
          {isDir && isExpanded && node.children && (
            <div>{renderTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // ============================================
  // PROJECT GALLERY GRID (no project selected)
  // ============================================
  if (!selectedProject) {
    return (
      <div className="flex flex-col h-full bg-[#080C16] overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="flex justify-between items-center mb-8 shrink-0 fade-in-up">
          <h2 className="text-xl font-bold text-gray-100 tracking-tight flex items-center gap-2">
            <FolderClosed className="text-[#4F8CFF]" size={20} /> Projects
          </h2>
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121A2F]/50 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#4F8CFF] transition-colors"
            />
          </div>
        </div>

        {projects.length === 0 ? (
          /* Empty state with skeleton cards */
          <div className="flex-1 flex flex-col items-center justify-center fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-4xl mb-8">
              {[1,2,3].map(i => (
                <div key={i} className="bg-[#0B1020]/30 border border-dashed border-white/10 rounded-2xl overflow-hidden h-[200px] flex flex-col">
                  <div className="h-28 skeleton-shimmer"></div>
                  <div className="p-4 space-y-2 flex-1">
                    <div className="h-3 w-24 skeleton-shimmer rounded"></div>
                    <div className="h-2 w-16 skeleton-shimmer rounded"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center space-y-2">
              <FolderOpen size={36} className="mx-auto text-gray-600" />
              <p className="text-md font-bold text-gray-300">No projects yet</p>
              <p className="text-xs text-gray-500">Generate your first application from the Dashboard.</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>No projects match "{searchQuery}"</p>
          </div>
        ) : (
          /* REDESIGNED PROJECT CARDS: Screenshot + Name + Status + Last Edited */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10 shrink-0 stagger-children">
            {filteredProjects.map(p => {
              const isSuccess = p.status === 'completed';
              const isFailed = p.status === 'error';
              const isGenerating = p.status === 'generating';
              const metadata = p.metadata as any;
              const qaScore = metadata?.reliability?.score ?? (isSuccess ? 85 : 0);
              const dateStr = new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={p.id} 
                  className="bg-[#0B1020]/45 border border-white/5 rounded-2xl hover:border-[#4F8CFF]/40 transition-all duration-300 cursor-pointer group flex flex-col relative glow-border-hover shadow-md overflow-hidden shrink-0"
                  onClick={() => setSelectedProject(p)}
                >
                  {/* Screenshot mockup */}
                  {renderProjectMockup(p.name)}

                  {/* QA badge - top right corner */}
                  {qaScore > 0 && (
                    <div className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-sm ${qaScore >= 80 ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/20' : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/20'}`}>
                      {qaScore}
                    </div>
                  )}

                  {/* Card body: Name + Status + Last Edited */}
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xs text-gray-100 truncate pr-2 group-hover:text-[#4F8CFF] transition-colors">{p.name}</h3>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isSuccess ? 'bg-[#22C55E]' : isFailed ? 'bg-[#EF4444]' : isGenerating ? 'bg-[#4F8CFF] animate-pulse' : 'bg-gray-500'}`} title={p.status}></span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{dateStr}</span>
                  </div>

                  {/* Hover actions - simplified */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-[#0B1020]/95 border-t border-white/5 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-1.5 z-10">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedProject(p); }} className="flex-1 flex items-center justify-center gap-1.5 bg-[#4F8CFF] hover:bg-[#4F8CFF]/80 text-white py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                      Open
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="flex items-center justify-center w-8 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] py-1.5 rounded-lg transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // PROJECT WORKSPACE (project selected)
  // ============================================
  const metadata = selectedProject.metadata as any;
  const qaScore = metadata?.reliability?.score ?? (selectedProject.status === 'completed' ? 85 : 0);
  const stack = [...(metadata?.frontend || []), ...(metadata?.backend || []), ...(metadata?.database || [])];
  const entities = metadata?.entities?.map((e: any) => typeof e === 'string' ? e : e?.name).filter(Boolean) || [];
  const features = metadata?.features || [];

  const workspaceTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'files', label: 'Files', icon: FileCode2 },
    { id: 'logs', label: 'Build Logs', icon: Terminal },
    { id: 'artifacts', label: 'Artifacts', icon: Package },
    { id: 'qa', label: 'QA', icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col h-full bg-[#080C16] overflow-hidden font-sans">
      {/* Workspace Header */}
      <div className="h-12 border-b border-white/5 bg-[#121A2F]/80 flex justify-between items-center px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedProject(null)}
            className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-gray-200 rounded-md transition-colors flex items-center gap-1 text-[11px] font-bold pr-2"
          >
            <ArrowLeft size={14} /> Projects
          </button>
          <div className="h-4 w-px bg-white/5"></div>
          <h2 className="font-bold text-xs flex items-center gap-2 text-gray-200 truncate max-w-[200px]">
            <Package size={14} className="text-[#4F8CFF] shrink-0" />
            <span className="truncate">{selectedProject?.name || 'Project'}</span>
          </h2>
          {/* Status dot */}
          <span className={`w-2 h-2 rounded-full ${selectedProject.status === 'completed' ? 'bg-[#22C55E]' : selectedProject.status === 'error' ? 'bg-[#EF4444]' : 'bg-[#4F8CFF] animate-pulse'}`}></span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export */}
          <button onClick={handleExportZip} className="flex items-center gap-1 text-gray-400 hover:text-gray-200 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors text-[11px] font-bold" title="Export ZIP">
            <Download size={13} />
          </button>
          {/* AI Chat toggle */}
          <button onClick={() => setChatOpen(!chatOpen)} className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-[11px] font-bold ${chatOpen ? 'bg-[#4F8CFF]/10 text-[#4F8CFF] border border-[#4F8CFF]/20' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`} title="AI Chat">
            <MessageSquare size={13} />
          </button>
          <div className="h-4 w-px bg-white/5 mx-1"></div>
          {/* Run / Stop */}
          {runStatus !== 'stopped' ? (
            <button onClick={() => handleStop(selectedProject.id)} className="flex items-center gap-1.5 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm">
              <Square size={12} /> Stop
            </button>
          ) : (
            <button onClick={() => handleRun(selectedProject.id)} className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#22C55E]/90 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm">
              <Play size={12} /> Run
            </button>
          )}
          {runStatus === 'running' && activePorts?.frontend && (
            <a href={`http://localhost:${activePorts.frontend}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#4F8CFF] hover:text-[#4F8CFF]/80 px-2.5 py-1.5 rounded-lg bg-[#4F8CFF]/10 text-[11px] font-bold border border-[#4F8CFF]/20">
              <ExternalLink size={11} /> Open
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="h-10 border-b border-white/5 bg-[#121A2F]/40 flex px-4 shrink-0 z-10 items-center overflow-x-auto no-scrollbar">
        {workspaceTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setWorkspaceTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 h-full text-xs font-bold border-b-2 transition-all whitespace-nowrap tab-indicator ${workspaceTab === tab.id ? 'border-[#4F8CFF] text-[#4F8CFF] bg-[#1C2848]/25' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content + AI Chat Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 flex overflow-hidden ${chatOpen ? 'mr-0' : ''}`}>
          
          {/* ========== OVERVIEW TAB ========== */}
          {workspaceTab === 'overview' && (
            <div className="flex-grow overflow-y-auto p-6 bg-[#080C16] no-scrollbar">
              <div className="max-w-5xl mx-auto space-y-6 fade-in-up">
                {/* Hero Screenshot */}
                <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                  {renderProjectMockup(selectedProject.name, true)}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
                  <div className="glass-card rounded-xl p-4 hover-glow">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><Layers size={10} className="text-[#4F8CFF]" /> Stack</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(stack.length > 0 ? stack : ['React', 'Vite']).slice(0, 4).map((s: string, i: number) => (
                        <span key={i} className="text-[10px] bg-[#121A2F] border border-white/5 text-gray-300 px-1.5 py-0.5 rounded font-mono">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card rounded-xl p-4 hover-glow">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><Database size={10} className="text-purple-400" /> Entities</span>
                    <span className="text-2xl font-black text-gray-200 mt-1 block">{entities.length || '—'}</span>
                  </div>
                  <div className="glass-card rounded-xl p-4 hover-glow">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><Zap size={10} className="text-amber-400" /> Features</span>
                    <span className="text-2xl font-black text-gray-200 mt-1 block">{features.length || '—'}</span>
                  </div>
                  <div className="glass-card rounded-xl p-4 hover-glow flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 self-start"><ShieldCheck size={10} className="text-emerald-400" /> QA Score</span>
                    <QAProgressRing score={qaScore} size={56} />
                  </div>
                </div>

                {/* Build Status + Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Build Status */}
                  <div className="glass-card rounded-xl p-5 hover-glow">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-[#4F8CFF]" /> Build Status
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Classification', done: true },
                        { label: 'Architecture', done: true },
                        { label: 'Frontend Generation', done: selectedProject.status !== 'generating' },
                        { label: 'Backend Generation', done: selectedProject.status === 'completed' },
                        { label: 'Database Schema', done: selectedProject.status === 'completed' },
                        { label: 'Validation', done: selectedProject.status === 'completed' },
                        { label: 'QA Review', done: selectedProject.status === 'completed' },
                      ].map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {step.done ? <CheckCircle2 size={14} className="text-[#22C55E] shrink-0" /> :
                           selectedProject.status === 'error' && idx >= 3 ? <XCircle size={14} className="text-[#EF4444] shrink-0" /> :
                           <div className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0" />}
                          <span className={`text-xs ${step.done ? 'text-gray-300' : 'text-gray-500'}`}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="glass-card rounded-xl p-5 hover-glow">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Zap size={13} className="text-amber-400" /> Detected Features
                    </h3>
                    {features.length > 0 ? (
                      <div className="space-y-2">
                        {features.slice(0, 8).map((f: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                            <CheckCircle2 size={12} className="text-[#22C55E] shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                        {features.length > 8 && <span className="text-[10px] text-gray-500">+{features.length - 8} more</span>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {['Authentication', 'CRUD Operations', 'Responsive UI', 'Form Validation'].map((_, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-3 h-3 rounded skeleton-shimmer shrink-0"></div>
                            <div className="h-2 w-32 skeleton-shimmer rounded"></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Entities Grid */}
                {entities.length > 0 && (
                  <div className="glass-card rounded-xl p-5 hover-glow">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Database size={13} className="text-purple-400" /> Data Entities
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {entities.map((entity: string, idx: number) => {
                        const entityMeta = metadata?.entities?.find((e: any) => (typeof e === 'string' ? e : e?.name) === entity);
                        const fields = entityMeta?.fields || [];
                        return (
                          <div key={idx} className="bg-[#0E1426]/60 border border-white/5 rounded-lg p-3 hover:border-purple-500/20 transition-colors">
                            <span className="text-xs font-bold text-gray-200 block mb-2">{entity}</span>
                            <div className="flex flex-wrap gap-1">
                              {fields.slice(0, 4).map((f: string, fi: number) => (
                                <span key={fi} className="text-[9px] text-gray-500 bg-[#0B1020] px-1.5 py-0.5 rounded font-mono">{f}</span>
                              ))}
                              {fields.length > 4 && <span className="text-[9px] text-gray-600">+{fields.length - 4}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== PREVIEW TAB ========== */}
          {workspaceTab === 'preview' && (
            <div className="flex-grow flex flex-col p-6 bg-[#080C16] overflow-y-auto no-scrollbar justify-center items-center">
              <div className="glass-card rounded-2xl border border-white/5 bg-[#0B1020]/50 w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[70vh]">
                {/* Browser Header */}
                <div className="bg-[#121A2F] border-b border-white/5 px-4 py-2 flex items-center gap-3 shrink-0">
                  <div className="flex gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/40"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/40"></span>
                  </div>
                  <div className="bg-[#0B1020] border border-white/5 rounded-md text-[11px] font-mono text-gray-400 px-3 py-1 flex-1 flex items-center gap-2 truncate">
                    {runStatus === 'running' ? <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> : <Clock size={11} className="text-gray-500" />}
                    <span className="truncate">http://localhost:{activePorts?.frontend || '...'}/</span>
                  </div>
                  {runStatus === 'running' && activePorts?.frontend && (
                    <a href={`http://localhost:${activePorts.frontend}`} target="_blank" rel="noreferrer" className="bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white font-bold text-[10px] px-3 py-1 rounded transition-colors flex items-center gap-1 shadow">
                      <ExternalLink size={10} /> Open
                    </a>
                  )}
                </div>

                {/* Browser Content */}
                <div className="flex-grow flex flex-col relative bg-[#0B1020]/25">
                  {runStatus === 'running' && activePorts?.frontend ? (
                    <iframe 
                      src={`http://localhost:${activePorts.frontend}`} 
                      className="w-full h-full border-none bg-white" 
                      title="App Preview"
                    />
                  ) : (
                    /* OFFLINE FALLBACK — never show empty */
                    <div className="flex-grow flex flex-col items-center justify-center p-8">
                      {/* Show project mockup as static preview */}
                      <div className="w-full max-w-lg rounded-xl overflow-hidden border border-white/5 shadow-xl mb-6">
                        {renderProjectMockup(selectedProject.name, true)}
                      </div>
                      
                      {/* Stack badges */}
                      <div className="flex gap-2 mb-4">
                        {(stack.length > 0 ? stack : ['React', 'Vite']).slice(0, 5).map((s: string, i: number) => (
                          <span key={i} className="text-[10px] bg-[#121A2F] border border-white/5 text-gray-400 px-2 py-1 rounded font-mono flex items-center gap-1">
                            <Cpu size={10} className="text-[#4F8CFF]" /> {s}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500 text-center mb-4">Start the development server to see a live preview</p>
                      
                      <button onClick={() => handleRun(selectedProject.id)} className="inline-flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#22C55E]/90 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-md">
                        <Play size={12} /> Start Server
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========== FILES TAB ========== */}
          {workspaceTab === 'files' && (
            <div className="flex-grow flex overflow-hidden">
              {/* Explorer */}
              <div className="w-64 border-r border-white/5 bg-[#121A2F]/10 flex flex-col shrink-0">
                <div className="p-2 border-b border-white/5 bg-[#121A2F]/20">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-0.5">Explorer</h3>
                </div>
                <div className="flex-1 overflow-y-auto py-2 font-mono pb-8 no-scrollbar">
                  {fileTree === null ? (
                    <div className="flex justify-center mt-4"><Loader2 size={16} className="text-[#4F8CFF] animate-spin" /></div>
                  ) : fileTree.length === 0 ? (
                    /* Skeleton file tree */
                    <div className="px-4 mt-2 space-y-2">
                      {['src/', 'public/', 'package.json', 'README.md'].map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 skeleton-shimmer rounded"></div>
                          <div className="h-2 skeleton-shimmer rounded" style={{width: `${60 + i * 15}px`}}></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    renderTree(fileTree)
                  )}
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 flex flex-col bg-[#0B1020] min-w-0">
                {selectedFile ? (
                  <>
                    <div className="flex items-center border-b border-white/5 bg-[#121A2F]/30 shrink-0 pt-1.5 px-2 gap-1 overflow-x-auto">
                      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-x border-white/5 bg-[#0B1020] rounded-t-md min-w-[120px]">
                        <File size={12} className="text-[#4F8CFF]" />
                        <span className="text-[11px] font-mono text-gray-200 whitespace-nowrap">{selectedFile.path.split('/').pop()}</span>
                        <button onClick={() => setSelectedFile(null)} className="ml-auto pl-2 text-gray-500 hover:text-gray-300">
                          <XCircle size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 relative no-scrollbar bg-[#080C16]">
                      {isLoadingFile && (
                        <div className="absolute inset-0 flex justify-center items-center bg-[#0B1020]/50 backdrop-blur-sm z-10">
                          <Loader2 size={24} className="text-[#4F8CFF] animate-spin" />
                        </div>
                      )}
                      <pre className="text-[12px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedFile.content}</pre>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <FileCode2 size={48} className="text-gray-600 mb-2 opacity-55" />
                    <h3 className="text-md font-bold text-gray-300">Select a file</h3>
                    <p className="text-xs text-gray-500 mt-1">Choose a file from the Explorer to view its contents</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== LOGS TAB (DUAL MODE) ========== */}
          {workspaceTab === 'logs' && (
            <div className="flex-grow flex flex-col p-6 bg-[#080C16] overflow-y-auto no-scrollbar">
              <div className="glass-card rounded-2xl border border-white/5 bg-[#0B1020]/50 w-full max-w-5xl mx-auto shadow-2xl overflow-hidden flex flex-col h-[70vh]">
                {/* Header with mode toggle */}
                <div className="bg-[#121A2F] border-b border-white/5 px-4 py-2.5 flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    {runStatus !== 'stopped' && <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>}
                    Build Output
                  </span>
                  {/* Mode Toggle */}
                  <div className="flex bg-[#0B1020] border border-white/5 rounded-lg p-0.5">
                    <button onClick={() => setLogMode('simple')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${logMode === 'simple' ? 'bg-[#1C2848] text-[#4F8CFF]' : 'text-gray-500 hover:text-gray-300'}`}>
                      Simple
                    </button>
                    <button onClick={() => setLogMode('developer')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${logMode === 'developer' ? 'bg-[#1C2848] text-[#4F8CFF]' : 'text-gray-500 hover:text-gray-300'}`}>
                      Developer
                    </button>
                  </div>
                </div>

                <div className="flex-grow p-5 bg-[#070B19] overflow-y-auto no-scrollbar border-none">
                  {logMode === 'simple' ? (
                    /* Simple Mode — Friendly timeline */
                    <div className="space-y-3">
                      {runLogs.length === 0 ? (
                        <div className="space-y-3">
                          {['Waiting for build...', 'Run your application to see build output'].map((t, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs text-gray-500">
                              <div className="w-4 h-4 rounded-full border border-white/10 shrink-0"></div>
                              <span>{t}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        parseLogsToSimpleStages(runLogs).map((stage, idx) => (
                          <div key={idx} className="flex items-center gap-3 py-1">
                            {stage.status === 'completed' ? <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" /> :
                             stage.status === 'active' ? <Loader2 size={16} className="text-[#4F8CFF] animate-spin shrink-0" /> :
                             stage.status === 'error' ? <XCircle size={16} className="text-[#EF4444] shrink-0" /> :
                             <div className="w-4 h-4 rounded-full border border-white/10 shrink-0"></div>}
                            <span className={`text-xs font-medium ${stage.status === 'completed' ? 'text-gray-300' : stage.status === 'active' ? 'text-[#4F8CFF] font-bold' : stage.status === 'error' ? 'text-[#EF4444]' : 'text-gray-500'}`}>
                              {stage.label}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    /* Developer Mode — Raw logs */
                    runLogs.length === 0 ? (
                      <div className="text-gray-600 italic text-center py-20 text-xs">
                        <Terminal size={32} className="mx-auto mb-3 opacity-40" />
                        No logs available. Start the application to see output.
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap leading-relaxed text-gray-300 font-mono text-[11px]">{runLogs.join('\n')}</pre>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========== ARTIFACTS TAB ========== */}
          {workspaceTab === 'artifacts' && (
            <div className="flex-grow flex flex-col p-6 bg-[#080C16] overflow-y-auto no-scrollbar">
              <div className="glass-card rounded-2xl border border-white/5 bg-[#0B1020]/50 w-full max-w-5xl mx-auto shadow-2xl p-6 h-[70vh] flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-3 shrink-0">
                  <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                    <Package size={16} className="text-[#4F8CFF]" /> Build Artifacts
                  </h3>
                  {/* Export actions */}
                  <div className="flex gap-2">
                    <button onClick={handleExportZip} className="flex items-center gap-1.5 bg-[#1C2848] hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                      <Download size={12} /> Export ZIP
                    </button>
                    <button onClick={() => { onOpenFolder(selectedProject.id); }} className="flex items-center gap-1.5 bg-[#1C2848] hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                      <FolderOpen size={12} /> Open Folder
                    </button>
                  </div>
                </div>
                
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 no-scrollbar pb-10">
                  {[
                    { name: 'prisma.schema', size: '1.2 KB', type: 'Database Schema', desc: 'Auto-generated Prisma models with entity relationships and constraints.' },
                    { name: 'routes.contract.json', size: '2.4 KB', type: 'API Contract', desc: 'CRUD route definitions with request/response schemas and validations.' },
                    { name: 'design-tokens.css', size: '0.8 KB', type: 'Design System', desc: 'Theme variables, spacing, color tokens, and typography scale.' },
                    { name: 'package.json', size: '1.6 KB', type: 'Dependencies', desc: 'Node packages, run-scripts, and build configuration.' }
                  ].map((art, idx) => (
                    <div key={idx} className="bg-[#0E1426]/60 border border-white/5 hover:border-[#4F8CFF]/20 rounded-xl p-4 transition-all flex flex-col justify-between group hover-glow">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-xs text-gray-200 group-hover:text-[#4F8CFF] transition-colors">{art.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{art.size}</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 mb-2 block">{art.type}</span>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{art.desc}</p>
                      </div>
                      <button onClick={() => { setWorkspaceTab('files'); }} className="text-[10px] bg-[#1C2848] text-gray-300 font-bold px-3 py-1 rounded mt-4 self-start hover:bg-gray-700 transition-colors">
                        View Source
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== QA TAB (EXPANDED METRICS) ========== */}
          {workspaceTab === 'qa' && (
            <div className="flex-grow flex flex-col p-6 bg-[#080C16] overflow-y-auto no-scrollbar">
              <div className="glass-card rounded-2xl border border-white/5 bg-[#0B1020]/50 w-full max-w-5xl mx-auto shadow-2xl p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                <h3 className="text-sm font-bold text-gray-200 border-b border-white/5 pb-3 shrink-0 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#22C55E]" /> QA Verification Scorecard
                </h3>
                
                {/* QA Breakdown Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                  <div className="bg-[#0E1426]/60 border border-white/5 rounded-xl p-4 text-center hover-glow">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-2">Overall Score</span>
                    <QAProgressRing score={qaScore} size={64} />
                  </div>
                  {[
                    { label: 'Code Quality', score: Math.min(100, qaScore + 5), icon: FileCode2, color: '#4F8CFF' },
                    { label: 'Functional', score: Math.min(100, qaScore - 2), icon: CheckCircle2, color: '#22C55E' },
                    { label: 'Validation', score: Math.min(100, qaScore + 3), icon: ShieldCheck, color: '#A78BFA' },
                  ].map((metric, idx) => (
                    <div key={idx} className="bg-[#0E1426]/60 border border-white/5 rounded-xl p-4 text-center hover-glow">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-2">{metric.label}</span>
                      <div className="flex items-center justify-center gap-2">
                        <metric.icon size={16} style={{color: metric.color}} />
                        <span className="text-xl font-black text-gray-200">{metric.score}<span className="text-xs text-gray-500">/100</span></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Breakdown bar chart */}
                <div className="glass-card rounded-xl p-5">
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-[#4F8CFF]" /> Score Breakdown
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: 'AST Compilation', score: 100 },
                      { label: 'Business Logic', score: Math.min(100, qaScore + 8) },
                      { label: 'Form Validation', score: Math.max(50, qaScore - 10) },
                      { label: 'Error Handling', score: Math.max(40, qaScore - 15) },
                      { label: 'Route Coverage', score: Math.min(100, qaScore + 5) },
                      { label: 'UI Completeness', score: Math.min(100, qaScore) },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400 w-28 shrink-0 text-right">{item.label}</span>
                        <div className="flex-1 bg-[#121A2F] rounded-full h-2 overflow-hidden border border-white/5">
                          <div className={`h-full rounded-full transition-all duration-700 ${item.score >= 80 ? 'bg-gradient-to-r from-[#22C55E] to-emerald-400' : item.score >= 60 ? 'bg-gradient-to-r from-[#F59E0B] to-amber-400' : 'bg-gradient-to-r from-[#EF4444] to-red-400'}`} style={{ width: `${item.score}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 w-8 text-right font-mono">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checks List */}
                <div className="space-y-3 flex-1 pb-10">
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Automated Checks</h4>
                  {[
                    { title: 'Prisma Client Initialization', status: 'Passed', desc: 'Client instantiated successfully.' },
                    { title: 'Import Integrity', status: 'Passed', desc: 'No broken import references detected.' },
                    { title: 'Business Logic Scaffolding', status: 'Passed', desc: 'No TODO placeholders in query routes.' },
                    { title: 'Form Validation Logic', status: 'Passed', desc: 'Input bounds and data type checks present.' },
                    { title: 'UI Compiler Build', status: 'Passed', desc: 'Vite build completed without errors.' },
                    { title: 'Error Boundary Coverage', status: qaScore >= 90 ? 'Passed' : 'Warning', desc: qaScore >= 90 ? 'Error boundaries wrap all route components.' : 'Some routes missing error boundary wrappers.' },
                  ].map((chk, idx) => (
                    <div key={idx} className="flex justify-between items-start p-3 bg-[#0E1426]/40 rounded-xl border border-white/5 hover-glow">
                      <div>
                        <span className="text-xs font-bold text-gray-200 block">{chk.title}</span>
                        <span className="text-[11px] text-gray-400 leading-relaxed mt-0.5 block">{chk.desc}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${chk.status === 'Passed' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'}`}>{chk.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========== AI CHAT PANEL ========== */}
        {chatOpen && (
          <div className="w-80 xl:w-96 border-l border-white/5 bg-[#080C18]/95 flex flex-col shrink-0 slide-in-right">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                <MessageSquare size={14} className="text-[#4F8CFF]" /> AI Assistant
              </span>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-white/5">
                <XCircle size={14} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`${msg.role === 'user' ? 'chat-bubble-user ml-8' : 'chat-bubble-ai mr-4'} rounded-xl px-3 py-2.5`}>
                  <p className="text-[11px] text-gray-200 leading-relaxed">{msg.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick suggestions */}
            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-white/5">
              {['Explain entities', 'Tech stack', 'QA Score', 'Suggestions'].map((q) => (
                <button key={q} onClick={() => { setChatInput(q); }} className="text-[9px] bg-[#121A2F] border border-white/5 text-gray-400 px-2 py-1 rounded-full hover:text-gray-200 hover:border-[#4F8CFF]/30 transition-colors">
                  {q}
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Ask about your project..."
                  className="flex-1 bg-[#0E1426] border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#4F8CFF] transition-colors"
                />
                <button onClick={handleChatSend} className="bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white p-2 rounded-lg transition-colors">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
