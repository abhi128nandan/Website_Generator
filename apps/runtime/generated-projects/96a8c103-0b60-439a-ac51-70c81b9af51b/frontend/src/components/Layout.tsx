import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  footerContent?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, headerTitle = 'TodoTaskManager', footerContent }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8" />
            <h1 className="text-xl font-bold text-gray-800">{headerTitle}</h1>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-6 text-sm text-center">
          {footerContent || '© 2023 TodoTaskManager. All rights reserved.'}
        </div>
      </footer>
    </div>
  );
};

export default Layout;