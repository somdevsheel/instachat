import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import HomeScreen from '../screens/feed/HomeScreen';
import SearchScreen from '../screens/feed/SearchScreen';
import ReelsScreen from '../screens/reels/ReelsScreen';
import ChatListScreen from '../screens/messaging/ChatListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

import { fetchUnreadCount } from '../redux/slices/chatSlice';

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
  const dispatch = useDispatch();
  
  // ✅ Get unread count from Redux
  const unreadCount = useSelector((state) => state.chat.unreadCount);

  // ✅ Fetch unread count when tab mounts
  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

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
        tabBarIcon: ({ focused }) => {
          const iconName = getTabIcon(route.name, focused);
          const iconColor = focused ? '#fff' : '#888';

          // ✅ Special handling for MESSAGES tab with badge
          if (route.name === 'MESSAGES') {
            return (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={iconName}
                  size={26}
                  color={iconColor}
                />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          }

          // Default icon for other tabs
          return (
            <Ionicons
              name={iconName}
              size={26}
              color={iconColor}
            />
          );
        },
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

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});