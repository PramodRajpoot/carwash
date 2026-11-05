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
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../constants/api';
import { showSweetAlert } from '../utils/sweetAlert';

axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

export default function RegisterScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  
  const [loading, setLoading] = useState(false);

  const nameInputRef = useRef<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !passwordConfirm) {
      showSweetAlert('Error', 'Please fill in all required fields.', 'error');
      return;
    }

    if (password !== passwordConfirm) {
      showSweetAlert('Error', 'Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, {
        name,
        email,
        phone,
        password,
        password_confirmation: passwordConfirm,
        role: 'customer',
        referred_by_code: referralCode,
      });

      if (response.data.status === 'success') {
        const token = response.data.access_token;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        const welcomeMessage = referralCode.trim() 
          ? 'Registration successful! You and your referrer both earned 50 E-Points!'
          : 'Registration successful! You earned 50 E-Points as a welcome bonus!';

        showSweetAlert('Welcome! 🎉', welcomeMessage, 'success', () => router.replace('/dashboard'));
      } else {
        showSweetAlert('Registration Failed', response.data.message || 'Could not register', 'error');
      }
    } catch (error: any) {
      console.error(error);
      let msg = 'Network error, please try again.';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        msg = Object.values(errors).flat().join('\n');
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      showSweetAlert('Registration Failed', msg, 'error');
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
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image 
                source={require('../assets/images/icon.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.subtitle}>Join CleanAtDoorstep for hassle-free doorstep car care</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                ref={nameInputRef}
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#94a3b8"
                autoFocus={true}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address *"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mobile Number (10 digits) *"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password *"
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

            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password *"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPasswordConfirm}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
              />
              <TouchableOpacity onPress={() => setShowPasswordConfirm(!showPasswordConfirm)} style={styles.eyeButton}>
                <Ionicons 
                  name={showPasswordConfirm ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' }]}>
              <Ionicons name="gift-outline" size={20} color="#0d9488" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Referral Code (Optional - earn 50 pts)"
                placeholderTextColor="#0f766e"
                autoCapitalize="characters"
                value={referralCode}
                onChangeText={setReferralCode}
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.85}
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
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
    backgroundColor: '#0f172a', // Deep navy matching login
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
    marginBottom: 22,
  },
  logoBadge: {
    width: 64,
    height: 64,
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
    width: 40,
    height: 40,
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
    marginBottom: 12,
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
  registerButton: {
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
    marginTop: 8,
    marginBottom: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
  },
  loginLink: {
    color: '#0d9488',
    fontSize: 13,
    fontWeight: '700',
  },
});
