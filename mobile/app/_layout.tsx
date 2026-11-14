import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

import { SweetAlertHost } from '../utils/sweetAlert';

const extractReferralCodeFromUrl = (url?: string | null): string => {
  if (!url) return '';
  try {
    const parsed = Linking.parse(url);
    const q = parsed.queryParams;
    const ref = q?.ref || q?.referral || q?.code || q?.referral_code;
    if (typeof ref === 'string' && ref.trim()) {
      return ref.trim().toUpperCase();
    }
  } catch {}

  const match = url.match(/[?&](?:ref|referral|code|referral_code)=([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1].trim().toUpperCase();
  }
  return '';
};

const checkClipboardReferral = async (): Promise<string> => {
  try {
    const alreadyChecked = await AsyncStorage.getItem('referral_clipboard_checked');
    if (alreadyChecked) return '';

    await AsyncStorage.setItem('referral_clipboard_checked', 'true');
    const hasString = await Clipboard.hasStringAsync();
    if (!hasString) return '';

    const text = await Clipboard.getStringAsync();
    if (!text) return '';

    // Check for tagged token: CLEANATDOORSTEP_REF:ABC1234
    const taggedMatch = text.match(/CLEANATDOORSTEP_REF:([A-Za-z0-9_-]+)/i);
    if (taggedMatch && taggedMatch[1]) {
      return taggedMatch[1].trim().toUpperCase();
    }

    // Check for referral link in clipboard: .../register?ref=ABC1234
    const linkMatch = text.match(/[?&](?:ref|referral|code|referral_code)=([A-Za-z0-9_-]+)/i);
    if (linkMatch && linkMatch[1]) {
      return linkMatch[1].trim().toUpperCase();
    }
  } catch {}
  return '';
};

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const handleIncomingReferral = async (url?: string | null) => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        // If already logged in, do not redirect
        if (token) return;

        let code = '';
        if (url) {
          code = extractReferralCodeFromUrl(url);
        }

        if (!code) {
          code = await checkClipboardReferral();
        }

        if (code && isMounted) {
          await AsyncStorage.setItem('pending_referral_code', code);
          setTimeout(() => {
            if (isMounted) {
              router.push({
                pathname: '/register',
                params: { ref: code },
              });
            }
          }, 350);
        }
      } catch (err) {
        console.warn('Referral deep link handling error:', err);
      }
    };

    // Check initial launch URL
    Linking.getInitialURL().then((url) => {
      handleIncomingReferral(url);
    });

    // Listen for incoming deep link events
    const subscription = Linking.addEventListener('url', (event) => {
      handleIncomingReferral(event.url);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <SweetAlertHost />
      <StatusBar style="light" />
    </>
  );
}
