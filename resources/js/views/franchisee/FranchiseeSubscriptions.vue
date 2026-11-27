<template>
  <div>
    <div class="glass-card">
      <h4 style="margin-bottom:1.25rem;color:#ffffff;font-size:1.15rem;font-weight:700">📦 Active Customer Subscriptions</h4>
      <div v-if="loading" style="text-align:center;padding:2rem;color:#ffffff">Loading…</div>
      <div v-else-if="subscriptions.length === 0" style="text-align:center;padding:2rem;color:rgba(255,255,255,0.7)">No active subscriptions in your area.</div>
      <div v-else>
        <div v-for="s in subscriptions" :key="s.id" style="background:rgba(15, 23, 42, 0.75);border:1px solid rgba(0, 180, 255, 0.25);border-radius:12px;padding:1.25rem;margin-bottom:1rem;color:#ffffff">
          <div class="flex justify-between items-start" style="margin-bottom:0.75rem">
            <div>
              <div style="font-weight:700;font-size:1.15rem;color:#ffffff;margin-bottom:0.25rem">{{ s.customer?.name || 'Customer' }}</div>
              <div style="font-size:0.88rem;color:#ffffff">
                <span style="color:#ffffff;font-weight:500">{{ s.customer?.phone || 'No Phone' }}</span>
                <span style="margin:0 0.5rem;color:rgba(255,255,255,0.5)">•</span>
                <span style="color:#38bdf8;font-weight:600">{{ s.package?.name }}</span>
              </div>
            </div>
            <span class="badge badge-emerald" style="color:#ffffff;font-weight:700;font-size:0.75rem;padding:0.35rem 0.75rem;letter-spacing:0.5px">ACTIVE</span>
          </div>
          <div class="flex gap-3 items-center">
            <div style="flex:1">
              <div style="font-size:0.85rem;font-weight:600;color:#ffffff;margin-bottom:0.35rem">
                Progress: <span style="color:#38bdf8;font-weight:700">{{ getCompletedWashes(s) }}</span> / {{ s.package?.max_bookings }} washes
              </div>
              <div style="background:rgba(255,255,255,0.2);border-radius:4px;height:6px;overflow:hidden">
                <div :style="{ width: getProgressWidth(s), background:'var(--gradient-btn, #00B4FF)', height:'100%', borderRadius:'4px', transition: 'width 0.3s ease' }"></div>
              </div>
            </div>
          </div>
          <div style="font-size:0.85rem;color:#ffffff;margin-top:0.75rem">
            Expires: <span style="color:#ffffff;font-weight:600">{{ formatDate(s.expires_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'FranchiseeSubscriptions',
  data() {
    return {
      subscriptions: [],
      loading: true,
    };
  },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    getCompletedWashes(s) {
      if (s.completed_washes !== undefined && s.completed_washes !== null) {
        return Number(s.completed_washes);
      }
      return 0;
    },
    getProgressWidth(s) {
      const completed = this.getCompletedWashes(s);
      const max = Number(s.package?.max_bookings || 1);
      const pct = Math.min(100, Math.round((completed / max) * 100));
      return pct + '%';
    },
  },
  async mounted() {
    try {
      const { data } = await axios.get('/api/franchisee/subscriptions');
      this.subscriptions = data;
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  },
};
</script>
