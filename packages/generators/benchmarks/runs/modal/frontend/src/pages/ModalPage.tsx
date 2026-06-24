import { useState } from 'react';
import ModalComponent from '../components/ModalComponent';
import { X, Plus } from 'lucide-react';

export default function ModalPage(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between border-b pb-4 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Modal Demonstration</h1>
          <button
            onClick={openModal}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Open Modal
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            This page demonstrates the ModalComponent behavior. The modal can be closed by clicking
            the close button or the overlay. Try opening the modal and interacting with it to see
            different states and transitions.
          </p>
          
          <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
            <h2 className="mb-3 text-lg font-medium text-gray-800 dark:text-white">Modal Content Example</h2>
            <p className="text-gray-600 dark:text-gray-300">
              When the modal is open, this sample content will be displayed inside the modal window.
              The modal uses a dark overlay with a backdrop blur effect for better visibility.
            </p>
          </div>
        </div>
      </div>

      <ModalComponent isOpen={isModalOpen} onClose={closeModal}>
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Modal Window</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              This is a modal window demonstration. You can close it by clicking the X button or the
              overlay outside the content area. The modal uses modern Tailwind CSS styling for a clean,
              responsive design.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
              <p className="text-gray-600 dark:text-gray-300">
                This section demonstrates how custom content can be placed inside the modal. You can
                include forms, images, or any other React components here. The modal ensures proper
                z-indexing and accessibility by using the provided props correctly.
              </p>
            </div>
            
            <button
              onClick={closeModal}
              className="w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
            >
              Close Modal
            </button>
          </div>
        </div>
      </ModalComponent>
    </div>
  );
}