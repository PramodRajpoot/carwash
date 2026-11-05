import React, { useCallback, useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '../constants/api';
import AppFooter, { FooterTab } from '../components/AppFooter';
import DashboardHeader from '../components/DashboardHeader';
import { showSweetAlert } from '../utils/sweetAlert';

interface WishlistPackage {
  id?: number;
  name?: string;
  description?: string;
  price?: number | string;
  vehicle_type?: string;
}

interface WishlistItem {
  id: number;
  package_id?: number;
  package?: WishlistPackage;
}

const formatType = (value?: string) => {
  if (!value) return 'SERVICE';
  return value.toUpperCase().replace('_', ' ');
};

const formatPrice = (value?: number | string) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
};

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16) + 6;

  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [user, setUser] = useState<any>({ name: 'User' });

  const syncTheme = useCallback(async () => {
    const storedTheme = await AsyncStorage.getItem('app_theme');
    setIsDark(storedTheme === 'dark');
  }, []);

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

  const fetchWishlist = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setWishlist([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/customer/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      setWishlist(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Wishlist fetch error:', error);
      setWishlist([]);
      showSweetAlert('Unable to load wishlist', undefined, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleTheme = useCallback(async () => {
    const nextTheme = !isDark ? 'dark' : 'light';
    setIsDark(nextTheme === 'dark');
    await AsyncStorage.setItem('app_theme', nextTheme);
  }, [isDark]);

  const removeItem = useCallback(async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await axios.delete(`${API_BASE}/api/customer/wishlist/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      setWishlist((prev) => prev.filter((item) => item.id !== id));
      showSweetAlert('Removed', 'Item removed from your wishlist.', 'success');
    } catch (error) {
      console.error('Wishlist remove error:', error);
      showSweetAlert('Failed', 'Unable to remove the item right now.', 'error');
    }
  }, []);

  useEffect(() => {
    syncTheme();
    syncUser();
    fetchWishlist();
  }, [fetchWishlist, syncTheme, syncUser]);

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
      router.push('/book');
      return;
    }

    if (tab === 'support') {
      router.push('/support');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.page, isDark && styles.darkPage]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <DashboardHeader
          user={user}
          title="Wishlist"
          subtitle="Saved services"
          isDark={isDark}
          showLocation={false}
          onToggleTheme={handleToggleTheme}
        />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={isDark ? '#f8fafc' : '#0284c7'} />
          <Text style={[styles.loaderText, isDark && styles.darkSubtext]}>Loading wishlist...</Text>
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
        title="Wishlist"
        subtitle="Saved services"
        isDark={isDark}
        showLocation={false}
        onToggleTheme={handleToggleTheme}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {wishlist.length === 0 ? (
          <View style={[styles.emptyCard, isDark && styles.darkCard]}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="heart-outline" size={28} color="#e11d48" />
            </View>
            <Text style={[styles.emptyTitle, isDark && styles.darkText]}>Your wishlist is empty</Text>
            <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
              Bookmark packages you plan to book later.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.primaryBtn}
              onPress={() => router.push('/dashboard')}
            >
              <Text style={styles.primaryBtnText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {wishlist.map((item) => {
              const pkg = item.package;
              const packageName = pkg?.name || 'Service Package';
              const description = pkg?.description || 'No description available.';

              return (
                <View key={item.id} style={[styles.card, isDark && styles.darkCard]}>
                  <View style={styles.cardTopRow}>
                    <View style={[styles.typeBadge, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
                      <Text style={styles.typeBadgeText}>{formatType(pkg?.vehicle_type)}</Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.removeBtn}
                      onPress={() => removeItem(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.cardTitle, isDark && styles.darkText]}>{packageName}</Text>
                  <Text style={[styles.cardDescription, isDark && styles.darkSubtext]}>{description}</Text>

                  <View style={styles.bottomRow}>
                    <Text style={styles.priceText}>{formatPrice(pkg?.price)}</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.bookBtn}
                      onPress={() => router.push('/bookings')}
                    >
                      <Text style={styles.bookBtnText}>Book Service</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 120,
  },
  loaderText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
  },
  darkSubtext: {
    color: '#94a3b8',
  },
  darkText: {
    color: '#f8fafc',
  },
  darkCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  emptyIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 0.5,
  },
  removeBtn: {
    padding: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    gap: 12,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16a34a',
  },
  bookBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
