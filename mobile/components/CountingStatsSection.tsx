import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeHapticLight } from '../utils/haptics';

interface MonthData {
  month: string;
  completed: number;
  total: number;
}

interface CountingStatsSectionProps {
  dashData: {
    booking_count?: number;
    total_bookings?: number;
    earning_money?: string | number;
    e_points?: number;
    unread_notifications?: number;
    monthly_washes?: MonthData[];
  };
  isDark?: boolean;
  onWashesPress?: () => void;
  onEarningMoneyPress?: () => void;
  onEPointsPress?: () => void;
  onNotificationsPress?: () => void;
}

type ViewMode = 'cards' | 'chart';

export default function CountingStatsSection({
  dashData,
  isDark = false,
  onWashesPress,
  onEarningMoneyPress,
  onEPointsPress,
  onNotificationsPress,
}: CountingStatsSectionProps) {
  // Default to 'cards' per user request: firstly show card default
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const totalWashes = dashData.booking_count ?? 0;
  const earningMoney = parseFloat(String(dashData.earning_money || 0)).toFixed(2);
  const ePoints = dashData.e_points ?? 0;
  const notifications = dashData.unread_notifications ?? 0;

  // Monthly washes for chart (fallback to default 6 months if not provided)
  const defaultMonths: MonthData[] = [
    { month: 'Jun', completed: 0, total: 0 },
    { month: 'Jul', completed: 0, total: 0 },
    { month: 'Aug', completed: 0, total: 0 },
    { month: 'Sep', completed: 0, total: 0 },
    { month: 'Oct', completed: Math.min(totalWashes, 1), total: Math.min(totalWashes, 1) },
    { month: 'Nov', completed: totalWashes > 1 ? totalWashes - 1 : totalWashes, total: totalWashes },
  ];

  const chartData = dashData.monthly_washes && dashData.monthly_washes.length > 0
    ? dashData.monthly_washes
    : defaultMonths;

  const maxVal = Math.max(...chartData.map((d) => Math.max(d.completed, d.total, 1)), 4);

  const toggleViewMode = (mode: ViewMode) => {
    safeHapticLight();
    setViewMode(mode);
  };

  return (
    <View style={styles.container}>
      {/* Section Header with Mode Switcher */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons
            name={viewMode === 'cards' ? 'grid-outline' : 'stats-chart-outline'}
            size={16}
            color={isDark ? '#38bdf8' : '#0284c7'}
          />
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            {viewMode === 'cards' ? 'Activity Overview' : 'Activity Graph'}
          </Text>
        </View>

        {/* View Mode Toggle: Cards vs Graph */}
        <View style={[styles.modeSwitch, isDark && styles.darkSegment]}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              viewMode === 'cards' && (isDark ? styles.activeModeDark : styles.activeModeLight),
            ]}
            onPress={() => toggleViewMode('cards')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="grid-outline"
              size={12}
              color={
                viewMode === 'cards'
                  ? isDark
                    ? '#38bdf8'
                    : '#0284c7'
                  : isDark
                  ? '#64748b'
                  : '#94a3b8'
              }
              style={{ marginRight: 3 }}
            />
            <Text
              style={[
                styles.modeBtnText,
                isDark && styles.darkSubtext,
                viewMode === 'cards' && (isDark ? styles.activeModeTextDark : styles.activeModeTextLight),
              ]}
            >
              Cards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              viewMode === 'chart' && (isDark ? styles.activeModeDark : styles.activeModeLight),
            ]}
            onPress={() => toggleViewMode('chart')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="stats-chart-outline"
              size={12}
              color={
                viewMode === 'chart'
                  ? isDark
                    ? '#38bdf8'
                    : '#0284c7'
                  : isDark
                  ? '#64748b'
                  : '#94a3b8'
              }
              style={{ marginRight: 3 }}
            />
            <Text
              style={[
                styles.modeBtnText,
                isDark && styles.darkSubtext,
                viewMode === 'chart' && (isDark ? styles.activeModeTextDark : styles.activeModeTextLight),
              ]}
            >
              Graph
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards View (Default) */}
      {viewMode === 'cards' && (
        <View>
          <View style={styles.cardsGrid}>
            {/* Card 1: Total Washes */}
            <TouchableOpacity
              style={[styles.card, isDark ? styles.darkCard : styles.lightCard]}
              onPress={onWashesPress}
              activeOpacity={0.75}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(6, 182, 212, 0.16)' }]}>
                  <Text style={styles.cardEmoji}>📦</Text>
                </View>
                <Text style={[styles.diagonalArrow, isDark && styles.darkArrow]}>↗</Text>
              </View>
              <Text style={[styles.cardValue, isDark && styles.darkValueText]}>
                {totalWashes}
              </Text>
              <Text style={[styles.cardLabel, isDark && styles.darkLabelText]}>
                Total Washes
              </Text>
            </TouchableOpacity>

            {/* Card 2: Earning Money */}
            <TouchableOpacity
              style={[styles.card, isDark ? styles.darkCard : styles.lightCard]}
              onPress={onEarningMoneyPress}
              activeOpacity={0.75}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.16)' }]}>
                  <Text style={styles.cardEmoji}>💰</Text>
                </View>
                <Text style={[styles.diagonalArrow, isDark && styles.darkArrow]}>↗</Text>
              </View>
              <Text style={[styles.cardValue, { color: '#10b981' }]}>
                ₹{earningMoney}
              </Text>
              <Text style={[styles.cardLabel, isDark && styles.darkLabelText]}>
                Earning Money
              </Text>
            </TouchableOpacity>

            {/* Card 3: E-Points */}
            <TouchableOpacity
              style={[styles.card, isDark ? styles.darkCard : styles.lightCard]}
              onPress={onEPointsPress}
              activeOpacity={0.75}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.16)' }]}>
                  <Text style={styles.cardEmoji}>⭐</Text>
                </View>
                <Text style={[styles.diagonalArrow, isDark && styles.darkArrow]}>↗</Text>
              </View>
              <Text style={[styles.cardValue, { color: '#f59e0b' }]}>
                {ePoints}
              </Text>
              <Text style={[styles.cardLabel, isDark && styles.darkLabelText]}>
                E-Points
              </Text>
            </TouchableOpacity>

            {/* Card 4: Notifications */}
            <TouchableOpacity
              style={[styles.card, isDark ? styles.darkCard : styles.lightCard]}
              onPress={onNotificationsPress}
              activeOpacity={0.75}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.16)' }]}>
                  <Text style={styles.cardEmoji}>🔔</Text>
                  {notifications > 0 && <View style={styles.redBadgeDot} />}
                </View>
                <Text style={[styles.diagonalArrow, isDark && styles.darkArrow]}>↗</Text>
              </View>
              <Text style={[styles.cardValue, { color: '#a78bfa' }]}>
                {notifications}
              </Text>
              <Text style={[styles.cardLabel, isDark && styles.darkLabelText]}>
                Notifications
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Click to Switch to Graph */}
          <TouchableOpacity
            style={[styles.graphCtaPill, isDark ? styles.darkGraphCta : styles.lightGraphCta]}
            onPress={() => toggleViewMode('chart')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="bar-chart-outline"
              size={13}
              color={isDark ? '#38bdf8' : '#0284c7'}
            />
            <Text style={[styles.graphCtaText, isDark && styles.darkGraphCtaText]}>
              Show in graph view
            </Text>
            <Ionicons
              name="chevron-forward"
              size={12}
              color={isDark ? '#38bdf8' : '#0284c7'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Graph View (Shown when clicked) */}
      {viewMode === 'chart' && (
        <View style={[styles.chartCard, isDark ? styles.darkChartCard : styles.lightChartCard]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, isDark && styles.darkText]}>
                Wash Activity Trend
              </Text>
              <Text style={[styles.chartSub, isDark && styles.darkSubtext]}>
                Completed washes in last 6 months
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.switchBackBtn, isDark && styles.darkSwitchBackBtn]}
              onPress={() => toggleViewMode('cards')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid-outline"
                size={11}
                color={isDark ? '#38bdf8' : '#0284c7'}
              />
              <Text style={[styles.switchBackText, isDark && styles.darkSwitchBackText]}>
                Cards View
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bar Chart Graphics */}
          <View style={styles.barsContainer}>
            {chartData.map((item, idx) => {
              const barHeightPct = Math.max(12, Math.min(100, Math.round((item.completed / maxVal) * 100)));
              const isLatest = idx === chartData.length - 1;

              return (
                <View key={item.month + idx} style={styles.barCol}>
                  {/* Value tag above bar */}
                  <Text
                    style={[
                      styles.barValueText,
                      isDark && styles.darkBarValueText,
                      item.completed > 0 && (isDark ? styles.activeBarValDark : styles.activeBarValLight),
                    ]}
                  >
                    {item.completed > 0 ? item.completed : '0'}
                  </Text>

                  {/* Bar track and fill */}
                  <View style={[styles.barTrack, isDark && styles.darkBarTrack]}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${barHeightPct}%` },
                        item.completed > 0
                          ? isLatest
                            ? styles.barFillLatest
                            : styles.barFillActive
                          : isDark
                          ? styles.barFillEmptyDark
                          : styles.barFillEmptyLight,
                      ]}
                    />
                  </View>

                  {/* Month Label */}
                  <Text
                    style={[
                      styles.monthLabel,
                      isDark && styles.darkSubtext,
                      isLatest && styles.latestMonthLabel,
                    ]}
                  >
                    {item.month}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Summary Footer */}
          <View style={[styles.chartFooter, isDark && styles.darkChartFooter]}>
            <View style={styles.footerStat}>
              <Text style={[styles.footerStatVal, isDark && styles.darkText]}>
                {totalWashes}
              </Text>
              <Text style={[styles.footerStatLabel, isDark && styles.darkSubtext]}>
                Lifetime Washes
              </Text>
            </View>
            <View style={[styles.footerDivider, isDark && styles.darkDivider]} />
            <View style={styles.footerStat}>
              <Text style={[styles.footerStatVal, { color: '#10b981' }]}>
                ₹{earningMoney}
              </Text>
              <Text style={[styles.footerStatLabel, isDark && styles.darkSubtext]}>
                Rewards Earned
              </Text>
            </View>
            <View style={[styles.footerDivider, isDark && styles.darkDivider]} />
            <View style={styles.footerStat}>
              <Text style={[styles.footerStatVal, { color: '#f59e0b' }]}>
                {ePoints} pts
              </Text>
              <Text style={[styles.footerStatLabel, isDark && styles.darkSubtext]}>
                Available Coins
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  darkSegment: {
    backgroundColor: '#1e293b',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeModeLight: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  activeModeDark: {
    backgroundColor: '#334155',
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  activeModeTextLight: {
    color: '#0284c7',
    fontWeight: '700',
  },
  activeModeTextDark: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  card: {
    width: '48.5%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  lightCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  darkCard: {
    backgroundColor: '#0d1527',
    borderColor: '#1e293b',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardEmoji: {
    fontSize: 16,
  },
  redBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  diagonalArrow: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  darkArrow: {
    color: '#64748b',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  darkValueText: {
    color: '#f8fafc',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  darkLabelText: {
    color: '#94a3b8',
  },
  graphCtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    marginTop: 2,
  },
  lightGraphCta: {
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
    borderColor: 'rgba(2, 132, 199, 0.15)',
  },
  darkGraphCta: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.18)',
  },
  graphCtaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  darkGraphCtaText: {
    color: '#38bdf8',
  },
  chartCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  lightChartCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  darkChartCard: {
    backgroundColor: '#0d1527',
    borderColor: '#1e293b',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  chartSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  switchBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  darkSwitchBackBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  switchBackText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  darkSwitchBackText: {
    color: '#38bdf8',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingTop: 8,
    paddingBottom: 4,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  darkBarValueText: {
    color: '#475569',
  },
  activeBarValLight: {
    color: '#0284c7',
    fontWeight: '700',
  },
  activeBarValDark: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  barTrack: {
    width: 14,
    height: 64,
    backgroundColor: '#f1f5f9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  darkBarTrack: {
    backgroundColor: '#1e293b',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barFillActive: {
    backgroundColor: '#38bdf8',
  },
  barFillLatest: {
    backgroundColor: '#0284c7',
  },
  barFillEmptyLight: {
    backgroundColor: '#e2e8f0',
  },
  barFillEmptyDark: {
    backgroundColor: '#334155',
  },
  monthLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 6,
  },
  latestMonthLabel: {
    fontWeight: '700',
    color: '#0284c7',
  },
  chartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  darkChartFooter: {
    borderTopColor: '#1e293b',
  },
  footerStat: {
    alignItems: 'center',
    flex: 1,
  },
  footerStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  footerStatLabel: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
  footerDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#e2e8f0',
  },
  darkDivider: {
    backgroundColor: '#1e293b',
  },
  darkText: {
    color: '#f8fafc',
  },
  darkSubtext: {
    color: '#94a3b8',
  },
});
