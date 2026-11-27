import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { useRouter } from 'expo-router';

import { API_BASE } from '../constants/api';
import { showSweetAlert } from '../utils/sweetAlert';
import { safeHapticLight, safeHapticMedium, safeHapticSuccess } from '../utils/haptics';
import { isSlotTimePassed } from '../utils/slotHelper';
import { WaterElectricityCard, WaterElectricityModal } from './WaterElectricitySection';

interface Plan {
  id: number;
  name: string;
  vehicle_type?: string;
  category?: { name?: string };
  description?: string;
  price?: number | string;
  frequency_days?: number;
  max_bookings?: number;
  custom_badge?: string;
  is_addon?: boolean;
  is_subscription?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan: Plan | null;
  selectedMonth: string; // YYYY-MM
  selectedMonthLabel: string;
  token: string | null;
  isDark?: boolean;
}

interface ScheduleItem {
  date: string;
  slot: string;
}

interface SlotItem {
  time_range: string;
  is_full?: boolean;
  is_past?: boolean;
  current_bookings?: number;
  max_bookings?: number;
}

function buildCashfreeCheckoutHtml(sessionId: string, mode: string = 'sandbox') {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    body {
      margin: 0; padding: 24px;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      min-height: 80vh; background: #07182b; color: #fff; font-family: -apple-system, sans-serif;
      text-align: center;
    }
    .spinner {
      width: 44px; height: 44px; border: 4px solid #1e293b;
      border-top-color: #38bdf8; border-radius: 50%;
      animation: spin 0.9s linear infinite; margin-bottom: 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 1.15rem; margin: 0 0 8px 0; color: #f8fafc; }
    p { font-size: 0.85rem; color: #94a3b8; margin: 0 0 16px 0; }
    .badge {
      display: inline-block; padding: 6px 14px; background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 999px;
      font-size: 0.75rem; color: #38bdf8;
    }
  </style>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
</head>
<body>
  <div class="spinner"></div>
  <h2>Opening Secure Checkout</h2>
  <p>Connecting to Cashfree Payment Gateway...</p>
  <div class="badge">🔒 256-Bit SSL Encrypted</div>

  <script>
    window.addEventListener('load', function() {
      try {
        var cashfree = Cashfree({ mode: "${mode}" });
        cashfree.checkout({
          paymentSessionId: "${sessionId}",
          redirectTarget: "_self"
        }).then(function(result) {
          if (result && result.error) {
            alert(result.error.message || 'Payment initialization error');
          }
        }).catch(function(err) {
          alert(err && err.message ? err.message : 'Checkout error');
        });
      } catch (e) {
        alert('Failed to load payment SDK');
      }
    });
  </script>
</body>
</html>`;
}

export default function SubscriptionScheduleModal({
  visible,
  onClose,
  onSuccess,
  plan,
  selectedMonth,
  selectedMonthLabel,
  token,
  isDark = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const requiredCount = Number(plan?.max_bookings || 4);
  const is26Plan = requiredCount === 26;

  // Master Data
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  // Slots for 4-wash plan: mapping from wash index to available slot array
  const [scheduleSlots, setScheduleSlots] = useState<Record<number, SlotItem[]>>({});
  const [scheduleSlotLoading, setScheduleSlotLoading] = useState<Record<number, boolean>>({});

  // Subpickers
  const [activePicker, setActivePicker] = useState<'vehicle' | 'center' | 'slot' | 'calendar' | null>(null);
  const [activeWashIndex, setActiveWashIndex] = useState<number | null>(null);

  // Calendar Picker state
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());

  // Submitting & Cashfree WebView
  const [submitting, setSubmitting] = useState(false);
  const [cashfreeModalVisible, setCashfreeModalVisible] = useState(false);
  const [cashfreeHtml, setCashfreeHtml] = useState<string | null>(null);
  const [cashfreeOrderId, setCashfreeOrderId] = useState<string | null>(null);
  const [hasWaterElectricity, setHasWaterElectricity] = useState<boolean>(true);
  const [waterElecModalVisible, setWaterElecModalVisible] = useState<boolean>(false);

  // Date range constraints matching web
  const monthMinDate = useMemo(() => {
    const today = new Date();
    const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentMonth = todayValue.slice(0, 7);
    if (selectedMonth === currentMonth) return todayValue;
    return `${selectedMonth}-01`;
  }, [selectedMonth]);

  const monthMaxDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextMonthObj = new Date(year, month, 1);
    const nextYear = nextMonthObj.getFullYear();
    const nextMonthStr = String(nextMonthObj.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(nextYear, nextMonthObj.getMonth() + 1, 0).getDate();
    return `${nextYear}-${nextMonthStr}-${String(lastDay).padStart(2, '0')}`;
  }, [selectedMonth]);

  const allowedMonths = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextMonthObj = new Date(year, month, 1);
    const nextMonthValue = `${nextMonthObj.getFullYear()}-${String(nextMonthObj.getMonth() + 1).padStart(2, '0')}`;
    return [selectedMonth, nextMonthValue];
  }, [selectedMonth]);

  // Reset or initialize items when modal opens or plan changes
  useEffect(() => {
    if (!visible || !plan) return;

    const count = Number(plan.max_bookings || 4);
    setScheduleItems(Array.from({ length: count }, () => ({ date: '', slot: '' })));
    setScheduleSlots({});
    setScheduleSlotLoading({});
    setSelectedVehicleId(null);
    setSelectedCenterId(null);
    setAddress('');
    setActivePicker(null);
    setActiveWashIndex(null);

    // Initial calendar view positioned to selected month
    const [y, m] = selectedMonth.split('-').map(Number);
    setCalendarViewDate(new Date(y, m - 1, 1));

    // Load master data
    let isMounted = true;
    setLoadingInitial(true);

    const loadData = async () => {
      try {
        const headers: Record<string, string> = {
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const [vehRes, cenRes, dashRes] = await Promise.all([
          axios.get(`${API_BASE}/api/customer/vehicles`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/api/centers`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/api/customer/dashboard`, { headers }).catch(() => ({ data: {} })),
        ]);

        if (isMounted) {
          const vehList = Array.isArray(vehRes.data) ? vehRes.data : [];
          const cenList = Array.isArray(cenRes.data) ? cenRes.data : [];
          setVehicles(vehList);
          setCenters(cenList);
          setAddress(dashRes.data?.address || '');

          if (vehList.length > 0) setSelectedVehicleId(vehList[0].id);
          if (cenList.length > 0) setSelectedCenterId(cenList[0].id);
        }
      } catch (err) {
        console.error('Error loading subscription modal data:', err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [visible, plan, selectedMonth, token]);

  const formatScheduleDate = (date: string) => {
    if (!date) return '';
    try {
      const [y, m, d] = date.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return date;
    }
  };

  const getNextDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const d = new Date(year, month - 1, day + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const getWashMinDate = (index: number) => {
    if (requiredCount !== 4) return monthMinDate;
    if (index === 0) return monthMinDate;
    const prevDate = scheduleItems[index - 1]?.date;
    if (!prevDate) return monthMinDate;
    const nextDay = getNextDate(prevDate);
    return nextDay > monthMinDate ? nextDay : monthMinDate;
  };

  const isWashDisabled = (index: number) => {
    if (requiredCount !== 4) return false;
    if (index === 0) return false;
    return !scheduleItems[index - 1]?.date;
  };

  // Load slots for a wash
  const loadScheduleSlots = useCallback(async (index: number, date: string, centerId: number | null) => {
    if (!centerId || !date) {
      setScheduleSlots((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    setScheduleSlotLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const headers: Record<string, string> = {
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.get(`${API_BASE}/api/bookings/slots`, {
        params: { franchisee_id: centerId, date },
        headers,
      });

      const slotList: SlotItem[] = Array.isArray(res.data) ? res.data : [];
      setScheduleSlots((prev) => ({ ...prev, [index]: slotList }));
    } catch (err) {
      setScheduleSlots((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setScheduleSlotLoading((prev) => ({ ...prev, [index]: false }));
    }
  }, [token]);

  // When center changes, refresh slots for any wash that has a date picked
  const handleCenterChange = (newCenterId: number) => {
    setSelectedCenterId(newCenterId);
    if (!is26Plan) {
      scheduleItems.forEach((item, idx) => {
        if (item.date) {
          loadScheduleSlots(idx, item.date, newCenterId);
        }
      });
    }
  };

  // Date selection handler for 4-wash plan
  const onScheduleDateSelected = (index: number, chosenDate: string) => {
    if (requiredCount === 4) {
      if (index > 0) {
        const prevDate = scheduleItems[index - 1]?.date;
        if (prevDate && chosenDate && chosenDate <= prevDate) {
          showSweetAlert(
            'Invalid Date',
            `Wash ${index + 1} date must be after Wash ${index} date (${formatScheduleDate(prevDate)}).`,
            'warning'
          );
          return;
        }
      }

      setScheduleItems((prev) => {
        const copy = [...prev];
        copy[index] = { date: chosenDate, slot: '' };

        // Clear any subsequent wash whose previous wash date is empty or invalid
        for (let i = index + 1; i < copy.length; i++) {
          const pDate = copy[i - 1]?.date;
          if (!pDate || (copy[i].date && copy[i].date <= pDate)) {
            copy[i] = { date: '', slot: '' };
          }
        }
        return copy;
      });

      loadScheduleSlots(index, chosenDate, selectedCenterId);
    }
  };

  // Auto-generate 26 dates
  const autoGenerate26Dates = (startDate: string) => {
    if (!startDate) return;
    if (startDate < monthMinDate) {
      showSweetAlert('Invalid Date', 'Previous dates cannot be selected.', 'warning');
      return;
    }
    const [y, m, d] = startDate.split('-').map(Number);
    const start = new Date(y, m - 1, d);

    const generated: ScheduleItem[] = [];
    for (let i = 0; i < 26; i++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + i);
      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, '0');
      const day = String(cur.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      if (dateString > monthMaxDate) {
        showSweetAlert(
          'Date Exceeds Month Limit',
          'Selected starting date causes scheduled washes to exceed the subscription period.',
          'warning'
        );
        return;
      }
      generated.push({ date: dateString, slot: '' });
    }

    setScheduleItems(generated);
  };

  // Validation and submit
  const handleConfirmWashSchedule = async () => {
    if (!plan) return;

    if (!selectedVehicleId) {
      showSweetAlert('Select Vehicle', 'Please select a vehicle for your subscription.', 'warning');
      return;
    }
    if (!selectedCenterId) {
      showSweetAlert('Select Center', 'Please choose a servicing center.', 'warning');
      return;
    }
    if (!address.trim()) {
      showSweetAlert('Enter Address', 'Please enter your complete doorstep address.', 'warning');
      return;
    }

    const dates = scheduleItems.map((item) => item.date);
    if (dates.some((date) => !date) || (!is26Plan && scheduleItems.some((item) => !item.slot))) {
      showSweetAlert(
        'Incomplete Selection',
        `Please select date${is26Plan ? '' : ' and slot'} for all ${requiredCount} washes.`,
        'warning'
      );
      return;
    }

    if (!is26Plan && scheduleItems.some((item) => isSlotTimePassed(item.date, item.slot))) {
      showSweetAlert('Slot Expired', 'One or more selected slots have already passed for today. Please pick upcoming slots.', 'warning');
      return;
    }

    if (new Set(dates).size !== requiredCount) {
      showSweetAlert('Duplicate Dates', `Please select ${requiredCount} different dates.`, 'warning');
      return;
    }

    if (dates.some((date) => !allowedMonths.includes(date.slice(0, 7)))) {
      showSweetAlert('Invalid Dates', 'All wash dates must be inside the selected month or following month.', 'warning');
      return;
    }

    if (dates.some((date) => date < monthMinDate || date > monthMaxDate)) {
      showSweetAlert('Invalid Dates', 'Selected dates are outside the allowed subscription period.', 'warning');
      return;
    }

    if (requiredCount === 4) {
      for (let i = 1; i < dates.length; i++) {
        if (dates[i] <= dates[i - 1]) {
          showSweetAlert(
            'Invalid Date Sequence',
            `Wash ${i + 1} date must be after Wash ${i} date (${formatScheduleDate(dates[i - 1])}).`,
            'warning'
          );
          return;
        }
      }
    }

    if (!hasWaterElectricity) {
      setWaterElecModalVisible(true);
      return;
    }

    setSubmitting(true);
    safeHapticMedium();

    try {
      const headers: Record<string, string> = {
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const { data } = await axios.post(
        `${API_BASE}/api/cashfree/create-subscription-order`,
        {
          package_id: plan.id,
          selected_month: selectedMonth,
          vehicle_id: Number(selectedVehicleId),
          franchisee_id: Number(selectedCenterId),
          address: address.trim(),
          has_water_electricity: true,
          schedules: scheduleItems.map((item) => ({
            date: item.date,
            slot: is26Plan ? '' : item.slot,
          })),
        },
        { headers }
      );

      if (data.status !== 'success' || !data.payment_session_id) {
        showSweetAlert('Error', data.message || 'Could not initiate subscription payment.', 'error');
        setSubmitting(false);
        return;
      }

      setCashfreeOrderId(data.cashfree_order_id);
      setCashfreeHtml(buildCashfreeCheckoutHtml(data.payment_session_id, data.environment || 'sandbox'));
      setCashfreeModalVisible(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate subscription payment.';
      showSweetAlert('Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Verify Cashfree Payment
  const handleVerifyCashfreePayment = async (orderId: string) => {
    try {
      const headers: Record<string, string> = {
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.get(`${API_BASE}/api/cashfree/verify/${orderId}`, { headers });
      setCashfreeModalVisible(false);

      if (
        res.data?.status === 'success' ||
        res.data?.payment_status === 'paid' ||
        res.data?.payment_status === 'partially_paid'
      ) {
        safeHapticSuccess();
        showSweetAlert(
          'Subscription Activated',
          'Your monthly subscription has been created and verified successfully!',
          'success',
          () => {
            onSuccess();
            onClose();
          }
        );
      } else {
        showSweetAlert(
          'Payment Processing',
          'Your payment is being processed and will activate your subscription shortly.',
          'info',
          () => {
            onSuccess();
            onClose();
          }
        );
      }
    } catch (err: any) {
      setCashfreeModalVisible(false);
      showSweetAlert('Payment Error', 'Could not verify payment status. Please check your bookings page.', 'error');
    }
  };

  // Selected vehicle & center objects
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId]
  );
  const selectedCenter = useMemo(
    () => centers.find((c) => c.id === selectedCenterId),
    [centers, selectedCenterId]
  );

  // Calendar rendering
  const renderCalendar = () => {
    const viewYear = calendarViewDate.getFullYear();
    const viewMonth = calendarViewDate.getMonth();
    const monthName = calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const minDateForWash = activeWashIndex !== null ? getWashMinDate(activeWashIndex) : monthMinDate;

    const dayCells: Array<{ dayNum: number; dateStr: string; disabled: boolean; isToday: boolean } | null> = [];
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push(null);
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const curDate = new Date(viewYear, viewMonth, d);
      const cy = curDate.getFullYear();
      const cm = String(curDate.getMonth() + 1).padStart(2, '0');
      const cd = String(curDate.getDate()).padStart(2, '0');
      const dateStr = `${cy}-${cm}-${cd}`;

      const disabled = dateStr < minDateForWash || dateStr > monthMaxDate;
      const isToday = dateStr === todayStr;

      dayCells.push({ dayNum: d, dateStr, disabled, isToday });
    }

    const prevMonth = () => {
      safeHapticLight();
      setCalendarViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const nextMonth = () => {
      safeHapticLight();
      setCalendarViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    return (
      <View style={[styles.calendarWrap, isDark && styles.calendarWrapDark]}>
        <View style={styles.calendarHeaderRow}>
          <TouchableOpacity onPress={prevMonth} style={styles.calArrowBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={20} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
          <Text style={[styles.calendarMonthTitle, isDark && styles.whiteText]}>{monthName}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.calArrowBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        </View>

        <View style={styles.calDaysHeader}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <Text key={day} style={[styles.calDayHeaderCell, isDark && styles.subtleTextDark]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calGrid}>
          {dayCells.map((cell, idx) => {
            if (!cell) {
              return <View key={`empty-${idx}`} style={styles.calCell} />;
            }

            const isSelected = activeWashIndex !== null && scheduleItems[activeWashIndex]?.date === cell.dateStr;

            return (
              <TouchableOpacity
                key={cell.dateStr}
                disabled={cell.disabled}
                style={[
                  styles.calCell,
                  cell.isToday && !isSelected && (isDark ? styles.calTodayDark : styles.calTodayLight),
                  isSelected && styles.calCellSelected,
                  cell.disabled && styles.calCellDisabled,
                ]}
                onPress={() => {
                  safeHapticLight();
                  if (is26Plan) {
                    autoGenerate26Dates(cell.dateStr);
                  } else if (activeWashIndex !== null) {
                    onScheduleDateSelected(activeWashIndex, cell.dateStr);
                  }
                  setActivePicker(null);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.calCellText,
                    isDark && styles.whiteText,
                    isSelected && styles.calCellTextSelected,
                    cell.disabled && (isDark ? styles.calCellTextDisabledDark : styles.calCellTextDisabledLight),
                  ]}
                >
                  {cell.dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalRoot, isDark && styles.modalRootDark]}>
        {/* Top Header */}
        <View style={[styles.topBar, isDark && styles.topBarDark]}>
          <View style={styles.topBarLeft}>
            <View style={styles.headerIconSquircle}>
              <Ionicons name="calendar" size={18} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, isDark && styles.whiteText]}>
                Choose Your {requiredCount} Wash Dates & Slots
              </Text>
              <Text style={[styles.modalSubtitle, isDark && styles.subtleTextDark]}>
                Select {requiredCount} separate days in {selectedMonthLabel}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>

        {loadingInitial ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={[styles.loadingText, isDark && styles.subtleTextDark]}>Loading service details...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Plan Info Badge Banner */}
            <View style={[styles.planBadgeBanner, isDark && styles.planBadgeBannerDark]}>
              <View style={styles.planBadgeBannerTop}>
                <View style={styles.planBadgeCategory}>
                  <Text style={styles.planBadgeCategoryText}>{(plan?.vehicle_type || 'all').toUpperCase()}</Text>
                </View>
                <View style={styles.planBadgePill}>
                  <Text style={styles.planBadgePillText}>{requiredCount} WASHES PASS</Text>
                </View>
                <View style={styles.planBadgeMonth}>
                  <Text style={styles.planBadgeMonthText}>{selectedMonthLabel}</Text>
                </View>
              </View>
              <Text style={[styles.planBadgeName, isDark && styles.whiteText]}>{plan?.name}</Text>
              <Text style={[styles.planBadgePrice, isDark && styles.subtleTextDark]}>
                Advance Subscription • ₹{plan?.price || 0} / month
              </Text>
            </View>

            {/* Vehicle & Center Selectors */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, isDark && styles.whiteText]}>Vehicle & Location</Text>

              <View style={styles.formRow}>
                {/* Vehicle Selector */}
                <View style={styles.formCol}>
                  <Text style={[styles.inputLabel, isDark && styles.subtleTextDark]}>Vehicle</Text>
                  <TouchableOpacity
                    style={[styles.selectBox, isDark && styles.selectBoxDark]}
                    onPress={() => {
                      safeHapticLight();
                      setActivePicker('vehicle');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="car-outline" size={17} color="#38bdf8" />
                    <Text
                      style={[
                        styles.selectBoxText,
                        isDark && styles.whiteText,
                        !selectedVehicle && (isDark ? styles.placeholderDarkText : styles.placeholderText),
                      ]}
                      numberOfLines={1}
                    >
                      {selectedVehicle
                        ? `${selectedVehicle.make_model || selectedVehicle.make || 'Vehicle'} ${selectedVehicle.plate_number ? `(${selectedVehicle.plate_number})` : ''}`
                        : 'Select Vehicle'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>
                </View>

                {/* Service Center Selector */}
                <View style={styles.formCol}>
                  <Text style={[styles.inputLabel, isDark && styles.subtleTextDark]}>Service Center</Text>
                  <TouchableOpacity
                    style={[styles.selectBox, isDark && styles.selectBoxDark]}
                    onPress={() => {
                      safeHapticLight();
                      setActivePicker('center');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="business-outline" size={17} color="#38bdf8" />
                    <Text
                      style={[
                        styles.selectBoxText,
                        isDark && styles.whiteText,
                        !selectedCenter && (isDark ? styles.placeholderDarkText : styles.placeholderText),
                      ]}
                      numberOfLines={1}
                    >
                      {selectedCenter ? selectedCenter.name || selectedCenter.center_name : 'Select Center'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Doorstep Address */}
              <View style={styles.addressBlock}>
                <Text style={[styles.inputLabel, isDark && styles.subtleTextDark]}>Doorstep Service Address</Text>
                <TextInput
                  style={[styles.addressInput, isDark && styles.addressInputDark]}
                  placeholder="Enter complete doorstep address"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Wash Schedule */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, isDark && styles.whiteText]}>
                Wash Schedule ({requiredCount} Washes)
              </Text>

              {is26Plan ? (
                /* ── 26 WASHES PLAN ── */
                <View style={[styles.cardItem, isDark && styles.cardItemDark]}>
                  <Text style={[styles.cardTitle, isDark && styles.whiteText]}>Select the First Wash Date</Text>
                  <TouchableOpacity
                    style={[styles.selectBox, isDark && styles.selectBoxDark, { marginTop: 6 }]}
                    onPress={() => {
                      safeHapticLight();
                      setActiveWashIndex(0);
                      const [y, m] = selectedMonth.split('-').map(Number);
                      setCalendarViewDate(new Date(y, m - 1, 1));
                      setActivePicker('calendar');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#38bdf8" />
                    <Text
                      style={[
                        styles.selectBoxText,
                        isDark && styles.whiteText,
                        !scheduleItems[0]?.date && (isDark ? styles.placeholderDarkText : styles.placeholderText),
                      ]}
                    >
                      {scheduleItems[0]?.date ? formatScheduleDate(scheduleItems[0].date) : 'Choose starting date'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>

                  {scheduleItems[0]?.date ? (
                    <View style={{ marginTop: 14 }}>
                      <View style={styles.infoNoteBox}>
                        <Ionicons name="information-circle" size={18} color="#0284c7" />
                        <Text style={[styles.infoNoteText, isDark && styles.subtleTextDark]}>
                          25 following dates are scheduled automatically. No slot selection is required for daily pass.
                        </Text>
                      </View>
                      <View style={styles.datesGrid26}>
                        {scheduleItems.map((item, idx) => (
                          <View key={idx} style={[styles.pill26, isDark && styles.pill26Dark]}>
                            <Text style={styles.pill26Index}>W{idx + 1}:</Text>
                            <Text style={[styles.pill26Date, isDark && styles.whiteText]}>
                              {formatScheduleDate(item.date)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : (
                /* ── 4 WASHES PLAN ── */
                scheduleItems.map((item, index) => {
                  const disabled = isWashDisabled(index);
                  const minDateStr = getWashMinDate(index);
                  const slotLoading = scheduleSlotLoading[index] || false;

                  return (
                    <View key={index} style={[styles.cardItem, isDark && styles.cardItemDark]}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.washNumberBadge}>
                          <Text style={styles.washNumberBadgeText}>{index + 1}</Text>
                        </View>
                        <Text style={[styles.cardTitle, isDark && styles.whiteText]}>Wash {index + 1}</Text>
                        {item.date && item.slot ? (
                          <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginLeft: 'auto' }} />
                        ) : null}
                      </View>

                      <View style={styles.formRow}>
                        {/* Date Picker Button */}
                        <View style={styles.formCol}>
                          <Text style={[styles.inputLabel, isDark && styles.subtleTextDark]}>Date</Text>
                          <TouchableOpacity
                            disabled={disabled}
                            style={[
                              styles.selectBox,
                              isDark && styles.selectBoxDark,
                              disabled && (isDark ? styles.selectBoxDisabledDark : styles.selectBoxDisabled),
                            ]}
                            onPress={() => {
                              safeHapticLight();
                              setActiveWashIndex(index);
                              const targetDate = item.date ? item.date : minDateStr;
                              const [y, m] = targetDate.split('-').map(Number);
                              setCalendarViewDate(new Date(y, m - 1, 1));
                              setActivePicker('calendar');
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="calendar-outline" size={16} color={disabled ? '#94a3b8' : '#38bdf8'} />
                            <Text
                              style={[
                                styles.selectBoxText,
                                isDark && styles.whiteText,
                                !item.date && (isDark ? styles.placeholderDarkText : styles.placeholderText),
                                disabled && (isDark ? styles.disabledDarkText : styles.disabledText),
                              ]}
                              numberOfLines={1}
                            >
                              {item.date ? formatScheduleDate(item.date) : 'Select Date'}
                            </Text>
                            <Ionicons name="chevron-down" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                          </TouchableOpacity>

                          {disabled ? (
                            <Text style={[styles.helperText, isDark && styles.subtleTextDark]}>
                              Select Wash {index} date first
                            </Text>
                          ) : index > 0 && scheduleItems[index - 1]?.date ? (
                            <Text style={[styles.helperText, isDark && styles.subtleTextDark]}>
                              After {formatScheduleDate(scheduleItems[index - 1].date)}
                            </Text>
                          ) : null}
                        </View>

                        {/* Slot Picker Button */}
                        <View style={styles.formCol}>
                          <Text style={[styles.inputLabel, isDark && styles.subtleTextDark]}>Time Slot</Text>
                          <TouchableOpacity
                            disabled={!item.date || !selectedCenterId || slotLoading}
                            style={[
                              styles.selectBox,
                              isDark && styles.selectBoxDark,
                              (!item.date || !selectedCenterId || slotLoading) &&
                                (isDark ? styles.selectBoxDisabledDark : styles.selectBoxDisabled),
                            ]}
                            onPress={() => {
                              safeHapticLight();
                              setActiveWashIndex(index);
                              setActivePicker('slot');
                            }}
                            activeOpacity={0.8}
                          >
                            {slotLoading ? (
                              <ActivityIndicator size="small" color="#38bdf8" />
                            ) : (
                              <Ionicons
                                name="time-outline"
                                size={16}
                                color={!item.date || !selectedCenterId ? '#94a3b8' : '#38bdf8'}
                              />
                            )}
                            <Text
                              style={[
                                styles.selectBoxText,
                                isDark && styles.whiteText,
                                !item.slot && (isDark ? styles.placeholderDarkText : styles.placeholderText),
                                (!item.date || !selectedCenterId) && (isDark ? styles.disabledDarkText : styles.disabledText),
                              ]}
                              numberOfLines={1}
                            >
                              {item.slot ? item.slot : slotLoading ? 'Loading...' : 'Select Slot'}
                            </Text>
                            <Ionicons name="chevron-down" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Water & Electricity Requirement */}
            <View style={{ marginHorizontal: 16 }}>
              <WaterElectricityCard
                value={hasWaterElectricity}
                onChange={setHasWaterElectricity}
                onRequestWarning={() => setWaterElecModalVisible(true)}
                isDark={isDark}
              />
            </View>
          </ScrollView>
        )}

        {/* Fixed Bottom Action Bar */}
        {!loadingInitial && (
          <View style={[styles.bottomBar, isDark && styles.bottomBarDark, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.bottomPriceCol}>
              <Text style={[styles.bottomPriceLabel, isDark && styles.subtleTextDark]}>Total Amount</Text>
              <Text style={[styles.bottomPriceValue, isDark && styles.whiteText]}>
                ₹{plan?.price || 0}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, submitting && styles.btnDisabled]}
              onPress={handleConfirmWashSchedule}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#07182b" />
              ) : (
                <View style={styles.btnRow}>
                  <Ionicons name="lock-closed" size={16} color="#07182b" />
                  <Text style={styles.primaryBtnText}>Continue to Full Payment</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── SUBPICKER BOTTOM SHEET / MODAL ── */}
        {activePicker && (
          <Modal
            visible={true}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setActivePicker(null)}
          >
            <View style={styles.pickerBackdrop}>
              <TouchableOpacity
                style={styles.pickerBackdropDismiss}
                activeOpacity={1}
                onPress={() => setActivePicker(null)}
              />
              <View style={[styles.pickerSheet, isDark && styles.pickerSheetDark]}>
                {/* Picker Header */}
                <View style={[styles.pickerHeader, isDark && styles.pickerHeaderDark]}>
                  <Text style={[styles.pickerHeaderTitle, isDark && styles.whiteText]}>
                    {activePicker === 'vehicle' && 'Select Vehicle'}
                    {activePicker === 'center' && 'Select Service Center'}
                    {activePicker === 'slot' && `Select Wash ${Number(activeWashIndex || 0) + 1} Slot`}
                    {activePicker === 'calendar' && (is26Plan ? 'Choose Starting Wash Date' : `Choose Wash ${Number(activeWashIndex || 0) + 1} Date`)}
                  </Text>
                  <TouchableOpacity onPress={() => setActivePicker(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={22} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>
                </View>

                {/* Calendar Mode */}
                {activePicker === 'calendar' && renderCalendar()}

                {/* Vehicle List */}
                {activePicker === 'vehicle' && (
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {vehicles.length === 0 ? (
                      <View style={styles.emptyPickerBox}>
                        <Ionicons name="car-outline" size={32} color="#94a3b8" />
                        <Text style={[styles.subtleText, isDark && styles.subtleTextDark, { marginTop: 8 }]}>
                          No registered vehicles found.
                        </Text>
                      </View>
                    ) : (
                      vehicles.map((v) => {
                        const isSelected = selectedVehicleId === v.id;
                        return (
                          <TouchableOpacity
                            key={v.id}
                            style={[
                              styles.pickerOption,
                              isDark && styles.pickerOptionDark,
                              isSelected && (isDark ? styles.pickerOptionActiveDark : styles.pickerOptionActiveLight),
                            ]}
                            onPress={() => {
                              setSelectedVehicleId(v.id);
                              setActivePicker(null);
                            }}
                          >
                            <Ionicons
                              name="car-outline"
                              size={20}
                              color={isSelected ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b')}
                            />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={[styles.pickerOptionTitle, isDark && styles.whiteText]}>
                                {v.make_model || v.make || 'Vehicle'}
                              </Text>
                              <Text style={[styles.subtleText, isDark && styles.subtleTextDark]}>
                                {v.plate_number || v.registration_number || 'No plate'} • {(v.vehicle_type || '').toUpperCase()}
                              </Text>
                            </View>
                            {isSelected && <Ionicons name="checkmark-circle" size={20} color={isDark ? '#38bdf8' : '#0284c7'} />}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                )}

                {/* Center List */}
                {activePicker === 'center' && (
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {centers.length === 0 ? (
                      <View style={styles.emptyPickerBox}>
                        <Ionicons name="business-outline" size={32} color={isDark ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.subtleText, isDark && styles.subtleTextDark, { marginTop: 8 }]}>
                          No service centers available.
                        </Text>
                      </View>
                    ) : (
                      centers.map((c) => {
                        const isSelected = selectedCenterId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[
                              styles.pickerOption,
                              isDark && styles.pickerOptionDark,
                              isSelected && (isDark ? styles.pickerOptionActiveDark : styles.pickerOptionActiveLight),
                            ]}
                            onPress={() => {
                              handleCenterChange(c.id);
                              setActivePicker(null);
                            }}
                          >
                            <Ionicons
                              name="business-outline"
                              size={20}
                              color={isSelected ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b')}
                            />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={[styles.pickerOptionTitle, isDark && styles.whiteText]}>
                                {c.name || c.center_name}
                              </Text>
                              <Text style={[styles.subtleText, isDark && styles.subtleTextDark]}>
                                {c.address || c.city || 'Doorstep Service Hub'}
                              </Text>
                            </View>
                            {isSelected && <Ionicons name="checkmark-circle" size={20} color={isDark ? '#38bdf8' : '#0284c7'} />}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                )}

                {/* Time Slot List */}
                {activePicker === 'slot' && activeWashIndex !== null && (
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {(() => {
                      const slots = scheduleSlots[activeWashIndex] || [];
                      if (slots.length === 0) {
                        return (
                          <View style={styles.emptyPickerBox}>
                            <Ionicons name="time-outline" size={32} color={isDark ? '#64748b' : '#94a3b8'} />
                            <Text style={[styles.subtleText, isDark && styles.subtleTextDark, { marginTop: 8 }]}>
                              No slots available for this date.
                            </Text>
                          </View>
                        );
                      }
                      const targetDate = scheduleItems[activeWashIndex]?.date;
                      return slots.map((s, idx) => {
                        const isPassed = Boolean(s.is_past || isSlotTimePassed(targetDate, s.time_range));
                        const isFull = Boolean(s.is_full || (s.max_bookings && s.current_bookings && s.current_bookings >= s.max_bookings) || isPassed);
                        const isSelected = scheduleItems[activeWashIndex]?.slot === s.time_range;
                        return (
                          <TouchableOpacity
                            key={idx}
                            disabled={isFull}
                            style={[
                              styles.pickerOption,
                              isDark && styles.pickerOptionDark,
                              isSelected && (isDark ? styles.pickerOptionActiveDark : styles.pickerOptionActiveLight),
                              isFull && styles.pickerOptionDisabled,
                            ]}
                            onPress={() => {
                              setScheduleItems((prev) => {
                                const copy = [...prev];
                                copy[activeWashIndex] = { ...copy[activeWashIndex], slot: s.time_range };
                                return copy;
                              });
                              setActivePicker(null);
                            }}
                          >
                            <Ionicons
                              name="time-outline"
                              size={18}
                              color={isPassed ? '#94a3b8' : isSelected ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b')}
                            />
                            <Text style={[styles.pickerOptionTitle, { flex: 1, marginLeft: 12 }, isDark && styles.whiteText, isPassed && { textDecorationLine: 'line-through', opacity: 0.7 }]}>
                              {s.time_range}
                            </Text>
                            {isPassed ? (
                              <View style={[styles.fullBadge, { backgroundColor: '#fee2e2' }]}>
                                <Text style={[styles.fullBadgeText, { color: '#ef4444' }]}>PASSED</Text>
                              </View>
                            ) : isFull ? (
                              <View style={styles.fullBadge}>
                                <Text style={styles.fullBadgeText}>FULL</Text>
                              </View>
                            ) : isSelected ? (
                              <Ionicons name="checkmark-circle" size={20} color={isDark ? '#38bdf8' : '#0284c7'} />
                            ) : null}
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        )}

        {/* ── CASHFREE CHECKOUT WEBVIEW MODAL ── */}
        <Modal
          visible={cashfreeModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setCashfreeModalVisible(false)}
        >
          <View style={[styles.cfContainer, isDark && styles.cfContainerDark]}>
            <View style={[styles.cfHeader, isDark && styles.cfHeaderDark, { paddingTop: Math.max(insets.top, 14) }]}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Cancel Payment?',
                    'Are you sure you want to exit the payment process?',
                    [
                      { text: 'Continue Payment', style: 'cancel' },
                      { text: 'Yes, Exit', style: 'destructive', onPress: () => setCashfreeModalVisible(false) },
                    ]
                  );
                }}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
              </TouchableOpacity>
              <Text style={[styles.cfTitle, isDark && styles.whiteText]}>Complete Payment</Text>
              <View style={{ width: 24 }} />
            </View>

            {cashfreeHtml && (
              <WebView
                source={{ html: cashfreeHtml, baseUrl: 'https://sdk.cashfree.com' }}
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
                onShouldStartLoadWithRequest={(request) => {
                  if (
                    request.url.includes('/cashfree/return') ||
                    request.url.includes('cashfree_order_id=') ||
                    request.url.startsWith('cleanatdoorstep://cashfree/return')
                  ) {
                    const match = request.url.match(/cashfree_order_id=([^&]+)/) || request.url.match(/order_id=([^&]+)/);
                    const orderId = match ? decodeURIComponent(match[1]) : cashfreeOrderId;
                    if (orderId) {
                      handleVerifyCashfreePayment(orderId);
                    } else {
                      setCashfreeModalVisible(false);
                    }
                    return false;
                  }
                  return true;
                }}
                onNavigationStateChange={(nav) => {
                  if (
                    nav.url.includes('/cashfree/return') ||
                    nav.url.includes('cashfree_order_id=') ||
                    nav.url.startsWith('cleanatdoorstep://cashfree/return')
                  ) {
                    const match = nav.url.match(/cashfree_order_id=([^&]+)/) || nav.url.match(/order_id=([^&]+)/);
                    const orderId = match ? decodeURIComponent(match[1]) : cashfreeOrderId;
                    if (orderId) {
                      handleVerifyCashfreePayment(orderId);
                    } else {
                      setCashfreeModalVisible(false);
                    }
                  }
                }}
                style={{ flex: 1, backgroundColor: '#07182b' }}
              />
            )}
          </View>
        </Modal>

        {/* Water & Electricity Warning Modal */}
        <WaterElectricityModal
          visible={waterElecModalVisible}
          onClose={() => setWaterElecModalVisible(false)}
          onGotIt={() => {
            setWaterElecModalVisible(false);
            onClose();
            router.push('/services');
          }}
          isDark={isDark}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalRootDark: {
    backgroundColor: '#07182b',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topBarDark: {
    backgroundColor: '#0a1d33',
    borderBottomColor: '#1e3a5f',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  headerIconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  planBadgeBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  planBadgeBannerDark: {
    backgroundColor: '#0a1d33',
    borderColor: '#1e3a5f',
  },
  planBadgeBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  planBadgeCategory: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#0284c7',
    borderRadius: 6,
  },
  planBadgeCategoryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  planBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 6,
  },
  planBadgePillText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  planBadgeMonth: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderRadius: 6,
  },
  planBadgeMonthText: {
    color: '#0284c7',
    fontSize: 10,
    fontWeight: '700',
  },
  planBadgeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  planBadgePrice: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 5,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  selectBoxDark: {
    backgroundColor: '#0a1d33',
    borderColor: '#1e3a5f',
  },
  selectBoxDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.65,
  },
  selectBoxDisabledDark: {
    backgroundColor: '#07182b',
    opacity: 0.45,
  },
  selectBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '400',
  },
  placeholderDarkText: {
    color: '#64748b',
    fontWeight: '400',
  },
  disabledText: {
    color: '#94a3b8',
  },
  disabledDarkText: {
    color: '#475569',
  },
  helperText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  addressBlock: {
    marginTop: 10,
  },
  addressInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#0f172a',
    textAlignVertical: 'top',
    minHeight: 52,
  },
  addressInputDark: {
    backgroundColor: '#0a1d33',
    borderColor: '#1e3a5f',
    color: '#f8fafc',
  },
  cardItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  cardItemDark: {
    backgroundColor: '#0a1d33',
    borderColor: '#1e3a5f',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  washNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  washNumberBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  infoNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#0369a1',
    lineHeight: 15,
  },
  datesGrid26: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill26: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  pill26Dark: {
    backgroundColor: '#07182b',
    borderColor: '#1e3a5f',
  },
  pill26Index: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
  },
  pill26Date: {
    fontSize: 10,
    color: '#0f172a',
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 8 },
    }),
  },
  bottomBarDark: {
    backgroundColor: '#0a1d33',
    borderTopColor: '#1e3a5f',
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  bottomPriceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0284c7',
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pickerBackdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pickerSheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  pickerSheetDark: {
    backgroundColor: '#0a1d33',
    borderColor: '#1e3a5f',
    borderWidth: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerHeaderDark: {
    borderBottomColor: '#1e3a5f',
  },
  pickerHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  pickerScroll: {
    maxHeight: 320,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pickerOptionDark: {
    backgroundColor: '#0f243c',
    borderColor: '#1e3a5f',
  },
  pickerOptionActiveLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: '#0284c7',
  },
  pickerOptionActiveDark: {
    backgroundColor: 'rgba(2, 132, 199, 0.35)',
    borderColor: '#38bdf8',
  },
  pickerOptionDisabled: {
    opacity: 0.45,
  },
  pickerOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyPickerBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  fullBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  calendarWrap: {
    paddingVertical: 4,
  },
  calendarWrapDark: {},
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calArrowBtn: {
    padding: 6,
  },
  calendarMonthTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  calDaysHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calDayHeaderCell: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 8,
  },
  calCellSelected: {
    backgroundColor: '#0284c7',
  },
  calTodayLight: {
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  calTodayDark: {
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  calCellDisabled: {
    opacity: 0.22,
  },
  calCellText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  calCellTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  calCellTextDisabledLight: {
    color: '#cbd5e1',
  },
  calCellTextDisabledDark: {
    color: '#475569',
  },
  cfContainer: {
    flex: 1,
    backgroundColor: '#07182b',
  },
  cfContainerDark: {
    backgroundColor: '#07182b',
  },
  cfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#07182b',
  },
  cfHeaderDark: {
    backgroundColor: '#07182b',
  },
  cfTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  whiteText: {
    color: '#f8fafc',
  },
  subtleText: {
    fontSize: 11,
    color: '#64748b',
  },
  subtleTextDark: {
    color: '#94a3b8',
  },
});
