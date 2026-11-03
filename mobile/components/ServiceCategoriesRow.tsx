import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeHapticLight } from '../utils/haptics';

interface Props {
  onCategorySelect?: (category: string) => void;
}

const CATEGORIES = [
  { id: 'daily', label: 'Daily Wash', icon: 'car-sport-outline', color: '#0284c7' },
  { id: 'deep', label: 'Deep Clean', icon: 'sparkles-outline', color: '#059669' },
  { id: 'interior', label: 'Interior Spa', icon: 'color-wand-outline', color: '#7c3aed' },
  { id: 'wax', label: 'Polish & Wax', icon: 'shield-checkmark-outline', color: '#d97706' },
  { id: 'plans', label: 'Wash Pass', icon: 'cube-outline', color: '#e11d48' },
];

export default function ServiceCategoriesRow({ onCategorySelect }: Props) {
  const handlePress = (id: string) => {
    safeHapticLight();
    onCategorySelect?.(id);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.75}
            style={styles.categoryCard}
            onPress={() => handlePress(item.id)}
          >
            <View style={[styles.iconBox, { borderColor: item.color + '30' }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={styles.categoryLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    width: 68,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
});
