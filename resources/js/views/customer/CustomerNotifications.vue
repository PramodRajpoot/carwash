<template>
  <div>
    <div class="glass-card">
      <div class="flex justify-between items-center" style="margin-bottom:1rem">
        <h4>🔔 Notifications</h4>
        <button v-if="unreadCount > 0" class="btn btn-sm btn-ghost" @click="markAll">Mark all read</button>
      </div>
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="notifications.length === 0" class="text-muted" style="text-align:center;padding:2rem">
        <div style="font-size:3rem;margin-bottom:0.5rem">🔕</div>
        No notifications yet.
      </div>
      <div v-else>
        <div v-for="n in notifications" :key="n.id"
          class="flex gap-3 items-start"
          style="padding:0.85rem 0;border-bottom:1px solid var(--border-color);cursor:pointer"
          :style="{ background: n.read_at ? 'transparent' : 'rgba(6,182,212,0.04)' }"
          @click="markRead(n)">
          <div :class="'notif-icon-' + n.type" style="font-size:1.5rem;flex-shrink:0;padding-top:0.1rem">{{ icon(n.type) }}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:0.9rem" :style="{ color: n.read_at ? 'var(--text-secondary)' : 'var(--text-primary)' }">{{ n.title }}</div>
            <div class="text-muted" style="font-size:0.82rem;line-height:1.5;margin-top:0.2rem">{{ n.body }}</div>
            <div class="text-muted" style="font-size:0.75rem;margin-top:0.3rem">{{ formatDate(n.created_at) }}</div>
          </div>
          <div v-if="!n.read_at" style="width:8px;height:8px;border-radius:50%;background:var(--accent-cyan);flex-shrink:0;margin-top:0.4rem"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'CustomerNotifications',
  data() { return { notifications: [], loading: true, unreadCount: 0 }; },
  methods: {
    icon(t) {
      const map = { booking_confirmed: '📦', service_reminder: '⏰', subscription_expiry: '📋', referral_reward: '🎁', wallet_credit: '💰', coupon: '🎟️', royalty_due: '💳' };
      return map[t] || '🔔';
    },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; },
    async markRead(n) {
      if (n.read_at) return;
      await axios.post(`/api/notifications/${n.id}/read`);
      n.read_at = new Date().toISOString();
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    },
    async markAll() {
      await axios.post('/api/notifications/read-all');
      this.notifications.forEach(n => { n.read_at = n.read_at || new Date().toISOString(); });
      this.unreadCount = 0;
    },
    async load() {
      const { data } = await axios.get('/api/notifications');
      this.notifications = data.notifications?.data || [];
      this.unreadCount = data.unread_count || 0;
      this.loading = false;
    },
  },
  mounted() { this.load(); },
};
</script>
