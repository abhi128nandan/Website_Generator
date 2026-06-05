<think>
Okay, let's tackle this MainLayout component for the TodoManager app. The user wants a responsive layout with header, sidebar, and main content. Using TypeScript and TailwindCSS, and only lucide-react icons.

First, I need to structure the component. The layout should have a header, sidebar, and main area. For responsiveness, maybe a mobile menu that toggles the sidebar. Let me think about the structure.

I'll start by setting up the TypeScript interface for props. It might not take any props, but maybe just a children prop to pass the main content. Wait, the task says to accept props via a typed interface, but the example shows a component that might not need props. Hmm, maybe the MainLayout doesn't need any props except the children. So the interface could be something like:

interface MainLayoutProps {
  children: React.ReactNode;
}

But the user says to export the component as default, and make sure it's production-ready. So maybe include a sidebar with navigation links, like Home, Tasks, Settings, etc. The sidebar should collapse on smaller screens.

For the header, maybe a logo, a search bar, and some icons for settings or user profile. The sidebar should have a toggle button for mobile.

Using Tailwind's flexbox for layout. The sidebar can be fixed on larger screens, and hidden on smaller ones with a toggle. Let me outline the structure:

- A container with flex for the header and the rest.
- The sidebar is on the left, hidden on mobile, visible on desktop.
- The main content area takes up the remaining space.
- The header is fixed or sticky so it stays on scroll?

Wait, the header should be above the main area. Maybe the layout is a flex column for the header and the main content area. The main content area is a flex row with sidebar and main content.

So the structure would be:

<div className="flex h-screen flex-col">
  <Header />
  <div className="flex flex-1 overflow-hidden">
    <Sidebar />
    <MainContent />
  </div>
</div>

But need to handle responsiveness. On smaller screens, the sidebar is hidden and can be toggled. So maybe use a state to track sidebar open/close for mobile.

I'll need to use useState for the mobile menu. Also, use MediaQuery or Tailwind's responsive classes. For example, the sidebar is hidden (hidden) on mobile, and visible on md:screen and up.

For the icons, using lucide-react. Need to import the necessary icons: Menu for the mobile menu toggle, Home, Settings, Star, etc., for the sidebar navigation.

Also, interactive elements like hover effects on sidebar links, transitions when opening/closing the sidebar on mobile.

Let me outline the code step by step.

First, the imports:

import React, { useState } from 'react';
import { Menu, Home, Settings, Star, Plus, Moon, Sun, X } from 'lucide-react';

Then the component:

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className={`flex h-screen flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md px-4 py-3 flex items-center border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white ml-2 md:ml-0">TodoManager</h1>
        <div className="flex-1"></div>
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-0 md:w-64'} md:block`}
        >
          <div className={`h-full ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <a href="#" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                    <Home className="h-5 w-5" />
                    <span className="ml-3">Home</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                    <Plus className="h-5 w-5" />
                    <span className="ml-3">New Task</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                    <Star className="h-5 w-5" />
                    <span className="ml-3">Favorites</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                    <Settings className="h-5 w-5" />
                    <span className="ml-3">Settings</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Pass children here */}
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {!sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg