import React from 'react';

import Tooltip from '../components/Tooltip';
import { Search } from 'lucide-react';

const TooltipPage: React.FC = () => {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Tooltip Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Tooltip Example */}
        <Tooltip 
          content="This is a basic tooltip"
          className="mb-4"
        >
          <span className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-help">
            Hover me!
          </span>
        </Tooltip>

        {/* Tooltip with Icon */}
        <Tooltip 
          content="Search icon tooltip"
          className="mb-4"
        >
          <div className="p-3 bg-green-500 text-white rounded hover:bg-green-600 cursor-help">
            <Search size={20} />
          </div>
        </Tooltip>

        {/* Tooltip with Custom Styling */}
        <Tooltip 
          content="Custom styled tooltip"
          className="mb-4"
          contentClassName="bg-red-600"
        >
          <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 cursor-help">
            Custom Tooltip
          </button>
        </Tooltip>

        {/* Tooltip in Text */}
        <div className="mb-4">
          <p className="text-gray-700">
            This is a sentence with a{' '}
            <Tooltip content="Tooltip in text">
              <span className="underline text-blue-500 cursor-help">tooltip</span>
            </Tooltip>.
          </p>
        </div>

        {/* Multiple Tooltips in a Group */}
        <div className="space-y-3 mb-4">
          <Tooltip content="First item">
            <div className="p-3 bg-yellow-300 rounded cursor-help">Item 1</div>
          </Tooltip>
          
          <Tooltip content="Second item">
            <div className="p-3 bg-yellow-300 rounded cursor-help">Item 2</div>
          </Tooltip>
          
          <Tooltip content="Third item">
            <div className="p-3 bg-yellow-300 rounded cursor-help">Item 3</div>
          </Tooltip>
        </div>

        {/* Tooltip with Long Content */}
        <Tooltip 
          content="This is a longer tooltip with more detailed information that might need more space"
          className="mb-4"
        >
          <span className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 cursor-help">
            Long Content Tooltip
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

export default TooltipPage;