import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeHapticLight, safeHapticMedium } from '../utils/haptics';

interface Props {
  subscription: any;
  onBookPress?: () => void;
  onBrowsePress?: () => void;
}

export default function MembershipCard({
  subscription,
  onBookPress,
  onBrowsePress,
}: Props) {
  const hasActive = !!subscription?.package;

  const maxBookings = subscription?.package?.max_bookings || 1;
  const usedBookings = subscription?.booking_count || 0;
  const remaining = Math.max(0, maxBookings - usedBookings);
  const progressPct = Math.min(100, Math.round((usedBookings / maxBookings) * 100));

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

  const handleBook = () => {
    safeHapticMedium();
    onBookPress?.();
  };

  const handleBrowse = () => {
    safeHapticLight();
    onBrowsePress?.();
  };

  if (!hasActive) {
    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, styles.emptyCard]}>
          <View style={styles.emptyHeader}>
            <View style={styles.badgeClub}>
              <Ionicons name="sparkles" size={13} color="#f59e0b" />
              <Text style={styles.badgeClubText}>DOORSTEP CLUB</Text>
            </View>
            <Text style={styles.emptyTag}>Save up to 40%</Text>
          </View>

          <Text style={styles.emptyTitle}>Get a Car Wash Subscription</Text>
          <Text style={styles.emptyDesc}>
            Enjoy hassle-free doorstep car washes every week or month at discounted subscriber rates.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.browseBtn}
            onPress={handleBrowse}
          >
            <Text style={styles.browseBtnText}>Explore Wash Plans</Text>
            <Ionicons name="arrow-forward" size={16} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, styles.activeCard]}>
        {/* Pass Header */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeActive}>
            <View style={styles.liveIndicator} />
            <Text style={styles.badgeActiveText}>ACTIVE PASS</Text>
          </View>
          <Text style={styles.remainingPill}>{remaining} Washes Left</Text>
        </View>

        {/* Plan Title */}
        <Text style={styles.planName}>{subscription.package.name}</Text>
        <Text style={styles.usageSubtitle}>
          {usedBookings} of {maxBookings} washes completed
        </Text>

        {/* Custom Glowing Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.expiryCol}>
            <Text style={styles.expiryLabel}>Valid Until</Text>
            <Text style={styles.expiryValue}>
              {formatDate(subscription.expires_at)}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.bookWashBtn}
            onPress={handleBook}
          >
            <Ionicons name="car-sport" size={15} color="#0f172a" />
            <Text style={styles.bookWashBtnText}>Book Wash</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  activeCard: {
    backgroundColor: '#0a192f',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.25)',
  },
  emptyCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  badgeActiveText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  remainingPill: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  planName: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  usageSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  expiryCol: {
    justifyContent: 'center',
  },
  expiryLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expiryValue: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  bookWashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
  },
  bookWashBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeClub: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 5,
  },
  badgeClubText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emptyTag: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    gap: 8,
  },
  browseBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
});
