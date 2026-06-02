<template>
  <div>
    <div class="grid grid-4 gap-3" style="margin-bottom:2rem">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">📦</div><div class="stat-value">{{ data.booking_count }}</div><div class="stat-label">Total Washes</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">🎁</div><div class="stat-value">{{ data.reward_coins }}</div><div class="stat-label">Reward Coins</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-violet)">🔗</div><div class="stat-value">{{ data.referral_coins }}</div><div class="stat-label">Referral Coins</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">❤️</div><div class="stat-value">{{ data.wishlist_count }}</div><div class="stat-label">Wishlist</div></div>
    </div>
    <div class="grid grid-2 gap-3">
      <div class="glass-card">
        <h4 style="margin-bottom:1rem">Active Subscription</h4>
        <div v-if="data.subscription">
          <div style="font-weight:600;margin-bottom:0.25rem">{{ data.subscription.package?.name }}</div>
          <div class="text-muted" style="font-size:0.85rem">{{ data.subscription.booking_count }} / {{ data.subscription.package?.max_bookings }} washes used</div>
          <div class="flex gap-2 items-center" style="margin-top:0.75rem">
            <span class="badge badge-emerald">Active</span>
            <span class="text-muted" style="font-size:0.8rem">Expires {{ formatDate(data.subscription.expires_at) }}</span>
          </div>
        </div>
        <div v-else class="text-muted" style="font-size:0.9rem">No active subscription. <router-link to="/customer/subscriptions">Browse packages</router-link></div>
      </div>
      <div class="glass-card">
        <h4 style="margin-bottom:1rem">Your Referral Code</h4>
        <div style="display:flex;align-items:center;gap:0.75rem;background:var(--bg-secondary);padding:0.75rem 1rem;border-radius:var(--radius-md);border:1px dashed var(--border-glow)">
          <span style="font-size:1.25rem;font-weight:700;color:var(--accent-cyan);letter-spacing:2px;flex:1">{{ data.referral_code || 'N/A' }}</span>
          <button class="btn btn-sm btn-outline" @click="copy">Copy</button>
        </div>
        <p class="text-muted" style="font-size:0.8rem;margin-top:0.5rem">Share with friends — earn 100 coins per referral!</p>
      </div>
    </div>
    <div class="glass-card" style="margin-top:1.5rem">
      <div class="flex justify-between items-center" style="margin-bottom:1rem"><h4>Upcoming Services</h4><router-link to="/customer/bookings" class="btn btn-sm btn-outline">View All</router-link></div>
      <div v-if="data.upcoming_services && data.upcoming_services.length">
        <div v-for="b in data.upcoming_services" :key="b.id" class="flex justify-between items-center" style="padding:0.75rem 0;border-bottom:1px solid var(--border-color)">
          <div>
            <div style="font-weight:500">{{ b.vehicle?.make_model }}</div>
            <div class="text-muted" style="font-size:0.8rem">{{ b.booking_date }} • {{ b.slot_time }}</div>
          </div>
          <span class="badge" :class="statusBadge(b.status)">{{ b.status }}</span>
        </div>
      </div>
      <div v-else class="text-muted" style="font-size:0.9rem;padding:1rem 0">No upcoming services. <router-link to="/customer/bookings">Book one now!</router-link></div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'CustomerDashboard',
  data() { return { data: {} }; },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    statusBadge(s) { return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan'; },
    copy() { navigator.clipboard?.writeText(this.data.referral_code); },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/customer/dashboard'); this.data = data; } catch (e) { console.error(e); }
  },
};
</script>
