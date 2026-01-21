/**
 * App.js
 *
 * CLEAN – PLAIN TEXT – NO CRYPTO – ANDROID SAFE
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import store from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initBackgroundUpload } from './src/services/backgroundUpload';

export default function App() {
  useEffect(() => {
    // Background uploads only (no auth, no crypto)
    initBackgroundUpload();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <AppNavigator />
        <Toast />
      </SafeAreaProvider>
    </Provider>
  );
}
