import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';

import { API_BASE } from '../constants/api';
import { safeHapticLight, safeHapticMedium, safeHapticWarning } from '../utils/haptics';
import { showSweetAlert } from '../utils/sweetAlert';
import AppFooter, { FooterTab } from '../components/AppFooter';
import { useAppTheme } from '../utils/themeManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = Math.min(SCREEN_WIDTH - 24, 460);
const HERO_BANNER_HEIGHT = Math.round(BANNER_WIDTH / 2.2);
const PROMO_BANNER_HEIGHT = Math.round(BANNER_WIDTH / 5.7);

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);

  const { isDark, toggleTheme } = useAppTheme();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Location State
  const [currentLocation, setCurrentLocation] = useState('Ramesh Nagar, Delhi');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

  // Side Drawer Menu State
  const [menuOpen, setMenuOpen] = useState(false);

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselTimer = useRef<any>(null);

  // Load Auth, User & Theme
  const syncState = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      const storedLocation = await AsyncStorage.getItem('header_location');

      setIsLoggedIn(!!storedToken);
      setToken(storedToken);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {}
      } else {
        setUser(null);
      }

      if (storedLocation && storedLocation.trim() && storedLocation !== 'Select Location') {
        setCurrentLocation(storedLocation.trim());
      }

      // Fetch unread count if logged in
      if (storedToken) {
        axios
          .get(`${API_BASE}/api/customer/dashboard?limit=1`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
              'Bypass-Tunnel-Reminder': 'true',
              'ngrok-skip-browser-warning': 'true',
            },
          })
          .then((res) => {
            if (res.data?.unread_notifications !== undefined) {
              setUnreadCount(res.data.unread_notifications);
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      console.warn('Sync state error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncState();
    }, [syncState])
  );

  useEffect(() => {
    syncState();
  }, [syncState]);

  // Auto-scroll Hero Carousel
  useEffect(() => {
    carouselTimer.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4500);

    return () => {
      if (carouselTimer.current) clearInterval(carouselTimer.current);
    };
  }, []);

  const onRefresh = async () => {
    safeHapticLight();
    setRefreshing(true);
    await syncState();
    setRefreshing(false);
  };

  const handleToggleTheme = async () => {
    safeHapticLight();
    await toggleTheme();
  };

  // GPS Location Detection
  const handleDetectGPS = async () => {
    safeHapticLight();
    setDetectingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please allow location permission in your phone settings to detect your address.'
        );
        setDetectingGps(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (geo) {
        const parts = [geo.name, geo.district || geo.subregion, geo.city].filter(Boolean);
        const resolved = parts.length > 0 ? parts.join(', ') : `${geo.city || 'Delhi'}, India`;
        setCurrentLocation(resolved);
        await AsyncStorage.setItem('header_location', resolved);
        setLocationModalVisible(false);
      }
    } catch (err) {
      console.warn('GPS detection error:', err);
      Alert.alert('GPS Location', 'Unable to fetch current GPS coordinates. Please select manually.');
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSaveManualLocation = async () => {
    if (!manualLocationInput.trim()) return;
    safeHapticLight();
    const loc = manualLocationInput.trim();
    setCurrentLocation(loc);
    await AsyncStorage.setItem('header_location', loc);
    setManualLocationInput('');
    setLocationModalVisible(false);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    showSweetAlert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      'warning',
      async () => {
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
        setIsLoggedIn(false);
        setUser(null);
        setToken(null);
      }
    );
  };

  const handleFooterTabPress = (tab: FooterTab) => {
    if (tab === 'home') {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    switch (tab) {
      case 'bookings':
      case 'book':
        router.push('/bookings');
        break;
      case 'refer':
        router.push('/refer-and-earn');
        break;
      case 'wallet':
        router.push('/e-points');
        break;
      case 'profile':
      case 'garage':
        router.push(isLoggedIn ? '/profile' : '/login');
        break;
    }
  };

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 30 : 16);

  return (
    <View style={[styles.screenContainer, isDark && styles.darkScreenContainer]}>
      <StatusBar style="light" />

      {/* ── TOP HEADER SECTION (BookMyShow / Cleanatdoorstep style) ── */}
      <View style={[styles.headerContainer, { paddingTop: topPadding }]}>
        {/* Row 1: ☰ Menu | Logo | Dashboard/SignIn Button + Bell */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={() => {
              safeHapticLight();
              setMenuOpen(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={26} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/images/home/header_logo.png')}
              style={styles.headerLogoImg}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerRightActions}>
            {/* Dashboard / Sign In Button */}
            <TouchableOpacity
              style={styles.authPillBtn}
              onPress={() => {
                safeHapticLight();
                router.push(isLoggedIn ? '/dashboard' : '/login');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isLoggedIn ? 'speedometer-outline' : 'person-circle-outline'}
                size={14}
                color="#facc15"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.authPillBtnText}>
                {isLoggedIn ? 'Dashboard' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Notification Bell */}
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => {
                safeHapticLight();
                router.push(isLoggedIn ? '/notifications' : '/login');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications" size={21} color="#ffffff" />
              {unreadCount > 0 && <View style={styles.bellBadgeDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: 📍 Location Selector | 🎁 Refer & Earn Yellow Button */}
        <View style={styles.headerSubRow}>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => {
              safeHapticLight();
              setLocationModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={15} color="#034694" style={{ marginRight: 4 }} />
            <Text style={styles.locationPillText} numberOfLines={1}>
              {currentLocation}
            </Text>
            <Ionicons name="caret-down" size={12} color="#034694" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.referTopPill}
            onPress={() => {
              safeHapticLight();
              router.push('/refer-and-earn');
            }}
            activeOpacity={0.85}
          >
            <View style={styles.coinBadge}>
              <Text style={styles.coinBadgeText}>₹</Text>
            </View>
            <Ionicons name="gift" size={16} color="#78350f" style={{ marginRight: 4 }} />
            <Text style={styles.referTopPillText}>Refer & Earn</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SCROLLABLE BODY ── */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0284c7']}
            tintColor="#0284c7"
          />
        }
      >
        {/* ── 1. HERO BANNER CAROUSEL ── */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.heroBannerCard}
            activeOpacity={0.92}
            onPress={() => {
              safeHapticMedium();
              router.push('/book');
            }}
          >
            <Image
              source={require('../assets/images/home/hero_banner.png')}
              style={styles.heroBannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>

          {/* Carousel Indicator Dots */}
          <View style={styles.carouselDotsRow}>
            {[0, 1, 2].map((idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setCurrentSlide(idx)}
                style={[
                  styles.dot,
                  currentSlide === idx ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── 2. QUICK ACTION GRID (4 White Cards) ── */}
        <View style={styles.quickActionsContainer}>
          {/* Card 1: Book Service */}
          <TouchableOpacity
            style={[styles.quickCard, isDark && styles.darkQuickCard]}
            activeOpacity={0.75}
            onPress={() => {
              safeHapticLight();
              router.push('/book');
            }}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="calendar-outline" size={24} color="#0284c7" />
            </View>
            <Text style={[styles.quickCardTitle, isDark && styles.darkQuickCardTitle]}>
              Book{'\n'}Service
            </Text>
          </TouchableOpacity>

          {/* Card 2: Subscriptions */}
          <TouchableOpacity
            style={[styles.quickCard, isDark && styles.darkQuickCard]}
            activeOpacity={0.75}
            onPress={() => {
              safeHapticLight();
              router.push('/subscriptions');
            }}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="swap-horizontal-outline" size={24} color="#0284c7" />
            </View>
            <Text style={[styles.quickCardTitle, isDark && styles.darkQuickCardTitle]}>
              Subscriptions
            </Text>
            <Text style={[styles.quickCardSub, isDark && styles.darkQuickCardSub]}>
              (Monthly Plans)
            </Text>
          </TouchableOpacity>

          {/* Card 3: Refer & Earn */}
          <TouchableOpacity
            style={[styles.quickCard, isDark && styles.darkQuickCard]}
            activeOpacity={0.75}
            onPress={() => {
              safeHapticLight();
              router.push('/refer-and-earn');
            }}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="gift-outline" size={24} color="#ea580c" />
            </View>
            <Text style={[styles.quickCardTitle, isDark && styles.darkQuickCardTitle]}>
              Refer &{'\n'}Earn
            </Text>
          </TouchableOpacity>

          {/* Card 4: My Wallet */}
          <TouchableOpacity
            style={[styles.quickCard, isDark && styles.darkQuickCard]}
            activeOpacity={0.75}
            onPress={() => {
              safeHapticLight();
              router.push('/e-points');
            }}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="wallet-outline" size={24} color="#ca8a04" />
            </View>
            <Text style={[styles.quickCardTitle, isDark && styles.darkQuickCardTitle]}>
              My Wallet
            </Text>
            <Text style={[styles.quickCardSub, isDark && styles.darkQuickCardSub]}>
              (E-Points)
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. OUR CAR WASH SERVICES SECTION ── */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, isDark && styles.darkSectionHeading]}>
              Our Car Wash Services
            </Text>
            <TouchableOpacity
              onPress={() => {
                safeHapticLight();
                router.push('/services');
              }}
              style={styles.viewAllBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllBtnText}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color="#034694" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>

          {/* 3 Vehicle Cards Row */}
          <View style={styles.vehicleCardsRow}>
            {/* Card 1: Hatchback */}
            <TouchableOpacity
              style={[styles.vehicleCard, isDark && styles.darkVehicleCard]}
              activeOpacity={0.85}
              onPress={() => {
                safeHapticLight();
                router.push({ pathname: '/book', params: { vehicle: 'hatchback' } });
              }}
            >
              <View style={styles.vehicleImageWrap}>
                <Image
                  source={require('../assets/images/home/car_hatchback.png')}
                  style={styles.vehicleCarImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.vehicleCardTitle, isDark && styles.darkVehicleCardTitle]}>
                Hatchback
              </Text>
              <Text style={styles.vehicleCardSub}>Car Wash</Text>
              <View style={styles.pricePill}>
                <Text style={styles.pricePillText}>₹299 Onwards</Text>
              </View>
            </TouchableOpacity>

            {/* Card 2: Sedan */}
            <TouchableOpacity
              style={[styles.vehicleCard, isDark && styles.darkVehicleCard]}
              activeOpacity={0.85}
              onPress={() => {
                safeHapticLight();
                router.push({ pathname: '/book', params: { vehicle: 'sedan' } });
              }}
            >
              <View style={styles.vehicleImageWrap}>
                <Image
                  source={require('../assets/images/home/car_sedan.png')}
                  style={styles.vehicleCarImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.vehicleCardTitle, isDark && styles.darkVehicleCardTitle]}>
                Sedan
              </Text>
              <Text style={styles.vehicleCardSub}>Car Wash</Text>
              <View style={styles.pricePill}>
                <Text style={styles.pricePillText}>₹399 Onwards</Text>
              </View>
            </TouchableOpacity>

            {/* Card 3: SUV */}
            <TouchableOpacity
              style={[styles.vehicleCard, isDark && styles.darkVehicleCard]}
              activeOpacity={0.85}
              onPress={() => {
                safeHapticLight();
                router.push({ pathname: '/book', params: { vehicle: 'suv' } });
              }}
            >
              <View style={styles.vehicleImageWrap}>
                <Image
                  source={require('../assets/images/home/car_suv.png')}
                  style={styles.vehicleCarImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.vehicleCardTitle, isDark && styles.darkVehicleCardTitle]}>
                SUV
              </Text>
              <Text style={styles.vehicleCardSub}>Car Wash</Text>
              <View style={styles.pricePill}>
                <Text style={styles.pricePillText}>₹499 Onwards</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4. MONTHLY SUBSCRIPTION PLANS BANNER ── */}
        <TouchableOpacity
          style={styles.promoBannerCard}
          activeOpacity={0.9}
          onPress={() => {
            safeHapticMedium();
            router.push('/subscriptions');
          }}
        >
          <Image
            source={require('../assets/images/home/subscription_banner.png')}
            style={styles.promoBannerImg}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* ── 5. WHY CHOOSE CLEANATDOORSTEP SECTION ── */}
        <View style={styles.whyUsSection}>
          <Text style={[styles.sectionHeading, isDark && styles.darkSectionHeading, { marginBottom: 12 }]}>
            Why Choose Cleanatdoorstep?
          </Text>

          <View style={styles.whyUsGrid}>
            {/* Feature 1 */}
            <View style={[styles.whyCard, isDark && styles.darkWhyCard]}>
              <View style={styles.whyIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#0284c7" />
              </View>
              <Text style={[styles.whyText, isDark && styles.darkWhyText]}>
                Trained{'\n'}Professionals
              </Text>
            </View>

            {/* Feature 2 */}
            <View style={[styles.whyCard, isDark && styles.darkWhyCard]}>
              <View style={styles.whyIconWrap}>
                <Ionicons name="leaf-outline" size={22} color="#059669" />
              </View>
              <Text style={[styles.whyText, isDark && styles.darkWhyText]}>
                Eco-Friendly{'\n'}Cleaning
              </Text>
            </View>

            {/* Feature 3 */}
            <View style={[styles.whyCard, isDark && styles.darkWhyCard]}>
              <View style={styles.whyIconWrap}>
                <Ionicons name="time-outline" size={22} color="#0284c7" />
              </View>
              <Text style={[styles.whyText, isDark && styles.darkWhyText]}>
                At Your{'\n'}Doorstep
              </Text>
            </View>

            {/* Feature 4 */}
            <View style={[styles.whyCard, isDark && styles.darkWhyCard]}>
              <View style={styles.whyIconWrap}>
                <Ionicons name="ribbon-outline" size={22} color="#d97706" />
              </View>
              <Text style={[styles.whyText, isDark && styles.darkWhyText]}>
                Quality{'\n'}Assurance
              </Text>
            </View>
          </View>
        </View>

        {/* ── 6. REFER & EARN BANNER ── */}
        <TouchableOpacity
          style={styles.promoBannerCard}
          activeOpacity={0.9}
          onPress={() => {
            safeHapticMedium();
            router.push('/refer-and-earn');
          }}
        >
          <Image
            source={require('../assets/images/home/refer_banner.png')}
            style={styles.promoBannerImg}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FIXED BOTTOM NAVIGATION BAR ── */}
      <AppFooter
        activeTab="home"
        isDark={isDark}
        onTabPress={handleFooterTabPress}
      />

      {/* ── LOCATION SELECTOR MODAL ── */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.locationModalCard, isDark && styles.darkLocationModalCard]}>
            <View style={styles.locationModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location" size={20} color="#0284c7" />
                <Text style={[styles.locationModalTitle, isDark && styles.darkLocationModalTitle]}>
                  Select Your Location
                </Text>
              </View>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={22} color={isDark ? '#cbd5e1' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.detectGpsBtn}
              onPress={handleDetectGPS}
              disabled={detectingGps}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-circle-outline" size={22} color="#0284c7" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.detectGpsTitle}>
                  {detectingGps ? 'Detecting your GPS location...' : 'Use Current GPS Location'}
                </Text>
                <Text style={styles.detectGpsSub}>Tap to automatically reverse geocode address</Text>
              </View>
            </TouchableOpacity>

            <Text style={[styles.orDividerText, isDark && styles.darkOrDividerText]}>
              OR ENTER AREA / CITY
            </Text>

            <View style={styles.locationInputRow}>
              <TextInput
                value={manualLocationInput}
                onChangeText={setManualLocationInput}
                placeholder="e.g. Ramesh Nagar, Delhi"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={[styles.locationTextInput, isDark && styles.darkLocationTextInput]}
              />
              <TouchableOpacity
                style={styles.locationSaveBtn}
                onPress={handleSaveManualLocation}
              >
                <Text style={styles.locationSaveBtnText}>Set</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Suggestions */}
            <View style={styles.quickLocationsRow}>
              {['Ramesh Nagar, Delhi', 'Connaught Place, Delhi', 'Noida Sector 18', 'Gurugram CyberHub'].map(
                (loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={styles.suggestionPill}
                    onPress={async () => {
                      safeHapticLight();
                      setCurrentLocation(loc);
                      await AsyncStorage.setItem('header_location', loc);
                      setLocationModalVisible(false);
                    }}
                  >
                    <Text style={styles.suggestionPillText}>{loc}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── HAMBURGER SIDE DRAWER MENU MODAL ── */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.drawerBackdrop}>
          <TouchableOpacity
            style={styles.drawerBackdropDismiss}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          />

          <View style={[styles.drawerContainer, isDark && styles.darkDrawerContainer]}>
            {/* Drawer User Card */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerUserRow}>
                <View style={styles.drawerAvatarWrap}>
                  <Text style={styles.drawerAvatarInitial}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.drawerUserName} numberOfLines={1}>
                    {isLoggedIn && user?.name ? user.name : 'Welcome Guest!'}
                  </Text>
                  <Text style={styles.drawerUserEmail} numberOfLines={1}>
                    {isLoggedIn && user?.email ? user.email : 'Doorstep Car Care Service'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.drawerCloseBtn}
                  onPress={() => setMenuOpen(false)}
                >
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {!isLoggedIn ? (
                <TouchableOpacity
                  style={styles.drawerLoginBtn}
                  onPress={() => {
                    setMenuOpen(false);
                    router.push('/login');
                  }}
                >
                  <Text style={styles.drawerLoginBtnText}>Sign In / Register</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.drawerVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#38bdf8" />
                  <Text style={styles.drawerVerifiedText}>VERIFIED CUSTOMER</Text>
                </View>
              )}
            </View>

            {/* Drawer Navigation Links */}
            <ScrollView style={styles.drawerList} showsVerticalScrollIndicator={false}>
              <Text style={[styles.drawerGroupHeader, isDark && styles.darkDrawerGroupHeader]}>
                EXPLORE & BOOK
              </Text>

              {isLoggedIn && (
                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setMenuOpen(false);
                    router.push('/dashboard');
                  }}
                >
                  <Ionicons name="speedometer-outline" size={20} color="#0284c7" />
                  <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                    Dashboard
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/book');
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#0284c7" />
                <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                  Book Service
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/services');
                }}
              >
                <Ionicons name="sparkles-outline" size={20} color="#0284c7" />
                <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                  Our Wash Packages
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/subscriptions');
                }}
              >
                <Ionicons name="cube-outline" size={20} color="#0284c7" />
                <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                  Monthly Subscriptions
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/bookings');
                }}
              >
                <Ionicons name="file-tray-full-outline" size={20} color="#0284c7" />
                <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                  My Bookings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/garage');
                }}
              >
                <Ionicons name="car-sport-outline" size={20} color="#059669" />
                <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                  My Garage
                </Text>
              </TouchableOpacity>

              <Text style={[styles.drawerGroupHeader, isDark && styles.darkDrawerGroupHeader, { marginTop: 16 }]}>
                REWARDS & WALLET
              </Text>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/refer-and-earn');
                }}
              >
                <Ionicons name="gift-outline" size={20} color="#ea580c" />
                <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                  Refer & Earn (10% Bonus)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/e-points');
                }}
              >
                <Ionicons name="wallet-outline" size={20} color="#ca8a04" />
                <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                  E-Points Wallet
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/offer');
                }}
              >
                <Ionicons name="pricetag-outline" size={20} color="#e11d48" />
                <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                  Coupons & Offers
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/support');
                }}
              >
                <Ionicons name="headset-outline" size={20} color="#6366f1" />
                <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                  Help & Support
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={handleToggleTheme}
              >
                <Ionicons
                  name={isDark ? 'sunny-outline' : 'moon-outline'}
                  size={20}
                  color={isDark ? '#fbbf24' : '#475569'}
                />
                <Text style={[styles.drawerItemText, isDark && styles.darkDrawerItemText]}>
                  {isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                </Text>
              </TouchableOpacity>

              {isLoggedIn && (
                <TouchableOpacity
                  style={[styles.drawerItem, styles.drawerLogoutItem]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                  <Text style={styles.drawerLogoutText}>Sign Out</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkScreenContainer: {
    backgroundColor: '#090d16',
  },

  /* ── Header ── */
  headerContainer: {
    backgroundColor: '#034694', // Clean brand dark-blue gradient background
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  hamburgerBtn: {
    padding: 6,
    borderRadius: 8,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  headerLogoImg: {
    height: 38,
    width: 210,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  authPillBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#034694',
  },

  /* ── Sub Row ── */
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  locationPillText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  referTopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24', // Yellow matching screenshot
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  coinBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  coinBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  referTopPillText: {
    color: '#451a03',
    fontSize: 12,
    fontWeight: '800',
  },

  /* ── Scroll Body ── */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },

  /* ── Hero Banner ── */
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  heroBannerCard: {
    width: BANNER_WIDTH,
    height: HERO_BANNER_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#034694',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  carouselDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#fbbf24', // Active yellow pill
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#cbd5e1',
  },

  /* ── Quick Actions Grid (4 Cards) ── */
  quickActionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 88,
  },
  darkQuickCard: {
    backgroundColor: '#111827',
    borderColor: '#1e293b',
  },
  quickIconWrap: {
    marginBottom: 6,
  },
  quickCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 14,
  },
  darkQuickCardTitle: {
    color: '#f8fafc',
  },
  quickCardSub: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },
  darkQuickCardSub: {
    color: '#94a3b8',
  },

  /* ── Services Section ── */
  servicesSection: {
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  darkSectionHeading: {
    color: '#f8fafc',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#034694',
  },
  vehicleCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  darkVehicleCard: {
    backgroundColor: '#111827',
    borderColor: '#1e293b',
  },
  vehicleImageWrap: {
    width: '100%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  vehicleCarImg: {
    width: '94%',
    height: '100%',
  },
  vehicleCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  darkVehicleCardTitle: {
    color: '#f8fafc',
  },
  vehicleCardSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  pricePill: {
    backgroundColor: '#facc15', // Vibrant yellow pill matching screenshot
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    width: '96%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricePillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },

  /* ── Promo Banners ── */
  promoBannerCard: {
    width: BANNER_WIDTH,
    height: PROMO_BANNER_HEIGHT,
    alignSelf: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  promoBannerImg: {
    width: '100%',
    height: '100%',
  },

  /* ── Why Choose Us Section ── */
  whyUsSection: {
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  whyUsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 8,
  },
  whyCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 82,
  },
  darkWhyCard: {
    backgroundColor: '#111827',
    borderColor: '#1e293b',
  },
  whyIconWrap: {
    marginBottom: 6,
  },
  whyText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 13,
  },
  darkWhyText: {
    color: '#e2e8f0',
  },

  /* ── Location Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  locationModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  darkLocationModalCard: {
    backgroundColor: '#111827',
  },
  locationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  darkLocationModalTitle: {
    color: '#f8fafc',
  },
  detectGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  detectGpsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284c7',
  },
  detectGpsSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  orDividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  darkOrDividerText: {
    color: '#64748b',
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  locationTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a',
  },
  darkLocationTextInput: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    color: '#ffffff',
  },
  locationSaveBtn: {
    height: 44,
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSaveBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  quickLocationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  suggestionPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  suggestionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  /* ── Drawer Menu ── */
  drawerBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  drawerBackdropDismiss: {
    flex: 1,
  },
  drawerContainer: {
    width: 300,
    maxWidth: '85%',
    backgroundColor: '#ffffff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  darkDrawerContainer: {
    backgroundColor: '#111827',
  },
  drawerHeader: {
    backgroundColor: '#034694',
    paddingTop: Platform.OS === 'android' ? 44 : 50,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  drawerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarInitial: {
    fontSize: 20,
    fontWeight: '900',
    color: '#034694',
  },
  drawerUserName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  drawerUserEmail: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  drawerCloseBtn: {
    padding: 6,
  },
  drawerLoginBtn: {
    marginTop: 12,
    backgroundColor: '#facc15',
    paddingVertical: 7,
    borderRadius: 14,
    alignItems: 'center',
  },
  drawerLoginBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#034694',
  },
  drawerVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  drawerVerifiedText: {
    color: '#e0f2fe',
    fontSize: 9.5,
    fontWeight: '800',
  },
  drawerList: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  drawerGroupHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 6,
  },
  darkDrawerGroupHeader: {
    color: '#64748b',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
    marginBottom: 2,
  },
  drawerItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  darkDrawerItemText: {
    color: '#f8fafc',
  },
  drawerLogoutItem: {
    marginTop: 10,
    backgroundColor: '#fff1f2',
  },
  drawerLogoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
});
