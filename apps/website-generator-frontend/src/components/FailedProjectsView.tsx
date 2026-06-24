import React from 'react';
import { AlertCircle } from 'lucide-react';

export function FailedProjectsView() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <AlertCircle className="text-red-500" size={28} />
              Failed Builds
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Projects that exhausted all self-healing attempts.</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-12 border border-white/5 bg-[#0B1020]/25 flex flex-col items-center justify-center text-center space-y-4">
           <AlertCircle className="text-gray-600 mb-2" size={48} />
           <h3 className="text-lg font-bold text-gray-300">No Failed Builds</h3>
           <p className="text-sm text-gray-500 max-w-md">The Multi-Agent Repair System successfully healed all generation attempts. No projects are currently stuck in a failed state.</p>
        </div>
      </div>
    </div>
  );
}
