import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeHapticLight } from '../utils/haptics';
import { useAppTheme } from '../utils/themeManager';

export type FooterTab =
  | 'home'
  | 'bookings'
  | 'refer'
  | 'wallet'
  | 'profile'
  | 'garage'
  | 'book'
  | 'support'
  | 'notifications';

interface Props {
  activeTab?: FooterTab | 'none';
  isDark?: boolean;
  onTabPress?: (tab: FooterTab) => void;
}

export default function AppFooter({
  activeTab,
  isDark: propIsDark,
  onTabPress,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDark: globalDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : globalDark;
  const bottomPosition = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16) + 4;

  const [clickedTab, setClickedTab] = useState<FooterTab | null>(null);

  // Automatically determine tab from route pathname
  const routeTab = useMemo<FooterTab>(() => {
    if (!pathname || pathname === '/' || pathname === '/index') return 'home';
    if (
      pathname.startsWith('/bookings') ||
      pathname.startsWith('/book') ||
      pathname.startsWith('/booking-summary')
    ) {
      return 'bookings';
    }
    if (pathname.startsWith('/refer-and-earn')) return 'refer';
    if (pathname.startsWith('/e-points')) return 'wallet';
    if (
      pathname.startsWith('/profile') ||
      pathname.startsWith('/garage') ||
      pathname.startsWith('/support') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/login')
    ) {
      return 'profile';
    }
    return 'home';
  }, [pathname]);

  // Reset temporary clicked tab when pathname changes
  useEffect(() => {
    setClickedTab(null);
  }, [pathname]);

  // Current active tab: clicked tab takes precedence immediately, then route-derived tab, then explicit prop
  const currentTab = useMemo<FooterTab | 'none'>(() => {
    if (clickedTab) return clickedTab;
    if (activeTab === 'none') return 'none';
    if (routeTab) return routeTab;
    return activeTab || 'home';
  }, [clickedTab, activeTab, routeTab]);

  const handlePress = (tab: FooterTab) => {
    safeHapticLight();
    setClickedTab(tab);

    // Call screen-provided handler if any
    if (onTabPress) {
      onTabPress(tab);
    }

    // Guaranteed automatic navigation if route doesn't match
    if (tab === 'home') {
      if (pathname !== '/' && pathname !== '/index') {
        router.push('/');
      }
    } else if (tab === 'bookings' || tab === 'book') {
      if (pathname !== '/bookings') {
        router.push('/bookings');
      }
    } else if (tab === 'refer') {
      if (pathname !== '/refer-and-earn') {
        router.push('/refer-and-earn');
      }
    } else if (tab === 'wallet') {
      if (pathname !== '/e-points') {
        router.push('/e-points');
      }
    } else if (tab === 'profile') {
      if (pathname !== '/profile') {
        router.push('/profile');
      }
    }
  };

  const isTabActive = (tab: FooterTab) => {
    if (currentTab === 'none') return false;
    if (currentTab === tab) return true;
    if (tab === 'bookings' && (currentTab === 'book' || activeTab === 'book')) return true;
    if (
      tab === 'profile' &&
      (currentTab === 'garage' || currentTab === 'support' || activeTab === 'garage' || activeTab === 'support')
    ) {
      return true;
    }
    return false;
  };

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomPosition }]} pointerEvents="box-none">
      <View
        style={[styles.pillContainer, isDark && styles.darkPillContainer]}
        pointerEvents="auto"
      >
        {/* 1. Home */}
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={[
            styles.tabItem,
            isTabActive('home') && (isDark ? styles.darkActiveTabCapsule : styles.activeTabCapsule),
          ]}
          onPress={() => handlePress('home')}
        >
          <Ionicons
            name={isTabActive('home') ? 'home' : 'home-outline'}
            size={20}
            color={isTabActive('home') ? '#0f172a' : isDark ? '#94a3b8' : '#64748b'}
          />
          <Text
            style={[
              styles.tabLabel,
              isDark && styles.darkTabLabel,
              isTabActive('home') && (isDark ? styles.darkTabLabelActive : styles.tabLabelActive),
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Bookings */}
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={[
            styles.tabItem,
            isTabActive('bookings') && (isDark ? styles.darkActiveTabCapsule : styles.activeTabCapsule),
          ]}
          onPress={() => handlePress('bookings')}
        >
          <Ionicons
            name={isTabActive('bookings') ? 'calendar' : 'calendar-outline'}
            size={20}
            color={isTabActive('bookings') ? '#0f172a' : isDark ? '#94a3b8' : '#64748b'}
          />
          <Text
            style={[
              styles.tabLabel,
              isDark && styles.darkTabLabel,
              isTabActive('bookings') && (isDark ? styles.darkTabLabelActive : styles.tabLabelActive),
            ]}
            numberOfLines={1}
          >
            Bookings
          </Text>
        </TouchableOpacity>

        {/* 3. Refer & Earn */}
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={[
            styles.tabItem,
            isTabActive('refer') && (isDark ? styles.darkActiveTabCapsule : styles.activeTabCapsule),
          ]}
          onPress={() => handlePress('refer')}
        >
          <Ionicons
            name={isTabActive('refer') ? 'gift' : 'gift-outline'}
            size={20}
            color={isTabActive('refer') ? '#0f172a' : isDark ? '#94a3b8' : '#64748b'}
          />
          <Text
            style={[
              styles.tabLabel,
              isDark && styles.darkTabLabel,
              isTabActive('refer') && (isDark ? styles.darkTabLabelActive : styles.tabLabelActive),
            ]}
            numberOfLines={1}
          >
            Refer & Earn
          </Text>
        </TouchableOpacity>

        {/* 4. Wallet */}
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={[
            styles.tabItem,
            isTabActive('wallet') && (isDark ? styles.darkActiveTabCapsule : styles.activeTabCapsule),
          ]}
          onPress={() => handlePress('wallet')}
        >
          <Ionicons
            name={isTabActive('wallet') ? 'wallet' : 'wallet-outline'}
            size={20}
            color={isTabActive('wallet') ? '#0f172a' : isDark ? '#94a3b8' : '#64748b'}
          />
          <Text
            style={[
              styles.tabLabel,
              isDark && styles.darkTabLabel,
              isTabActive('wallet') && (isDark ? styles.darkTabLabelActive : styles.tabLabelActive),
            ]}
            numberOfLines={1}
          >
            Wallet
          </Text>
        </TouchableOpacity>

        {/* 5. Profile */}
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={[
            styles.tabItem,
            isTabActive('profile') && (isDark ? styles.darkActiveTabCapsule : styles.activeTabCapsule),
          ]}
          onPress={() => handlePress('profile')}
        >
          <Ionicons
            name={isTabActive('profile') ? 'person' : 'person-outline'}
            size={20}
            color={isTabActive('profile') ? '#0f172a' : isDark ? '#94a3b8' : '#64748b'}
          />
          <Text
            style={[
              styles.tabLabel,
              isDark && styles.darkTabLabel,
              isTabActive('profile') && (isDark ? styles.darkTabLabelActive : styles.tabLabelActive),
            ]}
            numberOfLines={1}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 10,
    right: 10,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 6,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  darkPillContainer: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    shadowColor: '#000000',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 16,
  },
  activeTabCapsule: {
    backgroundColor: '#fde047', // Vibrant yellow pill matching screenshot
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  darkActiveTabCapsule: {
    backgroundColor: '#eab308',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  darkTabLabel: {
    color: '#94a3b8',
  },
  tabLabelActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  darkTabLabelActive: {
    color: '#000000',
    fontWeight: '900',
  },
});
