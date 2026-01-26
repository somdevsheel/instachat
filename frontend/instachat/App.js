import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import store from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initBackgroundUpload } from './src/services/backgroundUpload';
import { initSocket, disconnectSocket } from './src/services/socket';

// Socket initialization component
const SocketInitializer = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      console.log('🔌 Initializing socket for user:', user._id);
      initSocket();
    } else {
      console.log('🔌 Disconnecting socket - user not authenticated');
      disconnectSocket();
    }

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?._id]);

  return null;
};

export default function App() {
  useEffect(() => {
    // Background uploads only (no auth, no crypto)
    initBackgroundUpload();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <SocketInitializer />
        <AppNavigator />
        <Toast />
      </SafeAreaProvider>
    </Provider>
  );
}