import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import {
  store,
  configureApiBaseUrl,
  configureSocketUrl,
} from '@instachat/shared';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { getInitialTheme, applyTheme } from './utils/theme.js';
import './index.css';

configureApiBaseUrl(
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
);
configureSocketUrl(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

applyTheme(getInitialTheme());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <App />
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
