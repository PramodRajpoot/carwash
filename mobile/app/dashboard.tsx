import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, SafeAreaView, ActivityIndicator, Platform, Linking, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { API_BASE } from '../constants/api';

// Domains that are allowed to load inside the WebView (payment flow)
const ALLOWED_HOSTS = [
  // Your own server
  new URL(API_BASE).hostname,
  // Cashfree domains
  'sdk.cashfree.com',
  'api.cashfree.com',
  'sandbox.cashfree.com',
  'payments.cashfree.com',
  'payments-test.cashfree.com',
  'cashfree.com',
  // Bank / payment intermediaries commonly used by Cashfree
  'gw.cashfree.com',
  'payments-gateway.cashfree.com',
];

export default function DashboardScreen() {
  const router = useRouter();
  const webviewRef = useRef<WebView>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedToken && storedUser) {
          // Ensure only customers can access the dashboard
          const user = JSON.parse(storedUser);
          if (user.role !== 'customer') {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            router.replace('/login');
            return;
          }
          setToken(storedToken);
          setUserData(storedUser);
        } else {
          // Not logged in, redirect to login
          router.replace('/login');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthData();
  }, []);

  // Handle Android hardware back button for WebView navigation
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true; // prevent default back behaviour
      }
      return false; // let system handle (exit screen)
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = async (navState: any) => {
    setCanGoBack(navState.canGoBack);

    // If the webview navigates back to the root or login page, it implies logout from the web app
    const url = navState.url;
    if (url === `${API_BASE}/login` || url === `${API_BASE}/`) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      router.replace('/');
    }
  };

  /**
   * Intercept navigation requests to handle:
   * 1. UPI deep links (upi://) → open in external app
   * 2. Intent links (intent://) → open in external app (Android)
   * 3. Cashfree / own-server URLs → allow inside WebView
   * 4. Other external URLs → open in system browser
   */
  const onShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;

    // Allow about:blank and javascript: schemes
    if (url.startsWith('about:') || url.startsWith('javascript:')) {
      return true;
    }

    // Handle UPI deep links — open in external UPI app
    if (url.startsWith('upi://') || url.startsWith('phonepe://') || url.startsWith('gpay://') || url.startsWith('paytmmp://') || url.startsWith('tez://')) {
      Linking.openURL(url).catch((err) => {
        console.warn('Failed to open UPI app:', err);
      });
      return false;
    }

    // Handle Android intent:// links
    if (url.startsWith('intent://')) {
      // Try to extract the fallback URL from the intent
      const fallbackMatch = url.match(/S\.browser_fallback_url=([^;]+)/);
      if (fallbackMatch) {
        const fallbackUrl = decodeURIComponent(fallbackMatch[1]);
        Linking.openURL(fallbackUrl).catch(() => {});
      } else {
        // Try opening the intent directly
        Linking.openURL(url).catch(() => {});
      }
      return false;
    }

    // For http/https URLs, check if the host is allowed
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;

      // Allow all URLs on allowed hosts
      if (ALLOWED_HOSTS.some((host) => hostname === host || hostname.endsWith('.' + host))) {
        return true;
      }

      // Allow common bank netlbanking / 3DS verification pages inside WebView
      // These are needed for card payments and net banking via Cashfree
      if (
        hostname.includes('cashfree') ||
        hostname.includes('razorpay') ||
        hostname.includes('billdesk') ||
        hostname.includes('payu') ||
        hostname.includes('digio') ||
        hostname.includes('npci') ||
        hostname.includes('hdfcbank') ||
        hostname.includes('icicibank') ||
        hostname.includes('sbi') ||
        hostname.includes('axisbank') ||
        hostname.includes('kotak') ||
        hostname.includes('yesbank') ||
        hostname.includes('idbi') ||
        hostname.includes('pnb') ||
        hostname.includes('bob') ||
        hostname.includes('unionbank') ||
        hostname.includes('indusind') ||
        hostname.includes('federalbank') ||
        hostname.includes('canarabank') ||
        hostname.includes('rbl') ||
        hostname.includes('3dsecure') ||
        hostname.includes('acs') ||
        hostname.includes('secure')
      ) {
        return true;
      }

      // For any other external URL, open in system browser
      Linking.openURL(url).catch(() => {});
      return false;
    } catch (e) {
      // If URL parsing fails, allow it
      return true;
    }
  };

  if (loading || !token) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  // Inject token and user data into webview's localStorage before content loads
  const injectedJS = `
    try {
      localStorage.setItem('auth_token', ${JSON.stringify(token)});
      localStorage.setItem('auth_user', ${JSON.stringify(userData)});
    } catch(e) {}
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <WebView
        ref={webviewRef}
        source={{ 
          uri: `${API_BASE}/customer`,
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true'
          }
        }}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        style={styles.webview}
        startInLoadingState={true}
        mixedContentMode="always"
        domStorageEnabled={true}
        javaScriptEnabled={true}
        javaScriptCanOpenWindowsAutomatically={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Allow third-party cookies for payment flows
        thirdPartyCookiesEnabled={true}
        // Allow file access for payment SDK
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        // User agent to ensure Cashfree SDK compatibility
        userAgent={Platform.OS === 'android' 
          ? 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
          : undefined
        }
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#00D4FF" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0e27',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
