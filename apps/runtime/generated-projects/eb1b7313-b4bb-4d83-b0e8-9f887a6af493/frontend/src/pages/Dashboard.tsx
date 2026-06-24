import React from 'react';
import { Activity, Zap, Layers } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Overview of all tasks and categories</h1>
        <p className="text-gray-600">Overview and functional controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Task statistics</h3>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Functionality for Task statistics is active and processing metrics.</p>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Execute Action &rarr;
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent tasks</h3>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Functionality for Recent tasks is active and processing metrics.</p>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Execute Action &rarr;
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Category summary</h3>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Functionality for Category summary is active and processing metrics.</p>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Execute Action &rarr;
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Quick task creation</h3>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Functionality for Quick task creation is active and processing metrics.</p>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Execute Action &rarr;
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Business Logic Controller</h2>
        <p className="text-gray-600 mb-4">This module connects dynamically to backend workflows.</p>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Initialize Workflow
        </button>
      </div>
    </div>
  );
}
