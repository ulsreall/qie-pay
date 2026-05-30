import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#09090B]">
          <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
            <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
            <h2 className="text-lg font-semibold text-[#FAFAFA]">Something went wrong</h2>
            <p className="text-sm text-[#71717A]">
              An unexpected error occurred. This may be caused by a stale browser cache after a deploy.
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#10B981] text-white hover:bg-[#059669] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#27272A] text-[#FAFAFA] hover:bg-[#3F3F46] transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
