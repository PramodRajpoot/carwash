<template>
  <div>
    <div class="glass-card" style="padding: 1.5rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
      <div class="flex justify-between items-center" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>🔔</span> Notifications
            <span v-if="unreadCount > 0" class="badge" style="background: var(--accent-cyan); color: #fff; font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 999px;">{{ unreadCount }} new</span>
          </h3>
          <p style="color: var(--text-secondary); font-size: 0.82rem; margin: 0.25rem 0 0 0;">Updates, booking alerts, and account activity.</p>
        </div>
        <button v-if="unreadCount > 0" class="btn btn-sm btn-outline" @click="markAll" style="font-size: 0.8rem; padding: 0.35rem 0.85rem;">Mark all read</button>
      </div>

      <div v-if="loading" style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
        <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">⏳</div>
        <div>Loading notifications…</div>
      </div>

      <div v-else-if="notifications.length === 0" style="text-align: center; padding: 3.5rem 1rem; color: var(--text-secondary);">
        <div style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.8;">🔕</div>
        <div style="font-weight: 600; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.25rem;">No notifications yet</div>
        <div style="font-size: 0.85rem;">We'll let you know when updates or booking changes occur.</div>
      </div>

      <div v-else class="notif-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div v-for="n in notifications" :key="n.id"
          class="notif-item"
          :class="{ 'notif-unread': !n.read_at }"
          @click="markRead(n)">
          
          <div class="notif-icon-box" :class="'notif-icon-' + n.type">
            {{ icon(n.type) }}
          </div>

          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.25rem;">
              <h5 class="notif-title" :class="{ 'unread-title': !n.read_at }">
                {{ n.title }}
              </h5>
              <span class="notif-time">{{ formatDate(n.created_at) }}</span>
            </div>

            <p class="notif-body">
              {{ n.body }}
            </p>
          </div>

          <div v-if="!n.read_at" class="notif-dot" title="Unread notification"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CustomerNotifications',
  data() {
    return {
      notifications: [],
      loading: true,
      unreadCount: 0
    };
  },
  methods: {
    icon(t) {
      const map = {
        booking_confirmed: '📦',
        service_reminder: '⏰',
        subscription_expiry: '📋',
        referral_reward: '🎁',
        wallet_credit: '💰',
        coupon: '🎟️',
        royalty_due: '💳'
      };
      return map[t] || '🔔';
    },
    formatDate(d) {
      if (!d) return '';
      const date = new Date(d);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    async markRead(n) {
      if (n.read_at) return;
      await axios.post(`/api/notifications/${n.id}/read`);
      n.read_at = new Date().toISOString();
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    },
    async markAll() {
      await axios.post('/api/notifications/read-all');
      this.notifications.forEach(n => {
        n.read_at = n.read_at || new Date().toISOString();
      });
      this.unreadCount = 0;
    },
    async load() {
      try {
        const { data } = await axios.get('/api/notifications');
        this.notifications = data.notifications?.data || [];
        this.unreadCount = data.unread_count || 0;
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    this.load();
  }
};
</script>

<style scoped>
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.15rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.notif-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-glow);
  transform: translateY(-1px);
}

.notif-unread {
  background: rgba(0, 180, 255, 0.08) !important;
  border-color: rgba(0, 180, 255, 0.35) !important;
}

[data-theme="light"] .notif-unread {
  background: rgba(0, 112, 192, 0.07) !important;
  border-color: rgba(0, 112, 192, 0.3) !important;
}

.notif-icon-box {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: rgba(0, 180, 255, 0.12);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.notif-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.35;
}

.unread-title {
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

[data-theme="light"] .unread-title {
  color: #0A192F !important;
  font-weight: 700 !important;
}

.notif-body {
  font-size: 0.88rem;
  line-height: 1.5;
  color: #D1D5DB; /* Clear readable crisp light text in dark mode */
  margin: 0.35rem 0 0 0;
}

[data-theme="light"] .notif-body {
  color: #334155; /* Crisp dark slate in light mode */
}

.notif-time {
  font-size: 0.78rem;
  color: #94A3B8;
  white-space: nowrap;
  font-weight: 500;
}

[data-theme="light"] .notif-time {
  color: #64748B;
}

.notif-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-cyan);
  box-shadow: 0 0 8px var(--accent-cyan);
  flex-shrink: 0;
  margin-top: 0.4rem;
}
</style>
