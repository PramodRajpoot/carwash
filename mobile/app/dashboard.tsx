import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Linking,
  BackHandler,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { safeHapticLight, safeHapticMedium, safeHapticWarning } from '../utils/haptics';
import { getAvatarUri } from '../utils/avatar';

import { API_BASE } from '../constants/api';
import DashboardHeader from '../components/DashboardHeader';
import QuickActionsGrid from '../components/QuickActionsGrid';
import CouponsCarousel from '../components/CouponsCarousel';
import CountingStatsSection from '../components/CountingStatsSection';
import AppFooter, { FooterTab } from '../components/AppFooter';
import BookServiceModal from '../components/BookServiceModal';

const WebViewComponent: any = WebView;

// Domains that are allowed to load inside the WebView (payment flow)
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

export default function DashboardScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashData, setDashData] = useState<any>({});
  const [isDark, setIsDark] = useState(false);

  // Menu Modal State (Profile & Web Sidebar CTAs)
  const [menuVisible, setMenuVisible] = useState(false);

  // In-App Modal Sheet State for Web/Payment actions
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUrl, setModalUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [webProgress, setWebProgress] = useState(0);
  const webviewRef = useRef<any>(null);
  const scrollViewRef = useRef<any>(null);
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab>('home');
  const [bookingSheetVisible, setBookingSheetVisible] = useState(false);
  const [liveHeaderAddress, setLiveHeaderAddress] = useState<string>('');

  const resolvedDashboardAddress = typeof dashData.address === 'string' ? dashData.address.trim() : '';

  const resolveLiveHeaderAddress = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLiveHeaderAddress('');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const formatted =
        geo && (
          geo.name ||
          geo.street ||
          geo.district ||
          geo.city ||
          geo.region ||
          geo.country
        )
          ? [geo.name, geo.street, geo.district, geo.city, geo.region, geo.country]
              .filter(Boolean)
              .join(', ')
          : `Lat ${currentLocation.coords.latitude.toFixed(4)}, Lon ${currentLocation.coords.longitude.toFixed(4)}`;

      setLiveHeaderAddress(formatted);
    } catch (error) {
      console.warn('Failed to resolve live header address:', error);
      setLiveHeaderAddress('');
    }
  }, []);

  useEffect(() => {
    if (token && (!resolvedDashboardAddress || resolvedDashboardAddress === 'Select Location')) {
      resolveLiveHeaderAddress();
    }
  }, [token, resolvedDashboardAddress, resolveLiveHeaderAddress]);

  const fetchDashboardData = useCallback(async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    try {
      const response = await axios.get(`${API_BASE}/api/customer/dashboard?limit=5`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      setDashData(response.data || {});

      // Synchronize latest user profile (avatar, name, email) from server
      if (response.data?.user) {
        setUser(response.data.user);
        AsyncStorage.setItem('userData', JSON.stringify(response.data.user)).catch(() => {});
      } else {
        // Fallback fetch from /api/auth/me to ensure user avatar is always fresh
        axios
          .get(`${API_BASE}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${activeToken}`,
              'Bypass-Tunnel-Reminder': 'true',
              'ngrok-skip-browser-warning': 'true',
            },
          })
          .then((meRes) => {
            if (meRes.data) {
              setUser(meRes.data);
              AsyncStorage.setItem('userData', JSON.stringify(meRes.data)).catch(() => {});
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role !== 'customer') {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            router.replace('/login');
            return;
          }
          if (isMounted) {
            setToken(storedToken);
            setUser(parsedUser);
            const storedTheme = await AsyncStorage.getItem('app_theme');
            if (storedTheme) {
              setIsDark(storedTheme === 'dark');
            }
          }
          await fetchDashboardData(storedToken);
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
  }, [fetchDashboardData, router]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchDashboardData(token);
      }
    }, [token, fetchDashboardData])
  );

  const onRefresh = async () => {
    safeHapticLight();
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            safeHapticWarning();
            try {
              if (token) {
                await axios.post(
                  `${API_BASE}/api/auth/logout`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              }
            } catch {}
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            router.replace('/login');
          },
        },
      ]
    );
  };

  // Open In-App Action Sheet (for Booking, Vehicles, Packages, etc.)
  const openActionView = (title: string, path: string, tab: FooterTab = 'home') => {
    if (title === 'My Garage' && path === '/customer/vehicles') {
      setMenuVisible(false);
      router.push('/garage');
      return;
    }

    setMenuVisible(false);
    setActiveFooterTab(tab);
    setModalTitle(title);
    setModalUrl(`${API_BASE}${path}`);
    setModalVisible(true);
  };

  const closeActionView = () => {
    setModalVisible(false);
    setActiveFooterTab('home');
    // Refresh dashboard data upon closing in case user booked/updated vehicles
    fetchDashboardData();
  };

  const openBookingModal = () => {
    safeHapticMedium();
    setBookingSheetVisible(true);
  };

  const closeBookingModal = () => {
    setBookingSheetVisible(false);
    // Refresh dashboard data in case of new bookings
    fetchDashboardData();
  };

  const handleFooterTabPress = (tab: FooterTab) => {
    if (tab === 'home') {
      if (modalVisible) {
        closeActionView();
      } else {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    switch (tab) {
      case 'garage':
        router.push('/garage');
        break;
      case 'book':
        router.push('/bookings');
        break;
      case 'support':
        openActionView('Help & Support', '/customer/support', 'support');
        break;
      case 'notifications':
        openActionView('Notifications', '/customer/notifications', 'notifications');
        break;
    }
  };

  // Handle hardware back in Android for modal
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBackPress = () => {
      if (modalVisible) {
        if (canGoBack && webviewRef.current) {
          webviewRef.current.goBack();
          return true;
        }
        setModalVisible(false);
        setActiveFooterTab('home');
        fetchDashboardData();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [modalVisible, canGoBack, fetchDashboardData]);

  const onShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;
    if (url.startsWith('about:') || url.startsWith('javascript:')) return true;

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

    if (url.startsWith('intent://')) {
      const fallbackMatch = url.match(/S\.browser_fallback_url=([^;]+)/);
      if (fallbackMatch) {
        Linking.openURL(decodeURIComponent(fallbackMatch[1])).catch(() => {});
      } else {
        Linking.openURL(url).catch(() => {});
      }
      return false;
    }

    try {
      const hostname = new URL(url).hostname;
      if (ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith('.' + h))) {
        return true;
      }
      Linking.openURL(url).catch(() => {});
      return false;
    } catch {
      return true;
    }
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

  const toggleTheme = async () => {
    safeHapticLight();
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('app_theme', next ? 'dark' : 'light');
  };

  const handleProfilePress = () => {
    safeHapticLight();
    setMenuVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.darkSafeArea]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading your car care dashboard...</Text>
      </View>
    );
  }

  const headerAddress = resolvedDashboardAddress && resolvedDashboardAddress !== 'Select Location'
    ? resolvedDashboardAddress
    : liveHeaderAddress;

  return (
    <View style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Header (BookMyShow style) */}
      <DashboardHeader
        user={user}
        address={headerAddress}
        unreadCount={dashData.unread_notifications || 0}
        isDark={isDark}
        onLocationPress={() =>
          openActionView('My Garage & Address', '/customer/vehicles', 'garage')
        }
        onNotificationPress={() =>
          openActionView('Notifications', '/customer/notifications', 'notifications')
        }
        onToggleTheme={toggleTheme}
        onProfilePress={handleProfilePress}
      />

      {/* Scrollable Dashboard Body */}
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, isDark && styles.darkScrollView]}
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
        {/* Services & Features (8 Compact Icon Boxes in 4 Columns) */}
        <QuickActionsGrid
          isDark={isDark}
          onBookWashPress={openBookingModal}
          onGaragePress={() =>
            openActionView('My Garage', '/customer/vehicles', 'garage')
          }
          onSubscriptionsPress={() =>
            openActionView('Wash Packages', '/customer/subscriptions')
          }
          onWalletPress={() =>
            openActionView('E-Points Wallet', '/customer/wallet')
          }
          onOffersPress={() =>
            openActionView('Offers & Deals', '/customer/offers')
          }
          onReferPress={() =>
            openActionView('Refer & Earn', '/customer/referrals')
          }
          onSupportPress={() =>
            openActionView('Help & Support', '/customer/support', 'support')
          }
          onWishlistPress={() =>
            openActionView('My Wishlist', '/customer/wishlist')
          }
        />

        {/* Coupons & Referral Share Carousel */}
        <CouponsCarousel
          isDark={isDark}
          coupons={dashData.active_coupons}
          referralCode={dashData.referral_code}
        />

        {/* Counting Stats & Activity Chart Section */}
        <CountingStatsSection
          dashData={dashData}
          isDark={isDark}
          onWashesPress={() => router.push('/bookings')}
          onEarningMoneyPress={() =>
            openActionView('Earning Money Wallet', '/customer/wallet')
          }
          onEPointsPress={() =>
            openActionView('E-Points Wallet', '/customer/wallet')
          }
          onNotificationsPress={() =>
            openActionView('Notifications', '/customer/notifications', 'notifications')
          }
        />
      </ScrollView>

      {/* App Fixed Footer Navigation Bar */}
      <AppFooter
        activeTab={activeFooterTab}
        isDark={isDark}
        onTabPress={handleFooterTabPress}
      />

      <BookServiceModal
        visible={bookingSheetVisible}
        onClose={() => setBookingSheetVisible(false)}
        onSuccess={() => {
          setBookingSheetVisible(false);
          fetchDashboardData();
        }}
        isDark={isDark}
        token={token}
        user={user}
        defaultAddress={headerAddress}
      />

      {/* In-App Flow Modal Sheet */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeActionView}
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

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={closeActionView}
            >
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
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
                  'ngrok-skip-browser-warning': 'true',
                  'Bypass-Tunnel-Reminder': 'true',
                },
              }}
              injectedJavaScriptBeforeContentLoaded={injectedJS}
              onNavigationStateChange={(s: any) => setCanGoBack(s.canGoBack)}
              onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
              onLoadProgress={({ nativeEvent }: any) =>
                setWebProgress(nativeEvent.progress)
              }
              startInLoadingState={true}
              domStorageEnabled={true}
              javaScriptEnabled={true}
              renderLoading={() => (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color="#0284c7" />
                </View>
              )}
            />
          ) : null}
        </SafeAreaView>
      </Modal>

      {/* Customer Full Navigation Menu Sheet (All Web Sidebar CTAs) */}
      <Modal
        visible={menuVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMenuVisible(false)}
      >
        <SafeAreaView style={styles.menuContainer}>
          <StatusBar style="light" />
          <View style={styles.menuHeader}>
            <View style={styles.menuHeaderUser}>
              <View style={styles.menuAvatar}>
                {getAvatarUri(user) ? (
                  <Image source={{ uri: getAvatarUri(user)! }} style={styles.menuAvatarImg} />
                ) : (
                  <Text style={styles.menuAvatarInitial}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                )}
              </View>
              <View style={styles.menuUserInfo}>
                <Text style={styles.menuUserName} numberOfLines={1}>
                  {user?.name || 'Customer Account'}
                </Text>
                <Text style={styles.menuUserEmail} numberOfLines={1}>
                  {user?.email || ''}
                </Text>
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>VERIFIED CUSTOMER</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.menuCloseBtn}
              onPress={() => setMenuVisible(false)}
            >
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.menuScrollView}
            contentContainerStyle={styles.menuScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.menuGroupTitle}>MAIN PORTAL ACTIONS</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#f0f9ff' }]}>
                <Ionicons name="grid-outline" size={20} color="#0284c7" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Dashboard</Text>
                <Text style={styles.menuItemSub}>Overview & live status</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/bookings');
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="calendar-outline" size={20} color="#2563eb" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Bookings</Text>
                <Text style={styles.menuItemSub}>Past & upcoming wash appointments</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => openActionView('My Garage', '/customer/vehicles', 'garage')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="car-sport-outline" size={20} color="#059669" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>My Garage</Text>
                <Text style={styles.menuItemSub}>Add & manage saved cars</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => openActionView('Wash Packages', '/customer/subscriptions')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#fffbeb' }]}>
                <Ionicons name="cube-outline" size={20} color="#d97706" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Subscriptions</Text>
                <Text style={styles.menuItemSub}>Monthly recurring wash plans</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => openActionView('E-Points Wallet', '/customer/wallet')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="wallet-outline" size={20} color="#16a34a" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>E-Points Wallet</Text>
                <Text style={styles.menuItemSub}>Recharge & redeem points</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => openActionView('Refer & Earn', '/customer/referrals')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#f5f3ff' }]}>
                <Ionicons name="gift-outline" size={20} color="#7c3aed" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Referrals</Text>
                <Text style={styles.menuItemSub}>Invite friends & get 10% cash bonus</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => openActionView('Offers & Deals', '/customer/offers')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#fff1f2' }]}>
                <Ionicons name="ticket-outline" size={20} color="#e11d48" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Offers & Coupons</Text>
                <Text style={styles.menuItemSub}>Seasonal deals & discounts</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => openActionView('My Wishlist', '/customer/wishlist')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#fff1f2' }]}>
                <Ionicons name="heart-outline" size={20} color="#e11d48" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Wishlist</Text>
                <Text style={styles.menuItemSub}>Saved services & plans</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={[styles.menuGroupTitle, { marginTop: 20 }]}>SUPPORT & ACCOUNT</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => openActionView('Help & Support', '/customer/support', 'support')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#f0f9ff' }]}>
                <Ionicons name="headset-outline" size={20} color="#0284c7" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Support</Text>
                <Text style={styles.menuItemSub}>Raise tickets & live assistance</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => openActionView('Notifications', '/customer/notifications', 'notifications')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="notifications-outline" size={20} color="#d97706" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Notifications</Text>
                <Text style={styles.menuItemSub}>Booking alerts & updates</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => openActionView('My Profile', '/customer/profile')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="person-circle-outline" size={20} color="#475569" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Profile Settings</Text>
                <Text style={styles.menuItemSub}>Personal details & password</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={() => openActionView('CleanAt Doorstep', '/')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#f8fafc' }]}>
                <Ionicons name="globe-outline" size={20} color="#64748b" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Website</Text>
                <Text style={styles.menuItemSub}>Visit CleanAt official portal</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.menuItem, styles.menuItemLogout]}
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={[styles.menuItemTitle, { color: '#dc2626' }]}>Logout</Text>
                <Text style={styles.menuItemSub}>Sign out of your device</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#fca5a5" />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  darkSafeArea: {
    backgroundColor: '#090d16',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkScrollView: {
    backgroundColor: '#090d16',
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 110,
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
    flex: 1,
    gap: 8,
  },
  modalBackBtn: {
    padding: 4,
  },
  modalHeaderTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#1e293b',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  modalLoading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Menu Sheet Styles
  menuContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  menuHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  menuAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  menuAvatarInitial: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  menuUserInfo: {
    flex: 1,
  },
  menuUserName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  menuUserEmail: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 1,
  },
  menuBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0369a1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  menuBadgeText: {
    color: '#e0f2fe',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  menuCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuScrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  menuScrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  menuGroupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#ffffff',
  },
  menuItemLogout: {
    marginTop: 12,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  menuItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
});
