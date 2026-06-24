import { CheckCircle2, XCircle, Clock, FileCode2, Database, Compass, Cpu } from 'lucide-react';
import { GeneratedProject } from '@website-generator/shared';

interface Props {
  project?: GeneratedProject | null;
  activePlan?: {
    appType: string;
    stack: string[];
    entities: string[];
    features: string[];
    estFiles: number;
    confidence: number;
  } | null;
  isGenerating?: boolean;
}

export function ProjectHealthPanel({ project, activePlan, isGenerating }: Props) {
  const isDashboardView = !!activePlan || isGenerating;
  
  // Resolve parameters from active plan or project metadata
  let title = "AI Factory Context";
  let appType = "Web Application";
  let confidence = 95;
  let fileCount = 0;
  let stack: string[] = ['React', 'Express', 'Prisma', 'PostgreSQL'];
  let entities: string[] = [];
  let buildStatus: 'idle' | 'generating' | 'completed' | 'error' = 'idle';
  let genDuration = '';

  if (isDashboardView && activePlan) {
    title = "Detected Blueprint";
    appType = activePlan.appType;
    confidence = activePlan.confidence;
    fileCount = activePlan.estFiles;
    stack = activePlan.stack;
    entities = activePlan.entities;
    buildStatus = isGenerating ? 'generating' : 'idle';
  } else if (project) {
    const meta = project.metadata as any;
    title = project.name;
    appType = meta?.classifiedMode || (project.metadata?.backend?.length ? 'Fullstack CRUD Portal' : 'Frontend Only App');
    confidence = meta?.reliability?.score ?? 85;
    fileCount = project.generatedFiles?.length || 0;
    stack = meta?.database?.length ? ['React', 'Express', 'Prisma', 'PostgreSQL'] : ['React', 'Vite', 'TailwindCSS'];
    
    // Extract entities
    if (meta?.entities && Array.isArray(meta.entities)) {
      entities = meta.entities.map((e: any) => typeof e === 'string' ? e : e?.name || e?.entity);
    }
    
    buildStatus = project.status as any;
    genDuration = meta?.generationDurationMs ? `${(meta.generationDurationMs / 1000).toFixed(1)}s` : '';
  } else {
    return null;
  }

  return (
    <div className="glass-card rounded-xl border border-white/5 bg-[#0B1020]/75 p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Visual background gradient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/10 text-[#4F8CFF]">
            <Compass size={16} />
          </div>
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">{title}</span>
        </div>
        
        {buildStatus === 'generating' && (
          <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-[#4F8CFF] px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF]"></span> Building
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* Main Header details */}
        <div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Target Application</span>
          <span className="text-sm font-bold text-gray-200">{appType}</span>
        </div>

        {/* Confidence Circle/Rating */}
        <div>
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
            <span>Orchestrator Confidence</span>
            <span className="text-gray-300 font-mono">{confidence}%</span>
          </div>
          <div className="w-full bg-[#121A2F] rounded-full h-1.5 overflow-hidden border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${confidence >= 90 ? 'bg-gradient-to-r from-blue-500 to-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-yellow-500'}`}
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>

        {/* Stack list */}
        <div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">Detected Tech Stack</span>
          <div className="flex flex-wrap gap-1.5">
            {stack.map((item, idx) => (
              <span key={idx} className="bg-[#121A2F] border border-white/5 text-gray-300 text-[10px] px-2 py-1 rounded font-mono font-medium flex items-center gap-1">
                <Cpu size={10} className="text-[#4F8CFF]" /> {item}
              </span>
            ))}
          </div>
        </div>

        {/* Entities and files */}
        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div className="bg-[#0E1426]/60 border border-white/5 rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Database size={10} className="text-[#4F8CFF]" /> Entities
            </span>
            <span className="text-lg font-bold text-gray-200 font-mono">
              {entities.length > 0 ? entities.length : '—'}
            </span>
          </div>
          <div className="bg-[#0E1426]/60 border border-white/5 rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileCode2 size={10} className="text-purple-400" /> Files
            </span>
            <span className="text-lg font-bold text-gray-200 font-mono">
              {fileCount > 0 ? fileCount : '—'}
            </span>
          </div>
        </div>

        {/* Entities Tag Cloud (if available) */}
        {entities.length > 0 && (
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">Schema Models</span>
            <div className="flex flex-wrap gap-1">
              {entities.slice(0, 8).map((entity, idx) => (
                <span key={idx} className="bg-blue-500/5 border border-blue-500/10 text-gray-400 text-[10px] px-2 py-0.5 rounded font-medium">
                  {entity}
                </span>
              ))}
              {entities.length > 8 && (
                <span className="text-gray-500 text-[9px] font-bold px-1.5 py-0.5 select-none font-mono">+{entities.length - 8} more</span>
              )}
            </div>
          </div>
        )}

        {/* Details for project page context */}
        {!isDashboardView && project && (
          <div className="border-t border-white/5 pt-4 space-y-2.5 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Workspace Status</span>
              {buildStatus === 'completed' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Passed</span>
              ) : buildStatus === 'error' ? (
                <span className="text-red-400 font-semibold flex items-center gap-1"><XCircle size={12} /> Failed</span>
              ) : (
                <span className="text-blue-400 font-semibold flex items-center gap-1 animate-pulse"><Clock size={12} /> Building</span>
              )}
            </div>
            {genDuration && (
              <div className="flex justify-between">
                <span>Compilation Time</span>
                <span className="text-gray-200 font-mono">{genDuration}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Timestamp</span>
              <span className="text-gray-300 font-mono">{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
