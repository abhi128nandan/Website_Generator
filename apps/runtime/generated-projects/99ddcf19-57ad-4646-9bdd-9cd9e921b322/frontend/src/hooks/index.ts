import React from 'react';
import './Button.css';

interface ButtonProps {
  value: string;
  onClick: () => void;
  isOperator?: boolean;
  isClear?: boolean;
}

const Button: React.FC<ButtonProps> = ({ value, onClick, isOperator, isClear }) => {
  return (
    <button
      className={`calculator-button ${isOperator ? 'operator' : ''} ${isClear ? 'clear' : ''}`}
      onClick={onClick}
    >
      {value}
    </button>
  );
};

export default Button;