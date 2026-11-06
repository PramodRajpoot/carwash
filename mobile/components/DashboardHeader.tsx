import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeHapticLight } from '../utils/haptics';
import { getAvatarUri } from '../utils/avatar';

interface Props {
  user: any;
  title?: string;
  subtitle?: string;
  address?: string;
  unreadCount?: number;
  isDark?: boolean;
  showLocation?: boolean;
  actionButton?: React.ReactNode;
  onLocationPress?: () => void;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  onToggleTheme?: () => void;
}

export default function DashboardHeader({
  user,
  title = 'Dashboard',
  subtitle,
  address,
  unreadCount = 0,
  isDark = false,
  showLocation = false,
  actionButton,
  onLocationPress,
  onProfilePress,
  onNotificationPress,
  onToggleTheme,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;

  const safeAddress = typeof address === 'string' ? address.trim() : '';
  const [savedAddress, setSavedAddress] = React.useState('');
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem('header_location')
      .then((storedAddress) => {
        if (isMounted) {
          setSavedAddress(typeof storedAddress === 'string' ? storedAddress.trim() : '');
        }
      })
      .catch(() => {
        if (isMounted) {
          setSavedAddress('');
        }
      });

    AsyncStorage.getItem('userToken')
      .then((storedToken) => {
        if (isMounted) {
          setToken(storedToken);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user]);

  const isLoggedIn = Boolean(token || (user && (user.id || (user.email && user.name !== 'User'))));
  const displayTitle = title === 'Dashboard' && !isLoggedIn ? 'CleanAtDoorstep' : title;

  const resolvedAddress = safeAddress || savedAddress;

  // Show the full address when available; otherwise keep the default placeholder.
  const locationText = resolvedAddress && resolvedAddress !== 'Select Location'
    ? resolvedAddress
    : 'Select Location';

  const userInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : 'U';

  const avatarUri = getAvatarUri(user);
  const [imageError, setImageError] = React.useState(false);
  const [prevAvatarUri, setPrevAvatarUri] = React.useState(avatarUri);

  if (prevAvatarUri !== avatarUri) {
    setPrevAvatarUri(avatarUri);
    setImageError(false);
  }

  const handleProfile = () => {
    safeHapticLight();
    if (onProfilePress) {
      onProfilePress();
    } else if (!isLoggedIn) {
      router.push('/login');
    } else {
      router.push('/profile');
    }
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
      <View style={styles.brandRow}>
        <View style={styles.headerLogoContainer}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.brandTextWrap}>
          <Text style={[styles.mainTitle, isDark && styles.darkMainTitle]}>{displayTitle}</Text>

          {showLocation ? (
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
          ) : subtitle ? (
            <Text style={[styles.subtitleText, isDark && styles.darkSubtitleText]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightActionsRow}>
        {actionButton ? <View style={styles.actionWrap}>{actionButton}</View> : null}

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.iconBtn, isDark && styles.iconBtnDark]}
          onPress={handleNotification}
        >
          <Ionicons
            name="notifications-outline"
            size={18}
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

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.iconBtn, isDark && styles.iconBtnDark]}
          onPress={handleToggle}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon-outline'}
            size={18}
            color={isDark ? '#fbbf24' : '#334155'}
          />
        </TouchableOpacity>

        {!isLoggedIn ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.headerLoginBtn, isDark && styles.headerLoginBtnDark]}
            onPress={handleProfile}
          >
            <Ionicons
              name="person-circle-outline"
              size={14}
              color={isDark ? '#38bdf8' : '#0284c7'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.headerLoginBtnText, isDark && styles.headerLoginBtnTextDark]}>
              Sign In
            </Text>
          </TouchableOpacity>
        ) : (
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
        )}
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
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  darkHeaderContainer: {
    backgroundColor: '#090d16',
    borderBottomColor: '#1e293b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  headerLogoContainer: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerLogo: {
    width: 22,
    height: 22,
  },
  brandTextWrap: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 18,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
  darkLocationName: {
    color: '#fb7185',
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  darkSubtitleText: {
    color: '#cbd5e1',
  },
  chevron: {
    top: 1,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionWrap: {
    marginRight: 2,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  iconBtnDark: {
    backgroundColor: '#111827',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
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
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  initialsCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  headerLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  headerLoginBtnDark: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.24)',
  },
  headerLoginBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  headerLoginBtnTextDark: {
    color: '#7dd3fc',
  },
});
