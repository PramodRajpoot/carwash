import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '../constants/api';
import AppFooter, { FooterTab } from '../components/AppFooter';
import DashboardHeader from '../components/DashboardHeader';
import { showSweetAlert } from '../utils/sweetAlert';

interface Coupon {
  id: number;
  code: string;
  discount_type?: 'percentage' | 'fixed' | string;
  discount_value?: number | string;
  expires_at?: string | null;
}

interface BannerItem {
  title: string;
  icon: string;
  desc: string;
  color: string;
}

export default function OfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16) + 6;

  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>({ name: 'User' });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const syncTheme = useCallback(async () => {
    const storedTheme = await AsyncStorage.getItem('app_theme');
    setIsDark(storedTheme === 'dark');
  }, []);

  const handleToggleTheme = useCallback(async () => {
    const nextTheme = !isDark ? 'dark' : 'light';
    setIsDark(nextTheme === 'dark');
    await AsyncStorage.setItem('app_theme', nextTheme);
  }, [isDark]);

  const syncUser = useCallback(async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed || { name: 'User' });
      } catch {
        setUser({ name: 'User' });
      }
    }
  }, []);

  const loadOffers = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setCoupons([]);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/customer/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      setCoupons(Array.isArray(response.data?.active_coupons) ? response.data.active_coupons : []);
    } catch (error) {
      console.log('Offers load error:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncTheme();
    syncUser();
    loadOffers();
  }, [loadOffers, syncTheme, syncUser]);

  useFocusEffect(
    useCallback(() => {
      syncTheme();
      syncUser();
      loadOffers();
    }, [loadOffers, syncTheme, syncUser])
  );

  const handleFooterTabPress = (tab: FooterTab) => {
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

  const typeLabel = (type?: string) => {
    return type === 'percentage' ? 'Percentage Discount' : 'Fixed Discount';
  };

  const formatOfferText = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    }
    return `₹${coupon.discount_value} OFF`;
  };

  const copyCoupon = async (code: string) => {
    if (!code) return;
    setCopiedCode(code);
    showSweetAlert('Copied', 'Coupon code copied to your clipboard.', 'success');
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const banners = useMemo<BannerItem[]>(() => [
    {
      title: 'Monsoon Special',
      icon: '🌧️',
      desc: 'Keep your car protected this monsoon season. Extra care package now available!',
      color: '#38bdf8',
    },
    {
      title: 'Fleet Discount',
      icon: '🚌',
      desc: '15% off on all commercial vehicle packages booked in bulk this month.',
      color: '#34d399',
    },
    {
      title: 'Weekend Rush',
      icon: '⚡',
      desc: 'Book any Saturday slot and get priority scheduling with our premium team.',
      color: '#fbbf24',
    },
    {
      title: 'Referral Bonus',
      icon: '🎁',
      desc: 'Refer 5 friends this month and earn double E-Points — 20 pts per referral!',
      color: '#a78bfa',
    },
  ], []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.page, isDark && styles.darkPage]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <DashboardHeader user={user} title="Offers & Coupons" subtitle="Best deals" isDark={isDark} onToggleTheme={handleToggleTheme} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={isDark ? '#f8fafc' : '#0284c7'} />
          <Text style={[styles.loaderText, isDark && styles.darkSubtext]}>Loading offers...</Text>
        </View>
        <AppFooter activeTab="home" isDark={isDark} onTabPress={handleFooterTabPress} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.page, isDark && styles.darkPage]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <DashboardHeader
        user={user}
        title="Offers & Coupons"
        subtitle="Best deals"
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Active Offers & Coupons</Text>

          {coupons.length === 0 ? (
            <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
              No active offers right now. Check back soon!
            </Text>
          ) : (
            <View style={styles.grid}>
              {coupons.map((coupon) => (
                <View key={coupon.id} style={[styles.offerCard, isDark && styles.darkOfferCard]}>
                  <View style={styles.offerAccent} />
                  <Text style={[styles.offerType, isDark && styles.darkSubtext]}>{typeLabel(coupon.discount_type)}</Text>
                  <Text style={[styles.codeText, isDark && styles.darkText]}>{coupon.code}</Text>
                  <Text style={[styles.offerText, { color: coupon.discount_type === 'percentage' ? '#22c55e' : '#f59e0b' }]}>
                    {formatOfferText(coupon)}
                  </Text>
                  <Text style={[styles.expiryText, isDark && styles.darkSubtext]}>
                    {coupon.expires_at ? `Expires: ${coupon.expires_at}` : 'No expiry'}
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.copyBtn, copiedCode === coupon.code && styles.copyBtnSuccess]}
                    onPress={() => copyCoupon(coupon.code)}
                  >
                    <Text style={[styles.copyBtnText, copiedCode === coupon.code && styles.copyBtnTextSuccess]}>
                      {copiedCode === coupon.code ? '✓ Copied' : 'Copy Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Seasonal Promotions</Text>

          <View style={styles.bannerGrid}>
            {banners.map((banner) => (
              <View key={banner.title} style={[styles.bannerCard, isDark && styles.darkBannerCard]}>
                <Text style={styles.bannerIcon}>{banner.icon}</Text>
                <Text style={[styles.bannerTitle, { color: banner.color }]}>{banner.title}</Text>
                <Text style={[styles.bannerText, isDark && styles.darkSubtext]}>{banner.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <AppFooter activeTab="home" isDark={isDark} onTabPress={handleFooterTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkPage: {
    backgroundColor: '#090d16',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  darkCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    paddingVertical: 18,
    textAlign: 'center',
  },
  grid: {
    gap: 12,
  },
  offerCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: 14,
    padding: 14,
    minHeight: 170,
  },
  darkOfferCard: {
    backgroundColor: '#0f172a',
    borderColor: '#7c3aed',
  },
  offerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 70,
    height: 70,
    borderBottomLeftRadius: 70,
    backgroundColor: '#a78bfa',
    opacity: 0.12,
  },
  offerType: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '700',
  },
  codeText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#7c3aed',
    marginBottom: 8,
  },
  offerText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  copyBtn: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnSuccess: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  copyBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  copyBtnTextSuccess: {
    color: '#ffffff',
  },
  bannerGrid: {
    gap: 12,
  },
  bannerCard: {
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  darkBannerCard: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  bannerIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  darkText: {
    color: '#f8fafc',
  },
  darkSubtext: {
    color: '#cbd5e1',
  },
});
