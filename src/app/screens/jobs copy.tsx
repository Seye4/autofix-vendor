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

import { acceptJobOffer, declineJobOffer, getJobOffers, JobOffer } from '@/api/vendor';

/*
 * ============================================
 * ERROR HELPER
 * ============================================
 */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred.';
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
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  /*
   * ==========================================
   * LOAD OFFERS
   * ==========================================
   */

  const loadOffers = useCallback(async (): Promise<void> => {
    try {
      const response = await getJobOffers();
      setOffers(response.offers || []);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      Alert.alert('Error', message || 'Unable to load jobs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * ==========================================
   * POLL & TICKING TIMER
   * ==========================================
   */

  useEffect(() => {
    loadOffers();

    // Re-fetch offers every 5 seconds
    const pollInterval = setInterval(loadOffers, 5000);

    // Update countdown timer every second
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
   * HANDLERS
   * ==========================================
   */

  const handleAccept = async (offer: JobOffer): Promise<void> => {
    setProcessingId(offer.id);

    try {
      await acceptJobOffer(offer.id);

      setOffers((current) => current.filter((item) => item.id !== offer.id));

      Alert.alert('Job Accepted', 'The job has been assigned to you.');
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      Alert.alert('Unable to Accept', message || 'This job may already have been accepted.');
      loadOffers();
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (offer: JobOffer): Promise<void> => {
    setProcessingId(offer.id);

    try {
      await declineJobOffer(offer.id);

      setOffers((current) => current.filter((item) => item.id !== offer.id));
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      Alert.alert('Unable to Decline', message || 'Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  /*
   * ==========================================
   * RENDER OFFER ITEM
   * ==========================================
   */

  const renderOffer = ({ item }: ListRenderItemInfo<JobOffer>): React.JSX.Element => {
    const processing = processingId === item.id;
    const secondsLeft = getRemainingSeconds(item.expires_at, currentTime);
    const isExpiringSoon = secondsLeft <= 10;

    return (
      <View style={styles.card}>
        {/* BADGE & BOOKING ID */}
        <View style={styles.cardHeader}>
          <View>
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>⚡ Service Offer</Text>
            </View>
            <Text style={styles.bookingNumber}>Booking #{item.booking_id}</Text>
          </View>

          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>📍 {Number(item.distance_km).toFixed(1)} km</Text>
          </View>
        </View>

        {/* TIMELINE */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineDotGroup}>
            <View style={[styles.dot, styles.dotPickup]} />
          </View>

          <View style={styles.timelineContent}>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>OFFER DETAILS</Text>
              <Text style={styles.locationAddress}>New request pending acceptance</Text>
            </View>
          </View>
        </View>

        {/* EARNINGS & TIMER FOOTER */}
        <View style={styles.earningsCard}>
          <View>
            <Text style={styles.earningsLabel}>Estimated Payout</Text>
            <Text style={styles.earningsValue}>${Number(item.estimated_earnings).toFixed(2)}</Text>
          </View>

          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>Expires in</Text>
            <Text style={[styles.timerValue, isExpiringSoon && styles.timerExpiring]}>
              ⏱️ {secondsLeft}s
            </Text>
          </View>
        </View>

        {/* ACTION BUTTONS */}
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
   * LOADING STATE
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

  /*
   * ==========================================
   * MAIN RENDER
   * ==========================================
   */

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Jobs</Text>
        <Text style={styles.subtitle}>Accept requests before the offer expires</Text>
      </View>

      <FlatList
        data={offers}
        keyExtractor={(item) => String(item.id)}
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
 * HELPER FUNCTIONS
 * ============================================
 */

function getRemainingSeconds(dateString: string, nowTimestamp: number): number {
  if (!dateString) return 0;
  const isoFormatted = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
  const date = new Date(isoFormatted);
  return Math.max(0, Math.floor((date.getTime() - nowTimestamp) / 1000));
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

  timelineContainer: {
    flexDirection: 'row',
    marginTop: 18,
  },

  timelineDotGroup: {
    alignItems: 'center',
    width: 16,
    paddingTop: 4,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  dotPickup: {
    backgroundColor: '#16A34A',
  },

  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },

  locationItem: {
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
