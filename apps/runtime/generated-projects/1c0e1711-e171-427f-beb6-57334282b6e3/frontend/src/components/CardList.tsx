import { Edit, Trash2 } from 'lucide-react'
import React, { useState } from 'react'

interface CardListProps {
  items: Array<{ id: string; title: string; description: string }>
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function CardList({ items, onEdit, onDelete }: CardListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Data Items</h2>
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
        >
          {viewMode === 'grid' ? (
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="block w-2 h-2 bg-gray-700 rounded-sm mr-1"></span>
              <span className="block w-2 h-2 bg-gray-700 rounded-sm"></span>
            </div>
          ) : (
            <div className="w-5 h-5 flex items-center">
              <span className="block w-2 h-2 bg-gray-700 rounded-sm mr-1"></span>
              <span className="block w-2 h-2 bg-gray-700 rounded-sm"></span>
            </div>
          )}
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 border border-gray-200"
            >
              <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600 mt-1 truncate">{item.description}</p>
              <div className="mt-4 flex space-x-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(item.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    aria-label="Edit item"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    aria-label="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 truncate">{item.description}</p>
                </div>
                <div className="flex space-x-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      aria-label="Edit item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}