import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform, Modal, Linking } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '../constants/api';
import { safeHapticLight, safeHapticWarning } from '../utils/haptics';
import { showSweetAlert } from '../utils/sweetAlert';
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
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;

  const safeAddress = typeof address === 'string' ? address.trim() : '';
  const [savedAddress, setSavedAddress] = React.useState('');
  const [token, setToken] = React.useState<string | null>(null);
  const [storedUser, setStoredUser] = React.useState<any>(null);
  const [menuVisible, setMenuVisible] = React.useState(false);

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

    if (!user) {
      AsyncStorage.getItem('userData')
        .then((storedData) => {
          if (isMounted && storedData) {
            try {
              setStoredUser(JSON.parse(storedData));
            } catch {}
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const activeUser = user || storedUser;
  const isLoggedIn = Boolean(token || (activeUser && (activeUser.id || (activeUser.email && activeUser.name !== 'User'))));
  const displayTitle = title === 'Dashboard' && !isLoggedIn ? 'CleanAtDoorstep' : title;

  const resolvedAddress = safeAddress || savedAddress;

  // Show the full address when available; otherwise keep the default placeholder.
  const locationText = resolvedAddress && resolvedAddress !== 'Select Location'
    ? resolvedAddress
    : 'Select Location';

  const userInitial = activeUser?.name
    ? activeUser.name.trim().charAt(0).toUpperCase()
    : 'U';

  const avatarUri = getAvatarUri(activeUser);
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
      return;
    }
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setMenuVisible(true);
  };

  const openWebsite = async () => {
    setMenuVisible(false);
    try {
      const websiteUrl = API_BASE;
      const supported = await Linking.canOpenURL(websiteUrl);
      if (supported) {
        await Linking.openURL(websiteUrl);
      }
    } catch (error) {
      console.warn('Unable to open website:', error);
    }
  };

  const handleLogout = () => {
    setMenuVisible(false);
    showSweetAlert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      'warning',
      async () => {
        safeHapticWarning();
        try {
          if (token) {
            await axios.post(
              `${API_BASE}/api/auth/logout`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        } catch {}
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        router.replace('/login');
      }
    );
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

      {/* Account Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.menuBackdrop, { paddingTop: topPadding + 44 }]}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.dropdownCard, isDark && styles.dropdownCardDark]}>
            <View style={styles.dropdownHeader}>
              <View style={styles.menuHeaderUser}>
                <View style={styles.menuAvatar}>
                  {avatarUri && !imageError ? (
                    <Image source={{ uri: avatarUri }} style={styles.menuAvatarImg} />
                  ) : (
                    <Text style={styles.menuAvatarInitial}>
                      {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  )}
                </View>

                <View style={styles.menuUserInfo}>
                  <Text style={styles.menuUserName} numberOfLines={1}>
                    {activeUser?.name || 'Customer Account'}
                  </Text>
                  <Text style={styles.menuUserEmail} numberOfLines={1}>
                    {activeUser?.email || ''}
                  </Text>
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>VERIFIED CUSTOMER</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.menuCloseBtn}
                onPress={() => setMenuVisible(false)}
              >
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={[styles.dropdownBody, isDark && styles.dropdownBodyDark]}>
              <Text style={[styles.menuGroupTitle, isDark && styles.menuGroupTitleDark]}>ACCOUNT</Text>

              <TouchableOpacity
                activeOpacity={0.75}
                style={[styles.dropdownItem, isDark && styles.dropdownItemDark]}
                onPress={() => {
                  setMenuVisible(false);
                  if (pathname !== '/profile') {
                    router.push('/profile');
                  }
                }}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: isDark ? '#312e81' : '#eef2ff' }]}>
                  <Ionicons name="person-circle-outline" size={20} color={isDark ? '#818cf8' : '#4f46e5'} />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={[styles.menuItemTitle, isDark && styles.menuItemTitleDark]}>Profile</Text>
                  <Text style={[styles.menuItemSub, isDark && styles.menuItemSubDark]}>Personal details & security</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#64748b' : '#94a3b8'} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={[styles.dropdownItem, isDark && styles.dropdownItemDark]}
                onPress={openWebsite}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                  <Ionicons name="globe-outline" size={20} color={isDark ? '#94a3b8' : '#475569'} />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={[styles.menuItemTitle, isDark && styles.menuItemTitleDark]}>Website</Text>
                  <Text style={[styles.menuItemSub, isDark && styles.menuItemSubDark]}>Visit CleanAt official portal</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#64748b' : '#94a3b8'} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={[styles.dropdownItem, styles.menuItemLogout, isDark && styles.menuItemLogoutDark]}
                onPress={handleLogout}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }]}>
                  <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={[styles.menuItemTitle, { color: '#dc2626' }]}>Logout</Text>
                  <Text style={[styles.menuItemSub, isDark ? { color: '#fca5a5' } : { color: '#64748b' }]}>Sign out of your device</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#fca5a5" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingRight: 16,
  },
  dropdownCard: {
    width: 320,
    maxWidth: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    shadowColor: '#000000',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  menuAvatarInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  menuUserInfo: {
    flex: 1,
  },
  menuUserName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  menuUserEmail: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  menuBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0369a1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  menuBadgeText: {
    color: '#e0f2fe',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  menuCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  dropdownBodyDark: {
    backgroundColor: '#1e293b',
  },
  menuGroupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 6,
  },
  menuGroupTitleDark: {
    color: '#64748b',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: '#ffffff',
  },
  dropdownItemDark: {
    backgroundColor: '#1e293b',
  },
  menuItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuItemTitleDark: {
    color: '#f8fafc',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  menuItemSubDark: {
    color: '#94a3b8',
  },
  menuItemLogout: {
    marginTop: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  menuItemLogoutDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
});
