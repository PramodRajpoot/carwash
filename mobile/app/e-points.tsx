import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '../constants/api';
import AppFooter, { FooterTab } from '../components/AppFooter';
import DashboardHeader from '../components/DashboardHeader';

interface WalletBalance {
  earning_money?: number | string;
  e_points?: number | string;
  referral_count?: number | string;
}

interface WalletTransaction {
  id: number;
  description: string;
  amount: number | string;
  type?: 'credit' | 'debit';
  status?: string;
  created_at?: string;
  source?: string;
}

interface BankDetails {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  upi_id: string;
}

export default function EPointsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;

  const [isDark, setIsDark] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingBank, setSavingBank] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab>('home');
  const [walletTab, setWalletTab] = useState<'bank' | 'history'>('bank');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [user, setUser] = useState<any>({ name: 'User' });
  const [balance, setBalance] = useState<WalletBalance>({});
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [redeemAmount, setRedeemAmount] = useState('2000');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
  });

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

  const loadWalletData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const [balanceRes, historyRes, bankRes] = await Promise.all([
        axios.get(`${API_BASE}/api/wallet/balance`, { headers }),
        axios.get(`${API_BASE}/api/wallet/history`, { headers }),
        axios.get(`${API_BASE}/api/wallet/bank-details`, { headers }),
      ]);

      setBalance(balanceRes.data || {});
      setTransactions(historyRes.data?.data || []);

      if (bankRes.data) {
        setBankDetails({
          account_holder_name: bankRes.data.account_holder_name || '',
          bank_name: bankRes.data.bank_name || '',
          account_number: bankRes.data.account_number || '',
          ifsc_code: bankRes.data.ifsc_code || '',
          upi_id: bankRes.data.upi_id || '',
        });
      }
    } catch (error) {
      console.log('Wallet load error:', error);
      setBalance({ earning_money: 0, e_points: 0, referral_count: 0 });
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    syncTheme();
    syncUser();
    loadWalletData();
  }, [loadWalletData, syncTheme, syncUser]);

  useFocusEffect(
    useCallback(() => {
      syncTheme();
      syncUser();
      loadWalletData();
    }, [loadWalletData, syncTheme, syncUser])
  );

  const formatCurrency = (value: number | string | undefined) => {
    const numericValue = Number(value || 0);
    return `₹${numericValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const hasBankDetails = Boolean(
    (bankDetails.account_number && bankDetails.ifsc_code) || bankDetails.upi_id
  );

  const earningMoney = Number(balance.earning_money || 0);
  const confirmedEPoints = Number(balance.e_points || 0);
  const referralCount = Number(balance.referral_count || 0);
  const minWithdrawal = 2000;
  const withdrawalProgress = Math.min((earningMoney / minWithdrawal) * 100, 100);

  const handleFooterTabPress = (tab: FooterTab) => {
    setActiveFooterTab(tab);

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
      router.replace('/dashboard');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
  };

  const updateBankField = (field: keyof BankDetails, value: string) => {
    setBankDetails((prev) => ({ ...prev, [field]: value }));
  };

  const saveBankDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Session expired', 'Please log in again to update your bank details.');
        router.replace('/login');
        return;
      }

      setSavingBank(true);
      await axios.post(
        `${API_BASE}/api/wallet/bank-details`,
        bankDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true',
          },
        }
      );

      Alert.alert('Success', 'Bank details saved successfully.');
      await loadWalletData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save bank details.');
    } finally {
      setSavingBank(false);
    }
  };

  const requestWithdrawal = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Session expired', 'Please log in again to continue.');
        router.replace('/login');
        return;
      }

      if (!hasBankDetails) {
        Alert.alert('Bank details missing', 'Please save your bank or UPI details first.');
        return;
      }

      const amount = Number(redeemAmount);
      if (!Number.isFinite(amount) || amount < minWithdrawal || amount > earningMoney) {
        Alert.alert('Invalid amount', 'Minimum withdrawal is ₹2,000.00 and cannot exceed your current balance.');
        return;
      }

      setRedeeming(true);
      await axios.post(
        `${API_BASE}/api/wallet/withdraw`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true',
          },
        }
      );

      Alert.alert('Success', 'Withdrawal request submitted successfully.');
      setRedeemAmount('2000');
      await loadWalletData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Withdrawal request failed.');
    } finally {
      setRedeeming(false);
    }
  };

  const renderStatCard = (
    title: string,
    value: string,
    tone: 'emerald' | 'amber' | 'cyan',
    icon: string
  ) => {
    const palette = {
      emerald: {
        border: '#10b981',
        iconBg: 'rgba(16, 185, 129, 0.12)',
        iconColor: '#10b981',
        valueColor: '#10b981',
      },
      amber: {
        border: '#f59e0b',
        iconBg: 'rgba(245, 158, 11, 0.12)',
        iconColor: '#f59e0b',
        valueColor: '#f59e0b',
      },
      cyan: {
        border: '#06b6d4',
        iconBg: 'rgba(6, 182, 212, 0.12)',
        iconColor: '#06b6d4',
        valueColor: '#06b6d4',
      },
    }[tone];

    return (
      <View
        key={title}
        style={[styles.statCard, { borderColor: palette.border }, isDark && styles.darkCard]}
      >
        <View style={[styles.statIcon, { backgroundColor: palette.iconBg, borderColor: palette.border }]}>
          <Text style={[styles.statIconText, { color: palette.iconColor }]}>{icon}</Text>
        </View>
        <Text style={[styles.statValue, { color: palette.valueColor }]}>{value}</Text>
        <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>{title}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.page, isDark && styles.darkPage]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <DashboardHeader
          user={user}
          title="E-Points Wallet"
          subtitle="Rewards & payouts"
          isDark={isDark}
        />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={isDark ? '#f8fafc' : '#0284c7'} />
          <Text style={[styles.loaderText, isDark && styles.darkSubtext]}>Loading wallet...</Text>
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
        title="E-Points Wallet"
        subtitle="Rewards & payouts"
        isDark={isDark}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + topPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0284c7']}
            tintColor={isDark ? '#f8fafc' : '#0284c7'}
          />
        }
      >
        <View style={styles.gridRow}>
          {renderStatCard('Earning Money', formatCurrency(earningMoney), 'emerald', '💰')}
          {renderStatCard('Confirmed E-Points', `${confirmedEPoints} pts`, 'amber', '✅')}
          {renderStatCard('Referred Users', String(referralCount), 'cyan', '👥')}
        </View>

        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Withdraw Earning Money</Text>
          <Text style={[styles.helperText, isDark && styles.darkSubtext]}>
            Request a withdrawal of your Earning Money to your bank account.
          </Text>

          {!hasBankDetails && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>Please save your bank details first before requesting a withdrawal.</Text>
            </View>
          )}

          <Text style={[styles.mutedText, isDark && styles.darkSubtext]}>
            Minimum <Text style={styles.highlightText}>₹2,000.00</Text> required to withdraw.
          </Text>

          <View style={[styles.progressTrack, isDark && styles.darkProgressTrack]}>
            <View
              style={[
                styles.progressFill,
                { width: `${withdrawalProgress}%` },
                earningMoney >= minWithdrawal ? styles.progressFillReady : styles.progressFillWarning,
              ]}
            />
          </View>

          <View style={styles.progressMeta}>
            <Text style={[styles.progressMetaText, isDark && styles.darkSubtext]}>{formatCurrency(earningMoney)}</Text>
            <Text style={[styles.progressMetaText, isDark && styles.darkSubtext]}>{formatCurrency(minWithdrawal)}</Text>
          </View>

          {earningMoney >= minWithdrawal ? (
            <View style={styles.withdrawRow}>
              <View style={styles.amountInputWrap}>
                <Text style={[styles.fieldLabel, isDark && styles.darkSubtext]}>Amount to Withdraw (₹)</Text>
                <TextInput
                  value={redeemAmount}
                  onChangeText={setRedeemAmount}
                  keyboardType="numeric"
                  placeholder="2000"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[styles.input, isDark && styles.darkInput]}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.primaryButton, styles.withdrawButton, redeeming && styles.disabledButton]}
                onPress={requestWithdrawal}
                disabled={redeeming || !hasBankDetails}
              >
                <Text style={styles.primaryButtonText}>{redeeming ? 'Requesting…' : 'Withdraw'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.mutedText, isDark && styles.darkSubtext]}>
              You need {formatCurrency(minWithdrawal - earningMoney)} more to unlock withdrawals.
            </Text>
          )}
        </View>

        <View style={[styles.card, isDark && styles.darkCard]}>
          <View style={styles.segmentedTabs}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setWalletTab('bank')}
              style={[
                styles.tabButton,
                walletTab === 'bank' ? styles.tabButtonActive : styles.tabButtonInactive,
                isDark && (walletTab === 'bank' ? styles.darkTabButtonActive : styles.darkTabButtonInactive),
              ]}
            >
              <Text style={[
                styles.tabButtonText,
                walletTab === 'bank' ? styles.tabButtonTextActive : styles.tabButtonTextInactive,
              ]}>
                Bank Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setWalletTab('history')}
              style={[
                styles.tabButton,
                walletTab === 'history' ? styles.tabButtonActive : styles.tabButtonInactive,
                isDark && (walletTab === 'history' ? styles.darkTabButtonActive : styles.darkTabButtonInactive),
              ]}
            >
              <Text style={[
                styles.tabButtonText,
                walletTab === 'history' ? styles.tabButtonTextActive : styles.tabButtonTextInactive,
              ]}>
                Transaction History
              </Text>
            </TouchableOpacity>
          </View>

          {walletTab === 'bank' ? (
            <View style={styles.tabContent}>
              <Text style={[styles.helperText, isDark && styles.darkSubtext]}>
                Add your bank details or UPI ID to receive payouts.
              </Text>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, isDark && styles.darkSubtext]}>Account Holder Name</Text>
                <TextInput
                  value={bankDetails.account_holder_name}
                  onChangeText={(value) => updateBankField('account_holder_name', value)}
                  placeholder="Name as per bank account"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[styles.input, isDark && styles.darkInput]}
                />
              </View>

              <View style={styles.inlineGrid}>
                <View style={styles.fieldWrapHalf}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext]}>Bank Name</Text>
                  <TextInput
                    value={bankDetails.bank_name}
                    onChangeText={(value) => updateBankField('bank_name', value)}
                    placeholder="e.g. HDFC Bank"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    style={[styles.input, isDark && styles.darkInput]}
                  />
                </View>

                <View style={styles.fieldWrapHalf}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext]}>IFSC Code</Text>
                  <TextInput
                    value={bankDetails.ifsc_code}
                    onChangeText={(value) => updateBankField('ifsc_code', value)}
                    placeholder="IFSC Code"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    style={[styles.input, isDark && styles.darkInput]}
                  />
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, isDark && styles.darkSubtext]}>Account Number</Text>
                <TextInput
                  value={bankDetails.account_number}
                  onChangeText={(value) => updateBankField('account_number', value)}
                  placeholder="Account Number"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[styles.input, isDark && styles.darkInput]}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, isDark && styles.darkSubtext]}>UPI ID (Optional)</Text>
                <TextInput
                  value={bankDetails.upi_id}
                  onChangeText={(value) => updateBankField('upi_id', value)}
                  placeholder="yourname@upi"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[styles.input, isDark && styles.darkInput]}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.primaryButton, savingBank && styles.disabledButton]}
                onPress={saveBankDetails}
                disabled={savingBank}
              >
                <Text style={styles.primaryButtonText}>
                  {savingBank ? 'Saving...' : 'Save Bank Details'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tabContent}>
              {transactions.length === 0 ? (
                <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>No transactions yet.</Text>
              ) : (
                <>
                  {transactions
                    .slice(0, showAllTransactions ? transactions.length : 1)
                    .map((item) => {
                      const isCredit = item.type === 'credit';
                      const amountDisplay = item.source && (item.source.includes('earning') || item.source === 'referral_commission')
                        ? formatCurrency(item.amount)
                        : `${item.amount} pts`;

                      return (
                        <View key={item.id} style={styles.transactionRow}>
                          <View style={styles.transactionMeta}>
                            <Text style={[styles.transactionTitle, isDark && styles.darkText]}>{item.description}</Text>
                            <View style={styles.transactionFootRow}>
                              <View
                                style={[
                                  styles.badge,
                                  item.status === 'confirmed' || item.status === 'completed'
                                    ? styles.badgeSuccess
                                    : item.status === 'failed' || item.status === 'rejected'
                                      ? styles.badgeDanger
                                      : styles.badgeWarning,
                                ]}
                              >
                                <Text style={styles.badgeText}>{item.status || 'pending'}</Text>
                              </View>
                              <Text style={[styles.transactionDate, isDark && styles.darkSubtext]}>{formatDate(item.created_at)}</Text>
                            </View>
                          </View>

                          <Text style={[styles.transactionAmount, { color: isCredit ? '#10b981' : '#ef4444' }]}>
                            {isCredit ? '+' : '-'}{amountDisplay}
                          </Text>
                        </View>
                      );
                    })}

                  {transactions.length > 1 && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowAllTransactions((prev) => !prev)}
                      style={styles.showMoreButton}
                    >
                      <Text style={[styles.showMoreText, isDark && styles.darkSubtext]}>
                        {showAllTransactions ? 'Show Less' : 'Show More'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <AppFooter activeTab={activeFooterTab} isDark={isDark} onTabPress={handleFooterTabPress} />
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
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#ffffff',
    marginBottom: 4,
  },
  darkCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  statIconText: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  segmentedTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  darkTabButtonActive: {
    backgroundColor: '#0f172a',
  },
  darkTabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabButtonTextActive: {
    color: '#0f172a',
  },
  tabButtonTextInactive: {
    color: '#64748b',
  },
  tabContent: {
    overflow: 'hidden',
  },
  showMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  showMoreText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 18,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldWrapHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbe1ea',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
  },
  darkInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    color: '#f8fafc',
  },
  inlineGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  withdrawButton: {
    flex: 1,
    minWidth: 120,
    marginTop: 18,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  warningText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  mutedText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    marginBottom: 10,
  },
  highlightText: {
    color: '#0ea5e9',
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  darkProgressTrack: {
    backgroundColor: '#1f2937',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFillReady: {
    backgroundColor: '#10b981',
  },
  progressFillWarning: {
    backgroundColor: '#f97316',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  withdrawRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  amountInputWrap: {
    flex: 1,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 18,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  transactionMeta: {
    flex: 1,
    paddingRight: 12,
  },
  transactionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  transactionFootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  badgeText: {
    color: '#0f172a',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: 11,
    color: '#64748b',
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '700',
  },
  darkText: {
    color: '#f8fafc',
  },
  darkSubtext: {
    color: '#cbd5e1',
  },
});
