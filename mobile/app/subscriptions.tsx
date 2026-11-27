import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '../constants/api';
import { showSweetAlert } from '../utils/sweetAlert';
import AppFooter, { FooterTab } from '../components/AppFooter';
import DashboardHeader from '../components/DashboardHeader';
import SubscriptionScheduleModal from '../components/SubscriptionScheduleModal';
import { useAppTheme } from '../utils/themeManager';

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

const SAMPLE_PLANS: Plan[] = [
  {
    id: 1,
    name: '4 Washes Monthly Plan',
    vehicle_type: 'all',
    description: '4 washes in the selected month\nChoose a separate date and slot for each wash\nFull advance payment\nNon-refundable',
    price: 2450,
    frequency_days: 30,
    max_bookings: 4,
    custom_badge: '4 WASHES',
    is_subscription: true,
  },
  {
    id: 26,
    name: '26 Washes Monthly Pass',
    vehicle_type: 'all',
    description: '26 washes in the selected month\nSelect only the month at purchase\nFull advance payment\nNon-refundable\nRescheduling available',
    price: 4999,
    frequency_days: 30,
    max_bookings: 26,
    custom_badge: '26 WASHES',
    is_subscription: true,
  },
];

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;
  const { isDark, toggleTheme } = useAppTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedPlanForSchedule, setSelectedPlanForSchedule] = useState<Plan | null>(null);
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab | 'none'>('none');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      return { value, label };
    });
  }, []);

  const selectedMonthLabel = useMemo(() => {
    const m = monthOptions.find((item) => item.value === selectedMonth);
    return m ? m.label : selectedMonth;
  }, [monthOptions, selectedMonth]);

  const syncUser = useCallback(async () => {
    const storedUser = await AsyncStorage.getItem('userData');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      setToken(userToken);
      setIsLoggedIn(Boolean(userToken));

      const reqHeaders: Record<string, string> = {
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      };
      if (userToken) reqHeaders.Authorization = `Bearer ${userToken}`;

      const [packagesRes, subsRes] = await Promise.all([
        fetch(`${API_BASE}/api/packages`, { headers: reqHeaders })
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        userToken
          ? fetch(`${API_BASE}/api/customer/subscriptions`, { headers: reqHeaders })
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => [])
          : Promise.resolve([]),
      ]);

      const cleaned = Array.isArray(packagesRes)
        ? packagesRes.filter((item: any) => {
            const isSubscription = Boolean(item?.is_subscription);
            const isAddon = Boolean(item?.is_addon);
            const frequencyDays = Number(item?.frequency_days ?? 0);
            const washes = Number(item?.max_bookings ?? 0);
            return (isSubscription || (!isAddon && frequencyDays >= 30)) && [4, 26].includes(washes);
          })
        : SAMPLE_PLANS;
      setPlans(cleaned.length ? cleaned : SAMPLE_PLANS);

      if (Array.isArray(subsRes)) {
        const active = subsRes.find((s: any) => s.status === 'active') || null;
        setActiveSub(active);
      } else {
        setActiveSub(null);
      }
    } catch (error) {
      setPlans(SAMPLE_PLANS);
      setActiveSub(null);
      console.log('Using sample subscription plans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    syncUser();
    loadPlans();
  }, [loadPlans, syncUser]);

  useFocusEffect(
    useCallback(() => {
      syncUser();
    }, [syncUser])
  );

  const monthlyPlans = useMemo(() => {
    return plans.filter((plan) => {
      const isSubscription = Boolean(plan.is_subscription);
      const isAddon = Boolean(plan.is_addon);
      const frequencyDays = Number(plan.frequency_days ?? 0);
      return isSubscription || (!isAddon && frequencyDays >= 30);
    });
  }, [plans]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlans();
  };

  const handleFooterTabPress = (tab: FooterTab) => {
    setActiveFooterTab(tab);
  };

  const formatPrice = (value: number | string | undefined) => {
    const num = typeof value === 'number' ? value : Number(value || 0);
    if (!Number.isFinite(num)) return '₹0';

    return `₹${new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(num)}`;
  };

  const toggleDescription = (planId: number) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleSubscribe = (plan: Plan) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const washes = Number(plan.max_bookings || 0);
    if ([4, 26].includes(washes)) {
      setSelectedPlanForSchedule(plan);
      setScheduleModalVisible(true);
      return;
    }

    showSweetAlert(
      'Confirm Subscription',
      'Payment will be full, in advance and non-refundable. You may reschedule your washes. Proceed?',
      'warning',
      () => {
        setSelectedPlanForSchedule(plan);
        setScheduleModalVisible(true);
      }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={[styles.loaderText, isDark && styles.subtleTextDark]}>Loading subscriptions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <DashboardHeader
        user={user}
        title="Subscriptions"
        subtitle={`${monthlyPlans.length} active wash plans`}
        unreadCount={0}
        isDark={isDark}
        onNotificationPress={() => router.push('/notifications')}
        onToggleTheme={toggleTheme}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >


        {monthlyPlans.map((plan) => {
          const hasMonthly = (plan.frequency_days || 0) > 0;
          const summaryLines = (plan.description || '').split(/\r?\n|•|,/).map((line) => line.trim()).filter(Boolean);
          const summaryText = summaryLines.join(' • ') || 'Premium car wash plan';
          const hasMoreDescription = summaryLines.length > 1;
          const isExpanded = Boolean(expandedDescriptions[plan.id]);

          return (
            <View key={plan.id} style={[styles.planCard, isDark && styles.planCardDark]}>
              <View style={styles.cardTopRow}>
                <View style={styles.leftBadges}>
                  <View style={[styles.tag, isDark && styles.tagDark]}>
                    <Text style={[styles.tagText, isDark && styles.tagTextDark]}>{(plan.vehicle_type || 'all').toUpperCase()}</Text>
                  </View>
                  <View style={styles.statusTag}>
                    <Text style={styles.statusText}>{hasMonthly ? 'MONTHLY PASS' : 'ONE-TIME'}</Text>
                  </View>
                </View>

                {plan.custom_badge && (
                  <View style={styles.highlightTag}>
                    <Text style={styles.highlightText}>{plan.custom_badge}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.planName, isDark && styles.titleDark]}>{plan.name}</Text>

              <View style={styles.descriptionWrap}>
                <Text
                  style={[styles.descriptionText, isDark && styles.featureTextDark]}
                  numberOfLines={isExpanded ? undefined : 1}
                >
                  {summaryText}
                </Text>

                {hasMoreDescription && (
                  <TouchableOpacity activeOpacity={0.8} onPress={() => toggleDescription(plan.id)}>
                    <Text style={styles.readMoreText}>{isExpanded ? 'Read Less' : 'Read More'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Feature note matching web */}
              <View style={[styles.planFeatureNoteWrap, isDark && styles.planFeatureNoteWrapDark]}>
                <Ionicons name="information-circle-outline" size={14} color="#38bdf8" />
                <Text style={[styles.planFeatureNoteText, isDark && styles.subtleTextDark]}>
                  {Number(plan.max_bookings) === 4
                    ? '4 separate wash slots may be booked on separate days in the selected month.'
                    : Number(plan.max_bookings) === 26
                    ? '26 washes are available in the selected month; choose the month only at purchase.'
                    : `${plan.max_bookings || 1} washes included with flexible scheduling.`}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.metaBlock}>
                  {(plan.max_bookings || 0) > 1 && (
                    <Text style={[styles.washesIncluded, isDark && styles.subtleTextDark]}>
                      {plan.max_bookings} washes included
                    </Text>
                  )}
                </View>

                <View style={styles.priceBlock}>
                  <View style={styles.priceRow}>
                    <Text style={styles.currency}>₹</Text>
                    <Text style={[styles.price, isDark && styles.titleDark]}>{formatPrice(plan.price)}</Text>
                    {hasMonthly && <Text style={[styles.period, isDark && styles.subtleTextDark]}> / mo</Text>}
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.chooseBtn, subscribingId === plan.id && styles.chooseBtnDisabled]}
                  onPress={() => handleSubscribe(plan)}
                  disabled={subscribingId === plan.id}
                >
                  <Text style={styles.chooseBtnText}>{subscribingId === plan.id ? 'Subscribing...' : 'Subscribe Now'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Subscription Schedule Modal */}
      <SubscriptionScheduleModal
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
        onSuccess={() => {
          setScheduleModalVisible(false);
          loadPlans();
        }}
        plan={selectedPlanForSchedule}
        selectedMonth={selectedMonth}
        selectedMonthLabel={selectedMonthLabel}
        token={token}
        isDark={isDark}
      />

      <AppFooter
        activeTab={activeFooterTab}
        isDark={isDark}
        onTabPress={handleFooterTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#07182b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#07182b',
    borderBottomWidth: 1,
    borderBottomColor: '#0f2940',
  },
  headerDark: {
    backgroundColor: '#07182b',
    borderBottomColor: '#0f2940',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  titleDark: {
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2,
  },
  subtleTextDark: {
    color: '#94a3b8',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 14,
    paddingBottom: 32,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#475569',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
  },
  sectionHeaderDark: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  badgePill: {
    backgroundColor: '#fef3c7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.4,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  planCardDark: {
    backgroundColor: '#0d2337',
    borderColor: '#38bdf8',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#0a1b2a',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  tagDark: {
    backgroundColor: '#0a1b2a',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dbeafe',
  },
  tagTextDark: {
    color: '#dbeafe',
  },
  statusTag: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.4,
  },
  highlightTag: {
    backgroundColor: '#f5d0fe',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  highlightText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7e22ce',
    letterSpacing: 0.4,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  descriptionWrap: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 12,
    color: '#475569',
    includeFontPadding: false,
    lineHeight: 18,
  },
  readMoreText: {
    color: '#7dd3fc',
    fontWeight: '700',
    marginTop: 4,
  },
  featureTextDark: {
    color: '#dbeafe',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    gap: 12,
  },
  metaBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  priceBlock: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  currency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34d399',
    marginBottom: 2,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: -0.2,
  },
  period: {
    fontSize: 11,
    color: '#cbd5e1',
    marginBottom: 6,
    marginLeft: 4,
  },
  washesIncluded: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  chooseBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chooseBtnDisabled: {
    opacity: 0.7,
  },
  chooseBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  monthSelector: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  monthSelectorDark: {
    backgroundColor: '#10243a',
    borderColor: '#1e3a5f',
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  monthOptions: {
    gap: 8,
    paddingRight: 8,
  },
  monthOption: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  monthOptionActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  monthOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  monthOptionTextActive: {
    color: '#ffffff',
  },
  paymentNote: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  activeSubCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  activeSubCardDark: {
    backgroundColor: '#10243a',
    borderColor: '#1e3a5f',
    borderLeftColor: '#10b981',
  },
  activeSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeSubTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  emeraldBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  emeraldBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  activeSubBody: {
    marginTop: 4,
  },
  activeSubPlanName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0284c7',
    marginBottom: 4,
  },
  activeSubUsage: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 4,
  },
  whiteText: {
    color: '#f8fafc',
  },
  activeSubDates: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
  },
  scheduleWashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38bdf8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  scheduleWashBtnText: {
    color: '#07182b',
    fontSize: 12,
    fontWeight: '800',
  },
  activeSubEmpty: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  planFeatureNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  planFeatureNoteWrapDark: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  planFeatureNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#0369a1',
    lineHeight: 15,
    fontWeight: '600',
  },
});
