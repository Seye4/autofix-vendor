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
  SafeAreaView,
  StatusBar,
} from 'react-native';

import { router } from 'expo-router';

import { acceptJobOffer, declineJobOffer, getJobOffers, getAllJobs } from '@/api/vendor';

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type JobStatus =
  'offered' | 'accepted' | 'completed' | 'rejected' | 'declined' | 'expired' | 'pending' | string;

type StatusFilter = 'OFFERED' | 'ALL';

export interface NormalizedJob {
  id: string | number;

  booking_id?: string | number;

  booking_number: string | number;

  service_type: string;

  assignment_status: JobStatus;

  pickup_address: string;

  destination_address?: string | null;

  problem_description?: string | null;

  price: number;

  distance_km?: number | string | null;

  expires_at?: string | null;

  created_at?: string | null;

  responded_at?: string | null;
}

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
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
|--------------------------------------------------------------------------
| SERVICE FORMATTER
|--------------------------------------------------------------------------
*/

function formatService(type: string): string {
  const serviceMap: Record<string, string> = {
    ride: '🚗 Ride Request',
    mechanic: '🔧 Mechanic Request',
    tow: '🚛 Tow Request',
  };

  return serviceMap[type?.toLowerCase()] || `⚡ ${type?.toUpperCase() || 'Service Request'}`;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE STATUS
|--------------------------------------------------------------------------
|
| Database:
|
| rejected
|
| UI:
|
| declined
|
*/

function normalizeStatus(item: any): JobStatus {
  const rawStatus = String(item.assignment_status ?? item.status ?? '')
    .trim()
    .toLowerCase();

  switch (rawStatus) {
    case 'rejected':
      return 'declined';

    case 'declined':
      return 'declined';

    case 'accepted':
      return 'accepted';

    case 'completed':
      return 'completed';

    case 'expired':
      return 'expired';

    case 'offered':
      return 'offered';

    case 'pending':
      return 'pending';

    default:
      return rawStatus || 'offered';
  }
}

/*
|--------------------------------------------------------------------------
| STATUS LABEL
|--------------------------------------------------------------------------
*/

function getStatusLabel(status: JobStatus): string {
  switch (status.toLowerCase()) {
    case 'offered':
      return 'OFFERED';

    case 'accepted':
      return 'ACCEPTED';

    case 'completed':
      return 'COMPLETED';

    case 'declined':
    case 'rejected':
      return 'DECLINED';

    case 'expired':
      return 'EXPIRED';

    case 'pending':
      return 'PENDING';

    default:
      return status.toUpperCase();
  }
}

/*
|--------------------------------------------------------------------------
| STATUS COLORS
|--------------------------------------------------------------------------
*/

function getStatusBadgeStyle(status: JobStatus) {
  switch (status.toLowerCase()) {
    case 'accepted':
      return {
        bg: '#D1FAE5',
        text: '#059669',
      };

    case 'completed':
      return {
        bg: '#DCFCE7',
        text: '#15803D',
      };

    case 'offered':
      return {
        bg: '#FEF3C7',
        text: '#D97706',
      };

    case 'declined':
    case 'rejected':
      return {
        bg: '#FEE2E2',
        text: '#DC2626',
      };

    case 'expired':
      return {
        bg: '#E2E8F0',
        text: '#475569',
      };

    case 'pending':
      return {
        bg: '#DBEAFE',
        text: '#2563EB',
      };

    default:
      return {
        bg: '#F1F5F9',
        text: '#475569',
      };
  }
}

/*
|--------------------------------------------------------------------------
| COUNTDOWN
|--------------------------------------------------------------------------
*/

function getRemainingSeconds(dateString: string | null | undefined, nowTimestamp: number): number {
  if (!dateString) {
    return 0;
  }

  const isoFormatted = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');

  const date = new Date(isoFormatted);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor((date.getTime() - nowTimestamp) / 1000));
}

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

export default function VendorJobsScreen(): React.JSX.Element {
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('OFFERED');

  const [processingId, setProcessingId] = useState<string | number | null>(null);

  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  /*
  |--------------------------------------------------------------------------
  | LOAD JOBS
  |--------------------------------------------------------------------------
  */

  const loadJobs = useCallback(async (): Promise<void> => {
    try {
      /*
        |--------------------------------------------------------------------------
        | OFFERED TAB
        |--------------------------------------------------------------------------
        |
        | Only request active offers.
        |
        */

      const response: any =
        selectedFilter === 'OFFERED' ? await getJobOffers() : await getAllJobs();

      /*
        |--------------------------------------------------------------------------
        | Handle multiple possible API response shapes.
        |--------------------------------------------------------------------------
        */

      const rawList: any[] =
        response?.offers ?? response?.jobs ?? response?.data?.jobs ?? response?.data?.offers ?? [];

      /*
        |--------------------------------------------------------------------------
        | Normalize API records
        |--------------------------------------------------------------------------
        */

      const normalized: NormalizedJob[] = rawList
        .map((item: any): NormalizedJob => {
          const status = normalizeStatus(item);

          return {
            /*
                |--------------------------------------------------------------------------
                | Assignment ID should be preferred.
                |--------------------------------------------------------------------------
                */

            id: item.assignment_id ?? item.id ?? item.offer_id,

            booking_id: item.booking_id,

            booking_number: item.booking_number ?? item.booking_id ?? 'N/A',

            service_type: item.service_type ?? 'service',

            assignment_status: status,

            pickup_address: item.pickup_address ?? 'Customer Location',

            destination_address: item.destination_address ?? null,

            problem_description: item.problem_description ?? null,

            /*
                |--------------------------------------------------------------------------
                | IMPORTANT:
                |
                | Use the booking amount / earnings returned by backend.
                | Do NOT calculate it here.
                |--------------------------------------------------------------------------
                */

            price: Number(
              item.estimated_earnings ??
                item.estimated_amount ??
                item.total_price ??
                item.estimated_price ??
                0
            ),

            distance_km: item.distance_km ?? null,

            expires_at: item.expires_at ?? null,

            created_at: item.created_at ?? null,

            responded_at: item.responded_at ?? null,
          };
        })
        /*
            |--------------------------------------------------------------------------
            | Remove invalid records
            |--------------------------------------------------------------------------
            */

        .filter((job) => job.id !== undefined && job.id !== null);

      setJobs(normalized);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      console.error('[VendorJobsScreen] Error loading jobs:', message);

      Alert.alert('Error', message || 'Unable to load jobs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  /*
  |--------------------------------------------------------------------------
  | LOAD / POLLING
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadJobs();

    /*
    |--------------------------------------------------------------------------
    | Poll OFFERED jobs.
    |--------------------------------------------------------------------------
    |
    | This allows new offers to appear automatically.
    |
    */

    let pollInterval: ReturnType<typeof setInterval> | null = null;

    if (selectedFilter === 'OFFERED') {
      pollInterval = setInterval(() => {
        loadJobs();
      }, 5000);
    }

    /*
    |--------------------------------------------------------------------------
    | Countdown timer
    |--------------------------------------------------------------------------
    */

    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      clearInterval(timerInterval);
    };
  }, [loadJobs, selectedFilter]);

  /*
  |--------------------------------------------------------------------------
  | ACCEPT JOB
  |--------------------------------------------------------------------------
  */

  const handleAccept = async (job: NormalizedJob): Promise<void> => {
    setProcessingId(job.id);

    try {
      /*
      |--------------------------------------------------------------------------
      | Accept the assignment / offer.
      |--------------------------------------------------------------------------
      */

      const response: any = await acceptJobOffer(Number(job.id));

      /*
      |--------------------------------------------------------------------------
      | Remove it from OFFERED locally.
      |--------------------------------------------------------------------------
      |
      | It will appear in ALL JOBS after switching
      | tabs because the backend status becomes accepted.
      |--------------------------------------------------------------------------
      */

      setJobs((current) => current.filter((item) => item.id !== job.id));

      const targetBookingId = response?.booking_id ?? job.booking_id ?? job.booking_number;

      Alert.alert('Job Accepted', 'The job has been assigned to you.', [
        {
          text: 'View Job Details',

          onPress: () => {
            if (targetBookingId) {
              router.push({
                pathname: '/screens/trip-tracking' as any,

                params: {
                  id: String(targetBookingId),
                },
              });
            }
          },
        },

        {
          text: 'Stay Here',
          style: 'cancel',
        },
      ]);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      Alert.alert('Unable to Accept', message || 'This job may no longer be available.');

      await loadJobs();
    } finally {
      setProcessingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DECLINE JOB
  |--------------------------------------------------------------------------
  */

  const handleDecline = async (job: NormalizedJob): Promise<void> => {
    setProcessingId(job.id);

    try {
      /*
      |--------------------------------------------------------------------------
      | IMPORTANT:
      |
      | declineJobOffer must send the assignment ID.
      |--------------------------------------------------------------------------
      */

      await declineJobOffer(Number(job.id));

      /*
      |--------------------------------------------------------------------------
      | Remove from OFFERED locally.
      |--------------------------------------------------------------------------
      |
      | The record is NOT deleted from database.
      |
      | Backend changes:
      |
      | offered -> rejected
      |
      | ALL JOBS will then display it as DECLINED.
      |--------------------------------------------------------------------------
      */

      setJobs((current) => current.filter((item) => item.id !== job.id));
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      Alert.alert('Unable to Decline', message || 'Please try again.');

      await loadJobs();
    } finally {
      setProcessingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER JOBS
  |--------------------------------------------------------------------------
  */

  const filteredJobs = jobs.filter((job) => {
    /*
      |--------------------------------------------------------------------------
      | OFFERED TAB
      |--------------------------------------------------------------------------
      |
      | ONLY offered.
      |--------------------------------------------------------------------------
      */

    if (selectedFilter === 'OFFERED') {
      return job.assignment_status.toLowerCase() === 'offered';
    }

    /*
      |--------------------------------------------------------------------------
      | ALL JOBS TAB
      |--------------------------------------------------------------------------
      |
      | Everything returned by getAllJobs:
      |
      | offered
      | accepted
      | completed
      | declined
      | expired
      | pending
      |--------------------------------------------------------------------------
      */

    return true;
  });

  /*
  |--------------------------------------------------------------------------
  | RENDER JOB CARD
  |--------------------------------------------------------------------------
  */

  const renderJobCard = ({ item }: ListRenderItemInfo<NormalizedJob>): React.JSX.Element => {
    const status = item.assignment_status.toLowerCase();

    const isProcessing = processingId === item.id;

    const isOffered = status === 'offered';

    const secondsLeft = getRemainingSeconds(item.expires_at, currentTime);

    const isExpiringSoon = secondsLeft <= 10;

    const statusStyle = getStatusBadgeStyle(item.assignment_status);

    return (
      <View style={styles.card}>
        {/* ============================================================
      HEADER
  ============================================================ */}

        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>{formatService(item.service_type)}</Text>
            </View>

            <Text style={styles.bookingNumber}>Booking #{item.booking_number}</Text>
          </View>

          {/* STATUS */}

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusStyle.bg,
              },
            ]}>
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: statusStyle.text,
                },
              ]}>
              {getStatusLabel(item.assignment_status)}
            </Text>
          </View>
        </View>

        {/* ============================================================
      DISTANCE
  ============================================================ */}

        {item.distance_km != null && (
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceText}>📍 {Number(item.distance_km).toFixed(1)} km</Text>
          </View>
        )}

        {/* ============================================================
      DETAILS
  ============================================================ */}

        <View style={styles.detailsContainer}>
          <View style={styles.locationBox}>
            <Text style={styles.locationLabel}>PICKUP LOCATION</Text>

            <Text style={styles.locationAddress}>{item.pickup_address}</Text>
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

        {/* ============================================================
      EARNINGS
  ============================================================ */}

        <View style={styles.earningsCard}>
          <View>
            <Text style={styles.earningsLabel}>Estimated Earnings</Text>

            <Text style={styles.earningsValue}>₦{Number(item.price || 0).toFixed(2)}</Text>
          </View>

          {/* OFFER EXPIRATION */}

          {isOffered && item.expires_at && (
            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>Expires in</Text>

              <Text style={[styles.timerValue, isExpiringSoon && styles.timerExpiring]}>
                ⏱️ {secondsLeft}s
              </Text>
            </View>
          )}
        </View>

        {/* ============================================================
      ACTIONS
  ============================================================ */}

        {isOffered ? (
          /* OFFERED: KEEP ACCEPT / DECLINE BUTTONS */
          <View style={styles.buttonsRow}>
            {/* DECLINE */}
            <TouchableOpacity
              style={[styles.declineButton, isProcessing && styles.disabled]}
              disabled={isProcessing}
              onPress={() => handleDecline(item)}
              activeOpacity={0.7}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>

            {/* ACCEPT */}
            <TouchableOpacity
              style={[styles.acceptButton, isProcessing && styles.disabled]}
              disabled={isProcessing}
              onPress={() => handleAccept(item)}
              activeOpacity={0.8}>
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.acceptText}>Accept Job</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : item.assignment_status === 'accepted' ? (
          /* ACCEPTED: NAVIGATE TO TRIP-TRACKING */
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              const bookingId = Number(item.booking_id);

              if (!Number.isInteger(bookingId) || bookingId <= 0) {
                Alert.alert('Unable to open job', 'This job does not have a valid booking ID.');
                return;
              }

              router.push({
                pathname: '/screens/trip-tracking',
                // trip-tracking accepts the booking identifier as `id`.
                params: { id: String(bookingId) },
              });
            }}
            activeOpacity={0.8}>
            <Text style={styles.actionButtonText}>Go to Trip Tracking</Text>
          </TouchableOpacity>
        ) : (
          /* OTHER STATUSES: NAVIGATE TO JOB-DETAILS */
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.push({
                pathname: '/screens/job-details',
                // job-details reads the booking identifier, not the offer/
                // assignment identifier. Keep the parameter name consistent
                // with that screen and never fall back to an offer id.
                params: {
                  id: String(item.booking_id || item.booking_number),
                },
              })
            }
            activeOpacity={0.8}>
            <Text style={styles.actionButtonText}>View Job Details</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SCREEN
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ================================================================
          HEADER
      ================================================================ */}

      <View style={styles.header}>
        <Text style={styles.title}>Jobs Center</Text>

        <Text style={styles.subtitle}>Manage incoming offers and your job history</Text>
      </View>

      {/* ================================================================
          TWO TABS ONLY
      ================================================================ */}

      <View style={styles.filterBar}>
        {(['OFFERED', 'ALL'] as StatusFilter[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, selectedFilter === tab && styles.filterTabActive]}
            onPress={() => {
              if (selectedFilter !== tab) {
                setLoading(true);
                setSelectedFilter(tab);
              }
            }}>
            <Text
              style={[styles.filterTabText, selectedFilter === tab && styles.filterTabTextActive]}>
              {tab === 'ALL' ? 'ALL JOBS' : 'OFFERED'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ================================================================
          CONTENT
      ================================================================ */}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />

          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderJobCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);

                loadJobs();
              }}
              tintColor="#2563EB"
            />
          }
          contentContainerStyle={
            filteredJobs.length === 0 ? styles.emptyListContainer : styles.listContainer
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>🔎</Text>
              </View>

              <Text style={styles.emptyTitle}>No Jobs Found</Text>

              <Text style={styles.emptyText}>
                {selectedFilter === 'OFFERED'
                  ? 'There are currently no new job offers.'
                  : 'No jobs have been assigned to you yet.'}
              </Text>
            </View>
          }
        />
      )}
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

  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
  },

  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },

  filterTab: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },

  filterTabActive: {
    backgroundColor: '#2563EB',
  },

  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  filterTabTextActive: {
    color: '#FFFFFF',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',

    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },

  serviceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  serviceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },

  bookingNumber: {
    marginTop: 6,
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  distanceContainer: {
    marginTop: 10,
    alignSelf: 'flex-start',
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
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  earningsLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },

  earningsValue: {
    marginTop: 2,
    fontSize: 20,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  timerExpiring: {
    color: '#F87171',
  },

  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },

  declineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
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
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 28,
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    color: '#64748B',
    fontSize: 13,
  },
  actionButton: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
