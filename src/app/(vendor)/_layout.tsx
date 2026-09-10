import React, { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '../../store/authStore';
import { registerForPushNotifications } from '../../services/notifications';

export default function ProtectedLayout(): React.JSX.Element {
  const token = useAuthStore((state) => state.token);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!token) return;

    registerForPushNotifications(token).catch(console.error);
  }, [token]);

  // Calculate dynamic bottom padding so icons sit safely above Android buttons
  const bottomInset = insets.bottom > 0 ? insets.bottom : 12;
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: bottomInset,
          },
        ],
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
          ) : undefined,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#FFFFFF',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
