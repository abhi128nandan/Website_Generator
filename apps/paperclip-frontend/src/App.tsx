import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { GeneratedProject, GenerationEvent } from '@paperclip/shared';
import { useAppStore } from './store';
import { GeneratedWorkspaceView } from './components/GeneratedWorkspaceView';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [textInput, setTextInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<GenerationEvent[]>([]);
  const [projects, setProjects] = useState<GeneratedProject[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { activeView, setActiveView, setCurrentProject, setFocusFile } = useAppStore();

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeView]);

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProjects();
      } else {
        alert('Failed to delete project');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting project');
    }
  };

  const handleOpenFolder = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${id}/open`, { method: 'POST' });
      if (!res.ok) {
        alert('Failed to open folder');
      }
    } catch (e) {
      console.error(e);
      alert('Error opening folder');
    }
  };

  const handleGenerate = async () => {
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
            setActiveView('projects');
          }
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsGenerating(false);
      };

    } catch (err: any) {
      setLogs([{ step: 6, totalSteps: 6, message: `Failed: ${err.message}`, status: 'error' }]);
      setIsGenerating(false);
    }
  };

  const renderDashboard = () => {
    const currentStep = logs.length > 0 ? logs[logs.length - 1].step : 0;
    const isError = logs.some(l => l.status === 'error');

    return (
    <div className="grid grid-cols-3 gap-6 flex-1 h-full">
      <div className="col-span-1 bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-4">New Project</h2>
        <div className="flex bg-gray-900 rounded-lg p-1 mb-4 shrink-0">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${inputMode === 'upload' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setInputMode('upload')}
          >
            Upload File
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${inputMode === 'text' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setInputMode('text')}
          >
            Paste Requirements
          </button>
        </div>

        {inputMode === 'upload' ? (
          <>
            <p className="text-sm text-gray-400 mb-6 shrink-0">
              Upload your Software Requirement Specification (SRS) in PDF, TXT, or Markdown format to generate a full-stack application.
            </p>
            
            <div 
              className="flex-1 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-blue-500 transition-colors mb-6 min-h-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.txt,.md"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <p className="text-blue-400 font-medium truncate w-full px-4">{file.name}</p>
              ) : (
                <>
                  <p className="text-gray-300 font-medium mb-1">Click to select file</p>
                  <p className="text-xs text-gray-500">PDF, TXT, or Markdown</p>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col mb-6 min-h-0">
            <textarea
              className="flex-1 w-full h-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none overflow-y-auto"
              placeholder={`Build a Todo App with:\n\n* login\n* task CRUD\n* due dates\n* priorities\n* PostgreSQL\n* React frontend\n* Express backend`}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <div className="text-right text-xs text-gray-500 mt-2 shrink-0">
              {textInput.length} characters
            </div>
          </div>
        )}

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || (inputMode === 'upload' ? !file : !textInput.trim())}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-medium transition-colors mt-auto shrink-0"
        >
          {isGenerating ? 'Generating...' : 'Generate Project'}
        </button>
      </div>

      <div className="col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-4 shrink-0">Generation Progress</h2>
        
        {logs.length > 0 && (
          <div className="flex items-center justify-between mb-6 shrink-0 relative px-2">
            <div className="absolute left-4 right-4 top-[8px] h-0.5 bg-gray-700 -z-0"></div>
            {['Init', 'Extract', 'Analyze', 'Architect', 'Generate', 'Validate', 'Done'].map((label, idx) => {
              const isPast = currentStep > idx;
              const isCurrent = currentStep === idx;
              const isFailed = isCurrent && isError;
              
              let bgColor = 'bg-gray-700';
              let ringColor = 'ring-gray-800';
              if (isPast) bgColor = 'bg-blue-500';
              if (isCurrent) bgColor = isFailed ? 'bg-red-500' : 'bg-blue-400';
              if (isCurrent && !isFailed) ringColor = 'ring-blue-500/30';
              if (isFailed) ringColor = 'ring-red-500/30';

              return (
                <div key={idx} className="flex flex-col items-center gap-2 relative z-10 w-12">
                  <div className={`w-4 h-4 rounded-full ${bgColor} ring-4 ${ringColor} ${isCurrent && !isFailed ? 'animate-pulse' : ''}`}></div>
                  <span className={`text-[9px] uppercase font-bold tracking-wider text-center ${isCurrent ? (isFailed ? 'text-red-400' : 'text-blue-400') : (isPast ? 'text-gray-300' : 'text-gray-600')}`}>{label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1 bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-y-auto border border-gray-700 min-h-0">
          {logs.length === 0 ? (
            <p className="text-gray-500">Waiting for generation to start...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`mb-2 break-words whitespace-pre-wrap ${log.status === 'error' ? 'text-red-400' : log.status === 'completed' ? 'text-green-400' : 'text-blue-300'}`}>
                <span className="text-gray-500 mr-2">[{log.step}/{log.totalSteps}]</span>
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    );
  };

  const renderProjects = () => (
    <GeneratedWorkspaceView 
      projects={projects} 
      onDelete={handleDeleteProject} 
      onOpenFolder={handleOpenFolder} 
    />
  );

  const renderTerminal = () => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4 shrink-0">Global Logs</h2>
      <div className="flex-1 bg-gray-950 p-4 rounded-lg font-mono text-sm text-gray-400 border border-gray-700 overflow-y-auto">
        <p>Terminal logs output will appear here...</p>
        <p className="text-blue-400 mt-2">&gt; System initialized</p>
        <p className="text-blue-400">&gt; Waiting for generation events</p>
        {logs.map((l, i) => (
          <p key={i} className={l.status === 'error' ? 'text-red-400' : 'text-gray-300'}>
            &gt; [{l.step}/{l.totalSteps}] {l.message}
          </p>
        ))}
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
      
      alert('Settings saved to local environment.');
    } catch (e) {
      console.error(e);
      alert('Error saving settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const renderSettings = () => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col h-full max-w-2xl mx-auto w-full">
      <h2 className="text-xl font-semibold mb-6 shrink-0">Settings</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">AI Provider</label>
          <select 
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setApiKey(''); // clear api key input on switch so they don't leak it accidentally
            }}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
          >
            <option value="groq">Groq</option>
            <option value="openrouter">OpenRouter</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>
        
        {provider !== 'ollama' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{provider === 'groq' ? 'Groq' : 'OpenRouter'} API Key</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${provider === 'groq' ? 'Groq' : 'OpenRouter'} API Key...`}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">API keys are stored securely in your local environment.</p>
          </div>
        )}

        {provider === 'ollama' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ollama API URL</label>
            <input 
              type="text" 
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Output Directory</label>
          <input 
            type="text" 
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-500 focus:outline-none cursor-not-allowed"
            defaultValue="~/PaperclipProjects/"
            readOnly
          />
        </div>
        <div className="pt-4 border-t border-gray-700">
          <button 
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
          >
            {isSavingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <Navbar />
        <main className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'projects' && renderProjects()}
          {activeView === 'terminal' && renderTerminal()}
          {activeView === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
}

export default App;
