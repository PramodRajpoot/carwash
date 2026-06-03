<template>
  <div>
    <div class="grid grid-4 gap-3" style="margin-bottom:1.5rem">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">👤</div><div class="stat-value">{{ stats.total_customers }}</div><div class="stat-label">Customers</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">🏪</div><div class="stat-value">{{ stats.total_franchisees }}</div><div class="stat-label">Franchisees</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-violet)">🛡️</div><div class="stat-value">{{ stats.total_admins }}</div><div class="stat-label">Admins</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">📋</div><div class="stat-value">{{ stats.total_orders }}</div><div class="stat-label">Total Orders</div></div>
    </div>
    <div class="grid grid-3 gap-3">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">💰</div><div class="stat-value">₹{{ (stats.total_revenue || 0).toLocaleString() }}</div><div class="stat-label">Total Revenue</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">💎</div><div class="stat-value">{{ stats.total_wallet_credit }}</div><div class="stat-label">E-Points Issued</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-violet)">🔗</div><div class="stat-value">{{ stats.total_referrals }}</div><div class="stat-label">Total Referrals</div></div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'SuperAdminDashboard',
  data() { return { stats: {} }; },
  async mounted() {
    try { const { data } = await axios.get('/api/super-admin/dashboard'); this.stats = data; }
    catch (e) { console.error(e); }
  },
};
</script>
