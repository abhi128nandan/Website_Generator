import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'complete';
}

interface FilterBarProps {
  activeFilter: 'all' | 'pending' | 'complete';
  setActiveFilter: (filter: 'all' | 'pending' | 'complete') => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, setActiveFilter }) => {
  return (
    <div className="filter-bar">
      <button 
        className={activeFilter === 'all' ? 'active' : ''}
        onClick={() => setActiveFilter('all')}
      >
        All
      </button>
      <button 
        className={activeFilter === 'pending' ? 'active' : ''}
        onClick={() => setActiveFilter('pending')}
      >
        Pending
      </button>
      <button 
        className={activeFilter === 'complete' ? 'active' : ''}
        onClick={() => setActiveFilter('complete')}
      >
        Complete
      </button>
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <header>
        <h1>Todo Task Manager</h1>
      </header>
      <main>{children}</main>
      <footer>
        <p>© 2025 Todo Task Manager</p>
      </footer>
    </div>
  );
};

export { FilterBar, Layout };