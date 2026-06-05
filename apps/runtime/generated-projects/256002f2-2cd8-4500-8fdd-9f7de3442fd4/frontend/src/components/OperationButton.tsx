import React from 'react';
import { Plus } from 'lucide-react';

interface OperationButtonProps {
  label: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
}

const OperationButton: React.FC<OperationButtonProps> = ({ label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex flex-col items-center"
  >
    {Icon && <Icon className="w-6 h-6 mb-1" />}
    <span>{label}</span>
  </button>
);

export default OperationButton;