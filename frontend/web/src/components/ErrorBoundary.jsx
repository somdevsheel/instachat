import React from 'react';

// Error boundaries must be class components — there's no hook
// equivalent for getDerivedStateFromError/componentDidCatch. Without
// this, any uncaught render error white-screens the entire app with
// nothing shown to the user.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary">
        <div className="error-boundary-card">
          <h1>Something went wrong</h1>
          <p>This page hit an unexpected error. Reloading usually fixes it.</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}
