import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import {
  getVendorDashboard,
  setVendorOnline,
  VendorDashboardResponse,
  DashboardStats,
} from '@/api/vendor';
import { useVendorLocationTracker } from '@/hooks/useVendorLocationTracker';

type VendorDashboardData = VendorDashboardResponse['vendor'];

const FIRST_VISIT_KEY = '@vendor_dashboard_first_visit_completed';

/*
 * ============================================
 * STAT CARD PROPS
 * ============================================
 */

interface StatCardProps {
  value: number | string;
  label: string;
  color: string;
}

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
 * SCREEN
 * ============================================
 */

export default function VendorDashboardScreen(): React.JSX.Element {
  const [dashboard, setDashboard] = useState<VendorDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);

  // Derived state to determine if vendor is active/online
  const isOnline = dashboard?.vendor?.is_online === 1;

  useVendorLocationTracker(isOnline);

  /*
   * ==========================================
   * CHECK FIRST VISIT STATUS
   * ==========================================
   */

  const checkFirstVisit = useCallback(async (): Promise<void> => {
    try {
      const hasVisitedBefore = await AsyncStorage.getItem(FIRST_VISIT_KEY);
      if (!hasVisitedBefore) {
        setIsFirstVisit(true);
      }
    } catch (error) {
      console.error('[VendorDashboard] Error reading AsyncStorage:', error);
    }
  }, []);

  const handleDismissBanner = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(FIRST_VISIT_KEY, 'true');
      setIsFirstVisit(false);
    } catch (error) {
      console.error('[VendorDashboard] Error saving to AsyncStorage:', error);
    }
  };

  /*
   * ==========================================
   * LOAD DASHBOARD
   * ==========================================
   */

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      console.log('[VendorDashboard] Loading dashboard...');

      const response = await getVendorDashboard();

      console.log('[VendorDashboard] Response:', response);

      setDashboard(response);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      console.error('[VendorDashboard] Load error:', error);

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * ==========================================
   * INITIAL LOAD
   * ==========================================
   */

  useEffect(() => {
    // checkFirstVisit();
    loadDashboard();
  }, [checkFirstVisit, loadDashboard]);

  /*
   * ==========================================
   * ONLINE / OFFLINE
   * ==========================================
   */

  const handleOnlineChange = async (value: boolean): Promise<void> => {
    if (!dashboard?.vendor) {
      return;
    }

    const previousValue = dashboard.vendor.is_online;
    const newValue: number = value ? 1 : 0;

    setUpdatingStatus(true);

    /*
     * Optimistic update.
     */
    setDashboard((current) => {
      if (!current?.vendor) {
        return current;
      }

      return {
        ...current,
        vendor: {
          ...current.vendor,
          is_online: newValue,
        },
      };
    });

    try {
      console.log('[VendorDashboard] Changing online status:', value);

      await setVendorOnline(value);

      console.log('[VendorDashboard] Online status updated.');
    } catch (error: unknown) {
      /*
       * Revert if API request fails.
       */
      setDashboard((current) => {
        if (!current?.vendor) {
          return current;
        }

        return {
          ...current,
          vendor: {
            ...current.vendor,
            is_online: previousValue,
          },
        };
      });

      const message = getErrorMessage(error);

      console.error('[VendorDashboard] Status update error:', error);

      Alert.alert('Unable to change status', message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  /*
   * ==========================================
   * REFRESH
   * ==========================================
   */

  const refresh = useCallback((): void => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  /*
   * ==========================================
   * ERROR / NO DATA
   * ==========================================
   */

  if (!dashboard?.vendor) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Unable to load dashboard</Text>
        <Text style={styles.errorText}>
          Vendor profile information was not returned by the server.
        </Text>
      </View>
    );
  }

  /*
   * ==========================================
   * DATA
   * ==========================================
   */

  const vendor: VendorDashboardData = dashboard.vendor;

  const statistics: DashboardStats = dashboard.stats ?? {
    today_earnings: 0,
    completed_jobs: 0,
    pending_jobs: 0,
  };

  // const isOnline = vendor.is_online === 1;

  /*
   * Displays banner if the backend signals incomplete registration AND
   * the user has not manually dismissed the banner via AsyncStorage.
   */
  // const showRegistrationBanner = isFirstVisit && vendor.registration_completed === false;
  const showRegistrationBanner = isFirstVisit === false;

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      {/* FIRST TIME REGISTRATION BANNER */}
      {showRegistrationBanner && (
        <View style={styles.registrationBanner}>
          <View style={styles.registrationBannerContent}>
            <Text style={styles.registrationBannerTitle}>Complete Your Registration</Text>
            <Text style={styles.registrationBannerText}>
              Please complete your registration details to unlock full features and start receiving
              requests.
            </Text>
            <TouchableOpacity
              style={styles.registrationButton}
              onPress={() => {
                console.log('[VendorDashboard] Navigate to registration completion screen.');
                router.push('/screens/vendor-onboarding');
              }}>
              <Text style={styles.registrationButtonText}>Complete Now</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleDismissBanner} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* HEADER */}

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.name}>{vendor.name || 'Service Provider'}</Text>
          <Text style={styles.vendorType}>{formatVendorType(vendor.vendor_type)}</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{vendor.name ? vendor.name[0] : 'V'}</Text>
        </View>
      </View>

      {/* ONLINE STATUS */}

      <View style={[styles.statusCard, isOnline ? styles.onlineCard : styles.offlineCard]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
          <View>
            <Text style={styles.statusTitle}>{isOnline ? "You're Online" : "You're Offline"}</Text>
            <Text style={styles.statusDescription}>
              {isOnline ? 'You can receive new jobs.' : "You won't receive new jobs."}
            </Text>
          </View>
        </View>

        <Switch
          value={isOnline}
          onValueChange={handleOnlineChange}
          disabled={updatingStatus}
          trackColor={{
            false: '#CBD5E1',
            true: '#93C5FD',
          }}
          thumbColor={isOnline ? '#2563EB' : '#64748B'}
        />
      </View>

      {/* PENDING APPLICATION */}

      {vendor.status === 'pending' && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Application Under Review</Text>
          <Text style={styles.warningText}>
            Your vendor application is currently being reviewed.
          </Text>
        </View>
      )}

      {/* STATISTICS */}

      <Text style={styles.sectionTitle}>Today's Activity</Text>

      <View style={styles.statsRow}>
        <StatCard value={statistics.completed_jobs ?? 0} label="Completed" color="#16A34A" />
        <StatCard value={statistics.pending_jobs ?? 0} label="Active Jobs" color="#2563EB" />
      </View>

      {/* EARNINGS */}

      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Today's Earnings</Text>
        <Text style={styles.earningsValue}>
          ${Number(statistics.today_earnings ?? 0).toFixed(2)}
        </Text>
      </View>

      {/* RATING */}

      <View style={styles.ratingCard}>
        <View>
          <Text style={styles.ratingTitle}>Customer Rating</Text>
          <Text style={styles.ratingValue}>⭐ {Number(vendor.rating ?? 0).toFixed(1)}</Text>
        </View>
        <Text style={styles.reviewCount}>{vendor.total_reviews ?? 0} reviews</Text>
      </View>

      {/* AVAILABLE JOBS */}

      <Text style={styles.sectionTitle}>Available Jobs</Text>

      {!isOnline && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💤</Text>
          <Text style={styles.emptyTitle}>You're offline</Text>
          <Text style={styles.emptyText}>Go online to start receiving service requests.</Text>
        </View>
      )}

      {isOnline && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🔎</Text>
          <Text style={styles.emptyTitle}>Looking for jobs</Text>
          <Text style={styles.emptyText}>New service requests will appear here.</Text>
        </View>
      )}
    </ScrollView>
  );
}

/*
 * ============================================
 * STAT CARD
 * ============================================
 */

function StatCard({ value, label, color }: StatCardProps): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/*
 * ============================================
 * FORMAT VENDOR TYPE
 * ============================================
 */

function formatVendorType(type: string): string {
  const types: Record<string, string> = {
    mechanic: 'Mechanic',
    tow_driver: 'Tow Driver',
    ride_driver: 'Ride Driver',
  };

  return types[type] || 'Service Provider';
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

  registrationBanner: {
    backgroundColor: '#3B82F6',
    margin: 20,
    marginBottom: 0,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  registrationBannerContent: {
    flex: 1,
    marginRight: 10,
  },

  registrationBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  registrationBannerText: {
    color: '#DBEAFE',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },

  registrationButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  registrationButtonText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },

  closeButton: {
    padding: 4,
  },

  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },

  errorText: {
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  greeting: {
    fontSize: 14,
    color: '#64748B',
  },

  name: {
    marginTop: 3,
    fontSize: 25,
    fontWeight: '700',
    color: '#0F172A',
  },

  vendorType: {
    marginTop: 3,
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  statusCard: {
    margin: 20,
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  onlineCard: {
    backgroundColor: '#ECFDF5',
  },

  offlineCard: {
    backgroundColor: '#F1F5F9',
  },

  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },

  onlineDot: {
    backgroundColor: '#16A34A',
  },

  offlineDot: {
    backgroundColor: '#64748B',
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  statusDescription: {
    marginTop: 3,
    fontSize: 13,
    color: '#64748B',
  },

  warningCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
  },

  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },

  warningText: {
    marginTop: 5,
    color: '#92400E',
    lineHeight: 20,
  },

  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },

  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  statValue: {
    fontSize: 30,
    fontWeight: '800',
  },

  statLabel: {
    marginTop: 5,
    fontSize: 13,
    color: '#64748B',
  },

  earningsCard: {
    margin: 20,
    padding: 22,
    borderRadius: 16,
    backgroundColor: '#111827',
  },

  earningsLabel: {
    color: '#CBD5E1',
    fontSize: 14,
  },

  earningsValue: {
    marginTop: 5,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },

  ratingCard: {
    marginHorizontal: 20,
    marginBottom: 25,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  ratingTitle: {
    fontSize: 14,
    color: '#64748B',
  },

  ratingValue: {
    marginTop: 5,
    fontSize: 23,
    fontWeight: '700',
    color: '#0F172A',
  },

  reviewCount: {
    color: '#64748B',
  },

  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 30,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 35,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },

  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    color: '#64748B',
  },
});
