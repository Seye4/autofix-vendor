import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';

import { useEffect, useState } from 'react';

import { router } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

export default function VendorDashboard() {
  const token = useAuthStore((state) => state.token);

  const [online, setOnline] = useState(false);

  const [verified, setVerified] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await api.get('', {
        params: {
          path: 'vendor/profile',
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const vendor = response.data.vendor;

      setOnline(Boolean(vendor.is_available));

      setVerified(Boolean(vendor.is_verified));
    } catch {
      Alert.alert('Error', 'Unable to load vendor profile.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleOnline(value: boolean) {
    if (!verified) {
      Alert.alert(
        'Verification required',
        'Your vendor account must be verified before you can go online.'
      );

      return;
    }

    try {
      await api.post(
        '',
        {
          is_available: value,
        },
        {
          params: {
            path: 'vendor/availability',
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOnline(value);
    } catch {
      Alert.alert('Error', 'Unable to change availability.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Dashboard</Text>

      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusTitle}>{online ? "You're Online" : "You're Offline"}</Text>

          <Text style={styles.statusText}>
            {online ? 'You can receive service requests.' : "You won't receive new requests."}
          </Text>
        </View>

        <Switch value={online} onValueChange={toggleOnline} />
      </View>

      {!verified && (
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Verification pending</Text>

          <Text style={styles.warningText}>
            An administrator must verify your vendor account before you can accept jobs.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}

        onPress={() => router.push('/vendor/bookings')}>
        <Text style={styles.buttonText}>Service Requests</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    paddingTop: 65,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 25,
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusTitle: {
    fontSize: 18,
    fontWeight: '900',
  },

  statusText: {
    color: '#6B7280',
    marginTop: 5,
  },

  warning: {
    backgroundColor: '#FEF3C7',
    padding: 17,
    borderRadius: 14,
    marginTop: 15,
  },

  warningTitle: {
    fontWeight: '900',
    color: '#92400E',
  },

  warningText: {
    color: '#92400E',
    marginTop: 5,
    lineHeight: 20,
  },

  button: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    padding: 17,
    alignItems: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});
