<template>
  <div>
    <!-- Stats -->
    <div class="grid grid-4 gap-3" style="margin-bottom:1.5rem">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">👥</div>
        <div class="stat-value">{{ data.total_referrals }}</div>
        <div class="stat-label">Total Referrals</div>
      </div>
      <div class="stat-card" style="border:1px solid var(--accent-emerald)">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">✅</div>
        <div class="stat-value" style="color:var(--accent-emerald)">{{ data.confirmed_referrals }}</div>
        <div class="stat-label">Confirmed</div>
      </div>
      <div class="stat-card" style="border:1px solid #ef4444">
        <div class="stat-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">⏳</div>
        <div class="stat-value" style="color:#ef4444">{{ data.pending_referrals }}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-violet)">💰</div>
        <div class="stat-value">{{ data.e_points }}</div>
        <div class="stat-label">Earned E-Points</div>
      </div>
    </div>

    <!-- Referral Code -->
    <div class="glass-card" style="margin-bottom:1.5rem">
      <h4 style="margin-bottom:0.75rem">🔗 Your Referral Code</h4>
      <div style="display:flex;align-items:center;gap:0.75rem;background:var(--bg-secondary);padding:0.75rem 1rem;border-radius:var(--radius-md);border:1px dashed var(--border-glow)">
        <span style="font-size:1.5rem;font-weight:800;color:var(--accent-cyan);letter-spacing:3px;flex:1">{{ data.referral_code }}</span>
        <button class="btn btn-sm btn-outline" @click="copy">Copy</button>
      </div>
      <p class="text-muted" style="font-size:0.82rem;margin-top:0.6rem">
        When a friend registers with your code:<br>
        • You earn <strong style="color:var(--accent-emerald)">10 E-Points (pending)</strong> instantly<br>
        • Points are <strong style="color:var(--accent-emerald)">confirmed</strong> after their first completed service
      </p>
    </div>

    <!-- Referral Tree -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">📊 Referral Network</h4>
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="!data.referred_users || data.referred_users.length === 0" class="text-muted" style="text-align:center;padding:2rem">
        No referrals yet. Share your code and start earning!
      </div>
      <div v-else>
        <div v-for="u in data.referred_users" :key="u.id" class="flex justify-between items-center" style="padding:0.75rem 0;border-bottom:1px solid var(--border-color)">
          <div class="flex gap-3 items-center">
            <div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem"
              :style="{ background: u.epoint_status === 'confirmed' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: u.epoint_status === 'confirmed' ? 'var(--accent-emerald)' : '#ef4444' }">
              {{ u.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div style="font-weight:600;font-size:0.9rem">{{ u.name }}</div>
              <div class="text-muted" style="font-size:0.78rem">Joined {{ formatDate(u.created_at) }}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.78rem;margin-bottom:0.2rem">
              <span class="badge" :class="u.epoint_status === 'confirmed' ? 'badge-emerald' : 'badge-rose'">
                {{ u.epoint_status === 'confirmed' ? '✅ Confirmed' : '⏳ Pending' }}
              </span>
            </div>
            <div class="text-muted" style="font-size:0.75rem">{{ u.completed_bookings }} service{{ u.completed_bookings !== 1 ? 's' : '' }} taken</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'CustomerReferrals',
  data() { return { data: {}, loading: true }; },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    copy() { navigator.clipboard?.writeText(this.data.referral_code); },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/customer/referrals'); this.data = data; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
