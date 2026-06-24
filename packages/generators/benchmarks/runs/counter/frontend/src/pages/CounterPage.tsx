import CounterComponent from '../components/CounterComponent';

export default function CounterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <CounterComponent initialCount={0} />
    </div>
  );
}