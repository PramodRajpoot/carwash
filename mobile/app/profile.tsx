import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE } from '../constants/api';
import { getAvatarUri } from '../utils/avatar';
import { safeHapticLight } from '../utils/haptics';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter, { FooterTab } from '../components/AppFooter';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'security'>('profile');
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab>('home');

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (!storedToken) {
          router.replace('/login');
          return;
        }

        setToken(storedToken);

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setProfileForm({
            name: parsedUser.name || '',
            email: parsedUser.email || '',
            phone: parsedUser.phone || '',
            address: parsedUser.address || '',
          });
        }

        const response = await axios.get(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true',
          },
        });

        const meUser = response.data || {};
        setUser(meUser);
        setProfileForm({
          name: meUser.name || '',
          email: meUser.email || '',
          phone: meUser.phone || '',
          address: meUser.address || '',
        });
        await AsyncStorage.setItem('userData', JSON.stringify(meUser));
      } catch (error) {
        console.error('Profile fetch error:', error);
        Alert.alert('Unable to load profile', 'Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [router]);

  useEffect(() => {
    const loadTheme = async () => {
      const theme = await AsyncStorage.getItem('app_theme');
      setIsDark(theme === 'dark');
    };
    loadTheme();
  }, []);

  const userName = user?.name || 'Customer';
  const userEmail = user?.email || 'customer@example.com';
  const avatarUri = getAvatarUri(user);
  const [imageError, setImageError] = useState(false);
  const [prevAvatarUri, setPrevAvatarUri] = useState(avatarUri);

  if (prevAvatarUri !== avatarUri) {
    setPrevAvatarUri(avatarUri);
    setImageError(false);
  }
  const initials = userName.charAt(0).toUpperCase() || 'U';

  const updateProfile = async () => {
    safeHapticLight();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      Alert.alert('Required fields missing', 'Full Name and Email are required.');
      return;
    }

    setSavingProfile(true);

    try {
      const response = await axios.put(
        `${API_BASE}/api/auth/profile`,
        profileForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      const updatedUser = response.data?.user || { ...user, ...profileForm };
      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      Alert.alert('Profile updated', response.data?.message || 'Your profile was updated successfully.');
    } catch (error: any) {
      const message = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(' ')
        : error.response?.data?.message || 'Unable to update profile.';
      Alert.alert('Update failed', message);
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async () => {
    safeHapticLight();
    if (!passwordForm.current_password || !passwordForm.password || !passwordForm.password_confirmation) {
      Alert.alert('All fields required', 'Please fill the current, new and confirm password fields.');
      return;
    }

    if (passwordForm.password.length < 6) {
      Alert.alert('Password too short', 'New password must be at least 6 characters.');
      return;
    }

    if (passwordForm.password !== passwordForm.password_confirmation) {
      Alert.alert('Passwords do not match', 'New password and confirm password should be same.');
      return;
    }

    setUpdatingPassword(true);

    try {
      const response = await axios.put(
        `${API_BASE}/api/auth/password`,
        passwordForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      Alert.alert('Password updated', response.data?.message || 'Your password was changed successfully.');
    } catch (error: any) {
      const message = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(' ')
        : error.response?.data?.message || 'Unable to update password.';
      Alert.alert('Password update failed', message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    safeHapticLight();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            if (token) {
              await axios.post(
                `${API_BASE}/api/auth/logout`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
          } catch {}
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          router.replace('/login');
        },
      },
    ]);
  };

  const handleFooterTabPress = (tab: FooterTab) => {
    setActiveFooterTab(tab);

    if (tab === 'home') {
      router.push('/dashboard');
    } else if (tab === 'garage') {
      router.push('/garage');
    } else if (tab === 'book') {
      router.push('/bookings');
    } else if (tab === 'support') {
      router.push('/support');
    }
  };

  const toggleTheme = async () => {
    safeHapticLight();
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('app_theme', next ? 'dark' : 'light');
  };

  const handleAvatarPick = async () => {
    safeHapticLight();
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to photos to upload your profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/login');
        return;
      }

      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        name: asset.fileName || `profile-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const response = await axios.post(`${API_BASE}/api/auth/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
      });

      const updatedUser = response.data?.user || { ...user, avatar: response.data?.avatar };
      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      Alert.alert('Success', response.data?.message || 'Profile image updated successfully.');
    } catch (error: any) {
      const message = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(' ')
        : error.response?.data?.message || 'Unable to upload profile image.';
      Alert.alert('Upload failed', message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      <DashboardHeader
        user={user}
        title="Profile"
        showLocation={false}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onProfilePress={() => router.push('/profile')}
        onNotificationPress={() => router.push('/notifications')}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrap}>
                {avatarUri && !imageError ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatar}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.avatarEditButton}
                  onPress={handleAvatarPick}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="camera" size={16} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.nameText}>{userName}</Text>
                <Text style={styles.emailText}>{userEmail}</Text>
                <View style={styles.badgeRow}>
                  <Ionicons name="shield-checkmark" size={12} color="#0369a1" />
                  <Text style={styles.badgeText}>VERIFIED CUSTOMER</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionsWrap}>
            <View style={styles.tabBar}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.tabButton, activeProfileTab === 'profile' && styles.activeTabButton]}
                onPress={() => setActiveProfileTab('profile')}
              >
                <Text style={[styles.tabButtonText, activeProfileTab === 'profile' && styles.activeTabButtonText]}>
                  Profile Information
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.tabButton, activeProfileTab === 'security' && styles.activeTabButton]}
                onPress={() => setActiveProfileTab('security')}
              >
                <Text style={[styles.tabButtonText, activeProfileTab === 'security' && styles.activeTabButtonText]}>
                  Security
                </Text>
              </TouchableOpacity>
            </View>

            {activeProfileTab === 'profile' ? (
              <View style={[styles.card, isDark && styles.darkCard]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#e0f2fe' }]}>
                    <Ionicons name="person-outline" size={20} color="#0284c7" />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Personal Information</Text>
                    <Text style={[styles.cardSubtitle, isDark && styles.darkCardSubtitle]}>Update your name, email and phone number</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, isDark && styles.darkLabel]}>Full Name *</Text>
                  <TextInput
                    value={profileForm.name}
                    onChangeText={(text) => setProfileForm({ ...profileForm, name: text })}
                    style={[styles.input, isDark && styles.darkInput]}
                    placeholder="Full Name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.twoColumn}>
                  <View style={styles.formGroupFlex}>
                    <Text style={[styles.label, isDark && styles.darkLabel]}>Email Address *</Text>
                    <TextInput
                      value={profileForm.email}
                      onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
                      style={[styles.input, isDark && styles.darkInput]}
                      placeholder="Email Address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.formGroupFlex}>
                    <Text style={[styles.label, isDark && styles.darkLabel]}>Mobile Number</Text>
                    <TextInput
                      value={profileForm.phone}
                      onChangeText={(text) => setProfileForm({ ...profileForm, phone: text.replace(/[^0-9]/g, '') })}
                      style={[styles.input, isDark && styles.darkInput]}
                      placeholder="Mobile Number"
                      keyboardType="numeric"
                      maxLength={10}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, isDark && styles.darkLabel]}>Default Doorstep Service Address</Text>
                  <TextInput
                    value={profileForm.address}
                    onChangeText={(text) => setProfileForm({ ...profileForm, address: text })}
                    style={[styles.input, styles.textArea, isDark && styles.darkInput]}
                    placeholder="Flat/House No., Building, Street, Landmark, Area, City, Pincode"
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={[styles.helperText, isDark && styles.darkHelperText]}>
                    This address will be automatically suggested when you book a car wash slot.
                  </Text>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={updateProfile} disabled={savingProfile}>
                  <Text style={styles.primaryButtonText}>{savingProfile ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.card, isDark && styles.darkCard]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#16a34a" />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Security</Text>
                    <Text style={[styles.cardSubtitle, isDark && styles.darkCardSubtitle]}>Change your account password</Text>
                  </View>
                </View>

                <View style={styles.twoColumn}>
                  <View style={styles.formGroupFlex}>
                    <Text style={[styles.label, isDark && styles.darkLabel]}>Current Password *</Text>
                    <View style={[styles.passwordField, isDark && styles.darkPasswordField]}>
                      <TextInput
                        value={passwordForm.current_password}
                        onChangeText={(text) => setPasswordForm({ ...passwordForm, current_password: text })}
                        style={[styles.passwordInput, isDark && styles.darkPasswordInput]}
                        secureTextEntry={!showCurrentPassword}
                        placeholder="Enter current password"
                        placeholderTextColor="#94a3b8"
                      />
                      <TouchableOpacity onPress={() => setShowCurrentPassword((prev) => !prev)}>
                        <Ionicons
                          name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color="#64748b"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.twoColumn}>
                  <View style={styles.formGroupFlex}>
                    <Text style={[styles.label, isDark && styles.darkLabel]}>New Password *</Text>
                    <View style={[styles.passwordField, isDark && styles.darkPasswordField]}>
                      <TextInput
                        value={passwordForm.password}
                        onChangeText={(text) => setPasswordForm({ ...passwordForm, password: text })}
                        style={[styles.passwordInput, isDark && styles.darkPasswordInput]}
                        secureTextEntry={!showNewPassword}
                        placeholder="Min 6 characters"
                        placeholderTextColor="#94a3b8"
                      />
                      <TouchableOpacity onPress={() => setShowNewPassword((prev) => !prev)}>
                        <Ionicons
                          name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color="#64748b"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formGroupFlex}>
                    <Text style={[styles.label, isDark && styles.darkLabel]}>Confirm Password *</Text>
                    <View style={[styles.passwordField, isDark && styles.darkPasswordField]}>
                      <TextInput
                        value={passwordForm.password_confirmation}
                        onChangeText={(text) =>
                          setPasswordForm({ ...passwordForm, password_confirmation: text })
                        }
                        style={[styles.passwordInput, isDark && styles.darkPasswordInput]}
                        secureTextEntry={!showConfirmPassword}
                        placeholder="Re-enter new password"
                        placeholderTextColor="#94a3b8"
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color="#64748b"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.secondaryButton} onPress={updatePassword} disabled={updatingPassword}>
                  <Text style={styles.secondaryButtonText}>{updatingPassword ? 'Updating...' : 'Update Password'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppFooter activeTab={activeFooterTab} isDark={isDark} onTabPress={handleFooterTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f7fb',
  },
  darkSafeArea: {
    backgroundColor: '#090d16',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f7fb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 26,
    padding: 18,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  heroGlow: {
    position: 'absolute',
    right: -30,
    top: -36,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(14, 165, 233, 0.18)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarWrap: {
    marginRight: 14,
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#dbeafe',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#dbeafe',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  emailText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 9,
    color: '#0369a1',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionsWrap: {
    gap: 18,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
    alignSelf: 'center',
    width: '88%',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    minHeight: 34,
  },
  activeTabButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: '#0284c7',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  darkCardTitle: {
    color: '#f8fafc',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  darkCardSubtitle: {
    color: '#cbd5e1',
  },
  formGroup: {
    marginBottom: 14,
  },
  formGroupFlex: {
    flex: 1,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 8,
    fontWeight: '700',
  },
  darkLabel: {
    color: '#cbd5e1',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dfe7f1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  darkInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    color: '#f8fafc',
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 16,
  },
  darkHelperText: {
    color: '#cbd5e1',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12,
  },
  passwordField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dfe7f1',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  darkPasswordField: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  darkPasswordInput: {
    color: '#f8fafc',
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: '#0284c7',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: '#0284c7',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#ef4444',
    shadowOpacity: 0.20,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  editAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarEditButton: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
