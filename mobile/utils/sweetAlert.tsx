import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type SweetAlertType = 'success' | 'error' | 'warning' | 'info';

interface SweetAlertConfig {
  title: string;
  message?: string;
  type?: SweetAlertType;
  onConfirm?: () => void;
}

let alertListeners: Array<(config: SweetAlertConfig) => void> = [];

export const showSweetAlert = (
  title: string,
  message?: string,
  type: SweetAlertType = 'success',
  onConfirm?: () => void
) => {
  const payload: SweetAlertConfig = { title, message, type, onConfirm };
  alertListeners.forEach((listener) => listener(payload));
};

export function SweetAlertHost() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<SweetAlertConfig>({
    title: 'Success',
    message: '',
    type: 'success',
  });

  useEffect(() => {
    const listener = (nextConfig: SweetAlertConfig) => {
      setConfig(nextConfig);
      setVisible(true);
    };

    alertListeners.push(listener);
    return () => {
      alertListeners = alertListeners.filter((item) => item !== listener);
    };
  }, []);

  const typeMeta = {
    success: { accent: '#10b981', icon: '✓' },
    error: { accent: '#ef4444', icon: '✕' },
    warning: { accent: '#f59e0b', icon: '!' },
    info: { accent: '#38bdf8', icon: 'i' },
  }[config.type || 'success'];

  const handleClose = () => {
    setVisible(false);
    config.onConfirm?.();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={[styles.iconWrap, { backgroundColor: `${typeMeta.accent}20` }]}
          >
            <Text style={[styles.iconText, { color: typeMeta.accent }]}>{typeMeta.icon}</Text>
          </View>

          <Text style={styles.title}>{config.title}</Text>
          {config.message ? <Text style={styles.message}>{config.message}</Text> : null}

          <Pressable style={[styles.button, { backgroundColor: typeMeta.accent }]} onPress={handleClose}>
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 26,
  },
  title: {
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  button: {
    alignSelf: 'stretch',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});
