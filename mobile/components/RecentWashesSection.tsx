import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeHapticLight, safeHapticMedium } from '../utils/haptics';

interface Props {
  washes?: any[];
  totalCount?: number;
  onViewAllPress?: () => void;
  onWashPress?: (wash: any) => void;
  onScheduleFirstPress?: () => void;
}

export default function RecentWashesSection({
  washes = [],
  totalCount = 0,
  onViewAllPress,
  onWashPress,
  onScheduleFirstPress,
}: Props) {
  // Cap strictly at latest 5 washes
  const latest5 = washes.slice(0, 5);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'assigned':
        return { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd' };
      case 'ongoing':
        return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' };
      case 'cancelled':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    }
  };

  const getWashTitle = (w: any) => {
    return w.vehicle?.make_model || w.vehicle?.plate_number || w.package?.name || 'Car Wash Service';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.sectionTitle}>RECENT WASHES</Text>
          <View style={styles.latestBadge}>
            <Text style={styles.latestBadgeText}>Latest 5</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.viewAllBtn}
          onPress={() => {
            safeHapticLight();
            onViewAllPress?.();
          }}
        >
          <Text style={styles.viewAllText}>
            View All ({totalCount || washes.length}) →
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {latest5.length > 0 ? (
        <View style={styles.list}>
          {latest5.map((w) => {
            const statusConfig = getStatusColor(w.status);
            const title = getWashTitle(w);

            return (
              <TouchableOpacity
                key={w.id}
                activeOpacity={0.75}
                style={styles.washCard}
                onPress={() => {
                  safeHapticLight();
                  onWashPress?.(w);
                }}
              >
                {/* Car Icon Badge */}
                <View
                  style={[
                    styles.carIconBadge,
                    { backgroundColor: statusConfig.bg },
                  ]}
                >
                  <Ionicons
                    name="car-sport"
                    size={20}
                    color={statusConfig.text}
                  />
                </View>

                {/* Wash Info */}
                <View style={styles.infoCol}>
                  <View style={styles.carNameRow}>
                    <Text style={styles.carName} numberOfLines={1}>
                      {title}
                    </Text>
                    {w.vehicle?.plate_number && w.vehicle?.plate_number !== title && (
                      <View style={styles.plateChip}>
                        <Text style={styles.plateText}>
                          {w.vehicle.plate_number}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleText} numberOfLines={1}>
                      📅 {formatDate(w.booking_date) || w.booking_date}
                    </Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.slotText} numberOfLines={1}>
                      ⏰ {w.slot_time}
                    </Text>
                  </View>

                  {w.address ? (
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={11} color="#94a3b8" />
                      <Text style={styles.addressText} numberOfLines={1}>
                        {w.address}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: statusConfig.bg,
                      borderColor: statusConfig.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: statusConfig.text }]}
                  >
                    {w.status?.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Empty State */
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="car-outline" size={32} color="#0284c7" />
          </View>
          <Text style={styles.emptyTitle}>No wash bookings yet</Text>
          <Text style={styles.emptyDesc}>
            Book your first doorstep car wash service in less than a minute!
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.emptyActionBtn}
            onPress={() => {
              safeHapticMedium();
              onScheduleFirstPress?.();
            }}
          >
            <Text style={styles.emptyActionText}>Schedule First Wash</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  latestBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  latestBadgeText: {
    color: '#0284c7',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  viewAllBtn: {
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  list: {
    gap: 10,
  },
  washCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  carIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoCol: {
    flex: 1,
    marginRight: 6,
  },
  carNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  carName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  plateChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  plateText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.4,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 2,
  },
  scheduleText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  dotSeparator: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  slotText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  addressText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 240,
  },
  emptyActionBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
