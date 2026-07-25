import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import HomeScreen from '../screens/feed/HomeScreen';
import SearchScreen from '../screens/feed/SearchScreen';
import ChatListScreen from '../screens/messaging/ChatListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddContentSheet from '../components/bottomsheet/AddContentSheet';

import { fetchUnreadCount } from '../redux/slices/chatSlice';
import { ROUTES } from './routes.constants';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();

const getTabIcon = (routeName, focused) => {
  switch (routeName) {
    case 'HOME':
      return focused ? 'home' : 'home-outline';
    case 'SEARCH':
      return focused ? 'search' : 'search-outline';
    case 'MESSAGES':
      return focused ? 'chatbubble' : 'chatbubble-outline';
    case 'PROFILE':
      return focused ? 'person' : 'person-outline';
    default:
      return 'ellipse';
  }
};

const getTabLabel = (routeName) => {
  switch (routeName) {
    case 'HOME':
      return 'Home';
    case 'SEARCH':
      return 'Search';
    case 'MESSAGES':
      return 'Inbox';
    case 'PROFILE':
      return 'Profile';
    default:
      return '';
  }
};

// Never actually rendered — the CREATE tab's button is fully overridden
// below to open a sheet instead of navigating to a screen.
const EmptyScreen = () => null;

const MainTab = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const unreadCount = useSelector((state) => state.chat.unreadCount);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const closeSheet = () => setCreateSheetVisible(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabel: getTabLabel(route.name),
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: -2,
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 62 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarItemStyle: {
            paddingTop: 6,
          },
          tabBarIcon: ({ focused }) => {
            const iconName = getTabIcon(route.name, focused);
            const iconColor = focused ? colors.accent : colors.textSecondary;

            if (route.name === 'MESSAGES') {
              return (
                <View style={styles.iconContainer}>
                  <Ionicons name={iconName} size={26} color={iconColor} />
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

            return <Ionicons name={iconName} size={26} color={iconColor} />;
          },
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen name="HOME" component={HomeScreen} />
        <Tab.Screen name="SEARCH" component={SearchScreen} />
        <Tab.Screen
          name="CREATE"
          component={EmptyScreen}
          options={{
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                onPress={() => setCreateSheetVisible(true)}
                style={styles.createButtonWrap}
              >
                <View style={styles.createButton}>
                  <Ionicons name="add" size={26} color="#fff" />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen name="MESSAGES" component={ChatListScreen} />
        <Tab.Screen name="PROFILE" component={ProfileScreen} />
      </Tab.Navigator>

      <AddContentSheet
        visible={createSheetVisible}
        onClose={closeSheet}
        onPost={() => {
          closeSheet();
          navigation.navigate(ROUTES.CREATE_POST);
        }}
        onReel={() => {
          closeSheet();
          navigation.navigate(ROUTES.UPLOAD_REEL);
        }}
        onStory={() => {
          closeSheet();
          navigation.navigate(ROUTES.CREATE_STORY);
        }}
      />
    </>
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
    backgroundColor: colors.accentPink,
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
  createButtonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
