import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeHapticLight } from '../utils/haptics';

interface Props {
  isDark?: boolean;
  earningMoney?: string | number;
  ePoints?: number;
  totalWashes?: number;
  onPress?: () => void;
}

export default function WalletSummaryStrip({
  isDark = false,
  earningMoney = 0,
  ePoints = 0,
  totalWashes = 0,
  onPress,
}: Props) {
  const formattedMoney = parseFloat(String(earningMoney) || '0').toFixed(2);

  const handlePress = () => {
    safeHapticLight();
    onPress?.();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.card, isDark && styles.darkCard]}
        onPress={handlePress}
      >
        {/* Wallet Cash */}
        <View style={styles.column}>
          <View style={styles.topRow}>
            <Ionicons name="wallet-outline" size={14} color="#059669" />
            <Text style={[styles.colLabel, isDark && styles.darkColLabel]}>
              Wallet
            </Text>
          </View>
          <Text style={[styles.colValue, styles.emeraldValue]}>
            ₹{formattedMoney}
          </Text>
        </View>

        <View style={[styles.divider, isDark && styles.darkDivider]} />

        {/* E-Points */}
        <View style={styles.column}>
          <View style={styles.topRow}>
            <Ionicons name="star-outline" size={14} color="#d97706" />
            <Text style={[styles.colLabel, isDark && styles.darkColLabel]}>
              E-Points
            </Text>
          </View>
          <Text style={[styles.colValue, styles.amberValue]}>
            {ePoints}{' '}
            <Text style={[styles.smallUnit, isDark && styles.darkSmallUnit]}>
              pts
            </Text>
          </Text>
        </View>

        <View style={[styles.divider, isDark && styles.darkDivider]} />

        {/* Washes Done */}
        <View style={styles.column}>
          <View style={styles.topRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={14}
              color="#0284c7"
            />
            <Text style={[styles.colLabel, isDark && styles.darkColLabel]}>
              Washes
            </Text>
          </View>
          <Text style={[styles.colValue, styles.cyanValue]}>
            {totalWashes}{' '}
            <Text style={[styles.smallUnit, isDark && styles.darkSmallUnit]}>
              done
            </Text>
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#f1f5f9',
  },
  darkDivider: {
    backgroundColor: '#1f2937',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  darkColLabel: {
    color: '#94a3b8',
  },
  colValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  smallUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  darkSmallUnit: {
    color: '#64748b',
  },
  emeraldValue: {
    color: '#059669',
  },
  amberValue: {
    color: '#d97706',
  },
  cyanValue: {
    color: '#0284c7',
  },
});
