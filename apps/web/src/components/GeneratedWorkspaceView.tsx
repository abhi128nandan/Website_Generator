import { useState, useEffect } from 'react';
import { FolderOpen, Trash2, Code2, Database, LayoutTemplate, File, ChevronRight, ChevronDown, Folder, Download, Play, Square, ExternalLink, Terminal } from 'lucide-react';
import { GeneratedProject } from '@paperclip/shared';

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

export function GeneratedWorkspaceView({ projects, onDelete, onOpenFolder }: Props) {
  const [selectedProject, setSelectedProject] = useState<GeneratedProject | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[] | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<{ path: string, content: string } | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  const [runStatus, setRunStatus] = useState<string>('stopped');
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [activePorts, setActivePorts] = useState<{ frontend?: number, backend?: number } | null>(null);

  useEffect(() => {
    setSelectedFile(null);
    setShowLogs(false);
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

  const fetchStatus = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${id}/status`);
      if (res.ok) {
        const data = await res.json();
        // Only update if project is still selected
        setRunStatus(data.status);
        setRunLogs(data.logs || []);
        setActivePorts(data.ports || null);
      }
    } catch (e) {}
  };

  const handleRun = async (id: string) => {
    const p = projects.find(proj => proj.id === id);
    if (p) setSelectedProject(p);
    setShowLogs(true);
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
      console.error('Failed to fetch file tree:', e);
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
      console.error(e);
      setSelectedFile({ path, content: 'Error loading file content.' });
    } finally {
      setIsLoadingFile(false);
    }
  };

  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpandedFolders(next);
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => {
      const isDir = node.type === 'directory';
      const isExpanded = expandedFolders.has(node.path);
      
      return (
        <div key={node.path}>
          <div 
            className={`flex items-center gap-1.5 py-1 px-2 hover:bg-gray-800 rounded cursor-pointer text-sm ${isDir ? 'text-gray-300' : (selectedFile?.path === node.path ? 'bg-gray-700 text-blue-400' : 'text-gray-400')}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => isDir ? toggleFolder(node.path) : handleFileClick(node.path)}
          >
            {isDir ? (
              <>
                {isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                <Folder size={14} className="text-blue-400" />
              </>
            ) : (
              <>
                <div className="w-3.5"></div>
                <File size={14} className="text-gray-500" />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </div>
          {isDir && isExpanded && node.children && (
            <div>
              {renderTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar: Projects List */}
      <div className="w-1/3 bg-gray-800 border border-gray-700 rounded-lg flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-gray-900 shrink-0">
          <h2 className="font-semibold text-lg">Generated Workspace</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {projects.length === 0 ? (
            <p className="text-gray-500 text-sm p-2 text-center mt-4">No projects generated yet.</p>
          ) : (
            projects.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedProject(p)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedProject?.id === p.id ? 'bg-gray-700 border-blue-500' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-blue-400 truncate pr-2">{p.name}</h3>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase ${p.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : p.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                    {p.status}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString()}
                </div>
                
                <div className="flex gap-2 mb-2">
                  {p.id === selectedProject?.id && runStatus !== 'stopped' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStop(p.id); }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-1.5 rounded text-xs font-medium transition-colors"
                    >
                      <Square size={14} /> Stop
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRun(p.id); }}
                      disabled={!p.rootPath && !p.path}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-1.5 rounded text-xs font-medium transition-colors"
                    >
                      <Play size={14} /> Run in Browser
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onOpenFolder(p.id); }}
                    disabled={!p.rootPath && !p.path}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-gray-300 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    <FolderOpen size={14} /> Open
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:3000/api/projects/${p.id}/download`); }}
                    disabled={!p.rootPath && !p.path}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-gray-300 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    <Download size={14} /> Download
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(p.id); if (selectedProject?.id === p.id) setSelectedProject(null); }}
                    className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content: IDE Explorer */}
      <div className="w-2/3 bg-gray-800 border border-gray-700 rounded-lg flex flex-col h-full overflow-hidden">
        {selectedProject ? (
          <>
            <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center shrink-0">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <LayoutTemplate size={20} className="text-gray-400" />
                {selectedProject.name}
              </h2>
              {selectedProject.metadata && (
                <div className="flex gap-4 text-sm text-gray-400">
                  <button 
                    onClick={() => { setShowLogs(!showLogs); setSelectedFile(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${showLogs ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <Terminal size={14} /> Logs {runStatus !== 'stopped' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1"></span>}
                  </button>
                  <div className="flex items-center gap-1 border-l border-gray-700 pl-4" title="App Type"><LayoutTemplate size={14} /> <span>{selectedProject.metadata.appType}</span></div>
                  <div className="flex items-center gap-1" title="Frontend"><Code2 size={14} /> <span>{selectedProject.metadata.frontend.length}</span></div>
                  <div className="flex items-center gap-1" title="Database"><Database size={14} /> <span>{selectedProject.metadata.database.length}</span></div>
                </div>
              )}
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="w-1/2 border-r border-gray-700 p-2 overflow-y-auto bg-gray-900/50">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Explorer</h3>
                {fileTree === null ? (
                  <p className="text-gray-500 text-sm px-2">Loading file tree...</p>
                ) : fileTree.length === 0 ? (
                  <p className="text-gray-500 text-sm px-2">No files found.</p>
                ) : (
                  <div className="font-mono">
                    {renderTree(fileTree)}
                  </div>
                )}
              </div>
              <div className="w-1/2 flex flex-col bg-gray-900 border-l border-gray-700">
                {selectedFile ? (
                  <>
                    <div className="p-2 border-b border-gray-700 bg-gray-900 flex justify-between items-center shrink-0">
                      <span className="text-xs font-mono text-gray-400 truncate pr-4">{selectedFile.path}</span>
                      <button onClick={() => setSelectedFile(null)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded bg-gray-800 border border-gray-700">Close</button>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      {isLoadingFile ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                      ) : (
                        <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">{selectedFile.content}</pre>
                      )}
                    </div>
                  </>
                ) : showLogs ? (
                  <div className="flex-1 flex flex-col h-full bg-black">
                    <div className="p-2 border-b border-gray-800 bg-gray-900 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-gray-400" />
                        <span className="text-xs font-mono text-gray-400">Terminal ({runStatus})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {runStatus === 'running' && (
                           <a 
                             href={`http://localhost:${activePorts?.frontend || 5175}`} 
                             target="_blank" 
                             rel="noreferrer"
                             className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                           >
                             <ExternalLink size={12} /> Open App {activePorts?.frontend ? `(:${activePorts.frontend})` : ''}
                           </a>
                        )}
                        <button onClick={() => setShowLogs(false)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded bg-gray-800 border border-gray-700">Close</button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 flex flex-col-reverse">
                      <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">{runLogs.join('\n')}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 overflow-y-auto">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Project Details</h3>
                    <div className="space-y-4 text-sm text-gray-300">
                      <div>
                        <span className="font-medium text-gray-400">Root Path:</span>
                        <p className="font-mono text-xs mt-1 text-gray-500 break-all">{selectedProject.rootPath || selectedProject.path || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-400">Input Mode:</span>
                        <p className="mt-1">{selectedProject.inputType || 'upload'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-400">Features:</span>
                        <ul className="list-disc pl-5 mt-1 text-gray-400">
                          {selectedProject.metadata?.features.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-gray-400">Entities:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedProject.metadata?.entities.map((e, i) => (
                            <span key={i} className="bg-gray-800 px-2 py-1 rounded-md text-xs border border-gray-700">{e}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a project to view its workspace</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
