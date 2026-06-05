import React, { useEffect } from 'react';

interface KeyboardHandlerProps {
  onKeyInput: (key: string) => void;
}

const KeyboardHandler: React.FC<KeyboardHandlerProps> = ({ onKeyInput }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const allowedKeys = /[0-9+\-*/=.]/;
      
      if (allowedKeys.test(event.key)) {
        onKeyInput(event.key);
      } else if (event.key === 'Enter') {
        onKeyInput('=');
      } else if (event.key === 'Backspace') {
        onKeyInput('backspace');
      } else if (event.key.toLowerCase() === 'c' || event.key === 'Escape') {
        onKeyInput('clear');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyInput]);

  return null;
};