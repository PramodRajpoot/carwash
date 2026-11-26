import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { safeHapticLight, safeHapticWarning } from '../utils/haptics';

interface WaterElectricityCardProps {
  value: boolean;
  onChange: (val: boolean) => void;
  onRequestWarning: () => void;
  isDark?: boolean;
}

export function WaterElectricityCard({
  value,
  onChange,
  onRequestWarning,
  isDark = false,
}: WaterElectricityCardProps) {
  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 20 }}>💧⚡</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.cardTitle, isDark && styles.textWhite]}>
            Do you have Water & Electricity available at your location?
          </Text>
          <Text style={[styles.cardSubtitle, isDark && styles.textMutedDark]}>
            This helps us adjust your service accordingly.
          </Text>
        </View>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            value ? styles.toggleBtnActive : (isDark ? styles.toggleBtnInactiveDark : styles.toggleBtnInactiveLight),
          ]}
          onPress={() => {
            safeHapticLight();
            onChange(true);
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleBtnText,
              value ? styles.toggleBtnTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight),
            ]}
          >
            Yes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            !value ? styles.toggleBtnActive : (isDark ? styles.toggleBtnInactiveDark : styles.toggleBtnInactiveLight),
          ]}
          onPress={() => {
            safeHapticWarning();
            onChange(false);
            onRequestWarning();
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleBtnText,
              !value ? styles.toggleBtnTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight),
            ]}
          >
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface WaterElectricityModalProps {
  visible: boolean;
  onClose: () => void;
  onGotIt?: () => void;
  isDark?: boolean;
}

export function WaterElectricityModal({
  visible,
  onClose,
  onGotIt,
  isDark = false,
}: WaterElectricityModalProps) {
  const router = useRouter();

  const handleGotIt = () => {
    if (onGotIt) {
      onGotIt();
    } else {
      onClose();
      try {
        router.push('/services');
      } catch (e) {
        // Fallback
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, isDark && styles.modalCardDark]}>
          {/* Warning Icon Badge with radiant sunburst styling */}
          <View style={styles.badgeContainer}>
            {/* Radiant decorative rays */}
            <View style={styles.sunburstRays}>
              <View style={[styles.ray, { transform: [{ rotate: '0deg' }] }]} />
              <View style={[styles.ray, { transform: [{ rotate: '30deg' }] }]} />
              <View style={[styles.ray, { transform: [{ rotate: '60deg' }] }]} />
              <View style={[styles.ray, { transform: [{ rotate: '90deg' }] }]} />
              <View style={[styles.ray, { transform: [{ rotate: '120deg' }] }]} />
              <View style={[styles.ray, { transform: [{ rotate: '150deg' }] }]} />
            </View>
            <View style={styles.outerGlowCircle}>
              <View style={styles.innerGlowCircle}>
                <Ionicons name="alert" size={32} color="#d97706" />
              </View>
            </View>
          </View>

          <Text style={[styles.modalTitle, isDark && styles.textWhite]}>
            Water & Electricity Not Available
          </Text>

          <Text style={[styles.modalMessage, isDark && styles.textMutedDark]}>
            We are unable to provide car wash service without water and electricity at your location.
          </Text>

          <Text style={[styles.modalSubMessage, isDark && styles.textWhite]}>
            Please select 'Yes' to continue with the booking.
          </Text>

          <TouchableOpacity
            style={styles.modalGotItBtn}
            onPress={handleGotIt}
            activeOpacity={0.85}
          >
            <Text style={styles.modalGotItBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
  },
  cardLight: {
    backgroundColor: '#f0f9ff',
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  cardDark: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 19,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  textWhite: {
    color: '#f8fafc',
  },
  textMutedLight: {
    color: '#64748b',
  },
  textMutedDark: {
    color: '#94a3b8',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  toggleBtn: {
    paddingVertical: 7,
    paddingHorizontal: 22,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#0099ff',
    shadowColor: '#0099ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  toggleBtnInactiveLight: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  toggleBtnInactiveDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#ffffff',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCardDark: {
    backgroundColor: '#1e293b',
  },
  badgeContainer: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  sunburstRays: {
    position: 'absolute',
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ray: {
    position: 'absolute',
    width: 72,
    height: 3,
    backgroundColor: '#f59e0b',
    borderRadius: 2,
    opacity: 0.7,
  },
  outerGlowCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  innerGlowCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  modalSubMessage: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalGotItBtn: {
    backgroundColor: '#0099ff',
    borderRadius: 9999,
    paddingVertical: 11,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0099ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  modalGotItBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
