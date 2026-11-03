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
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../constants/api';

axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'otp'>('email');
  
  const emailInputRef = useRef<any>(null);

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const timerRef = useRef<any>(null);

  const focusEmail = useCallback(() => {
    if (activeTab === 'email') {
      setTimeout(() => emailInputRef.current?.focus(), 50);
      setTimeout(() => emailInputRef.current?.focus(), 250);
      setTimeout(() => emailInputRef.current?.focus(), 500);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      focusEmail();
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [focusEmail])
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });

      if (response.data.status === 'success') {
        const user = response.data.user;

        // Only customers are allowed to login via the mobile app
        if (user.role !== 'customer') {
          Alert.alert(
            'Access Denied',
            'Only customers can login to the mobile app. Please use the web portal for admin or franchise access.'
          );
          return;
        }

        const token = response.data.access_token;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        router.replace('/dashboard');
      } else {
        Alert.alert('Login Failed', response.data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Network error, please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (isResend = false) => {
    if (!identifier) {
      Alert.alert('Error', 'Please enter a valid mobile number or email.');
      return;
    }
    if (isResend && resendCount >= 2) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/otp/send`, { identifier });
      setOtpSent(true);
      if (isResend) setResendCount(prev => prev + 1);
      startCountdown();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!identifier || !otp) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/otp/verify`, { identifier, otp });
      if (response.data.status === 'success') {
        const user = response.data.user;
        if (user.role !== 'customer') {
          Alert.alert('Access Denied', 'Only customers can login to the mobile app.');
          return;
        }
        await AsyncStorage.setItem('userToken', response.data.access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        router.replace('/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Back navigation button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
          <Text style={styles.backText}>Services</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image 
                source={require('../assets/images/icon.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>CleanAtDoorstep</Text>
            <Text style={styles.subtitle}>Premium doorstep car wash & detailing</Text>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.tabButton, activeTab === 'email' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('email');
                setTimeout(() => emailInputRef.current?.focus(), 100);
              }}
            >
              <Ionicons 
                name="mail-outline" 
                size={16} 
                color={activeTab === 'email' ? '#ffffff' : '#64748b'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>
                Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.tabButton, activeTab === 'otp' && styles.tabButtonActive]}
              onPress={() => setActiveTab('otp')}
            >
              <Ionicons 
                name="chatbox-ellipses-outline" 
                size={16} 
                color={activeTab === 'otp' ? '#ffffff' : '#64748b'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'otp' && styles.tabTextActive]}>
                Mobile OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {activeTab === 'email' ? (
              <>
                <TouchableOpacity 
                  activeOpacity={1}
                  onPress={() => emailInputRef.current?.focus()}
                  style={styles.inputWrapper}
                >
                  <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoFocus={true}
                    caretHidden={false}
                    cursorColor="#0284c7"
                    selectionColor="#0284c7"
                    showSoftInputOnFocus={true}
                    value={email}
                    onChangeText={setEmail}
                  />
                </TouchableOpacity>
                
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color="#64748b" 
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotContainer}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.85}
                  style={styles.loginButton} 
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {!otpSent ? (
                  <>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Mobile Number or Email"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                        value={identifier}
                        onChangeText={setIdentifier}
                      />
                    </View>
                    <TouchableOpacity 
                      activeOpacity={0.85}
                      style={styles.loginButton} 
                      onPress={() => handleSendOtp(false)} 
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <View style={styles.buttonContent}>
                          <Text style={styles.loginButtonText}>Send OTP</Text>
                          <Ionicons name="paper-plane-outline" size={18} color="#fff" style={{ marginLeft: 6 }} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.otpNoticeBox}>
                      <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      <Text style={styles.otpNoticeText}>
                        OTP sent to <Text style={{ fontWeight: '700' }}>{identifier}</Text>
                      </Text>
                    </View>

                    <View style={styles.inputWrapper}>
                      <Ionicons name="keypad-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { letterSpacing: 8, fontSize: 20, fontWeight: '700' }]}
                        placeholder="••••"
                        placeholderTextColor="#cbd5e1"
                        keyboardType="number-pad"
                        maxLength={4}
                        value={otp}
                        onChangeText={setOtp}
                      />
                    </View>

                    <TouchableOpacity 
                      activeOpacity={0.85}
                      style={styles.loginButton} 
                      onPress={handleVerifyOtp} 
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <View style={styles.buttonContent}>
                          <Text style={styles.loginButtonText}>Verify & Login</Text>
                          <Ionicons name="shield-checkmark-outline" size={18} color="#fff" style={{ marginLeft: 6 }} />
                        </View>
                      )}
                    </TouchableOpacity>
                    
                    <View style={styles.resendContainer}>
                      {countdown > 0 ? (
                        <View style={styles.timerBadge}>
                          <Ionicons name="time-outline" size={14} color="#64748b" />
                          <Text style={styles.timerText}>Resend in {formatTime(countdown)}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => handleSendOtp(true)} disabled={loading || resendCount >= 2}>
                          <Text style={[styles.resendLink, (loading || resendCount >= 2) && { color: '#94a3b8' }]}>
                            Resend OTP {resendCount < 2 ? `(${2 - resendCount} left)` : '(Limit reached)'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity 
                        style={styles.changeContactBtn} 
                        onPress={() => { setOtpSent(false); setOtp(''); if (timerRef.current) clearInterval(timerRef.current); }}
                      >
                        <Text style={styles.changeContactText}>Change Mobile / Email</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.googleButton} activeOpacity={0.85}>
              <Image 
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{"Don't have an account? "}</Text>
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
    backgroundColor: '#0f172a', // Premium deep navy background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 36,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  backText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#f0fdfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#99f6e4',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  tabButtonActive: {
    backgroundColor: '#0d9488', // Professional Teal
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  formContainer: {
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0f172a',
  },
  eyeButton: {
    padding: 6,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  forgotText: {
    color: '#0d9488',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#0d9488',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 18,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  otpNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  otpNoticeText: {
    fontSize: 13,
    color: '#065f46',
    flex: 1,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  resendLink: {
    color: '#0d9488',
    fontWeight: '700',
    fontSize: 13,
  },
  changeContactBtn: {
    marginTop: 10,
    padding: 4,
  },
  changeContactText: {
    color: '#64748b',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  googleIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
  },
  registerLink: {
    color: '#0d9488',
    fontSize: 13,
    fontWeight: '700',
  },
});
