<template>
  <div>
    <div style="margin-bottom: 2rem;">
      <h3>Platform Administrator Panel</h3>
      <p class="text-muted" style="font-size: 0.85rem;">System overview, global revenues, franchise counts, and system metrics.</p>
    </div>

    <!-- Stat Grid -->
    <div class="grid grid-4 gap-3" style="margin-bottom: 2rem;">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan);">👥</div>
        <div class="stat-value">{{ stats.total_users || 0 }}</div>
        <div class="stat-label">Total Accounts</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">💼</div>
        <div class="stat-value">{{ stats.franchisees_count || 0 }}</div>
        <div class="stat-label">Active Centers</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-violet);">📅</div>
        <div class="stat-value">{{ stats.upcoming_orders || 0 }}</div>
        <div class="stat-label">Active Wash Orders</div>
      </div>
      <div class="stat-card" style="border-top: 3px solid var(--accent-emerald);">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">💰</div>
        <div class="stat-value">₹{{ stats.total_income || 0 }}</div>
        <div class="stat-label">Platform Gross Revenue</div>
      </div>
    </div>

    <!-- Details Visual Sections -->
    <div class="grid grid-2 gap-3" style="margin-bottom: 2rem;">
      <div class="glass-card">
        <h4 style="margin-bottom: 1rem;">Wash Order Status Summary</h4>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div v-for="stat in stats.order_stats" :key="stat.status" class="flex justify-between items-center" style="padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
            <span class="badge" :class="statusBadge(stat.status)">{{ stat.status }}</span>
            <strong style="color: var(--text-primary); font-size: 1rem;">{{ stat.count }} orders</strong>
          </div>
          <div v-if="!stats.order_stats || !stats.order_stats.length" class="text-muted" style="padding: 1rem 0; text-align: center;">
            No service orders found on the system.
          </div>
        </div>
      </div>

      <div class="glass-card">
        <h4 style="margin-bottom: 1rem;">Monthly Platform Gross Earnings</h4>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div v-for="inc in stats.monthly_income" :key="inc.month" class="flex justify-between items-center" style="padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
            <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);">{{ formatMonth(inc.month) }}</span>
            <strong style="color: var(--accent-emerald); font-size: 1rem;">₹{{ inc.sum }}</strong>
          </div>
          <div v-if="!stats.monthly_income || !stats.monthly_income.length" class="text-muted" style="padding: 1rem 0; text-align: center;">
            No payment transaction records.
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card">
      <h4 style="margin-bottom: 1rem;">Admin Controls Checklist</h4>
      <div class="grid grid-3 gap-3">
        <div class="card text-center" style="cursor: pointer;" @click="$router.push('/admin/users')">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
          <h4 style="font-size: 0.95rem;">Users &amp; Roles Manager</h4>
          <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.25rem;">Generate user profiles, set roles, adjust active states.</p>
        </div>
        <div class="card text-center" style="cursor: pointer;" @click="$router.push('/admin/slots')">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🕐</div>
          <h4 style="font-size: 0.95rem;">Service Slots Manager</h4>
          <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.25rem;">Configure capacity caps per franchisee per date.</p>
        </div>
        <div class="card text-center" style="cursor: pointer;" @click="$router.push('/admin/coupons')">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎟️</div>
          <h4 style="font-size: 0.95rem;">Promo Coupon Codes</h4>
          <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.25rem;">Manage coupons, create fixed or percentage discounts.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'AdminDashboard',
  data() {
    return {
      stats: {}
    };
  },
  methods: {
    statusBadge(s) {
      return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan';
    },
    formatMonth(m) {
      if (!m) return '';
      const [year, month] = m.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
  },
  async mounted() {
    try {
      const { data } = await axios.get('/api/admin/dashboard');
      this.stats = data;
    } catch (e) {
      console.error(e);
    }
  }
};
</script>
