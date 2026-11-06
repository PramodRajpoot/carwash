import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppFooter, { FooterTab } from '../components/AppFooter';
import DashboardHeader from '../components/DashboardHeader';
import { API_BASE } from '../constants/api';
import { safeHapticLight, safeHapticMedium } from '../utils/haptics';
import { showSweetAlert } from '../utils/sweetAlert';

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
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalVisible, setRegisterModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('Sedan');
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);
  const [makeModel, setMakeModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeVehicleFilter, setActiveVehicleFilter] = useState('all');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;

  const filterOptions = [
    { key: 'all', label: 'All vehicles' },
    { key: 'sedan', label: 'Sedan' },
    { key: 'suv', label: 'SUV' },
    { key: 'hatchback', label: 'Hatchback' },
    { key: 'luxury', label: 'Luxury' },
    { key: 'commercial', label: 'Commercial' },
  ];

  const toggleTheme = async () => {
    const nextMode = !isDark;
    setIsDark(nextMode);
    await AsyncStorage.setItem('app_theme', nextMode ? 'dark' : 'light');
  };

  const filteredVehicles =
    activeVehicleFilter === 'all'
      ? vehicles
      : vehicles.filter((vehicle) => {
          const type = (vehicle.vehicle_type || 'Sedan').toLowerCase();
          return type === activeVehicleFilter.toLowerCase();
        });

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
      showSweetAlert('Unable to load vehicles', undefined, 'error');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedTheme = await AsyncStorage.getItem('app_theme');
        const storedUser = await AsyncStorage.getItem('userData');

        if (!storedToken) {
          router.replace('/login');
          return;
        }

        if (isMounted) {
          setToken(storedToken);
          setIsDark(storedTheme === 'dark');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {}
          }
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

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      AsyncStorage.getItem('userData').then((stored) => {
        if (isMounted && stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {}
        }
      });
      AsyncStorage.getItem('app_theme').then((theme) => {
        if (isMounted && theme) {
          setIsDark(theme === 'dark');
        }
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleRegisterVehicle = async () => {
    if (!makeModel.trim()) {
      showSweetAlert('Please enter make & model', undefined, 'warning');
      return;
    }

    const vehicleTypeMap: Record<string, string> = {
      Hatchback: 'hatchback',
      Sedan: 'sedan',
      SUV: 'suv',
      Luxury: 'luxury',
      Commercial: 'commercial',
    };
    const normalizedType = vehicleTypeMap[selectedType] || selectedType.toLowerCase();

    try {
      safeHapticMedium();
      setSubmitting(true);

      if (!token) {
        showSweetAlert('Session expired', undefined, 'warning');
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
      showSweetAlert('Vehicle registered successfully', undefined, 'success');
    } catch (error: any) {
      console.error('Register vehicle error:', error);
      const validationMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.vehicle_type?.[0] ||
        error?.message ||
        'Please try again.';

      showSweetAlert('Unable to register vehicle', validationMessage, 'error');
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
      router.push('/support');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <DashboardHeader
        user={user}
        title=""
        subtitle=""
        unreadCount={0}
        isDark={isDark}
        actionButton={
          <TouchableOpacity
            style={styles.primaryActionBtn}
            activeOpacity={0.85}
            onPress={() => {
              safeHapticLight();
              setRegisterModalVisible(true);
            }}
          >
            <Ionicons name="add" size={14} color="#ffffff" />
            <Text style={styles.primaryActionBtnText}>Add Vehicle</Text>
          </TouchableOpacity>
        }
        onNotificationPress={() => router.push('/notifications')}
        onToggleTheme={toggleTheme}
      />

      <View style={[styles.filterRow, isDark && styles.darkFilterRow]}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>My Garage</Text>

        <View style={styles.headerFilterWrap}>
          <TouchableOpacity
            style={[styles.filterTrigger, isDark && styles.darkFilterTrigger]}
            activeOpacity={0.8}
            onPress={() => {
              safeHapticLight();
              setFilterMenuVisible((prev) => !prev);
            }}
          >
            <Ionicons name="funnel-outline" size={16} color={isDark ? '#e2e8f0' : '#334155'} />
          </TouchableOpacity>

          {filterMenuVisible && (
            <View style={[styles.filterMenu, isDark && styles.darkFilterMenu]}>
              {filterOptions.map((option) => {
                const isSelected = activeVehicleFilter === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterMenuItem,
                      isSelected && (isDark ? styles.activeFilterMenuItemDark : styles.activeFilterMenuItemLight),
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      safeHapticLight();
                      setActiveVehicleFilter(option.key);
                      setFilterMenuVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterMenuItemText,
                        isDark && styles.darkFilterMenuItemText,
                        isSelected && styles.activeFilterMenuItemText,
                        isSelected && isDark && styles.darkActiveFilterMenuItemText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={[styles.scrollView, isDark && styles.darkScrollView]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={[styles.loadingWrap, isDark && styles.darkLoadingWrap]}>
            <ActivityIndicator size="small" color="#0284c7" />
            <Text style={[styles.loadingText, isDark && styles.darkSubtext]}>Loading your garage...</Text>
          </View>
        ) : filteredVehicles.length > 0 ? (
          <View style={styles.listContainer}>
            {filteredVehicles.map((vehicle) => (
              <View key={vehicle.id} style={[styles.vehicleCard, isDark && styles.darkVehicleCard]}>
                <View style={styles.vehicleCardTop}>
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>{vehicle.vehicle_type || 'Sedan'}</Text>
                  </View>
                  <Text style={[styles.vehicleDate, isDark && styles.darkSubtext]}>
                    {vehicle.created_at
                      ? new Date(vehicle.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </Text>
                </View>

                <Text style={[styles.vehicleTitle, isDark && styles.darkText]}>{vehicle.make_model}</Text>

                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, isDark && styles.darkSubtext]}>Plate</Text>
                  <Text style={[styles.metaValue, isDark && styles.darkText]}>
                    {vehicle.plate_number || 'Not provided'}
                  </Text>
                </View>

                <View style={styles.vehicleCardBottom}>
                  <TouchableOpacity
                    style={styles.cardBookWashBtn}
                    onPress={() => router.push(`/book?vehicle_id=${vehicle.id}`)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="sparkles" size={13} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.cardBookWashBtnText}>Book Wash</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, isDark && styles.darkEmptyState]}>
            <Ionicons name="car-sport-outline" size={46} color={isDark ? '#64748b' : '#94a3b8'} />
            <Text style={[styles.emptyTitle, isDark && styles.darkText]}>No vehicles added yet</Text>
            <Text style={[styles.emptySub, isDark && styles.darkSubtext]}>
              Add your first vehicle to unlock quick wash bookings.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.8}
              onPress={() => setRegisterModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>Register Vehicle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AppFooter activeTab="garage" isDark={isDark} onTabPress={handleFooterTabPress} />

      <Modal
        visible={isRegisterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setTypeDropdownVisible(false);
          setRegisterModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropPress}
            activeOpacity={1}
            onPress={() => {
              setTypeDropdownVisible(false);
              setRegisterModalVisible(false);
            }}
          />

          <View style={styles.modalCard}>
            <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <View style={styles.titleIconSquircle}>
                <Ionicons name="car-sport" size={17} color="#0284c7" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Register Vehicle</Text>
                <Text style={styles.modalSub}>Add your car details</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setTypeDropdownVisible(false);
                setRegisterModalVisible(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

            <View style={styles.formWrap}>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Vehicle Type</Text>
                <View style={styles.pickerWrap}>
                  <TouchableOpacity
                    style={[styles.pickerField, typeDropdownVisible && styles.pickerFieldActive]}
                    activeOpacity={0.85}
                    onPress={() => {
                      safeHapticLight();
                      setTypeDropdownVisible((prev) => !prev);
                    }}
                  >
                    <View style={styles.dropdownLeft}>
                      <Ionicons name="car-outline" size={17} color="#0284c7" style={{ marginRight: 8 }} />
                      <Text style={styles.pickerText}>{selectedType}</Text>
                    </View>
                    <Ionicons name={typeDropdownVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
                  </TouchableOpacity>

                  {typeDropdownVisible && (
                    <View style={styles.typeMenu}>
                      {vehicleTypeOptions.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.typeMenuItem,
                            selectedType === type && styles.typeMenuItemActive,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => {
                            safeHapticLight();
                            setSelectedType(type);
                            setTypeDropdownVisible(false);
                          }}
                        >
                          <Text style={[styles.typeMenuItemText, selectedType === type && styles.typeMenuItemTextActive]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Make & Model</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Hyundai i20 / Honda City"
                  placeholderTextColor="#94a3b8"
                  value={makeModel}
                  onChangeText={setMakeModel}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>License Plate Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. MH 12 AB 1234"
                  placeholderTextColor="#94a3b8"
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                />
              </View>

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
    backgroundColor: '#f8fafc',
  },
  darkSafeArea: {
    backgroundColor: '#090d16',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  darkFilterRow: {
    backgroundColor: '#090d16',
    borderBottomColor: '#1f2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  darkHeader: {
    backgroundColor: '#090d16',
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
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
  headerIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTrigger: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkFilterTrigger: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  headerFilterWrap: {
    position: 'relative',
  },
  filterMenu: {
    position: 'absolute',
    top: 38,
    right: 0,
    width: 170,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dfeaf3',
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    zIndex: 20,
  },
  darkFilterMenu: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  filterMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  activeFilterMenuItemLight: {
    backgroundColor: '#e0f2fe',
  },
  activeFilterMenuItemDark: {
    backgroundColor: '#082f49',
  },
  filterMenuItemText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  darkFilterMenuItemText: {
    color: '#cbd5e1',
  },
  activeFilterMenuItemText: {
    color: '#0369a1',
    fontWeight: '700',
  },
  darkActiveFilterMenuItemText: {
    color: '#7dd3fc',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
    shadowColor: '#0284c7',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  darkText: {
    color: '#f8fafc',
  },
  darkSubtext: {
    color: '#cbd5e1',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkScrollView: {
    backgroundColor: '#090d16',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  loadingWrap: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#edf3f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dfeaf3',
  },
  darkLoadingWrap: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  darkVehicleCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  vehicleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typePill: {
    backgroundColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typePillText: {
    color: '#0369a1',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  vehicleDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 34,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  darkEmptyState: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 14,
  },
  emptySub: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 18,
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  modalBackdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIconSquircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  formWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  pickerWrap: {
    position: 'relative',
    zIndex: 10,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  pickerFieldActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  pickerText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  typeMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfeaf3',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  typeMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  typeMenuItemActive: {
    backgroundColor: '#e0f2fe',
  },
  typeMenuItemText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  typeMenuItemTextActive: {
    color: '#0369a1',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  modalActions: {
    marginTop: 4,
  },
  addVehicleButton: {
    backgroundColor: '#0284c7',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  addVehicleButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  vehicleCardBottom: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cardBookWashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardBookWashBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
