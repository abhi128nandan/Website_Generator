import { Home } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="h-96 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <div className="text-center text-white p-8">
              <Home className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-4xl font-extrabold mb-2">Welcome to BenchmarkApp</h1>
              <p className="text-lg">Your all-in-one solution for benchmarking and performance analysis</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-transform hover:scale-105">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Performance Metrics</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Our platform provides detailed performance metrics to help you optimize your applications.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-transform hover:scale-105">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Comparative Analysis</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Compare different configurations and solutions to find the optimal performance.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-transform hover:scale-105">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Benchmarking Tools</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Access our comprehensive suite of benchmarking tools for accurate performance evaluation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;