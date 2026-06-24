import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';
import { GenerationEvent } from '@website-generator/shared';

interface Props {
  isGenerating: boolean;
  logs: GenerationEvent[];
  recentProject?: {
    createdAt: string;
    status: 'generating' | 'completed' | 'error';
  };
}

export function GenerationTimeline({ isGenerating, logs, recentProject }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [stageTimers, setStageTimers] = useState<Record<number, number>>({});


  // Stages: Classification, Architecture, Frontend, Backend, Database, Validation, QA, Completion
  const stages = [
    { 
      name: 'Classification', 
      label: 'AI Application Classification', 
      desc: 'Analyzing user prompt prompts to determine target engine mode (CRUD / fullstack / frontend only).',
      mockTime: '1.2s'
    },
    { 
      name: 'Architecture', 
      label: 'Architecture Analysis', 
      desc: 'Defining database entities, relational models, schema requirements, and endpoint contracts.',
      mockTime: '4.8s'
    },
    { 
      name: 'Frontend', 
      label: 'Frontend Generation', 
      desc: 'Generating React routing structure, page views, layouts, and forms logic.',
      mockTime: '18.4s'
    },
    { 
      name: 'Backend', 
      label: 'Backend API Scaffolding', 
      desc: 'Creating Express routes, handlers, database query interfaces, and middleware controllers.',
      mockTime: '12.1s'
    },
    { 
      name: 'Database', 
      label: 'Database & Schema Build', 
      desc: 'Generating Prisma client configuration, seeding migration scripts, and pushing schema.',
      mockTime: '8.5s'
    },
    { 
      name: 'Validation', 
      label: 'Workspace Validation', 
      desc: 'Running physical structure integrity check, path mapping audits, and TypeScript builds.',
      mockTime: '6.2s'
    },
    { 
      name: 'QA', 
      label: 'AI Functional QA Review', 
      desc: 'Evaluating functional completeness, verifying forms work, and assessing validation logic.',
      mockTime: '14.5s'
    },
    { 
      name: 'Completion', 
      label: 'Project Completed', 
      desc: 'Bundling workspace, updating project metadata logs, and initializing local preview worker.',
      mockTime: '0.8s'
    }
  ];

  // Map backend logs steps to timeline index
  const getStageStates = () => {
    const states = stages.map(s => ({ ...s, status: 'pending', message: '' }));
    
    if (!isGenerating && logs.length === 0) {
      if (recentProject) {
        const isError = recentProject.status === 'error';
        states.forEach((s, idx) => {
          if (idx < 7) {
            s.status = 'completed';
          } else {
            s.status = isError ? 'error' : 'completed';
            s.message = isError ? 'Generation failed during checks' : 'Ready to browse';
          }
        });
      }
      return states;
    }

    const hasError = logs.some(l => l.status === 'error');
    const lastLog = logs[logs.length - 1];

    logs.forEach(log => {
      const msg = log.message.toLowerCase();
      const step = log.step;

      // Classification
      if (step >= 0) {
        states[0].status = 'completed';
      }
      if (msg.includes('selected generator') || msg.includes('classifying') || msg.includes('classification')) {
        states[0].status = 'completed';
        states[0].message = log.message;
      }

      // Architecture
      if (step >= 3 || msg.includes('architecture') || msg.includes('prisma') || msg.includes('creating new isolated project')) {
        states[0].status = 'completed';
        states[1].status = 'completed';
        states[1].message = log.message;
      }

      // Frontend, Backend, Database
      if (step >= 4) {
        states[0].status = 'completed';
        states[1].status = 'completed';
        
        if (msg.includes('writing frontend') || msg.includes('frontend folder') || msg.includes('frontend files')) {
          states[2].status = 'in-progress';
          states[2].message = log.message;
        }
        if (msg.includes('writing backend') || msg.includes('backend folder') || msg.includes('backend files')) {
          states[2].status = 'completed';
          states[3].status = 'in-progress';
          states[3].message = log.message;
        }
        if (msg.includes('writing database') || msg.includes('database folder') || msg.includes('database files') || msg.includes('prisma schema')) {
          states[2].status = 'completed';
          states[3].status = 'completed';
          states[4].status = 'in-progress';
          states[4].message = log.message;
        }
      }

      // Validation
      if (step >= 5 || msg.includes('validating') || msg.includes('quality checks') || msg.includes('repairagent')) {
        states[2].status = 'completed';
        states[3].status = 'completed';
        states[4].status = 'completed';
        states[5].status = 'in-progress';
        states[5].message = log.message;
      }

      // QA
      if (step >= 6 || msg.includes('completeness qa') || msg.includes('reliability checks') || msg.includes('qa score')) {
        states[5].status = 'completed';
        states[6].status = 'in-progress';
        states[6].message = log.message;
      }
    });

    if (isGenerating && lastLog) {
      const currentStep = lastLog.step;
      if (currentStep === 0 || currentStep === 1 || currentStep === 2) {
        states[0].status = 'in-progress';
        states[0].message = lastLog.message;
      } else if (currentStep === 3) {
        states[1].status = 'in-progress';
        states[1].message = lastLog.message;
      } else if (currentStep === 4) {
        const msg = lastLog.message.toLowerCase();
        if (msg.includes('frontend')) {
          states[2].status = 'in-progress';
          states[2].message = lastLog.message;
        } else if (msg.includes('backend')) {
          states[2].status = 'completed';
          states[3].status = 'in-progress';
          states[3].message = lastLog.message;
        } else if (msg.includes('database') || msg.includes('prisma')) {
          states[2].status = 'completed';
          states[3].status = 'completed';
          states[4].status = 'in-progress';
          states[4].message = lastLog.message;
        } else {
          states[2].status = 'in-progress';
          states[2].message = lastLog.message;
        }
      } else if (currentStep === 5) {
        states[2].status = 'completed';
        states[3].status = 'completed';
        states[4].status = 'completed';
        states[5].status = 'in-progress';
        states[5].message = lastLog.message;
      } else if (currentStep === 6) {
        states[2].status = 'completed';
        states[3].status = 'completed';
        states[4].status = 'completed';
        states[5].status = 'completed';
        states[6].status = 'in-progress';
        states[6].message = lastLog.message;
      }
    }

    if (hasError) {
      let marked = false;
      for (let i = 0; i < states.length; i++) {
        if (states[i].status === 'in-progress') {
          states[i].status = 'error';
          states[i].message = lastLog?.message || 'Error occurred';
          marked = true;
          break;
        }
      }
      if (!marked) {
        const lastCompletedIdx = states.map(s => s.status).lastIndexOf('completed');
        if (lastCompletedIdx !== -1) {
          states[lastCompletedIdx].status = 'error';
          states[lastCompletedIdx].message = lastLog?.message || 'Error occurred';
        }
      }
    }

    if (!isGenerating && logs.length > 0 && !hasError) {
      states.forEach(s => s.status = 'completed');
      states[7].status = 'completed';
      states[7].message = 'Ready to browse';
    }

    return states;
  };

  const timelineStates = getStageStates();

  // Find active stage index
  const activeIdx = timelineStates.findIndex(s => s.status === 'in-progress' || s.status === 'error');

  // Handle active stage timers ticking
  useEffect(() => {
    if (!isGenerating || activeIdx === -1) {
      return;
    }
    

    
    const interval = setInterval(() => {
      setStageTimers(prev => ({
        ...prev,
        [activeIdx]: (prev[activeIdx] || 0) + 1
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isGenerating, activeIdx]);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const formatTimer = (secs: number) => {
    if (!secs) return '0.0s';
    return `${secs}.0s`;
  };

  return (
    <div className="space-y-1 relative pl-2 mt-2">
      {timelineStates.map((stage, idx) => {
        let icon = <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />;
        let lineClass = "before:bg-[#18233D]";
        let textClass = "text-gray-500 font-medium";
        let isExpanded = expandedIndex === idx;
        
        if (stage.status === 'completed') {
          icon = <CheckCircle2 size={16} className="text-[#22C55E]" />;
          lineClass = "before:bg-[#22C55E]";
          textClass = "text-gray-300 font-semibold";
        } else if (stage.status === 'in-progress') {
          icon = <Loader2 size={16} className="text-[#4F8CFF] animate-spin" />;
          lineClass = "before:bg-[#4F8CFF]/30";
          textClass = "text-[#4F8CFF] font-bold";
        } else if (stage.status === 'error') {
          icon = <XCircle size={16} className="text-[#EF4444]" />;
          lineClass = "before:bg-[#EF4444]/30";
          textClass = "text-[#EF4444] font-bold";
        }

        const isCurrentActive = stage.status === 'in-progress';
        const displayTime = isCurrentActive 
          ? formatTimer(stageTimers[idx]) 
          : stage.status === 'completed' 
            ? stage.mockTime 
            : '';

        return (
          <div key={idx} className="relative flex flex-col py-2 border-b border-[#18233D]/20 last:border-0 group">
            {idx !== timelineStates.length - 1 && (
              <div className={`absolute left-[7px] top-[14px] w-0.5 h-full ${lineClass} before:absolute before:inset-y-0 before:inset-x-0`}></div>
            )}
            
            <div className="flex items-center justify-between z-10 w-full cursor-pointer" onClick={() => toggleExpand(idx)}>
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-[#0B1020] shrink-0">
                  {icon}
                </div>
                <div className={`text-xs ${textClass} select-none transition-colors`}>{stage.label}</div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {displayTime && (
                  <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                    <Clock size={10} /> {displayTime}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp size={14} className="text-gray-500 hover:text-gray-300" />
                ) : (
                  <ChevronDown size={14} className="text-gray-500 hover:text-gray-300" />
                )}
              </div>
            </div>

            {/* Expandable stage details */}
            {isExpanded && (
              <div className="pl-8 pr-2 py-2 text-[11px] leading-relaxed text-gray-400 space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
                <p className="flex items-start gap-1 text-gray-400">
                  <Info size={12} className="text-gray-600 shrink-0 mt-0.5" />
                  <span>{stage.desc}</span>
                </p>
                {stage.message && (
                  <div className={`text-[10px] font-mono p-2 rounded border truncate ${stage.status === 'error' ? 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]' : 'bg-[#121A2F] border-[#18233D] text-gray-300'}`}>
                    {stage.message}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
