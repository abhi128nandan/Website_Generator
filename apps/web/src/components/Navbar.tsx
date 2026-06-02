import { useState, useEffect } from 'react';

export function Navbar() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/ai/status');
        if (res.ok) {
          setHealth(await res.json());
        }
      } catch (e) {
        setHealth({ aiStatus: 'offline', message: 'Backend unreachable' });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!health) return 'bg-gray-500';
    if (health.aiStatus === 'ok') return 'bg-green-500';
    if (health.message?.includes('Missing API Key')) return 'bg-yellow-500';
    if (health.message?.includes('Invalid API Key')) return 'bg-red-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (!health) return 'Connecting...';
    if (health.aiStatus === 'ok') return 'Connected';
    if (health.message?.includes('Missing API Key')) return 'Missing API Key';
    if (health.message?.includes('Invalid API Key')) return 'Invalid API Key';
    return 'Provider Offline';
  };

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-4 justify-between shrink-0">
      <div className="flex items-center gap-2">
        <h1 className="font-semibold text-gray-200">Paperclip Core</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full text-xs font-medium">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-gray-300">
            {health?.provider ? health.provider.charAt(0).toUpperCase() + health.provider.slice(1) : 'Provider'}: {getStatusText()}
          </span>
        </div>
      </div>
    </header>
  );
}
