import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeHapticLight, safeHapticSuccess, safeHapticWarning } from './haptics';

export type SweetAlertType = 'success' | 'error' | 'warning' | 'info';

export interface SweetAlertConfig {
  title: string;
  message?: string;
  type?: SweetAlertType;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  onCancel?: () => void;
  showCancel?: boolean;
}

let alertListeners: Array<(config: SweetAlertConfig) => void> = [];

export const showSweetAlert = (
  title: string,
  message?: string,
  type: SweetAlertType = 'success',
  onConfirm?: () => void,
  options?: {
    confirmText?: string;
    cancelText?: string;
    onCancel?: () => void;
    showCancel?: boolean;
  }
) => {
  const payload: SweetAlertConfig = {
    title,
    message,
    type,
    onConfirm,
    confirmText: options?.confirmText,
    cancelText: options?.cancelText,
    onCancel: options?.onCancel,
    showCancel: options?.showCancel,
  };
  alertListeners.forEach((listener) => listener(payload));
};

export function SweetAlertHost() {
  const [visible, setVisible] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [config, setConfig] = useState<SweetAlertConfig>({
    title: 'Success',
    message: '',
    type: 'success',
  });

  useEffect(() => {
    const listener = (nextConfig: SweetAlertConfig) => {
      setConfig(nextConfig);
      AsyncStorage.getItem('app_theme').then((theme) => {
        setIsDark(theme === 'dark');
      });
      if (nextConfig.type === 'success') {
        safeHapticSuccess();
      } else if (nextConfig.type === 'warning' || nextConfig.type === 'error') {
        safeHapticWarning();
      } else {
        safeHapticLight();
      }
      setVisible(true);
    };

    alertListeners.push(listener);
    return () => {
      alertListeners = alertListeners.filter((item) => item !== listener);
    };
  }, []);

  const typeMeta = {
    success: {
      accent: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      iconName: 'checkmark' as const,
    },
    error: {
      accent: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
      iconName: 'close' as const,
    },
    warning: {
      accent: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      iconName: 'alert' as const,
    },
    info: {
      accent: '#0284c7',
      bgGlow: 'rgba(2, 132, 199, 0.15)',
      iconName: 'information' as const,
    },
  }[config.type || 'success'];

  const handleConfirm = () => {
    safeHapticLight();
    setVisible(false);
    config.onConfirm?.();
  };

  const handleCancel = () => {
    safeHapticLight();
    setVisible(false);
    config.onCancel?.();
  };

  const hasCancel = Boolean(config.showCancel || config.onCancel);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={hasCancel ? handleCancel : handleConfirm}>
      <Pressable style={styles.backdrop} onPress={hasCancel ? handleCancel : handleConfirm}>
        <Pressable
          style={[styles.card, isDark && styles.cardDark]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Animated Glow Icon Wrap */}
          <View style={[styles.outerGlow, { backgroundColor: typeMeta.bgGlow }]}>
            <View style={[styles.iconWrap, { backgroundColor: typeMeta.accent }]}>
              <Ionicons name={typeMeta.iconName} size={28} color="#ffffff" />
            </View>
          </View>

          <Text style={[styles.title, isDark && styles.titleDark]}>{config.title}</Text>
          {config.message ? (
            <Text style={[styles.message, isDark && styles.messageDark]}>{config.message}</Text>
          ) : null}

          {hasCancel ? (
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton, isDark && styles.cancelButtonDark]}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelButtonText, isDark && styles.cancelButtonTextDark]}>
                  {config.cancelText || 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.button, { backgroundColor: typeMeta.accent, flex: 1 }]}
                onPress={handleConfirm}
              >
                <Text style={styles.buttonText}>{config.confirmText || 'OK'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.button, { backgroundColor: typeMeta.accent }]}
              onPress={handleConfirm}
            >
              <Text style={styles.buttonText}>{config.confirmText || 'OK'}</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardDark: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
  },
  outerGlow: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  title: {
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  titleDark: {
    color: '#f8fafc',
  },
  message: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  messageDark: {
    color: '#94a3b8',
  },
  button: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 0,
    shadowOpacity: 0,
  },
  cancelButtonDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButtonTextDark: {
    color: '#cbd5e1',
  },
});
