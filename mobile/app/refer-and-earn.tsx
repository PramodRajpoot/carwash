import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { API_BASE } from '../constants/api';
import AppFooter, { FooterTab } from '../components/AppFooter';
import DashboardHeader from '../components/DashboardHeader';
import { showSweetAlert } from '../utils/sweetAlert';

interface ReferredUser {
  id: number;
  name: string;
  created_at?: string;
  epoint_status?: string;
  completed_bookings?: number;
}

interface ReferralData {
  total_referrals?: number;
  confirmed_referrals?: number;
  pending_referrals?: number;
  e_points?: number;
  referral_code?: string;
  referred_users?: ReferredUser[];
}

const formatDate = (value?: string) => {
  if (!value) return 'N/A';

  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const buildShareText = (code?: string) =>
  `Join me on CleanAt Doorstep! Use my referral code ${code || 'CARWASH'} to get rewarded.`;

export default function ReferAndEarnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16) + 6;

  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>({ name: 'User' });
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [data, setData] = useState<ReferralData>({});

  const syncTheme = useCallback(async () => {
    const storedTheme = await AsyncStorage.getItem('app_theme');
    setIsDark(storedTheme === 'dark');
  }, []);

  const syncUser = useCallback(async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed || { name: 'User' });
      } catch {
        setUser({ name: 'User' });
      }
    }
  }, []);

  const handleToggleTheme = useCallback(async () => {
    const nextTheme = !isDark ? 'dark' : 'light';
    setIsDark(nextTheme === 'dark');
    await AsyncStorage.setItem('app_theme', nextTheme);
  }, [isDark]);

  const fetchReferralData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setData({});
        return;
      }

      const response = await axios.get(`${API_BASE}/api/customer/referrals`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      setData(response.data || {});
    } catch (error) {
      console.log('Referral fetch error:', error);
      setData({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncTheme();
    syncUser();
    fetchReferralData();
  }, [fetchReferralData, syncTheme, syncUser]);

  useFocusEffect(
    useCallback(() => {
      syncTheme();
      syncUser();
      fetchReferralData();
    }, [fetchReferralData, syncTheme, syncUser])
  );

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
      router.push('/book');
      return;
    }

    if (tab === 'support') {
      router.push('/support');
    }
  };

  const handleCopyCode = async () => {
    if (!data.referral_code) return;

    try {
      await Share.share({
        message: `My referral code: ${data.referral_code}. Use it to get rewards on CleanAt Doorstep!`,
        title: 'My Referral Code',
      });
      setCopied(true);
      showSweetAlert('Copied', 'Referral code is ready to share.', 'success');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      showSweetAlert('Copy failed', 'Unable to share your referral code right now.', 'error');
    }
  };

  const openShareLink = async (type: 'whatsapp' | 'facebook' | 'instagram') => {
    if (!data.referral_code) return;

    const shareMessage = encodeURIComponent(buildShareText(data.referral_code));

    try {
      if (type === 'whatsapp') {
        await Linking.openURL(`https://api.whatsapp.com/send?text=${shareMessage}`);
      }

      if (type === 'facebook') {
        await Linking.openURL(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            'https://carwash.local'
          )}&quote=${shareMessage}`
        );
      }

      if (type === 'instagram') {
        await Linking.openURL('https://www.instagram.com/');
      }
    } catch {
      showSweetAlert('Share failed', 'Unable to open the share link right now.', 'error');
    }
  };

  const referralUsers = data.referred_users || [];
  const visibleReferralUsers = expanded ? referralUsers : referralUsers.slice(0, 2);
  const referralDescription =
    'When a friend registers with your code: • Your friend gets a 10% discount and 50 E-Points bonus • You earn 10% of their first booking value in E-Points • Points are credited to you after their first completed service';
  const truncatedDescription = descriptionExpanded ? referralDescription : `${referralDescription.slice(0, 96)}...`;

  if (loading) {
    return (
      <SafeAreaView style={[styles.page, isDark && styles.darkPage]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <DashboardHeader
          user={user}
          title="Refer & Earn"
          subtitle="Invite friends"
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
        />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={isDark ? '#f8fafc' : '#0284c7'} />
          <Text style={[styles.loaderText, isDark && styles.darkSubtext]}>Loading referral details...</Text>
        </View>
        <AppFooter activeTab="home" isDark={isDark} onTabPress={handleFooterTabPress} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.page, isDark && styles.darkPage]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <DashboardHeader
        user={user}
        title="Refer & Earn"
        subtitle="Invite friends"
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, isDark && styles.darkStatCard]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                <Ionicons name="people-outline" size={18} color="#06b6d4" />
              </View>
              <Text style={[styles.statValue, isDark && styles.darkText]}>{data.total_referrals ?? 0}</Text>
            </View>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>Total Referrals</Text>
          </View>

          <View style={[styles.statCard, isDark && styles.darkStatCard, styles.successBorder]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="checkmark-done-outline" size={18} color="#10b981" />
              </View>
              <Text style={[styles.statValue, styles.successText]}>{data.confirmed_referrals ?? 0}</Text>
            </View>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>Confirmed</Text>
          </View>

          <View style={[styles.statCard, isDark && styles.darkStatCard, styles.warningBorder]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="time-outline" size={18} color="#ef4444" />
              </View>
              <Text style={[styles.statValue, styles.warningText]}>{data.pending_referrals ?? 0}</Text>
            </View>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>Pending</Text>
          </View>

          <View style={[styles.statCard, isDark && styles.darkStatCard]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="wallet-outline" size={18} color="#8b5cf6" />
              </View>
              <Text style={[styles.statValue, isDark && styles.darkText]}>{data.e_points ?? 0}</Text>
            </View>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>Earned E-Points</Text>
          </View>
        </View>

        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Your Referral Code</Text>

          <View style={[styles.codeBox, isDark && styles.darkCodeBox]}>
            <Text style={[styles.codeText, isDark && styles.darkText]}>{data.referral_code || 'N/A'}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
              onPress={handleCopyCode}
            >
              <Text style={[styles.copyBtnText, copied && styles.copyBtnTextSuccess]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.descriptionRow}>
            <Text style={[styles.helperText, isDark && styles.darkSubtext]}>
              {truncatedDescription}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDescriptionExpanded((prev) => !prev)}
              style={styles.readMoreBtn}
            >
              <Text style={[styles.readMoreText, isDark && styles.darkReadMoreText]}>
                {descriptionExpanded ? 'Read less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.shareSection}>
            <Text style={[styles.shareLabel, isDark && styles.darkText]}>Share via</Text>
            <View style={styles.shareRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.shareBtn, { backgroundColor: '#25D366' }]}
                onPress={() => openShareLink('whatsapp')}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                <Text style={styles.shareBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.shareBtn, { backgroundColor: '#1877F2' }]}
                onPress={() => openShareLink('facebook')}
              >
                <Ionicons name="logo-facebook" size={16} color="#fff" />
                <Text style={styles.shareBtnText}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.shareBtn, { backgroundColor: '#E1306C' }]}
                onPress={() => openShareLink('instagram')}
              >
                <Ionicons name="logo-instagram" size={16} color="#fff" />
                <Text style={styles.shareBtnText}>Instagram</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Referral Network</Text>

          {referralUsers.length === 0 ? (
            <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
              No referrals yet. Share your code and start earning!
            </Text>
          ) : (
            <>
              {visibleReferralUsers.map((userItem) => {
                const isConfirmed = String(userItem.epoint_status || '').toLowerCase() === 'confirmed';

                return (
                  <View key={userItem.id} style={[styles.userRow, isDark && styles.darkUserRow]}>
                    <View style={styles.userLeft}>
                      <View
                        style={[
                          styles.userAvatar,
                          { backgroundColor: isConfirmed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)' },
                        ]}
                      >
                        <Text style={{ color: isConfirmed ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                          {userItem.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>

                      <View>
                        <Text style={[styles.userName, isDark && styles.darkText]}>{userItem.name}</Text>
                        <Text style={[styles.userMeta, isDark && styles.darkSubtext]}>
                          Joined {formatDate(userItem.created_at)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.userRight}>
                      <View style={[styles.statusBadge, isConfirmed ? styles.activeBadge : styles.pendingBadge]}>
                        <Text style={[styles.statusBadgeText, isConfirmed ? styles.activeBadgeText : styles.pendingBadgeText]}>
                          {isConfirmed ? 'Confirmed' : 'Pending'}
                        </Text>
                      </View>
                      <Text style={[styles.bookingText, isDark && styles.darkSubtext]}>
                        {userItem.completed_bookings ?? 0} service{(userItem.completed_bookings ?? 0) === 1 ? '' : 's'} taken
                      </Text>
                    </View>
                  </View>
                );
              })}

              {referralUsers.length > 2 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.toggleBtn}
                  onPress={() => setExpanded((prev) => !prev)}
                >
                  <Text style={[styles.toggleText, isDark && styles.darkToggleText]}>
                    {expanded ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <AppFooter activeTab="home" isDark={isDark} onTabPress={handleFooterTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkPage: {
    backgroundColor: '#090d16',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 120,
  },
  loaderText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 4,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 74,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.01,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    justifyContent: 'flex-start',
  },
  darkStatCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  successBorder: {
    borderColor: '#86efac',
  },
  warningBorder: {
    borderColor: '#fca5a5',
  },
  successText: {
    color: '#10b981',
  },
  warningText: {
    color: '#ef4444',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 2,
  },
  statIcon: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 16,
    textAlign: 'right',
    marginTop: 1,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 7.5,
    color: '#64748b',
    lineHeight: 9,
    textAlign: 'left',
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  darkCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  darkText: {
    color: '#f8fafc',
  },
  darkSubtext: {
    color: '#94a3b8',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  darkCodeBox: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  codeText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 2,
  },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
  },
  copyBtnSuccess: {
    backgroundColor: '#dcfce7',
  },
  copyBtnText: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 12,
  },
  copyBtnTextSuccess: {
    color: '#166534',
  },
  descriptionRow: {
    marginTop: 12,
    width: '100%',
  },
  helperText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    width: '100%',
  },
  readMoreBtn: {
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  readMoreText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '700',
  },
  darkReadMoreText: {
    color: '#7dd3fc',
  },
  shareSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  shareLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 84,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  darkUserRow: {
    borderBottomColor: '#1e293b',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  userMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  userRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 4,
  },
  activeBadge: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeBadgeText: {
    color: '#10b981',
  },
  pendingBadgeText: {
    color: '#ef4444',
  },
  bookingText: {
    fontSize: 11,
    color: '#64748b',
  },
  toggleBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e0f2fe',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
  },
  darkToggleText: {
    color: '#7dd3fc',
  },
});
