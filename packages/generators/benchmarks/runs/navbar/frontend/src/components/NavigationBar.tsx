import { Home, Settings, Star, Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavigationBarProps {
  links: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
  }>;
  activeUrl: string;
  className?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ links, activeUrl, className }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className={`bg-white shadow-lg dark:bg-gray-900 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <a href="#" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">BenchmarkApp</span>
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`${
                    link.href === activeUrl
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  } px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200`}
                >
                  {link.icon && (
                    <span className="mr-2 h-5 w-5">
                      {link.href === activeUrl ? (
                        <span className="text-indigo-600 dark:text-indigo-400">{link.icon}</span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">{link.icon}</span>
                      )}
                    </span>
                  )}
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1 sm:px-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`${
                link.href === activeUrl
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              } block px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors duration-200`}
            >
              {link.icon && (
                <span className="mr-2 h-5 w-5">
                  {link.href === activeUrl ? (
                    <span className="text-indigo-600 dark:text-indigo-400">{link.icon}</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">{link.icon}</span>
                  )}
                </span>
              )}
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;