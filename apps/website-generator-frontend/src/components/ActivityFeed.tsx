import { CheckCircle2, Clock, Trash2, Package, ShieldCheck } from 'lucide-react';
import { GeneratedProject } from '@website-generator/shared';

interface Props {
  projects: GeneratedProject[];
}

export function ActivityFeed({ projects }: Props) {
  // Synthesize activity feed from projects
  const activities: Array<{ id: string; type: string; title: string; time: Date; status: string }> = [];

  projects.forEach((p) => {
    const t = new Date(p.createdAt);
    if (!isNaN(t.getTime())) {
      activities.push({
        id: `${p.id}-gen`,
        type: 'generate',
        title: `Generated ${p.name || 'Project'}`,
        time: t,
        status: p.status
      });

      if (p.status === 'completed') {
        const t2 = new Date(t.getTime() + 15000); // Fake validation offset
        activities.push({
          id: `${p.id}-val`,
          type: 'validation',
          title: `Validation Passed for ${p.name}`,
          time: t2,
          status: 'success'
        });
        
        const metadata = p.metadata as any;
        if (metadata?.reliability?.score) {
           const t3 = new Date(t.getTime() + 20000);
           activities.push({
             id: `${p.id}-qa`,
             type: 'qa',
             title: `QA Score ${metadata.reliability.score} assigned`,
             time: t3,
             status: 'success'
           });
        }
      }
    }
  });

  activities.sort((a, b) => b.time.getTime() - a.time.getTime());
  const displayActivities = activities.slice(0, 15); // Top 15 recent

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (displayActivities.length === 0) {
    return <div className="text-xs text-gray-500 italic text-center mt-6">No recent activity</div>;
  }

  return (
    <div className="space-y-4">
      {displayActivities.map((act) => {
        let Icon = Package;
        let color = 'text-gray-400';
        let bg = 'bg-gray-800';

        if (act.type === 'generate') {
          Icon = Package;
          color = act.status === 'error' ? 'text-[#EF4444]' : 'text-[#4F8CFF]';
          bg = act.status === 'error' ? 'bg-[#EF4444]/10' : 'bg-[#4F8CFF]/10';
        } else if (act.type === 'validation') {
          Icon = ShieldCheck;
          color = 'text-[#22C55E]';
          bg = 'bg-[#22C55E]/10';
        } else if (act.type === 'qa') {
          Icon = CheckCircle2;
          color = 'text-[#F59E0B]';
          bg = 'bg-[#F59E0B]/10';
        } else if (act.type === 'delete') {
          Icon = Trash2;
          color = 'text-gray-500';
          bg = 'bg-[#18233D]';
        }

        return (
          <div key={act.id} className="flex items-start gap-3 group">
            <div className={`p-2 rounded-full shrink-0 ${bg} ${color}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-semibold text-gray-200 truncate group-hover:text-white transition-colors">{act.title}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={10} className="text-gray-500" />
                <span className="text-[10px] text-gray-500 font-mono">{timeAgo(act.time)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
