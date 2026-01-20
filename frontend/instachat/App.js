import 'react-native-get-random-values'; // ✅ MUST be first

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import store from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import api from './src/services/api';
import { initBackgroundUpload } from './src/services/backgroundUpload';

import {
  generateIdentityKeys,
  getIdentityPublicKey,
} from './src/utils/crypto';

/* ======================================================
   🔐 E2EE INITIALIZER (AUTH-AWARE)
====================================================== */
const E2EEInitializer = ({ children }) => {
  const { user, token } = useSelector(state => state.auth);

  useEffect(() => {
  initBackgroundUpload();
  }, []);

  useEffect(() => {
    const initE2EE = async () => {
      try {
        // 🚫 Do nothing if not logged in
        if (!user || !token) {
          console.log('⏭️ User not logged in, skipping E2EE init');
          return;
        }

        console.log('🔐 Initializing E2EE for user:', user._id);

        // 1️⃣ Ensure identity keys exist locally
        await generateIdentityKeys();

        // 2️⃣ Get public key (Base64)
        const publicKey = await getIdentityPublicKey();
        if (!publicKey) {
          console.log('⚠️ No public key generated');
          return;
        }

        console.log('📤 Uploading public key to server...');

        // 3️⃣ Register / update public key on backend
        await api.post('/keys', {
          identityPublicKey: publicKey, // ✅ Match backend field name
        });

        console.log('✅ E2EE initialized successfully');
      } catch (err) {
        console.error('❌ E2EE init error:', err.message);
        // Retry after 5 seconds
        setTimeout(() => {
          console.log('🔄 Retrying E2EE init...');
          initE2EE();
        }, 5000);
      }
    };

    initE2EE();
  }, [user, token]);
    

  return children;
};

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* 🔐 E2EE runs only after login */}
        <E2EEInitializer>
          <AppNavigator />
        </E2EEInitializer>

        <Toast />
      </SafeAreaProvider>
    </Provider>
  );
}





