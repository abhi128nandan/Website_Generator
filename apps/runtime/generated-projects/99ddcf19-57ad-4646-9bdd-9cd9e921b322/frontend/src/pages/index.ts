import React from 'react';

const Button: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
};

export default Button;