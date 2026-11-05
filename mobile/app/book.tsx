import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

type PickerType = 'vehicle' | 'center' | 'package' | 'addons' | null;

export default function BookScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const insets = useSafeAreaInsets();

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

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16);

  // 14 Upcoming Dates Generator
  const dateOptions = useMemo(() => {
    const list: Array<{ label: string; dateDisplay: string; dayName: string; value: string; isToday: boolean }> = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
      if (i === 0) dayName = 'Today';
      if (i === 1) dayName = 'Tmrw';

      list.push({
        label: `${day}/${month} (${dayName})`,
        dateDisplay: `${day}/${month}`,
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
      const [vhRes, ctRes, pkRes, dashRes] = await Promise.allSettled([
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
      ]);

      if (vhRes.status === 'fulfilled') {
        const vList: Vehicle[] = vhRes.value.data || [];
        setVehicles(vList);
        if (vList.length > 0) {
          // Pre-select param vehicle or first
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

  // Toggle Dark/Light Theme
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
          msg: `Coupon applied: ₹${amt.toFixed(2)} off!`,
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
      showSweetAlert('Vehicle Required', 'Please select a vehicle.', 'warning');
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
        // Return to app with notice
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
      // Already on book page
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
            <Text style={[styles.headerTitle, isDark && styles.darkText]}>Book a Wash</Text>
            <Text style={[styles.headerSub, isDark && styles.darkSubtext]}>
              Doorstep clean • Instant confirmation
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.myWashesPill, isDark && styles.darkMyWashesPill]}
            onPress={() => router.push('/bookings')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={14} color="#0284c7" />
            <Text style={styles.myWashesText}>My Washes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeBtn, isDark && styles.darkThemeBtn]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={17} color={isDark ? '#fbbf24' : '#64748b'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content State */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={[styles.centerLoadingText, isDark && styles.darkSubtext]}>
            Preparing available services & slots...
          </Text>
        </View>
      ) : verifiedBooking ? (
        // Booking Confirmed Celebratory View
        <View style={styles.confirmedContainer}>
          <View style={styles.confirmedCard}>
            <View style={styles.successIconBubble}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            </View>
            <Text style={[styles.confirmedTitle, isDark && styles.darkText]}>
              Wash Booking Confirmed!
            </Text>
            <Text style={[styles.confirmedSubtitle, isDark && styles.darkSubtext]}>
              Booking #{verifiedBooking.id || 'CONFIRMED'} has been scheduled.
            </Text>

            <View style={[styles.confirmedDetailsBox, isDark && styles.darkDropdown]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDark && styles.darkSubtext]}>Vehicle</Text>
                <Text style={[styles.detailValue, isDark && styles.darkText]}>
                  {selectedVehicle ? `${selectedVehicle.make_model} (${selectedVehicle.plate_number || 'No Plate'})` : 'Your Vehicle'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDark && styles.darkSubtext]}>Service</Text>
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
                <Text style={[styles.detailValue, { color: '#10b981', fontWeight: '700' }]}>
                  {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentType === 'partial' ? '₹99 Advance Paid' : `₹${calculatedTotal.toFixed(2)} Paid`}
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
                <Text style={styles.primaryConfirmedBtnText}>View My Bookings</Text>
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
      ) : cashfreeHtml ? (
        // Cashfree In-App WebView Checkout
        <View style={styles.webViewWrap}>
          <View style={styles.webViewBar}>
            <View style={styles.webViewBarLeft}>
              <Ionicons name="lock-closed" size={16} color="#10b981" />
              <Text style={styles.webViewBarTitle}>Secure Cashfree Checkout</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setCashfreeHtml(null);
                showSweetAlert('Payment Cancelled', 'You can complete payment anytime from My Washes.', 'info');
                router.replace('/bookings');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

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
      ) : (
        // Main Booking Form
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0284c7']} />}
        >
          {errorMsg ? (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorAlertText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Section 1: Vehicle Selection */}
          <View style={[styles.sectionCard, isDark && styles.darkSectionCard]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Text style={styles.sectionStepNumber}>1</Text>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Select Vehicle</Text>
              </View>
              <TouchableOpacity
                style={styles.addVehicleBtn}
                onPress={() => setAddVehicleModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={15} color="#0284c7" />
                <Text style={styles.addVehicleBtnText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>

            {vehicles.length === 0 ? (
              <View style={styles.noVehiclesBox}>
                <Ionicons name="car-outline" size={32} color="#94a3b8" />
                <Text style={[styles.noVehiclesText, isDark && styles.darkSubtext]}>
                  No vehicles in your garage yet.
                </Text>
                <TouchableOpacity
                  style={styles.primaryMiniBtn}
                  onPress={() => setAddVehicleModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryMiniBtnText}>Register Your Vehicle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.selectorTrigger, isDark ? styles.darkDropdown : styles.lightDropdown]}
                onPress={() => {
                  safeHapticLight();
                  setActivePicker('vehicle');
                }}
                activeOpacity={0.75}
              >
                <View style={styles.selectorLeft}>
                  <Text style={styles.vehicleEmoji}>{getVehicleEmoji(selectedVehicle?.vehicle_type)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectorMainText, isDark && styles.darkText]} numberOfLines={1}>
                      {selectedVehicle?.make_model || 'Select Vehicle'}
                    </Text>
                    <Text style={[styles.selectorSubText, isDark && styles.darkSubtext]}>
                      {selectedVehicle ? `${selectedVehicle.plate_number ? selectedVehicle.plate_number + ' • ' : ''}${selectedVehicle.vehicle_type.toUpperCase()}` : 'Choose from your garage'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            )}
          </View>

          {/* Section 2: Service Center */}
          <View style={[styles.sectionCard, isDark && styles.darkSectionCard]}>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionStepNumber}>2</Text>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Service Center</Text>
            </View>

            <TouchableOpacity
              style={[styles.selectorTrigger, isDark ? styles.darkDropdown : styles.lightDropdown]}
              onPress={() => {
                safeHapticLight();
                setActivePicker('center');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.selectorLeft}>
                <View style={styles.iconSquircleBlue}>
                  <Ionicons name="business" size={16} color="#0284c7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectorMainText, isDark && styles.darkText]} numberOfLines={1}>
                    {selectedCenter?.center_name || 'Select Service Center'}
                  </Text>
                  <Text style={[styles.selectorSubText, isDark && styles.darkSubtext]} numberOfLines={1}>
                    {selectedCenter?.city || selectedCenter?.address || 'Doorstep service franchise'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>

          {/* Section 3: Package & Add-ons */}
          <View style={[styles.sectionCard, isDark && styles.darkSectionCard]}>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionStepNumber}>3</Text>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Wash Package & Add-ons</Text>
            </View>

            {/* Base Package Selector */}
            <Text style={[styles.innerFieldLabel, isDark && styles.darkSubtext]}>Primary Package</Text>
            <TouchableOpacity
              style={[styles.selectorTrigger, isDark ? styles.darkDropdown : styles.lightDropdown]}
              onPress={() => {
                safeHapticLight();
                setActivePicker('package');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.selectorLeft}>
                <View style={styles.iconSquircleEmerald}>
                  <Ionicons name="sparkles" size={16} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectorMainText, isDark && styles.darkText]} numberOfLines={1}>
                    {selectedPackage?.name || 'Select Wash Package'}
                  </Text>
                  <Text style={[styles.selectorSubText, isDark && styles.darkSubtext]}>
                    {selectedPackage ? `₹${selectedPackage.price} • ${selectedPackage.vehicle_type.toUpperCase()}` : 'Choose package'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>

            {/* Add-ons Selector */}
            <View style={{ marginTop: 12 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.innerFieldLabel, isDark && styles.darkSubtext]}>Optional Add-ons</Text>
                {selectedAddonIds.length > 0 && (
                  <Text style={styles.addonCountPill}>+{selectedAddonIds.length} added</Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.selectorTrigger,
                  isDark ? styles.darkDropdown : styles.lightDropdown,
                  selectedAddonIds.length > 0 && styles.activeBorderHighlight,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setActivePicker('addons');
                }}
                activeOpacity={0.75}
              >
                <View style={styles.selectorLeft}>
                  <View style={styles.iconSquircleCyan}>
                    <Ionicons name="add-circle" size={16} color="#06b6d4" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectorMainText, isDark && styles.darkText]} numberOfLines={1}>
                      {selectedAddonIds.length === 0
                        ? 'Select Add-on Services'
                        : `${selectedAddonIds.length} Add-on${selectedAddonIds.length > 1 ? 's' : ''} (+₹${addonTotal})`}
                    </Text>
                    <Text style={[styles.selectorSubText, isDark && styles.darkSubtext]}>
                      Interior vacuum, polish, windshield coat & more
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 4: Date & Slot */}
          <View style={[styles.sectionCard, isDark && styles.darkSectionCard]}>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionStepNumber}>4</Text>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Schedule Date & Slot</Text>
            </View>

            {/* Horizontal Date Picker */}
            <Text style={[styles.innerFieldLabel, isDark && styles.darkSubtext]}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
              {dateOptions.map((item) => {
                const isSelected = item.value === selectedDate;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.datePill,
                      isDark ? styles.darkDatePill : styles.lightDatePill,
                      isSelected && styles.datePillSelected,
                    ]}
                    onPress={() => {
                      safeHapticLight();
                      setSelectedDate(item.value);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.datePillDay, isSelected && styles.datePillTextSelected]}>
                      {item.dayName}
                    </Text>
                    <Text style={[styles.datePillNum, isDark && styles.darkText, isSelected && styles.datePillTextSelected]}>
                      {item.dateDisplay}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slot Grid */}
            <View style={{ marginTop: 14 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.innerFieldLabel, isDark && styles.darkSubtext]}>Select Time Slot</Text>
                {slotsLoading && <ActivityIndicator size="small" color="#0284c7" />}
              </View>

              {slotsLoading ? (
                <View style={styles.slotLoaderBox}>
                  <Text style={[styles.slotLoaderText, isDark && styles.darkSubtext]}>
                    Loading available time slots...
                  </Text>
                </View>
              ) : availableSlots.length === 0 ? (
                <View style={styles.noSlotsBox}>
                  <Ionicons name="time-outline" size={24} color="#94a3b8" />
                  <Text style={[styles.noSlotsText, isDark && styles.darkSubtext]}>
                    No slots available for this date. Please pick another date.
                  </Text>
                </View>
              ) : (
                <View style={styles.slotGrid}>
                  {availableSlots.map((slot) => {
                    const isFull = (slot.current_bookings >= slot.max_bookings) || slot.is_full;
                    const isSelected = selectedSlot === slot.time_range;
                    return (
                      <TouchableOpacity
                        key={slot.time_range}
                        style={[
                          styles.slotCard,
                          isDark ? styles.darkSlotCard : styles.lightSlotCard,
                          isSelected && styles.slotCardSelected,
                          isFull && styles.slotCardFull,
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
                            styles.slotTimeText,
                            isDark && styles.darkText,
                            isSelected && styles.slotTimeSelected,
                            isFull && styles.slotTimeFull,
                          ]}
                          numberOfLines={1}
                        >
                          {slot.time_range}
                        </Text>
                        <Text
                          style={[
                            styles.slotStatusTag,
                            isFull ? styles.slotStatusFull : styles.slotStatusOpen,
                            isSelected && styles.slotStatusSelected,
                          ]}
                        >
                          {isFull ? 'Full' : 'Open'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* Section 5: Doorstep Address */}
          <View style={[styles.sectionCard, isDark && styles.darkSectionCard]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Text style={styles.sectionStepNumber}>5</Text>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Doorstep Address</Text>
              </View>
              {locationLoading && <ActivityIndicator size="small" color="#0284c7" />}
            </View>

            {savedAddress ? (
              <View style={styles.addressToggleGroup}>
                <TouchableOpacity
                  style={[
                    styles.addressPillOption,
                    isDark ? styles.darkDropdown : styles.lightDropdown,
                    useSavedAddress && styles.activeAddressOption,
                  ]}
                  onPress={() => setUseSavedAddress(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.addressPillTop}>
                    <Text style={[styles.addressPillTitle, isDark && styles.darkText]}>
                      {liveLocationSource === 'live' ? '📍 Live Location' : '🏠 Profile Address'}
                    </Text>
                    <Ionicons
                      name={useSavedAddress ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={useSavedAddress ? '#0284c7' : '#94a3b8'}
                    />
                  </View>
                  <Text style={[styles.addressPillText, isDark && styles.darkSubtext]} numberOfLines={2}>
                    {savedAddress}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addressPillOption,
                    isDark ? styles.darkDropdown : styles.lightDropdown,
                    !useSavedAddress && styles.activeAddressOption,
                  ]}
                  onPress={() => setUseSavedAddress(false)}
                  activeOpacity={0.8}
                >
                  <View style={styles.addressPillTop}>
                    <Text style={[styles.addressPillTitle, isDark && styles.darkText]}>
                      ✏️ Enter New Address
                    </Text>
                    <Ionicons
                      name={!useSavedAddress ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={!useSavedAddress ? '#0284c7' : '#94a3b8'}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            ) : null}

            {(!savedAddress || !useSavedAddress) && (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  style={[styles.addressInput, isDark && styles.darkInput]}
                  placeholder="House/Flat number, Apartment, Landmark, City..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={customAddress}
                  onChangeText={setCustomAddress}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.saveDefaultToggle}
                  onPress={() => setSaveAsDefaultAddress(!saveAsDefaultAddress)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={saveAsDefaultAddress ? 'checkbox' : 'square-outline'}
                    size={18}
                    color="#0284c7"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.saveDefaultText, isDark && styles.darkSubtext]}>
                    Save as my default address for future washes
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Section 6: Coupons & Wallets */}
          <View style={[styles.sectionCard, isDark && styles.darkSectionCard]}>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionStepNumber}>6</Text>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Discounts & Loyalty</Text>
            </View>

            {/* Coupon Code Row */}
            <View style={styles.couponRow}>
              <TextInput
                style={[styles.couponInput, isDark && styles.darkInput]}
                placeholder="Enter Coupon (e.g. WELCOME10)"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
                editable={couponDiscount === 0}
              />
              <TouchableOpacity
                style={[
                  styles.couponBtn,
                  couponDiscount > 0 ? styles.couponBtnRemove : styles.couponBtnApply,
                  couponLoading && { opacity: 0.6 },
                ]}
                onPress={couponDiscount > 0 ? handleRemoveCoupon : handleApplyCoupon}
                disabled={couponLoading}
                activeOpacity={0.8}
              >
                {couponLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.couponBtnText}>{couponDiscount > 0 ? 'Remove' : 'Apply'}</Text>
                )}
              </TouchableOpacity>
            </View>

            {couponFeedback && (
              <Text style={[styles.feedbackMsg, { color: couponFeedback.success ? '#10b981' : '#ef4444' }]}>
                {couponFeedback.msg}
              </Text>
            )}

            {/* E-Points Redemption */}
            {userPoints > 0 && (
              <TouchableOpacity
                style={[styles.walletCard, isDark ? styles.darkDropdown : styles.lightDropdown]}
                onPress={() => {
                  safeHapticLight();
                  setUseEPoints(!useEPoints);
                }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.walletHeader}>
                    <Text style={styles.walletIcon}>💎</Text>
                    <Text style={[styles.walletTitle, isDark && styles.darkText]}>
                      Redeem E-Points ({userPoints} pts)
                    </Text>
                  </View>
                  <Text style={[styles.walletSub, isDark && styles.darkSubtext]}>
                    Apply up to 12.5% max wash discount (₹{maxEPointsDiscount})
                  </Text>
                </View>
                <Ionicons
                  name={useEPoints ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={useEPoints ? '#0284c7' : '#94a3b8'}
                />
              </TouchableOpacity>
            )}

            {/* Earning Money Wallet */}
            {userEarningMoney > 0 && (
              <TouchableOpacity
                style={[styles.walletCard, isDark ? styles.darkDropdown : styles.lightDropdown]}
                onPress={() => {
                  safeHapticLight();
                  setUseEarningMoney(!useEarningMoney);
                }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.walletHeader}>
                    <Text style={styles.walletIcon}>💵</Text>
                    <Text style={[styles.walletTitle, isDark && styles.darkText]}>
                      Earning Money Balance (₹{userEarningMoney.toFixed(2)})
                    </Text>
                  </View>
                  <Text style={[styles.walletSub, isDark && styles.darkSubtext]}>
                    Use available referral balance directly on wash
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

          {/* Section 7: Payment Plan & Method */}
          <View style={[styles.sectionCard, isDark && styles.darkSectionCard]}>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionStepNumber}>7</Text>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Payment Method & Plan</Text>
            </View>

            {/* Payment Split Choice */}
            <View style={styles.paymentCardsGrid}>
              <TouchableOpacity
                style={[
                  styles.paymentOptionBox,
                  isDark ? styles.darkDropdown : styles.lightDropdown,
                  paymentType === 'partial' && styles.paymentOptionBoxSelected,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setPaymentType('partial');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.paymentBoxTop}>
                  <Text style={[styles.paymentBoxTitle, isDark && styles.darkText]}>Pay ₹99 Advance</Text>
                  <Ionicons
                    name={paymentType === 'partial' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#0284c7"
                  />
                </View>
                <Text style={styles.paymentBoxPriceCyan}>₹99.00</Text>
                <Text style={[styles.paymentBoxNote, isDark && styles.darkSubtext]}>
                  Remaining ₹{Math.max(0, calculatedTotal - 99).toFixed(2)} after wash
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOptionBox,
                  isDark ? styles.darkDropdown : styles.lightDropdown,
                  paymentType === 'full' && styles.paymentOptionBoxSelected,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setPaymentType('full');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.paymentBoxTop}>
                  <Text style={[styles.paymentBoxTitle, isDark && styles.darkText]}>Pay Full Amount</Text>
                  <Ionicons
                    name={paymentType === 'full' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#0284c7"
                  />
                </View>
                <Text style={styles.paymentBoxPriceGreen}>₹{calculatedTotal.toFixed(2)}</Text>
                <Text style={[styles.paymentBoxNote, isDark && styles.darkSubtext]}>
                  Pay 100% upfront (incl. GST)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Online vs COD Toggle */}
            <View style={styles.methodToggleRow}>
              <TouchableOpacity
                style={[
                  styles.methodTogglePill,
                  paymentMethod === 'online' && styles.methodTogglePillActive,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setPaymentMethod('online');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="card-outline"
                  size={16}
                  color={paymentMethod === 'online' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.methodToggleText,
                    paymentMethod === 'online' && styles.methodToggleTextActive,
                    isDark && paymentMethod !== 'online' && styles.darkSubtext,
                  ]}
                >
                  Online (UPI / Card)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodTogglePill,
                  paymentMethod === 'cod' && styles.methodTogglePillActive,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setPaymentMethod('cod');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cash-outline"
                  size={16}
                  color={paymentMethod === 'cod' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.methodToggleText,
                    paymentMethod === 'cod' && styles.methodToggleTextActive,
                    isDark && paymentMethod !== 'cod' && styles.darkSubtext,
                  ]}
                >
                  Cash on Delivery (COD)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 8: Price Summary */}
          <View style={[styles.summaryCard, isDark ? styles.darkDropdown : styles.lightDropdown]}>
            <Text style={[styles.summaryTitle, isDark && styles.darkText]}>Payment Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>Base Wash Package</Text>
              <Text style={[styles.summaryVal, isDark && styles.darkText]}>₹{basePrice.toFixed(2)}</Text>
            </View>

            {addonTotal > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>
                  Add-on Services ({selectedAddonIds.length})
                </Text>
                <Text style={[styles.summaryVal, { color: '#0284c7' }]}>+₹{addonTotal.toFixed(2)}</Text>
              </View>
            )}

            {couponDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>
                  Coupon ({couponCode})
                </Text>
                <Text style={[styles.summaryVal, { color: '#10b981' }]}>-₹{couponDiscount.toFixed(2)}</Text>
              </View>
            )}

            {appliedEPointsDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>E-Points Redeemed</Text>
                <Text style={[styles.summaryVal, { color: '#f59e0b' }]}>-₹{appliedEPointsDiscount.toFixed(2)}</Text>
              </View>
            )}

            {appliedEarningMoney > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>Earning Money Wallet</Text>
                <Text style={[styles.summaryVal, { color: '#10b981' }]}>-₹{appliedEarningMoney.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>GST (18%)</Text>
              <Text style={[styles.summaryVal, { color: '#6366f1' }]}>+₹{calculatedGst.toFixed(2)}</Text>
            </View>

            <View style={[styles.summaryDivider, isDark && styles.darkDivider]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotalLabel, isDark && styles.darkText]}>Grand Total</Text>
              <Text style={styles.summaryTotalAmount}>₹{calculatedTotal.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Floating Bottom Booking Action Bar */}
      {!loading && !verifiedBooking && !cashfreeHtml && (
        <View
          style={[
            styles.floatingBar,
            isDark && styles.darkFloatingBar,
            { paddingBottom: Math.max(insets.bottom, 12) + 6 },
          ]}
        >
          <View>
            <Text style={[styles.floatingPayableLabel, isDark && styles.darkSubtext]}>
              {paymentType === 'partial' ? 'Pay Advance' : 'Total Payable'}
            </Text>
            <Text style={[styles.floatingPayableAmount, isDark && styles.darkText]}>
              ₹{paymentType === 'partial' ? '99.00' : calculatedTotal.toFixed(2)}
            </Text>
          </View>

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
                  {paymentMethod === 'cod' ? 'Confirm Booking (COD)' : paymentType === 'partial' ? 'Pay ₹99 & Book' : 'Pay & Confirm'}
                </Text>
                <Ionicons name="arrow-forward" size={17} color="#ffffff" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* App Fixed Footer Navigation Bar */}
      <AppFooter activeTab="book" isDark={isDark} onTabPress={handleFooterTabPress} />

      {/* Sheet Modal for Pickers (Vehicle, Center, Package, Add-ons) */}
      <Modal visible={activePicker !== null} transparent animationType="slide" onRequestClose={() => setActivePicker(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActivePicker(null)} />
          <View style={[styles.modalSheet, isDark && styles.darkModalSheet]}>
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, isDark && styles.darkText]}>
                {activePicker === 'vehicle' && 'Select Vehicle'}
                {activePicker === 'center' && 'Select Service Center'}
                {activePicker === 'package' && 'Select Wash Package'}
                {activePicker === 'addons' && 'Select Add-on Services'}
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
                        <Text style={{ fontSize: 24, marginRight: 12 }}>{getVehicleEmoji(v.vehicle_type)}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sheetItemTitle, isDark && styles.darkText]}>{v.make_model}</Text>
                          <Text style={[styles.sheetItemSub, isDark && styles.darkSubtext]}>
                            {v.plate_number ? `${v.plate_number} • ` : ''}{v.vehicle_type.toUpperCase()}
                          </Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color="#0284c7" />}
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
                        <View style={styles.iconSquircleBlue}>
                          <Ionicons name="business" size={16} color="#0284c7" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.sheetItemTitle, isDark && styles.darkText]}>{c.center_name}</Text>
                          <Text style={[styles.sheetItemSub, isDark && styles.darkSubtext]}>
                            {c.city || c.address || 'Doorstep Service Station'}
                          </Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color="#0284c7" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {activePicker === 'package' && (
                <View>
                  {availableBasePackages.map((p) => {
                    const isSelected = p.id === selectedPackageId;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.sheetItem,
                          isDark ? styles.darkSheetItem : styles.lightSheetItem,
                          isSelected && styles.sheetItemSelected,
                        ]}
                        onPress={() => {
                          safeHapticLight();
                          setSelectedPackageId(p.id);
                          setActivePicker(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.iconSquircleEmerald}>
                          <Ionicons name="sparkles" size={16} color="#10b981" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.sheetItemTitle, isDark && styles.darkText]}>{p.name}</Text>
                          <Text style={[styles.sheetItemSub, isDark && styles.darkSubtext]} numberOfLines={2}>
                            {p.description || 'Complete exterior & interior doorstep clean'}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                          <Text style={styles.packagePriceText}>₹{p.price}</Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={18} color="#0284c7" style={{ marginTop: 4 }} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {activePicker === 'addons' && (
                <View>
                  {availableAddons.length === 0 ? (
                    <Text style={[styles.noAddonsText, isDark && styles.darkSubtext]}>
                      No optional add-ons available for this vehicle type.
                    </Text>
                  ) : (
                    availableAddons.map((addon) => {
                      const isSelected = selectedAddonIds.includes(addon.id);
                      return (
                        <TouchableOpacity
                          key={addon.id}
                          style={[
                            styles.sheetItem,
                            isDark ? styles.darkSheetItem : styles.lightSheetItem,
                            isSelected && styles.sheetItemSelected,
                          ]}
                          onPress={() => toggleAddon(addon.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isSelected ? '#0284c7' : '#94a3b8'}
                            style={{ marginRight: 12 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.sheetItemTitle, isDark && styles.darkText]}>{addon.name}</Text>
                            {addon.description ? (
                              <Text style={[styles.sheetItemSub, isDark && styles.darkSubtext]}>
                                {addon.description}
                              </Text>
                            ) : null}
                          </View>
                          <Text style={styles.addonPriceTag}>+₹{addon.price}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                  <TouchableOpacity
                    style={styles.sheetDoneBtn}
                    onPress={() => setActivePicker(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sheetDoneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Inline Quick Add Vehicle Modal */}
      <Modal visible={addVehicleModalVisible} transparent animationType="fade" onRequestClose={() => setAddVehicleModalVisible(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.addVehicleBox, isDark && styles.darkSectionCard]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.addVehicleTitle, isDark && styles.darkText]}>Add New Vehicle</Text>
              <TouchableOpacity onPress={() => setAddVehicleModalVisible(false)}>
                <Ionicons name="close" size={22} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={[styles.inputLabel, isDark && styles.darkSubtext]}>Vehicle Type</Text>
              <View style={styles.typeSelectorRow}>
                {['sedan', 'suv', 'hatchback', 'bike'].map((type) => {
                  const isSel = newVehicleType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typePillOption,
                        isDark ? styles.darkDropdown : styles.lightDropdown,
                        isSel && styles.typePillSelected,
                      ]}
                      onPress={() => setNewVehicleType(type)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 16 }}>{getVehicleEmoji(type)}</Text>
                      <Text style={[styles.typePillText, isSel && styles.typePillTextActive]}>
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, isDark && styles.darkSubtext, { marginTop: 12 }]}>
                Make & Model *
              </Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.darkInput]}
                placeholder="e.g. Honda City, Hyundai Creta"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={newVehicleModel}
                onChangeText={setNewVehicleModel}
              />

              <Text style={[styles.inputLabel, isDark && styles.darkSubtext, { marginTop: 12 }]}>
                Plate Number (Optional)
              </Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.darkInput]}
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
    backgroundColor: '#0b1120',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontWeight: '700',
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
  myWashesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    fontWeight: '600',
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
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  darkSectionCard: {
    backgroundColor: '#131d33',
    borderColor: '#1e293b',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionStepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  addVehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addVehicleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  noVehiclesBox: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  noVehiclesText: {
    fontSize: 13,
    color: '#64748b',
  },
  primaryMiniBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  primaryMiniBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lightDropdown: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  darkDropdown: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  vehicleEmoji: {
    fontSize: 24,
  },
  selectorMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  selectorSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  iconSquircleBlue: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSquircleEmerald: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSquircleCyan: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  addonCountPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBorderHighlight: {
    borderColor: '#0284c7',
  },
  dateScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  datePill: {
    width: 68,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  lightDatePill: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  darkDatePill: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  datePillSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  datePillDay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  datePillNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  datePillTextSelected: {
    color: '#ffffff',
  },
  slotLoaderBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  slotLoaderText: {
    fontSize: 12,
    color: '#64748b',
  },
  noSlotsBox: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  noSlotsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    width: '48%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightSlotCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  darkSlotCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  slotCardSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  slotCardFull: {
    opacity: 0.45,
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  slotTimeSelected: {
    color: '#ffffff',
  },
  slotTimeFull: {
    textDecorationLine: 'line-through',
  },
  slotStatusTag: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  slotStatusOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
  },
  slotStatusFull: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
  },
  slotStatusSelected: {
    backgroundColor: '#ffffff',
    color: '#0284c7',
  },
  addressToggleGroup: {
    gap: 8,
  },
  addressPillOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeAddressOption: {
    borderColor: '#0284c7',
  },
  addressPillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressPillTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  addressPillText: {
    fontSize: 12,
    color: '#64748b',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  darkInput: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    color: '#f8fafc',
  },
  saveDefaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  saveDefaultText: {
    fontSize: 12,
    color: '#64748b',
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a',
  },
  couponBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponBtnApply: {
    backgroundColor: '#0284c7',
  },
  couponBtnRemove: {
    backgroundColor: '#ef4444',
  },
  couponBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackMsg: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletIcon: {
    fontSize: 15,
  },
  walletTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  walletSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  paymentCardsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentOptionBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentOptionBoxSelected: {
    borderColor: '#0284c7',
    borderWidth: 1.5,
  },
  paymentBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  paymentBoxPriceCyan: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284c7',
    marginTop: 4,
  },
  paymentBoxPriceGreen: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 4,
  },
  paymentBoxNote: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  methodToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
    gap: 6,
  },
  methodTogglePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  methodTogglePillActive: {
    backgroundColor: '#0284c7',
  },
  methodToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  methodToggleTextActive: {
    color: '#ffffff',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  darkDivider: {
    backgroundColor: '#1e293b',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryTotalAmount: {
    fontSize: 17,
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 8,
  },
  darkFloatingBar: {
    backgroundColor: '#0f172a',
    borderTopColor: '#1e293b',
  },
  floatingPayableLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  floatingPayableAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  floatingSubmitBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  floatingSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
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
    alignItems: 'center',
  },
  successIconBubble: {
    marginBottom: 14,
  },
  confirmedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  confirmedSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmedDetailsBox: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
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
    fontWeight: '600',
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
    borderRadius: 12,
  },
  primaryConfirmedBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryConfirmedBtn: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  darkSecondaryBtn: {
    backgroundColor: '#1e293b',
  },
  secondaryConfirmedBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  webViewWrap: {
    flex: 1,
  },
  webViewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  webViewBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  webViewBarTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSheetScroll: {
    marginBottom: 10,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  lightSheetItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  darkSheetItem: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  sheetItemSelected: {
    borderColor: '#0284c7',
  },
  sheetItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  sheetItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  packagePriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
  },
  addonPriceTag: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  noAddonsText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 20,
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
    fontWeight: '600',
    color: '#0284c7',
  },
  sheetDoneBtn: {
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  sheetDoneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  addVehicleBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  addVehicleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  typePillSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderColor: '#0284c7',
  },
  typePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  typePillTextActive: {
    color: '#0284c7',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0f172a',
  },
  saveVehicleBtn: {
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  saveVehicleBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
