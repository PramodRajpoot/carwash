import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_BASE } from '../constants/api';
import { safeHapticLight, safeHapticMedium, safeHapticSuccess } from '../utils/haptics';
import { showSweetAlert } from '../utils/sweetAlert';
import AppFooter, { FooterTab } from '../components/AppFooter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Vehicle {
  id: number;
  make_model: string;
  plate_number?: string;
  vehicle_type: string;
}

interface Center {
  id: number;
  center_name: string;
  city?: string;
  address?: string;
}

interface ServicePkg {
  id: number;
  name: string;
  description?: string;
  price: number;
  vehicle_type: string;
  is_addon: boolean;
  custom_badge?: string;
  max_bookings?: number;
  addons?: ServicePkg[];
}

type PickerType = 'vehicle' | 'center' | null;

export default function BookScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);

  // Authentication & User State
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);

  // Core Data Loaded
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [packages, setPackages] = useState<ServicePkg[]>([]);
  const [wishlistPackageIds, setWishlistPackageIds] = useState<number[]>([]);

  // Selection States: Vehicle & Service Hub
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);

  // Selection States: Service Package & Add-ons
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);
  const [isAddonExpanded, setIsAddonExpanded] = useState<boolean>(true);

  // Modals & Pickers
  const [activePicker, setActivePicker] = useState<PickerType>(null);
  const [addVehicleModalVisible, setAddVehicleModalVisible] = useState(false);
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('sedan');
  const [addingVehicle, setAddingVehicle] = useState(false);

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16);

  // Fetch initial data
  const loadData = useCallback(
    async (authToken?: string) => {
      const activeToken = authToken || token;
      if (!activeToken) return;

      setLoading(true);
      try {
        const [vhRes, ctRes, pkRes, wishRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/customer/vehicles`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
          axios.get(`${API_BASE}/api/centers`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
          axios.get(`${API_BASE}/api/packages`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
          axios.get(`${API_BASE}/api/customer/wishlist`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
        ]);

        if (wishRes.status === 'fulfilled' && Array.isArray(wishRes.value.data)) {
          const ids = wishRes.value.data
            .map((item: any) => item.package_id || item.package?.id)
            .filter(Boolean);
          setWishlistPackageIds(ids);
        }

        if (vhRes.status === 'fulfilled') {
          const vList: Vehicle[] = vhRes.value.data || [];
          setVehicles(vList);
          if (vList.length > 0) {
            const paramVId = searchParams.vehicle_id ? Number(searchParams.vehicle_id) : null;
            const matchV = paramVId ? vList.find((v) => v.id === paramVId) : null;
            setSelectedVehicleId(matchV ? matchV.id : vList[0].id);
          }
        }

        if (ctRes.status === 'fulfilled') {
          const cList: Center[] = ctRes.value.data || [];
          setCenters(cList);
          if (cList.length > 0) {
            const paramCId = searchParams.center_id ? Number(searchParams.center_id) : null;
            const matchC = paramCId ? cList.find((c) => c.id === paramCId) : null;
            setSelectedCenterId(matchC ? matchC.id : cList[0].id);
          }
        }

        if (pkRes.status === 'fulfilled') {
          setPackages(pkRes.value.data || []);
        }
      } catch (err) {
        console.error('Error loading book screen data:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, searchParams]
  );

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
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
          await loadData(storedToken);
        } else {
          router.replace('/login');
        }
      } catch (e) {
        console.error(e);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    safeHapticLight();
    setRefreshing(true);
    await loadData();
  };

  const toggleTheme = async () => {
    safeHapticLight();
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('app_theme', next ? 'dark' : 'light');
  };

  // Selected Objects
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  const selectedCenter = useMemo(() => {
    return centers.find((c) => c.id === selectedCenterId) || null;
  }, [centers, selectedCenterId]);

  // Packages filtered by selected vehicle's vehicle_type
  const availableBasePackages = useMemo(() => {
    if (!selectedVehicle) {
      return packages.filter((p) => !p.is_addon);
    }
    const vt = selectedVehicle.vehicle_type?.toLowerCase();
    return packages.filter(
      (p) => !p.is_addon && (p.vehicle_type?.toLowerCase() === vt || p.vehicle_type === 'all')
    );
  }, [packages, selectedVehicle]);

  const availableAddons = useMemo(() => {
    if (!selectedVehicle) {
      return packages.filter((p) => p.is_addon);
    }
    const vt = selectedVehicle.vehicle_type?.toLowerCase();
    return packages.filter(
      (p) => p.is_addon && (p.vehicle_type?.toLowerCase() === vt || p.vehicle_type === 'all')
    );
  }, [packages, selectedVehicle]);

  // Auto-select package when vehicle or packages change
  useEffect(() => {
    if (availableBasePackages.length > 0) {
      const paramPId = searchParams.package_id ? Number(searchParams.package_id) : null;
      const matchP = paramPId ? availableBasePackages.find((p) => p.id === paramPId) : null;
      if (matchP) {
        setSelectedPackageId(matchP.id);
      } else if (!availableBasePackages.some((p) => p.id === selectedPackageId)) {
        setSelectedPackageId(availableBasePackages[0].id);
      }
    }
  }, [availableBasePackages, searchParams.package_id]);

  const selectedPackage = useMemo(() => {
    return packages.find((p) => p.id === selectedPackageId) || null;
  }, [packages, selectedPackageId]);

  const getPackageAddons = useCallback(
    (pkg: ServicePkg) => {
      if (pkg.addons && pkg.addons.length > 0) {
        return pkg.addons;
      }
      return availableAddons;
    },
    [availableAddons]
  );

  const handleSelectPackage = (pkgId: number) => {
    safeHapticLight();
    if (selectedPackageId !== pkgId) {
      setSelectedPackageId(pkgId);
      setSelectedAddonIds([]); // Reset addons from previous package when switching
      setIsAddonExpanded(true); // Open newly selected service's addon section
    } else {
      setIsAddonExpanded((prev) => !prev);
    }
  };

  // Addon Toggle
  const toggleAddon = (id: number) => {
    safeHapticLight();
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Subtotal Calculation for Service & Add-ons
  const addonTotal = useMemo(() => {
    return selectedAddonIds.reduce((sum, id) => {
      let item = packages.find((p) => p.id === id);
      if (!item && selectedPackage?.addons) {
        item = selectedPackage.addons.find((a) => a.id === id);
      }
      return sum + (item ? Number(item.price) : 0);
    }, 0);
  }, [packages, selectedPackage, selectedAddonIds]);

  const basePrice = selectedPackage ? Number(selectedPackage.price) : 0;
  const servicesSubtotal = basePrice + addonTotal;

  // Wishlist Toggle
  const toggleWishlist = async (pkg: ServicePkg) => {
    safeHapticLight();
    if (!token) return;
    const isFav = wishlistPackageIds.includes(pkg.id);
    setWishlistPackageIds((prev) =>
      isFav ? prev.filter((id) => id !== pkg.id) : [...prev, pkg.id]
    );

    try {
      if (isFav) {
        await axios.delete(`${API_BASE}/api/customer/wishlist/${pkg.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showSweetAlert('Removed', `${pkg.name} removed from your wishlist.`, 'success');
      } else {
        await axios.post(
          `${API_BASE}/api/customer/wishlist`,
          { package_id: pkg.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        safeHapticSuccess();
        showSweetAlert('Added to Wishlist', `${pkg.name} saved to your wishlist!`, 'success');
      }
    } catch (err: any) {
      setWishlistPackageIds((prev) =>
        isFav ? [...prev, pkg.id] : prev.filter((id) => id !== pkg.id)
      );
      showSweetAlert('Error', err.response?.data?.message || 'Could not update wishlist.', 'error');
    }
  };

  // Quick Register New Vehicle
  const handleRegisterNewVehicle = async () => {
    if (!newVehicleModel.trim()) {
      showSweetAlert('Model Required', 'Please enter vehicle make and model.', 'warning');
      return;
    }

    setAddingVehicle(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/customer/vehicles`,
        {
          make_model: newVehicleModel.trim(),
          plate_number: newVehiclePlate.trim() || undefined,
          vehicle_type: newVehicleType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.vehicle || res.data?.id) {
        const created: Vehicle = res.data?.vehicle || res.data;
        setVehicles((prev) => [created, ...prev]);
        setSelectedVehicleId(created.id);
        setNewVehicleModel('');
        setNewVehiclePlate('');
        setAddVehicleModalVisible(false);
        showSweetAlert('Vehicle Added', 'Your vehicle has been added and selected!', 'success');
        safeHapticSuccess();
      }
    } catch (err: any) {
      showSweetAlert('Error', err.response?.data?.message || 'Failed to add vehicle.', 'error');
    } finally {
      setAddingVehicle(false);
    }
  };

  // Proceed to Step 2: Booking Summary & Advance Payment
  const handleProceedToSummary = () => {
    if (!selectedPackageId) {
      showSweetAlert('Package Required', 'Please choose a wash package to proceed.', 'warning');
      return;
    }

    safeHapticMedium();
    router.push({
      pathname: '/booking-summary',
      params: {
        vehicle_id: selectedVehicleId || '',
        center_id: selectedCenterId || '',
        package_id: selectedPackageId,
        addon_ids: selectedAddonIds.join(','),
        coupon: typeof searchParams.coupon === 'string' ? searchParams.coupon : '',
      },
    });
  };

  const handleFooterTabPress = (tab: FooterTab) => {
    safeHapticLight();
    if (tab === 'home') {
      router.replace('/dashboard');
    } else if (tab === 'garage') {
      router.push('/garage');
    } else if (tab === 'book') {
      router.push('/bookings');
    } else if (tab === 'support') {
      router.push('/support');
    } else if (tab === 'notifications') {
      router.replace('/dashboard');
    }
  };

  const getVehicleEmoji = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'suv':
        return '🚙';
      case 'sedan':
        return '🏎️';
      case 'hatchback':
        return '🚗';
      case 'bike':
        return '🏍️';
      default:
        return '🚗';
    }
  };

  return (
    <SafeAreaView style={[styles.root, isDark && styles.darkRoot]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Header Bar */}
      <View style={[styles.headerBar, isDark && styles.darkHeaderBar, { paddingTop: topPadding }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, isDark && styles.darkBackBtn]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.darkText]}>Select Services</Text>
            <Text style={[styles.headerSub, isDark && styles.darkSubtext]}>
              Step 1 of 2 • Wash & Add-on Packages
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.myWashesPill, isDark && styles.darkMyWashesPill]}
            onPress={() => router.push('/bookings')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={13} color="#0284c7" />
            <Text style={styles.myWashesText}>My Washes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeBtn, isDark && styles.darkThemeBtn]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={isDark ? '#fbbf24' : '#64748b'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={[styles.centerLoadingText, isDark && styles.darkSubtext]}>
            Preparing available wash services & addons...
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0284c7']} />}
        >
          {/* VEHICLE CONTEXT BAR */}
          <View style={[styles.modernCard, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeLabelRow}>
                <Ionicons name="car-sport" size={16} color="#0284c7" />
                <Text style={styles.badgeLabelText}>BOOKING FOR VEHICLE</Text>
              </View>
              <TouchableOpacity
                style={styles.switchLinkBtn}
                onPress={() => {
                  safeHapticLight();
                  setActivePicker('vehicle');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.switchLinkText}>Switch</Text>
                <Ionicons name="chevron-forward" size={14} color="#0284c7" />
              </TouchableOpacity>
            </View>

            {vehicles.length === 0 ? (
              <View style={styles.emptyVehicleWrap}>
                <Text style={styles.emptyVehicleIcon}>🚗</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emptyVehicleTitle, isDark && styles.darkText]}>No vehicle registered</Text>
                  <Text style={[styles.emptyVehicleSub, isDark && styles.darkSubtext]}>Add your vehicle to continue</Text>
                </View>
                <TouchableOpacity
                  style={styles.addMiniActionBtn}
                  onPress={() => setAddVehicleModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addMiniActionText}>+ Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.vehicleHeroBox, isDark ? styles.darkInnerBox : styles.lightInnerBox]}>
                <View style={styles.vehicleEmojiCircle}>
                  <Text style={{ fontSize: 26 }}>{getVehicleEmoji(selectedVehicle?.vehicle_type)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.vehicleTitleRow}>
                    <Text style={[styles.vehicleNameText, isDark && styles.darkText]} numberOfLines={1}>
                      {selectedVehicle?.make_model || 'Select Vehicle'}
                    </Text>
                    <View style={styles.typeBadgePill}>
                      <Text style={styles.typeBadgeText}>
                        {(selectedVehicle?.vehicle_type || 'CAR').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {selectedVehicle?.plate_number ? (
                    <View style={styles.plateContainer}>
                      <View style={styles.plateIndStripe}>
                        <Text style={styles.plateIndText}>IND</Text>
                      </View>
                      <Text style={styles.plateNumberText}>{selectedVehicle.plate_number.toUpperCase()}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.noPlateText, isDark && styles.darkSubtext]}>No plate registered</Text>
                  )}
                </View>
              </View>
            )}

            {/* Service Center Link */}
            <TouchableOpacity
              style={[styles.hubSelectorRow, isDark ? styles.darkBorderTop : styles.lightBorderTop]}
              onPress={() => {
                safeHapticLight();
                setActivePicker('center');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.hubIconCircle}>
                <Ionicons name="location" size={14} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.hubNameText, isDark && styles.darkText]} numberOfLines={1}>
                  {selectedCenter?.center_name || 'Select Service Center'}
                </Text>
                <Text style={[styles.hubSubText, isDark && styles.darkSubtext]} numberOfLines={1}>
                  {selectedCenter?.city || selectedCenter?.address || 'Doorstep Service Station'}
                </Text>
              </View>
              <Text style={styles.hubChangeText}>Change Hub</Text>
            </TouchableOpacity>
          </View>

          {/* WASH PACKAGES & ADD-ON SERVICES ONLY */}
          <View style={[styles.modernCard, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeLabelRow}>
                <Ionicons name="sparkles" size={16} color="#0284c7" />
                <Text style={styles.badgeLabelText}>WASH PACKAGES ({availableBasePackages.length})</Text>
              </View>
              <TouchableOpacity
                style={styles.switchLinkBtn}
                onPress={() => router.push('/wishlist')}
                activeOpacity={0.7}
              >
                <Ionicons name="heart" size={13} color="#e11d48" />
                <Text style={[styles.switchLinkText, { color: '#e11d48', marginLeft: 3 }]}>
                  Wishlist{wishlistPackageIds.length > 0 ? ` (${wishlistPackageIds.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.packageListContainer}>
              {availableBasePackages.map((pkg, idx) => {
                const isSelected = pkg.id === selectedPackageId;
                const isPopular = pkg.custom_badge || (idx === 0 && availableBasePackages.length > 1);
                const isFav = wishlistPackageIds.includes(pkg.id);
                const pkgAddons = getPackageAddons(pkg);
                const hasAddons = pkgAddons.length > 0;
                const showAddons = isSelected && isAddonExpanded && hasAddons;

                return (
                  <View
                    key={pkg.id}
                    style={[
                      styles.unifiedPackageCard,
                      isDark ? styles.darkInnerBox : styles.lightInnerBox,
                      isSelected && styles.unifiedPackageCardSelected,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.packageCardMainClickable}
                      onPress={() => handleSelectPackage(pkg.id)}
                      activeOpacity={0.8}
                    >
                      {isPopular ? (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>{pkg.custom_badge || 'RECOMMENDED'}</Text>
                        </View>
                      ) : null}

                      <View style={styles.packageCardTop}>
                        <View style={styles.packageCardRadio}>
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={20}
                            color={isSelected ? '#0284c7' : '#94a3b8'}
                          />
                        </View>

                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={[styles.packageCardTitle, isDark && styles.darkText]}>
                            {pkg.name}
                          </Text>
                          <Text style={[styles.packageCardDesc, isDark && styles.darkSubtext]} numberOfLines={2}>
                            {pkg.description || 'Full exterior foam wash, tire dressing & interior vacuuming'}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <View style={styles.packageCardPriceWrap}>
                            <Text style={styles.packagePriceSymbol}>₹</Text>
                            <Text style={styles.packagePriceNum}>{pkg.price}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => toggleWishlist(pkg)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ padding: 2 }}
                          >
                            <Ionicons
                              name={isFav ? 'heart' : 'heart-outline'}
                              size={18}
                              color={isFav ? '#e11d48' : isDark ? '#94a3b8' : '#64748b'}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.packageFooterMeta}>
                        <View style={styles.metaDurationPill}>
                          <Ionicons name="time-outline" size={12} color="#0284c7" />
                          <Text style={styles.metaDurationText}>45 - 60 mins</Text>
                        </View>
                        <View style={styles.metaDoorstepPill}>
                          <Ionicons name="checkmark-done" size={12} color="#10b981" />
                          <Text style={styles.metaDoorstepText}>Doorstep Equipment</Text>
                        </View>
                        {isSelected && hasAddons && (
                          <TouchableOpacity
                            onPress={() => setIsAddonExpanded((prev) => !prev)}
                            style={styles.inlineAddonTogglePill}
                            activeOpacity={0.7}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons
                              name={showAddons ? 'chevron-up' : 'chevron-down'}
                              size={12}
                              color="#0284c7"
                            />
                            <Text style={styles.inlineAddonToggleText}>
                              {selectedAddonIds.length > 0
                                ? `${selectedAddonIds.length} Added`
                                : 'Add-ons'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Expandable Addon Checklist */}
                    {showAddons && (
                      <View style={styles.unifiedAddonDropdown}>
                        <View style={[styles.unifiedAddonDivider, isDark && styles.darkBorderTop]} />

                        <View style={styles.inlineAddonHeaderRow}>
                          <View style={styles.badgeLabelRow}>
                            <Ionicons name="add-circle" size={15} color="#06b6d4" />
                            <Text style={styles.inlineAddonHeaderTitle}>
                              AVAILABLE ADD-ONS ({pkgAddons.length})
                            </Text>
                          </View>
                          {selectedAddonIds.length > 0 && (
                            <View style={styles.addedCountBadge}>
                              <Text style={styles.addedCountText}>+{selectedAddonIds.length} Added</Text>
                            </View>
                          )}
                        </View>

                        <ScrollView
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          persistentScrollbar={true}
                          style={styles.addonVerticalScrollView}
                          contentContainerStyle={styles.inlineAddonList}
                        >
                          {pkgAddons.map((addon) => {
                            const isChecked = selectedAddonIds.includes(addon.id);
                            return (
                              <TouchableOpacity
                                key={addon.id}
                                style={[
                                  styles.addonOptionRow,
                                  isDark ? styles.darkAddonOptionRow : styles.lightAddonOptionRow,
                                  isChecked && styles.addonOptionRowActive,
                                ]}
                                onPress={() => toggleAddon(addon.id)}
                                activeOpacity={0.7}
                              >
                                <View style={styles.addonOptionLeft}>
                                  <View style={[styles.addonOptionCheckbox, isChecked && styles.addonOptionCheckboxActive]}>
                                    <Ionicons
                                      name={isChecked ? 'checkmark' : 'add'}
                                      size={14}
                                      color={isChecked ? '#ffffff' : '#0284c7'}
                                    />
                                  </View>
                                  <View style={{ flex: 1, paddingRight: 6 }}>
                                    <Text
                                      style={[
                                        styles.addonOptionTitle,
                                        isDark && styles.darkText,
                                        isChecked && styles.addonOptionTitleActive,
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {addon.name}
                                    </Text>
                                    {addon.description ? (
                                      <Text style={[styles.addonOptionDesc, isDark && styles.darkSubtext]} numberOfLines={1}>
                                        {addon.description}
                                      </Text>
                                    ) : null}
                                  </View>
                                </View>

                                <View style={[styles.addonOptionPricePill, isChecked && styles.addonOptionPricePillActive]}>
                                  <Text style={[styles.addonOptionPriceText, isChecked && styles.addonOptionPriceTextActive]}>
                                    +₹{addon.price}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Floating Bottom Navigation Bar */}
      {!loading && (
        <View
          style={[
            styles.floatingBar,
            isDark && styles.darkFloatingBar,
            { bottom: Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 20) + 54 },
          ]}
        >
          <View>
            <Text style={[styles.floatingPayableLabel, isDark && styles.darkSubtext]}>
              {selectedAddonIds.length > 0 ? `1 WASH + ${selectedAddonIds.length} ADD-ONS` : 'SELECTED SERVICE'}
            </Text>
            <View style={styles.floatingPriceRow}>
              <Text style={[styles.floatingPayableAmount, isDark && styles.darkText]}>
                ₹{servicesSubtotal.toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.floatingSubmitBtn}
            onPress={handleProceedToSummary}
            activeOpacity={0.85}
          >
            <Text style={styles.floatingSubmitBtnText}>Proceed to Schedule</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* Fixed App Footer */}
      <AppFooter activeTab="none" isDark={isDark} onTabPress={handleFooterTabPress} />

      {/* Picker Sheet Modal (Vehicle & Center) */}
      <Modal visible={activePicker !== null} transparent animationType="slide" onRequestClose={() => setActivePicker(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActivePicker(null)} />
          <View style={[styles.modalSheet, isDark && styles.darkModalSheet]}>
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, isDark && styles.darkText]}>
                {activePicker === 'vehicle' && 'Switch Vehicle'}
                {activePicker === 'center' && 'Select Service Hub'}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)}>
                <Ionicons name="close-circle" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalSheetScroll} showsVerticalScrollIndicator={false}>
              {activePicker === 'vehicle' && (
                <View>
                  {vehicles.map((v) => {
                    const isSelected = v.id === selectedVehicleId;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={[
                          styles.sheetItem,
                          isDark ? styles.darkSheetItem : styles.lightSheetItem,
                          isSelected && styles.sheetItemSelected,
                        ]}
                        onPress={() => {
                          safeHapticLight();
                          setSelectedVehicleId(v.id);
                          setActivePicker(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 26, marginRight: 12 }}>{getVehicleEmoji(v.vehicle_type)}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sheetItemTitle, isDark && styles.darkText]}>{v.make_model}</Text>
                          <Text style={[styles.sheetItemSub, isDark && styles.darkSubtext]}>
                            {v.plate_number ? `${v.plate_number} • ` : ''}{v.vehicle_type.toUpperCase()}
                          </Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={22} color="#0284c7" />}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.sheetAddBtn}
                    onPress={() => {
                      setActivePicker(null);
                      setAddVehicleModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={18} color="#0284c7" />
                    <Text style={styles.sheetAddBtnText}>Add Another Vehicle</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activePicker === 'center' && (
                <View>
                  {centers.map((c) => {
                    const isSelected = c.id === selectedCenterId;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.sheetItem,
                          isDark ? styles.darkSheetItem : styles.lightSheetItem,
                          isSelected && styles.sheetItemSelected,
                        ]}
                        onPress={() => {
                          safeHapticLight();
                          setSelectedCenterId(c.id);
                          setActivePicker(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.hubIconCircle}>
                          <Ionicons name="business" size={16} color="#0284c7" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.sheetItemTitle, isDark && styles.darkText]}>{c.center_name}</Text>
                          <Text style={[styles.sheetItemSub, isDark && styles.darkSubtext]}>
                            {c.city || c.address || 'Doorstep Service Station'}
                          </Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={22} color="#0284c7" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Inline Quick Add Vehicle Modal */}
      <Modal visible={addVehicleModalVisible} transparent animationType="fade" onRequestClose={() => setAddVehicleModalVisible(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.addVehicleBox, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.addVehicleTitle, isDark && styles.darkText]}>Add New Vehicle</Text>
              <TouchableOpacity onPress={() => setAddVehicleModalVisible(false)}>
                <Ionicons name="close" size={22} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={[styles.inputLabel, isDark && styles.darkSubtext]}>Vehicle Type</Text>
              <View style={styles.typeSelectorRow}>
                {['sedan', 'suv', 'hatchback', 'bike'].map((type) => {
                  const isSel = newVehicleType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typePillOption,
                        isDark ? styles.darkInnerBox : styles.lightInnerBox,
                        isSel && styles.typePillSelected,
                      ]}
                      onPress={() => setNewVehicleType(type)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 18 }}>{getVehicleEmoji(type)}</Text>
                      <Text style={[styles.typePillText, isSel && styles.typePillTextActive]}>
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, isDark && styles.darkSubtext, { marginTop: 14 }]}>
                Make & Model *
              </Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.darkInputBox]}
                placeholder="e.g. Honda City, Hyundai Creta"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={newVehicleModel}
                onChangeText={setNewVehicleModel}
              />

              <Text style={[styles.inputLabel, isDark && styles.darkSubtext, { marginTop: 14 }]}>
                License Plate Number (Optional)
              </Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.darkInputBox]}
                placeholder="e.g. MH 02 AB 1234"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={newVehiclePlate}
                onChangeText={setNewVehiclePlate}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={[styles.saveVehicleBtn, addingVehicle && { opacity: 0.6 }]}
                onPress={handleRegisterNewVehicle}
                disabled={addingVehicle}
                activeOpacity={0.8}
              >
                {addingVehicle ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveVehicleBtnText}>Save & Select Vehicle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkRoot: {
    backgroundColor: '#090d16',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  darkHeaderBar: {
    backgroundColor: '#0f172a',
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  darkBackBtn: {
    backgroundColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
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
  myWashesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  darkMyWashesPill: {
    backgroundColor: '#082f49',
    borderColor: '#0284c7',
  },
  myWashesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  themeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkThemeBtn: {
    backgroundColor: '#1e293b',
  },
  darkText: {
    color: '#f8fafc',
  },
  darkSubtext: {
    color: '#94a3b8',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerLoadingText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  modernCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },
  lightInnerBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  darkInnerBox: {
    backgroundColor: '#0b1120',
    borderColor: '#1e293b',
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.6,
  },
  switchLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  switchLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  emptyVehicleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  emptyVehicleIcon: {
    fontSize: 28,
  },
  emptyVehicleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyVehicleSub: {
    fontSize: 12,
    color: '#64748b',
  },
  addMiniActionBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMiniActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  vehicleHeroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 12,
  },
  vehicleEmojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vehicleNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  typeBadgePill: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284c7',
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
  },
  plateIndStripe: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  plateIndText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  plateNumberText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    paddingHorizontal: 6,
    letterSpacing: 0.8,
  },
  noPlateText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  hubSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    gap: 8,
  },
  lightBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  darkBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  hubIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  hubSubText: {
    fontSize: 11,
    color: '#64748b',
  },
  hubChangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  packageListContainer: {
    gap: 10,
  },
  unifiedPackageCard: {
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  unifiedPackageCardSelected: {
    borderColor: '#0284c7',
    borderWidth: 2,
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
  },
  packageCardMainClickable: {
    padding: 14,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  packageCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  packageCardRadio: {
    marginRight: 10,
    marginTop: 2,
  },
  packageCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  packageCardDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  packageCardPriceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 6,
  },
  packagePriceSymbol: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  packagePriceNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0284c7',
  },
  packageFooterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  metaDurationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaDurationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284c7',
  },
  metaDoorstepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaDoorstepText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  addedCountBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  addedCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#06b6d4',
  },
  unifiedAddonDropdown: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  unifiedAddonDivider: {
    height: 1,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    marginBottom: 10,
  },
  addonVerticalScrollView: {
    maxHeight: 102, // Shows 2 addon services by default, rest on scroll
  },
  inlineAddonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inlineAddonHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  inlineAddonTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inlineAddonToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
  },
  inlineAddonList: {
    gap: 5,
    marginTop: 2,
    paddingRight: 2,
  },
  addonOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  lightAddonOptionRow: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  darkAddonOptionRow: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },
  addonOptionRowActive: {
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
  },
  addonOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  addonOptionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonOptionCheckboxActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  addonOptionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  addonOptionTitleActive: {
    color: '#0284c7',
  },
  addonOptionDesc: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  addonOptionPricePill: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  addonOptionPricePillActive: {
    backgroundColor: '#0284c7',
  },
  addonOptionPriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7',
  },
  addonOptionPriceTextActive: {
    color: '#ffffff',
  },
  floatingBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 9,
    paddingBottom: 9,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 100,
  },
  darkFloatingBar: {
    backgroundColor: '#0f172a',
    borderTopColor: '#1e293b',
  },
  floatingPayableLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  floatingPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  floatingPayableAmount: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
  },
  floatingSubmitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  darkModalSheet: {
    backgroundColor: '#111827',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSheetScroll: {
    marginBottom: 10,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  lightSheetItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  darkSheetItem: {
    backgroundColor: '#0b1120',
    borderColor: '#1e293b',
  },
  sheetItemSelected: {
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
  },
  sheetItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  sheetItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sheetAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0284c7',
    marginTop: 8,
    gap: 6,
  },
  sheetAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  addVehicleBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  addVehicleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePillOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  typePillSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  typePillTextActive: {
    color: '#ffffff',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
  },
  darkInputBox: {
    backgroundColor: '#0b1120',
    borderColor: '#1e293b',
    color: '#f8fafc',
  },
  saveVehicleBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  saveVehicleBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
