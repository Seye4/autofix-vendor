import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getProfile, updateProfile, Profile } from '@/api/profile';
import ProfilePicture from '@/components/ProfilePicture';

export default function ProfileScreen() {
  const { user, token, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 1. Log what AuthContext initially provides
    console.log('[ProfileScreen] Auth Context User Image:', user?.profile_image_url);

    if (token && user) {
      loadProfile();
    }
  }, [token, user]);

  async function loadProfile() {
    try {
      if (!token) return;
      const response = await getProfile(token);

      // 2. Log full API payload & specific image field from backend endpoint
      console.log('[ProfileScreen] Fetched Profile Data:', response.data);
      console.log('[ProfileScreen] Backend Image URL:', response.data.profile_image_url);

      setProfile(response.data);
      setName(response.data.name);
      setPhone(response.data.phone || '');
    } catch (error: any) {
      console.error('[ProfileScreen] Error fetching profile:', error);
      Alert.alert('Error', error.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!token) {
      Alert.alert('Error', 'Authentication token missing.');
      return;
    }

    try {
      setSaving(true);
      await updateProfile(token, { name, phone });
      Alert.alert('Success', 'Profile updated successfully.');
      await refreshUser?.();
      await loadProfile();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading || !profile || !token) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  // Determine actual image source passed to component
  const activeImageUrl = profile?.profile_image_url || user?.profile_image_url;
  console.log('[ProfileScreen] Rendering ProfilePicture with URL:', activeImageUrl);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonTouch}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* User Avatar Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <ProfilePicture
            token={token}
            imageUrl={activeImageUrl}
            onUploaded={() => {
              console.log('[ProfileScreen] Image uploaded successfully, refreshing...');
              refreshUser?.();
              loadProfile();
            }}
          />
        </View>
        <Text style={styles.userName}>{profile.name}</Text>
        <Text style={styles.userEmail}>{profile.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role ? user.role.toUpperCase() : 'CUSTOMER'}</Text>
        </View>
      </View>

      {/* Editable Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Edit Personal Details</Text>

        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter full name"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={profile.email}
          editable={false}
        />

        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Enter phone number"
          placeholderTextColor="#94A3B8"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Navigation Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
          <Text style={styles.menuItemLabel}>Notifications</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Action */}
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
  scrollContent: {
    paddingBottom: 110,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backButtonTouch: {
    padding: 4,
  },
  backButton: {
    fontSize: 24,
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
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
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
    paddingVertical: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 8,
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemLabel: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: '#94A3B8',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});
