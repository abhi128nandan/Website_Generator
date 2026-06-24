import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-600 text-sm mb-6">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <button
            onClick={resetError}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors shadow-sm shadow-red-500/20"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
        
        {error && (
          <div className="p-6 bg-slate-50">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Error Details</div>
            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-red-400 text-sm font-mono whitespace-pre-wrap break-words">
                {error.message}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
