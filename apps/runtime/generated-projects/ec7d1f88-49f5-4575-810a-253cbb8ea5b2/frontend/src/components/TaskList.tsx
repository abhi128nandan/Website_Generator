import React from 'react'
import { Star, Clock, Minus, Trash2, Edit, Check } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  isCompleted: boolean
  priority: 'high' | 'medium' | 'low'
  category: string
  dueDate?: Date
}

interface TaskListProps {
  tasks: Task[]
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  loading: boolean
  error: string | null
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleComplete, onDelete, onEdit, loading, error }) => {
  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-red-500">
        <div className="text-center">
          <div className="w-16 h-16 mb-4 text-red-400">❗</div>
          <p className="text-lg font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-gray-500">
        <div className="animate-pulse">Loading tasks...</div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-gray-500">
        <div className="w-16 h-16 mb-4 text-blue-400">📁</div>
        <p className="text-lg">No tasks yet. Create your first task!</p>
      </div>
    )
  }

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="space-y-4 p-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-xl shadow-lg p-5 transition-all hover:shadow-xl hover:translate-y-[-2px] border border-gray-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onToggleComplete(task.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                    task.isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  aria-label="Complete task"
                >
                  {task.isCompleted && <Check className="w-4 h-4" />}
                </button>
                <div>
                  <h3 className="font-medium text-gray-800 line-through opacity-50 transition-opacity duration-200">
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-800">
                  {task.category}
                </span>
                <div
                  className={`p-1.5 rounded-full ${
                    task.priority === 'high'
                      ? 'bg-red-100 text-red-600'
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-green-100 text-green-600'
                  }`}
                  title={task.priority}
                >
                  {task.priority === 'high' ? (
                    <Star className="w-4 h-4" />
                  ) : task.priority === 'medium' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => onEdit(task.id)}
                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                title="Edit task"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaskList