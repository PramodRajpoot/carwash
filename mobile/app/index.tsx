import React, { useState, useEffect } from 'react';
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
  Dimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Your Laravel server URL ──
import { API_BASE } from '../constants/api';

const { width } = Dimensions.get('window');

// Sample data - shown when API is unreachable
const SAMPLE_PACKAGES = [
  { id: 1, name: 'Basic Exterior Wash', vehicle_type: 'hatchback', description: 'Quick exterior wash including rinse, foam, hand wash, and wipe dry. Perfect for regular maintenance.', price: 299, frequency_days: 0, max_bookings: 1 },
  { id: 2, name: 'Full Interior + Exterior', vehicle_type: 'sedan', description: 'Complete interior vacuuming, dashboard polish, exterior wash, tire dressing, and glass cleaning.', price: 799, frequency_days: 0, max_bookings: 1 },
  { id: 3, name: 'Monthly Premium Plan', vehicle_type: 'suv', description: 'Unlimited exterior washes with bi-weekly interior cleaning. Includes ceramic coating touch-up.', price: 2499, frequency_days: 30, max_bookings: 8 },
  { id: 4, name: 'Deep Detailing Package', vehicle_type: 'sedan', description: 'Engine bay cleaning, clay bar treatment, paint correction, and premium wax coating for long-lasting shine.', price: 3999, frequency_days: 0, max_bookings: 1 },
  { id: 5, name: 'Monthly Basic Plan', vehicle_type: 'hatchback', description: '4 exterior washes per month with interior dusting. Best value for daily commuters.', price: 999, frequency_days: 30, max_bookings: 4 },
  { id: 6, name: 'Commercial Fleet Wash', vehicle_type: 'commercial', description: 'Heavy-duty wash for commercial vehicles including undercarriage cleaning and sanitization.', price: 1499, frequency_days: 0, max_bookings: 1 },
];

// Vehicle type filters
const FILTERS = [
  { label: '🔥 All', value: 'all' },
  { label: '🚗 Hatchback', value: 'hatchback' },
  { label: '🚘 Sedan', value: 'sedan' },
  { label: '🚙 SUV', value: 'suv' },
  { label: '🚛 Commercial', value: 'commercial' },
  { label: '🚌 Bus', value: 'bus' },
  { label: '🚎 Volvo Bus', value: 'volvo_bus' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem('userToken');
        setIsLoggedIn(!!token);
      };
      checkAuth();
    }, [])
  );

  const fetchPackages = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/packages`, {
        headers: { 
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true'
        }
      });
      const data = await res.json();
      setPackages(data);
    } catch (e) {
      console.log('API unreachable, using sample data');
      setPackages(SAMPLE_PACKAGES);
      setError('Showing sample data — server not reachable.');
    } finally {
      // Add an artificial delay so the logo splash screen is visible
      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 2000);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPackages();
  };

  const filteredPackages =
    activeFilter === 'all'
      ? packages
      : packages.filter((p) => p.vehicle_type === activeFilter);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.splashContainer}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.splashLogo}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#00D4FF" />
          <Text style={styles.loaderText}>Loading Services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🚗 CleanAtDoorstep</Text>
          <Text style={styles.headerSubtitle}>Professional Vehicle Detailing</Text>
        </View>
        <TouchableOpacity 
          style={styles.loginBtnHeader} 
          onPress={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
        >
          <Text style={styles.loginBtnHeaderText}>
            {isLoggedIn ? 'Dashboard' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Section Title ── */}
      <View style={styles.sectionTitle}>
        <Text style={styles.sectionHeading}>
          Our <Text style={styles.textGradient}>Services</Text>
        </Text>
        <Text style={styles.sectionDesc}>
          Professional vehicle detailing packages for every need.
        </Text>
      </View>

      {/* ── Filters ── */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.filterBtn,
                activeFilter === f.value && styles.filterBtnActive,
              ]}
              onPress={() => setActiveFilter(f.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f.value && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Package Cards ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.cardsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00D4FF"
            colors={['#00D4FF']}
          />
        }
      >
        {error && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>ℹ️ {error}</Text>
          </View>
        )}

        {filteredPackages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>
              No packages found for this category.
            </Text>
          </View>
        ) : (
          filteredPackages.map((pkg) => (
            <View key={pkg.id} style={styles.card}>
              {/* Badges */}
              <View style={styles.badgeRow}>
                <View style={styles.badgeCyan}>
                  <Text style={styles.badgeCyanText}>
                    {pkg.vehicle_type?.toUpperCase()}
                  </Text>
                </View>
                {pkg.frequency_days > 0 ? (
                  <View style={styles.badgeGreen}>
                    <Text style={styles.badgeGreenText}>Monthly</Text>
                  </View>
                ) : (
                  <View style={styles.badgePurple}>
                    <Text style={styles.badgePurpleText}>One-Time</Text>
                  </View>
                )}
              </View>

              {/* Package Name */}
              <Text style={styles.cardTitle}>{pkg.name}</Text>

              {/* Description */}
              <Text style={styles.cardDesc}>{pkg.description}</Text>

              {/* Price + Book */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.price}>
                    ₹{pkg.price}
                    {pkg.frequency_days > 0 && (
                      <Text style={styles.priceUnit}> / month</Text>
                    )}
                  </Text>
                  {pkg.max_bookings > 1 && (
                    <Text style={styles.washCount}>
                      Includes {pkg.max_bookings} washes
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.bookBtn}
                  onPress={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
                >
                  <Text style={styles.bookBtnText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Bottom spacer */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },

  // ── Loader / Splash ──
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e27',
  },
  splashLogo: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  loaderText: {
    color: '#8892b0',
    marginTop: 12,
    fontSize: 14,
  },

  header: {
    backgroundColor: '#0f1336',
    paddingTop: Platform.OS === 'android' ? 44 : 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.12)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#5a6380',
    fontSize: 12,
    marginTop: 2,
  },
  loginBtnHeader: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  loginBtnHeaderText: {
    color: '#00D4FF',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Section Title ──
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  textGradient: {
    color: '#00D4FF',
  },
  sectionDesc: {
    color: '#5a6380',
    fontSize: 13,
    marginTop: 4,
  },

  // ── Filters ──
  filterWrapper: {
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  filterText: {
    color: '#8892b0',
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#0a0e27',
    fontWeight: '700',
  },

  // ── Cards ──
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  card: {
    backgroundColor: 'rgba(15, 19, 54, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.08)',
  },

  // ── Badges ──
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badgeCyan: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeCyanText: {
    color: '#00D4FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeGreenText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  badgePurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePurpleText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Card Content ──
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDesc: {
    color: '#6b7394',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: '#00D4FF',
    fontSize: 22,
    fontWeight: '800',
  },
  priceUnit: {
    color: '#5a6380',
    fontSize: 12,
    fontWeight: '400',
  },
  washCount: {
    color: '#5a6380',
    fontSize: 11,
    marginTop: 2,
  },
  bookBtn: {
    backgroundColor: '#00D4FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookBtnText: {
    color: '#0a0e27',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Info Banner ──
  infoBanner: {
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
  },
  infoBannerText: {
    color: '#00D4FF',
    fontSize: 12,
    textAlign: 'center',
  },

  // ── Error ──
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#8892b0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 30,
  },
  retryBtn: {
    marginTop: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#00D4FF',
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#5a6380',
    fontSize: 14,
  },
});
