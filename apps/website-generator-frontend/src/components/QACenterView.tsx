import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, TerminalSquare, FileWarning } from 'lucide-react';

export function QACenterView() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // In a real app, we'd fetch this from the backend
    setMetrics({
      totalRuns: 12,
      successfulRuns: 10,
      generationSuccessRate: 0.83,
      totalRepairAttempts: 24,
      commonTsErrors: {
        'TS2322': 5,
        'TS2532': 3,
        'TS7006': 2
      },
      commonBuildErrors: {
        'Rollup failed to resolve import': 4,
        'Missing index.html': 1
      }
    });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={28} />
              QA Center & Metrics
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Aggregated observability metrics for the Generation Pipeline.</p>
          </div>
        </div>

        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-3 mb-2 text-emerald-400">
                  <Activity size={20} />
                  <span className="text-xs font-bold uppercase tracking-wider">Success Rate</span>
                </div>
                <div className="text-3xl font-black text-white">{(metrics.generationSuccessRate * 100).toFixed(1)}%</div>
              </div>
              <div className="glass-card rounded-xl p-5 border border-white/5 bg-[#0B1020]/25">
                <div className="flex items-center gap-3 mb-2 text-gray-400">
                  <TerminalSquare size={20} />
                  <span className="text-xs font-bold uppercase tracking-wider">Total Runs</span>
                </div>
                <div className="text-3xl font-black text-white">{metrics.totalRuns}</div>
              </div>
              <div className="glass-card rounded-xl p-5 border border-white/5 bg-[#0B1020]/25">
                <div className="flex items-center gap-3 mb-2 text-gray-400">
                  <FileWarning size={20} />
                  <span className="text-xs font-bold uppercase tracking-wider">Total Repairs</span>
                </div>
                <div className="text-3xl font-black text-white">{metrics.totalRepairAttempts}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-xl p-6 border border-white/5 bg-[#0B1020]/25">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 pb-4 border-b border-white/5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Most Common TS Errors
                </h3>
                <div className="space-y-3">
                  {Object.entries(metrics.commonTsErrors).map(([err, count]) => (
                    <div key={err} className="flex items-center justify-between">
                      <code className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">{err}</code>
                      <span className="text-xs font-bold text-gray-500">{String(count)} occurrences</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-xl p-6 border border-white/5 bg-[#0B1020]/25">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 pb-4 border-b border-white/5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Most Common Build Errors
                </h3>
                <div className="space-y-3">
                  {Object.entries(metrics.commonBuildErrors).map(([err, count]) => (
                    <div key={err} className="flex items-center justify-between">
                      <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 truncate max-w-[200px]">{err}</span>
                      <span className="text-xs font-bold text-gray-500">{String(count)} occurrences</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
