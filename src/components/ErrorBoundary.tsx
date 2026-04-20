import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Terjadi kesalahan pada aplikasi.';
      
      try {
        // Check if it's a Firestore JSON error
        const firestoreError = JSON.parse(this.state.error?.message || '');
        if (firestoreError.error) {
          errorMessage = `Kesalahan Database: ${firestoreError.error}`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-secondary mb-4">Ups! Ada Masalah</h2>
          <p className="text-sm text-gray-400 mb-8 max-w-xs">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary w-full max-w-xs"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
