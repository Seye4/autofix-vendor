import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '@/store/appStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_VISIT_KEY = 'has_visited_vendor_dashboard';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const resetOnboarding = useAppStore((state) => state.resetOnboarding);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1. Remove the first visit key so the user is redirected again on next login
            await AsyncStorage.removeItem(FIRST_VISIT_KEY);

            // 2. Clear auth token / session storage
            await AsyncStorage.removeItem('userToken');

            if (resetOnboarding) {
              await resetOnboarding();
            }
            await logout();

            router.push('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* User Information Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role ? user.role.toUpperCase() : 'CUSTOMER'}</Text>
        </View>
      </View>

      {/* Profile Menu Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        {user?.phone ? (
          <View style={styles.menuItem}>
            <Text style={styles.menuItemLabel}>Phone Number</Text>
            <Text style={styles.menuItemValue}>{user.phone}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemLabel}>Edit Profile</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
          <Text style={styles.menuItemLabel}>Notifications</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    fontSize: 28,
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '600',
  },
  menuItemValue: {
    fontSize: 15,
    color: '#64748B',
  },
  chevron: {
    fontSize: 20,
    color: '#94A3B8',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 40,
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '800',
  },
});
