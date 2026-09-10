import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';

import { useCallback, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

type Job = {
  id: number;

  booking_number: string;

  service_type: string;

  status: string;

  problem_description?: string;

  pickup_address?: string;

  pickup_latitude?: string;

  pickup_longitude?: string;

  customer_name?: string;
};

export default function VendorHome() {
  const token = useAuthStore((state) => state.token);

  const [jobs, setJobs] = useState<Job[]>([]);

  const [loading, setLoading] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get('', {
        params: {
          path: 'vendor/jobs',
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setJobs(response.data.jobs);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message ?? 'Unable to load jobs');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs])
  );

  async function acceptJob(jobId: number) {
    try {
      const response = await api.post(
        '',
        {},
        {
          params: {
            path: `vendor/jobs/${jobId}/accept`,
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      Alert.alert('Job accepted', 'This job has been assigned to you.');

      loadJobs();
    } catch (error: any) {
      Alert.alert(
        'Unable to accept',
        error.response?.data?.message ?? error.message ?? 'The job may have already been accepted.'
      );
    }
  }

  function renderJob({ item }: { item: Job }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/(vendor)/job/[id]',
            params: {
              id: String(item.id),
            },
          })
        }>
        <View style={styles.cardHeader}>
          <Text style={styles.service}>{item.service_type.toUpperCase()}</Text>

          <Text style={styles.status}>{item.status}</Text>
        </View>

        <Text style={styles.bookingNumber}>{item.booking_number}</Text>

        {item.customer_name && <Text style={styles.customer}>Customer: {item.customer_name}</Text>}

        {item.pickup_address && <Text style={styles.address}>📍 {item.pickup_address}</Text>}

        {item.problem_description && (
          <Text style={styles.problem} numberOfLines={3}>
            {item.problem_description}
          </Text>
        )}

        <TouchableOpacity style={styles.acceptButton} onPress={() => acceptJob(item.id)}>
          <Text style={styles.acceptText}>Accept Job</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Vendor Dashboard</Text>

          <Text style={styles.subtitle}>Available service requests</Text>
        </View>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderJob}
        refreshing={loading}
        onRefresh={loadJobs}
        contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View>
            <Text style={styles.emptyTitle}>No jobs available</Text>

            <Text style={styles.emptyText}>New service requests will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    paddingTop: 65,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },

  greeting: {
    fontSize: 27,
    fontWeight: '900',
    color: '#111827',
  },

  subtitle: {
    marginTop: 5,
    color: '#6B7280',
  },

  list: {
    padding: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  service: {
    fontWeight: '900',
    color: '#16A34A',
  },

  status: {
    fontWeight: '700',
    color: '#6B7280',
  },

  bookingNumber: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
  },

  customer: {
    marginTop: 10,
    fontWeight: '700',
  },

  address: {
    marginTop: 8,
    color: '#374151',
  },

  problem: {
    marginTop: 12,
    color: '#4B5563',
    lineHeight: 20,
  },

  acceptButton: {
    marginTop: 15,
    backgroundColor: '#16A34A',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  acceptText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  emptyTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#6B7280',
  },
});
