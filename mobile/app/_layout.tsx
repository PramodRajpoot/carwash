import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SweetAlertHost } from '../utils/sweetAlert';

export default function RootLayout() {
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
