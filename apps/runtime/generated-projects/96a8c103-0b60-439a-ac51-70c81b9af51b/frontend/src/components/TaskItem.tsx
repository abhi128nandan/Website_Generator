import { Check, Clock } from 'lucide-react';

interface TaskItemProps {
  taskId: string;
  title: string;
  description?: string;
  dueDate?: Date | string;
  status: 'pending' | 'complete';
  onCompleteToggle: (taskId: string, newStatus: 'pending' | 'complete') => void;
}

export default function TaskItem({
  taskId,
  title,
  description,
  dueDate,
  status,
  onCompleteToggle,
}: TaskItemProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 transition-all hover:shadow-lg border border-gray-100 mb-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>
          )}
          <div className="flex items-center text-sm text-gray-500">
            {dueDate && (
              <div className="flex items-center mr-4">
                <Clock className="w-4 h-4 mr-1" />
                <span>{new Date(dueDate).toLocaleDateString()}</span>
              </div>
            )}
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                status === 'pending'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {status === 'pending' ? 'Pending' : 'Complete'}
            </span>
          </div>
        </div>
        <button
          onClick={() =>
            onCompleteToggle(taskId, status === 'pending' ? 'complete' : 'pending')
          }
          className={`p-2 rounded-full transition-colors ${
            status === 'pending'
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
          aria-label={status === 'pending' ? 'Mark as complete' : 'Mark as pending'}
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}