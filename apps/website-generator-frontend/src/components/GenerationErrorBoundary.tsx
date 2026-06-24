import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GenerationErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Generation:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-lg text-red-400 h-full flex flex-col justify-center items-center">
          <h2 className="text-xl font-bold mb-2">Generation UI Error</h2>
          <p className="text-sm">{this.state.error?.message}</p>
          <button 
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
