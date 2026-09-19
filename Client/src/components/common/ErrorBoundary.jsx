import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Uncaught component error in GeM Compliflix:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none">
          <div className="w-full max-w-lg bg-white dark:bg-[#181818] rounded-2xl shadow-xl border border-slate-200/90 dark:border-[#303030] p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                Application Rendering Fault
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Something went wrong
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                An unexpected interface error interrupted the compliance portal. Your session data remains safe.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-[#282828] text-left">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
              >
                {this.state.showDetails ? 'Hide technical diagnostics' : 'Show technical diagnostics'}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 rounded-lg bg-slate-100 dark:bg-[#202020] text-[10.5px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto max-h-40 border border-slate-200 dark:border-[#333]">
                  <p className="font-bold text-rose-600 dark:text-rose-400 mb-1">
                    {this.state.error?.toString()}
                  </p>
                  <pre className="whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
