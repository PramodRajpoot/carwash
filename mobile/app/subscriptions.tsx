import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
    name: 'Happywash Express',
    vehicle_type: 'hatchback',
    description: 'Foam exterior wash\nInterior vacuum\nMat cleaning\nGlass cleaning',
    price: 245.18,
    frequency_days: 30,
    max_bookings: 4,
    custom_badge: 'POPULAR',
    is_subscription: true,
  },
  {
    id: 2,
    name: 'Happy Wash + Car Shine',
    vehicle_type: 'hatchback',
    description: 'Foam wash\nEngine clean\nDashboard polish\nFull body wax',
    price: 409.18,
    frequency_days: 30,
    max_bookings: 4,
    custom_badge: 'BEST VALUE',
    is_subscription: true,
  },
  {
    id: 3,
    name: 'Full Interior Spa + Exterior',
    vehicle_type: 'sedan',
    description: 'Interior vacuum\nDashboard polish\nSnow foam wash\nTire dressing',
    price: 799,
    frequency_days: 0,
    max_bookings: 1,
    is_subscription: false,
  },
  {
    id: 4,
    name: 'Monthly Premium Detailing Pass',
    vehicle_type: 'suv',
    description: '8 doorstep exterior washes\nDeep interior vacuum\nCeramic wax touch-up',
    price: 2499,
    frequency_days: 30,
    max_bookings: 8,
    custom_badge: 'PREMIUM',
    is_subscription: true,
  },
  {
    id: 7,
    name: 'Teflon Coating & Paint Correction',
    vehicle_type: 'sedan',
    description: 'Paint polish\nScratch correction\nHydrophobic sealant\n12-month shine protection',
    price: 5999,
    frequency_days: 0,
    max_bookings: 1,
    custom_badge: 'TOP SHINE',
    is_subscription: false,
  },
  {
    id: 8,
    name: 'Commercial Fleet Maintenance',
    vehicle_type: 'commercial',
    description: 'Heavy-duty power wash\nUnderbody rinse\nInterior sanitizing',
    price: 1499,
    frequency_days: 0,
    max_bookings: 1,
    is_subscription: false,
  },
];

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab>('book');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});

  const loadPlans = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(Boolean(token));

      const response = await fetch(`${API_BASE}/api/packages`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
      });

      if (!response.ok) {
        throw new Error('Packages request failed');
      }

      const data = await response.json();
      const cleaned = Array.isArray(data)
        ? data.filter((item: any) => {
            const isSubscription = Boolean(item?.is_subscription);
            const isAddon = Boolean(item?.is_addon);
            const frequencyDays = Number(item?.frequency_days ?? 0);
            return isSubscription || (!isAddon && frequencyDays >= 30);
          })
        : SAMPLE_PLANS;
      setPlans(cleaned.length ? cleaned : SAMPLE_PLANS);
    } catch (error) {
      setPlans(SAMPLE_PLANS);
      console.log('Using sample subscription plans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const syncTheme = useCallback(async () => {
    const storedTheme = await AsyncStorage.getItem('app_theme');
    setIsDark(storedTheme === 'dark');
  }, []);

  useEffect(() => {
    syncTheme();
    loadPlans();
  }, [loadPlans, syncTheme]);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('app_theme', next ? 'dark' : 'light');
  }, [isDark]);

  useFocusEffect(
    useCallback(() => {
      syncTheme();
    }, [syncTheme])
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

    if (tab === 'home') {
      router.replace('/dashboard');
      return;
    }

    if (tab === 'garage') {
      router.push('/garage');
      return;
    }

    if (tab === 'book') {
      router.push('/bookings');
      return;
    }

    if (tab === 'support') {
      router.push('/support');
    }
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

  const handleSubscribe = async (plan: Plan) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    showSweetAlert(
      'Subscribe plan',
      'Subscribing will activate this package immediately and expire any previous active plan. Proceed?',
      'warning',
      async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (!token) {
            router.push('/login');
            return;
          }

          setSubscribingId(plan.id);
          const response = await axios.post(
            `${API_BASE}/api/customer/subscriptions`,
            { package_id: plan.id },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true',
                'Bypass-Tunnel-Reminder': 'true',
              },
            }
          );

          showSweetAlert('Success', response.data?.message || 'Subscription activated successfully.', 'success');
          await loadPlans();
        } catch (error: any) {
          const message = error?.response?.data?.message || 'Failed to subscribe.';
          showSweetAlert('Subscription failed', message, 'error');
        } finally {
          setSubscribingId(null);
        }
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
        user={null}
        title="Subscriptions"
        subtitle={`${monthlyPlans.length} active wash plans`}
        unreadCount={0}
        isDark={isDark}
        onProfilePress={() => router.push('/dashboard')}
        onNotificationPress={() => router.push('/dashboard')}
        onToggleTheme={toggleTheme}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        <View style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.titleDark]}>Monthly Wash Plans</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>SAVE UP TO 40%</Text>
          </View>
        </View>

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
});
