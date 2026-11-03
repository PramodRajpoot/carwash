import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Linking,
  BackHandler,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
const WebViewComponent: any = WebView;
import { Ionicons } from '@expo/vector-icons';
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
  const webviewRef = useRef<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [webProgress, setWebProgress] = useState(0);

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

    // If the webview navigates back to the login page, it implies logout from the web app.
    // Only treat exact root URL (no query/hash) as logout — payment redirects include query params.
    const url = navState.url;
    const isLoginPage = url === `${API_BASE}/login` || url === `${API_BASE}/login/`;
    const isExactRoot = url === `${API_BASE}/` || url === API_BASE;

    // Skip cashfree return URLs — these are part of the payment flow, not logout
    const isCashfreeReturn = url.includes('/cashfree/return');

    if (!isCashfreeReturn && (isLoginPage || isExactRoot)) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      router.replace('/');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            router.replace('/login');
          },
        },
      ]
    );
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
    if (
      url.startsWith('upi://') ||
      url.startsWith('phonepe://') ||
      url.startsWith('gpay://') ||
      url.startsWith('paytmmp://') ||
      url.startsWith('tez://')
    ) {
      Linking.openURL(url).catch((err) => {
        console.warn('Failed to open UPI app:', err);
      });
      return false;
    }

    // Handle Android intent:// links
    if (url.startsWith('intent://')) {
      const fallbackMatch = url.match(/S\.browser_fallback_url=([^;]+)/);
      if (fallbackMatch) {
        const fallbackUrl = decodeURIComponent(fallbackMatch[1]);
        Linking.openURL(fallbackUrl).catch(() => {});
      } else {
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

      // Allow common bank netbanking / 3DS verification pages inside WebView
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
      return true;
    }
  };

  if (loading || !token) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Opening Customer Portal...</Text>
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
      <StatusBar style="light" />
      
      {/* Sleek Native App Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {canGoBack ? (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => webviewRef.current?.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={22} color="#f8fafc" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIconBadge}>
              <Ionicons name="car-sport" size={18} color="#38bdf8" />
            </View>
          )}
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>CleanAtDoorstep</Text>
            <View style={styles.headerSubBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSubtitle}>Customer Portal</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => webviewRef.current?.reload()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="reload" size={18} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, styles.logoutBtn]}
            onPress={handleLogout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={20} color="#f87171" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      {webProgress > 0 && webProgress < 1 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${webProgress * 100}%` }]} />
        </View>
      )}

      <WebViewComponent
        ref={webviewRef}
        source={{
          uri: `${API_BASE}/customer`,
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true',
          },
        }}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onLoadProgress={({ nativeEvent }: any) => {
          setWebProgress(nativeEvent.progress);
        }}
        style={styles.webview}
        startInLoadingState={true}
        mixedContentMode="always"
        domStorageEnabled={true}
        javaScriptEnabled={true}
        javaScriptCanOpenWindowsAutomatically={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        thirdPartyCookiesEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        userAgent={
          Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
            : undefined
        }
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.webviewLoadingText}>Loading your services...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 42 : 8,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  headerTitleWrap: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  headerSubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarContainer: {
    height: 2.5,
    backgroundColor: '#1e293b',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    gap: 12,
  },
  webviewLoadingText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
});
