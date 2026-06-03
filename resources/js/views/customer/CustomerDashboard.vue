<template>
  <div>
    <!-- Stats Row -->
    <div class="grid grid-4 gap-3" style="margin-bottom:2rem">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">📦</div>
        <div class="stat-value">{{ data.booking_count }}</div>
        <div class="stat-label">Total Washes</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">✅</div>
        <div class="stat-value" style="color:var(--accent-emerald)">{{ data.e_points }}</div>
        <div class="stat-label">E-Points (Confirmed)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">⏳</div>
        <div class="stat-value" style="color:#ef4444">{{ data.pending_epoints }}</div>
        <div class="stat-label">E-Points (Pending)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">🔔</div>
        <div class="stat-value">{{ data.unread_notifications || 0 }}</div>
        <div class="stat-label">Notifications</div>
      </div>
    </div>

    <!-- First Booking Discount Banner -->
    <div v-if="data.first_booking_discount" class="glass-card" style="margin-bottom:1.5rem;border:1px solid var(--accent-emerald);background:rgba(16,185,129,0.08)">
      <div class="flex items-center gap-3">
        <span style="font-size:2rem">🎉</span>
        <div>
          <div style="font-weight:700;color:var(--accent-emerald)">10% Off Your First Booking!</div>
          <div class="text-muted" style="font-size:0.85rem">You registered with a referral code. Enjoy 10% discount on your first service booking.</div>
        </div>
      </div>
    </div>

    <!-- Coupons Banner -->
    <div v-if="data.active_coupons && data.active_coupons.length" style="margin-bottom:1.5rem">
      <div class="flex gap-3 overflow-x-auto pb-2" style="scrollbar-width:none">
        <div v-for="c in data.active_coupons" :key="c.id" class="glass-card flex-shrink-0" style="min-width:220px;border:1px dashed var(--accent-violet);padding:1rem">
          <div class="text-muted" style="font-size:0.75rem;margin-bottom:0.25rem">🎟️ OFFER</div>
          <div style="font-weight:700;font-size:1.1rem;color:var(--accent-violet);letter-spacing:1px">{{ c.code }}</div>
          <div class="text-muted" style="font-size:0.8rem;margin-top:0.25rem">
            {{ c.discount_type === 'percentage' ? c.discount_value + '% OFF' : '₹' + c.discount_value + ' OFF' }}
          </div>
          <button class="btn btn-sm btn-outline" style="margin-top:0.5rem;width:100%" @click="copy(c.code)">Copy Code</button>
        </div>
      </div>
    </div>

    <div class="grid grid-2 gap-3">
      <!-- Active Subscription -->
      <div class="glass-card">
        <h4 style="margin-bottom:1rem">📋 Active Subscription</h4>
        <div v-if="data.subscription">
          <div style="font-weight:600;margin-bottom:0.25rem">{{ data.subscription.package?.name }}</div>
          <div class="text-muted" style="font-size:0.85rem">{{ data.subscription.booking_count }} / {{ data.subscription.package?.max_bookings }} washes used</div>
          <div style="margin-top:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-sm);height:6px">
            <div :style="{ width: progressPct + '%', background: 'var(--gradient-btn)', borderRadius: 'var(--radius-sm)', height: '100%' }"></div>
          </div>
          <div class="flex gap-2 items-center" style="margin-top:0.75rem">
            <span class="badge badge-emerald">Active</span>
            <span class="text-muted" style="font-size:0.8rem">Expires {{ formatDate(data.subscription.expires_at) }}</span>
          </div>
        </div>
        <div v-else class="text-muted" style="font-size:0.9rem">No active subscription. <router-link to="/customer/subscriptions">Browse packages →</router-link></div>
      </div>

      <!-- Referral Code -->
      <div class="glass-card">
        <h4 style="margin-bottom:1rem">🔗 Your Referral Code</h4>
        <div style="display:flex;align-items:center;gap:0.75rem;background:var(--bg-secondary);padding:0.75rem 1rem;border-radius:var(--radius-md);border:1px dashed var(--border-glow)">
          <span style="font-size:1.25rem;font-weight:700;color:var(--accent-cyan);letter-spacing:2px;flex:1">{{ data.referral_code || 'N/A' }}</span>
          <button class="btn btn-sm btn-outline" @click="copy(data.referral_code)">Copy</button>
        </div>
        <p class="text-muted" style="font-size:0.8rem;margin-top:0.5rem">Share & earn 10 E-Points per successful referral!</p>
        <div class="flex gap-3" style="margin-top:0.75rem">
          <div style="text-align:center">
            <div style="font-size:1.1rem;font-weight:700;color:var(--accent-emerald)">{{ data.e_points }}</div>
            <div class="text-muted" style="font-size:0.72rem">Confirmed</div>
          </div>
          <div style="width:1px;background:var(--border-color)"></div>
          <div style="text-align:center">
            <div style="font-size:1.1rem;font-weight:700;color:#ef4444">{{ data.pending_epoints }}</div>
            <div class="text-muted" style="font-size:0.72rem">Pending</div>
          </div>
          <div style="width:1px;background:var(--border-color)"></div>
          <div style="text-align:center">
            <div style="font-size:1.1rem;font-weight:700;color:var(--accent-violet)">{{ (data.e_points || 0) + (data.pending_epoints || 0) }}</div>
            <div class="text-muted" style="font-size:0.72rem">Total</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Services -->
    <div class="glass-card" style="margin-top:1.5rem">
      <div class="flex justify-between items-center" style="margin-bottom:1rem">
        <h4>📅 Upcoming Services</h4>
        <router-link to="/customer/bookings" class="btn btn-sm btn-outline">View All</router-link>
      </div>
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
  computed: {
    progressPct() {
      if (!this.data.subscription?.package) return 0;
      return Math.round((this.data.subscription.booking_count / this.data.subscription.package.max_bookings) * 100);
    },
  },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    statusBadge(s) { return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan'; },
    copy(text) {
      if (text) { navigator.clipboard?.writeText(text); }
    },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/customer/dashboard'); this.data = data; } catch (e) { console.error(e); }
  },
};
</script>
