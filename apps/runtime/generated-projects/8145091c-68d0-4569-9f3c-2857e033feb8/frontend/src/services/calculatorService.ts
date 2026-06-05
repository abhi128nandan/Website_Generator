import { useState, useEffect } from 'react';

export const DigitButton = ({ digit, onClick }: { digit: string; onClick: (digit: string) => void }) => {
  return (
    <button className="digit-button" onClick={() => onClick(digit)}>
      {digit}
    </button>
  );
};

export default DigitButton;