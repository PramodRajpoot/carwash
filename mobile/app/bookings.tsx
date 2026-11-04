import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
  Linking,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { WebView } from 'react-native-webview';

import { API_BASE } from '../constants/api';
import AppFooter, { FooterTab } from '../components/AppFooter';
import BookServiceModal from '../components/BookServiceModal';
import { safeHapticLight, safeHapticMedium } from '../utils/haptics';

const WebViewComponent: any = WebView;

// Domains allowed in payment/booking webview
const ALLOWED_HOSTS = [
  new URL(API_BASE).hostname,
  'sdk.cashfree.com',
  'api.cashfree.com',
  'sandbox.cashfree.com',
  'payments.cashfree.com',
  'payments-test.cashfree.com',
  'cashfree.com',
  'gw.cashfree.com',
  'payments-gateway.cashfree.com',
];

interface BookingItem {
  id: number;
  booking_date: string;
  slot_time: string;
  address?: string;
  status: 'pending' | 'assigned' | 'ongoing' | 'completed' | 'cancelled' | 'postponed' | string;
  payment_status: 'paid' | 'partially_paid' | 'pending_payment' | 'failed' | 'unpaid' | string;
  payment_method?: string;
  payment_type?: string;
  total_price: string | number;
  advance_amount?: string | number;
  paid_amount?: string | number;
  gst_amount?: string | number;
  coupon_code?: string;
  coupon_discount?: string | number;
  epoints_used?: number;
  earning_money_used?: string | number;
  vehicle?: {
    id: number;
    make_model: string;
    plate_number?: string;
    vehicle_type?: string;
  };
  package?: {
    id: number;
    name: string;
    max_bookings?: number;
    description?: string;
  };
  franchisee?: {
    id: number;
    center_name: string;
    city?: string;
  };
  addon_services?: Array<{ id: number; name: string; price: number }>;
}

type FilterType = 'all' | 'upcoming' | 'completed' | 'cancelled';

export default function BookingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Booking / Action Modal Sheet state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('Book a Wash');
  const [modalUrl, setModalUrl] = useState('');
  const [webProgress, setWebProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const webviewRef = useRef<any>(null);

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;

  const fetchBookings = useCallback(async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    try {
      // Call dashboard without limit to receive all bookings in upcoming_services
      const response = await axios.get(`${API_BASE}/api/customer/dashboard`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const list: BookingItem[] = response.data?.upcoming_services || [];
      setBookings(list);
    } catch (err) {
      console.error('Failed to fetch bookings list:', err);
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        const storedTheme = await AsyncStorage.getItem('app_theme');

        if (storedToken && storedUser) {
          if (isMounted) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsDark(storedTheme === 'dark');
          }
          await fetchBookings(storedToken);
        } else {
          router.replace('/login');
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchBookings, router]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchBookings(token);
      }
    }, [token, fetchBookings])
  );

  const onRefresh = async () => {
    safeHapticLight();
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const toggleTheme = async () => {
    safeHapticLight();
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('app_theme', next ? 'dark' : 'light');
  };

  const [bookingSheetVisible, setBookingSheetVisible] = useState(false);

  useEffect(() => {
    if (params.book === 'true') {
      setBookingSheetVisible(true);
    }
  }, [params.book]);

  const openBookingModal = () => {
    safeHapticMedium();
    setBookingSheetVisible(true);
  };

  const openActionUrl = (title: string, path: string) => {
    safeHapticLight();
    setModalTitle(title);
    setModalUrl(`${API_BASE}${path}`);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    // Refresh bookings after booking or payment action
    fetchBookings();
  };

  const handleFooterTabPress = (tab: FooterTab) => {
    if (tab === 'home') {
      router.replace('/dashboard');
    } else if (tab === 'garage') {
      openActionUrl('My Garage', '/customer/vehicles');
    } else if (tab === 'support') {
      openActionUrl('Help & Support', '/customer/support');
    } else if (tab === 'book') {
      // Already on washes/book page; keep the current list open
      return;
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'upcoming') {
      return ['pending', 'assigned', 'ongoing', 'postponed'].includes(b.status);
    }
    if (activeFilter === 'completed') {
      return b.status === 'completed';
    }
    if (activeFilter === 'cancelled') {
      return b.status === 'cancelled';
    }
    return true;
  });

  const upcomingCount = bookings.filter((b) =>
    ['pending', 'assigned', 'ongoing', 'postponed'].includes(b.status)
  ).length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  const injectedJS = `
    try {
      localStorage.setItem('auth_token', ${JSON.stringify(token)});
      localStorage.setItem('auth_user', ${JSON.stringify(JSON.stringify(user))});
      localStorage.setItem('theme', ${JSON.stringify(isDark ? 'dark' : 'light')});
      document.documentElement.classList.toggle('dark', ${isDark});
    } catch(e) {}
    true;
  `;

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    if (
      url.startsWith('upi://') ||
      url.startsWith('phonepe://') ||
      url.startsWith('gpay://') ||
      url.startsWith('paytmmp://') ||
      url.startsWith('tez://')
    ) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <View style={[styles.badgeBase, styles.badgeCompleted]}>
            <Text style={styles.badgeCompletedText}>✓ Completed</Text>
          </View>
        );
      case 'ongoing':
        return (
          <View style={[styles.badgeBase, styles.badgeOngoing]}>
            <Text style={styles.badgeOngoingText}>⚡ In Progress</Text>
          </View>
        );
      case 'assigned':
        return (
          <View style={[styles.badgeBase, styles.badgeAssigned]}>
            <Text style={styles.badgeAssignedText}>👤 Assigned</Text>
          </View>
        );
      case 'cancelled':
        return (
          <View style={[styles.badgeBase, styles.badgeCancelled]}>
            <Text style={styles.badgeCancelledText}>✕ Cancelled</Text>
          </View>
        );
      case 'postponed':
        return (
          <View style={[styles.badgeBase, styles.badgePostponed]}>
            <Text style={styles.badgePostponedText}>📅 Postponed</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badgeBase, styles.badgePending]}>
            <Text style={styles.badgePendingText}>⏳ Pending</Text>
          </View>
        );
    }
  };

  const renderPaymentBadge = (b: BookingItem) => {
    if (b.payment_status === 'paid') {
      return (
        <View style={[styles.payBadge, styles.payBadgePaid]}>
          <Text style={styles.payBadgePaidText}>Paid</Text>
        </View>
      );
    }
    if (b.payment_status === 'partially_paid') {
      return (
        <View style={[styles.payBadge, styles.payBadgePartial]}>
          <Text style={styles.payBadgePartialText}>Partially Paid</Text>
        </View>
      );
    }
    if (b.payment_method === 'cod') {
      return (
        <View style={[styles.payBadge, styles.payBadgeCod]}>
          <Text style={styles.payBadgeCodText}>Cash On Delivery</Text>
        </View>
      );
    }
    return (
      <View style={[styles.payBadge, styles.payBadgeUnpaid]}>
        <Text style={styles.payBadgeUnpaidText}>Pending Payment</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.darkContainer]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={[styles.loadingText, isDark && styles.darkSubtext]}>
          Loading your washes...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, isDark && styles.darkContainer]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Native Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPadding },
          isDark && styles.darkHeader,
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, isDark && styles.darkBackBtn]}
            onPress={() => router.replace('/dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={isDark ? '#f8fafc' : '#0f172a'}
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.darkText]}>
              My Washes
            </Text>
            <Text style={[styles.headerSub, isDark && styles.darkSubtext]}>
              {bookings.length} total services
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon-outline'}
              size={20}
              color={isDark ? '#fbbf24' : '#334155'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookHeaderBtn}
            onPress={openBookingModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.bookHeaderBtnText}>Book Wash</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={[styles.scrollView, isDark && styles.darkContainer]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0284c7']}
            tintColor={isDark ? '#38bdf8' : '#0284c7'}
          />
        }
      >
        {/* Banner CTA: Book a Wash */}
        <View style={[styles.ctaBanner, isDark && styles.darkCtaBanner]}>
          <View style={styles.ctaBannerLeft}>
            <View style={styles.ctaIconBox}>
              <Text style={{ fontSize: 22 }}>✨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaBannerTitle}>Doorstep Car Care</Text>
              <Text style={styles.ctaBannerSub}>
                Expert washing at your doorstep & time slot
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.ctaBannerBtn}
            onPress={openBookingModal}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={14} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.ctaBannerBtnText}>Book Wash</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              isDark && styles.darkFilterPill,
              activeFilter === 'all' && (isDark ? styles.activeFilterDark : styles.activeFilterLight),
            ]}
            onPress={() => {
              safeHapticLight();
              setActiveFilter('all');
            }}
          >
            <Text
              style={[
                styles.filterText,
                isDark && styles.darkSubtext,
                activeFilter === 'all' && styles.activeFilterText,
              ]}
            >
              All ({bookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              isDark && styles.darkFilterPill,
              activeFilter === 'upcoming' && (isDark ? styles.activeFilterDark : styles.activeFilterLight),
            ]}
            onPress={() => {
              safeHapticLight();
              setActiveFilter('upcoming');
            }}
          >
            <Text
              style={[
                styles.filterText,
                isDark && styles.darkSubtext,
                activeFilter === 'upcoming' && styles.activeFilterText,
              ]}
            >
              Upcoming ({upcomingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              isDark && styles.darkFilterPill,
              activeFilter === 'completed' && (isDark ? styles.activeFilterDark : styles.activeFilterLight),
            ]}
            onPress={() => {
              safeHapticLight();
              setActiveFilter('completed');
            }}
          >
            <Text
              style={[
                styles.filterText,
                isDark && styles.darkSubtext,
                activeFilter === 'completed' && styles.activeFilterText,
              ]}
            >
              Completed ({completedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              isDark && styles.darkFilterPill,
              activeFilter === 'cancelled' && (isDark ? styles.activeFilterDark : styles.activeFilterLight),
            ]}
            onPress={() => {
              safeHapticLight();
              setActiveFilter('cancelled');
            }}
          >
            <Text
              style={[
                styles.filterText,
                isDark && styles.darkSubtext,
                activeFilter === 'cancelled' && styles.activeFilterText,
              ]}
            >
              Cancelled ({cancelledCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <View style={[styles.emptyContainer, isDark && styles.darkEmpty]}>
            <Ionicons
              name="water-outline"
              size={48}
              color={isDark ? '#475569' : '#94a3b8'}
            />
            <Text style={[styles.emptyTitle, isDark && styles.darkText]}>
              No washes found
            </Text>
            <Text style={[styles.emptySub, isDark && styles.darkSubtext]}>
              {activeFilter === 'all'
                ? 'You have not booked any services yet.'
                : `No ${activeFilter} wash bookings.`}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={openBookingModal}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>Book Your First Wash</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredBookings.map((b) => (
              <View
                key={b.id}
                style={[styles.bookingCard, isDark ? styles.darkCard : styles.lightCard]}
              >
                {/* Card Top: Order ID & Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.orderIdBadge}>
                    <Text style={[styles.orderIdText, isDark && styles.darkSubtext]}>
                      #BOK-{b.id}
                    </Text>
                  </View>
                  {renderStatusBadge(b.status)}
                </View>

                {/* Vehicle & Package Section */}
                <View style={styles.vehicleRow}>
                  <View style={[styles.carIconBox, isDark && styles.darkCarIconBox]}>
                    <Ionicons
                      name="car-sport"
                      size={20}
                      color={isDark ? '#38bdf8' : '#0284c7'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehicleName, isDark && styles.darkText]}>
                      {b.vehicle?.make_model || 'Vehicle'}
                    </Text>
                    <View style={styles.vehicleSubRow}>
                      {b.vehicle?.plate_number && (
                        <View style={[styles.plateTag, isDark && styles.darkPlateTag]}>
                          <Text style={[styles.plateText, isDark && styles.darkSubtext]}>
                            {b.vehicle.plate_number}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.packageName, isDark && styles.darkCyanText]}>
                        {b.package?.name || 'Standard Package'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Addons if any */}
                {b.addon_services && b.addon_services.length > 0 && (
                  <View style={styles.addonsRow}>
                    {b.addon_services.map((ad, i) => (
                      <View
                        key={ad.id || i}
                        style={[styles.addonPill, isDark && styles.darkAddonPill]}
                      >
                        <Text style={styles.addonPlus}>+</Text>
                        <Text style={[styles.addonText, isDark && styles.darkSubtext]}>
                          {ad.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Schedule & Location */}
                <View style={[styles.infoGrid, isDark && styles.darkInfoGrid]}>
                  <View style={styles.infoCol}>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={13}
                        color={isDark ? '#94a3b8' : '#64748b'}
                      />
                      <Text style={[styles.infoVal, isDark && styles.darkText]}>
                        {b.booking_date}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={isDark ? '#94a3b8' : '#64748b'}
                      />
                      <Text style={[styles.infoVal, isDark && styles.darkText]}>
                        {b.slot_time}
                      </Text>
                    </View>
                  </View>

                  {b.address && (
                    <View style={styles.infoLocationRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={isDark ? '#94a3b8' : '#64748b'}
                      />
                      <Text
                        style={[styles.infoLocationText, isDark && styles.darkSubtext]}
                        numberOfLines={1}
                      >
                        {b.address}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Price & Payment Footer */}
                <View style={[styles.cardFooter, isDark && styles.darkCardFooter]}>
                  <View>
                    <Text style={[styles.priceLabel, isDark && styles.darkSubtext]}>
                      Total Amount
                    </Text>
                    <Text style={[styles.priceValue, isDark && styles.darkText]}>
                      ₹{parseFloat(String(b.total_price || 0)).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.cardFooterRight}>
                    {renderPaymentBadge(b)}

                    {/* Action buttons */}
                    {b.payment_status !== 'paid' && b.status !== 'cancelled' ? (
                      <TouchableOpacity
                        style={styles.payBtn}
                        onPress={() =>
                          openActionUrl(
                            `Pay for Wash #${b.id}`,
                            `/customer/bookings?pay=${b.id}`
                          )
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.payBtnText}>
                          {b.payment_type === 'partial' ? 'Pay Advance' : 'Pay Now'}
                        </Text>
                      </TouchableOpacity>
                    ) : b.status === 'completed' ? (
                      <TouchableOpacity
                        style={[styles.invoiceBtn, isDark && styles.darkInvoiceBtn]}
                        onPress={() =>
                          openActionUrl(`Invoice #${b.id}`, `/api/bookings/${b.id}/invoice`)
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={12}
                          color={isDark ? '#38bdf8' : '#0284c7'}
                        />
                        <Text
                          style={[
                            styles.invoiceBtnText,
                            isDark && styles.darkCyanText,
                          ]}
                        >
                          Invoice
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Footer Navigation */}
      <AppFooter
        activeTab="book"
        isDark={isDark}
        onTabPress={handleFooterTabPress}
      />

      {/* Native Attractive Book Service Modal */}
      <BookServiceModal
        visible={bookingSheetVisible}
        onClose={() => setBookingSheetVisible(false)}
        onSuccess={() => {
          fetchBookings();
        }}
        isDark={isDark}
        token={token}
        user={user}
      />

      {/* Booking / Action Flow Modal Sheet */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar style="light" />
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              {canGoBack && (
                <TouchableOpacity
                  style={styles.modalBackBtn}
                  onPress={() => webviewRef.current?.goBack()}
                >
                  <Ionicons name="chevron-back" size={22} color="#ffffff" />
                </TouchableOpacity>
              )}
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {modalTitle}
              </Text>
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {webProgress > 0 && webProgress < 1 && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${webProgress * 100}%` },
                ]}
              />
            </View>
          )}

          {modalUrl ? (
            <WebViewComponent
              ref={webviewRef}
              source={{
                uri: modalUrl,
                headers: {
                  'Bypass-Tunnel-Reminder': 'true',
                  'ngrok-skip-browser-warning': 'true',
                },
              }}
              injectedJavaScriptBeforeContentLoaded={injectedJS}
              onNavigationStateChange={(navState: any) => {
                setCanGoBack(navState.canGoBack);
              }}
              onLoadProgress={({ nativeEvent }: any) => {
                setWebProgress(nativeEvent.progress);
              }}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              style={{ flex: 1 }}
            />
          ) : (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#0284c7" />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkContainer: {
    backgroundColor: '#090d16',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  darkHeader: {
    backgroundColor: '#090d16',
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkBackBtn: {
    backgroundColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
  },
  bookHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4,
    shadowColor: '#0284c7',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  bookHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 110,
  },
  ctaBanner: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  darkCtaBanner: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  ctaBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  ctaIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  ctaBannerSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  ctaBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#e11d48',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  ctaBannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  darkFilterPill: {
    backgroundColor: '#1e293b',
  },
  activeFilterLight: {
    backgroundColor: '#0284c7',
  },
  activeFilterDark: {
    backgroundColor: '#0284c7',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeFilterText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bookingCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  lightCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  darkCard: {
    backgroundColor: '#0d1527',
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderIdBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgeCompletedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  badgeOngoing: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  badgeOngoingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  badgeAssigned: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  badgeAssignedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06b6d4',
  },
  badgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
  },
  badgeCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  badgeCancelledText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  badgePostponed: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  badgePostponedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f97316',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  carIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkCarIconBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  vehicleSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  plateTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  darkPlateTag: {
    backgroundColor: '#1e293b',
  },
  plateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  packageName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  addonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },
  addonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  darkAddonPill: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  addonPlus: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },
  addonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  infoGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 9,
    gap: 6,
    marginBottom: 10,
  },
  darkInfoGrid: {
    backgroundColor: '#111827',
  },
  infoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  infoLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  infoLocationText: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  darkCardFooter: {
    borderTopColor: '#1e293b',
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payBadgePaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  payBadgePaidText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  payBadgePartial: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  payBadgePartialText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#06b6d4',
  },
  payBadgeCod: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  payBadgeCodText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
  },
  payBadgeUnpaid: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  payBadgeUnpaidText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  payBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  payBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  darkInvoiceBtn: {
    backgroundColor: '#1e293b',
  },
  invoiceBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  darkEmpty: {
    backgroundColor: '#0d1527',
    borderColor: '#1e293b',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalBackBtn: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  progressBar: {
    height: 2,
    backgroundColor: '#1e293b',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkText: {
    color: '#f8fafc',
  },
  darkSubtext: {
    color: '#94a3b8',
  },
  darkCyanText: {
    color: '#38bdf8',
  },
});
