import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }

    if (!password) {
      Alert.alert('Password required', 'Please enter your password.');
      return;
    }

    try {
      setSubmitting(true);

      await login(email.trim(), password);

      router.replace('/(vendor)/');
    } catch (error: any) {
      Alert.alert('Login failed', error?.message || 'Unable to log in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#6B7280"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!submitting}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#6B7280"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!submitting}
        style={styles.input}
      />

      <Pressable
        onPress={handleLogin}
        disabled={submitting}
        style={[styles.button, submitting && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>{submitting ? 'Signing in...' : 'Sign In'}</Text>
      </Pressable>

      <Link href="/(auth)/register" style={styles.link}>
        Create an account
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 30,
    color: '#6B7280',
    fontSize: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,

    // Text color when the user types
    color: '#111827',

    // Explicit background prevents platform/theme differences
    backgroundColor: '#FFFFFF',

    marginBottom: 14,
  },

  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  link: {
    textAlign: 'center',
    marginTop: 20,
    color: '#2563EB',
    fontWeight: '600',
  },
});
