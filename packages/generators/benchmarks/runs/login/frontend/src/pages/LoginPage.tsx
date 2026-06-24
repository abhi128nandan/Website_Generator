import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  const handleSubmit = (email: string, password: string) => {
    console.log('Form submitted with:', { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <LoginForm onSubmit={handleSubmit} />
    </div>
  );
}