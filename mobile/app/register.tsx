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

const API_BASE = 'https://carwash-api.loca.lt';
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true'; // Keep just in case they switch back to ngrok

export default function RegisterScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
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
        role: 'customer'
      });

      if (response.data.status === 'success') {
        const token = response.data.access_token;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        Alert.alert('Success', 'Registration successful!', [
          { text: 'OK', onPress: () => router.replace('/dashboard') }
        ]);
      } else {
        Alert.alert('Registration Failed', response.data.message || 'Could not register');
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Network error, please try again.';
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
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#a0aec0"
                secureTextEntry
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
              />
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
});
