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
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

import { API_BASE } from '../constants/api';
import { safeHapticLight, safeHapticMedium, safeHapticSuccess, safeHapticWarning } from '../utils/haptics';
import { showSweetAlert } from '../utils/sweetAlert';
import AppFooter, { FooterTab } from '../components/AppFooter';

const WebViewComponent: any = WebView;
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
}

interface SlotItem {
  id?: number;
  time_range: string;
  max_bookings: number;
  current_bookings: number;
  is_full?: boolean;
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
  const [userPoints, setUserPoints] = useState(0);
  const [userEarningMoney, setUserEarningMoney] = useState(0);
  const [wishlistPackageIds, setWishlistPackageIds] = useState<number[]>([]);

  // Form Fields
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);

  // Address
  const [savedAddress, setSavedAddress] = useState<string>('');
  const [useSavedAddress, setUseSavedAddress] = useState<boolean>(true);
  const [customAddress, setCustomAddress] = useState<string>('');
  const [saveAsDefaultAddress, setSaveAsDefaultAddress] = useState<boolean>(true);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [liveLocationSource, setLiveLocationSource] = useState<'saved' | 'live' | 'none'>('saved');

  // Slots
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Discounts & Vouchers
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [useEPoints, setUseEPoints] = useState(false);
  const [useEarningMoney, setUseEarningMoney] = useState(false);

  // Payment Selection
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  // Picker Sheet Modal State
  const [activePicker, setActivePicker] = useState<PickerType>(null);

  // Quick Inline Add-Vehicle Modal State
  const [addVehicleModalVisible, setAddVehicleModalVisible] = useState(false);
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('sedan');
  const [addingVehicle, setAddingVehicle] = useState(false);

  // Cashfree Payment & Submission
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cashfreeHtml, setCashfreeHtml] = useState<string | null>(null);
  const [cashfreeOrderId, setCashfreeOrderId] = useState<string | null>(null);
  const [verifiedBooking, setVerifiedBooking] = useState<any>(null);

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
      background-color: #0b1120;
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
      width: 48px;
      height: 48px;
      border: 4px solid rgba(2, 132, 199, 0.2);
      border-top: 4px solid #0284c7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    h2 { font-size: 1.3rem; font-weight: 700; color: #f8fafc; margin-bottom: 8px; }
    p { font-size: 0.9rem; color: #94a3b8; line-height: 1.45; }
    .badge {
      margin-top: 24px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      border: 1px solid rgba(16, 185, 129, 0.3);
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
  <h2 id="title">Opening Secure Gateway</h2>
  <p id="desc">Connecting with Cashfree Payment Gateway to complete your booking...</p>
  <div class="badge">🔒 256-Bit SSL Encrypted Payment</div>
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

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16);

  // 14 Upcoming Dates Generator
  const dateOptions = useMemo(() => {
    const list: Array<{ label: string; dateNum: string; monthName: string; dayName: string; value: string; isToday: boolean }> = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-IN', { month: 'short' });
      if (i === 0) dayName = 'Today';
      if (i === 1) dayName = 'Tmrw';

      list.push({
        label: `${day}/${month} (${dayName})`,
        dateNum: day,
        monthName,
        dayName,
        value: dateStr,
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  // Fetch initial data
  const loadData = useCallback(async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const [vhRes, ctRes, pkRes, dashRes, wishRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/customer/vehicles`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        axios.get(`${API_BASE}/api/centers`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        axios.get(`${API_BASE}/api/packages`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        axios.get(`${API_BASE}/api/customer/dashboard`, {
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

      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value.data || {};
        setUserPoints(d.e_points || 0);
        setUserEarningMoney(parseFloat(d.earning_money || 0));

        const savedDbAddress = typeof d.address === 'string' ? d.address.trim() : '';
        const validSavedAddress = savedDbAddress && savedDbAddress !== 'Select Location';
        if (validSavedAddress) {
          setSavedAddress(savedDbAddress);
          setCustomAddress(savedDbAddress);
          setUseSavedAddress(true);
          setLiveLocationSource('saved');
        } else {
          resolveLiveLocation();
        }
      }

      // Default Date to Today
      if (dateOptions.length > 0 && !selectedDate) {
        setSelectedDate(dateOptions[0].value);
      }

      // Pre-fill coupon from query param if available
      if (searchParams.coupon && typeof searchParams.coupon === 'string') {
        setCouponCode(searchParams.coupon.toUpperCase());
      }
    } catch (err) {
      console.error('Error loading book screen data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, searchParams, dateOptions, selectedDate]);

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

  // Resolve Live GPS Location
  const resolveLiveLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setSavedAddress('');
        setCustomAddress('');
        setLiveLocationSource('none');
        return;
      }

      setLocationLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const formatted =
        geo && (geo.name || geo.street || geo.district || geo.city || geo.region)
          ? [geo.name, geo.street, geo.district, geo.city, geo.region].filter(Boolean).join(', ')
          : `Lat ${currentLocation.coords.latitude.toFixed(4)}, Lon ${currentLocation.coords.longitude.toFixed(4)}`;

      setSavedAddress(formatted);
      setCustomAddress(formatted);
      setLiveLocationSource('live');
      setUseSavedAddress(true);
      safeHapticSuccess();
    } catch (e) {
      console.warn('Live location error:', e);
      setLiveLocationSource('none');
    } finally {
      setLocationLoading(false);
    }
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

  // Fetch Slots when center or date changes
  useEffect(() => {
    if (!token || !selectedCenterId || !selectedDate) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedSlot('');
      try {
        const res = await axios.get(`${API_BASE}/api/bookings/slots`, {
          params: { franchisee_id: selectedCenterId, date: selectedDate },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted) {
          const list: SlotItem[] = res.data || [];
          setAvailableSlots(list);
          const firstOpen = list.find((s) => !s.is_full && s.current_bookings < s.max_bookings);
          if (firstOpen) {
            setSelectedSlot(firstOpen.time_range);
          }
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        if (isMounted) setSlotsLoading(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [token, selectedCenterId, selectedDate]);

  // Addon Subtotal
  const addonTotal = useMemo(() => {
    return selectedAddonIds.reduce((sum, id) => {
      const item = packages.find((p) => p.id === id);
      return sum + (item ? Number(item.price) : 0);
    }, 0);
  }, [packages, selectedAddonIds]);

  // Calculations
  const basePrice = selectedPackage ? Number(selectedPackage.price) : 0;
  const rawSubtotal = basePrice + addonTotal;

  // Max 12.5% E-Points Discount
  const maxEPointsDiscount = Math.min(userPoints, Math.round(rawSubtotal * 0.125));
  const appliedEPointsDiscount = useEPoints ? maxEPointsDiscount : 0;

  const priceAfterDiscounts = Math.max(0, rawSubtotal - couponDiscount - appliedEPointsDiscount);
  const appliedEarningMoney = useEarningMoney ? Math.min(userEarningMoney, priceAfterDiscounts) : 0;

  const taxableSubtotal = Math.max(0, priceAfterDiscounts - appliedEarningMoney);
  const calculatedGst = Math.round(taxableSubtotal * 0.18 * 100) / 100;
  const calculatedTotal = taxableSubtotal + calculatedGst;
  const totalSavings = couponDiscount + appliedEPointsDiscount + appliedEarningMoney;

  // Amount payable right now
  const immediatePayable = paymentType === 'partial' ? 99 : calculatedTotal;
  const remainingDue = paymentType === 'partial' ? Math.max(0, calculatedTotal - 99) : 0;

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

  // Addon Toggle
  const toggleAddon = (id: number) => {
    safeHapticLight();
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Coupon Action
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedPackage) return;
    safeHapticLight();
    setCouponLoading(true);
    setCouponFeedback(null);
    try {
      const res = await axios.post(
        `${API_BASE}/api/bookings/apply-coupon`,
        {
          code: couponCode.trim().toUpperCase(),
          package_id: selectedPackage.id,
          total_price: rawSubtotal,
          vehicle_id: selectedVehicleId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.status === 'success') {
        const amt = Number(res.data.discount_amount || 0);
        setCouponDiscount(amt);
        setCouponFeedback({
          success: true,
          msg: `Coupon applied: ₹${amt.toFixed(2)} savings!`,
        });
        safeHapticSuccess();
      } else {
        setCouponDiscount(0);
        setCouponFeedback({
          success: false,
          msg: res.data?.message || 'Invalid coupon code',
        });
        safeHapticWarning();
      }
    } catch (e: any) {
      setCouponDiscount(0);
      setCouponFeedback({
        success: false,
        msg: e.response?.data?.message || 'Coupon cannot be applied',
      });
      safeHapticWarning();
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    safeHapticLight();
    setCouponCode('');
    setCouponDiscount(0);
    setCouponFeedback(null);
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

  // Submit Booking
  const handleConfirmBooking = async () => {
    if (!selectedVehicleId) {
      showSweetAlert('Vehicle Required', 'Please select or add a vehicle.', 'warning');
      return;
    }
    if (!selectedPackageId) {
      showSweetAlert('Package Required', 'Please select a wash package.', 'warning');
      return;
    }
    if (!selectedCenterId) {
      showSweetAlert('Center Required', 'Please select a service center.', 'warning');
      return;
    }
    if (!selectedDate) {
      showSweetAlert('Date Required', 'Please choose a wash date.', 'warning');
      return;
    }
    if (!selectedSlot) {
      showSweetAlert('Time Slot Required', 'Please choose an available time slot.', 'warning');
      return;
    }

    const finalAddress = useSavedAddress ? savedAddress : customAddress;
    if (!finalAddress.trim()) {
      showSweetAlert('Address Required', 'Please enter doorstep service address.', 'warning');
      return;
    }

    safeHapticMedium();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        vehicle_id: selectedVehicleId,
        franchisee_id: selectedCenterId,
        package_id: selectedPackageId,
        booking_date: selectedDate,
        slot_time: selectedSlot,
        address: finalAddress.trim(),
        save_as_default_address: !useSavedAddress && saveAsDefaultAddress,
        payment_method: paymentMethod,
        payment_type: paymentType,
        addon_ids: selectedAddonIds,
        coupon_code: couponDiscount > 0 ? couponCode.trim().toUpperCase() : null,
        use_epoints: useEPoints,
        use_earning_money: useEarningMoney,
      };

      const res = await axios.post(`${API_BASE}/api/bookings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.status === 'success' || res.status === 201) {
        const booking = res.data?.booking;

        // If online payment is needed
        if (res.data?.requires_payment && booking && paymentMethod === 'online' && calculatedTotal > 0) {
          try {
            const cfOrderRes = await axios.post(
              `${API_BASE}/api/cashfree/create-order`,
              {
                booking_id: booking.id,
                payment_split: paymentType,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (cfOrderRes.data?.payment_session_id) {
              const sessionId = cfOrderRes.data.payment_session_id;
              const env = cfOrderRes.data.environment || 'sandbox';
              setCashfreeOrderId(cfOrderRes.data.cashfree_order_id);
              setCashfreeHtml(buildCashfreeCheckoutHtml(sessionId, env));
              setSubmitting(false);
              return;
            }
          } catch (cfErr: any) {
            console.error('Failed to create Cashfree order:', cfErr);
            showSweetAlert(
              'Payment Setup Failed',
              cfErr.response?.data?.message || 'Could not initiate online payment. You can pay later from My Washes.',
              'error'
            );
          }
        }

        // Direct confirmation (COD or fully paid by points/discounts)
        safeHapticSuccess();
        setVerifiedBooking(booking);
      }
    } catch (err: any) {
      console.error('Booking submission error:', err);
      const msg = err.response?.data?.message || 'Failed to place booking. Please try again.';
      setErrorMsg(msg);
      showSweetAlert('Booking Failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Verify Cashfree Payment completion from WebView redirection
  const handleVerifyCashfreePayment = async (orderId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/cashfree/verify/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.status === 'success' || res.data?.payment_status === 'paid' || res.data?.payment_status === 'partially_paid') {
        safeHapticSuccess();
        setCashfreeHtml(null);
        setVerifiedBooking(res.data.booking || { id: res.data.booking_id });
      } else {
        setCashfreeHtml(null);
        showSweetAlert(
          'Payment Pending',
          'Payment is being processed. You can verify or retry anytime from My Washes.',
          'info'
        );
        router.replace('/bookings');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setCashfreeHtml(null);
      router.replace('/bookings');
    }
  };

  const handleFooterTabPress = (tab: FooterTab) => {
    safeHapticLight();
    if (tab === 'home') {
      router.replace('/dashboard');
    } else if (tab === 'garage') {
      router.push('/garage');
    } else if (tab === 'book') {
      router.push('/bookings');
      return;
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

  const scrollToSummary = () => {
    safeHapticLight();
    scrollViewRef.current?.scrollToEnd({ animated: true });
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
            <Text style={[styles.headerTitle, isDark && styles.darkText]}>Checkout</Text>
            <Text style={[styles.headerSub, isDark && styles.darkSubtext]}>
              Doorstep Wash • Instant Booking
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

      {/* Main Content State */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={[styles.centerLoadingText, isDark && styles.darkSubtext]}>
            Preparing available packages & slots...
          </Text>
        </View>
      ) : verifiedBooking ? (
        // Celebratory Confirmed Booking Card
        <View style={styles.confirmedContainer}>
          <View style={[styles.confirmedCard, isDark && styles.darkCard]}>
            <View style={styles.successIconBubble}>
              <Ionicons name="checkmark-circle" size={68} color="#10b981" />
            </View>
            <Text style={[styles.confirmedTitle, isDark && styles.darkText]}>
              Booking Confirmed!
            </Text>
            <Text style={[styles.confirmedSubtitle, isDark && styles.darkSubtext]}>
              Booking #{verifiedBooking.id || 'CONFIRMED'} has been scheduled. Our team will reach your doorstep on time.
            </Text>

            <View style={[styles.confirmedDetailsBox, isDark ? styles.darkInnerBox : styles.lightInnerBox]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDark && styles.darkSubtext]}>Vehicle</Text>
                <Text style={[styles.detailValue, isDark && styles.darkText]}>
                  {selectedVehicle ? `${selectedVehicle.make_model} (${selectedVehicle.plate_number || 'No Plate'})` : 'Your Vehicle'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDark && styles.darkSubtext]}>Package</Text>
                <Text style={[styles.detailValue, isDark && styles.darkText]}>
                  {selectedPackage?.name || 'Car Wash Service'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDark && styles.darkSubtext]}>Date & Slot</Text>
                <Text style={[styles.detailValue, isDark && styles.darkText]}>
                  {selectedDate} • {selectedSlot}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDark && styles.darkSubtext]}>Payment</Text>
                <Text style={[styles.detailValue, { color: '#10b981', fontWeight: '800' }]}>
                  {paymentMethod === 'cod'
                    ? 'Cash on Delivery (Pay after service)'
                    : paymentType === 'partial'
                    ? '₹99 Advance Paid'
                    : `₹${calculatedTotal.toFixed(2)} Paid`}
                </Text>
              </View>
            </View>

            <View style={styles.confirmedActions}>
              <TouchableOpacity
                style={styles.primaryConfirmedBtn}
                onPress={() => router.replace('/bookings')}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryConfirmedBtnText}>View In My Washes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryConfirmedBtn, isDark && styles.darkSecondaryBtn]}
                onPress={() => router.replace('/dashboard')}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryConfirmedBtnText, isDark && styles.darkText]}>
                  Back to Dashboard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        // Main Booking Checkout Form
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 170 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0284c7']} />}
        >
          {errorMsg ? (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorAlertText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* CARD 1: Selected Vehicle & Service Hub Banner */}
          <View style={[styles.modernCard, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeLabelRow}>
                <Ionicons name="car-sport" size={16} color="#0284c7" />
                <Text style={styles.badgeLabelText}>VEHICLE & HUB</Text>
              </View>
              <TouchableOpacity
                style={styles.switchLinkBtn}
                onPress={() => {
                  safeHapticLight();
                  setActivePicker('vehicle');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.switchLinkText}>Switch Vehicle</Text>
                <Ionicons name="chevron-forward" size={14} color="#0284c7" />
              </TouchableOpacity>
            </View>

            {vehicles.length === 0 ? (
              <View style={styles.emptyVehicleWrap}>
                <Text style={styles.emptyVehicleIcon}>🚗</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emptyVehicleTitle, isDark && styles.darkText]}>No vehicle in garage</Text>
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
                  <Text style={{ fontSize: 28 }}>{getVehicleEmoji(selectedVehicle?.vehicle_type)}</Text>
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

                  {/* Indian License Plate Badge */}
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
              <Text style={styles.hubChangeText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* CARD 2: Wash Packages Selection (Direct Interactive Cards) */}
          <View style={[styles.modernCard, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeLabelRow}>
                <Ionicons name="sparkles" size={16} color="#0284c7" />
                <Text style={styles.badgeLabelText}>SELECT WASH PACKAGE</Text>
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

                return (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[
                      styles.packageCard,
                      isDark ? styles.darkInnerBox : styles.lightInnerBox,
                      isSelected && styles.packageCardSelected,
                    ]}
                    onPress={() => {
                      safeHapticLight();
                      setSelectedPackageId(pkg.id);
                    }}
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
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* CARD 3: Add-on Services (Interactive Carousel/Grid) */}
          {availableAddons.length > 0 && (
            <View style={[styles.modernCard, isDark && styles.darkCard]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.badgeLabelRow}>
                  <Ionicons name="add-circle" size={16} color="#06b6d4" />
                  <Text style={styles.badgeLabelText}>OPTIONAL ADD-ONS</Text>
                </View>
                {selectedAddonIds.length > 0 && (
                  <View style={styles.addedCountBadge}>
                    <Text style={styles.addedCountText}>+{selectedAddonIds.length} Added</Text>
                  </View>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.addonScrollContent}
              >
                {availableAddons.map((addon) => {
                  const isChecked = selectedAddonIds.includes(addon.id);
                  return (
                    <TouchableOpacity
                      key={addon.id}
                      style={[
                        styles.addonMiniCard,
                        isDark ? styles.darkInnerBox : styles.lightInnerBox,
                        isChecked && styles.addonMiniCardActive,
                      ]}
                      onPress={() => toggleAddon(addon.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.addonCardTop}>
                        <View style={[styles.addonCheckIcon, isChecked && styles.addonCheckIconActive]}>
                          <Ionicons
                            name={isChecked ? 'checkmark' : 'add'}
                            size={14}
                            color={isChecked ? '#ffffff' : '#64748b'}
                          />
                        </View>
                        <Text style={styles.addonPriceBadge}>+₹{addon.price}</Text>
                      </View>

                      <Text style={[styles.addonTitleText, isDark && styles.darkText]} numberOfLines={2}>
                        {addon.name}
                      </Text>

                      <Text style={[styles.addonDescText, isDark && styles.darkSubtext]} numberOfLines={1}>
                        {addon.description || 'Pro detailing extra'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* CARD 4: Date & Time Schedule */}
          <View style={[styles.modernCard, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeLabelRow}>
                <Ionicons name="calendar" size={16} color="#0284c7" />
                <Text style={styles.badgeLabelText}>WASH SCHEDULE</Text>
              </View>
              <Text style={[styles.headerCountTag, isDark && styles.darkSubtext]}>
                {selectedDate}
              </Text>
            </View>

            {/* Horizontal Date Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datePillsStrip}
            >
              {dateOptions.map((item) => {
                const isSelected = item.value === selectedDate;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.datePillBox,
                      isDark ? styles.darkInnerBox : styles.lightInnerBox,
                      isSelected && styles.datePillBoxSelected,
                    ]}
                    onPress={() => {
                      safeHapticLight();
                      setSelectedDate(item.value);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.datePillDayText, isSelected && styles.datePillTextActive]}>
                      {item.dayName.toUpperCase()}
                    </Text>
                    <Text style={[styles.datePillNumText, isDark && styles.darkText, isSelected && styles.datePillTextActive]}>
                      {item.dateNum}
                    </Text>
                    <Text style={[styles.datePillMonthText, isSelected && styles.datePillTextActive]}>
                      {item.monthName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slot Grid */}
            <View style={{ marginTop: 16 }}>
              <View style={styles.slotHeaderRow}>
                <Text style={[styles.subSectionTitle, isDark && styles.darkText]}>Select Time Slot</Text>
                {slotsLoading && <ActivityIndicator size="small" color="#0284c7" />}
              </View>

              {slotsLoading ? (
                <View style={styles.slotLoaderBox}>
                  <Text style={[styles.slotLoaderText, isDark && styles.darkSubtext]}>
                    Fetching live technician slots...
                  </Text>
                </View>
              ) : availableSlots.length === 0 ? (
                <View style={[styles.noSlotsBox, isDark ? styles.darkInnerBox : styles.lightInnerBox]}>
                  <Ionicons name="calendar-outline" size={24} color="#94a3b8" />
                  <Text style={[styles.noSlotsText, isDark && styles.darkSubtext]}>
                    No slots open for this date. Please pick another date above.
                  </Text>
                </View>
              ) : (
                <View style={styles.slotsGridWrap}>
                  {availableSlots.map((slot) => {
                    const isFull = slot.current_bookings >= slot.max_bookings || slot.is_full;
                    const isSelected = selectedSlot === slot.time_range;
                    return (
                      <TouchableOpacity
                        key={slot.time_range}
                        style={[
                          styles.slotChip,
                          isDark ? styles.darkInnerBox : styles.lightInnerBox,
                          isSelected && styles.slotChipSelected,
                          isFull && styles.slotChipFull,
                        ]}
                        onPress={() => {
                          if (!isFull) {
                            safeHapticLight();
                            setSelectedSlot(slot.time_range);
                          }
                        }}
                        disabled={isFull}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.slotChipTime,
                            isDark && styles.darkText,
                            isSelected && styles.slotChipTextActive,
                            isFull && styles.slotChipTextFull,
                          ]}
                          numberOfLines={1}
                        >
                          {slot.time_range}
                        </Text>
                        <View style={[styles.slotChipStatusBadge, isFull ? styles.badgeFull : isSelected ? styles.badgeActive : styles.badgeAvailable]}>
                          <Text style={[styles.slotChipStatusText, isFull ? styles.textFull : isSelected ? styles.textActive : styles.textAvailable]}>
                            {isFull ? 'FULL' : 'OPEN'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* CARD 5: Doorstep Address */}
          <View style={[styles.modernCard, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeLabelRow}>
                <Ionicons name="navigate-circle" size={16} color="#0284c7" />
                <Text style={styles.badgeLabelText}>SERVICE ADDRESS</Text>
              </View>
              {locationLoading && <ActivityIndicator size="small" color="#0284c7" />}
            </View>

            {/* Address Option Toggle Pills */}
            <View style={styles.addressPillRow}>
              <TouchableOpacity
                style={[
                  styles.addressModePill,
                  useSavedAddress && styles.addressModePillActive,
                ]}
                onPress={() => setUseSavedAddress(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={liveLocationSource === 'live' ? 'locate' : 'home'}
                  size={14}
                  color={useSavedAddress ? '#ffffff' : '#64748b'}
                />
                <Text style={[styles.addressModeText, useSavedAddress && styles.addressModeTextActive]}>
                  {liveLocationSource === 'live' ? 'Current GPS' : 'Saved Address'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addressModePill,
                  !useSavedAddress && styles.addressModePillActive,
                ]}
                onPress={() => setUseSavedAddress(false)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="create-outline"
                  size={14}
                  color={!useSavedAddress ? '#ffffff' : '#64748b'}
                />
                <Text style={[styles.addressModeText, !useSavedAddress && styles.addressModeTextActive]}>
                  Enter New Address
                </Text>
              </TouchableOpacity>
            </View>

            {/* Address Display / Form */}
            {useSavedAddress ? (
              <View style={[styles.addressPreviewBox, isDark ? styles.darkInnerBox : styles.lightInnerBox]}>
                <View style={styles.addressPinCircle}>
                  <Ionicons name="location" size={18} color="#0284c7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressPreviewTitle, isDark && styles.darkText]}>
                    Doorstep Delivery Point
                  </Text>
                  <Text style={[styles.addressPreviewText, isDark && styles.darkSubtext]}>
                    {savedAddress || 'Fetching your location...'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.gpsLocateBtn}
                  onPress={resolveLiveLocation}
                  activeOpacity={0.7}
                >
                  <Ionicons name="locate" size={16} color="#0284c7" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  style={[styles.addressInputBox, isDark && styles.darkInputBox]}
                  placeholder="House/Flat number, Building name, Landmark, City..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={customAddress}
                  onChangeText={setCustomAddress}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.saveDefaultRow}
                  onPress={() => setSaveAsDefaultAddress(!saveAsDefaultAddress)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={saveAsDefaultAddress ? 'checkbox' : 'square-outline'}
                    size={18}
                    color="#0284c7"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.saveDefaultLabel, isDark && styles.darkSubtext]}>
                    Save as default address for future bookings
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* CARD 6: Offers & Benefits */}
          <View style={[styles.modernCard, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeLabelRow}>
                <Ionicons name="gift" size={16} color="#f59e0b" />
                <Text style={styles.badgeLabelText}>OFFERS & BENEFITS</Text>
              </View>
              {totalSavings > 0 && (
                <View style={styles.totalSavingsTag}>
                  <Text style={styles.totalSavingsTagText}>Saving ₹{totalSavings.toFixed(2)}</Text>
                </View>
              )}
            </View>

            {/* Modern Integrated Coupon Input */}
            <View style={[styles.integratedCouponBar, isDark ? styles.darkInnerBox : styles.lightInnerBox]}>
              <Ionicons name="pricetag-outline" size={16} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.integratedCouponInput, isDark && styles.darkText]}
                placeholder="Enter promo code (e.g. WELCOME10)"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
                editable={couponDiscount === 0}
              />
              <TouchableOpacity
                style={[
                  styles.integratedCouponBtn,
                  couponDiscount > 0 ? styles.couponBtnRed : styles.couponBtnBlue,
                  couponLoading && { opacity: 0.6 },
                ]}
                onPress={couponDiscount > 0 ? handleRemoveCoupon : handleApplyCoupon}
                disabled={couponLoading}
                activeOpacity={0.8}
              >
                {couponLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.integratedCouponBtnText}>
                    {couponDiscount > 0 ? 'REMOVE' : 'APPLY'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {couponFeedback && (
              <View style={[styles.feedbackBanner, couponFeedback.success ? styles.feedbackBannerSuccess : styles.feedbackBannerError]}>
                <Ionicons
                  name={couponFeedback.success ? 'checkmark-circle' : 'alert-circle'}
                  size={15}
                  color={couponFeedback.success ? '#10b981' : '#ef4444'}
                />
                <Text style={[styles.feedbackText, { color: couponFeedback.success ? '#10b981' : '#ef4444' }]}>
                  {couponFeedback.msg}
                </Text>
              </View>
            )}

            {/* E-Points Toggle */}
            {userPoints > 0 && (
              <TouchableOpacity
                style={[
                  styles.benefitToggleRow,
                  isDark ? styles.darkInnerBox : styles.lightInnerBox,
                  useEPoints && styles.benefitToggleRowActive,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setUseEPoints(!useEPoints);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.benefitIconCircleAmber}>
                  <Text style={{ fontSize: 16 }}>💎</Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={[styles.benefitTitle, isDark && styles.darkText]}>
                    Redeem E-Points ({userPoints} pts)
                  </Text>
                  <Text style={[styles.benefitSub, isDark && styles.darkSubtext]}>
                    Save up to 12.5% on this wash (-₹{maxEPointsDiscount})
                  </Text>
                </View>
                <Ionicons
                  name={useEPoints ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={useEPoints ? '#0284c7' : '#94a3b8'}
                />
              </TouchableOpacity>
            )}

            {/* Earning Money Wallet Toggle */}
            {userEarningMoney > 0 && (
              <TouchableOpacity
                style={[
                  styles.benefitToggleRow,
                  isDark ? styles.darkInnerBox : styles.lightInnerBox,
                  useEarningMoney && styles.benefitToggleRowActive,
                  { marginTop: 8 },
                ]}
                onPress={() => {
                  safeHapticLight();
                  setUseEarningMoney(!useEarningMoney);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.benefitIconCircleEmerald}>
                  <Text style={{ fontSize: 16 }}>💵</Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={[styles.benefitTitle, isDark && styles.darkText]}>
                    Earning Balance (₹{userEarningMoney.toFixed(2)})
                  </Text>
                  <Text style={[styles.benefitSub, isDark && styles.darkSubtext]}>
                    Use referral wallet cash directly on this booking
                  </Text>
                </View>
                <Ionicons
                  name={useEarningMoney ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={useEarningMoney ? '#10b981' : '#94a3b8'}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* CARD 7: Payment Plan & Method */}
          <View style={[styles.modernCard, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeLabelRow}>
                <Ionicons name="card" size={16} color="#0284c7" />
                <Text style={styles.badgeLabelText}>PAYMENT OPTIONS</Text>
              </View>
            </View>

            {/* Split Options: Pay Advance vs Pay Full */}
            <View style={styles.paymentPlansRow}>
              <TouchableOpacity
                style={[
                  styles.paymentPlanBox,
                  isDark ? styles.darkInnerBox : styles.lightInnerBox,
                  paymentType === 'partial' && styles.paymentPlanBoxSelected,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setPaymentType('partial');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planTitle, isDark && styles.darkText]}>Pay Advance</Text>
                  <Ionicons
                    name={paymentType === 'partial' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#0284c7"
                  />
                </View>
                <Text style={styles.planPriceAmount}>₹99.00</Text>
                <Text style={[styles.planNoteText, isDark && styles.darkSubtext]}>
                  Remaining ₹{Math.max(0, calculatedTotal - 99).toFixed(2)} after wash
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentPlanBox,
                  isDark ? styles.darkInnerBox : styles.lightInnerBox,
                  paymentType === 'full' && styles.paymentPlanBoxSelected,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setPaymentType('full');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planTitle, isDark && styles.darkText]}>Pay Full</Text>
                  <Ionicons
                    name={paymentType === 'full' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#0284c7"
                  />
                </View>
                <Text style={styles.planPriceAmountGreen}>₹{calculatedTotal.toFixed(2)}</Text>
                <Text style={[styles.planNoteText, isDark && styles.darkSubtext]}>
                  100% upfront • Hassle-free
                </Text>
              </TouchableOpacity>
            </View>

            {/* Online vs COD Segmented Control */}
            <View style={[styles.methodSegmentWrap, isDark ? styles.darkInnerBox : styles.lightInnerBox]}>
              <TouchableOpacity
                style={[
                  styles.methodSegmentBtn,
                  paymentMethod === 'online' && styles.methodSegmentBtnActive,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setPaymentMethod('online');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={15}
                  color={paymentMethod === 'online' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.methodSegmentText,
                    paymentMethod === 'online' && styles.methodSegmentTextActive,
                    isDark && paymentMethod !== 'online' && styles.darkSubtext,
                  ]}
                >
                  Online (UPI / Cards)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodSegmentBtn,
                  paymentMethod === 'cod' && styles.methodSegmentBtnActive,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setPaymentMethod('cod');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cash-outline"
                  size={15}
                  color={paymentMethod === 'cod' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.methodSegmentText,
                    paymentMethod === 'cod' && styles.methodSegmentTextActive,
                    isDark && paymentMethod !== 'cod' && styles.darkSubtext,
                  ]}
                >
                  Cash on Delivery
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CARD 8: Receipt Style Bill Details */}
          <View style={[styles.receiptCard, isDark && styles.darkCard]}>
            <View style={styles.receiptHeader}>
              <Ionicons name="receipt-outline" size={17} color="#0284c7" />
              <Text style={[styles.receiptTitle, isDark && styles.darkText]}>Payment Breakdown</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, isDark && styles.darkSubtext]}>Base Wash Package</Text>
              <Text style={[styles.receiptVal, isDark && styles.darkText]}>₹{basePrice.toFixed(2)}</Text>
            </View>

            {addonTotal > 0 && (
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, isDark && styles.darkSubtext]}>
                  Add-on Services ({selectedAddonIds.length})
                </Text>
                <Text style={[styles.receiptVal, { color: '#0284c7' }]}>+₹{addonTotal.toFixed(2)}</Text>
              </View>
            )}

            {couponDiscount > 0 && (
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, isDark && styles.darkSubtext]}>
                  Coupon ({couponCode})
                </Text>
                <Text style={[styles.receiptVal, { color: '#10b981', fontWeight: '700' }]}>
                  -₹{couponDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            {appliedEPointsDiscount > 0 && (
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, isDark && styles.darkSubtext]}>E-Points Redeemed</Text>
                <Text style={[styles.receiptVal, { color: '#f59e0b', fontWeight: '700' }]}>
                  -₹{appliedEPointsDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            {appliedEarningMoney > 0 && (
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, isDark && styles.darkSubtext]}>Wallet Cash Used</Text>
                <Text style={[styles.receiptVal, { color: '#10b981', fontWeight: '700' }]}>
                  -₹{appliedEarningMoney.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, isDark && styles.darkSubtext]}>GST (18%)</Text>
              <Text style={[styles.receiptVal, isDark && styles.darkText]}>+₹{calculatedGst.toFixed(2)}</Text>
            </View>

            <View style={[styles.receiptDivider, isDark && styles.darkDivider]} />

            <View style={styles.receiptTotalRow}>
              <View>
                <Text style={[styles.receiptTotalLabel, isDark && styles.darkText]}>Grand Total</Text>
                {paymentType === 'partial' && (
                  <Text style={[styles.receiptAdvanceNotice, isDark && styles.darkSubtext]}>
                    (Pay ₹99 now, ₹{remainingDue.toFixed(2)} later)
                  </Text>
                )}
              </View>
              <Text style={styles.receiptTotalAmount}>₹{calculatedTotal.toFixed(2)}</Text>
            </View>

            {totalSavings > 0 && (
              <View style={styles.receiptSavingsRibbon}>
                <Text style={styles.receiptSavingsRibbonText}>
                  🎉 You are saving ₹{totalSavings.toFixed(2)} on this order!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Floating Bottom Sticky Bar */}
      {!loading && !verifiedBooking && !cashfreeHtml && (
        <View
          style={[
            styles.floatingBar,
            isDark && styles.darkFloatingBar,
            { paddingBottom: Math.max(insets.bottom, 12) + 6 },
          ]}
        >
          <TouchableOpacity onPress={scrollToSummary} activeOpacity={0.8}>
            <Text style={[styles.floatingPayableLabel, isDark && styles.darkSubtext]}>
              {paymentType === 'partial' ? 'ADVANCE PAYABLE' : 'TOTAL PAYABLE'}
            </Text>
            <View style={styles.floatingPriceRow}>
              <Text style={[styles.floatingPayableAmount, isDark && styles.darkText]}>
                ₹{immediatePayable.toFixed(2)}
              </Text>
              <Ionicons name="information-circle-outline" size={14} color="#0284c7" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.floatingSubmitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleConfirmBooking}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={styles.floatingSubmitBtnText}>
                  {paymentMethod === 'cod'
                    ? 'Confirm Wash'
                    : paymentType === 'partial'
                    ? 'Pay ₹99 & Book'
                    : `Pay ₹${calculatedTotal.toFixed(0)} & Book`}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* App Fixed Footer Navigation Bar */}
      {!cashfreeHtml && (
        <AppFooter activeTab="none" isDark={isDark} onTabPress={handleFooterTabPress} />
      )}

      {/* Dedicated Fullscreen Cashfree Payment Gateway Modal */}
      <Modal
        visible={!!cashfreeHtml}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          setCashfreeHtml(null);
          showSweetAlert('Payment Cancelled', 'You can complete payment anytime from My Washes.', 'info');
          router.replace('/bookings');
        }}
      >
        <SafeAreaView style={styles.cashfreeFullscreen}>
          <StatusBar style="light" />
          <View style={[styles.webViewBar, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 36 : 14) }]}>
            <View style={styles.webViewBarLeft}>
              <View style={styles.lockIconCircle}>
                <Ionicons name="lock-closed" size={14} color="#10b981" />
              </View>
              <View>
                <Text style={styles.webViewBarTitle}>Cashfree Secure Checkout</Text>
                <Text style={styles.webViewBarSubtitle}>256-bit Encrypted Transaction</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.webViewCloseBtn}
              onPress={() => {
                setCashfreeHtml(null);
                showSweetAlert('Payment Cancelled', 'You can complete payment anytime from My Washes.', 'info');
                router.replace('/bookings');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#f8fafc" />
            </TouchableOpacity>
          </View>

          <View style={styles.cashfreeWebContainer}>
            <WebViewComponent
              source={{ html: cashfreeHtml, baseUrl: 'https://sdk.cashfree.com' }}
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
                    setCashfreeHtml(null);
                    router.replace('/bookings');
                  }
                  return false;
                }
                return true;
              }}
              onNavigationStateChange={(nav: any) => {
                if (
                  nav.url.includes('/cashfree/return') ||
                  nav.url.includes('cashfree_order_id=') ||
                  nav.url.includes('status=success')
                ) {
                  const match = nav.url.match(/order_id=([^&]+)/);
                  const orderId = match ? decodeURIComponent(match[1]) : cashfreeOrderId;
                  if (orderId) {
                    handleVerifyCashfreePayment(orderId);
                  } else {
                    setCashfreeHtml(null);
                    router.replace('/bookings');
                  }
                }
              }}
              style={{ flex: 1 }}
            />
          </View>

          {/* Dedicated bottom safe area buffer so Cashfree's "Proceed to Pay" button is completely unobstructed above system navbar */}
          <View style={{ height: Math.max(insets.bottom, Platform.OS === 'android' ? 18 : 12), backgroundColor: '#ffffff' }} />
        </SafeAreaView>
      </Modal>

      {/* Sheet Modal for Pickers (Vehicle & Center) */}
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
  headerCountTag: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
  packageCard: {
    borderRadius: 16,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  packageCardSelected: {
    borderColor: '#0284c7',
    borderWidth: 2,
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
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
  addonScrollContent: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  addonMiniCard: {
    width: 140,
    padding: 12,
    borderRadius: 14,
  },
  addonMiniCardActive: {
    borderColor: '#06b6d4',
    borderWidth: 1.5,
    backgroundColor: 'rgba(6, 182, 212, 0.06)',
  },
  addonCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addonCheckIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonCheckIconActive: {
    backgroundColor: '#06b6d4',
  },
  addonPriceBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#06b6d4',
  },
  addonTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    height: 32,
  },
  addonDescText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
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
  datePillsStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  datePillBox: {
    width: 64,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillBoxSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  datePillDayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  datePillNumText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  datePillMonthText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 1,
  },
  datePillTextActive: {
    color: '#ffffff',
  },
  slotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  slotLoaderBox: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  slotLoaderText: {
    fontSize: 12,
    color: '#64748b',
  },
  noSlotsBox: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 6,
  },
  noSlotsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  slotsGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    width: '48.5%',
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotChipSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  slotChipFull: {
    opacity: 0.45,
  },
  slotChipTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  slotChipTextActive: {
    color: '#ffffff',
  },
  slotChipTextFull: {
    textDecorationLine: 'line-through',
  },
  slotChipStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeAvailable: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgeFull: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  badgeActive: {
    backgroundColor: '#ffffff',
  },
  slotChipStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  textAvailable: {
    color: '#10b981',
  },
  textFull: {
    color: '#ef4444',
  },
  textActive: {
    color: '#0284c7',
  },
  addressPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  addressModePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  addressModePillActive: {
    backgroundColor: '#0284c7',
  },
  addressModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  addressModeTextActive: {
    color: '#ffffff',
  },
  addressPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  addressPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  addressPreviewText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  gpsLocateBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInputBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    textAlignVertical: 'top',
    minHeight: 74,
  },
  darkInputBox: {
    backgroundColor: '#0b1120',
    borderColor: '#1e293b',
    color: '#f8fafc',
  },
  saveDefaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  saveDefaultLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  integratedCouponBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  integratedCouponInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  integratedCouponBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  couponBtnBlue: {
    backgroundColor: '#0284c7',
  },
  couponBtnRed: {
    backgroundColor: '#ef4444',
  },
  integratedCouponBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  feedbackBannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  feedbackBannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  feedbackText: {
    fontSize: 11,
    fontWeight: '700',
  },
  benefitToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  benefitToggleRowActive: {
    borderColor: '#0284c7',
  },
  benefitIconCircleAmber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIconCircleEmerald: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  benefitSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  totalSavingsTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  totalSavingsTagText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  paymentPlansRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  paymentPlanBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
  },
  paymentPlanBoxSelected: {
    borderColor: '#0284c7',
    borderWidth: 2,
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  planPriceAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0284c7',
    marginTop: 4,
  },
  planPriceAmountGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10b981',
    marginTop: 4,
  },
  planNoteText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
  },
  methodSegmentWrap: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  methodSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  methodSegmentBtnActive: {
    backgroundColor: '#0284c7',
  },
  methodSegmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  methodSegmentTextActive: {
    color: '#ffffff',
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  darkDivider: {
    backgroundColor: '#1e293b',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  receiptAdvanceNotice: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  receiptTotalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0284c7',
  },
  receiptSavingsRibbon: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  receiptSavingsRibbonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },
  floatingBar: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  floatingSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  errorAlertText: {
    fontSize: 12,
    color: '#ef4444',
    flex: 1,
  },
  confirmedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmedCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  successIconBubble: {
    marginBottom: 12,
  },
  confirmedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  confirmedSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  confirmedDetailsBox: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  confirmedActions: {
    width: '100%',
    gap: 10,
  },
  primaryConfirmedBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryConfirmedBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryConfirmedBtn: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  darkSecondaryBtn: {
    backgroundColor: '#1e293b',
  },
  secondaryConfirmedBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  cashfreeFullscreen: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  cashfreeWebContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webViewWrap: {
    flex: 1,
  },
  webViewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0b1120',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  webViewBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewBarTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  webViewBarSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
  },
  webViewCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    padding: 20,
    paddingBottom: 40,
  },
  darkModalSheet: {
    backgroundColor: '#0f172a',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSheetScroll: {
    marginBottom: 10,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  lightSheetItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  darkSheetItem: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
  },
  sheetItemSelected: {
    borderColor: '#0284c7',
  },
  sheetItemTitle: {
    fontSize: 13,
    fontWeight: '800',
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
    gap: 6,
    paddingVertical: 12,
    marginTop: 6,
  },
  sheetAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  addVehicleBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
  },
  addVehicleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePillOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 3,
  },
  typePillSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: '#0284c7',
    borderWidth: 1.5,
  },
  typePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
  },
  typePillTextActive: {
    color: '#0284c7',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: '#0f172a',
  },
  saveVehicleBtn: {
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 18,
  },
  saveVehicleBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
