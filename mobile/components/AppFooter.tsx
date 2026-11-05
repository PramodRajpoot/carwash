import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeHapticLight, safeHapticMedium } from '../utils/haptics';

export type FooterTab = 'home' | 'garage' | 'book' | 'support' | 'notifications';

interface Props {
  activeTab?: FooterTab | 'none';
  isDark?: boolean;
  onTabPress: (tab: FooterTab) => void;
}

export default function AppFooter({
  activeTab = 'home',
  isDark = false,
  onTabPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomPosition = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 20) + 6;

  const handlePress = (tab: FooterTab) => {
    if (tab === 'book') {
      safeHapticMedium();
    } else {
      safeHapticLight();
    }
    onTabPress(tab);
  };

  const getIconColor = (tab: FooterTab) => {
    if (activeTab === tab) return '#e11d48';
    return isDark ? '#94a3b8' : '#64748b';
  };

  const getCapsuleStyle = (tab: FooterTab) => {
    if (activeTab !== tab) return null;
    return isDark ? styles.darkActiveTabCapsule : styles.activeTabCapsule;
  };

  const getLabelStyle = (tab: FooterTab) => {
    const isActive = activeTab === tab;
    return [
      styles.tabLabel,
      isDark && styles.darkTabLabel,
      isActive && (isDark ? styles.darkTabLabelActive : styles.tabLabelActive),
    ];
  };

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomPosition }]} pointerEvents="box-none">
      <View style={[styles.pillContainer, isDark && styles.darkPillContainer]}>
        {/* Home */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabItem, getCapsuleStyle('home')]}
          onPress={() => handlePress('home')}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={18}
            color={getIconColor('home')}
          />
          <Text style={getLabelStyle('home')}>
            Home
          </Text>
        </TouchableOpacity>

        {/* My Garage */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabItem, getCapsuleStyle('garage')]}
          onPress={() => handlePress('garage')}
        >
          <Ionicons
            name={activeTab === 'garage' ? 'car-sport' : 'car-sport-outline'}
            size={18}
            color={getIconColor('garage')}
          />
          <Text style={getLabelStyle('garage')} numberOfLines={1}>
            My Garage
          </Text>
        </TouchableOpacity>

        {/* Book Wash */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabItem, getCapsuleStyle('book')]}
          onPress={() => handlePress('book')}
        >
          <Ionicons
            name={activeTab === 'book' ? 'sparkles' : 'sparkles-outline'}
            size={18}
            color={getIconColor('book')}
          />
          <Text style={getLabelStyle('book')} numberOfLines={1}>
            Wash List
          </Text>
        </TouchableOpacity>

        {/* Support */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabItem, getCapsuleStyle('support')]}
          onPress={() => handlePress('support')}
        >
          <Ionicons
            name={activeTab === 'support' ? 'headset' : 'headset-outline'}
            size={18}
            color={getIconColor('support')}
          />
          <Text style={getLabelStyle('support')} numberOfLines={1}>
            Support
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 99,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 36,
    paddingVertical: 6,
    paddingHorizontal: 8,
    width: '100%',
    maxWidth: 440,
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
    paddingHorizontal: 4,
    borderRadius: 26,
  },
  activeTabCapsule: {
    backgroundColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  darkActiveTabCapsule: {
    backgroundColor: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
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
    color: '#ffffff',
    fontWeight: '800',
  },
  badgeDot: {
    position: 'absolute',
    top: -3,
    right: -7,
    backgroundColor: '#e11d48',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
});
