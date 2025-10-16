import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class TimerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Timer Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="neumo-raised rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <AlertTriangle className="w-16 h-16 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-4 text-[var(--fg)]">
              Timer Synchronization Error
            </h2>
            <p className="text-center text-[var(--fg)] opacity-70 mb-6">
              The timer encountered an error while synchronizing. This could be due to a
              connection issue or an unexpected state.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={this.handleReset}
              className="w-full"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Retry
            </Button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-xs text-left">
                <summary className="cursor-pointer text-[var(--fg)] opacity-50 hover:opacity-100">
                  Error Details
                </summary>
                <pre className="mt-2 p-4 bg-red-50 dark:bg-red-950 rounded-lg overflow-auto text-red-800 dark:text-red-200">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
