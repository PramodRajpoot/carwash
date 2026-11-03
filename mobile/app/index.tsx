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
import { Ionicons } from '@expo/vector-icons';

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
  { label: 'All Services', icon: 'sparkles', value: 'all' },
  { label: 'Hatchback', icon: 'car-sport', value: 'hatchback' },
  { label: 'Sedan', icon: 'car', value: 'sedan' },
  { label: 'SUV', icon: 'speedometer', value: 'suv' },
  { label: 'Commercial', icon: 'bus', value: 'commercial' },
  { label: 'Bus', icon: 'navigate', value: 'bus' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
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
      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 800);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPackages();
  };

  const filteredPackages = (
    activeFilter === 'all'
      ? packages
      : packages.filter((p) => p.vehicle_type === activeFilter)
  ).filter((p) => !p.is_addon);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.splashContainer}>
          <View style={styles.splashBadge}>
            <Image 
              source={require('../assets/images/icon.png')} 
              style={styles.splashLogo}
              resizeMode="contain"
            />
          </View>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loaderText}>Loading Packages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>CleanAtDoorstep</Text>
            <View style={styles.statusRow}>
              <View style={styles.liveDot} />
              <Text style={styles.headerSubtitle}>Doorstep Detailing</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.loginBtnHeader} 
          onPress={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isLoggedIn ? 'speedometer-outline' : 'person-circle-outline'} 
            size={16} 
            color="#38bdf8" 
            style={{ marginRight: 5 }}
          />
          <Text style={styles.loginBtnHeaderText}>
            {isLoggedIn ? 'Dashboard' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0ea5e9"
            colors={['#0ea5e9']}
          />
        }
      >
        {/* ── Hero Banner ── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={13} color="#38bdf8" />
            <Text style={styles.heroBadgeText}>DOORSTEP VEHICLE CARE</Text>
          </View>
          <Text style={styles.heroTitle}>
            Premium Detailing <Text style={styles.textGradient}>At Your Home</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Save time. Our expert washers arrive equipped with water, power & pro detailing gear.
          </Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featurePill}>
              <Ionicons name="flash-outline" size={13} color="#10b981" />
              <Text style={styles.featureText}>45 Min Wash</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="water-outline" size={13} color="#38bdf8" />
              <Text style={styles.featureText}>Eco Foam</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="star" size={13} color="#fbbf24" />
              <Text style={styles.featureText}>4.9/5 Rating</Text>
            </View>
          </View>
        </View>

        {/* ── Filters ── */}
        <View style={styles.filterWrapper}>
          <Text style={styles.sectionHeading}>Choose Category</Text>
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
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={f.icon as any} 
                  size={14} 
                  color={activeFilter === f.value ? '#ffffff' : '#94a3b8'} 
                  style={{ marginRight: 6 }}
                />
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

        {error && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#38bdf8" />
            <Text style={styles.infoBannerText}>{error}</Text>
          </View>
        )}

        {/* ── Package Cards ── */}
        {filteredPackages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color="#475569" />
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
                    <Text style={styles.badgeGreenText}>MONTHLY SUBSCRIPTION</Text>
                  </View>
                ) : (
                  <View style={styles.badgePurple}>
                    <Text style={styles.badgePurpleText}>ONE-TIME WASH</Text>
                  </View>
                )}
              </View>

              {/* Package Name */}
              <Text style={styles.cardTitle}>{pkg.name}</Text>

              {/* Description */}
              <Text style={styles.cardDesc} numberOfLines={3}>
                {pkg.description}
              </Text>

              {/* Price + Book */}
              <View style={styles.cardFooter}>
                <View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceSymbol}>₹</Text>
                    <Text style={styles.priceValue}>{pkg.price}</Text>
                    {pkg.frequency_days > 0 && (
                      <Text style={styles.priceUnit}> / mo</Text>
                    )}
                  </View>
                  {pkg.max_bookings > 1 && (
                    <Text style={styles.washCount}>
                      ⚡ {pkg.max_bookings} washes included
                    </Text>
                  )}
                </View>

                <TouchableOpacity 
                  activeOpacity={0.85}
                  style={styles.bookBtn}
                  onPress={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
                >
                  <Text style={styles.bookBtnText}>Book Wash</Text>
                  <Ionicons name="arrow-forward" size={15} color="#fff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16', // Deep sleek midnight dark
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090d16',
  },
  splashBadge: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  splashLogo: {
    width: 56,
    height: 56,
  },
  loaderText: {
    color: '#94a3b8',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? 44 : 12,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  loginBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.28)',
  },
  loginBtnHeaderText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  heroBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
    gap: 5,
  },
  heroBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  textGradient: {
    color: '#38bdf8',
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  featureText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  filterWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  filterScroll: {
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  filterBtnActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 10,
    gap: 6,
  },
  infoBannerText: {
    color: '#38bdf8',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  badgeCyan: {
    backgroundColor: 'rgba(14, 165, 233, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCyanText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreenText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  badgePurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePurpleText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceSymbol: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '700',
  },
  priceValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  priceUnit: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  washCount: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d9488',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
