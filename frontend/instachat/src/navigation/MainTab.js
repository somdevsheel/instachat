import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/feed/HomeScreen';
import SearchScreen from '../screens/feed/SearchScreen';
import ReelsScreen from '../screens/reels/ReelsScreen';
import ChatListScreen from '../screens/messaging/ChatListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const getTabIcon = (routeName, focused) => {
  switch (routeName) {
    case 'HOME':
      return focused ? 'home' : 'home-outline';
    case 'SEARCH':
      return focused ? 'search' : 'search-outline';
    case 'REELS':
      return focused ? 'play-circle' : 'play-circle-outline';
    case 'MESSAGES':
      return focused ? 'chatbubble' : 'chatbubble-outline';
    case 'PROFILE':
      return focused ? 'person' : 'person-outline';
    default:
      return 'ellipse';
  }
};

const MainTab = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarIcon: ({ focused }) => (
          <Ionicons
            name={getTabIcon(route.name, focused)}
            size={26}
            color={focused ? '#fff' : '#888'}
          />
        ),
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="HOME" component={HomeScreen} />
      <Tab.Screen name="SEARCH" component={SearchScreen} />
      <Tab.Screen name="REELS" component={ReelsScreen} />
      <Tab.Screen name="MESSAGES" component={ChatListScreen} />
      <Tab.Screen name="PROFILE" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTab;