import Layout from '../components/Layout'
import Card from '../components/Card'
import Loader from '../components/Loader'
import ErrorBoundary from '../components/ErrorBoundary'
import { useDataFetch } from '../hooks/useDataFetch'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Search, Cloud, Thermometer } from 'lucide-react'

export default function HomePage() {
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('darkMode', false)
  const { data, loading, error, refresh } = useDataFetch('/api/home-preview')

  if (error) {
    return (
      <Layout>
        <div className="p-4 text-red-500">
          <p>Failed to load home page data. Please try again later.</p>
          <button 
            onClick={refresh}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to UnnamedApp</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your all-in-one solution for weather insights and environmental monitoring
          </p>
        </div>

        {loading && (
          <div className="flex justify-center my-8">
            <Loader />
          </div>
        )}

        {!loading && data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                  <Search size={24} />
                </div>
                <h3 className="ml-3 text-xl font-semibold">Intelligent Search</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Find weather patterns and historical data for any location with our advanced search engine
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-green-600 dark:text-green-300">
                  <Cloud size={24} />
                </div>
                <h3 className="ml-3 text-xl font-semibold">Real-Time Updates</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Get live updates on cloud coverage, precipitation, and atmospheric conditions
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg text-red-600 dark:text-red-300">
                  <Thermometer size={24} />
                </div>
                <h3 className="ml-3 text-xl font-semibold">Temperature Analysis</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Track temperature changes across different regions and elevation levels
              </p>
            </Card>
          </div>
        )}

        <div className="text-center">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>
      </div>
    </Layout>
  )
}