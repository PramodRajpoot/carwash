import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '../constants/api';
import AppFooter, { FooterTab } from '../components/AppFooter';
import DashboardHeader from '../components/DashboardHeader';

interface SupportTicket {
  id: number;
  subject: string;
  body: string;
  status?: string;
  created_at?: string;
  admin_reply?: string | null;
  replied_at?: string | null;
  image?: string | null;
  reply_image?: string | null;
}

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 16) + 6;

  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab>('support');
  const [user, setUser] = useState<any>({ name: 'User' });
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const syncTheme = useCallback(async () => {
    const storedTheme = await AsyncStorage.getItem('app_theme');
    setIsDark(storedTheme === 'dark');
  }, []);

  const handleToggleTheme = useCallback(async () => {
    const nextTheme = !isDark ? 'dark' : 'light';
    setIsDark(nextTheme === 'dark');
    await AsyncStorage.setItem('app_theme', nextTheme);
  }, [isDark]);

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

  const loadTickets = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setTickets([]);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/support/tickets`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
      });

      const nextTickets = Array.isArray(response.data) ? response.data : [];
      setTickets(nextTickets);
      if (selectedTicketId && !nextTickets.some((ticket) => ticket.id === selectedTicketId)) {
        setSelectedTicketId(null);
      }
    } catch (error) {
      console.log('Support tickets load error:', error);
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    syncTheme();
    syncUser();
    loadTickets();
  }, [loadTickets, syncTheme, syncUser]);

  useFocusEffect(
    useCallback(() => {
      syncTheme();
      syncUser();
      loadTickets();
    }, [loadTickets, syncTheme, syncUser])
  );

  const clearForm = () => {
    setSubject('');
    setBody('');
    setSelectedImage(null);
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos to upload a screenshot.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Upload failed', 'Unable to select an image right now.');
    }
  };

  const removeSelectedImage = () => setSelectedImage(null);

  const handleSubmit = async () => {
    if (!subject.trim() || !body.trim()) {
      Alert.alert('Missing details', 'Please provide both subject and issue description.');
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/login');
        return;
      }

      const formData = new FormData();
      formData.append('subject', subject.trim());
      formData.append('body', body.trim());

      if (selectedImage) {
        formData.append('image', {
          uri: selectedImage.uri,
          name: selectedImage.fileName || `support-${Date.now()}.jpg`,
          type: selectedImage.mimeType || 'image/jpeg',
        } as any);
      }

      await axios.post(`${API_BASE}/api/support/tickets`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
      });

      clearForm();
      await loadTickets();
      Alert.alert('Success', 'Your support ticket has been submitted.');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
  };

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
      router.push('/support');
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusLabel = (status?: string) => {
    const normalized = (status || 'open').replace('_', ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const statusStyle = (status?: string) => {
    switch (status) {
      case 'closed':
        return styles.badgeSuccess;
      case 'in_progress':
        return styles.badgeInfo;
      default:
        return styles.badgeWarning;
    }
  };

  const ticketSummary = useMemo(() => {
    return tickets.length === 0 ? 'No tickets yet. Raise one above if you need help.' : `${tickets.length} ticket${tickets.length > 1 ? 's' : ''}`;
  }, [tickets.length]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.page, isDark && styles.darkPage]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <DashboardHeader
          user={user}
          title="Help & Support"
          subtitle="Customer care"
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
        />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={isDark ? '#f8fafc' : '#0284c7'} />
          <Text style={[styles.loaderText, isDark && styles.darkSubtext]}>Loading support tickets...</Text>
        </View>
        <AppFooter activeTab="support" isDark={isDark} onTabPress={handleFooterTabPress} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.page, isDark && styles.darkPage]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <DashboardHeader
        user={user}
        title="Help & Support"
        subtitle="Customer care"
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
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
        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Raise a Support Ticket</Text>

          <Text style={[styles.fieldLabel, isDark && styles.darkSubtext]}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. Service not completed on time"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            style={[styles.input, isDark && styles.darkInput]}
          />

          <Text style={[styles.fieldLabel, isDark && styles.darkSubtext]}>Issue Details</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Describe your issue in detail..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            multiline
            numberOfLines={5}
            style={[styles.textArea, isDark && styles.darkInput]}
          />

          <Text style={[styles.fieldLabel, isDark && styles.darkSubtext]}>Screenshot / Image (Optional)</Text>
          {selectedImage ? (
            <View style={styles.attachmentPreviewWrap}>
              <Image source={{ uri: selectedImage.uri }} style={styles.attachmentPreview} resizeMode="cover" />
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.removeAttachmentButton}
                onPress={removeSelectedImage}
              >
                <Text style={styles.removeAttachmentText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.attachmentButton, isDark && styles.darkAttachmentButton]}
              onPress={handlePickImage}
            >
              <Text style={[styles.attachmentButtonText, isDark && styles.darkAttachmentButtonText]}>
                Upload screenshot
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.primaryButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Submitting...' : 'Submit Ticket'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, isDark && styles.darkCard]}>
          <View style={styles.ticketHeaderRow}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>My Support Tickets</Text>
            <Text style={[styles.metaText, isDark && styles.darkSubtext]}>{ticketSummary}</Text>
          </View>

          {tickets.length === 0 ? (
            <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
              No tickets yet. Raise one above if you need help.
            </Text>
          ) : (
            tickets.map((ticket) => {
              const expanded = selectedTicketId === ticket.id;
              return (
                <TouchableOpacity
                  key={ticket.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedTicketId(expanded ? null : ticket.id)}
                  style={[styles.ticketCard, isDark && styles.darkTicketCard]}
                >
                  <View style={styles.ticketCardTop}>
                    <View style={styles.ticketTextWrap}>
                      <Text style={[styles.ticketTitle, isDark && styles.darkText]}>{ticket.subject}</Text>
                      <Text style={[styles.ticketMeta, isDark && styles.darkSubtext]}>
                        {formatDate(ticket.created_at)} • Ticket #{ticket.id}
                      </Text>
                    </View>

                    <View style={styles.ticketBadgeWrap}>
                      <View style={[styles.badge, statusStyle(ticket.status)]}>
                        <Text style={styles.badgeText}>{statusLabel(ticket.status)}</Text>
                      </View>
                    </View>
                  </View>

                  {expanded && (
                    <View style={styles.ticketDetails}>
                      <Text style={[styles.ticketBody, isDark && styles.darkSubtext]}>{ticket.body}</Text>

                      {ticket.admin_reply ? (
                        <View style={[styles.replyBox, isDark && styles.darkReplyBox]}>
                          <Text style={[styles.replyHeading, isDark && styles.darkText]}>
                            Admin Reply • {formatDate(ticket.replied_at)}
                          </Text>
                          <Text style={[styles.replyText, isDark && styles.darkSubtext]}>{ticket.admin_reply}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.pendingText, isDark && styles.darkSubtext]}>
                          Awaiting admin response...
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  darkCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbe1ea',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 14,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#dbe1ea',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  darkInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    color: '#f8fafc',
  },
  attachmentButton: {
    borderWidth: 1,
    borderColor: '#7dd3fc',
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  darkAttachmentButton: {
    backgroundColor: '#0f172a',
    borderColor: '#38bdf8',
  },
  attachmentButtonText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  darkAttachmentButtonText: {
    color: '#e2e8f0',
  },
  attachmentPreviewWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  attachmentPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe1ea',
    backgroundColor: '#e2e8f0',
  },
  removeAttachmentButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeAttachmentText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.7,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  ticketCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    padding: 14,
    marginBottom: 10,
  },
  darkTicketCard: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  ticketCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  ticketTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  ticketMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  ticketBadgeWrap: {
    alignItems: 'flex-end',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  badgeInfo: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgeText: {
    color: '#0f172a',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  ticketDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 12,
    paddingTop: 12,
  },
  ticketBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 20,
  },
  replyBox: {
    marginTop: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
    borderRadius: 10,
    padding: 10,
  },
  darkReplyBox: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  replyHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  replyText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 20,
  },
  pendingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 18,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '700',
    marginTop: 10,
  },
  darkText: {
    color: '#f8fafc',
  },
  darkSubtext: {
    color: '#cbd5e1',
  },
});
