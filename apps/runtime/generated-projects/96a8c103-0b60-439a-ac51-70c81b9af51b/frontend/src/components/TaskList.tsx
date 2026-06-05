import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'complete';
  dueDate: string;
}

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'complete'>('all');

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'pending') return task.status === 'pending';
    if (activeFilter === 'complete') return task.status === 'complete';
    return true;
  });

  const isOverdue = (dueDate: string): boolean => {
    const today = new Date();
    const taskDate = new Date(dueDate);
    return taskDate < today && task.status === 'pending';
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded ${activeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1 rounded ${activeFilter === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveFilter('complete')}
            className={`px-3 py-1 rounded ${activeFilter === 'complete' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Complete
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{task.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  task.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {task.status}
              </span>
            </div>
            <div className="mt-3 flex items-center">
              <div className="text-sm text-gray-500">
                Due: <span className="font-medium">{task.dueDate}</span>
              </div>
              {isOverdue(task.dueDate) && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  Overdue
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;