import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen(): React.JSX.Element {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister(): Promise<void> {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords are the same.');
      return;
    }

    try {
      setSubmitting(true);

      await register(name.trim(), email.trim(), password, phone.trim() || undefined);

      router.replace('/(auth)/vendor_application');
    } catch (error: any) {
      Alert.alert('Registration failed', error?.message || 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started with your profile.</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Full Name Input */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              placeholder="John Doe"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              placeholder="name@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {/* Phone Input */}
          <Text style={styles.label}>Phone Number (Optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              placeholder="(555) 000-0000"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          {/* Password Input */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#6B7280"
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="At least 8 characters"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#6B7280"
              />
            </Pressable>
          </View>

          {/* Confirm Password Input */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#6B7280"
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Re-enter password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}>
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#6B7280"
              />
            </Pressable>
          </View>

          {/* Primary Action Button */}
          <Pressable onPress={handleRegister} disabled={submitting} style={styles.button}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={styles.linkText}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 60,
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    height: '100%',
  },
  eyeIcon: {
    padding: 6,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },

  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
  },
});
