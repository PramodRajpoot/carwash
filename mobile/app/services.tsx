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
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { API_BASE } from '../constants/api';
import { safeHapticLight, safeHapticSuccess } from '../utils/haptics';
import { showSweetAlert } from '../utils/sweetAlert';
import { useAppTheme } from '../utils/themeManager';

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
  {
    id: 9,
    name: 'Sofa Cleaning',
    category_id: 2,
    category: { id: 2, name: 'Home Cleaning' },
    vehicle_type: '5-8_seater_sofa',
    description: "Deep fabric foam cleaning\nDust mite & allergen extraction\nStain spot treatment\nQuick-dry sanitization",
    price: 800,
    frequency_days: 1,
    max_bookings: 1,
  },
  {
    id: 10,
    name: 'Sofa Cleaning',
    category_id: 2,
    category: { id: 2, name: 'Home Cleaning' },
    vehicle_type: '3-5_seater_sofa',
    description: "Deep fabric foam cleaning\nDust mite & allergen extraction\nStain spot treatment\nQuick-dry sanitization",
    price: 600,
    frequency_days: 1,
    max_bookings: 1,
  },
];

// Helper to format service type names (e.g. 5-8_seater_sofa -> 5-8 Seater Sofa)
function formatTypeName(code?: string): string {
  if (!code) return '';
  if (code.toLowerCase() === 'all') return 'All';
  if (code.toLowerCase() === 'volvo_bus') return 'Volvo Bus';
  return code
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

// Helper to choose appropriate icons
function getTypeIcon(code?: string, categoryName?: string): string {
  const c = (code || '').toLowerCase();
  const cat = (categoryName || '').toLowerCase();
  if (c === 'all') return 'sparkles-outline';
  if (c.includes('hatchback')) return 'car-sport-outline';
  if (c.includes('sedan')) return 'car-outline';
  if (c.includes('suv')) return 'speedometer-outline';
  if (c.includes('commercial')) return 'bus-outline';
  if (c.includes('volvo')) return 'trail-sign-outline';
  if (c.includes('bus')) return 'navigate-outline';
  if (c.includes('sofa') || cat.includes('home')) return 'bed-outline';
  return 'cube-outline';
}

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
  const localParams = useLocalSearchParams<{ search?: string; category?: string }>();
  const scrollViewRef = useRef<any>(null);

  const [packages, setPackages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Category ('all', 'Carwash', 'Home Cleaning', etc.)
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (typeof localParams?.category === 'string' && localParams.category) {
      if (localParams.category.toLowerCase().includes('home')) return 'all';
      return localParams.category;
    }
    return 'all';
  });

  // Active Sub-filter (specific vehicle type or home cleaning service type)
  const [activeSubFilter, setActiveSubFilter] = useState('all');

  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof localParams?.search === 'string' && localParams.search.toLowerCase() !== 'home') {
      return localParams.search;
    }
    return '';
  });

  useEffect(() => {
    if (typeof localParams?.category === 'string' && localParams.category) {
      if (localParams.category.toLowerCase().includes('home')) {
        showSweetAlert('Coming Soon', 'Home Cleaning service is coming soon!', 'info');
        setActiveCategory('all');
      } else {
        setActiveCategory(localParams.category);
      }
      setActiveSubFilter('all');
    } else if (typeof localParams?.search === 'string' && localParams.search) {
      if (localParams.search.toLowerCase() === 'home') {
        showSweetAlert('Coming Soon', 'Home Cleaning service is coming soon!', 'info');
        setActiveCategory('all');
        setActiveSubFilter('all');
        setSearchQuery('');
      } else {
        setSearchQuery(localParams.search);
      }
    }
  }, [localParams?.category, localParams?.search]);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { isDark, toggleTheme } = useAppTheme();
  const [expandedPackages, setExpandedPackages] = useState<Record<string | number, boolean>>({});
  const [wishlistPackageIds, setWishlistPackageIds] = useState<number[]>([]);

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
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem('userToken');
        setIsLoggedIn(!!token);
        if (token) {
          fetchWishlist(token);
        } else {
          setWishlistPackageIds([]);
        }
      };
      checkAuth();
    }, [])
  );

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
      const headers: Record<string, string> = {
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      };

      const [pkgRes, catRes, stRes] = await Promise.all([
        axios.get(`${API_BASE}/api/packages`, { headers }).catch(() => null),
        axios.get(`${API_BASE}/api/categories`, { headers }).catch(() => null),
        axios.get(`${API_BASE}/api/service-types`, { headers }).catch(() => null),
      ]);

      if (pkgRes && Array.isArray(pkgRes.data) && pkgRes.data.length > 0) {
        setPackages(pkgRes.data);
      } else {
        setPackages(SAMPLE_PACKAGES);
      }

      if (catRes && Array.isArray(catRes.data) && catRes.data.length > 0) {
        setCategories(catRes.data);
      }
      if (stRes && Array.isArray(stRes.data) && stRes.data.length > 0) {
        setServiceTypes(stRes.data);
      }
    } catch {
      console.log('API unreachable, using sample data');
      setPackages(SAMPLE_PACKAGES);
      setError('Showing sample data — server not reachable.');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 500);
    }
  };

  useEffect(() => {
    fetchPackagesData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPackagesData();
  };

  const handleCategorySelect = (catValue: string) => {
    safeHapticLight();
    if (catValue.toLowerCase().includes('home')) {
      showSweetAlert('Coming Soon', 'Home Cleaning service is coming soon!', 'info');
      return;
    }
    setActiveCategory(catValue);
    setActiveSubFilter('all');
    setCurrentPage(1);
    setVisibleCount(3);
  };

  const handleSubFilterSelect = (val: string) => {
    safeHapticLight();
    setActiveSubFilter(val);
    setCurrentPage(1);
    setVisibleCount(3);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setCurrentPage(1);
    setVisibleCount(3);
  };

  const handleResetFilters = () => {
    safeHapticLight();
    setActiveCategory('all');
    setActiveSubFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
    setVisibleCount(3);
  };

  useEffect(() => {
    setVisibleCount(3);
  }, [activeCategory, activeSubFilter, searchQuery]);

  // Dynamic Category Pills List
  const categoryList = useMemo(() => {
    const list: Array<{ label: string; value: string; icon: string }> = [
      { label: 'All Services', value: 'all', icon: 'sparkles-outline' },
    ];

    const knownCats = new Set<string>();

    if (categories.length > 0) {
      categories.forEach((c) => {
        if (c.name && !knownCats.has(c.name.toLowerCase())) {
          knownCats.add(c.name.toLowerCase());
          list.push({
            label: c.name,
            value: c.name,
            icon: c.name.toLowerCase().includes('home') ? 'home-outline' : 'car-sport-outline',
          });
        }
      });
    }

    packages.forEach((p) => {
      const cName = p.category?.name || p.category_name;
      if (cName && !knownCats.has(cName.toLowerCase())) {
        knownCats.add(cName.toLowerCase());
        list.push({
          label: cName,
          value: cName,
          icon: cName.toLowerCase().includes('home') ? 'home-outline' : 'car-sport-outline',
        });
      }
    });

    if (!knownCats.has('carwash')) {
      list.push({ label: 'Carwash', value: 'Carwash', icon: 'car-sport-outline' });
    }
    if (!knownCats.has('home cleaning')) {
      list.push({ label: 'Home Cleaning', value: 'Home Cleaning', icon: 'home-outline' });
    }

    return list;
  }, [categories, packages]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const activePkgs = packages.filter(
      (pkg) =>
        !pkg.is_addon &&
        !pkg.is_subscription &&
        (Number(pkg.frequency_days || 0) < 30 || Number(pkg.max_bookings || 1) <= 1)
    );
    const counts: Record<string, number> = { all: activePkgs.length };

    categoryList.forEach((cat) => {
      if (cat.value === 'all') return;
      counts[cat.value] = activePkgs.filter((p) => {
        const cName = (p.category?.name || p.category_name || '').toLowerCase();
        return cName === cat.value.toLowerCase();
      }).length;
    });

    return counts;
  }, [packages, categoryList]);

  // Is Home or Carwash category active
  const isHomeCategory = useMemo(() => activeCategory.toLowerCase().includes('home'), [activeCategory]);
  const isCarCategory = useMemo(() => activeCategory.toLowerCase().includes('carwash'), [activeCategory]);

  const filterModalTitle = useMemo(() => {
    if (isHomeCategory) return 'Filter by Service Type';
    if (isCarCategory) return 'Filter by Vehicle';
    return 'Filter by Vehicle & Type';
  }, [isHomeCategory, isCarCategory]);

  // Dynamic Sub-filters based on the active category
  const dynamicFilterOptions = useMemo(() => {
    const basePkgs = packages.filter((p) => {
      if (
        p.is_addon ||
        p.is_subscription ||
        Number(p.frequency_days || 0) >= 30 ||
        Number(p.max_bookings || 1) > 1
      ) {
        return false;
      }
      if (activeCategory === 'all') return true;
      const cName = (p.category?.name || p.category_name || '').toLowerCase();
      return cName === activeCategory.toLowerCase();
    });

    if (isHomeCategory) {
      // Home Cleaning Sub-filters: collect distinct service types from Home Cleaning packages
      const typeMap = new Map<string, { label: string; value: string; icon: string; count: number }>();

      basePkgs.forEach((p) => {
        const rawCode = (p.vehicle_type || '').toLowerCase();
        if (rawCode && rawCode !== 'all') {
          if (!typeMap.has(rawCode)) {
            const st = serviceTypes.find((t) => t.code?.toLowerCase() === rawCode);
            const label = st ? st.name : formatTypeName(rawCode);
            typeMap.set(rawCode, {
              label,
              value: rawCode,
              icon: 'bed-outline',
              count: 0,
            });
          }
          typeMap.get(rawCode)!.count += 1;
        }
      });

      return [
        { label: 'All Home Cleaning', value: 'all', icon: 'sparkles-outline', count: basePkgs.length },
        ...Array.from(typeMap.values()),
      ];
    }

    if (isCarCategory) {
      // Carwash Sub-filters: Hatchback, Sedan, SUV, Commercial, Bus, Volvo Bus
      return VEHICLE_FILTERS.map((vf) => {
        const count =
          vf.value === 'all'
            ? basePkgs.length
            : basePkgs.filter((p) => (p.vehicle_type || '').toLowerCase() === vf.value.toLowerCase()).length;
        return {
          ...vf,
          count,
        };
      });
    }

    // "All Services" category: show All, followed by Vehicle types, followed by Home types
    const carOptions = VEHICLE_FILTERS.filter((vf) => vf.value !== 'all').map((vf) => ({
      ...vf,
      count: basePkgs.filter((p) => (p.vehicle_type || '').toLowerCase() === vf.value.toLowerCase()).length,
    }));

    const homeTypes = new Set<string>();
    const homeOptions: Array<{ label: string; value: string; icon: string; count: number }> = [];

    basePkgs
      .filter((p) => (p.category?.name || p.category_name || '').toLowerCase().includes('home'))
      .forEach((p) => {
        const code = (p.vehicle_type || '').toLowerCase();
        if (code && code !== 'all' && !homeTypes.has(code)) {
          homeTypes.add(code);
          const st = serviceTypes.find((t) => t.code?.toLowerCase() === code);
          const label = st ? st.name : formatTypeName(code);
          const count = basePkgs.filter((item) => (item.vehicle_type || '').toLowerCase() === code).length;
          homeOptions.push({
            label,
            value: code,
            icon: 'bed-outline',
            count,
          });
        }
      });

    return [
      { label: 'All Services', value: 'all', icon: 'sparkles-outline', count: basePkgs.length },
      ...carOptions,
      ...homeOptions,
    ];
  }, [packages, activeCategory, isHomeCategory, isCarCategory, serviceTypes]);

  const activeSubFilterLabel = useMemo(() => {
    const found = dynamicFilterOptions.find((f) => f.value.toLowerCase() === activeSubFilter.toLowerCase());
    return found ? found.label : formatTypeName(activeSubFilter);
  }, [dynamicFilterOptions, activeSubFilter]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (
        pkg.is_addon ||
        pkg.is_subscription ||
        Number(pkg.frequency_days || 0) >= 30 ||
        Number(pkg.max_bookings || 1) > 1
      ) {
        return false;
      }

      const pkgCatName = (pkg.category?.name || pkg.category_name || '').toLowerCase();
      const pkgVehType = (pkg.vehicle_type || '').toLowerCase();

      // 1. Category Filter
      if (activeCategory !== 'all') {
        const targetCat = activeCategory.toLowerCase();
        if (pkgCatName !== targetCat) {
          return false;
        }
      }

      // 2. Sub-Filter (Vehicle / Service Type)
      if (activeSubFilter !== 'all') {
        const targetFilter = activeSubFilter.toLowerCase();
        if (pkgVehType !== 'all' && pkgVehType !== targetFilter) {
          return false;
        }
      }

      // 3. Search query: checks name, description, category, vehicle/service type, and custom badge
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (pkg.name || '').toLowerCase();
        const desc = (pkg.description || '').toLowerCase();
        const formattedType = formatTypeName(pkgVehType).toLowerCase();
        const badge = (pkg.custom_badge || '').toLowerCase();

        const matches =
          name.includes(q) ||
          desc.includes(q) ||
          pkgCatName.includes(q) ||
          pkgVehType.includes(q) ||
          formattedType.includes(q) ||
          badge.includes(q);

        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [packages, activeCategory, activeSubFilter, searchQuery]);

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
              source={require('../assets/images/carawashlogo.png')} 
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
              source={require('../assets/images/logo.png')}
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

      {/* ── Dynamic Category / Type Filter Dropdown ── */}
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
                <Text style={[styles.filterMenuHeading, !isDark && styles.filterMenuHeadingLight]} numberOfLines={1}>
                  {filterModalTitle}
                </Text>
              </View>
              {activeSubFilter !== 'all' && (
                <TouchableOpacity
                  onPress={() => {
                    safeHapticLight();
                    handleSubFilterSelect('all');
                    setFilterMenuVisible(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearFilterText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.filterMenuDivider, !isDark && styles.filterMenuDividerLight]} />

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {dynamicFilterOptions.map((option) => {
                const isSelected = activeSubFilter.toLowerCase() === option.value.toLowerCase();
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterMenuItem,
                      isSelected && (isDark ? styles.activeFilterMenuItem : styles.activeFilterMenuItemLight),
                    ]}
                    onPress={() => {
                      safeHapticLight();
                      handleSubFilterSelect(option.value);
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
                      numberOfLines={1}
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
                        {option.count}
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
            </ScrollView>
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

        {/* ── Category Filter Pills Bar ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsContainer}
          style={styles.categoryPillsScroll}
        >
          {categoryList.map((cat) => {
            const isSelected = activeCategory.toLowerCase() === cat.value.toLowerCase();
            const count = categoryCounts[cat.value] ?? 0;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryPill,
                  !isDark && styles.categoryPillLight,
                  isSelected && (isDark ? styles.categoryPillActive : styles.categoryPillActiveLight),
                ]}
                onPress={() => handleCategorySelect(cat.value)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    !isDark && styles.categoryPillTextLight,
                    isSelected && (isDark ? styles.categoryPillTextActiveDark : styles.categoryPillTextActiveLight),
                  ]}
                >
                  {cat.label}
                </Text>
                <View
                  style={[
                    styles.categoryPillCount,
                    !isDark && styles.categoryPillCountLight,
                    isSelected && styles.categoryPillCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillCountText,
                      !isDark && styles.categoryPillCountTextLight,
                      isSelected && styles.categoryPillCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Search Bar & Filter Button ── */}
        <View style={styles.searchRowWrapper}>
          <View style={[styles.searchContainer, !isDark && styles.searchContainerLight]}>
            <Ionicons name="search-outline" size={18} color={isDark ? '#64748b' : '#94a3b8'} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, !isDark && styles.searchInputLight]}
              placeholder="Search services (e.g. Sofa, Foam, Deep)..."
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

          {/* Sub-filter Button (right of search input) */}
          <TouchableOpacity
            style={[
              styles.searchFilterTrigger,
              !isDark && styles.searchFilterTriggerLight,
              activeSubFilter !== 'all' && styles.searchFilterTriggerActive,
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
              color={activeSubFilter !== 'all' ? '#38bdf8' : (isDark ? '#cbd5e1' : '#475569')}
            />
            {activeSubFilter !== 'all' && <View style={styles.activeFilterDot} />}
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
            {activeSubFilter !== 'all' && (
              <TouchableOpacity
                style={styles.activeVehicleChip}
                onPress={() => handleSubFilterSelect('all')}
                activeOpacity={0.7}
              >
                <Text style={styles.activeVehicleChipText}>{activeSubFilterLabel}</Text>
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
            const isHomeService =
              (pkg.category?.name || pkg.category_name || '').toLowerCase().includes('home') ||
              (pkg.vehicle_type || '').toLowerCase().includes('sofa');

            return (
              <View key={pkg.id} style={[styles.card, !isDark && styles.cardLight]}>
                {/* Badges Header */}
                <View style={styles.cardBadgesRow}>
                  <View style={styles.leftBadges}>
                    {isHomeService ? (
                      <View style={[styles.badgeHome, !isDark && styles.badgeHomeLight]}>
                        <Ionicons name="home-outline" size={10} color="#10b981" style={{ marginRight: 3 }} />
                        <Text style={[styles.badgeHomeText, !isDark && styles.badgeHomeTextLight]}>
                          {formatTypeName(pkg.vehicle_type && pkg.vehicle_type !== 'all' ? pkg.vehicle_type : 'Home Cleaning').toUpperCase()}
                        </Text>
                      </View>
                    ) : pkg.vehicle_type ? (
                      <View style={[styles.badgeVehicle, !isDark && styles.badgeVehicleLight]}>
                        <Ionicons name="car-sport-outline" size={10} color={isDark ? '#cbd5e1' : '#64748b'} style={{ marginRight: 3 }} />
                        <Text style={[styles.badgeVehicleText, !isDark && styles.badgeVehicleTextLight]}>
                          {pkg.vehicle_type.toUpperCase()}
                        </Text>
                      </View>
                    ) : null}

                    {hasMonthly ? (
                      <View style={styles.badgeGreen}>
                        <Text style={styles.badgeGreenText}>MONTHLY PASS</Text>
                      </View>
                    ) : (
                      <View style={styles.badgePurple}>
                        <Text style={styles.badgePurpleText}>
                          {isHomeService ? 'ONE-TIME SERVICE' : 'ONE-TIME WASH'}
                        </Text>
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
                          {pkg.max_bookings} {isHomeService ? 'services' : 'washes'} included
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.bookBtn}
                    onPress={() => {
                      if (isHomeService) {
                        showSweetAlert('Coming Soon', 'Home Cleaning service is coming soon!', 'info');
                        return;
                      }
                      router.push(
                        isLoggedIn
                          ? `/book?package_id=${pkg.id}&category=Carwash`
                          : '/login'
                      );
                    }}
                  >
                    <Text style={styles.bookBtnText}>{isHomeService ? 'Book Service' : 'Book Wash'}</Text>
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  splashLogo: {
    width: 100,
    height: 58,
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 34,
    height: 26,
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
    width: 240,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingVertical: 8,
    maxHeight: 380,
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

  /* ── Category Filter Pills ── */
  categoryPillsScroll: {
    marginBottom: 14,
  },
  categoryPillsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryPillLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: '#38bdf8',
  },
  categoryPillActiveLight: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  categoryPillTextLight: {
    color: '#64748b',
  },
  categoryPillTextActiveDark: {
    color: '#38bdf8',
  },
  categoryPillTextActiveLight: {
    color: '#0284c7',
  },
  categoryPillCount: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryPillCountLight: {
    backgroundColor: '#f1f5f9',
  },
  categoryPillCountActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  categoryPillCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },
  categoryPillCountTextLight: {
    color: '#64748b',
  },
  categoryPillCountTextActive: {
    color: '#38bdf8',
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
  badgeHome: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeHomeLight: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  badgeHomeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeHomeTextLight: {
    color: '#059669',
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
