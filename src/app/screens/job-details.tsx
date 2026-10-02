import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  getJobDetails,
  updateJobStatus,
  BookingProgress,
  BookingEvent,
  JobStatus,
} from '@/api/vendor';

/*
|--------------------------------------------------------------------------
| HELPERS & FORMATTERS
|--------------------------------------------------------------------------
*/

function formatService(type: string = ''): string {
  const serviceMap: Record<string, string> = {
    ride: '🚗 Ride Request',
    mechanic: '🔧 Mechanic Request',
    tow: '🚛 Tow Request',
  };
  return serviceMap[type.toLowerCase()] || `⚡ ${type.toUpperCase() || 'Service Request'}`;
}

function getStatusBadgeStyle(status: string = '') {
  switch (status.toLowerCase()) {
    case 'accepted':
    case 'vendor_assigned':
      return { bg: '#DBEAFE', text: '#2563EB', label: 'ACCEPTED' };
    case 'arriving':
      return { bg: '#FEF3C7', text: '#D97706', label: 'ARRIVING' };
    case 'arrived':
      return { bg: '#E0E7FF', text: '#4F46E5', label: 'ARRIVED' };
    case 'in_progress':
      return { bg: '#FEF08A', text: '#CA8A04', label: 'IN PROGRESS' };
    case 'completed':
      return { bg: '#DCFCE7', text: '#15803D', label: 'COMPLETED' };
    case 'cancelled':
    case 'rejected':
      return { bg: '#FEE2E2', text: '#DC2626', label: status.toUpperCase() };
    default:
      return { bg: '#F1F5F9', text: '#475569', label: status.toUpperCase() };
  }
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  const isoFormatted = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
  const d = new Date(isoFormatted);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

export default function JobDetailsScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    bookingId?: string;
    booking_id?: string;
  }>();

  // Accept booking ID from route parameters
  const bookingId = params.id || params.bookingId || params.booking_id;

  const [booking, setBooking] = useState<BookingProgress | null>(null);
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  /*
  |--------------------------------------------------------------------------
  | FETCH JOB DETAILS
  |--------------------------------------------------------------------------
  */
  const fetchDetails = useCallback(async () => {
    if (!bookingId) {
      Alert.alert('Error', 'Missing booking ID');
      router.back();
      return;
    }

    try {
      const response = await getJobDetails(Number(bookingId));

      // Support both structure responses
      const jobData = response?.data?.booking ?? (response as any)?.booking;
      const eventData = response?.data?.events ?? (response as any)?.events ?? [];

      if (jobData) {
        setBooking(jobData);
        setEvents(eventData);
      } else {
        Alert.alert('Error', 'Failed to retrieve job details.');
      }
    } catch (error: any) {
      console.error('[JobDetailsScreen] Error loading job details:', error);
      Alert.alert('Error', error.message || 'Unable to fetch job details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    fetchDetails();

    // Auto-poll job details every 10 seconds for real-time status updates
    const pollInterval = setInterval(() => {
      fetchDetails();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [fetchDetails]);

  /*
  |--------------------------------------------------------------------------
  | STATUS TRANSITION HANDLER
  |--------------------------------------------------------------------------
  */
  const handleStatusChange = async (
    nextStatus: Extract<
      JobStatus,
      'arriving' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'
    >,
    actionLabel: string
  ) => {
    if (!booking) return;

    Alert.alert('Confirm Action', `Are you sure you want to mark this job as "${actionLabel}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setUpdatingStatus(true);
          try {
            await updateJobStatus(booking.id, nextStatus);
            Alert.alert('Success', `Job status updated to ${actionLabel}`);
            await fetchDetails();
          } catch (error: any) {
            Alert.alert('Update Failed', error.message || 'Unable to update job status.');
          } finally {
            setUpdatingStatus(false);
          }
        },
      },
    ]);
  };

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER CALL HANDLER
  |--------------------------------------------------------------------------
  */
  const handleCallCustomer = () => {
    if (!booking?.customer_phone) {
      Alert.alert('Unavailable', 'No phone number provided for this customer.');
      return;
    }
    const telUrl = `tel:${booking.customer_phone}`;
    Linking.canOpenURL(telUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(telUrl);
        } else {
          Alert.alert('Error', 'Phone call dialer is not supported on this device.');
        }
      })
      .catch((err) => console.error(err));
  };

  /*
  |--------------------------------------------------------------------------
  | ACTION BUTTON RENDERER
  |--------------------------------------------------------------------------
  */
  const renderActionButtons = () => {
    if (!booking) return null;

    const currentStatus = booking.status;

    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      return (
        <View style={styles.completedBox}>
          <Text style={styles.completedText}>This job is {currentStatus.toUpperCase()}</Text>
        </View>
      );
    }

    return (
      <View style={styles.actionsContainer}>
        {(currentStatus === 'accepted' || currentStatus === 'vendor_assigned') && (
          <TouchableOpacity
            style={[styles.primaryButton, updatingStatus && styles.disabled]}
            disabled={updatingStatus}
            onPress={() => handleStatusChange('arriving', 'On The Way')}>
            {updatingStatus ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>On My Way to Location</Text>
            )}
          </TouchableOpacity>
        )}

        {currentStatus === 'arriving' && (
          <TouchableOpacity
            style={[styles.primaryButton, updatingStatus && styles.disabled]}
            disabled={updatingStatus}
            onPress={() => handleStatusChange('arrived', 'Arrived')}>
            {updatingStatus ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>I Have Arrived</Text>
            )}
          </TouchableOpacity>
        )}

        {currentStatus === 'arrived' && (
          <TouchableOpacity
            style={[styles.primaryButton, updatingStatus && styles.disabled]}
            disabled={updatingStatus}
            onPress={() => handleStatusChange('in_progress', 'In Progress')}>
            {updatingStatus ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Start Service</Text>
            )}
          </TouchableOpacity>
        )}

        {currentStatus === 'in_progress' && (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: '#16A34A' },
              updatingStatus && styles.disabled,
            ]}
            disabled={updatingStatus}
            onPress={() => handleStatusChange('completed', 'Completed')}>
            {updatingStatus ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Complete Job</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | UI RENDER
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Job Details...</Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Job details could not be found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const badgeStyle = getStatusBadgeStyle(booking.status);
  const priceDisplay = booking.final_price || booking.estimated_price || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job #{booking.booking_number}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDetails();
            }}
            tintColor="#2563EB"
          />
        }>
        {/* STATUS & PRICE BANNER */}
        <View style={styles.topBanner}>
          <View>
            <Text style={styles.serviceText}>{formatService(booking.service_type)}</Text>
            <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{badgeStyle.label}</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Earnings</Text>
            <Text style={styles.priceValue}>₦{Number(priceDisplay).toFixed(2)}</Text>
          </View>
        </View>

        {/* CUSTOMER CONTACT CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CUSTOMER DETAILS</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(booking.customer_name || 'C').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{booking.customer_name || 'Customer'}</Text>
              <Text style={styles.customerPhone}>
                {booking.customer_phone || 'No phone number'}
              </Text>
            </View>
            {booking.customer_phone ? (
              <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
                <Text style={styles.callButtonText}>📞 Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* LOCATION DETAILS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>JOB LOCATION</Text>

          <View style={styles.locationSection}>
            <Text style={styles.locationLabel}>PICKUP</Text>
            <Text style={styles.locationText}>{booking.pickup_address || 'N/A'}</Text>
          </View>

          {booking.destination_address && (
            <View style={[styles.locationSection, { marginTop: 12 }]}>
              <Text style={styles.locationLabel}>DESTINATION</Text>
              <Text style={styles.locationText}>{booking.destination_address}</Text>
            </View>
          )}

          {booking.problem_description && (
            <View style={styles.problemBox}>
              <Text style={styles.problemLabel}>PROBLEM DESCRIPTION</Text>
              <Text style={styles.problemText}>{booking.problem_description}</Text>
            </View>
          )}
        </View>

        {/* TIMELINE / EVENTS */}
        {events.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ACTIVITY LOG</Text>
            {events.map((event, index) => (
              <View key={event.id || index} style={styles.eventRow}>
                <View style={styles.eventDot} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventText}>{event.description || event.event_type}</Text>
                  <Text style={styles.eventTime}>{formatDate(event.created_at)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>{renderActionButtons()}</View>
    </SafeAreaView>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    paddingVertical: 4,
  },
  headerBackText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  topBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  serviceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  customerPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  callButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callButtonText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  locationSection: {
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  problemBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  problemLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  problemText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
    lineHeight: 18,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 5,
    marginRight: 10,
  },
  eventContent: {
    flex: 1,
  },
  eventText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  eventTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionsContainer: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  completedBox: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  disabled: {
    opacity: 0.6,
  },
});
