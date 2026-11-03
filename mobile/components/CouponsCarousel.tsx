import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeHapticSuccess, safeHapticMedium } from '../utils/haptics';

interface Props {
  isDark?: boolean;
  coupons?: any[];
  referralCode?: string;
  onCopySuccess?: (code: string) => void;
}

export default function CouponsCarousel({
  isDark = false,
  coupons = [],
  referralCode,
  onCopySuccess,
}: Props) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    safeHapticSuccess();
    setCopiedCode(code);
    onCopySuccess?.(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const handleShareReferral = async () => {
    if (!referralCode) return;
    safeHapticMedium();
    try {
      await Share.share({
        message: `Use my CleanAtDoorstep referral code "${referralCode}" to get an exclusive discount on your car wash!`,
      });
    } catch {}
  };

  if (!coupons.length && !referralCode) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
          SPECIAL OFFERS & REWARDS
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Referral Card in Carousel */}
        {referralCode && (
          <View
            style={[
              styles.ticketCard,
              isDark ? styles.darkReferralCard : styles.referralCard,
              isDark && styles.darkTicketCardBorder,
            ]}
          >
            <View style={styles.tagRow}>
              <View style={styles.referralTag}>
                <Ionicons name="gift-outline" size={10} color="#a855f7" />
                <Text style={styles.referralTagText}>REFERRAL CODE</Text>
              </View>
              <Text style={styles.commissionText}>Earn 10%</Text>
            </View>

            <Text style={styles.referralCodeText}>{referralCode}</Text>
            <Text
              style={[styles.referralDesc, isDark && styles.darkCouponDesc]}
              numberOfLines={1}
            >
              Share with friends & earn
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.copyBtn,
                  isDark && styles.darkCopyBtn,
                  copiedCode === referralCode && styles.copiedBtn,
                ]}
                onPress={() => handleCopy(referralCode)}
              >
                <Text
                  style={[
                    styles.copyBtnText,
                    isDark && styles.darkCopyBtnText,
                    copiedCode === referralCode && styles.copiedBtnText,
                  ]}
                >
                  {copiedCode === referralCode ? '✓ Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.shareIconBtn}
                onPress={handleShareReferral}
              >
                <Ionicons
                  name="share-social-outline"
                  size={13}
                  color="#a855f7"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Coupons */}
        {coupons.map((c) => {
          const discountStr =
            c.discount_type === 'percentage'
              ? `${c.discount_value}% OFF`
              : `₹${c.discount_value} OFF`;
          const isCopied = copiedCode === c.code;

          return (
            <View
              key={c.id}
              style={[styles.ticketCard, isDark && styles.darkTicketCard]}
            >
              <View style={styles.tagRow}>
                <View
                  style={[styles.couponTag, isDark && styles.darkCouponTag]}
                >
                  <Text
                    style={[
                      styles.couponTagText,
                      isDark && styles.darkCouponTagText,
                    ]}
                  >
                    PROMO VOUCHER
                  </Text>
                </View>
                <Text style={styles.discountBadge}>{discountStr}</Text>
              </View>

              <Text
                style={[
                  styles.couponCodeText,
                  isDark && styles.darkCouponCodeText,
                ]}
              >
                {c.code}
              </Text>
              <Text
                style={[styles.couponDesc, isDark && styles.darkCouponDesc]}
              >
                Instant discount on doorstep service
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.copyBtn,
                  isDark && styles.darkCopyBtn,
                  isCopied && styles.copiedBtn,
                ]}
                onPress={() => handleCopy(c.code)}
              >
                <Text
                  style={[
                    styles.copyBtnText,
                    isDark && styles.darkCopyBtnText,
                    isCopied && styles.copiedBtnText,
                  ]}
                >
                  {isCopied ? '✓ Code Copied' : 'Copy Code'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionHead: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  darkSectionTitle: {
    color: '#94a3b8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  ticketCard: {
    width: 190,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  darkTicketCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },
  darkTicketCardBorder: {
    borderColor: '#4c1d95',
  },
  referralCard: {
    backgroundColor: '#faf5ff',
    borderColor: '#d8b4fe',
  },
  darkReferralCard: {
    backgroundColor: '#18122B',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  couponTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  couponTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },
  referralTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  referralTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#7c3aed',
    letterSpacing: 0.4,
  },
  discountBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  commissionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c3aed',
  },
  couponCodeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0284c7',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  referralCodeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7c3aed',
    letterSpacing: 1.0,
    marginBottom: 2,
  },
  couponDesc: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  referralDesc: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyBtn: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    paddingVertical: 5.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  copiedBtn: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  copyBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0284c7',
  },
  copiedBtnText: {
    color: '#ffffff',
  },
  shareIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  darkCouponTag: {
    backgroundColor: '#1e293b',
  },
  darkCouponTagText: {
    color: '#cbd5e1',
  },
  darkCouponCodeText: {
    color: '#38bdf8',
  },
  darkCouponDesc: {
    color: '#94a3b8',
  },
  darkCopyBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  darkCopyBtnText: {
    color: '#38bdf8',
  },
});
