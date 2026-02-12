// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';

// import LoginScreen from '../screens/auth/LoginScreen';
// import SignupScreen from '../screens/auth/SignupScreen';
// import SignupOtpScreen from '../screens/auth/SignupOtpScreen';
// import ForgotPasswordEmailScreen from '../screens/auth/ForgotPasswordEmailScreen';
// import ForgotPasswordOtpScreen from '../screens/auth/ForgotPasswordOtpScreen';

// import { ROUTES } from './routes.constants';

// const Stack = createStackNavigator();

// const AuthStack = () => {
//   return (
//     <Stack.Navigator
//       screenOptions={{
//         headerShown: false,
//         animationEnabled: true,
//       }}
//     >
//       {/* LOGIN */}
//       <Stack.Screen
//         name={ROUTES.LOGIN}
//         component={LoginScreen}
//       />

//       {/* SIGNUP */}
//       <Stack.Screen
//         name={ROUTES.SIGNUP}
//         component={SignupScreen}
//       />

//       <Stack.Screen
//         name={ROUTES.SIGNUP_OTP}
//         component={SignupOtpScreen}
//       />

//       {/* FORGOT PASSWORD FLOW */}
//       <Stack.Screen
//         name={ROUTES.FORGOT_PASSWORD_EMAIL}
//         component={ForgotPasswordEmailScreen}
//       />

//       <Stack.Screen
//         name={ROUTES.FORGOT_PASSWORD_OTP}
//         component={ForgotPasswordOtpScreen}
//       />
//     </Stack.Navigator>
//   );
// };

// export default AuthStack;







import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import SignupOtpScreen from '../screens/auth/SignupOtpScreen';
import ForgotPasswordEmailScreen from '../screens/auth/ForgotPasswordEmailScreen';
import ForgotPasswordOtpScreen from '../screens/auth/ForgotPasswordOtpScreen';
import TwoFactorScreen from '../screens/auth/TwoFactorScreen';

import { ROUTES } from './routes.constants';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      {/* LOGIN */}
      <Stack.Screen
        name={ROUTES.LOGIN}
        component={LoginScreen}
      />

      {/* 2FA VERIFICATION (NEW) */}
      <Stack.Screen
        name={ROUTES.TWO_FACTOR_VERIFY}
        component={TwoFactorScreen}
      />

      {/* SIGNUP */}
      <Stack.Screen
        name={ROUTES.SIGNUP}
        component={SignupScreen}
      />

      <Stack.Screen
        name={ROUTES.SIGNUP_OTP}
        component={SignupOtpScreen}
      />

      {/* FORGOT PASSWORD FLOW */}
      <Stack.Screen
        name={ROUTES.FORGOT_PASSWORD_EMAIL}
        component={ForgotPasswordEmailScreen}
      />

      <Stack.Screen
        name={ROUTES.FORGOT_PASSWORD_OTP}
        component={ForgotPasswordOtpScreen}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;