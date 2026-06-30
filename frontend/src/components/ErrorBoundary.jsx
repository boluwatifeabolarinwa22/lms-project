import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-center flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-red-50 border border-red-100 text-red-600">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Application Error</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              A rendering error occurred. This could be due to a corrupt session state or cached data.
            </p>
            <div className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Error Message</span>
              <code className="text-xs text-red-600 font-mono block break-all whitespace-pre-wrap">
                {this.state.error?.toString() || 'Unknown Error'}
              </code>
            </div>
            <button 
              onClick={this.handleReset}
              className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Session & Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
