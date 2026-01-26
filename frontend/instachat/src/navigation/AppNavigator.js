import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '../redux/slices/authSlice';

import AuthStack from './AuthStack';
import MainTab from './MainTab';
import { ROUTES } from './routes.constants';

/* =========================
   PROFILE SCREENS
========================= */
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ProfileSettingsScreen from '../screens/profile/ProfileSettingsScreen';
import AccountSettingsScreen from '../screens/profile/AccountSettingsScreen';
import PrivacySettingsScreen from '../screens/profile/PrivacySettingsScreen';
import SecuritySettingsScreen from '../screens/profile/SecuritySettingsScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import FollowListScreen from '../screens/profile/FollowListScreen';
import FollowersListScreen from '../screens/profile/FollowersListScreen';
import FollowingListScreen from '../screens/profile/FollowingListScreen';

/* =========================
   CONTENT CREATION
========================= */
import CreatePostScreen from '../screens/post/CreatePostScreen';
import PostDetailScreen from '../screens/post/PostDetailScreen';
import UploadScreen from '../screens/reels/UploadScreen';
import CreateStoryScreen from '../screens/feed/CreateStoryScreen';

/* =========================
   STORY
========================= */
import StoryViewer from '../components/story/StoryViewer';

/* =========================
   MESSAGING
========================= */
import ChatListScreen from '../screens/messaging/ChatListScreen';
import ChatDetailScreen from '../screens/messaging/ChatDetailScreen';
import NewChatScreen from '../screens/messaging/NewChatScreen';

/* =========================
   COMMENTS
========================= */
import CommentsScreen from '../screens/comments/CommentsScreen';

/* =========================
   NOTIFICATIONS
========================= */
import NotificationScreen from '../screens/NotificationScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector(state => state.auth);

  /* =========================
     LOAD USER ON APP START
  ========================= */
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name={ROUTES.MAIN_TAB}
              component={MainTab}
            />

            <Stack.Screen
              name={ROUTES.NOTIFICATIONS}
              component={NotificationScreen}
            />

            <Stack.Screen
              name={ROUTES.CHAT_LIST}
              component={ChatListScreen}
            />
            <Stack.Screen
              name={ROUTES.CHAT_DETAIL}
              component={ChatDetailScreen}
            />
            <Stack.Screen
              name={ROUTES.NEW_CHAT}
              component={NewChatScreen}
            />

            <Stack.Screen
              name={ROUTES.CREATE_POST}
              component={CreatePostScreen}
            />
            <Stack.Screen
              name={ROUTES.POST_DETAIL}
              component={PostDetailScreen}
            />
            <Stack.Screen
              name={ROUTES.UPLOAD_REEL}
              component={UploadScreen}
            />
            <Stack.Screen
              name={ROUTES.CREATE_STORY}
              component={CreateStoryScreen}
            />

            <Stack.Screen
              name={ROUTES.COMMENTS}
              component={CommentsScreen}
              options={{ headerShown: true }}
            />

            <Stack.Screen
              name="STORY_VIEWER"
              component={StoryViewer}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name={ROUTES.USER_PROFILE}
              component={UserProfileScreen}
            />
            <Stack.Screen
              name={ROUTES.EDIT_PROFILE}
              component={EditProfileScreen}
            />
            <Stack.Screen
              name={ROUTES.PROFILE_SETTINGS}
              component={ProfileSettingsScreen}
            />
            <Stack.Screen
              name={ROUTES.ACCOUNT_SETTINGS}
              component={AccountSettingsScreen}
            />
            <Stack.Screen
              name={ROUTES.PRIVACY_SETTINGS}
              component={PrivacySettingsScreen}
            />
            <Stack.Screen
              name={ROUTES.SECURITY_SETTINGS}
              component={SecuritySettingsScreen}
            />
            <Stack.Screen
              name={ROUTES.CHANGE_PASSWORD}
              component={ChangePasswordScreen}
            />

            <Stack.Screen
              name={ROUTES.FOLLOW_LIST}
              component={FollowListScreen}
            />
            <Stack.Screen
              name="FOLLOWERS_LIST"
              component={FollowersListScreen}
            />
            <Stack.Screen
              name="FOLLOWING_LIST"
              component={FollowingListScreen}
            />
          </>
        ) : (
          <Stack.Screen
            name="AUTH"
            component={AuthStack}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}