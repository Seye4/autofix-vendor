import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { getBooking, cancelBooking } from '../../../api/bookings';

// Type definition merged from [id].tsx
type Booking = {
  id: number;
  booking_number: string;
  service_type: string;
  status: string;
  pickup_address: string;
  destination_address?: string;
  estimated_price?: number;
  final_price?: number;
  business_name?: string;
  vendor_type?: string;
  vendor_rating?: number;
  vendor_id?: number; // Kept for the conditional navigation buttons
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Request submitted',
  searching: 'Finding a provider',
  accepted: 'Provider accepted',
  en_route: 'Provider is on the way',
  arrived: 'Provider has arrived',
  in_progress: 'Service in progress',
  completed: 'Service completed',
  cancelled: 'Booking cancelled',
};

const STEPS = [
  'pending',
  'searching',
  'accepted',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
];

export default function BookingProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();

    /*
     * Poll while booking is active.
     * Later we'll replace this with push updates/WebSockets.
     */
    const interval = setInterval(loadBooking, 5000);
    return () => clearInterval(interval);
  }, [id]);

  async function loadBooking() {
    try {
      const response = await getBooking(Number(id), token!);
      if (response.success) {
        setBooking(response.booking);
      }
    } catch {
      // Ignore temporary errors.
    } finally {
      setLoading(false);
    }
  }

  async function cancel() {
    Alert.alert('Cancel booking?', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(Number(id), 'Cancelled by customer', token!);
            loadBooking();
          } catch (error: any) {
            Alert.alert('Unable to cancel', error.response?.data?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  }

  if (loading && !booking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading booking...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Booking not found.</Text>
      </View>
    );
  }

  const currentIndex = STEPS.indexOf(booking.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Service Progress</Text>
      <Text style={styles.bookingNumber}>#{booking.booking_number}</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>{STATUS_LABELS[booking.status] ?? booking.status}</Text>
        <Text style={styles.service}>{booking.service_type}</Text>
      </View>

      <View style={styles.timeline}>
        {STEPS.map((step, index) => {
          const completed = index <= currentIndex;
          return (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.circle, completed && styles.completedCircle]}>
                <Text style={styles.circleText}>{completed ? '✓' : index + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepText, completed && styles.completedText]}>
                  {STATUS_LABELS[step]}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {booking.vendor_id && (
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() =>
            router.push({
              pathname: '/services/[id]/tracking',
              params: { id: String(id) },
            })
          }>
          <Text style={styles.trackText}>📍 Track Provider</Text>
        </TouchableOpacity>
      )}

      {booking.vendor_id && (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() =>
            router.push({
              pathname: '/services/[id]/chat',
              params: { id: String(id) },
            })
          }>
          <Text style={styles.chatText}>💬 Chat with Provider</Text>
        </TouchableOpacity>
      )}

      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
        <TouchableOpacity style={styles.cancelButton} onPress={cancel}>
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}

      {booking.status === 'completed' && (
        <TouchableOpacity
          style={styles.rateButton}
          onPress={() =>
            router.push({
              pathname: '/services/[id]/rate',
              params: { id: String(id) },
            })
          }>
          <Text style={styles.rateText}>⭐ Rate Service</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  bookingNumber: {
    marginTop: 5,
    color: '#6B7280',
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  statusLabel: {
    fontSize: 19,
    fontWeight: '900',
    color: '#166534',
  },
  service: {
    marginTop: 8,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  timeline: {
    marginTop: 25,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 55,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCircle: {
    backgroundColor: '#16A34A',
  },
  circleText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  stepContent: {
    marginLeft: 14,
  },
  stepText: {
    color: '#9CA3AF',
    fontWeight: '700',
    marginTop: 5,
  },
  completedText: {
    color: '#166534',
  },
  trackButton: {
    marginTop: 15,
    backgroundColor: '#16A34A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  chatButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#16A34A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatText: {
    color: '#16A34A',
    fontWeight: '900',
  },
  cancelButton: {
    marginTop: 25,
    padding: 15,
    alignItems: 'center',
  },
  cancelText: {
    color: '#DC2626',
    fontWeight: '800',
  },
  rateButton: {
    marginTop: 15,
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rateText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
