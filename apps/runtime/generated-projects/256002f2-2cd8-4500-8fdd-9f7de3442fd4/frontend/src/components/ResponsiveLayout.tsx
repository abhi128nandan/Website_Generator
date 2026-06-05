import React from 'react';

const ResponsiveLayout: React.FC = ({ children }) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-4">
      {children}
    </div>
  );
};

export default ResponsiveLayout;