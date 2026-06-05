// frontend/src/hooks/useKeyboardInput.ts
import { useEffect } from 'react';

export const useKeyboardInput = (inputRef: React.RefObject<HTMLInputElement>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        const key = e.key;
        if (/^[0-9+\-*/.]$/.test(key)) {
          e.preventDefault();
          const currentValue = inputRef.current.value;
          inputRef.current.value = currentValue + key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputRef]);
};