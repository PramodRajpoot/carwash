/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  RefreshControl,
  Image,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { API_BASE } from '../constants/api';
import { safeHapticLight, safeHapticSuccess } from '../utils/haptics';
import { showSweetAlert } from '../utils/sweetAlert';

const ITEMS_PER_PAGE = 3;

// Sample fallback packages
const SAMPLE_PACKAGES = [
  {
    id: 1,
    name: 'Happywash Express',
    category_id: 1,
    category: { id: 1, name: 'Carwash' },
    vehicle_type: 'hatchback',
    description: "Foam Exterior Wash\nInterior Vacuum clean\nMat cleaning\nGlass Cleaning\nTyre Dressing",
    price: 245.18,
    frequency_days: 30,
    max_bookings: 4,
    custom_badge: 'POPULAR',
  },
  {
    id: 2,
    name: 'Happy Wash + Car Shine',
    category_id: 1,
    category: { id: 1, name: 'Carwash' },
    vehicle_type: 'hatchback',
    description: "Foam Exterior Wash\nInterior Vacuum clean\nEngine & underbody cleaning\nDashboard Polish\nFull Body Wax",
    price: 409.18,
    frequency_days: 30,
    max_bookings: 4,
    custom_badge: 'BEST VALUE',
  },
  {
    id: 3,
    name: 'Full Interior Spa + Exterior',
    category_id: 1,
    category: { id: 1, name: 'Carwash' },
    vehicle_type: 'sedan',
    description: "Complete interior vacuuming\nDashboard UV polish\nExterior snow foam wash\nTire dressing & rim detail\nAnti-bacterial sanitization",
    price: 799,
    frequency_days: 0,
    max_bookings: 1,
  },
  {
    id: 4,
    name: 'Monthly Premium Detailing Pass',
    category_id: 1,
    category: { id: 1, name: 'Carwash' },
    vehicle_type: 'suv',
    description: "8 Doorstep exterior washes\nBi-weekly deep interior vacuum\nCeramic wax coating touch-up\nEngine bay steam clean",
    price: 2499,
    frequency_days: 30,
    max_bookings: 8,
    custom_badge: 'PREMIUM',
  },
  {
    id: 5,
    name: 'Complete Home Deep Cleaning',
    category_id: 2,
    category: { id: 2, name: 'Home Cleaning' },
    vehicle_type: 'all',
    description: "Living room & bedroom dusting\nBathroom deep scrub & disinfection\nKitchen oil & grease stain removal\nFloor mechanical scrubbing",
    price: 1999,
    frequency_days: 0,
    max_bookings: 1,
  },
  {
    id: 6,
    name: 'Kitchen & Bathroom Sanitization',
    category_id: 2,
    category: { id: 2, name: 'Home Cleaning' },
    vehicle_type: 'all',
    description: "High-pressure tile cleaning\nSink & fixture descaling\nChimney & stove degreasing\nFull anti-microbial steam wipe",
    price: 1299,
    frequency_days: 0,
    max_bookings: 1,
  },
  {
    id: 7,
    name: 'Teflon Coating & Paint Correction',
    category_id: 1,
    category: { id: 1, name: 'Carwash' },
    vehicle_type: 'sedan',
    description: "Multi-stage machine paint polish\nMinor swirl & scratch removal\nHydrophobic Teflon sealant\n12-month shine protection",
    price: 5999,
    frequency_days: 0,
    max_bookings: 1,
    custom_badge: 'TOP SHINE',
  },
  {
    id: 8,
    name: 'Commercial Fleet Maintenance',
    category_id: 1,
    category: { id: 1, name: 'Carwash' },
    vehicle_type: 'commercial',
    description: "Heavy-duty power wash\nChassis & undercarriage pressure rinse\nInterior sanitizing spray\nExpress turnaround time",
    price: 1499,
    frequency_days: 0,
    max_bookings: 1,
  },
];

// Vehicle type filter options (matches wash service page)
const VEHICLE_FILTERS = [
  { label: 'All', icon: 'sparkles-outline', value: 'all' },
  { label: 'Hatchback', icon: 'car-sport-outline', value: 'hatchback' },
  { label: 'Sedan', icon: 'car-outline', value: 'sedan' },
  { label: 'SUV', icon: 'speedometer-outline', value: 'suv' },
  { label: 'Commercial', icon: 'bus-outline', value: 'commercial' },
  { label: 'Bus', icon: 'navigate-outline', value: 'bus' },
  { label: 'Volvo Bus', icon: 'trail-sign-outline', value: 'volvo_bus' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<any>(null);

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState('all');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [expandedPackages, setExpandedPackages] = useState<Record<string | number, boolean>>({});
  const [wishlistPackageIds, setWishlistPackageIds] = useState<number[]>([]);

  const activeVehicleLabel = VEHICLE_FILTERS.find((f) => f.value === activeVehicle)?.label || 'All';

  const fetchWishlist = async (authToken?: string | null) => {
    try {
      const token = authToken !== undefined ? authToken : await AsyncStorage.getItem('userToken');
      if (!token) {
        setWishlistPackageIds([]);
        return;
      }
      const res = await axios.get(`${API_BASE}/api/customer/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
      });
      if (Array.isArray(res.data)) {
        const ids = res.data
          .map((item: any) => item.package_id || item.package?.id)
          .filter(Boolean);
        setWishlistPackageIds(ids);
      }
    } catch (err) {
      console.warn('Wishlist fetch error:', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const checkAuthAndTheme = async () => {
        const token = await AsyncStorage.getItem('userToken');
        setIsLoggedIn(!!token);
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme) {
          setIsDark(storedTheme === 'dark');
        }
        if (token) {
          fetchWishlist(token);
        } else {
          setWishlistPackageIds([]);
        }
      };
      checkAuthAndTheme();
    }, [])
  );

  const toggleTheme = async () => {
    safeHapticLight();
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('app_theme', next ? 'dark' : 'light');
  };

  const handleToggleWishlist = async (pkg: any) => {
    safeHapticLight();
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      showSweetAlert('Sign In Required', 'Please log in to add washes to your wishlist.', 'info');
      router.push('/login');
      return;
    }

    const isFav = wishlistPackageIds.includes(pkg.id);
    // Optimistic update
    setWishlistPackageIds((prev) =>
      isFav ? prev.filter((id) => id !== pkg.id) : [...prev, pkg.id]
    );

    try {
      if (isFav) {
        await axios.delete(`${API_BASE}/api/customer/wishlist/${pkg.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true',
          },
        });
        showSweetAlert('Removed', `${pkg.name} removed from your wishlist.`, 'success');
      } else {
        await axios.post(
          `${API_BASE}/api/customer/wishlist`,
          { package_id: pkg.id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true',
              'Bypass-Tunnel-Reminder': 'true',
            },
          }
        );
        safeHapticSuccess();
        showSweetAlert('Added to Wishlist', `${pkg.name} saved to your wishlist!`, 'success');
      }
    } catch (err: any) {
      // Revert optimistic update
      setWishlistPackageIds((prev) =>
        isFav ? [...prev, pkg.id] : prev.filter((id) => id !== pkg.id)
      );
      showSweetAlert('Error', err.response?.data?.message || 'Failed to update wishlist.', 'error');
    }
  };

  const fetchPackagesData = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/packages`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch {
      console.log('API unreachable, using sample data');
      setPackages(SAMPLE_PACKAGES);
      setError('Showing sample data — server not reachable.');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 600);
    }
  };

  useEffect(() => {
    fetchPackagesData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPackagesData();
  };

  const handleVehicleSelect = (val: string) => {
    safeHapticLight();
    setActiveVehicle(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setCurrentPage(1);
    setVisibleCount(3);
  };

  const handleResetFilters = () => {
    safeHapticLight();
    setActiveVehicle('all');
    setSearchQuery('');
    setCurrentPage(1);
    setVisibleCount(3);
  };

  useEffect(() => {
    setVisibleCount(3);
  }, [activeVehicle, searchQuery]);

  const vehicleCounts = useMemo(() => {
    const activePkgs = packages.filter((pkg) => !pkg.is_addon);
    const counts: Record<string, number> = { all: activePkgs.length };
    for (const vf of VEHICLE_FILTERS) {
      if (vf.value === 'all') continue;
      counts[vf.value] = activePkgs.filter(
        (p) => (p.vehicle_type || '').toLowerCase() === vf.value.toLowerCase()
      ).length;
    }
    return counts;
  }, [packages]);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (pkg.is_addon) return false;

      // Vehicle filter
      if (activeVehicle !== 'all') {
        const pkgVeh = (pkg.vehicle_type || '').toLowerCase();
        if (pkgVeh !== 'all' && pkgVeh !== activeVehicle.toLowerCase()) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (pkg.name || '').toLowerCase();
        const desc = (pkg.description || '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [packages, activeVehicle, searchQuery]);

  const totalItems = filteredPackages.length;
  const visiblePackages = useMemo(() => filteredPackages.slice(0, visibleCount), [filteredPackages, visibleCount]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;
    if (isNearBottom && visibleCount < totalItems) {
      setVisibleCount((prev) => Math.min(prev + 3, totalItems));
    }
  };

  const togglePackageExpand = (id: string | number) => {
    safeHapticLight();
    setExpandedPackages((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderFeaturesList = (desc: string, pkgId: string | number) => {
    if (!desc) return null;
    const allLines = desc
      .split(/\r?\n|•|,/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (allLines.length === 0) return null;

    const isExpanded = !!expandedPackages[pkgId];
    const visibleLines = isExpanded ? allLines : allLines.slice(0, 1);
    const hasMore = allLines.length > 1;

    return (
      <View style={[styles.featuresContainer, !isDark && styles.featuresContainerLight]}>
        {visibleLines.map((item, idx) => {
          const isLastVisible = idx === visibleLines.length - 1;
          const showToggleHere = hasMore && isLastVisible;

          return (
            <View key={idx} style={styles.featureItemRow}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" style={styles.featureCheckIcon} />
              <Text style={[styles.featureItemText, !isDark && styles.featureItemTextLight]}>
                {item}
                {showToggleHere && (
                  <Text
                    style={styles.readMoreInlineText}
                    onPress={() => togglePackageExpand(pkgId)}
                  >
                    {isExpanded ? '  Read Less...' : '  Read More...'}
                  </Text>
                )}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, !isDark && styles.containerLight]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.splashContainer, !isDark && styles.containerLight]}>
          <View style={styles.splashBadge}>
            <Image 
              source={require('../assets/images/icon.png')} 
              style={styles.splashLogo}
              resizeMode="contain"
            />
          </View>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={[styles.loaderText, !isDark && styles.loaderTextLight]}>Loading Packages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, !isDark && styles.containerLight]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Top Header ── */}
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        <View style={styles.brandRow}>
          <View style={styles.headerLogoContainer}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.brandTextWrap}>
            <Text style={[styles.headerTitle, !isDark && styles.headerTitleLight]}>CleanAtDoorstep</Text>
            <Text style={[styles.headerSubtitle, !isDark && styles.headerSubtitleLight]}>Doorstep Detailing • On-Demand</Text>
          </View>
        </View>

        <View style={styles.headerRightRow}>
          <TouchableOpacity
            style={[styles.headerIconBtn, isDark ? styles.headerIconBtnDark : styles.headerIconBtnLight]}
            onPress={() => router.push(isLoggedIn ? '/wishlist' : '/login')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={wishlistPackageIds.length > 0 ? 'heart' : 'heart-outline'}
              size={18}
              color={wishlistPackageIds.length > 0 ? '#e11d48' : isDark ? '#94a3b8' : '#334155'}
            />
            {wishlistPackageIds.length > 0 && (
              <View style={styles.wishlistCountBadge}>
                <Text style={styles.wishlistCountBadgeText}>{wishlistPackageIds.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtnHeader, isDark ? styles.loginBtnHeaderDark : styles.loginBtnHeaderLight]}
            onPress={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isLoggedIn ? 'speedometer-outline' : 'person-circle-outline'}
              size={12}
              color="#38bdf8"
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.loginBtnHeaderText, isDark ? styles.loginBtnHeaderTextDark : styles.loginBtnHeaderTextLight]}>
              {isLoggedIn ? 'Dashboard' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, isDark ? styles.headerIconBtnDark : styles.headerIconBtnLight]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color={isDark ? '#fbbf24' : '#334155'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Vehicle Filter Modal Dropdown (exact match to bookings.tsx UX) ── */}
      <Modal
        visible={filterMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterMenuVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setFilterMenuVisible(false)}
        >
          <View style={[styles.filterMenuDropdown, !isDark && styles.filterMenuDropdownLight]}>
            <View style={styles.filterMenuHeader}>
              <View style={styles.filterMenuTitleWrap}>
                <Ionicons name="funnel" size={14} color="#38bdf8" />
                <Text style={[styles.filterMenuHeading, !isDark && styles.filterMenuHeadingLight]}>Filter by Vehicle</Text>
              </View>
              {activeVehicle !== 'all' && (
                <TouchableOpacity
                  onPress={() => {
                    safeHapticLight();
                    handleVehicleSelect('all');
                    setFilterMenuVisible(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearFilterText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.filterMenuDivider, !isDark && styles.filterMenuDividerLight]} />

            {VEHICLE_FILTERS.map((option) => {
              const isSelected = activeVehicle === option.value;
              const count = vehicleCounts[option.value] ?? 0;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterMenuItem,
                    isSelected && (isDark ? styles.activeFilterMenuItem : styles.activeFilterMenuItemLight),
                  ]}
                  onPress={() => {
                    safeHapticLight();
                    handleVehicleSelect(option.value);
                    setFilterMenuVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={16}
                    color={isSelected ? '#38bdf8' : (isDark ? '#94a3b8' : '#64748b')}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={[
                      styles.filterMenuItemText,
                      !isDark && styles.filterMenuItemTextLight,
                      isSelected && styles.activeFilterMenuItemText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <View
                    style={[
                      styles.filterMenuCountBadge,
                      !isDark && styles.filterMenuCountBadgeLight,
                      isSelected && styles.filterMenuCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterMenuCountText,
                        !isDark && styles.filterMenuCountTextLight,
                        isSelected && styles.filterMenuCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#38bdf8"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, !isDark && styles.containerLight]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0ea5e9"
            colors={['#0ea5e9']}
          />
        }
      >
        {/* ── Section Title: Our Services ── */}
        <View style={styles.servicesHeaderWrap}>
          <Text style={[styles.servicesTitle, !isDark && styles.servicesTitleLight]}>Our Services</Text>
        </View>

        {/* ── Search Bar & Filter Button ── */}
        <View style={styles.searchRowWrapper}>
          <View style={[styles.searchContainer, !isDark && styles.searchContainerLight]}>
            <Ionicons name="search-outline" size={18} color={isDark ? '#64748b' : '#94a3b8'} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, !isDark && styles.searchInputLight]}
              placeholder="Search services (e.g. Foam, Deep, Coating)..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Vehicle Filter Button (right of search input) */}
          <TouchableOpacity
            style={[
              styles.searchFilterTrigger,
              !isDark && styles.searchFilterTriggerLight,
              activeVehicle !== 'all' && styles.searchFilterTriggerActive,
            ]}
            onPress={() => {
              safeHapticLight();
              setFilterMenuVisible((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="funnel-outline"
              size={18}
              color={activeVehicle !== 'all' ? '#38bdf8' : (isDark ? '#cbd5e1' : '#475569')}
            />
            {activeVehicle !== 'all' && <View style={styles.activeFilterDot} />}
          </TouchableOpacity>
        </View>

        {/* ── Items Counter & Quick Summary ── */}
        <View style={styles.resultsSummaryRow}>
          <View style={styles.resultsCountWrap}>
            <Text style={[styles.resultsCountText, !isDark && styles.resultsCountTextLight]}>
              Showing <Text style={[styles.highlightText, !isDark && styles.highlightTextLight]}>{totalItems > 0 ? 1 : 0}</Text>–
              <Text style={[styles.highlightText, !isDark && styles.highlightTextLight]}>{Math.min(visiblePackages.length, totalItems)}</Text> of{' '}
              <Text style={[styles.highlightText, !isDark && styles.highlightTextLight]}>{totalItems}</Text> Services
            </Text>
            {activeVehicle !== 'all' && (
              <TouchableOpacity
                style={styles.activeVehicleChip}
                onPress={() => handleVehicleSelect('all')}
                activeOpacity={0.7}
              >
                <Text style={styles.activeVehicleChipText}>{activeVehicleLabel}</Text>
                <Ionicons name="close-circle" size={13} color="#38bdf8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {error && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#38bdf8" />
            <Text style={styles.infoBannerText}>{error}</Text>
          </View>
        )}

        {/* ── Package Cards ── */}
        {visiblePackages.length === 0 ? (
          <View style={[styles.emptyContainer, !isDark && styles.emptyContainerLight]}>
            <View style={[styles.emptyIconCircle, !isDark && styles.emptyIconCircleLight]}>
              <Ionicons name="search-outline" size={40} color={isDark ? '#64748b' : '#94a3b8'} />
            </View>
            <Text style={[styles.emptyTitle, !isDark && styles.emptyTitleLight]}>No Services Found</Text>
            <Text style={[styles.emptyText, !isDark && styles.emptyTextLight]}>
              We could not find any packages matching your active category and filters.
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetFilters}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.resetBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          visiblePackages.map((pkg) => {
            const hasMonthly = pkg.frequency_days > 0;
            const isWishlisted = wishlistPackageIds.includes(pkg.id);

            return (
              <View key={pkg.id} style={[styles.card, !isDark && styles.cardLight]}>
                {/* Badges Header */}
                <View style={styles.cardBadgesRow}>
                  <View style={styles.leftBadges}>
                    {pkg.vehicle_type && (
                      <View style={[styles.badgeVehicle, !isDark && styles.badgeVehicleLight]}>
                        <Ionicons name="car-sport-outline" size={10} color={isDark ? '#cbd5e1' : '#64748b'} style={{ marginRight: 3 }} />
                        <Text style={[styles.badgeVehicleText, !isDark && styles.badgeVehicleTextLight]}>
                          {pkg.vehicle_type.toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {hasMonthly ? (
                      <View style={styles.badgeGreen}>
                        <Text style={styles.badgeGreenText}>MONTHLY PASS</Text>
                      </View>
                    ) : (
                      <View style={styles.badgePurple}>
                        <Text style={styles.badgePurpleText}>ONE-TIME WASH</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.rightBadgesGroup}>
                    {pkg.custom_badge && (
                      <View style={styles.badgeHighlight}>
                        <Text style={styles.badgeHighlightText}>
                          {pkg.custom_badge}
                        </Text>
                      </View>
                    )}

                    {/* Wishlist Heart Icon Button */}
                    <TouchableOpacity
                      style={[
                        styles.wishlistHeartBtn,
                        isWishlisted && styles.wishlistHeartBtnActive,
                        !isDark && styles.wishlistHeartBtnLight,
                      ]}
                      onPress={() => handleToggleWishlist(pkg)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={isWishlisted ? 'heart' : 'heart-outline'}
                        size={17}
                        color={isWishlisted ? '#e11d48' : isDark ? '#94a3b8' : '#64748b'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Package Title */}
                <Text style={[styles.cardTitle, !isDark && styles.cardTitleLight]}>{pkg.name}</Text>

                {/* Key Features Breakdown */}
                {renderFeaturesList(pkg.description, pkg.id)}

                {/* Price + CTA Footer */}
                <View style={[styles.cardFooter, !isDark && styles.cardFooterLight]}>
                  <View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceSymbol}>₹</Text>
                      <Text style={[styles.priceValue, !isDark && styles.priceValueLight]}>
                        {typeof pkg.price === 'number' ? pkg.price.toFixed(2) : pkg.price}
                      </Text>
                      {hasMonthly && <Text style={[styles.priceUnit, !isDark && styles.priceUnitLight]}> / mo</Text>}
                    </View>
                    {pkg.max_bookings > 1 && (
                      <View style={styles.washCountRow}>
                        <Ionicons name="flash" size={12} color="#10b981" />
                        <Text style={[styles.washCount, !isDark && styles.washCountLight]}>
                          {pkg.max_bookings} washes included
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.bookBtn}
                    onPress={() => router.push(isLoggedIn ? `/book?package_id=${pkg.id}` : '/login')}
                  >
                    <Text style={styles.bookBtnText}>Book Wash</Text>
                    <Ionicons name="arrow-forward" size={15} color="#ffffff" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {visibleCount < totalItems && (
          <View style={styles.loadMoreHint}>
            <Text style={[styles.loadMoreHintText, !isDark && styles.loadMoreHintTextLight]}>Scroll for more services</Text>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080c15', // Rich luxury dark background
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080c15',
  },
  splashBadge: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  splashLogo: {
    width: 56,
    height: 56,
  },
  loaderText: {
    color: '#94a3b8',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },

  /* ── Header ── */
  header: {
    backgroundColor: '#dfefff',
    borderRadius: 22,
    marginTop: 50,
    marginHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.22)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#7dd3fc',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  brandTextWrap: {
    flex: 1,
  },
  headerLogoContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '600',
  },
  loginBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf5ff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    minWidth: 92,
  },
  loginBtnHeaderText: {
    color: '#0ea5e9',
    fontSize: 10,
    fontWeight: '800',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  activeFilterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#38bdf8',
  },

  /* ── Filter Modal Dropdown ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'android' ? 142 : 156,
    paddingRight: 16,
  },
  filterMenuDropdown: {
    width: 220,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  filterMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterMenuTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterMenuHeading: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  clearFilterText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  filterMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  activeFilterMenuItem: {
    backgroundColor: 'rgba(14, 165, 233, 0.14)',
  },
  filterMenuItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  activeFilterMenuItemText: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  filterMenuCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  filterMenuCountBadgeActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  filterMenuCountText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  filterMenuCountTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },

  /* ── ScrollView ── */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },

  /* ── Section Title: Our Services ── */
  servicesHeaderWrap: {
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  servicesTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  /* ── Search Bar & Filter ── */
  searchRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    paddingVertical: 0,
  },
  searchFilterTrigger: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  searchFilterTriggerActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.18)',
    borderColor: '#38bdf8',
  },

  /* ── Results Summary ── */
  resultsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
    gap: 8,
  },
  resultsCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  resultsCountText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  highlightText: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  activeVehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeVehicleChipText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── Info Banner ── */
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    gap: 6,
  },
  infoBannerText: {
    color: '#38bdf8',
    fontSize: 12,
  },

  /* ── Empty State ── */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
    marginHorizontal: 16,
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d9488',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ── Package Card ── */
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  badgeVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeVehicleText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreenText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgePurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePurpleText: {
    color: '#c084fc',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeHighlightText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  rightBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wishlistHeartBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistHeartBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  wishlistHeartBtnActive: {
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderColor: 'rgba(225, 29, 72, 0.35)',
  },
  wishlistCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#e11d48',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  wishlistCountBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.2,
  },

  /* ── Features Breakdown ── */
  featuresContainer: {
    gap: 6,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 12,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureCheckIcon: {
    marginTop: 2,
  },
  featureItemText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 12.5,
    lineHeight: 18,
  },
  readMoreInlineText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── Card Footer ── */
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceSymbol: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '700',
  },
  priceValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  priceUnit: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  washCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  washCount: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d9488',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ── Pagination (matching bookings.tsx / screenshot: < 1/4 >) ── */
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
  },
  pageNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pageNavBtnDisabled: {
    opacity: 0.35,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  pageIndicator: {
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageIndicatorText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#f8fafc',
  },
  loadMoreHint: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreHintText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  loadMoreHintTextLight: {
    color: '#64748b',
  },

  /* ── Header Icon Button ── */
  headerIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f8ff',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  headerIconBtnDark: {
    backgroundColor: '#111827',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  headerIconBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  loginBtnHeaderDark: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.24)',
  },
  loginBtnHeaderLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  loginBtnHeaderTextDark: {
    color: '#7dd3fc',
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  headerDark: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(56, 189, 248, 0.2)',
    shadowColor: '#020817',
  },

  /* ── Light Mode Overrides ── */
  containerLight: {
    backgroundColor: '#f8fafc',
  },
  loaderTextLight: {
    color: '#64748b',
  },
  loginBtnHeaderTextLight: {
    color: '#0284c7',
  },
  headerTitleLight: {
    color: '#0f172a',
  },
  headerSubtitleLight: {
    color: '#64748b',
  },
  servicesTitleLight: {
    color: '#0f172a',
  },
  searchContainerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  searchInputLight: {
    color: '#0f172a',
  },
  searchFilterTriggerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  resultsCountTextLight: {
    color: '#64748b',
  },
  highlightTextLight: {
    color: '#0f172a',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitleLight: {
    color: '#0f172a',
  },
  cardFooterLight: {
    borderTopColor: '#f1f5f9',
  },
  badgeVehicleLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  badgeVehicleTextLight: {
    color: '#475569',
  },
  featuresContainerLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
  },
  featureItemTextLight: {
    color: '#334155',
  },
  priceValueLight: {
    color: '#0f172a',
  },
  priceUnitLight: {
    color: '#64748b',
  },
  washCountLight: {
    color: '#059669',
  },
  emptyContainerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  emptyIconCircleLight: {
    backgroundColor: '#f1f5f9',
  },
  emptyTitleLight: {
    color: '#0f172a',
  },
  emptyTextLight: {
    color: '#64748b',
  },
  pageNavBtnLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  pageIndicatorLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  pageIndicatorTextLight: {
    color: '#334155',
  },
  filterMenuDropdownLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  filterMenuHeadingLight: {
    color: '#0f172a',
  },
  filterMenuDividerLight: {
    backgroundColor: '#f1f5f9',
  },
  filterMenuItemTextLight: {
    color: '#334155',
  },
  filterMenuCountBadgeLight: {
    backgroundColor: '#f1f5f9',
  },
  filterMenuCountTextLight: {
    color: '#64748b',
  },
  activeFilterMenuItemLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
});
