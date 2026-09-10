import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useState } from 'react';

import { router } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

type VendorType = 'driver' | 'mechanic' | 'tow' | 'multi_service';

export default function VendorRegisterScreen() {
  const token = useAuthStore((state) => state.token);

  const [businessName, setBusinessName] = useState('');

  const [vendorType, setVendorType] = useState<VendorType>('mechanic');

  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);

      const response = await api.post(
        '',
        {
          business_name: businessName,

          vendor_type: vendorType,
        },
        {
          params: {
            path: 'vendor/register',
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Application submitted', 'Your vendor account is awaiting verification.');

        router.replace('/vendor/dashboard');
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message ?? 'Unable to register.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Become a Service Provider</Text>

      <Text style={styles.subtitle}>Choose the services you provide.</Text>

      <Text style={styles.label}>Business / Display Name</Text>

      <TextInput
        value={businessName}
        onChangeText={setBusinessName}
        placeholder="Example: John's Auto Repair"
        style={styles.input}
      />

      <Text style={styles.label}>Service Type</Text>

      <View style={styles.types}>
        {[
          ['driver', '🚗 Driver'],
          ['mechanic', '🔧 Mechanic'],
          ['tow', '🪝 Tow'],
          ['multi_service', '🛠️ Multiple'],
        ].map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[styles.typeButton, vendorType === value && styles.typeButtonActive]}
            onPress={() => setVendorType(value as VendorType)}>
            <Text style={[styles.typeText, vendorType === value && styles.typeTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Submit Application</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    paddingTop: 70,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 30,
    color: '#6B7280',
  },

  label: {
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 15,
  },

  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  typeButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },

  typeButtonActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },

  typeText: {
    fontWeight: '700',
    color: '#374151',
  },

  typeTextActive: {
    color: '#FFFFFF',
  },

  button: {
    backgroundColor: '#16A34A',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});
