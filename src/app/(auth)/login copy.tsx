import { useState } from 'react';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { router } from 'expo-router';

import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing information', 'Enter your email and password.');

      return;
    }

    try {
      setLoading(true);

      await login(email, password);

      router.replace('/(protected)/home');
    } catch (error: any) {
      Alert.alert('Login failed', error.message ?? 'Unable to login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>

      <Text style={styles.subtitle}>Sign in to RoadAssist</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.register}>
          Don't have an account?{' '}
          <Text
            style={{
              fontWeight: '800',
            }}>
            Register
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 35,
    color: '#6B7280',
    fontSize: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    fontSize: 16,
  },

  button: {
    backgroundColor: '#16A34A',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  register: {
    textAlign: 'center',
    marginTop: 25,
    color: '#4B5563',
  },
});
