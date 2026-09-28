import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';

import {
  acceptJobOffer,
  declineJobOffer,
  getJobOffers,
  JobOffer,
  GetJobOffersResponse,
} from '@/api/vendor';
import { router } from 'expo-router';

/*
 * ============================================
 * TYPES & INTERFACES
 * ============================================
 */

/* export interface JobOffer {
  offer_id: string | number;
  service_type: 'ride' | 'mechanic' | 'tow' | string;
  booking_number: string | number;
  distance_km: number | string;
  pickup_address?: string;
  destination_address?: string;
  problem_description?: string;
  estimated_earnings: number | string;
  expires_at: string;
}

interface GetJobOffersResponse {
  offers?: JobOffer[];
} */

/*
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred.';
}

function formatService(type: string): string {
  const serviceMap: Record<string, string> = {
    ride: '🚗 Ride Request',
    mechanic: '🔧 Mechanic Request',
    tow: '🚛 Tow Request',
  };
  return serviceMap[type] || '⚡ Service Offer';
}

function getRemainingSeconds(dateString: string, nowTimestamp: number): number {
  if (!dateString) return 0;
  const isoFormatted = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
  const date = new Date(isoFormatted);
  return Math.max(0, Math.floor((date.getTime() - nowTimestamp) / 1000));
}

/*
 * ============================================
 * MAIN COMPONENT
 * ============================================
 */

export default function VendorJobsScreen(): React.JSX.Element {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  /*
   * ==========================================
   * LOAD OFFERS
   * ==========================================
   */

  const loadOffers = useCallback(async (): Promise<void> => {
    try {
      console.log('[VendorJobsScreen] Requesting job offers...');
      const response: GetJobOffersResponse = await getJobOffers();

      console.log(
        `[VendorJobsScreen] Received ${response.offers?.length ?? 0} offer(s):`,
        response.offers
      );

      setOffers(response.offers || []);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('[VendorJobsScreen] Error loading job offers:', message);
      Alert.alert('Error', message || 'Unable to load jobs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * ==========================================
   * TIMERS & POLLING
   * ==========================================
   */

  useEffect(() => {
    loadOffers();

    // Re-fetch offers every 5 seconds
    const pollInterval = setInterval(loadOffers, 5000);

    // Update live countdown timer every second
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [loadOffers]);

  /*
   * ==========================================
   * ACTION HANDLERS
   * ==========================================
   */

  const handleAccept = async (offer: JobOffer): Promise<void> => {
    setProcessingId(offer.offer_id);

    try {
      // Call acceptance endpoint
      const response = await acceptJobOffer(Number(offer.offer_id));

      // Remove accepted offer from current screen state
      setOffers((current) => current.filter((item) => item.offer_id !== offer.offer_id));

      // Use returned booking_id (or fallback to offer.booking_id) for navigation
      const targetBookingId = response.booking_id ?? offer.booking_number;

      Alert.alert('Job Accepted', 'The job has been assigned to you.', [
        {
          text: 'View Job Details',
          onPress: () => {
            if (targetBookingId) {
              router.push({
                pathname: '/screens/trip-tracking', // Adjust route to your active job screen path
                params: { id: String(targetBookingId) },
              });
            }
          },
        },
      ]);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      Alert.alert('Unable to Accept', message || 'This job may already have been accepted.');
      loadOffers();
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (offer: JobOffer): Promise<void> => {
    setProcessingId(offer.offer_id);

    try {
      await declineJobOffer(Number(offer.offer_id));
      setOffers((current) => current.filter((item) => item.offer_id !== offer.offer_id));
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      Alert.alert('Unable to Decline', message || 'Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  /*
   * ==========================================
   * RENDER ITEM
   * ==========================================
   */

  const renderOffer = ({ item }: ListRenderItemInfo<JobOffer>): React.JSX.Element => {
    const processing = processingId === item.offer_id;
    const secondsLeft = getRemainingSeconds(item.expires_at, currentTime);
    const isExpiringSoon = secondsLeft <= 10;

    return (
      <View style={styles.card}>
        {/* HEADER */}
        <View style={styles.cardHeader}>
          <View>
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>{formatService(item.service_type)}</Text>
            </View>
            <Text style={styles.bookingNumber}>Booking #{item.booking_number}</Text>
          </View>

          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>📍 {Number(item.distance_km).toFixed(1)} km</Text>
          </View>
        </View>

        {/* LOCATION & PROBLEM DETAILS */}
        <View style={styles.detailsContainer}>
          <View style={styles.locationBox}>
            <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
            <Text style={styles.locationAddress}>{item.pickup_address || 'Customer location'}</Text>
          </View>

          {item.destination_address && (
            <View style={styles.locationBox}>
              <Text style={styles.locationLabel}>DESTINATION</Text>
              <Text style={styles.locationAddress}>{item.destination_address}</Text>
            </View>
          )}

          {item.problem_description && (
            <View style={styles.problemBox}>
              <Text style={styles.problemLabel}>PROBLEM DESCRIPTION</Text>
              <Text style={styles.problemText}>{item.problem_description}</Text>
            </View>
          )}
        </View>

        {/* EARNINGS & LIVE COUNTDOWN */}
        <View style={styles.earningsCard}>
          <View>
            <Text style={styles.earningsLabel}>Estimated Payout</Text>
            <Text style={styles.earningsValue}>₦{Number(item.estimated_earnings).toFixed(2)}</Text>
          </View>

          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>Expires in</Text>
            <Text style={[styles.timerValue, isExpiringSoon && styles.timerExpiring]}>
              ⏱️ {secondsLeft}s
            </Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.declineButton, processing && styles.disabled]}
            disabled={processing}
            onPress={() => handleDecline(item)}
            activeOpacity={0.7}>
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, processing && styles.disabled]}
            disabled={processing}
            onPress={() => handleAccept(item)}
            activeOpacity={0.8}>
            {processing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.acceptText}>Accept Job</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /*
   * ==========================================
   * RENDER STATES
   * ==========================================
   */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Searching for incoming requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Jobs</Text>
        <Text style={styles.subtitle}>Accept requests before the offer expires</Text>
      </View>

      <FlatList
        data={offers}
        keyExtractor={(item) => String(item.offer_id)}
        renderItem={renderOffer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOffers();
            }}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={
          offers.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>🔎</Text>
            </View>
            <Text style={styles.emptyTitle}>No Jobs Available</Text>
            <Text style={styles.emptyText}>
              We'll automatically display new service requests here as soon as customers request
              assistance nearby.
            </Text>
          </View>
        }
      />
    </View>
  );
}

/*
 * ============================================
 * STYLES
 * ============================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#64748B',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  serviceBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  bookingNumber: {
    marginTop: 6,
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  distanceBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  distanceText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  detailsContainer: {
    marginTop: 14,
    gap: 12,
  },
  locationBox: {
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  locationAddress: {
    marginTop: 2,
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  problemBox: {
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
    letterSpacing: 0.5,
  },
  problemText: {
    marginTop: 2,
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  earningsCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  earningsValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '800',
    color: '#4ADE80',
  },
  timerBox: {
    alignItems: 'flex-end',
  },
  timerLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
  timerValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timerExpiring: {
    color: '#F87171',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  declineText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    color: '#64748B',
    fontSize: 13,
  },
});
