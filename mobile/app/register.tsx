import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '../constants/api';
import { showSweetAlert } from '../utils/sweetAlert';
import {
  safeHapticLight,
  safeHapticSuccess,
  safeHapticWarning,
} from '../utils/haptics';

axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

export default function RegisterScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ ref?: string }>();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);

  const [isDark, setIsDark] = useState(false);

  // Form Fields matching web RegisterView.vue
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const queryRef = typeof searchParams?.ref === 'string' ? searchParams.ref : '';
  const [prevQueryRef, setPrevQueryRef] = useState(queryRef);
  const [referralCode, setReferralCode] = useState(queryRef.toUpperCase());

  if (prevQueryRef !== queryRef) {
    setPrevQueryRef(queryRef);
    if (queryRef) {
      setReferralCode(queryRef.toUpperCase());
    }
  }

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Status & Validation
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  // Input references for smooth keyboard navigation
  const nameInputRef = useRef<any>(null);
  const emailInputRef = useRef<any>(null);
  const phoneInputRef = useRef<any>(null);
  const passwordInputRef = useRef<any>(null);
  const passwordConfirmInputRef = useRef<any>(null);
  const referralInputRef = useRef<any>(null);

  // Auto-focus lifecycle guard: only run once on initial mount and never steal focus back
  const hasAutoFocusedRef = useRef(false);
  const autoFocusTimerRef = useRef<any>(null);

  const cancelAutoFocus = useCallback(() => {
    hasAutoFocusedRef.current = true;
    if (autoFocusTimerRef.current) {
      clearTimeout(autoFocusTimerRef.current);
      autoFocusTimerRef.current = null;
    }
  }, []);

  // Sync theme & initial one-shot auto-focus (stable dependency array [])
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      AsyncStorage.getItem('app_theme').then((theme) => {
        if (isMounted) setIsDark(theme === 'dark');
      });

      // Only attempt auto-focus once when first entering screen
      if (!hasAutoFocusedRef.current) {
        autoFocusTimerRef.current = setTimeout(() => {
          if (isMounted && !hasAutoFocusedRef.current) {
            hasAutoFocusedRef.current = true;
            nameInputRef.current?.focus();
          }
        }, 150);
      }

      return () => {
        isMounted = false;
        if (autoFocusTimerRef.current) {
          clearTimeout(autoFocusTimerRef.current);
          autoFocusTimerRef.current = null;
        }
      };
    }, [])
  );

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) setServerError('');
  };

  const filterPhone = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned);
    clearFieldError('phone');
  };

  // Field validations matching web RegisterView.vue
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    if (!phone.trim()) {
      newErrors.phone = 'Mobile number is required.';
    } else if (phone.trim().length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = 'Please confirm your password.';
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match.';
    }

    return newErrors;
  };

  const handleRegister = async () => {
    safeHapticLight();
    setServerError('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      safeHapticWarning();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: passwordConfirm,
        role: 'customer',
        referred_by_code: referralCode.trim() ? referralCode.trim().toUpperCase() : null,
      });

      if (response.data.status === 'success') {
        const token = response.data.access_token;
        const user = response.data.user;

        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        safeHapticSuccess();

        const welcomeMessage = referralCode.trim()
          ? 'Registration successful! You and your referrer both earned 50 E-Points bonus!'
          : 'Registration successful! You earned 50 E-Points as a welcome bonus!';

        showSweetAlert('Welcome! 🎉', welcomeMessage, 'success', () => {
          router.replace('/dashboard');
        });
      } else {
        safeHapticWarning();
        setServerError(response.data.message || 'Could not complete registration.');
      }
    } catch (error: any) {
      safeHapticWarning();
      if (error.response?.status === 422 && error.response.data.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const key of Object.keys(error.response.data.errors)) {
          // map password_confirmation to passwordConfirm if needed
          const mappedKey = key === 'password_confirmation' ? 'passwordConfirm' : key;
          fieldErrors[mappedKey] = error.response.data.errors[key][0];
        }
        setErrors(fieldErrors);
      } else {
        setServerError(error.response?.data?.message || 'Network error, please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, isDark && styles.darkContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.backButton, isDark && styles.darkBackButton]}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={isDark ? '#f8fafc' : '#0f172a'} />
            <Text style={[styles.backText, isDark && styles.darkBackText]}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, isDark && styles.darkCard]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoBadge, isDark && styles.darkLogoBadge]}>
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandTitle, isDark && styles.darkBrandTitle]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
              Join CleanAtDoorstep for premium doorstep car care
            </Text>
          </View>

          {/* Global / Server Error Banner */}
          {serverError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          ) : null}

          {/* Form Fields matching web RegisterView */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View>
              <Text style={[styles.inputLabel, isDark && styles.darkInputLabel]}>
                Full Name <Text style={styles.reqStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  isDark && styles.darkInputWrapper,
                  errors.name ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons name="person-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  ref={nameInputRef}
                  style={[styles.input, isDark && styles.darkInput]}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={name}
                  autoFocus={true}
                  cursorColor={isDark ? '#38bdf8' : '#0284c7'}
                  selectionColor={isDark ? '#38bdf8' : '#0284c7'}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  onFocus={() => {
                    hasAutoFocusedRef.current = true;
                  }}
                  onChangeText={(val) => {
                    setName(val);
                    clearFieldError('name');
                  }}
                />
              </View>
              {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
            </View>

            {/* Email Address */}
            <View>
              <Text style={[styles.inputLabel, isDark && styles.darkInputLabel]}>
                Email Address <Text style={styles.reqStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  isDark && styles.darkInputWrapper,
                  errors.email ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons name="mail-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  ref={emailInputRef}
                  style={[styles.input, isDark && styles.darkInput]}
                  placeholder="name@example.com"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  cursorColor={isDark ? '#38bdf8' : '#0284c7'}
                  selectionColor={isDark ? '#38bdf8' : '#0284c7'}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                  onFocus={cancelAutoFocus}
                  onChangeText={(val) => {
                    cancelAutoFocus();
                    setEmail(val);
                    clearFieldError('email');
                  }}
                />
              </View>
              {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
            </View>

            {/* Mobile Number */}
            <View>
              <Text style={[styles.inputLabel, isDark && styles.darkInputLabel]}>
                Mobile Number <Text style={styles.reqStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  isDark && styles.darkInputWrapper,
                  errors.phone ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons name="call-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  ref={phoneInputRef}
                  style={[styles.input, isDark && styles.darkInput]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  cursorColor={isDark ? '#38bdf8' : '#0284c7'}
                  selectionColor={isDark ? '#38bdf8' : '#0284c7'}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  onFocus={cancelAutoFocus}
                  onChangeText={(val) => {
                    cancelAutoFocus();
                    filterPhone(val);
                  }}
                />
              </View>
              {errors.phone ? <Text style={styles.fieldError}>{errors.phone}</Text> : null}
            </View>

            {/* Password */}
            <View>
              <Text style={[styles.inputLabel, isDark && styles.darkInputLabel]}>
                Password <Text style={styles.reqStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  isDark && styles.darkInputWrapper,
                  errors.password ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons name="lock-closed-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.input, isDark && styles.darkInput]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  secureTextEntry={!showPassword}
                  value={password}
                  cursorColor={isDark ? '#38bdf8' : '#0284c7'}
                  selectionColor={isDark ? '#38bdf8' : '#0284c7'}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordConfirmInputRef.current?.focus()}
                  onFocus={cancelAutoFocus}
                  onChangeText={(val) => {
                    cancelAutoFocus();
                    setPassword(val);
                    clearFieldError('password');
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={isDark ? '#94a3b8' : '#64748b'}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
            </View>

            {/* Confirm Password */}
            <View>
              <Text style={[styles.inputLabel, isDark && styles.darkInputLabel]}>
                Confirm Password <Text style={styles.reqStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  isDark && styles.darkInputWrapper,
                  errors.passwordConfirm ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordConfirmInputRef}
                  style={[styles.input, isDark && styles.darkInput]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  secureTextEntry={!showPasswordConfirm}
                  value={passwordConfirm}
                  cursorColor={isDark ? '#38bdf8' : '#0284c7'}
                  selectionColor={isDark ? '#38bdf8' : '#0284c7'}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  onFocus={cancelAutoFocus}
                  onChangeText={(val) => {
                    cancelAutoFocus();
                    setPasswordConfirm(val);
                    clearFieldError('passwordConfirm');
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPasswordConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={isDark ? '#94a3b8' : '#64748b'}
                  />
                </TouchableOpacity>
              </View>
              {errors.passwordConfirm ? (
                <Text style={styles.fieldError}>{errors.passwordConfirm}</Text>
              ) : null}
            </View>

            {/* Referral Code Box */}
            <View>
              <Text style={[styles.inputLabel, isDark && styles.darkInputLabel]}>
                Referral Code <Text style={styles.optLabel}>(optional)</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  isDark ? styles.darkReferralWrapper : styles.referralWrapper,
                ]}
              >
                <Ionicons name="gift-outline" size={19} color="#0d9488" style={styles.inputIcon} />
                <TextInput
                  ref={referralInputRef}
                  style={[styles.input, isDark && styles.darkInput, { textTransform: 'uppercase' }]}
                  placeholder="Referral Code — get 10% off!"
                  placeholderTextColor={isDark ? '#2dd4bf' : '#0f766e'}
                  autoCapitalize="characters"
                  value={referralCode}
                  cursorColor={isDark ? '#2dd4bf' : '#0f766e'}
                  selectionColor={isDark ? '#2dd4bf' : '#0f766e'}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  onFocus={cancelAutoFocus}
                  onChangeText={(val) => {
                    cancelAutoFocus();
                    setReferralCode(val.toUpperCase());
                  }}
                />
              </View>
              {referralCode.trim() ? (
                <View style={styles.bonusBanner}>
                  <Text style={styles.bonusBannerText}>
                    🎉 10% discount on first booking + 50 E-Points bonus!
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={17} color="#fff" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, isDark && styles.darkSubtext]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkContainer: {
    backgroundColor: '#0a0f1d',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  darkBackButton: {
    backgroundColor: '#1e293b',
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 4,
  },
  darkBackText: {
    color: '#f8fafc',
  },

  // Main Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    shadowColor: '#000000',
  },

  // Header & Brand
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  darkLogoBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  logoImage: {
    width: 42,
    height: 42,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  darkBrandTitle: {
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  darkSubtitle: {
    color: '#94a3b8',
  },

  // Form Fields
  formContainer: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
  },
  darkInputLabel: {
    color: '#cbd5e1',
  },
  reqStar: {
    color: '#ef4444',
  },
  optLabel: {
    color: '#94a3b8',
    fontWeight: '400',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  darkInputWrapper: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  referralWrapper: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
  },
  darkReferralWrapper: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: 'rgba(45, 212, 191, 0.4)',
  },
  bonusBanner: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  bonusBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  darkInput: {
    color: '#f8fafc',
  },
  eyeButton: {
    padding: 6,
  },
  fieldError: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#b91c1c',
    flex: 1,
  },

  // Primary Button
  primaryButton: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  darkDivider: {
    backgroundColor: '#334155',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  darkSubtext: {
    color: '#94a3b8',
  },

  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    height: 48,
  },
  darkGoogleButton: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  darkGoogleButtonText: {
    color: '#f8fafc',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerText: {
    fontSize: 13,
    color: '#64748b',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
});
