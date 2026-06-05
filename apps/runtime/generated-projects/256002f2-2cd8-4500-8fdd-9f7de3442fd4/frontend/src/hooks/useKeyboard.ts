import { useEffect, useState } from 'react';

export function useKeyboard() {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPressedKey(event.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { key: pressedKey };
}