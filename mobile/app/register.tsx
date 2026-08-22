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
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE } from '../constants/api';

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

  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 400); // 400ms delay ensures screen transition is complete
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !passwordConfirm) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert('Error', 'Passwords do not match.');
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

        Alert.alert('Welcome! 🎉', welcomeMessage, [
          { text: 'OK', onPress: () => router.replace('/dashboard') }
        ]);
      } else {
        Alert.alert('Registration Failed', response.data.message || 'Could not register');
      }
    } catch (error: any) {
      console.error(error);
      let msg = 'Network error, please try again.';
      if (error.response?.data?.errors) {
        // Laravel validation returns errors as an object of field: [messages]
        const errors = error.response.data.errors;
        msg = Object.values(errors).flat().join('\n');
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      Alert.alert('Registration Failed', msg);
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
            <Text style={styles.subtitle}>Create a new account</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <TextInput
              ref={nameInputRef}
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#a0aec0"
              autoFocus={true}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#a0aec0"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Mobile Number (10 digits)"
              placeholderTextColor="#a0aec0"
              keyboardType="numeric"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
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

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#a0aec0"
                secureTextEntry={!showPasswordConfirm}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
              />
              <TouchableOpacity onPress={() => setShowPasswordConfirm(!showPasswordConfirm)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{showPasswordConfirm ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.referralContainer}>
              <TextInput
                style={[styles.input, { marginBottom: referralCode ? 4 : 16 }]}
                placeholder="Referral Code (Optional)"
                placeholderTextColor="#a0aec0"
                autoCapitalize="characters"
                value={referralCode}
                onChangeText={setReferralCode}
              />
              {referralCode.length > 0 && (
                <Text style={styles.discountText}>🎉 10% discount on first booking + 50 E-Points bonus!</Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Register Now</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
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
    color: '#00b4d8', 
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  formContainer: {
    marginBottom: 10,
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
    marginBottom: 16,
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
  registerButton: {
    backgroundColor: '#0bb79e', 
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#0bb79e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
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
  loginLink: {
    color: '#00b4d8',
    fontSize: 14,
    fontWeight: '700',
  },
  referralContainer: {
    marginBottom: 0,
  },
  discountText: {
    fontSize: 12,
    color: '#10b981', // Emerald green
    marginBottom: 16,
    marginLeft: 4,
  },
});
