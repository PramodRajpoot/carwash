import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '../constants/api';
import AppFooter, { FooterTab } from '../components/AppFooter';
import DashboardHeader from '../components/DashboardHeader';
import { safeHapticLight, safeHapticMedium, safeHapticSuccess } from '../utils/haptics';
import { showSweetAlert } from '../utils/sweetAlert';

export interface NotificationItem {
  id: number;
  user_id?: number;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  updated_at?: string;
}

type FilterType = 'all' | 'unread';

interface TypeConfig {
  emoji: string;
  iconName: keyof typeof Ionicons.glyphMap;
  badgeBgLight: string;
  badgeBgDark: string;
  badgeColor: string;
  borderColor: string;
  actionRoute?: string;
  actionLabel?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;

  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [user, setUser] = useState<any>({ name: 'User' });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleToggleTheme = useCallback(async () => {
    const nextTheme = !isDark ? 'dark' : 'light';
    setIsDark(nextTheme === 'dark');
    await AsyncStorage.setItem('app_theme', nextTheme);
  }, [isDark]);

  // Fetch notifications from backend API
  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const responseData = response.data;
      const list: NotificationItem[] = Array.isArray(responseData?.notifications?.data)
        ? responseData.notifications.data
        : Array.isArray(responseData?.notifications)
        ? responseData.notifications
        : [];

      setNotifications(list);

      const unread =
        typeof responseData?.unread_count === 'number'
          ? responseData.unread_count
          : list.filter((n) => !n.read_at).length;
      setUnreadCount(unread);
    } catch (error) {
      console.log('Notifications load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const init = async () => {
        try {
          const storedTheme = await AsyncStorage.getItem('app_theme');
          if (isMounted) {
            setIsDark(storedTheme === 'dark');
          }

          const userData = await AsyncStorage.getItem('userData');
          if (isMounted && userData) {
            try {
              const parsed = JSON.parse(userData);
              setUser(parsed || { name: 'User' });
            } catch {
              setUser({ name: 'User' });
            }
          }

          await loadNotifications();
        } catch (error) {
          console.log('Notification focus error:', error);
        }
      };

      init();

      return () => {
        isMounted = false;
      };
    }, [loadNotifications])
  );

  // Mark single notification as read
  const handleMarkAsRead = async (item: NotificationItem) => {
    safeHapticLight();

    // If already read, perform navigation if applicable
    if (item.read_at) {
      handleNotificationAction(item);
      return;
    }

    // Optimistically mark as read
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read_at: nowIso } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await axios.post(
          `${API_BASE}/api/notifications/${item.id}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Bypass-Tunnel-Reminder': 'true',
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );
      }
    } catch (error) {
      console.log('Mark read error:', error);
    }

    handleNotificationAction(item);
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    safeHapticMedium();
    setMarkingAll(true);

    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || nowIso }))
    );
    setUnreadCount(0);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await axios.post(
          `${API_BASE}/api/notifications/read-all`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Bypass-Tunnel-Reminder': 'true',
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );
      }
      safeHapticSuccess();
      showSweetAlert('All Read', 'All notifications have been marked as read.', 'success');
    } catch (error) {
      console.log('Mark all read error:', error);
      showSweetAlert('Notice', 'Unable to mark all as read right now.', 'warning');
      loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  // Contextual deep navigation when tapping notification
  const handleNotificationAction = (item: NotificationItem) => {
    const config = getTypeConfig(item.type);
    if (config.actionRoute) {
      router.push(config.actionRoute as any);
    }
  };

  // Footer tab press handling
  const handleFooterTabPress = (tab: FooterTab) => {
    if (tab === 'home') {
      router.replace('/dashboard');
      return;
    }
    if (tab === 'garage') {
      router.push('/garage');
      return;
    }
    if (tab === 'book') {
      router.push('/bookings');
      return;
    }
    if (tab === 'support') {
      router.push('/support');
      return;
    }
    if (tab === 'notifications') {
      loadNotifications(true);
    }
  };

  // Back button handling
  const handleGoBack = () => {
    safeHapticLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/dashboard');
    }
  };

  // Notification type visual configuration mapping
  const getTypeConfig = (type: string): TypeConfig => {
    switch (type) {
      case 'booking_confirmed':
        return {
          emoji: '📦',
          iconName: 'cube-outline',
          badgeBgLight: '#e0f2fe',
          badgeBgDark: 'rgba(2, 132, 199, 0.2)',
          badgeColor: '#0284c7',
          borderColor: '#38bdf8',
          actionRoute: '/bookings',
          actionLabel: 'View Booking',
        };
      case 'service_reminder':
        return {
          emoji: '⏰',
          iconName: 'alarm-outline',
          badgeBgLight: '#fef3c7',
          badgeBgDark: 'rgba(217, 119, 6, 0.2)',
          badgeColor: '#d97706',
          borderColor: '#fbbf24',
          actionRoute: '/bookings',
          actionLabel: 'Check Schedule',
        };
      case 'subscription_expiry':
        return {
          emoji: '📋',
          iconName: 'card-outline',
          badgeBgLight: '#f3e8ff',
          badgeBgDark: 'rgba(147, 51, 234, 0.2)',
          badgeColor: '#9333ea',
          borderColor: '#c084fc',
          actionRoute: '/subscriptions',
          actionLabel: 'Manage Plan',
        };
      case 'referral_reward':
        return {
          emoji: '🎁',
          iconName: 'gift-outline',
          badgeBgLight: '#dcfce7',
          badgeBgDark: 'rgba(22, 163, 74, 0.2)',
          badgeColor: '#16a34a',
          borderColor: '#4ade80',
          actionRoute: '/refer-and-earn',
          actionLabel: 'View Rewards',
        };
      case 'wallet_credit':
        return {
          emoji: '💰',
          iconName: 'wallet-outline',
          badgeBgLight: '#ccfbf1',
          badgeBgDark: 'rgba(13, 148, 136, 0.2)',
          badgeColor: '#0d9488',
          borderColor: '#2dd4bf',
          actionRoute: '/e-points',
          actionLabel: 'View Wallet',
        };
      case 'coupon':
        return {
          emoji: '🎟️',
          iconName: 'pricetag-outline',
          badgeBgLight: '#ffe4e6',
          badgeBgDark: 'rgba(225, 29, 72, 0.2)',
          badgeColor: '#e11d48',
          borderColor: '#fb7185',
          actionRoute: '/offer',
          actionLabel: 'View Offers',
        };
      case 'royalty_due':
        return {
          emoji: '💳',
          iconName: 'receipt-outline',
          badgeBgLight: '#e0e7ff',
          badgeBgDark: 'rgba(79, 70, 229, 0.2)',
          badgeColor: '#4f46e5',
          borderColor: '#818cf8',
          actionRoute: '/e-points',
          actionLabel: 'View Statement',
        };
      default:
        return {
          emoji: '🔔',
          iconName: 'notifications-outline',
          badgeBgLight: '#f1f5f9',
          badgeBgDark: 'rgba(100, 116, 139, 0.2)',
          badgeColor: '#64748b',
          borderColor: '#94a3b8',
        };
    }
  };

  // Formatter matching web reference
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Friendly relative time helper
  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const now = new Date().getTime();
      const time = new Date(dateStr).getTime();
      const diffSecs = Math.floor((now - time) / 1000);

      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return '';
    } catch {
      return '';
    }
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'unread') {
      return notifications.filter((n) => !n.read_at);
    }
    return notifications;
  }, [notifications, activeFilter]);

  return (
    <SafeAreaView style={[styles.page, isDark && styles.darkPage]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Shared Dashboard Header for Brand, Dark Mode, Profile */}
      <DashboardHeader
        user={user}
        title="Notifications"
        subtitle="Updates & alerts"
        unreadCount={unreadCount}
        isDark={isDark}
        showLocation={false}
        onToggleTheme={handleToggleTheme}
        onProfilePress={() => router.push('/profile')}
      />

      {/* Screen Navigation & Action Bar */}
      <View style={[styles.actionBar, isDark && styles.darkActionBar]}>
        <View style={styles.actionLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.backBtn, isDark && styles.darkBackBtn]}
            onPress={handleGoBack}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDark ? '#f8fafc' : '#1e293b'}
            />
          </TouchableOpacity>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.barTitle, isDark && styles.darkBarTitle]}>
                Inbox
              </Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount} new
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.barSubtitle, isDark && styles.darkSubtext]}>
              {notifications.length} total notification{notifications.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.markAllBtn, markingAll && styles.markAllBtnDisabled]}
            onPress={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color="#0284c7" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={15} color="#0284c7" style={{ marginRight: 4 }} />
                <Text style={styles.markAllText}>Mark all read</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, isDark && styles.darkFilterBar]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.filterPill,
            activeFilter === 'all' && (isDark ? styles.activePillDark : styles.activePillLight),
          ]}
          onPress={() => {
            safeHapticLight();
            setActiveFilter('all');
          }}
        >
          <Text
            style={[
              styles.filterText,
              isDark && styles.darkSubtext,
              activeFilter === 'all' && (isDark ? styles.activeFilterTextDark : styles.activeFilterTextLight),
            ]}
          >
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.filterPill,
            activeFilter === 'unread' && (isDark ? styles.activePillDark : styles.activePillLight),
          ]}
          onPress={() => {
            safeHapticLight();
            setActiveFilter('unread');
          }}
        >
          <Text
            style={[
              styles.filterText,
              isDark && styles.darkSubtext,
              activeFilter === 'unread' && (isDark ? styles.activeFilterTextDark : styles.activeFilterTextLight),
            ]}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification Body / List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + topPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNotifications(true)}
            colors={['#0284c7', '#e11d48']}
            tintColor={isDark ? '#38bdf8' : '#0284c7'}
          />
        }
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={isDark ? '#38bdf8' : '#0284c7'} />
            <Text style={[styles.loaderText, isDark && styles.darkSubtext]}>
              Loading notifications...
            </Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={[styles.emptyCard, isDark && styles.darkCard]}>
            <Text style={styles.emptyEmoji}>🔕</Text>
            <Text style={[styles.emptyTitle, isDark && styles.darkText]}>
              {activeFilter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </Text>
            <Text style={[styles.emptyMessage, isDark && styles.darkSubtext]}>
              {activeFilter === 'unread'
                ? 'You have read all your notifications.'
                : "We'll let you know about booking updates, special offers, and wallet credits here."}
            </Text>
            {activeFilter === 'unread' && notifications.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.viewAllBtn}
                onPress={() => setActiveFilter('all')}
              >
                <Text style={styles.viewAllBtnText}>View All Notifications</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredNotifications.map((item) => {
              const config = getTypeConfig(item.type);
              const isUnread = !item.read_at;
              const relTime = getRelativeTime(item.created_at);

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={[
                    styles.notificationCard,
                    isDark ? styles.notificationCardDark : styles.notificationCardLight,
                    isUnread && (isDark ? styles.unreadCardDark : styles.unreadCardLight),
                  ]}
                  onPress={() => handleMarkAsRead(item)}
                >
                  {/* Left Icon Badge with Emoji + Vector Icon */}
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: isDark ? config.badgeBgDark : config.badgeBgLight,
                        borderColor: isDark ? config.borderColor + '44' : config.borderColor + '33',
                      },
                    ]}
                  >
                    <Text style={styles.emojiText}>{config.emoji}</Text>
                  </View>

                  {/* Content Wrap */}
                  <View style={styles.itemBody}>
                    <View style={styles.itemHeaderRow}>
                      <Text
                        style={[
                          styles.itemTitle,
                          isDark ? styles.itemTitleDark : styles.itemTitleLight,
                          isUnread && styles.itemTitleUnread,
                        ]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      {isUnread && <View style={styles.unreadDot} />}
                    </View>

                    <Text
                      style={[
                        styles.itemMessage,
                        isDark ? styles.darkSubtext : styles.itemMessageLight,
                      ]}
                    >
                      {item.body}
                    </Text>

                    {/* Footer Row: Timestamp & Quick Action Link */}
                    <View style={styles.itemFooterRow}>
                      <View style={styles.timestampWrap}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={isDark ? '#64748b' : '#94a3b8'}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.itemDate, isDark && styles.darkDate]}>
                          {formatDate(item.created_at)}
                          {relTime ? ` • ${relTime}` : ''}
                        </Text>
                      </View>

                      {config.actionLabel && (
                        <View style={styles.actionChip}>
                          <Text style={[styles.actionChipText, { color: config.badgeColor }]}>
                            {config.actionLabel}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={12}
                            color={config.badgeColor}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Floating Navigation Footer */}
      <AppFooter
        activeTab="notifications"
        isDark={isDark}
        onTabPress={handleFooterTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkPage: {
    backgroundColor: '#0a0f1d',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Action / Title Bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  darkActionBar: {
    backgroundColor: '#111827',
    borderBottomColor: '#1f2937',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  darkBackBtn: {
    backgroundColor: '#1e293b',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  darkBarTitle: {
    color: '#f8fafc',
  },
  barSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  unreadBadge: {
    marginLeft: 8,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
  },
  markAllBtnDisabled: {
    opacity: 0.6,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  darkFilterBar: {
    backgroundColor: '#111827',
    borderBottomColor: '#1f2937',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  activePillLight: {
    backgroundColor: '#0f172a',
  },
  activePillDark: {
    backgroundColor: '#38bdf8',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  activeFilterTextLight: {
    color: '#ffffff',
  },
  activeFilterTextDark: {
    color: '#0a0f1d',
    fontWeight: '700',
  },

  // List & Cards
  listContainer: {
    gap: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  notificationCardDark: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },
  unreadCardLight: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
  },
  unreadCardDark: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },

  // Icon Badge
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  emojiText: {
    fontSize: 22,
  },

  // Item details
  itemBody: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    marginRight: 8,
  },
  itemTitleLight: {
    color: '#334155',
  },
  itemTitleDark: {
    color: '#cbd5e1',
  },
  itemTitleUnread: {
    fontWeight: '700',
    color: '#0f172a',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06b6d4',
    marginTop: 4,
    flexShrink: 0,
  },
  itemMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  itemMessageLight: {
    color: '#475569',
  },
  darkSubtext: {
    color: '#94a3b8',
  },
  darkText: {
    color: '#f8fafc',
  },

  // Timestamp & Action
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
  },
  timestampWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  darkDate: {
    color: '#64748b',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },

  // Loader & Empty
  loaderWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 20,
  },
  darkCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  viewAllBtn: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
  },
  viewAllBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
});
