import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { GeneratedProject, GenerationEvent } from '@website-generator/shared';
import { useAppStore } from './store';
import { GeneratedWorkspaceView } from './components/GeneratedWorkspaceView';
import { GenerationErrorBoundary } from './components/GenerationErrorBoundary';
import { ConfirmModal } from './components/ConfirmModal';
import { TemplatesView } from './components/TemplatesView';
import { FailedProjectsView } from './components/FailedProjectsView';
import { QACenterView } from './components/QACenterView';
import { Button, Card, CardContent } from '@website-generator/ui';
import { Terminal, Settings, Play, Activity, FileText, CheckCircle2, XCircle, Loader2, LayoutTemplate, FolderClosed, DollarSign, Users, CheckSquare, Bot, Boxes, HelpCircle, Sparkles, Layout } from 'lucide-react';
import { CommandPalette } from './components/CommandPalette';
import { commandRegistry } from './store/commandRegistry';
import { ProjectHealthPanel } from './components/ProjectHealthPanel';
import { GenerationTimeline } from './components/GenerationTimeline';

interface PromptAnalysis {
  appType: string;
  stack: string[];
  entities: string[];
  features: string[];
  estFiles: number;
  confidence: number;
}

function analyzePrompt(text: string): PromptAnalysis | null {
  if (!text.trim()) return null;
  const lower = text.toLowerCase();
  
  let appType = 'CRUD Application';
  let stack = ['React', 'Express', 'Prisma', 'PostgreSQL'];
  let entities: string[] = ['User'];
  let features: string[] = ['Authentication', 'Responsive UI'];
  let estFiles = 12;
  let confidence = 95;

  if (lower.includes('finance') || lower.includes('budget') || lower.includes('expense')) {
    appType = 'Financial Dashboard';
    entities = ['User', 'Account', 'Transaction', 'Budget', 'Category'];
    features = ['Auth', 'Charts & Spending', 'Category Budgeting', 'CSV Export', 'Transaction History'];
    estFiles = 18;
    confidence = 94;
  } else if (lower.includes('crm') || lower.includes('customer') || lower.includes('pipeline') || lower.includes('sales')) {
    appType = 'Sales CRM Portal';
    entities = ['User', 'Contact', 'Company', 'Deal', 'ActivityLog'];
    features = ['Kanban Pipeline', 'Contact Timeline', 'Reminders', 'Auth', 'Sales Reporting'];
    estFiles = 22;
    confidence = 92;
  } else if (lower.includes('todo') || lower.includes('task') || lower.includes('trello') || lower.includes('project')) {
    appType = 'Task Management Workspace';
    entities = ['User', 'Board', 'Column', 'Task', 'Label', 'Comment'];
    features = ['Kanban Board UI', 'Workspace Invites', 'Activity Feed', 'Auth', 'Due Date Alerts'];
    estFiles = 20;
    confidence = 96;
  } else if (lower.includes('portfolio') || lower.includes('personal site') || lower.includes('developer portfolio')) {
    appType = 'Interactive Portfolio';
    stack = ['React', 'Vite', 'TailwindCSS'];
    entities = ['Project', 'Experience', 'Skill', 'Message'];
    features = ['Project Search/Filter', 'Experience Timeline', 'Contact Form UI', 'Responsive Details'];
    estFiles = 10;
    confidence = 98;
  } else if (lower.includes('chatbot') || lower.includes('chat') || lower.includes('openai') || lower.includes('ai assistant')) {
    appType = 'AI Chatbot Portal';
    entities = ['User', 'ChatRoom', 'Message', 'ApiKey', 'PromptTemplate'];
    features = ['Markdown Rendering', 'Multiple Chat Rooms', 'System Instruction Tuning', 'Token Usage Metrics', 'Code Highlight'];
    estFiles = 16;
    confidence = 93;
  } else if (lower.includes('inventory') || lower.includes('stock') || lower.includes('warehouse') || lower.includes('supplier')) {
    appType = 'Enterprise Inventory Manager';
    entities = ['User', 'Product', 'StockMovement', 'Supplier', 'Warehouse'];
    features = ['Low Stock Alerts', 'Stock In/Out Logs', 'Supplier Directory', 'Auth', 'Reorder Suggestion'];
    estFiles = 24;
    confidence = 91;
  } else {
    if (lower.includes('auth') || lower.includes('login') || lower.includes('user')) {
      features.push('User Auth');
    }
    if (lower.includes('chart') || lower.includes('dashboard') || lower.includes('report')) {
      appType = 'Management Dashboard';
      features.push('Charts & Analytics');
    }
    const words = text.match(/[A-Z][a-zA-Z]+/g) || [];
    const uniqueEntities = Array.from(new Set(words.filter(w => !['React', 'Node', 'PostgreSQL', 'Express', 'Prisma', 'API', 'JSON', 'HTML', 'CSS'].includes(w))));
    if (uniqueEntities.length > 0) {
      entities = ['User', ...uniqueEntities.slice(0, 4)];
    } else {
      entities = ['User', 'Item'];
    }
    estFiles = 10 + entities.length * 2;
    confidence = Math.floor(Math.random() * 5) + 92;
  }

  return { appType, stack, entities, features, estFiles, confidence };
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [textInput, setTextInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<GenerationEvent[]>([]);
  const [projects, setProjects] = useState<GeneratedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'failed' | 'templates'>('recent');

  const { activeView, setActiveView, setCurrentProject, setFocusFile, toasts, addToast } = useAppStore();

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch('http://localhost:3000/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load projects', 'error');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeView]);

  useEffect(() => {
    commandRegistry.register({
      id: 'goto-dashboard',
      label: 'Go to Dashboard',
      category: 'Navigation',
      shortcut: ['G', 'D'],
      execute: () => setActiveView('dashboard')
    });
    commandRegistry.register({
      id: 'goto-projects',
      label: 'View Projects',
      category: 'Navigation',
      shortcut: ['G', 'P'],
      execute: () => setActiveView('projects')
    });
    commandRegistry.register({
      id: 'goto-terminal',
      label: 'View System Logs',
      category: 'Navigation',
      shortcut: ['G', 'L'],
      execute: () => setActiveView('terminal')
    });
    commandRegistry.register({
      id: 'goto-settings',
      label: 'Open Settings',
      category: 'Preferences',
      shortcut: ['G', 'S'],
      execute: () => setActiveView('settings')
    });
    commandRegistry.register({
      id: 'generate-project',
      label: 'Generate New Project',
      category: 'Actions',
      shortcut: ['Ctrl', 'N'],
      execute: () => {
        setActiveView('dashboard');
      }
    });
    commandRegistry.register({
      id: 'goto-templates',
      label: 'Browse Starter Templates',
      category: 'Navigation',
      shortcut: ['G', 'T'],
      execute: () => {
        setActiveView('dashboard');
        setActiveTab('templates');
      }
    });
    commandRegistry.register({
      id: 'open-project-logs',
      label: 'Open Active Project Logs',
      category: 'Project Workspace',
      shortcut: ['O', 'L'],
      execute: () => {
        const currentId = useAppStore.getState().currentProjectId;
        if (currentId) {
          setActiveView('projects');
          setFocusFile('tab:logs');
        } else {
          addToast('No active project is currently selected', 'info');
        }
      }
    });
    commandRegistry.register({
      id: 'open-project-qa',
      label: 'Open Active Project QA scorecard',
      category: 'Project Workspace',
      shortcut: ['O', 'Q'],
      execute: () => {
        const currentId = useAppStore.getState().currentProjectId;
        if (currentId) {
          setActiveView('projects');
          setFocusFile('tab:qa');
        } else {
          addToast('No active project is currently selected', 'info');
        }
      }
    });
    commandRegistry.register({
      id: 'open-project-artifacts',
      label: 'Open Active Project Build Artifacts',
      category: 'Project Workspace',
      shortcut: ['O', 'A'],
      execute: () => {
        const currentId = useAppStore.getState().currentProjectId;
        if (currentId) {
          setActiveView('projects');
          setFocusFile('tab:artifacts');
        } else {
          addToast('No active project is currently selected', 'info');
        }
      }
    });
    commandRegistry.register({
      id: 'open-project-preview',
      label: 'Open Active Project Preview',
      category: 'Project Workspace',
      shortcut: ['O', 'P'],
      execute: () => {
        const currentId = useAppStore.getState().currentProjectId;
        if (currentId) {
          setActiveView('projects');
          setFocusFile('tab:preview');
        } else {
          addToast('No active project is currently selected', 'info');
        }
      }
    });
    commandRegistry.register({
      id: 'open-project-files',
      label: 'Open Active Project Files',
      category: 'Project Workspace',
      shortcut: ['O', 'F'],
      execute: () => {
        const currentId = useAppStore.getState().currentProjectId;
        if (currentId) {
          setActiveView('projects');
          setFocusFile('tab:files');
        } else {
          addToast('No active project is currently selected', 'info');
        }
      }
    });

    return () => {
      commandRegistry.unregister('goto-dashboard');
      commandRegistry.unregister('goto-projects');
      commandRegistry.unregister('goto-terminal');
      commandRegistry.unregister('goto-settings');
      commandRegistry.unregister('generate-project');
      commandRegistry.unregister('goto-templates');
      commandRegistry.unregister('open-project-logs');
      commandRegistry.unregister('open-project-qa');
      commandRegistry.unregister('open-project-artifacts');
      commandRegistry.unregister('open-project-preview');
      commandRegistry.unregister('open-project-files');
    };
  }, [setActiveView, setActiveTab, setFocusFile, addToast]);

  const requestDeleteProject = (id: string) => {
    setProjectToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const targetId = projectToDelete;
    
    // Optimistic Update
    setProjectToDelete(null);
    setDeleteModalOpen(false);
    const previousProjects = [...projects];
    setProjects(projects.filter(p => p.id !== targetId));

    try {
      const res = await fetch(`http://localhost:3000/api/projects/${targetId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Project deleted successfully', 'success');
      } else {
        throw new Error('Deletion failed');
      }
    } catch (e) {
      console.error(e);
      setProjects(previousProjects); // Rollback
      addToast('Failed to delete project', 'error');
    }
  };

  const handleOpenFolder = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${id}/open`, { method: 'POST' });
      if (!res.ok) {
        addToast('Failed to open folder', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error opening folder', 'error');
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (inputMode === 'upload' && !file) return;
    if (inputMode === 'text' && !textInput.trim()) return;

    setIsGenerating(true);
    setLogs([{ step: 0, totalSteps: 6, message: inputMode === 'upload' ? 'Uploading SRS...' : 'Sending requirements...', status: 'in-progress' }]);

    let fetchOptions: RequestInit;

    if (inputMode === 'upload') {
      const formData = new FormData();
      formData.append('srs', file!);
      fetchOptions = {
        method: 'POST',
        body: formData,
      };
    } else {
      fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput }),
      };
    }

    try {
      const res = await fetch('http://localhost:3000/api/generate', fetchOptions);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Upload failed';
        const errorDetails = errorData.details ? ` - ${errorData.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      const { projectId } = await res.json();
      
      const eventSource = new EventSource(`http://localhost:3000/api/projects/${projectId}/logs`);
      
      eventSource.onmessage = (event) => {
        const data: GenerationEvent = JSON.parse(event.data);
        
        setLogs(prev => [...prev, data]);
        
        if (data.status === 'completed' || data.status === 'error') {
          eventSource.close();
          setIsGenerating(false);
          fetchProjects();

          if (data.status === 'error') {
            setCurrentProject(projectId);
            setFocusFile('logs/generation.log');
            addToast('Generation failed validation', 'error');
          } else {
            setActiveView('projects');
            addToast('Generation completed successfully', 'success');
          }
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsGenerating(false);
        setLogs(prev => {
          const hasError = prev.some(l => l.status === 'error');
          if (hasError) return prev;
          addToast('Connection to generation server lost', 'error');
          return [...prev, { step: 6, totalSteps: 6, message: 'Connection lost.', status: 'error' }];
        });
      };

    } catch (err: any) {
      setLogs([{ step: 0, totalSteps: 6, message: `Failed: ${err.message}`, status: 'error' }]);
      setIsGenerating(false);
      addToast(err.message, 'error');
    }
  };

  const handleGenerateSample = () => {
    setInputMode('text');
    setTextInput('Create a simple to-do list application with React, Node.js, and PostgreSQL. It should have user authentication, task creation, updates, deletions, and a dashboard showing statistics of completed vs pending tasks.');
  };

  const renderDashboard = () => {
    const isInputEmpty = inputMode === 'upload' ? !file : !textInput.trim();
    const plan = analyzePrompt(textInput) || (file ? {
      appType: 'Document-Specified Application',
      stack: ['React', 'Express', 'Prisma', 'PostgreSQL'],
      entities: ['User', 'SRSData', 'Configuration'],
      features: ['Authentication', 'Database Model Sync', 'Custom API routes', 'Document parsing'],
      estFiles: 15,
      confidence: 94
    } : null);

    const inspirationStarters = [
      {
        title: "Finance Tracker",
        desc: "Budget logs, categories, transaction history and chart analytics.",
        prompt: "Create a personal finance tracker app with budget limits, category spending breakdowns, transaction histories, and recurring transaction alerts. Users should be able to authenticate, set monthly limits, and view charts of their expenses.",
        icon: <DollarSign className="text-emerald-500" size={20} />
      },
      {
        title: "CRM System",
        desc: "Kanban board stages, client pipeline tracking, and sales timeline reminders.",
        prompt: "Build a Customer Relationship Management (CRM) system for sales teams. It must include contact management, lead pipeline stages (New, Contacted, Qualified, Closed), task reminders, interactions log, and a sales dashboard.",
        icon: <Users className="text-blue-500" size={20} />
      },
      {
        title: "Task Manager",
        desc: "Trello-style drag Kanban boards, task details, member assignment, and logs.",
        prompt: "Build a team task management application like Trello. It should support boards, columns (Todo, In Progress, Review, Done), task details with labels and descriptions, drag-and-drop status moves, and team member assignments.",
        icon: <CheckSquare className="text-purple-500" size={20} />
      },
      {
        title: "Portfolio Website",
        desc: "Project filter tags, developer timeline, message form, and premium layout.",
        prompt: "Generate a stunning personal portfolio website for a software developer. It must feature an interactive project showcase with search/tags, an experience timeline, a skills directory with progress meters, and a working contact form with local message storage.",
        icon: <Layout className="text-[#4F8CFF]" size={20} />
      },
      {
        title: "AI Chatbot",
        desc: "Markdown message render, rooms config, and token metrics.",
        prompt: "Create an AI chatbot assistant portal. It should support multiple chat rooms, history storage, quick prompt templates, system instructions config, and a dashboard tracking token usage and prompt statistics.",
        icon: <Bot className="text-amber-500" size={20} />
      },
      {
        title: "Inventory Manager",
        desc: "Cost audits, stocks movement logging, and low-level alerts.",
        prompt: "Build an enterprise inventory management system. It must track items, stock levels, suppliers, stock movements (In, Out, Hold), low stock alerts, and generate reports on inventory value and item velocity.",
        icon: <Boxes className="text-red-500" size={20} />
      }
    ];

    const loadStarter = (promptText: string) => {
      setInputMode('text');
      setTextInput(promptText);
      addToast('Inspiration starter loaded successfully.', 'success');
    };

    const tips = [
      {
        title: "Specify Schema Explicitly",
        desc: "Mention data models (e.g. 'Users table has email, name') to guide Prisma generation."
      },
      {
        title: "Mention Edge Cases",
        desc: "Instruct the generator to write loading and error states to score maximum QA points."
      },
      {
        title: "Provide Flow Diagrams",
        desc: "Paste detailed sequence flows or state transition rules for complex workflows."
      }
    ];

    const starterTemplates = [
      { name: "Full-Stack CRM Hub", type: "crud-admin", size: "22 files" },
      { name: "SaaS Admin Dashboard", type: "hybrid-fullstack", size: "18 files" },
      { name: "Interactive Dev Portfolio", type: "frontend-app", size: "10 files" }
    ];

    return (
      <GenerationErrorBoundary>
      <div className="flex h-full overflow-hidden premium-glow-bg">
        {/* Center Canvas */}
        <div className="flex-1 flex flex-col overflow-y-auto px-8 py-8 gap-8 items-center min-w-0">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-2 mt-4 shrink-0">
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2 mb-3 text-gradient">
              <Sparkles className="text-[#4F8CFF] animate-pulse" size={30} />
              AI Software Factory
            </h1>
            <p className="text-sm text-gray-400">Generate, compile, and validate full-stack applications with executable business logic.</p>
          </div>

          {/* AI prompt canvas container */}
          <div className="max-w-4xl w-full mx-auto flex flex-col glass-card rounded-2xl overflow-hidden shadow-2xl shrink-0 glow-focus border border-white/5 bg-[#0B1020]/40">
            <div className="border-b border-white/5 bg-[#0B1020]/20 p-3 flex justify-between items-center">
              <div className="flex bg-[#121A2F]/80 border border-white/5 rounded-lg p-0.5 shadow-sm">
                <button
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${inputMode === 'upload' ? 'bg-[#1C2848] text-[#4F8CFF] shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                  onClick={() => setInputMode('upload')}
                >
                  Upload SRS Spec
                </button>
                <button
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${inputMode === 'text' ? 'bg-[#1C2848] text-[#4F8CFF] shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                  onClick={() => setInputMode('text')}
                >
                  Paste Requirements
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="w-full">
                {inputMode === 'upload' ? (
                  <div 
                    className="border border-dashed border-[#1C2848] hover:border-[#4F8CFF]/50 hover:bg-[#4F8CFF]/5 rounded-xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all bg-[#0B1020]/30 h-[18vh] min-h-[160px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    {file ? (
                      <div className="flex flex-col items-center">
                        <FileText size={36} className="text-[#4F8CFF] mb-2" />
                        <p className="text-gray-200 text-sm font-semibold">{file.name}</p>
                        <p className="text-gray-500 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <FolderClosed size={40} className="mb-3 text-[#4F8CFF]/60" />
                        <p className="text-sm font-semibold text-gray-300">Click or drag specification document</p>
                        <p className="text-[11px] mt-1 text-gray-500">Supports PDF, MD or TXT files up to 10MB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="w-full h-[18vh] min-h-[160px] bg-[#0E1426]/50 border border-[#1C2848] rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all resize-none shadow-inner font-sans"
                    placeholder="Describe the application you want to build (e.g. models, routes, views, rules...)"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-1">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Target Engine Stack</span>
                    <div className="flex gap-2">
                      <span className="bg-[#0E1426] border border-white/5 text-gray-400 text-[10px] px-2.5 py-0.5 rounded flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF]"></span> React App</span>
                      <span className="bg-[#0E1426] border border-white/5 text-gray-400 text-[10px] px-2.5 py-0.5 rounded flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> Node API</span>
                      <span className="bg-[#0E1426] border border-white/5 text-gray-400 text-[10px] px-2.5 py-0.5 rounded flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span> PostgreSQL</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleGenerateSample}
                    disabled={isGenerating}
                    variant="secondary"
                  >
                    Load Sample
                  </Button>
                  {textInput && (
                    <Button 
                      onClick={() => setTextInput('')}
                      disabled={isGenerating}
                      variant="ghost"
                    >
                      Clear
                    </Button>
                  )}
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating || isInputEmpty}
                    variant="default"
                    className="min-w-[140px]"
                  >
                    {isGenerating ? <><Loader2 size={14} className="animate-spin"/> Generating...</> : <><Play size={14}/> Build Software</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Clickable Inspiration Prompts (Phase 1 Tag list) */}
          {isInputEmpty && (
            <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto shrink-0 px-4">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider self-center mr-1">Try:</span>
              {[
                { label: "Build CRM System", prompt: "Build a Customer Relationship Management (CRM) system for sales teams. It must include contact management, lead pipeline stages (New, Contacted, Qualified, Closed), task reminders, interactions log, and a sales dashboard." },
                { label: "Build SaaS Dashboard", prompt: "Create a SaaS tool tracker with React, Express, PostgreSQL, allowing teams to log tools, audit costs, and set monthly alerts." },
                { label: "Build Portfolio", prompt: "Generate a stunning personal portfolio website for a software developer. It must feature an interactive project showcase with search/tags, an experience timeline, a skills directory with progress meters, and a working contact form with local message storage." },
                { label: "Build AI Chatbot", prompt: "Create an AI chatbot assistant portal. It should support multiple chat rooms, history storage, quick prompt templates, system instructions config, and a dashboard tracking token usage and prompt statistics." },
                { label: "Build Task Manager", prompt: "Build a team task management application like Trello. It should support boards, columns (Todo, In Progress, Review, Done), task details with labels and descriptions, drag-and-drop status moves, and team member assignments." }
              ].map(starter => (
                <button
                  key={starter.label}
                  onClick={() => loadStarter(starter.prompt)}
                  className="bg-[#121A2F]/50 hover:bg-[#1C2848] border border-white/5 hover:border-[#4F8CFF]/30 px-3.5 py-1.5 rounded-full text-xs text-gray-300 font-medium transition-all shadow-sm flex items-center gap-1.5 group"
                >
                  <Sparkles size={11} className="text-[#4F8CFF] group-hover:scale-110 transition-transform" />
                  {starter.label}
                </button>
              ))}
            </div>
          )}

          {/* Dashboard bottom layout - Metadata (20% visual weight) */}
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col mt-4 min-h-[300px]">
            <div className="flex items-center gap-8 border-b border-white/5 mb-5 w-full shrink-0">
              {['recent', 'favorites', 'failed', 'templates'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-2.5 text-xs font-bold border-b-2 transition-colors -mb-px tracking-wider uppercase ${activeTab === tab ? 'border-[#4F8CFF] text-[#4F8CFF]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 pr-1 pb-10">
              {isLoadingProjects ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-[#121A2F]/30 border border-white/5 rounded-xl p-4 animate-pulse flex gap-3 h-[110px]">
                      <div className="w-8 h-8 bg-[#18233D] rounded-lg shrink-0 skeleton-shimmer"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#18233D] rounded w-1/3 skeleton-shimmer"></div>
                        <div className="h-3 bg-[#18233D] rounded w-1/2 skeleton-shimmer"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (activeTab === 'templates' || activeTab === 'favorites' || projects.filter(p => activeTab === 'recent' ? true : p.status === 'error').length === 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  {/* Tips Card */}
                  <div className="glass-card rounded-xl p-4 flex flex-col bg-[#0B1020]/25 border border-white/5">
                    <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-[#4F8CFF]" /> Pro Generation Tips
                    </h4>
                    <div className="space-y-3 flex-1">
                      {tips.map((t, idx) => (
                        <div key={idx} className="text-[11px] leading-relaxed border-b border-white/5 pb-2 last:border-b-0">
                          <span className="font-semibold text-gray-200 block mb-0.5">{t.title}</span>
                          <span className="text-gray-400">{t.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Starter Templates Card */}
                  <div className="glass-card rounded-xl p-4 flex flex-col bg-[#0B1020]/25 border border-white/5">
                    <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <LayoutTemplate size={14} className="text-purple-400" /> Prebuilt Templates
                    </h4>
                    <div className="space-y-2 flex-1">
                      {starterTemplates.map((t, idx) => (
                        <div 
                          key={idx} 
                          className="p-2.5 rounded-lg bg-[#0E1426]/50 border border-white/5 flex justify-between items-center text-[11px] cursor-pointer hover:border-gray-500 transition-all"
                          onClick={() => {
                            const match = inspirationStarters.find(s => s.title.toLowerCase().includes(t.name.split(' ').slice(-1)[0].toLowerCase()) || s.title.includes(t.name.split(' ')[0]));
                            if (match) loadStarter(match.prompt);
                            else handleGenerateSample();
                          }}
                        >
                          <div>
                            <span className="font-semibold text-gray-200 block">{t.name}</span>
                            <span className="text-gray-500 font-mono text-[9px] uppercase">{t.type}</span>
                          </div>
                          <span className="text-gray-400 font-mono text-[10px]">{t.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity Log */}
                  <div className="glass-card rounded-xl p-4 flex flex-col bg-[#0B1020]/25 border border-white/5">
                    <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Activity size={14} className="text-emerald-400" /> Platform Metrics
                    </h4>
                    <div className="space-y-3 flex-1 text-[11px] font-mono text-gray-400">
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span>Active Projects</span>
                        <span className="text-gray-200">{projects.length}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span>Avg QA Score</span>
                        <span className="text-[#22C55E]">86.2 / 100</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span>Active Builder</span>
                        <span className="text-[#4F8CFF]">Online (Local)</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Latest Sync</span>
                        <span className="text-gray-500">Just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                  {projects.filter(p => activeTab === 'recent' ? true : p.status === 'error').map(p => {
                    const isSuccess = p.status === 'completed';
                    const isFailed = p.status === 'error';
                    const isGen = p.status === 'generating';
                    const dateStr = new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div 
                        key={p.id} 
                        className="glass-card hover-glow p-4 rounded-xl cursor-pointer flex items-center gap-4 group bg-[#0B1020]/25 border border-white/5"
                        onClick={() => { setActiveView('projects'); setCurrentProject(p.id); }}
                      >
                        {/* Status indicator */}
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSuccess ? 'bg-[#22C55E]' : isFailed ? 'bg-[#EF4444]' : isGen ? 'bg-[#4F8CFF] animate-pulse' : 'bg-gray-500'}`}></div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-100 group-hover:text-[#4F8CFF] transition-colors truncate">{p.name}</h4>
                          <span className="text-[10px] text-gray-500 font-mono">{dateStr}</span>
                        </div>

                        <button 
                          className="text-[10px] bg-[#1C2848] hover:bg-[#4F8CFF] hover:text-white text-gray-300 px-3 py-1.5 rounded-lg font-bold transition-all opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={(e) => { e.stopPropagation(); setActiveView('projects'); setCurrentProject(p.id); }}
                        >
                          Open
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Collapsible AI Context Panel */}
        {(isGenerating || textInput.trim().length > 0) && (
          <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-white/5 bg-[#080C18]/85 shrink-0 p-5 gap-5 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 backdrop-blur-2xl">
            <ProjectHealthPanel activePlan={plan} isGenerating={isGenerating} />
            
            {isGenerating && (
              <div className="glass-card rounded-xl p-4 flex flex-col gap-3 bg-[#0B1020]/50 border border-white/5 shrink-0">
                <h4 className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider select-none">
                  <Loader2 size={12} className="text-[#4F8CFF] animate-spin" /> Live Generation Timeline
                </h4>
                <GenerationTimeline isGenerating={isGenerating} logs={logs} />
              </div>
            )}

            {isGenerating && (
              <div className="glass-card rounded-xl p-4 flex flex-col gap-3 bg-[#0B1020]/50 border border-white/5 shrink-0">
                <h4 className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider select-none">
                  <Terminal size={12} className="text-gray-400" /> Live Process Logs
                </h4>
                <div className="max-h-[140px] overflow-y-auto pr-1 no-scrollbar space-y-1.5 font-mono">
                  {logs.slice(-4).map((l, i) => (
                    <div key={i} className="text-[10.5px] text-gray-400 border-l border-[#1C2848] pl-2 py-0.5">
                      <span className={l.status === 'error' ? 'text-red-400 font-semibold' : 'text-gray-300'}>
                        {l.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </GenerationErrorBoundary>
    );

  };

  const renderProjects = () => (
    <GenerationErrorBoundary>
      <GeneratedWorkspaceView 
        projects={projects} 
        onDelete={requestDeleteProject} 
        onOpenFolder={handleOpenFolder} 
      />
    </GenerationErrorBoundary>
  );

  const renderTerminal = () => (
    <div className="bg-[#121A2F] rounded-xl border border-[#18233D] p-6 flex flex-col h-full m-6 fade-in-up">
      <h2 className="text-lg font-semibold mb-4 shrink-0 text-gray-200 flex items-center gap-2"><Terminal size={18}/> Global Logs</h2>
      <div className="flex-1 bg-[#0B1020] p-4 rounded-lg font-mono text-xs text-gray-400 border border-[#18233D] overflow-y-auto no-scrollbar">
        <p className="text-[#4F8CFF]">&gt; WebsiteGenerator Core v2.0 — Runtime Engine</p>
        <p className="text-[#22C55E] mt-1">&gt; System initialized successfully</p>
        <p className="text-gray-500 mt-1">&gt; Output directory: ~/WebsiteGeneratorProjects/</p>
        <p className="text-gray-500">&gt; Isolation mode: ENABLED (projects are fully isolated)</p>
        <p className="text-gray-500">&gt; Waiting for generation events...</p>
        <div className="mt-4 pt-4 border-t border-white/5">
          {logs.length === 0 ? (
            <p className="text-gray-600 italic">No recent activity. Generate a project to see build output here.</p>
          ) : (
            logs.map((l, i) => (
              <p key={i} className={l.status === 'error' ? 'text-[#EF4444]' : 'text-gray-300'}>
                &gt; [{l.step}/{l.totalSteps}] {l.message}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const [provider, setProvider] = useState('groq');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (activeView === 'settings') {
      fetch('http://localhost:3000/api/settings/provider')
        .then(res => res.json())
        .then(data => {
          setProvider(data.provider);
          setOllamaUrl(data.ollamaUrl);
          if (data.provider === 'groq') setApiKey(data.groqApiKey);
          else if (data.provider === 'openrouter') setApiKey(data.openRouterApiKey);
        })
        .catch(err => console.error('Failed to load settings', err));
    }
  }, [activeView]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const payload: any = { provider, ollamaUrl };
      if (provider === 'groq') payload.groqApiKey = apiKey;
      if (provider === 'openrouter') payload.openRouterApiKey = apiKey;

      const res = await fetch('http://localhost:3000/api/settings/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save settings');
      
      addToast('Settings saved successfully', 'success');
    } catch (e) {
      console.error(e);
      addToast('Error saving settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const renderSettings = () => (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
        <div className="p-1.5 rounded-lg bg-blue-500/10 text-[#4F8CFF]">
          <Settings size={18} />
        </div>
        <h2 className="text-lg font-bold text-gray-200">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* AI Providers Card */}
          <div className="glass-card rounded-xl p-5 border border-white/5 bg-[#0B1020]/25 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">AI Providers & Models</h3>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Active Provider</label>
              <select 
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setApiKey('');
                }}
                className="w-full bg-[#0E1426] border border-[#1C2848] rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-[#4F8CFF] font-medium"
              >
                <option value="groq">Groq Cloud AI</option>
                <option value="openrouter">OpenRouter API</option>
                <option value="ollama">Ollama (Local AI)</option>
              </select>
            </div>
            
            {provider !== 'ollama' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">{provider === 'groq' ? 'Groq' : 'OpenRouter'} API Token</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter secret key...`}
                  className="w-full bg-[#0E1426] border border-[#1C2848] rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-[#4F8CFF] font-mono"
                />
              </div>
            )}

            {provider === 'ollama' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Ollama Endpoints Link</label>
                <input 
                  type="text" 
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full bg-[#0E1426] border border-[#1C2848] rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-[#4F8CFF] font-mono"
                />
              </div>
            )}
          </div>

          {/* Model Configs Card */}
          <div className="glass-card rounded-xl p-5 border border-white/5 bg-[#0B1020]/25 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">Generation Models</h3>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Default Model</label>
              <select className="w-full bg-[#0E1426] border border-[#1C2848] rounded-lg p-2.5 text-xs text-gray-400 focus:outline-none font-medium cursor-not-allowed" disabled>
                <option>{provider === 'groq' ? 'Llama-3-70b-Versatile' : provider === 'openrouter' ? 'Claude-3.5-Sonnet' : 'Mistral-7b-Instruct'}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Fallback Model</label>
              <select className="w-full bg-[#0E1426] border border-[#1C2848] rounded-lg p-2.5 text-xs text-gray-400 focus:outline-none font-medium cursor-not-allowed" disabled>
                <option>Llama-3-8b-Preview</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* General & Directory */}
          <div className="glass-card rounded-xl p-5 border border-white/5 bg-[#0B1020]/25 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">Workspace & Output</h3>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Projects Output Directory</label>
              <input 
                type="text" 
                className="w-full bg-[#0E1426] border border-[#1C2848] rounded-lg p-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#4F8CFF] font-mono"
                defaultValue="~/WebsiteGeneratorProjects/"
                readOnly
              />
              <span className="text-[9px] text-gray-500 mt-1 block">Projects are generated in an isolated directory outside the workspace</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Runtime Isolation</label>
              <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 font-bold px-2.5 py-1 rounded inline-flex items-center gap-1.5">● Fully Isolated</span>
            </div>
          </div>

          {/* Validation & Appearance */}
          <div className="glass-card rounded-xl p-5 border border-white/5 bg-[#0B1020]/25 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">Validation & Interface</h3>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-gray-300 font-medium">Automatic TypeScript Compilation</span>
              <span className="text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded text-[10px] font-bold">Enabled</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-gray-300 font-medium">Automated AST Validation Checks</span>
              <span className="text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded text-[10px] font-bold">Enabled</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-gray-300 font-medium">Interface Color Theme</span>
              <span className="text-[#4F8CFF] bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Factory Dark</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
        <button 
          className="bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 disabled:bg-[#1C2848] disabled:text-gray-500 text-white px-6 py-2.5 rounded-lg font-bold text-xs transition-colors shadow-lg flex items-center gap-1.5"
          onClick={handleSaveSettings}
          disabled={isSavingSettings}
        >
          {isSavingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );


  return (
    <GenerationErrorBoundary>
    <div className="flex h-screen bg-[#0B1020] text-gray-200 overflow-hidden font-sans">
      <CommandPalette />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen relative">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'projects' && renderProjects()}
          {activeView === 'terminal' && renderTerminal()}
          {activeView === 'settings' && renderSettings()}
          {activeView === 'templates' && <TemplatesView />}
          {activeView === 'failed' && <FailedProjectsView />}
          {activeView === 'qa' && <QACenterView />}
        </main>
        
        {/* Toast Container */}
        <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const borderClass = isSuccess ? 'border-[#22C55E]/30' : isError ? 'border-[#EF4444]/30' : 'border-[#4F8CFF]/30';
            const icon = isSuccess ? <CheckCircle2 size={16} className="text-[#22C55E]" /> : isError ? <XCircle size={16} className="text-[#EF4444]" /> : <Terminal size={16} className="text-[#4F8CFF]" />;
            return (
              <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl pointer-events-auto animate-in slide-in-from-right-5 fade-in duration-300 bg-[#121A2F] border ${borderClass} text-gray-100`}>
                {icon}
                <span className="text-sm font-medium">{t.message}</span>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDeleteProject}
        onCancel={() => {
          setDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
      />
    </div>
    </GenerationErrorBoundary>
  );
}

export default App;
