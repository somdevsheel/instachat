import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import store from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initBackgroundUpload } from './src/services/backgroundUpload';
import { initSocket, disconnectSocket } from './src/services/socket';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from './src/services/pushNotifications';
import { navigate } from './src/navigation/navigationRef';
import { ROUTES } from './src/navigation/routes.constants';

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

// Registers the device for push notifications once logged in, and routes
// the user to the right screen when they tap a notification.
const PushNotificationInitializer = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const tokenRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      registerForPushNotifications().then((token) => {
        tokenRef.current = token;
      });
    } else if (tokenRef.current) {
      unregisterPushNotifications(tokenRef.current);
      tokenRef.current = null;
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (data?.type === 'chat' && data.chatId) {
          navigate(ROUTES.CHAT_DETAIL, {
            chatId: data.chatId,
            receiverId: data.senderId,
            username: data.senderUsername,
          });
        } else if (data?.type === 'notification') {
          navigate(ROUTES.NOTIFICATIONS);
        }
      }
    );

    return () => subscription.remove();
  }, []);

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
        <PushNotificationInitializer />
        <AppNavigator />
        <Toast />
      </SafeAreaProvider>
    </Provider>
  );
}