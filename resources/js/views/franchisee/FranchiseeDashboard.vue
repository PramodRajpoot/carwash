<template>
  <div>
    <!-- Royalty Alert -->
    <div v-if="data.royalty_alert" class="glass-card" style="margin-bottom:1.5rem;border:1px solid #ef4444;background:rgba(239,68,68,0.08)">
      <div class="flex items-center gap-3">
        <span style="font-size:1.8rem">⚠️</span>
        <div>
          <div style="font-weight:700;color:#ef4444">Royalty Payment Due Soon!</div>
          <div class="text-muted" style="font-size:0.85rem">
            Your royalty payment of <strong>₹{{ data.upcoming_royalty?.amount }}</strong> is due on <strong>{{ data.upcoming_royalty?.due_date }}</strong>. Please ensure timely payment to avoid service interruption.
          </div>
        </div>
      </div>
    </div>

    <!-- Revenue Tabs -->
    <div class="glass-card" style="margin-bottom:1.5rem">
      <h4 style="margin-bottom:1rem">💰 Revenue Overview</h4>
      <div class="flex gap-2" style="margin-bottom:1rem">
        <button v-for="p in periods" :key="p.key" class="btn btn-sm" :class="activePeriod === p.key ? 'btn-primary' : 'btn-ghost'" @click="activePeriod = p.key">{{ p.label }}</button>
      </div>
      <div class="grid grid-2 gap-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">💵</div>
          <div class="stat-value">₹{{ revenue[activePeriod]?.toLocaleString() || '0' }}</div>
          <div class="stat-label">{{ periods.find(p => p.key === activePeriod)?.label }} Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">📋</div>
          <div class="stat-value">{{ data.completed_orders || 0 }}</div>
          <div class="stat-label">Completed Orders</div>
        </div>
      </div>
    </div>

    <!-- Order Summary -->
    <div class="grid grid-3 gap-3" style="margin-bottom:1.5rem">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">🕐</div>
        <div class="stat-value">{{ data.pending_orders || 0 }}</div>
        <div class="stat-label">Pending Orders</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-violet)">📦</div>
        <div class="stat-value">{{ data.active_subscriptions || 0 }}</div>
        <div class="stat-label">Active Subscriptions</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">📊</div>
        <div class="stat-value">{{ data.total_orders || 0 }}</div>
        <div class="stat-label">Total Orders</div>
      </div>
    </div>

    <!-- Franchise Info -->
    <div class="glass-card">
      <h4 style="margin-bottom:0.75rem">🏪 My Franchise</h4>
      <div class="grid grid-2 gap-2">
        <div><span class="text-muted" style="font-size:0.8rem">Center Name</span><div style="font-weight:600">{{ data.franchisee?.center_name }}</div></div>
        <div><span class="text-muted" style="font-size:0.8rem">City</span><div style="font-weight:600">{{ data.franchisee?.city }}</div></div>
        <div><span class="text-muted" style="font-size:0.8rem">Royalty Rate</span><div style="font-weight:600">{{ data.franchisee?.royalty_percentage }}%</div></div>
        <div><span class="text-muted" style="font-size:0.8rem">Status</span><span class="badge badge-emerald" style="margin-top:0.2rem">{{ data.franchisee?.status }}</span></div>
        <div style="grid-column: span 2; margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
          <span class="text-muted" style="font-size:0.8rem">Assigned Slots</span>
          <div style="margin-top:0.4rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
            <span v-for="slot in data.assigned_slots" :key="slot" class="badge" style="background:var(--accent-indigo);color:#fff;padding:0.4rem 0.8rem;">{{ slot }}</span>
            <span v-if="!data.assigned_slots || data.assigned_slots.length === 0" class="text-muted" style="font-size:0.85rem">No slots assigned yet.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'FranchiseeDashboard',
  data() {
    return {
      data: {},
      activePeriod: 'monthly',
      periods: [
        { key: 'daily', label: 'Daily' },
        { key: 'weekly', label: 'Weekly' },
        { key: 'monthly', label: 'Monthly' },
        { key: 'yearly', label: 'Yearly' },
      ],
    };
  },
  computed: {
    revenue() {
      return this.data.revenue || { daily: 0, weekly: 0, monthly: 0, yearly: 0 };
    },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/franchisee/dashboard'); this.data = data; }
    catch (e) { console.error(e); }
  },
};
</script>
