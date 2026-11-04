import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeHapticLight } from '../utils/haptics';
import { getAvatarUri } from '../utils/avatar';

interface Props {
  user: any;
  address?: string;
  unreadCount?: number;
  isDark?: boolean;
  onLocationPress?: () => void;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  onToggleTheme?: () => void;
}

export default function DashboardHeader({
  user,
  address,
  unreadCount = 0,
  isDark = false,
  onLocationPress,
  onProfilePress,
  onNotificationPress,
  onToggleTheme,
}: Props) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;

  const safeAddress = typeof address === 'string' ? address.trim() : '';

  // Show the full address when available; otherwise keep the default placeholder.
  const locationText = safeAddress && safeAddress !== 'Select Location'
    ? safeAddress
    : 'Select Location';

  const userInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : 'U';

  const avatarUri = getAvatarUri(user);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [avatarUri]);

  const handleProfile = () => {
    safeHapticLight();
    onProfilePress?.();
  };

  const handleLocation = () => {
    safeHapticLight();
    onLocationPress?.();
  };

  const handleNotification = () => {
    safeHapticLight();
    onNotificationPress?.();
  };

  const handleToggle = () => {
    safeHapticLight();
    onToggleTheme?.();
  };

  return (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: topPadding },
        isDark && styles.darkHeaderContainer,
      ]}
    >
      <View style={styles.leftCol}>
        <Text style={[styles.mainTitle, isDark && styles.darkMainTitle]}>
          Dashboard
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.locationRow}
          onPress={handleLocation}
        >
          <Text
            style={[styles.locationName, isDark && styles.darkLocationName]}
            numberOfLines={1}
          >
            {locationText}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={13}
            color={isDark ? '#fb7185' : '#e11d48'}
            style={styles.chevron}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.rightActionsRow}>
        {/* Notification Icon (Clean, no surrounding box) */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.iconBtn}
          onPress={handleNotification}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={isDark ? '#f8fafc' : '#1e293b'}
          />
          {unreadCount > 0 && (
            <View style={styles.badgeDot}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Change Mode Icon (Clean, no surrounding box) */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.iconBtn}
          onPress={handleToggle}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon-outline'}
            size={21}
            color={isDark ? '#fbbf24' : '#334155'}
          />
        </TouchableOpacity>

        {/* User Profile: Avatar picture if present, else user initial */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.profileBtn}
          onPress={handleProfile}
        >
          {avatarUri && !imageError ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImg}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{userInitial}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  darkHeaderContainer: {
    backgroundColor: '#090d16',
  },
  leftCol: {
    flex: 1,
    marginRight: 10,
  },
  mainTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  darkMainTitle: {
    color: '#f8fafc',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
  },
  locationName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
  darkLocationName: {
    color: '#fb7185',
  },
  chevron: {
    top: 1,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#e11d48',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  avatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  initialsCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
