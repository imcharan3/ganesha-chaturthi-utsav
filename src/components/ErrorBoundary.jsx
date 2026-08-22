import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Mobile App Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#180803] text-amber-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-2xl font-bold shadow-gold">
            ॐ
          </div>
          <h2 className="text-xl font-bold text-amber-200 font-devotional">
            శ్రీ వినాయక చవితి ఉత్సవాలు • Vijaya Colony
          </h2>
          <p className="text-xs text-amber-300/80 max-w-sm">
            App is refreshing. Please tap below to reload the latest festival updates.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold text-xs shadow-gold hover:brightness-110"
          >
            🔄 Reload App / రీలోడ్ చేయండి
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
