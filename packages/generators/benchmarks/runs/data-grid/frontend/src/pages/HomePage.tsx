import DataGrid from '../components/DataGrid'

export default function HomePage() {
  const columns = ['id', 'name', 'email', 'status']
  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'Pending' }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Data Grid Example</h1>
      <DataGrid columns={columns} data={data} />
    </div>
  )
}