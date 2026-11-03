import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { WebView } from 'react-native-webview';

import { API_BASE } from '../constants/api';
import { safeHapticLight, safeHapticMedium } from '../utils/haptics';

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
}

interface SlotItem {
  id?: number;
  time_range: string;
  max_bookings: number;
  current_bookings: number;
  is_full?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDark?: boolean;
  token: string | null;
  user: any;
}

type PickerType = 'vehicle' | 'center' | 'package' | 'date' | 'slot' | 'addons' | null;

export default function BookServiceModal({
  visible,
  onClose,
  onSuccess,
  isDark = false,
  token,
  user,
}: Props) {
  const insets = useSafeAreaInsets();

  // Data loaded from server
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [packages, setPackages] = useState<ServicePkg[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userEarningMoney, setUserEarningMoney] = useState(0);

  // Form Selections
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);

  // Active Picker Modal State ('vehicle' | 'center' | 'package' | 'date' | 'slot' | 'addons' | null)
  const [activePicker, setActivePicker] = useState<PickerType>(null);

  // Address
  const [savedAddress, setSavedAddress] = useState<string>('');
  const [useSavedAddress, setUseSavedAddress] = useState<boolean>(true);
  const [customAddress, setCustomAddress] = useState<string>('');
  const [saveAsDefaultAddress, setSaveAsDefaultAddress] = useState<boolean>(true);

  // Slots
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);

  // Discounts
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [useEPoints, setUseEPoints] = useState(false);
  const [useEarningMoney, setUseEarningMoney] = useState(false);

  // Payment choice
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBookingId, setSuccessBookingId] = useState<number | null>(null);

  // Cashfree in-modal checkout state
  const [cashfreePaymentUrl, setCashfreePaymentUrl] = useState<string | null>(null);

  // Calendar View Month/Year State (for Date Picker)
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());

  // Generate 14 Upcoming Dates for convenience & quick mapping
  const dateOptions = useMemo(() => {
    const list: Array<{ label: string; formatted: string; value: string; isToday: boolean }> = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dateDisplay = `${day}/${month}/${year}`;
      let prefix = d.toLocaleDateString('en-IN', { weekday: 'short' });
      if (i === 0) prefix = 'Today';
      if (i === 1) prefix = 'Tomorrow';

      list.push({
        label: `${dateDisplay} (${prefix})`,
        formatted: dateDisplay,
        value: dateStr,
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  // Fetch initial dropdown and customer data
  useEffect(() => {
    if (!visible || !token) return;

    let isMounted = true;
    const loadInitialData = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const [vhRes, ctRes, pkRes, dashRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/customer/vehicles`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/centers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/packages`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/customer/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (isMounted) {
          if (vhRes.status === 'fulfilled') {
            const vList: Vehicle[] = vhRes.value.data || [];
            setVehicles(vList);
            if (vList.length > 0 && !selectedVehicleId) {
              setSelectedVehicleId(vList[0].id);
            }
          }

          if (ctRes.status === 'fulfilled') {
            const cList: Center[] = ctRes.value.data || [];
            setCenters(cList);
            if (cList.length > 0 && !selectedCenterId) {
              setSelectedCenterId(cList[0].id);
            }
          }

          if (pkRes.status === 'fulfilled') {
            setPackages(pkRes.value.data || []);
          }

          if (dashRes.status === 'fulfilled') {
            const d = dashRes.value.data || {};
            setUserPoints(d.e_points || 0);
            setUserEarningMoney(parseFloat(d.earning_money || 0));
            if (d.address) {
              setSavedAddress(d.address);
              setUseSavedAddress(true);
            }
          }

          // Default Date to Today
          if (dateOptions.length > 0 && !selectedDate) {
            setSelectedDate(dateOptions[0].value);
          }
        }
      } catch (err) {
        console.error('Error loading booking data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [visible, token, dateOptions]);

  // Selected Vehicle Object
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  // Selected Center Object
  const selectedCenter = useMemo(() => {
    return centers.find((c) => c.id === selectedCenterId) || null;
  }, [centers, selectedCenterId]);

  // Filter packages matching selected vehicle's vehicle_type
  const availableBasePackages = useMemo(() => {
    if (!selectedVehicle) {
      return packages.filter((p) => !p.is_addon);
    }
    const vt = selectedVehicle.vehicle_type?.toLowerCase();
    return packages.filter(
      (p) => !p.is_addon && (p.vehicle_type?.toLowerCase() === vt || p.vehicle_type === 'all')
    );
  }, [packages, selectedVehicle]);

  // Filter addon packages matching vehicle
  const availableAddons = useMemo(() => {
    if (!selectedVehicle) {
      return packages.filter((p) => p.is_addon);
    }
    const vt = selectedVehicle.vehicle_type?.toLowerCase();
    return packages.filter(
      (p) => p.is_addon && (p.vehicle_type?.toLowerCase() === vt || p.vehicle_type === 'all')
    );
  }, [packages, selectedVehicle]);

  // Auto-select first available package when vehicle changes
  useEffect(() => {
    if (availableBasePackages.length > 0) {
      if (!availableBasePackages.some((p) => p.id === selectedPackageId)) {
        setSelectedPackageId(availableBasePackages[0].id);
      }
    }
  }, [availableBasePackages, selectedPackageId]);

  // Fetch slots whenever center or date changes
  useEffect(() => {
    if (!visible || !token || !selectedCenterId || !selectedDate) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedSlot('');
      try {
        const res = await axios.get(`${API_BASE}/api/bookings/slots`, {
          params: {
            franchisee_id: selectedCenterId,
            date: selectedDate,
          },
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
        console.error('Failed to fetch slots:', err);
      } finally {
        if (isMounted) setSlotsLoading(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [visible, token, selectedCenterId, selectedDate]);

  // Selected Base Package Object
  const selectedPackage = useMemo(() => {
    return packages.find((p) => p.id === selectedPackageId) || null;
  }, [packages, selectedPackageId]);

  // Calculate Addon Subtotal
  const addonTotal = useMemo(() => {
    return selectedAddonIds.reduce((sum, id) => {
      const item = packages.find((p) => p.id === id);
      return sum + (item ? Number(item.price) : 0);
    }, 0);
  }, [packages, selectedAddonIds]);

  // Pricing calculations (with 18% GST)
  const basePrice = selectedPackage ? Number(selectedPackage.price) : 0;
  const rawSubtotal = basePrice + addonTotal;

  // Maximum allowed E-Points discount (capped at 12.5% of wash)
  const maxEPointsDiscount = Math.min(userPoints, Math.round(rawSubtotal * 0.125));
  const appliedEPointsDiscount = useEPoints ? maxEPointsDiscount : 0;

  // Price after coupon & points
  const priceAfterDiscounts = Math.max(0, rawSubtotal - couponDiscount - appliedEPointsDiscount);

  // Earning Money applied (up to 100% of remainder)
  const appliedEarningMoney = useEarningMoney
    ? Math.min(userEarningMoney, priceAfterDiscounts)
    : 0;

  const taxableSubtotal = Math.max(0, priceAfterDiscounts - appliedEarningMoney);
  const calculatedGst = Math.round(taxableSubtotal * 0.18 * 100) / 100;
  const calculatedTotal = taxableSubtotal + calculatedGst;

  // Toggle Addon in selection
  const toggleAddon = (id: number) => {
    safeHapticLight();
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Apply Coupon
  const applyCoupon = async () => {
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
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.status === 'success') {
        setCouponDiscount(Number(res.data.discount_amount || 0));
        setCouponFeedback({
          success: true,
          msg: `Coupon applied: ₹${res.data.discount_amount} off!`,
        });
      } else {
        setCouponDiscount(0);
        setCouponFeedback({
          success: false,
          msg: res.data?.message || 'Invalid coupon code',
        });
      }
    } catch (e: any) {
      setCouponDiscount(0);
      setCouponFeedback({
        success: false,
        msg: e.response?.data?.message || 'Could not verify coupon',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    safeHapticLight();
    setCouponCode('');
    setCouponDiscount(0);
    setCouponFeedback(null);
  };

  // Submit Booking
  const handleConfirmBooking = async () => {
    if (!selectedVehicleId) {
      Alert.alert('Vehicle Required', 'Please select a vehicle from the dropdown.');
      return;
    }
    if (!selectedPackageId) {
      Alert.alert('Package Required', 'Please select a package from the dropdown.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Time Slot Required', 'Please choose a time slot.');
      return;
    }

    const finalAddress = useSavedAddress ? savedAddress : customAddress;
    if (!finalAddress.trim()) {
      Alert.alert('Address Required', 'Please provide a doorstep service address.');
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

        if (res.data?.requires_payment && booking) {
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
              setCashfreePaymentUrl(
                `${API_BASE}/customer/bookings?pay=${booking.id}`
              );
              setSubmitting(false);
              return;
            }
          } catch (cfErr) {
            console.error('Failed to create Cashfree order:', cfErr);
          }
        }

        setSuccessBookingId(booking?.id || 1);
        safeHapticMedium();
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to place booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Label helpers
  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return 'Select Date';
    const found = dateOptions.find((d) => d.value === selectedDate);
    if (found) return found.label;

    // Fallback format for any date picked in calendar
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const day = parts[2];
      const month = parts[1];
      const year = parts[0];
      const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
      return `${day}/${month}/${year} (${weekday})`;
    }
    return selectedDate;
  }, [selectedDate, dateOptions]);

  const selectedAddonsText = useMemo(() => {
    if (selectedAddonIds.length === 0) return 'None selected';
    if (selectedAddonIds.length === 1) {
      const p = packages.find((item) => item.id === selectedAddonIds[0]);
      return p ? `${p.name} (+₹${p.price})` : '1 Add-on selected';
    }
    return `${selectedAddonIds.length} Add-ons selected (+₹${addonTotal})`;
  }, [selectedAddonIds, packages, addonTotal]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalRoot, isDark && styles.darkRoot]}>
        {/* Top Header */}
        <View style={[styles.topBar, isDark && styles.darkTopBar]}>
          <View style={styles.topBarLeft}>
            <View style={styles.titleIconSquircle}>
              <Ionicons name="sparkles" size={17} color="#0284c7" />
            </View>
            <View>
              <Text style={[styles.modalTitle, isDark && styles.darkText]}>
                Book a Service
              </Text>
              <Text style={[styles.modalSub, isDark && styles.darkSubtext]}>
                Doorstep clean • Instant confirmation
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={[styles.loadingText, isDark && styles.darkSubtext]}>
              Loading available services...
            </Text>
          </View>
        ) : successBookingId ? (
          <View style={styles.successBox}>
            <View style={styles.successCheckCircle}>
              <Ionicons name="checkmark" size={38} color="#ffffff" />
            </View>
            <Text style={[styles.successTitle, isDark && styles.darkText]}>
              Booking Confirmed!
            </Text>
            <Text style={[styles.successSub, isDark && styles.darkSubtext]}>
              Your wash booking #BOK-{successBookingId} has been successfully scheduled.
            </Text>
          </View>
        ) : cashfreePaymentUrl ? (
          // In-App Payment WebView
          <View style={{ flex: 1 }}>
            <View style={styles.paymentBanner}>
              <Text style={styles.paymentBannerText}>
                Complete Secure Payment with Cashfree
              </Text>
              <TouchableOpacity onPress={() => setCashfreePaymentUrl(null)}>
                <Ionicons name="close-circle" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <WebViewComponent
              source={{ uri: cashfreePaymentUrl }}
              injectedJavaScriptBeforeContentLoaded={`
                try {
                  localStorage.setItem('auth_token', ${JSON.stringify(token)});
                  localStorage.setItem('auth_user', ${JSON.stringify(JSON.stringify(user))});
                } catch(e) {}
                true;
              `}
              onNavigationStateChange={(nav: any) => {
                if (nav.url.includes('/cashfree/return') || nav.url.includes('status=success')) {
                  setTimeout(() => {
                    onSuccess();
                    onClose();
                  }, 1500);
                }
              }}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {errorMsg ? (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorAlertText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* 1. Vehicle Dropdown */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, isDark && styles.darkText]}>
                Vehicle <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, isDark ? styles.darkDropdown : styles.lightDropdown]}
                onPress={() => {
                  safeHapticLight();
                  setActivePicker('vehicle');
                }}
                activeOpacity={0.75}
              >
                <View style={styles.dropdownLeft}>
                  <Text style={{ fontSize: 18, marginRight: 6 }}>
                    {selectedVehicle?.vehicle_type === 'suv'
                      ? '🚙'
                      : selectedVehicle?.vehicle_type === 'sedan'
                      ? '🏎️'
                      : '🚗'}
                  </Text>
                  <Text
                    style={[
                      styles.dropdownValueText,
                      isDark && styles.darkText,
                      !selectedVehicle && styles.placeholderText,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedVehicle
                      ? `${selectedVehicle.make_model} ${selectedVehicle.plate_number ? '(' + selectedVehicle.plate_number + ')' : ''} — ${selectedVehicle.vehicle_type.toUpperCase()}`
                      : 'Select Vehicle'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {/* 2. Center Dropdown */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, isDark && styles.darkText]}>
                  Center <Text style={styles.requiredStar}>*</Text>
                </Text>
                {selectedCenterId && (
                  <Text style={styles.rememberedTag}>✓ Remembered Center</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.dropdownTrigger, isDark ? styles.darkDropdown : styles.lightDropdown]}
                onPress={() => {
                  safeHapticLight();
                  setActivePicker('center');
                }}
                activeOpacity={0.75}
              >
                <View style={styles.dropdownLeft}>
                  <Ionicons
                    name="business-outline"
                    size={17}
                    color="#0284c7"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.dropdownValueText,
                      isDark && styles.darkText,
                      !selectedCenter && styles.placeholderText,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedCenter
                      ? `${selectedCenter.center_name} — ${selectedCenter.city || ''}`
                      : 'Select Center'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {/* 3. Package / Main Service Dropdown */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, isDark && styles.darkText]}>
                Package / Main Service <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, isDark ? styles.darkDropdown : styles.lightDropdown]}
                onPress={() => {
                  safeHapticLight();
                  setActivePicker('package');
                }}
                activeOpacity={0.75}
              >
                <View style={styles.dropdownLeft}>
                  <Ionicons
                    name="cube-outline"
                    size={17}
                    color="#0284c7"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.dropdownValueText,
                      isDark && styles.darkText,
                      !selectedPackage && styles.placeholderText,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedPackage
                      ? `${selectedPackage.name} (₹${selectedPackage.price})`
                      : 'Select Package'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {/* 4. Date & Slot Dropdowns (Row of 2) */}
            <View style={styles.twoColRow}>
              {/* Date Dropdown */}
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, isDark && styles.darkText]}>
                  Date <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.dropdownTrigger, isDark ? styles.darkDropdown : styles.lightDropdown]}
                  onPress={() => {
                    safeHapticLight();
                    setActivePicker('date');
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.dropdownLeft}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color="#0284c7"
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.dropdownValueText,
                        isDark && styles.darkText,
                        !selectedDate && styles.placeholderText,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedDateLabel}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>

              {/* Slot Dropdown */}
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, isDark && styles.darkText]}>
                  Slot <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isDark ? styles.darkDropdown : styles.lightDropdown,
                    slotsLoading && { opacity: 0.6 },
                  ]}
                  onPress={() => {
                    if (!slotsLoading) {
                      safeHapticLight();
                      setActivePicker('slot');
                    }
                  }}
                  disabled={slotsLoading}
                  activeOpacity={0.75}
                >
                  <View style={styles.dropdownLeft}>
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color="#0284c7"
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.dropdownValueText,
                        isDark && styles.darkText,
                        !selectedSlot && styles.placeholderText,
                      ]}
                      numberOfLines={1}
                    >
                      {slotsLoading
                        ? 'Loading...'
                        : selectedSlot || (availableSlots.length === 0 ? 'No slots' : 'Choose Slot')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 5. Add-on Services Dropdown */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, isDark && styles.darkText]}>
                  Add-on Services (Optional)
                </Text>
                {selectedAddonIds.length > 0 && (
                  <Text style={styles.addonCountTag}>
                    +{selectedAddonIds.length} Added
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  isDark ? styles.darkDropdown : styles.lightDropdown,
                  selectedAddonIds.length > 0 && styles.dropdownActiveBorder,
                ]}
                onPress={() => {
                  safeHapticLight();
                  setActivePicker('addons');
                }}
                activeOpacity={0.75}
              >
                <View style={styles.dropdownLeft}>
                  <Ionicons
                    name="add-circle-outline"
                    size={17}
                    color="#10b981"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.dropdownValueText,
                      isDark && styles.darkText,
                      selectedAddonIds.length > 0 && { color: '#10b981', fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedAddonsText}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {/* Doorstep Address Section */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, isDark && styles.darkText]}>
                  📍 Doorstep Service Address <Text style={styles.requiredStar}>*</Text>
                </Text>
                {savedAddress && useSavedAddress && (
                  <Text style={styles.rememberedTag}>✓ Using saved</Text>
                )}
              </View>

              {savedAddress ? (
                <View style={styles.addressBoxWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.addressRadioBox,
                      isDark ? styles.darkDropdown : styles.lightDropdown,
                      useSavedAddress && styles.addressBoxActive,
                    ]}
                    onPress={() => setUseSavedAddress(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.addressRadioTop}>
                      <Text style={[styles.addressRadioTitle, isDark && styles.darkText]}>
                        Use Saved Address
                      </Text>
                      <Ionicons
                        name={useSavedAddress ? 'radio-button-on' : 'radio-button-off'}
                        size={17}
                        color={useSavedAddress ? '#10b981' : '#94a3b8'}
                      />
                    </View>
                    <Text style={[styles.addressRadioText, isDark && styles.darkSubtext]}>
                      {savedAddress}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.changeAddressBtn,
                      !useSavedAddress && styles.addressBoxActive,
                    ]}
                    onPress={() => setUseSavedAddress(false)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="pencil"
                      size={13}
                      color={!useSavedAddress ? '#0284c7' : isDark ? '#94a3b8' : '#64748b'}
                    />
                    <Text
                      style={[
                        styles.changeAddressText,
                        isDark && styles.darkSubtext,
                        !useSavedAddress && { color: '#0284c7', fontWeight: '700' },
                      ]}
                    >
                      Enter New Address
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {(!savedAddress || !useSavedAddress) && (
                <TextInput
                  style={[styles.addressInput, isDark && styles.darkInput]}
                  placeholder="Enter complete address (Flat/House, Society, Landmark, City)..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={customAddress}
                  onChangeText={setCustomAddress}
                  multiline
                  numberOfLines={3}
                />
              )}
            </View>

            {/* Coupon & Points */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, isDark && styles.darkText]}>
                Coupon Code
              </Text>
              <View style={styles.couponRow}>
                <TextInput
                  style={[styles.couponInput, isDark && styles.darkInput]}
                  placeholder="e.g. WELCOME10"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.couponBtn, couponLoading && { opacity: 0.7 }]}
                  onPress={couponDiscount > 0 ? removeCoupon : applyCoupon}
                  disabled={couponLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.couponBtnText}>
                    {couponLoading ? 'Checking...' : couponDiscount > 0 ? 'Remove' : 'Apply'}
                  </Text>
                </TouchableOpacity>
              </View>

              {couponFeedback && (
                <Text
                  style={[
                    styles.couponFeedback,
                    { color: couponFeedback.success ? '#10b981' : '#ef4444' },
                  ]}
                >
                  {couponFeedback.msg}
                </Text>
              )}

              {/* Points Toggles */}
              {userPoints > 0 && (
                <TouchableOpacity
                  style={[styles.pointsToggle, isDark ? styles.darkDropdown : styles.lightDropdown]}
                  onPress={() => setUseEPoints(!useEPoints)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pointsTitle, isDark && styles.darkText]}>
                      Use E-Points ({userPoints} pts available)
                    </Text>
                    <Text style={[styles.pointsSub, isDark && styles.darkSubtext]}>
                      Redeems up to 12.5% (₹{maxEPointsDiscount})
                    </Text>
                  </View>
                  <Ionicons
                    name={useEPoints ? 'checkbox' : 'square-outline'}
                    size={22}
                    color="#f59e0b"
                  />
                </TouchableOpacity>
              )}

              {userEarningMoney > 0 && (
                <TouchableOpacity
                  style={[styles.pointsToggle, isDark ? styles.darkDropdown : styles.lightDropdown]}
                  onPress={() => setUseEarningMoney(!useEarningMoney)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pointsTitle, isDark && styles.darkText]}>
                      Use Earning Money (₹{userEarningMoney.toFixed(2)} balance)
                    </Text>
                    <Text style={[styles.pointsSub, isDark && styles.darkSubtext]}>
                      Apply directly to wash balance
                    </Text>
                  </View>
                  <Ionicons
                    name={useEarningMoney ? 'checkbox' : 'square-outline'}
                    size={22}
                    color="#10b981"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Payment Choice */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, isDark && styles.darkText]}>
                Payment Option
              </Text>
              <View style={styles.twoColRow}>
                <TouchableOpacity
                  style={[
                    styles.paymentOptionCard,
                    isDark ? styles.darkDropdown : styles.lightDropdown,
                    paymentType === 'partial' && styles.paymentOptionActive,
                  ]}
                  onPress={() => setPaymentType('partial')}
                  activeOpacity={0.8}
                >
                  <View style={styles.paymentCardHeader}>
                    <Text style={[styles.paymentCardTitle, isDark && styles.darkText]}>
                      Pay ₹99 Advance
                    </Text>
                    <Ionicons
                      name={paymentType === 'partial' ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color="#0284c7"
                    />
                  </View>
                  <Text style={styles.paymentCardAmountCyan}>₹99.00</Text>
                  <Text style={[styles.paymentCardNote, isDark && styles.darkSubtext]}>
                    Remaining ₹{Math.max(0, calculatedTotal - 99).toFixed(2)} after wash
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOptionCard,
                    isDark ? styles.darkDropdown : styles.lightDropdown,
                    paymentType === 'full' && styles.paymentOptionActive,
                  ]}
                  onPress={() => setPaymentType('full')}
                  activeOpacity={0.8}
                >
                  <View style={styles.paymentCardHeader}>
                    <Text style={[styles.paymentCardTitle, isDark && styles.darkText]}>
                      Pay Full Amount
                    </Text>
                    <Ionicons
                      name={paymentType === 'full' ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color="#0284c7"
                    />
                  </View>
                  <Text style={styles.paymentCardAmountGreen}>
                    ₹{calculatedTotal.toFixed(2)}
                  </Text>
                  <Text style={[styles.paymentCardNote, isDark && styles.darkSubtext]}>
                    Pay 100% upfront (incl. GST)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Summary Breakdown */}
            <View style={[styles.summaryBox, isDark ? styles.darkDropdown : styles.lightDropdown]}>
              <Text style={[styles.summaryHeading, isDark && styles.darkText]}>
                Price Breakdown
              </Text>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryItemLabel, isDark && styles.darkSubtext]}>
                  Base Plan Price
                </Text>
                <Text style={[styles.summaryItemVal, isDark && styles.darkText]}>
                  ₹{basePrice.toFixed(2)}
                </Text>
              </View>
              {addonTotal > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryItemLabel, isDark && styles.darkSubtext]}>
                    Add-ons ({selectedAddonIds.length} items)
                  </Text>
                  <Text style={[styles.summaryItemVal, { color: '#0284c7' }]}>
                    +₹{addonTotal.toFixed(2)}
                  </Text>
                </View>
              )}
              {couponDiscount > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryItemLabel, isDark && styles.darkSubtext]}>
                    Coupon Discount ({couponCode})
                  </Text>
                  <Text style={[styles.summaryItemVal, { color: '#10b981' }]}>
                    -₹{couponDiscount.toFixed(2)}
                  </Text>
                </View>
              )}
              {appliedEPointsDiscount > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryItemLabel, isDark && styles.darkSubtext]}>
                    E-Points
                  </Text>
                  <Text style={[styles.summaryItemVal, { color: '#f59e0b' }]}>
                    -₹{appliedEPointsDiscount.toFixed(2)}
                  </Text>
                </View>
              )}
              {appliedEarningMoney > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryItemLabel, isDark && styles.darkSubtext]}>
                    Earning Money
                  </Text>
                  <Text style={[styles.summaryItemVal, { color: '#10b981' }]}>
                    -₹{appliedEarningMoney.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryItemLabel, isDark && styles.darkSubtext]}>
                  GST (18%)
                </Text>
                <Text style={[styles.summaryItemVal, { color: '#6366f1' }]}>
                  +₹{calculatedGst.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryTotalRow, isDark && styles.darkBorder]}>
                <Text style={[styles.totalText, isDark && styles.darkText]}>
                  Total Amount
                </Text>
                <Text style={[styles.totalAmount, { color: '#10b981' }]}>
                  ₹{calculatedTotal.toFixed(2)}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Bottom Floating Confirm Bar */}
        {!loading && !successBookingId && !cashfreePaymentUrl && (
          <View
            style={[
              styles.floatingBottomBar,
              isDark && styles.darkBottomBar,
              { paddingBottom: Math.max(insets.bottom, 12) + 6 },
            ]}
          >
            <View>
              <Text style={[styles.bottomBarLabel, isDark && styles.darkSubtext]}>
                {paymentType === 'partial' ? 'Pay Advance' : 'Total Payable'}
              </Text>
              <Text style={[styles.bottomBarPrice, isDark && styles.darkText]}>
                ₹{paymentType === 'partial' ? '99.00' : calculatedTotal.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, submitting && { opacity: 0.7 }]}
              onPress={handleConfirmBooking}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.confirmBtnText}>
                    {paymentType === 'partial' ? 'Book & Pay ₹99' : 'Confirm & Book'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── SELECTION PICKER MODAL (Bottom Sheet) ── */}
        <Modal
          visible={activePicker !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActivePicker(null)}
        >
          <View style={styles.pickerBackdrop}>
            <TouchableOpacity
              style={styles.pickerBackdropDismiss}
              activeOpacity={1}
              onPress={() => setActivePicker(null)}
            />
            <View style={[styles.pickerSheet, isDark && styles.darkPickerSheet]}>
              {/* Picker Header */}
              <View style={[styles.pickerHeader, isDark && styles.darkBorder]}>
                <Text style={[styles.pickerHeaderTitle, isDark && styles.darkText]}>
                  {activePicker === 'vehicle' && 'Select Vehicle'}
                  {activePicker === 'center' && 'Select Service Center'}
                  {activePicker === 'package' && 'Select Package / Main Service'}
                  {activePicker === 'date' && 'Select Wash Date'}
                  {activePicker === 'slot' && 'Select Time Slot'}
                  {activePicker === 'addons' && 'Select Add-on Services'}
                </Text>
                <TouchableOpacity
                  style={styles.pickerCloseBtn}
                  onPress={() => setActivePicker(null)}
                >
                  <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>

              {/* Picker Options List */}
              <ScrollView style={styles.pickerListScroll} showsVerticalScrollIndicator={false}>
                {/* 1. Vehicle Options */}
                {activePicker === 'vehicle' &&
                  vehicles.map((v) => {
                    const isSelected = v.id === selectedVehicleId;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={[
                          styles.pickerOptionItem,
                          isDark && styles.darkBorder,
                          isSelected && (isDark ? styles.pickerActiveItemDark : styles.pickerActiveItemLight),
                        ]}
                        onPress={() => {
                          safeHapticLight();
                          setSelectedVehicleId(v.id);
                          setActivePicker(null);
                        }}
                      >
                        <Text style={{ fontSize: 22, marginRight: 10 }}>
                          {v.vehicle_type === 'suv' ? '🚙' : v.vehicle_type === 'sedan' ? '🏎️' : '🚗'}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pickerOptionTitle, isDark && styles.darkText]}>
                            {v.make_model} {v.plate_number ? `(${v.plate_number})` : ''}
                          </Text>
                          <Text style={[styles.pickerOptionSub, isDark && styles.darkSubtext]}>
                            {v.vehicle_type.toUpperCase()}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color="#0284c7" />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                {/* 2. Center Options */}
                {activePicker === 'center' &&
                  centers.map((c) => {
                    const isSelected = c.id === selectedCenterId;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.pickerOptionItem,
                          isDark && styles.darkBorder,
                          isSelected && (isDark ? styles.pickerActiveItemDark : styles.pickerActiveItemLight),
                        ]}
                        onPress={() => {
                          safeHapticLight();
                          setSelectedCenterId(c.id);
                          setActivePicker(null);
                        }}
                      >
                        <Ionicons
                          name="business-outline"
                          size={20}
                          color="#0284c7"
                          style={{ marginRight: 10 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pickerOptionTitle, isDark && styles.darkText]}>
                            {c.center_name}
                          </Text>
                          <Text style={[styles.pickerOptionSub, isDark && styles.darkSubtext]}>
                            {c.city} • {c.address || 'Doorstep Service'}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color="#0284c7" />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                {/* 3. Package Options */}
                {activePicker === 'package' &&
                  availableBasePackages.map((pkg) => {
                    const isSelected = pkg.id === selectedPackageId;
                    return (
                      <TouchableOpacity
                        key={pkg.id}
                        style={[
                          styles.pickerOptionItem,
                          isDark && styles.darkBorder,
                          isSelected && (isDark ? styles.pickerActiveItemDark : styles.pickerActiveItemLight),
                        ]}
                        onPress={() => {
                          safeHapticLight();
                          setSelectedPackageId(pkg.id);
                          setActivePicker(null);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.pickerOptionTitle, isDark && styles.darkText]}>
                              {pkg.name}
                            </Text>
                            {pkg.custom_badge ? (
                              <View style={styles.badgePill}>
                                <Text style={styles.badgePillText}>{pkg.custom_badge}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <Text style={[styles.pickerPriceTag, isDark && styles.darkText]}>
                          ₹{pkg.price}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#0284c7"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                {/* 4. Calendar Date Picker */}
                {activePicker === 'date' && (() => {
                  const viewYear = calendarViewDate.getFullYear();
                  const viewMonth = calendarViewDate.getMonth();
                  const monthName = calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                  // Days calculation
                  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
                  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
                  const todayObj = new Date();
                  todayObj.setHours(0, 0, 0, 0);

                  // Max selectable date: 60 days ahead
                  const maxBookingDate = new Date();
                  maxBookingDate.setDate(maxBookingDate.getDate() + 60);
                  maxBookingDate.setHours(23, 59, 59, 999);

                  const dayCells: Array<{ dayNum: number; dateStr: string; isPast: boolean; isTooFar: boolean; isToday: boolean } | null> = [];
                  for (let i = 0; i < firstDayIndex; i++) {
                    dayCells.push(null);
                  }
                  for (let d = 1; d <= daysInCurrentMonth; d++) {
                    const thisDate = new Date(viewYear, viewMonth, d);
                    thisDate.setHours(0, 0, 0, 0);

                    const yStr = thisDate.getFullYear();
                    const mStr = String(thisDate.getMonth() + 1).padStart(2, '0');
                    const dStr = String(thisDate.getDate()).padStart(2, '0');
                    const dateStr = `${yStr}-${mStr}-${dStr}`;

                    const isPast = thisDate.getTime() < todayObj.getTime();
                    const isTooFar = thisDate.getTime() > maxBookingDate.getTime();
                    const isToday = thisDate.getTime() === todayObj.getTime();

                    dayCells.push({ dayNum: d, dateStr, isPast, isTooFar, isToday });
                  }

                  const prevMonth = () => {
                    safeHapticLight();
                    setCalendarViewDate(new Date(viewYear, viewMonth - 1, 1));
                  };

                  const nextMonth = () => {
                    safeHapticLight();
                    setCalendarViewDate(new Date(viewYear, viewMonth + 1, 1));
                  };

                  const canGoPrev = new Date(viewYear, viewMonth, 1).getTime() > new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).getTime();

                  return (
                    <View style={styles.calendarContainer}>
                      {/* Month navigation header */}
                      <View style={styles.calendarMonthHeader}>
                        <TouchableOpacity
                          disabled={!canGoPrev}
                          onPress={prevMonth}
                          style={[styles.calendarNavBtn, !canGoPrev && { opacity: 0.3 }]}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="chevron-back" size={20} color={isDark ? '#e2e8f0' : '#334155'} />
                        </TouchableOpacity>

                        <Text style={[styles.calendarMonthTitle, isDark && styles.darkText]}>
                          {monthName}
                        </Text>

                        <TouchableOpacity
                          onPress={nextMonth}
                          style={styles.calendarNavBtn}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="chevron-forward" size={20} color={isDark ? '#e2e8f0' : '#334155'} />
                        </TouchableOpacity>
                      </View>

                      {/* Day names header */}
                      <View style={styles.calendarWeekRow}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dw, idx) => (
                          <Text
                            key={dw}
                            style={[
                              styles.calendarWeekText,
                              idx === 0 && { color: '#ef4444' },
                              isDark && styles.darkSubtext,
                            ]}
                          >
                            {dw}
                          </Text>
                        ))}
                      </View>

                      {/* Days Grid */}
                      <View style={styles.calendarGrid}>
                        {dayCells.map((cell, idx) => {
                          if (!cell) {
                            return <View key={`empty-${idx}`} style={styles.calendarDayCell} />;
                          }

                          const isSelected = cell.dateStr === selectedDate;
                          const isDisabled = cell.isPast || cell.isTooFar;

                          return (
                            <TouchableOpacity
                              key={cell.dateStr}
                              disabled={isDisabled}
                              style={[
                                styles.calendarDayCell,
                                cell.isToday && !isSelected && (isDark ? styles.calendarTodayDark : styles.calendarTodayLight),
                                isSelected && styles.calendarDaySelected,
                                isDisabled && styles.calendarDayDisabled,
                              ]}
                              onPress={() => {
                                safeHapticLight();
                                setSelectedDate(cell.dateStr);
                                setActivePicker(null);
                              }}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.calendarDayText,
                                  isDark && styles.darkText,
                                  cell.isToday && !isSelected && styles.calendarTodayText,
                                  isSelected && styles.calendarSelectedText,
                                  isDisabled && (isDark ? styles.calendarDisabledDarkText : styles.calendarDisabledLightText),
                                ]}
                              >
                                {cell.dayNum}
                              </Text>
                              {cell.isToday && (
                                <View
                                  style={[
                                    styles.calendarTodayDot,
                                    isSelected && { backgroundColor: '#ffffff' },
                                  ]}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Quick jump to Today */}
                      <View style={styles.calendarFooter}>
                        <TouchableOpacity
                          style={styles.calendarQuickTodayBtn}
                          onPress={() => {
                            safeHapticLight();
                            const today = new Date();
                            const yStr = today.getFullYear();
                            const mStr = String(today.getMonth() + 1).padStart(2, '0');
                            const dStr = String(today.getDate()).padStart(2, '0');
                            setSelectedDate(`${yStr}-${mStr}-${dStr}`);
                            setCalendarViewDate(new Date(yStr, today.getMonth(), 1));
                            setActivePicker(null);
                          }}
                        >
                          <Ionicons name="flash-outline" size={14} color="#0284c7" style={{ marginRight: 4 }} />
                          <Text style={styles.calendarQuickTodayText}>Today ({todayObj.getDate()} {todayObj.toLocaleDateString('en-US', { month: 'short' })})</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}

                {/* 5. Slot Options */}
                {activePicker === 'slot' &&
                  (availableSlots.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={[styles.pickerOptionSub, isDark && styles.darkSubtext]}>
                        No slots available for this date.
                      </Text>
                    </View>
                  ) : (
                    availableSlots.map((s) => {
                      const isFull = s.is_full || s.current_bookings >= s.max_bookings;
                      const isSelected = s.time_range === selectedSlot;

                      return (
                        <TouchableOpacity
                          key={s.time_range}
                          disabled={isFull}
                          style={[
                            styles.pickerOptionItem,
                            isDark && styles.darkBorder,
                            isFull && { opacity: 0.4 },
                            isSelected && (isDark ? styles.pickerActiveItemDark : styles.pickerActiveItemLight),
                          ]}
                          onPress={() => {
                            safeHapticLight();
                            setSelectedSlot(s.time_range);
                            setActivePicker(null);
                          }}
                        >
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color="#0284c7"
                            style={{ marginRight: 10 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.pickerOptionTitle, isDark && styles.darkText]}>
                              {s.time_range}
                            </Text>
                            <Text style={[styles.pickerOptionSub, isDark && styles.darkSubtext]}>
                              {isFull ? 'Slot Full' : 'Available for booking'}
                            </Text>
                          </View>
                          {isFull ? (
                            <View style={styles.fullBadge}>
                              <Text style={styles.fullBadgeText}>FULL</Text>
                            </View>
                          ) : isSelected ? (
                            <Ionicons name="checkmark-circle" size={20} color="#0284c7" />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })
                  ))}

                {/* 6. Addon Options (Multi-select) */}
                {activePicker === 'addons' && (
                  <View>
                    {availableAddons.length === 0 ? (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={[styles.pickerOptionSub, isDark && styles.darkSubtext]}>
                          No add-ons available for this vehicle.
                        </Text>
                      </View>
                    ) : (
                      availableAddons.map((ad) => {
                        const isChecked = selectedAddonIds.includes(ad.id);
                        return (
                          <TouchableOpacity
                            key={ad.id}
                            style={[
                              styles.pickerOptionItem,
                              isDark && styles.darkBorder,
                              isChecked && (isDark ? styles.pickerActiveItemDark : styles.pickerActiveItemLight),
                            ]}
                            onPress={() => toggleAddon(ad.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={isChecked ? 'checkbox' : 'square-outline'}
                              size={22}
                              color={isChecked ? '#10b981' : isDark ? '#64748b' : '#94a3b8'}
                              style={{ marginRight: 10 }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.pickerOptionTitle, isDark && styles.darkText]}>
                                {ad.name}
                              </Text>
                            </View>
                            <Text style={styles.addonPriceGreen}>+₹{ad.price}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                    <TouchableOpacity
                      style={styles.pickerDoneBtn}
                      onPress={() => setActivePicker(null)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.pickerDoneBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkRoot: {
    backgroundColor: '#090d16',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  darkTopBar: {
    backgroundColor: '#0d1527',
    borderBottomColor: '#1e293b',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
  },
  successBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  successCheckCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  paymentBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#e11d48',
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rememberedTag: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  addonCountTag: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  lightDropdown: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  darkDropdown: {
    backgroundColor: '#0d1527',
    borderColor: '#1e293b',
  },
  dropdownActiveBorder: {
    borderColor: '#10b981',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dropdownValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '400',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addressBoxWrapper: {
    gap: 8,
  },
  addressRadioBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  addressBoxActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  addressRadioTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  addressRadioTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  addressRadioText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  changeAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  changeAddressText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  addressInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#0f172a',
    textAlignVertical: 'top',
    marginTop: 6,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  couponBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  couponFeedback: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  pointsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  pointsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  pointsSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  paymentOptionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
  },
  paymentOptionActive: {
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  paymentCardAmountCyan: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284c7',
    marginBottom: 2,
  },
  paymentCardAmountGreen: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 2,
  },
  paymentCardNote: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 12,
  },
  summaryBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  summaryHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  summaryItemLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryItemVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  darkBottomBar: {
    backgroundColor: '#0d1527',
    borderTopColor: '#1e293b',
  },
  bottomBarLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  bottomBarPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#0284c7',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  /* Picker Modal Backdrop & Sheet */
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBackdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pickerSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderRadius: 20,
    width: '92%',
    maxWidth: 500,
    maxHeight: '72%',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  darkPickerSheet: {
    backgroundColor: '#0d1527',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  pickerCloseBtn: {
    padding: 4,
  },
  pickerListScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerActiveItemLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pickerActiveItemDark: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pickerOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  pickerOptionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  pickerPriceTag: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  badgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
  },
  fullBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ef4444',
  },
  addonPriceGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  pickerDoneBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  pickerDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  darkText: {
    color: '#f8fafc',
  },
  darkSubtext: {
    color: '#94a3b8',
  },
  darkInput: {
    backgroundColor: '#0d1527',
    borderColor: '#1e293b',
    color: '#f8fafc',
  },
  darkBorder: {
    borderBottomColor: '#1e293b',
  },

  /* Calendar Component Styles */
  calendarContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  calendarMonthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 6,
  },
  calendarWeekText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 10,
    position: 'relative',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  calendarTodayLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  calendarTodayDark: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  calendarTodayText: {
    color: '#0284c7',
    fontWeight: '800',
  },
  calendarDaySelected: {
    backgroundColor: '#0284c7',
  },
  calendarSelectedText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  calendarDayDisabled: {
    opacity: 0.25,
  },
  calendarDisabledLightText: {
    color: '#94a3b8',
  },
  calendarDisabledDarkText: {
    color: '#475569',
  },
  calendarTodayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0284c7',
  },
  calendarFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  calendarQuickTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  calendarQuickTodayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
});
