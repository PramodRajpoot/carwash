import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
import DashboardHeader from '../components/DashboardHeader';
import { safeHapticLight, safeHapticMedium, safeHapticSuccess } from '../utils/haptics';
import { showSweetAlert } from '../utils/sweetAlert';
import { useAppTheme } from '../utils/themeManager';

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

type FilterType = 'all' | 'upcoming' | 'assigned' | 'completed' | 'cancelled';

export default function BookingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark, toggleTheme } = useAppTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [expandedBookingIds, setExpandedBookingIds] = useState<Record<number, boolean>>({});

  // Delete / Cancel confirmation state
  const [deleteTargetBooking, setDeleteTargetBooking] = useState<BookingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cashfree payment states
  const [payingBookingId, setPayingBookingId] = useState<number | null>(null);
  const [cashfreeOrderId, setCashfreeOrderId] = useState<string | null>(null);

  // Booking / Action Modal Sheet state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('Book a Wash');
  const [modalUrl, setModalUrl] = useState('');
  const [modalHtml, setModalHtml] = useState<string | null>(null);
  const [webProgress, setWebProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const webviewRef = useRef<any>(null);
  const scrollViewRef = useRef<any>(null);

  const buildCashfreeCheckoutHtml = (sessionId: string, environment: string = 'sandbox') => {
    const mode = environment.toLowerCase() === 'production' ? 'production' : 'sandbox';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Cashfree Checkout</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid rgba(2, 132, 199, 0.2);
      border-top: 4px solid #0284c7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    h2 { font-size: 1.25rem; font-weight: 700; color: #f8fafc; margin-bottom: 8px; }
    p { font-size: 0.9rem; color: #94a3b8; line-height: 1.45; }
    .badge {
      margin-top: 24px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .error-box {
      display: none;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 12px;
      border-radius: 10px;
      font-size: 0.85rem;
      margin-top: 16px;
      max-width: 320px;
    }
  </style>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
</head>
<body>
  <div id="loader" class="spinner"></div>
  <h2 id="title">Opening Secure Checkout</h2>
  <p id="desc">Connecting with Cashfree Payment Gateway to complete your booking...</p>
  <div class="badge">🔒 256-Bit SSL Encrypted</div>
  <div id="error-msg" class="error-box"></div>

  <script>
    window.addEventListener('load', function() {
      try {
        var cashfree = Cashfree({ mode: "${mode}" });
        cashfree.checkout({
          paymentSessionId: "${sessionId}",
          redirectTarget: "_self"
        }).then(function(result) {
          if (result && result.error) {
            showErr(result.error.message || 'Payment initialization error');
          }
        }).catch(function(err) {
          showErr(err && err.message ? err.message : 'Checkout error');
        });
      } catch (e) {
        showErr(e && e.message ? e.message : 'Failed to load payment SDK');
      }
    });

    function showErr(msg) {
      document.getElementById('loader').style.display = 'none';
      document.getElementById('title').textContent = 'Payment Error';
      document.getElementById('desc').textContent = 'Please return to the app and retry.';
      var eb = document.getElementById('error-msg');
      eb.style.display = 'block';
      eb.textContent = msg;
    }
  </script>
</body>
</html>`;
  };

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
      const dedupedList = Array.from(
        new Map(list.map((item) => [item.id, item])).values()
      );
      setBookings(dedupedList);
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

        if (storedToken && storedUser) {
          if (isMounted) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
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

  const handleToggleTheme = async () => {
    safeHapticLight();
    await toggleTheme();
  };

  const [bookingSheetVisible, setBookingSheetVisible] = useState(false);

  useEffect(() => {
    if (params.book === 'true') {
      router.push('/book');
    }
  }, [params.book]);

  const openBookingModal = () => {
    safeHapticMedium();
    router.push('/book');
  };

  // Helper to determine payment action button text
  const getPayButtonText = (b: BookingItem) => {
    const is99Paid =
      isOnly99Paid(b) ||
      b.payment_status === 'partially_paid' ||
      parseFloat(String(b.paid_amount || 0)) >= 99;
    if (is99Paid) {
      return 'Pay Remaining';
    }
    if (b.payment_type === 'partial') {
      return 'Pay Advance';
    }
    return 'Pay Now';
  };

  const handlePayBooking = async (b: BookingItem) => {
    safeHapticMedium();
    const activeToken = token || (await AsyncStorage.getItem('userToken'));
    if (!activeToken) {
      showSweetAlert('Auth Required', 'Please log in again to complete your payment.', 'error');
      router.replace('/login');
      return;
    }

    setPayingBookingId(b.id);
    try {
      const is99Paid =
        isOnly99Paid(b) ||
        b.payment_status === 'partially_paid' ||
        parseFloat(String(b.paid_amount || 0)) >= 99;

      // Always request full outstanding amount (advance or remaining balance)
      const split = 'full';
      const cfOrderRes = await axios.post(
        `${API_BASE}/api/cashfree/create-order`,
        {
          booking_id: b.id,
          payment_split: split,
        },
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      if (cfOrderRes.data?.payment_session_id) {
        const sessionId = cfOrderRes.data.payment_session_id;
        const env = cfOrderRes.data.environment || 'sandbox';
        const cfOrderId = cfOrderRes.data.cashfree_order_id;
        setCashfreeOrderId(cfOrderId);
        setModalTitle(is99Paid ? `Pay Remaining • Wash #${b.id}` : `Pay for Wash #${b.id}`);
        setModalUrl('');
        setModalHtml(buildCashfreeCheckoutHtml(sessionId, env));
        setModalVisible(true);
      } else {
        showSweetAlert('Payment Error', 'Could not create payment order. Please retry.', 'error');
      }
    } catch (err: any) {
      console.error('handlePayBooking error:', err);
      showSweetAlert('Payment Error', err.response?.data?.message || 'Failed to start payment.', 'error');
    } finally {
      setPayingBookingId(null);
    }
  };

  const handleVerifyCashfreePayment = async (orderId: string) => {
    try {
      const activeToken = token || (await AsyncStorage.getItem('userToken'));
      const res = await axios.get(`${API_BASE}/api/cashfree/verify/${orderId}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      closeModal();
      if (
        res.data?.status === 'success' ||
        res.data?.payment_status === 'paid' ||
        res.data?.payment_status === 'partially_paid'
      ) {
        safeHapticSuccess();
        showSweetAlert(
          'Payment Successful',
          'Your payment has been completed and verified successfully!',
          'success'
        );
      } else {
        showSweetAlert(
          'Payment Pending',
          'Payment is being processed and will update shortly.',
          'info'
        );
      }
      fetchBookings();
    } catch (err) {
      console.error('Verification error:', err);
      closeModal();
      fetchBookings();
    }
  };

  const openActionUrl = (title: string, path: string) => {
    safeHapticLight();
    setModalTitle(title);
    setModalHtml(null);
    setModalUrl(`${API_BASE}${path}`);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalHtml(null);
    setModalUrl('');
    // Refresh bookings after booking or payment action
    fetchBookings();
  };

  const handleFooterTabPress = (tab: FooterTab) => {
    if (tab === 'home') {
      router.push('/');
    } else if (tab === 'bookings' || tab === 'book') {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (tab === 'refer') {
      router.push('/refer-and-earn');
    } else if (tab === 'wallet') {
      router.push('/e-points');
    } else if (tab === 'profile') {
      router.push('/profile');
    } else if (tab === 'garage') {
      router.push('/garage');
    } else if (tab === 'support') {
      router.push('/support');
    }
  };

  // Check if user paid only 99 rupees (partial advance payment)
  const isOnly99Paid = useCallback((b: BookingItem) => {
    const paid = parseFloat(String(b.paid_amount || 0));
    const advance = parseFloat(String(b.advance_amount || 0));
    const total = parseFloat(String(b.total_price || 0));
    return (
      (b.payment_status === 'partially_paid' ||
        (b.payment_type === 'partial' && paid > 0) ||
        advance === 99 ||
        paid === 99) &&
      (b.payment_status !== 'paid' || paid < total) &&
      (paid === 99 || (paid > 0 && paid <= 100) || advance === 99)
    );
  }, []);

  // Check if payment is not completed (unpaid / pending / failed / 0 paid)
  const isPaymentIncomplete = useCallback((b: BookingItem) => {
    const paid = parseFloat(String(b.paid_amount || 0));
    return (
      b.payment_status !== 'paid' &&
      (['unpaid', 'pending_payment', 'failed'].includes(b.payment_status) || paid === 0)
    );
  }, []);

  // Delete icon will only show on two cases:
  // 1. Payment is not completed
  // 2. User paid only 99 rupees
  const canDeleteBooking = useCallback(
    (b: BookingItem) => {
      if (b.status === 'completed' || b.status === 'cancelled') {
        return false;
      }
      if (b.payment_status === 'paid') {
        return false;
      }
      return isPaymentIncomplete(b) || isOnly99Paid(b);
    },
    [isPaymentIncomplete, isOnly99Paid]
  );

  // Delete wash handler
  const handleDeleteBooking = (b: BookingItem) => {
    safeHapticMedium();
    setDeleteTargetBooking(b);
  };

  const confirmDeleteBooking = async (b: BookingItem) => {
    safeHapticMedium();
    setIsDeleting(true);
    try {
      await axios.post(
        `${API_BASE}/api/bookings/${b.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeleteTargetBooking(null);
      showSweetAlert(
        'Wash Deleted',
        isOnly99Paid(b)
          ? 'Wash booking deleted. To reschedule this wash or retain your ₹99 advance, please contact customer care.'
          : 'Wash booking deleted successfully.',
        'success'
      );
      await fetchBookings();
    } catch (err: any) {
      showSweetAlert('Error', err.response?.data?.message || 'Failed to delete booking', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'upcoming') {
      return ['pending', 'assigned', 'ongoing', 'postponed'].includes(b.status);
    }
    if (activeFilter === 'assigned') {
      return b.status === 'assigned';
    }
    if (activeFilter === 'completed') {
      return b.status === 'completed';
    }
    if (activeFilter === 'cancelled') {
      return b.status === 'cancelled';
    }
    return true;
  });

  useEffect(() => {
    setVisibleCount(6);
  }, [activeFilter]);

  const PAGE_SIZE = 6;
  const visibleBookings = filteredBookings.slice(0, visibleCount);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentSize, contentOffset } = event.nativeEvent;
    const threshold = 260;
    const reachedEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;

    if (reachedEnd && visibleCount < filteredBookings.length) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredBookings.length));
    }
  };

  const upcomingCount = bookings.filter((b) =>
    ['pending', 'assigned', 'ongoing', 'postponed'].includes(b.status)
  ).length;
  const assignedCount = bookings.filter((b) => b.status === 'assigned').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  const filterOptions: Array<{ key: FilterType; label: string; count: number }> = [
    { key: 'all', label: 'All', count: bookings.length },
    { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
    { key: 'assigned', label: 'Assigned', count: assignedCount },
    { key: 'completed', label: 'Completed', count: completedCount },
    { key: 'cancelled', label: 'Cancelled', count: cancelledCount },
  ];

  const activeFilterLabel = filterOptions.find((option) => option.key === activeFilter)?.label || 'All';

  const toggleBookingExpansion = (bookingId: number) => {
    setExpandedBookingIds((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  };

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
    if (b.payment_status === 'partially_paid' || isOnly99Paid(b)) {
      return (
        <View style={[styles.payBadge, styles.payBadgePartial]}>
          <Text style={styles.payBadgePartialText}>₹99 Advance Paid</Text>
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

      <DashboardHeader
        user={user}
        title=""
        subtitle=""
        unreadCount={0}
        isDark={isDark}
        actionButton={
          <TouchableOpacity
            style={styles.bookHeaderBtnCompact}
            onPress={openBookingModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={14} color="#ffffff" />
            <Text style={styles.bookHeaderBtnTextCompact}>Book Wash</Text>
          </TouchableOpacity>
        }
        onNotificationPress={() => router.push('/notifications')}
        onToggleTheme={handleToggleTheme}
      />

      <View style={[styles.sectionHeaderRow, isDark && styles.darkSectionHeaderRow]}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Wash List</Text>

        <View style={[styles.filterTriggerWrap, isDark && styles.darkFilterTriggerWrap]}>
          <TouchableOpacity
            style={[styles.filterTrigger, isDark && styles.darkFilterTrigger]}
            onPress={() => {
              safeHapticLight();
              setFilterMenuVisible((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="funnel-outline"
              size={16}
              color={isDark ? '#e2e8f0' : '#334155'}
            />
          </TouchableOpacity>
        </View>

        {filterMenuVisible && (
          <View style={[styles.filterMenu, isDark && styles.darkFilterMenu]}>
            {filterOptions.map((option) => {
              const isSelected = activeFilter === option.key;

              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterMenuItem,
                    isSelected && (isDark ? styles.activeFilterMenuItemDark : styles.activeFilterMenuItemLight),
                  ]}
                  onPress={() => {
                    safeHapticLight();
                    setActiveFilter(option.key);
                    setFilterMenuVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterMenuItemText,
                      isDark && styles.darkSubtext,
                      isSelected && styles.activeFilterMenuItemText,
                    ]}
                  >
                    {option.label} ({option.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, isDark && styles.darkContainer]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0284c7']}
            tintColor={isDark ? '#38bdf8' : '#0284c7'}
          />
        }
      >
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
            {visibleBookings.map((b) => {
              const isExpanded = !!expandedBookingIds[b.id];
              const uniqueAddonServices = Array.from(
                new Map(
                  (b.addon_services || []).map((service) => [
                    `${service.id ?? service.name}-${service.name}`,
                    service,
                  ])
                ).values()
              );

              return (
                <View
                  key={b.id}
                  style={[styles.bookingCard, isDark ? styles.darkCard : styles.lightCard]}
                >
                  {!isExpanded ? (
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryTextWrap}>
                        <Text style={[styles.summaryValue, isDark && styles.darkText]}>
                          #BOK-{b.id}
                        </Text>
                        <Text style={[styles.summaryTitle, isDark && styles.darkText]}>
                          {b.vehicle?.make_model || 'Vehicle'}{' '}
                          <Text style={[styles.summaryDateInline, isDark && styles.darkSubtext]}>
                            ({b.booking_date || 'No date'})
                          </Text>
                        </Text>
                      </View>

                      <View style={styles.summaryActionsWrap}>
                        {canDeleteBooking(b) && (
                          <TouchableOpacity
                            style={[styles.deleteBtnCompact, isDark && styles.darkDeleteBtn]}
                            onPress={() => handleDeleteBooking(b)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={15} color="#ef4444" />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[styles.toggleBtn, isDark && styles.darkToggleBtn]}
                          onPress={() => toggleBookingExpansion(b.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="chevron-down-outline"
                            size={18}
                            color={isDark ? '#cbd5e1' : '#334155'}
                          />
                          <Text style={[styles.toggleText, isDark && styles.darkSubtext]}>
                            View more
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.cardHeader}>
                        <View style={styles.orderIdBadge}>
                          <Text style={[styles.orderIdText, isDark && styles.darkSubtext]}>
                            #BOK-{b.id}
                          </Text>
                        </View>
                        <View style={styles.cardHeaderRightRow}>
                          {renderStatusBadge(b.status)}
                          {canDeleteBooking(b) && (
                            <TouchableOpacity
                              style={[styles.deleteBtn, isDark && styles.darkDeleteBtn]}
                              onPress={() => handleDeleteBooking(b)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={16} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

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

                      {uniqueAddonServices.length > 0 && (
                        <View style={styles.addonsRow}>
                          {uniqueAddonServices.map((ad, i) => (
                            <View
                              key={`${ad.id ?? ad.name}-${i}`}
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

                          {b.payment_status !== 'paid' && b.status !== 'cancelled' ? (
                            <TouchableOpacity
                              style={[
                                styles.payBtn,
                                payingBookingId === b.id && styles.payBtnDisabled,
                              ]}
                              onPress={() => handlePayBooking(b)}
                              disabled={payingBookingId === b.id}
                              activeOpacity={0.8}
                            >
                              {payingBookingId === b.id ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                              ) : (
                                <Text style={styles.payBtnText}>
                                  {getPayButtonText(b)}
                                </Text>
                              )}
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

                      <TouchableOpacity
                        style={[styles.collapseBtn, isDark && styles.darkCollapseBtn]}
                        onPress={() => toggleBookingExpansion(b.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="chevron-up-outline"
                          size={16}
                          color={isDark ? '#cbd5e1' : '#334155'}
                        />
                        <Text style={[styles.toggleText, isDark && styles.darkSubtext]}>
                          View less
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              );
            })}

            {filteredBookings.length > visibleBookings.length && (
              <View style={[styles.loadMoreHint, isDark && styles.darkLoadMoreHint]}>
                <Text style={[styles.loadMoreText, isDark && styles.darkSubtext]}>
                  Scroll to load more washes
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Footer Navigation */}
      <AppFooter
        activeTab="bookings"
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deleteTargetBooking}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setDeleteTargetBooking(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModalCard, isDark && styles.darkDeleteModalCard]}>
            <View
              style={[
                styles.deleteIconCircle,
                deleteTargetBooking && isOnly99Paid(deleteTargetBooking)
                  ? styles.deleteIconCircleAmber
                  : styles.deleteIconCircleRed,
              ]}
            >
              <Ionicons
                name={
                  deleteTargetBooking && isOnly99Paid(deleteTargetBooking)
                    ? 'information-circle-outline'
                    : 'trash-outline'
                }
                size={28}
                color={
                  deleteTargetBooking && isOnly99Paid(deleteTargetBooking)
                    ? '#f59e0b'
                    : '#ef4444'
                }
              />
            </View>

            <Text style={[styles.deleteModalTitle, isDark && styles.darkText]}>
              Delete Wash Booking?
            </Text>

            <Text style={[styles.deleteModalSubtitle, isDark && styles.darkSubtext]}>
              {deleteTargetBooking && isOnly99Paid(deleteTargetBooking)
                ? 'This amount (₹99.00) will not be deleted after deleting it. For rescheduling this wash or retaining your ₹99 advance, please contact customer care.'
                : `Are you sure you want to delete wash booking #BOK-${deleteTargetBooking?.id}?`}
            </Text>

            {deleteTargetBooking && isOnly99Paid(deleteTargetBooking) && (
              <View style={[styles.amountRetainedBadge, isDark && styles.darkAmountRetainedBadge]}>
                <Ionicons name="information-circle" size={16} color="#0284c7" />
                <Text style={[styles.amountRetainedText, isDark && styles.darkText]}>
                  For rescheduling or retaining ₹99, please contact customer care
                </Text>
              </View>
            )}

            <View style={styles.deleteModalActionCol}>
              {deleteTargetBooking && isOnly99Paid(deleteTargetBooking) && (
                <TouchableOpacity
                  style={[styles.rescheduleActionBtn, { backgroundColor: '#0284c7' }]}
                  onPress={() => {
                    setDeleteTargetBooking(null);
                    router.push('/support');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="headset-outline" size={16} color="#ffffff" />
                  <Text style={styles.rescheduleActionBtnText}>Contact Customer Care</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.confirmDeleteBtn,
                  deleteTargetBooking && isOnly99Paid(deleteTargetBooking)
                    ? styles.confirmDeleteBtnOutline
                    : styles.confirmDeleteBtnSolid,
                ]}
                onPress={() => deleteTargetBooking && confirmDeleteBooking(deleteTargetBooking)}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      deleteTargetBooking && isOnly99Paid(deleteTargetBooking)
                        ? '#ef4444'
                        : '#ffffff'
                    }
                  />
                ) : (
                  <Text
                    style={[
                      styles.confirmDeleteBtnText,
                      deleteTargetBooking && isOnly99Paid(deleteTargetBooking)
                        ? styles.confirmDeleteBtnTextOutline
                        : styles.confirmDeleteBtnTextSolid,
                    ]}
                  >
                    {deleteTargetBooking && isOnly99Paid(deleteTargetBooking)
                      ? 'Delete Wash'
                      : 'Yes, Delete'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelDismissBtn}
                onPress={() => setDeleteTargetBooking(null)}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelDismissBtnText, isDark && styles.darkSubtext]}>
                  Cancel / Keep Wash
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

          {modalHtml ? (
            <WebViewComponent
              ref={webviewRef}
              source={{ html: modalHtml, baseUrl: 'https://sdk.cashfree.com' }}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mixedContentMode="always"
              allowFileAccess={true}
              onShouldStartLoadWithRequest={(request: any) => {
                if (
                  request.url.includes('/cashfree/return') ||
                  request.url.includes('cashfree_order_id=') ||
                  request.url.includes('status=success')
                ) {
                  const match = request.url.match(/order_id=([^&]+)/);
                  const orderId = match ? decodeURIComponent(match[1]) : cashfreeOrderId;
                  if (orderId) {
                    handleVerifyCashfreePayment(orderId);
                  } else {
                    closeModal();
                  }
                  return false;
                }
                return true;
              }}
              onNavigationStateChange={(navState: any) => {
                if (
                  navState.url.includes('/cashfree/return') ||
                  navState.url.includes('cashfree_order_id=') ||
                  navState.url.includes('status=success')
                ) {
                  const match = navState.url.match(/order_id=([^&]+)/);
                  const orderId = match ? decodeURIComponent(match[1]) : cashfreeOrderId;
                  if (orderId) {
                    handleVerifyCashfreePayment(orderId);
                  } else {
                    closeModal();
                  }
                }
              }}
              style={{ flex: 1 }}
            />
          ) : modalUrl ? (
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
                if (
                  navState.url.includes('/cashfree/return') ||
                  navState.url.includes('cashfree_order_id=') ||
                  navState.url.includes('status=success')
                ) {
                  closeModal();
                }
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  darkSectionHeaderRow: {
    backgroundColor: '#090d16',
    borderBottomColor: '#1f2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  filterTriggerWrap: {
    position: 'relative',
  },
  darkFilterTriggerWrap: {
    backgroundColor: 'transparent',
  },
  headerFilterWrap: {
    position: 'relative',
  },
  filterMenuWrap: {
    position: 'relative',
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: 'stretch',
  },
  filterInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  filterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookHeaderBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#0284c7',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  bookHeaderBtnTextCompact: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  darkFilterTrigger: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  filterTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  filterMenu: {
    position: 'absolute',
    right: 16,
    top: 42,
    width: 180,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 20,
  },
  darkFilterMenu: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  filterMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  activeFilterMenuItemLight: {
    backgroundColor: '#e0f2fe',
  },
  activeFilterMenuItemDark: {
    backgroundColor: '#082f49',
  },
  filterMenuItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeFilterMenuItemText: {
    color: '#0284c7',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryTextWrap: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 1,
  },
  summaryDateInline: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 94,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  darkToggleBtn: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  darkCollapseBtn: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  darkLoadMoreBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  loadMoreHint: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  darkLoadMoreHint: {
    opacity: 0.9,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingBottom: 8,
  },
  pageNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pageNavBtnDisabled: {
    opacity: 0.5,
  },
  darkPageNavBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  pageIndicator: {
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  darkPageIndicator: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
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
    borderRadius: 9,
    padding: 7,
    gap: 5,
    marginBottom: 8,
  },
  darkInfoGrid: {
    backgroundColor: '#111827',
  },
  infoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoVal: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
  },
  infoLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  infoLocationText: {
    fontSize: 10.5,
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
  payBtnDisabled: {
    opacity: 0.65,
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
  cardHeaderRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnCompact: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  darkRescheduleBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  rescheduleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  darkAmberText: {
    color: '#fbbf24',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  darkDeleteModalCard: {
    backgroundColor: '#111c33',
    borderColor: '#1e293b',
    borderWidth: 1,
  },
  deleteIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deleteIconCircleRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  deleteIconCircleAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  deleteModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
  },
  amountRetainedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  darkAmountRetainedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  amountRetainedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  deleteModalActionCol: {
    width: '100%',
    gap: 9,
  },
  rescheduleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  rescheduleActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  confirmDeleteBtnSolid: {
    backgroundColor: '#ef4444',
  },
  confirmDeleteBtnOutline: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  confirmDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmDeleteBtnTextSolid: {
    color: '#ffffff',
  },
  confirmDeleteBtnTextOutline: {
    color: '#ef4444',
  },
  cancelDismissBtn: {
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDismissBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  rescheduleModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
    maxHeight: '85%',
  },
  rescheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rescheduleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  rescheduleSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseIconBtn: {
    padding: 6,
  },
  paidNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  darkPaidNoteBox: {
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  paidNoteText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0369a1',
    flex: 1,
    lineHeight: 16,
  },
  rescheduleSectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  datePillsStrip: {
    gap: 8,
    paddingBottom: 12,
  },
  datePillBox: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    borderWidth: 1.5,
  },
  lightDatePillBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  darkDatePillBox: {
    backgroundColor: '#0b1324',
    borderColor: '#1e293b',
  },
  datePillBoxSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  datePillDayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  datePillNumText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 2,
  },
  datePillMonthText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  datePillTextActive: {
    color: '#ffffff',
  },
  slotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  loadingSlotsWrap: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSlotsText: {
    fontSize: 12,
    color: '#64748b',
  },
  slotsGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  slotChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '47%',
    flexGrow: 1,
  },
  lightSlotChip: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  darkSlotChip: {
    backgroundColor: '#0b1324',
    borderColor: '#1e293b',
  },
  slotChipSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: '#0284c7',
  },
  slotChipFull: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.5,
  },
  slotChipTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  slotChipTextActive: {
    color: '#0284c7',
  },
  slotChipTextFull: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  slotChipStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  slotOpenText: {
    color: '#10b981',
  },
  slotFullText: {
    color: '#ef4444',
  },
  slotSelectedText: {
    color: '#0284c7',
    fontWeight: '700',
  },
  rescheduleModalActions: {
    width: '100%',
    marginTop: 8,
  },
  submitRescheduleBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitRescheduleBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  submitRescheduleBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
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
