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
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
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

type LoginMode = 'email' | 'otp' | 'forgot';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);

  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<LoginMode>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP form state
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const emailInputRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Sync theme
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      AsyncStorage.getItem('app_theme').then((theme) => {
        if (isMounted) setIsDark(theme === 'dark');
      });

      // Auto-check if already logged in
      AsyncStorage.getItem('userToken').then((token) => {
        if (isMounted && token) {
          router.replace('/dashboard');
        }
      });

      return () => {
        isMounted = false;
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [router])
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startCountdown = () => {
    setCountdown(120);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearErrors = () => {
    setErrors({});
    setServerError('');
    setForgotSuccess('');
  };

  const switchTab = (tab: LoginMode) => {
    safeHapticLight();
    setActiveTab(tab);
    clearErrors();
    if (tab === 'email') {
      setTimeout(() => emailInputRef.current?.focus(), 150);
    }
  };

  // ── Email Login ───────────────────────────
  const handleLogin = async () => {
    safeHapticLight();
    clearErrors();

    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email address is required.';
    if (!password) newErrors.password = 'Password is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      safeHapticWarning();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email: email.trim(),
        password,
      });

      if (response.data.status === 'success') {
        const user = response.data.user;

        if (user.role !== 'customer') {
          safeHapticWarning();
          showSweetAlert(
            'Access Denied',
            'Only customers can login to the mobile app. Please use the web portal for admin or franchise access.',
            'warning'
          );
          return;
        }

        const token = response.data.access_token;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        safeHapticSuccess();
        router.replace('/dashboard');
      } else {
        safeHapticWarning();
        setServerError(response.data.message || 'Invalid credentials.');
      }
    } catch (error: any) {
      safeHapticWarning();
      if (error.response?.status === 422 && error.response.data.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const key of Object.keys(error.response.data.errors)) {
          fieldErrors[key] = error.response.data.errors[key][0];
        }
        setErrors(fieldErrors);
      } else {
        setServerError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Login: Send OTP ───────────────────
  const handleSendOtp = async (isResend = false) => {
    safeHapticLight();
    clearErrors();

    if (!identifier.trim()) {
      setErrors({ identifier: 'Please enter your mobile number or email.' });
      safeHapticWarning();
      return;
    }

    if (isResend && resendCount >= 2) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/auth/otp/send`, {
        identifier: identifier.trim(),
      });

      setOtpSent(true);
      if (isResend) setResendCount((prev) => prev + 1);
      startCountdown();
      safeHapticSuccess();
    } catch (error: any) {
      safeHapticWarning();
      if (error.response?.status === 422 && error.response.data.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const key of Object.keys(error.response.data.errors)) {
          fieldErrors[key] = error.response.data.errors[key][0];
        }
        setErrors(fieldErrors);
      } else {
        setServerError(error.response?.data?.message || 'Failed to send OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Login: Verify OTP ─────────────────
  const handleVerifyOtp = async () => {
    safeHapticLight();
    clearErrors();

    const newErrors: Record<string, string> = {};
    if (!identifier.trim()) newErrors.identifier = 'Mobile number or email is required.';
    if (!otp.trim()) newErrors.otp = 'Please enter the 4-digit OTP.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      safeHapticWarning();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/otp/verify`, {
        identifier: identifier.trim(),
        otp: otp.trim(),
      });

      if (response.data.status === 'success') {
        const user = response.data.user;
        if (user.role !== 'customer') {
          safeHapticWarning();
          showSweetAlert('Access Denied', 'Only customers can login to the mobile app.', 'warning');
          return;
        }

        await AsyncStorage.setItem('userToken', response.data.access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        safeHapticSuccess();
        router.replace('/dashboard');
      }
    } catch (error: any) {
      safeHapticWarning();
      if (error.response?.status === 422 && error.response.data.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const key of Object.keys(error.response.data.errors)) {
          fieldErrors[key] = error.response.data.errors[key][0];
        }
        setErrors(fieldErrors);
      } else {
        setServerError(error.response?.data?.message || 'Invalid or expired OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ───────────────────────
  const handleForgotPassword = async () => {
    safeHapticLight();
    clearErrors();

    if (!forgotEmail.trim()) {
      setErrors({ forgotEmail: 'Please enter your registered email address.' });
      safeHapticWarning();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/forgot-password`, {
        email: forgotEmail.trim(),
      });
      safeHapticSuccess();
      setForgotSuccess(response.data.message || 'Password reset link sent to your email.');
    } catch (error: any) {
      safeHapticWarning();
      if (error.response?.status === 422 && error.response.data.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const key of Object.keys(error.response.data.errors)) {
          fieldErrors[key] = error.response.data.errors[key][0];
        }
        setErrors(fieldErrors);
      } else {
        setServerError(error.response?.data?.message || 'Failed to send reset link. Please check your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign In ────────────────────────
  const handleGoogleSignIn = async () => {
    safeHapticLight();
    try {
      await WebBrowser.openBrowserAsync(`${API_BASE}/api/auth/google`);
    } catch {
      showSweetAlert('Notice', 'Unable to open Google sign-in browser right now.', 'warning');
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
          {/* Brand Header matching web */}
          <View style={styles.header}>
            <View style={[styles.logoBadge, isDark && styles.darkLogoBadge]}>
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandTitle, isDark && styles.darkBrandTitle]}>
              CleanAtDoorstep
            </Text>
            <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
              {activeTab === 'forgot'
                ? 'Reset your account password'
                : 'Sign in to your account'}
            </Text>
          </View>

          {/* Segmented Mode Switcher (Email / OTP) */}
          {activeTab !== 'forgot' && (
            <View style={[styles.tabContainer, isDark && styles.darkTabContainer]}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.tabButton,
                  activeTab === 'email' && (isDark ? styles.tabButtonActiveDark : styles.tabButtonActiveLight),
                ]}
                onPress={() => switchTab('email')}
              >
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={
                    activeTab === 'email'
                      ? isDark
                        ? '#0a0f1d'
                        : '#ffffff'
                      : isDark
                      ? '#94a3b8'
                      : '#64748b'
                  }
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    isDark && styles.darkTabText,
                    activeTab === 'email' &&
                      (isDark ? styles.tabTextActiveDark : styles.tabTextActiveLight),
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.tabButton,
                  activeTab === 'otp' && (isDark ? styles.tabButtonActiveDark : styles.tabButtonActiveLight),
                ]}
                onPress={() => switchTab('otp')}
              >
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={16}
                  color={
                    activeTab === 'otp'
                      ? isDark
                        ? '#0a0f1d'
                        : '#ffffff'
                      : isDark
                      ? '#94a3b8'
                      : '#64748b'
                  }
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    isDark && styles.darkTabText,
                    activeTab === 'otp' &&
                      (isDark ? styles.tabTextActiveDark : styles.tabTextActiveLight),
                  ]}
                >
                  Mobile OTP
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Global / Server Error Banner */}
          {serverError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          ) : null}

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* ── 1. EMAIL LOGIN MODE ── */}
            {activeTab === 'email' && (
              <>
                <View>
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
                      placeholder="Email address"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                    />
                  </View>
                  {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
                </View>

                <View>
                  <View
                    style={[
                      styles.inputWrapper,
                      isDark && styles.darkInputWrapper,
                      errors.password ? styles.inputWrapperError : null,
                    ]}
                  >
                    <Ionicons name="lock-closed-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, isDark && styles.darkInput]}
                      placeholder="Password"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      onSubmitEditing={handleLogin}
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

                <TouchableOpacity
                  style={styles.forgotContainer}
                  onPress={() => {
                    setForgotEmail(email);
                    switchTab('forgot');
                  }}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.primaryButton}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.primaryButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={17} color="#fff" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* ── 2. OTP LOGIN MODE ── */}
            {activeTab === 'otp' && (
              <>
                {!otpSent ? (
                  <>
                    <View>
                      <View
                        style={[
                          styles.inputWrapper,
                          isDark && styles.darkInputWrapper,
                          errors.identifier ? styles.inputWrapperError : null,
                        ]}
                      >
                        <Ionicons name="call-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, isDark && styles.darkInput]}
                          placeholder="Mobile Number or Email"
                          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                          autoCapitalize="none"
                          value={identifier}
                          onChangeText={(val) => {
                            setIdentifier(val);
                            if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: '' }));
                          }}
                        />
                      </View>
                      {errors.identifier ? (
                        <Text style={styles.fieldError}>{errors.identifier}</Text>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.primaryButton}
                      onPress={() => handleSendOtp(false)}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <View style={styles.buttonContent}>
                          <Text style={styles.primaryButtonText}>Send OTP</Text>
                          <Ionicons
                            name="paper-plane-outline"
                            size={17}
                            color="#fff"
                            style={{ marginLeft: 6 }}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={[styles.otpNoticeBox, isDark && styles.darkOtpNoticeBox]}>
                      <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      <Text style={[styles.otpNoticeText, isDark && styles.darkOtpNoticeText]}>
                        OTP sent to <Text style={{ fontWeight: '700' }}>{identifier}</Text>
                      </Text>
                    </View>

                    <View>
                      <View
                        style={[
                          styles.inputWrapper,
                          isDark && styles.darkInputWrapper,
                          errors.otp ? styles.inputWrapperError : null,
                        ]}
                      >
                        <Ionicons name="keypad-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                          style={[
                            styles.input,
                            isDark && styles.darkInput,
                            { letterSpacing: 8, fontSize: 20, fontWeight: '700' },
                          ]}
                          placeholder="••••"
                          placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
                          keyboardType="number-pad"
                          maxLength={4}
                          value={otp}
                          onChangeText={(val) => {
                            setOtp(val);
                            if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
                          }}
                        />
                      </View>
                      {errors.otp ? <Text style={styles.fieldError}>{errors.otp}</Text> : null}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.primaryButton}
                      onPress={handleVerifyOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <View style={styles.buttonContent}>
                          <Text style={styles.primaryButtonText}>Verify & Login</Text>
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={17}
                            color="#fff"
                            style={{ marginLeft: 6 }}
                          />
                        </View>
                      )}
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                      {countdown > 0 ? (
                        <View style={[styles.timerBadge, isDark && styles.darkTimerBadge]}>
                          <Ionicons name="time-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                          <Text style={[styles.timerText, isDark && styles.darkSubtext]}>
                            Resend in {formatTime(countdown)}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleSendOtp(true)}
                          disabled={loading || resendCount >= 2}
                        >
                          <Text
                            style={[
                              styles.resendLink,
                              (loading || resendCount >= 2) && { color: '#94a3b8' },
                            ]}
                          >
                            Resend OTP {resendCount < 2 ? `(${2 - resendCount} left)` : '(Limit reached)'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.changeContactBtn}
                        onPress={() => {
                          setOtpSent(false);
                          setOtp('');
                          if (timerRef.current) clearInterval(timerRef.current);
                        }}
                      >
                        <Text style={styles.changeContactText}>Change Mobile / Email</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}

            {/* ── 3. FORGOT PASSWORD MODE ── */}
            {activeTab === 'forgot' && (
              <>
                <View>
                  <View
                    style={[
                      styles.inputWrapper,
                      isDark && styles.darkInputWrapper,
                      errors.forgotEmail ? styles.inputWrapperError : null,
                    ]}
                  >
                    <Ionicons name="mail-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, isDark && styles.darkInput]}
                      placeholder="Enter registered email"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={forgotEmail}
                      onChangeText={(val) => {
                        setForgotEmail(val);
                        if (errors.forgotEmail) setErrors((prev) => ({ ...prev, forgotEmail: '' }));
                      }}
                    />
                  </View>
                  {errors.forgotEmail ? (
                    <Text style={styles.fieldError}>{errors.forgotEmail}</Text>
                  ) : null}
                </View>

                {forgotSuccess ? (
                  <View style={styles.successBanner}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginRight: 6 }} />
                    <Text style={styles.successBannerText}>{forgotSuccess}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.primaryButton}
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                      <Ionicons name="paper-plane-outline" size={17} color="#fff" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToLoginBtn}
                  onPress={() => switchTab('email')}
                >
                  <Ionicons name="arrow-back" size={15} color="#0284c7" style={{ marginRight: 4 }} />
                  <Text style={styles.backToLoginText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Divider OR & Google Login (only shown when not in forgot password mode) */}
            {activeTab !== 'forgot' && (
              <>
                <View style={styles.dividerContainer}>
                  <View style={[styles.divider, isDark && styles.darkDivider]} />
                  <Text style={[styles.dividerText, isDark && styles.darkSubtext]}>OR</Text>
                  <View style={[styles.divider, isDark && styles.darkDivider]} />
                </View>

                <TouchableOpacity
                  style={[styles.googleButton, isDark && styles.darkGoogleButton]}
                  activeOpacity={0.85}
                  onPress={handleGoogleSignIn}
                >
                  <Image
                    source={{
                      uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png',
                    }}
                    style={styles.googleIcon}
                  />
                  <Text style={[styles.googleButtonText, isDark && styles.darkGoogleButtonText]}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Bottom Card Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, isDark && styles.darkSubtext]}>
              {"Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Register</Text>
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

  // Header & Branding
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  darkLogoBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  logoImage: {
    width: 44,
    height: 44,
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

  // Segmented Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  darkTabContainer: {
    backgroundColor: '#1e293b',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabButtonActiveLight: {
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonActiveDark: {
    backgroundColor: '#38bdf8',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  darkTabText: {
    color: '#94a3b8',
  },
  tabTextActiveLight: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabTextActiveDark: {
    color: '#0a0f1d',
    fontWeight: '700',
  },

  // Inputs
  formContainer: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  darkInputWrapper: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
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

  // Banners
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  successBannerText: {
    fontSize: 12,
    color: '#15803d',
    flex: 1,
  },

  // Forgot password link
  forgotContainer: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },

  // Buttons
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
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },

  // OTP notice & timer
  otpNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  darkOtpNoticeBox: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  otpNoticeText: {
    fontSize: 12,
    color: '#065f46',
    marginLeft: 8,
    flex: 1,
  },
  darkOtpNoticeText: {
    color: '#a7f3d0',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  darkTimerBadge: {
    backgroundColor: '#1e293b',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  changeContactBtn: {
    paddingVertical: 4,
  },
  changeContactText: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'underline',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
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

  // Google button
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
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerText: {
    fontSize: 13,
    color: '#64748b',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
});
