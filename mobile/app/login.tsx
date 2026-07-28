import React, { useState, useRef, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE } from '../constants/api';

axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const emailInputRef = useRef<TextInput>(null);

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 400); // 400ms delay ensures screen transition is complete
    return () => {
      clearTimeout(timer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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

  // Toggle state for tabs (Email vs OTP)
  const [activeTab, setActiveTab] = useState<'email' | 'otp'>('email');

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
        <View style={styles.card}>
          {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>CleanAtDoorstep</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'email' && styles.tabButtonActive]}
            onPress={() => setActiveTab('email')}
          >
            <Text style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>
              📧 Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'otp' && styles.tabButtonActive]}
            onPress={() => setActiveTab('otp')}
          >
            <Text style={[styles.tabText, activeTab === 'otp' && styles.tabTextActive]}>
              📱 OTP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {activeTab === 'email' ? (
            <>
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#a0aec0"
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus={true}
                value={email}
                onChangeText={setEmail}
              />
              
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#a0aec0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotContainer}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {!otpSent ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number or Email"
                    placeholderTextColor="#a0aec0"
                    autoCapitalize="none"
                    value={identifier}
                    onChangeText={setIdentifier}
                  />
                  <TouchableOpacity style={styles.loginButton} onPress={() => handleSendOtp(false)} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Send OTP</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={{ textAlign: 'center', marginBottom: 15, color: '#718096' }}>OTP sent to {identifier}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 4-digit OTP"
                    placeholderTextColor="#a0aec0"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={otp}
                    onChangeText={setOtp}
                  />
                  <TouchableOpacity style={styles.loginButton} onPress={handleVerifyOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Verify & Login</Text>}
                  </TouchableOpacity>
                  
                  <View style={{ alignItems: 'center', marginTop: 10 }}>
                    {countdown > 0 ? (
                      <Text style={{ color: '#4a5568' }}>Resend OTP in {formatTime(countdown)}</Text>
                    ) : (
                      <TouchableOpacity onPress={() => handleSendOtp(true)} disabled={loading || resendCount >= 2}>
                        <Text style={{ color: (loading || resendCount >= 2) ? '#a0aec0' : '#00b4d8', fontWeight: '600' }}>
                          Resend OTP {resendCount < 2 ? `(${2 - resendCount} left)` : '(Limit reached)'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={{ marginTop: 15, paddingBottom: 15 }} onPress={() => { setOtpSent(false); setOtp(''); if (timerRef.current) clearInterval(timerRef.current); }}>
                      <Text style={{ color: '#718096', textDecorationLine: 'underline' }}>Change Mobile/Email</Text>
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

          <TouchableOpacity style={styles.googleButton}>
            <Image 
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#00b4d8', // Cyan matching the screenshot
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 30,
  },
  tabButtonActive: {
    backgroundColor: '#0bb79e', // Gradient fallback
    shadowColor: '#0bb79e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4a5568',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2d3748',
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2d3748',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    color: '#a0aec0',
    fontSize: 18,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#00b4d8',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#0bb79e', // Sea green cyan from screenshot
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0bb79e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#a0aec0',
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#1a202c',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#a0aec0',
    fontSize: 14,
  },
  registerLink: {
    color: '#00b4d8',
    fontSize: 14,
    fontWeight: '700',
  },
});
