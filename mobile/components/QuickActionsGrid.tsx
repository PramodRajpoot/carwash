import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeHapticLight } from '../utils/haptics';

interface Props {
  isDark?: boolean;
  onBookWashPress?: () => void;
  onGaragePress?: () => void;
  onSubscriptionsPress?: () => void;
  onWalletPress?: () => void;
  onOffersPress?: () => void;
  onReferPress?: () => void;
  onSupportPress?: () => void;
  onWishlistPress?: () => void;
}

export default function QuickActionsGrid({
  isDark = false,
  onBookWashPress,
  onGaragePress,
  onSubscriptionsPress,
  onWalletPress,
  onOffersPress,
  onReferPress,
  onSupportPress,
  onWishlistPress,
}: Props) {
  const handleTilePress = (action?: () => void) => {
    safeHapticLight();
    action?.();
  };

  const TILES = [
    {
      id: 'garage',
      title: 'My Garage',
      icon: 'car-sport',
      color: '#059669',
      bg: '#ecfdf5',
      borderColor: '#a7f3d0',
      action: onGaragePress,
    },
    {
      id: 'book',
      title: 'Book Wash',
      icon: 'sparkles',
      color: '#0284c7',
      bg: '#f0f9ff',
      borderColor: '#bae6fd',
      action: onBookWashPress,
    },
    {
      id: 'plans',
      title: 'Subscriptions',
      icon: 'cube',
      color: '#d97706',
      bg: '#fffbeb',
      borderColor: '#fde68a',
      action: onSubscriptionsPress,
    },
    {
      id: 'wallet',
      title: 'E-Points',
      icon: 'wallet',
      color: '#0284c7',
      bg: '#f0f9ff',
      borderColor: '#bae6fd',
      action: onWalletPress,
    },
    {
      id: 'offers',
      title: 'Offers',
      icon: 'ticket',
      color: '#e11d48',
      bg: '#fff1f2',
      borderColor: '#fecdd3',
      action: onOffersPress,
    },
    {
      id: 'refer',
      title: 'Refer & Earn',
      icon: 'gift',
      color: '#7c3aed',
      bg: '#f5f3ff',
      borderColor: '#ddd6fe',
      action: onReferPress,
    },
    {
      id: 'support',
      title: 'Support',
      icon: 'headset',
      color: '#0284c7',
      bg: '#f0f9ff',
      borderColor: '#bae6fd',
      action: onSupportPress,
    },
    {
      id: 'wishlist',
      title: 'Wishlist',
      icon: 'heart',
      color: '#f43f5e',
      bg: '#fff1f2',
      borderColor: '#fecdd3',
      action: onWishlistPress,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.cardWrapper, isDark && styles.darkCardWrapper]}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
            SERVICES & FEATURES
          </Text>
          <Text style={[styles.sectionSub, isDark && styles.darkSectionSub]}>
            8 Quick Actions
          </Text>
        </View>

        <View style={styles.grid}>
          {TILES.map((t) => (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.7}
              style={styles.tile}
              onPress={() => handleTilePress(t.action)}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isDark ? '#1e293b' : t.bg,
                    borderColor: isDark ? '#334155' : t.borderColor,
                  },
                ]}
              >
                <Ionicons name={t.icon as any} size={24} color={t.color} />
              </View>
              <Text
                style={[styles.tileTitle, isDark && styles.darkTileTitle]}
                numberOfLines={2}
              >
                {t.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  cardWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  darkCardWrapper: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.6,
  },
  darkSectionTitle: {
    color: '#f8fafc',
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  darkSectionSub: {
    color: '#64748b',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '24%',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tileTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 2,
  },
  darkTileTitle: {
    color: '#e2e8f0',
  },
});
