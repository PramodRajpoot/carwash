import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppFooter, { FooterTab } from '../components/AppFooter';
import { API_BASE } from '../constants/api';
import { safeHapticLight, safeHapticMedium } from '../utils/haptics';

interface Vehicle {
  id: number;
  make_model: string;
  plate_number?: string;
  vehicle_type: string;
  created_at?: string;
}

const vehicleTypeOptions = [
  'Hatchback',
  'Sedan',
  'SUV',
  'Luxury',
  'Commercial',
];

export default function GarageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalVisible, setRegisterModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('Sedan');
  const [makeModel, setMakeModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;

  const fetchVehicles = async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    try {
      const response = await axios.get(`${API_BASE}/api/customer/vehicles`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const list = Array.isArray(response.data) ? response.data : [];
      setVehicles(list);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Unable to load vehicles');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedTheme = await AsyncStorage.getItem('app_theme');

        if (!storedToken) {
          router.replace('/login');
          return;
        }

        if (isMounted) {
          setToken(storedToken);
          setIsDark(storedTheme === 'dark');
        }

        await fetchVehicles(storedToken);
      } catch (error) {
        console.error('Init garage error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleRegisterVehicle = async () => {
    if (!makeModel.trim()) {
      Alert.alert('Please enter make & model');
      return;
    }

    const normalizedType = selectedType.toLowerCase();

    try {
      safeHapticMedium();
      setSubmitting(true);

      if (!token) {
        Alert.alert('Session expired');
        return;
      }

      await axios.post(
        `${API_BASE}/api/customer/vehicles`,
        {
          vehicle_type: normalizedType,
          make_model: makeModel.trim(),
          plate_number: plateNumber.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      setMakeModel('');
      setPlateNumber('');
      setSelectedType('Sedan');
      setRegisterModalVisible(false);
      await fetchVehicles(token);
      Alert.alert('Vehicle registered successfully');
    } catch (error: any) {
      console.error('Register vehicle error:', error);
      Alert.alert('Unable to register vehicle', error?.response?.data?.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFooterTabPress = (tab: FooterTab) => {
    if (tab === 'home') {
      router.replace('/dashboard');
      return;
    }
    if (tab === 'garage') {
      return;
    }
    if (tab === 'book') {
      router.push('/bookings');
      return;
    }
    if (tab === 'support') {
      router.push('/dashboard');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.topHeader, { paddingTop: topPadding }, isDark && styles.darkTopHeader]}>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>My Garage</Text>
        <TouchableOpacity
          style={styles.closeBtn}
          activeOpacity={0.8}
          onPress={() => {
            safeHapticLight();
            router.replace('/dashboard');
          }}
        >
          <Ionicons name="close" size={24} color={isDark ? '#e2e8f0' : '#0f172a'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.scrollView, isDark && styles.darkScrollView]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleWrap}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>My Vehicles</Text>
            </View>
            <View style={styles.avatarWrap}>
              <Ionicons name="moon" size={18} color="#0f172a" />
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.bodyTitle, isDark && styles.darkText]}>My Garage</Text>
            <Text style={[styles.bodySubtitle, isDark && styles.darkSubtext]}>
              Add and manage your fleet for simple one-tap booking.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() => {
                safeHapticLight();
                setRegisterModalVisible(true);
              }}
            >
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Register Vehicle</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#0284c7" />
            </View>
          ) : vehicles.length > 0 ? (
            <View style={styles.tableWrap}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.tableHeaderCell}>TYPE</Text>
                <Text style={styles.tableHeaderCell}>MAKE & MODEL</Text>
                <Text style={styles.tableHeaderCell}>LICENSE PLATE</Text>
                <Text style={styles.tableHeaderCell}>REGIST</Text>
              </View>

              {vehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.tableRow}>
                  <Text style={[styles.cellText, styles.typeCell]}>
                    {vehicle.vehicle_type?.toUpperCase() || 'SEDAN'}
                  </Text>
                  <Text style={[styles.cellText, styles.makeModelCell]}>{vehicle.make_model}</Text>
                  <Text style={[styles.cellText, styles.plateCell]}>{vehicle.plate_number || '—'}</Text>
                  <Text style={[styles.cellText, styles.dateCell]}>
                    {vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-sport-outline" size={40} color="#94a3b8" />
              <Text style={[styles.emptyTitle, isDark && styles.darkText]}>No vehicle registered yet</Text>
              <Text style={[styles.emptyMessage, isDark && styles.darkSubtext]}>
                Add your first vehicle to unlock one-tap bookings.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AppFooter activeTab="garage" isDark={isDark} onTabPress={handleFooterTabPress} />

      <Modal
        visible={isRegisterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRegisterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropPress}
            activeOpacity={1}
            onPress={() => setRegisterModalVisible(false)}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Vehicle</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setRegisterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={styles.formWrap}>
              <Text style={styles.fieldLabel}>Vehicle Type</Text>
              <TouchableOpacity
                style={styles.pickerField}
                activeOpacity={0.8}
                onPress={() => {
                  safeHapticLight();
                  const currentIndex = vehicleTypeOptions.indexOf(selectedType);
                  const nextType = vehicleTypeOptions[(currentIndex + 1) % vehicleTypeOptions.length];
                  setSelectedType(nextType);
                }}
              >
                <Text style={styles.pickerText}>{selectedType}</Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Make & Model</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Hyundai i20 / Honda City"
                placeholderTextColor="#94a3b8"
                value={makeModel}
                onChangeText={setMakeModel}
              />

              <Text style={styles.fieldLabel}>License Plate Number (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. MH 12 AB 1234"
                placeholderTextColor="#94a3b8"
                value={plateNumber}
                onChangeText={setPlateNumber}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.addVehicleButton}
                  activeOpacity={0.85}
                  onPress={handleRegisterVehicle}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.addVehicleButtonText}>Add Vehicle</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={() => setRegisterModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#dfeaf3',
  },
  darkSafeArea: {
    backgroundColor: '#090d16',
  },
  topHeader: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkTopHeader: {
    backgroundColor: '#0d1527',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  darkText: {
    color: '#f8fafc',
  },
  darkSubtext: {
    color: '#cbd5e1',
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#dfeaf3',
  },
  darkScrollView: {
    backgroundColor: '#090d16',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 110,
  },
  mainCard: {
    backgroundColor: '#edf3f9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dfeaf3',
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dfeaf3',
  },
  titleWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  bodyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  bodySubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284c7',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  loadingWrap: {
    paddingVertical: 26,
    alignItems: 'center',
  },
  tableWrap: {
    paddingHorizontal: 0,
    paddingBottom: 18,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#edf3f9',
    borderTopWidth: 1,
    borderTopColor: '#dfeaf3',
    borderBottomWidth: 1,
    borderBottomColor: '#dfeaf3',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#dfeaf3',
    backgroundColor: '#f8fbff',
  },
  cellText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  typeCell: {
    color: '#0284c7',
    fontWeight: '800',
  },
  makeModelCell: {
    color: '#0f172a',
  },
  plateCell: {
    color: '#0f172a',
  },
  dateCell: {
    color: '#334155',
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyState: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyMessage: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '88%',
    backgroundColor: '#f4f8fd',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.6,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWrap: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 14,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dfeaf3',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  pickerText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dfeaf3',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  modalActions: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  addVehicleButton: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVehicleButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  cancelButton: {
    flex: 0.5,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
});
