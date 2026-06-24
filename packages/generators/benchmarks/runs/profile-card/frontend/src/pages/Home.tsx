import Header from '../components/Header'
import MainContent from '../components/MainContent'

export default function Home() {
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=1'
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header 
        onMenuToggle={() => console.log('Menu toggled')} 
        isDarkMode={false} 
        onThemeToggle={() => console.log('Theme toggled')} 
      />
      <main className="container mx-auto px-4 py-8">
        <MainContent 
          user={user} 
          onEdit={() => console.log('Edit clicked')}
          onDelete={() => console.log('Delete clicked')}
        />
      </main>
    </div>
  )
}