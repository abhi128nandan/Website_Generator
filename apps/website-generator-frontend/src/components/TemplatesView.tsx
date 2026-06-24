import React from 'react';
import { CopyPlus, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store';

const TEMPLATES = [
  {
    id: 'saas-dashboard',
    name: 'SaaS Analytics Dashboard',
    description: 'A complete B2B dashboard with user management, analytics widgets, and settings.',
    tags: ['React', 'Vite', 'Tailwind'],
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'crm',
    name: 'Customer Relationship Manager',
    description: 'Manage leads, contacts, and deals with a Kanban board and activity feed.',
    tags: ['CRUD', 'Forms', 'Data Grid'],
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'portfolio',
    name: 'Developer Portfolio',
    description: 'A sleek, dark-themed personal portfolio with project gallery and contact form.',
    tags: ['Static', 'Animations', 'Framer Motion'],
    color: 'from-purple-500 to-pink-600'
  }
];

export function TemplatesView() {
  const { setActiveView } = useAppStore();

  const handleUseTemplate = (template: any) => {
    // In a full implementation, this would pre-fill the SRS text area
    // and jump to the dashboard view.
    setActiveView('dashboard');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <CopyPlus className="text-[#4F8CFF]" size={28} />
              Template Marketplace
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Start your next project with a proven architectural blueprint.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map(t => (
            <div key={t.id} className="glass-card rounded-xl border border-white/5 bg-[#0B1020]/25 overflow-hidden flex flex-col group hover:border-[#4F8CFF]/50 transition-colors">
              <div className={`h-32 bg-gradient-to-br ${t.color} p-6 flex flex-col justify-end relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                <h3 className="text-xl font-bold text-white relative z-10">{t.name}</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-sm text-gray-400 mb-4 flex-1">{t.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {t.tags.map(tag => (
                    <span key={tag} className="text-[10px] uppercase font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <button 
                  onClick={() => handleUseTemplate(t)}
                  className="w-full bg-[#18233D] hover:bg-[#4F8CFF] text-white border border-[#4F8CFF]/30 px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(79,140,255,0.4)]"
                >
                  Use Template <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
