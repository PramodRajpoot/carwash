<template>
  <div>
    <!-- Balance Cards -->
    <div class="grid grid-3 gap-3" style="margin-bottom:2rem">
      <div class="stat-card" style="border:1px solid var(--accent-emerald)">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">✅</div>
        <div class="stat-value" style="color:var(--accent-emerald)">{{ balance.e_points }}</div>
        <div class="stat-label">Confirmed E-Points</div>
      </div>
      <div class="stat-card" style="border:1px solid #ef4444">
        <div class="stat-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">⏳</div>
        <div class="stat-value" style="color:#ef4444">{{ balance.pending_epoints }}</div>
        <div class="stat-label">Pending E-Points</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-violet)">💎</div>
        <div class="stat-value">{{ balance.total }}</div>
        <div class="stat-label">Total E-Points</div>
      </div>
    </div>

    <!-- Redemption -->
    <div class="glass-card" style="margin-bottom:1.5rem">
      <h4 style="margin-bottom:0.75rem">Redeem E-Points</h4>
      <div class="text-muted" style="font-size:0.85rem;margin-bottom:1rem">
        Minimum <strong style="color:var(--accent-cyan)">1000 confirmed E-Points</strong> required to redeem.
      </div>
      <div style="background:var(--bg-secondary);border-radius:var(--radius-md);height:8px;margin-bottom:0.5rem">
        <div :style="{ width: Math.min((balance.e_points / 1000) * 100, 100) + '%', background: balance.can_redeem ? 'var(--gradient-btn)' : 'linear-gradient(135deg,#ef4444,#f97316)', borderRadius: 'var(--radius-md)', height: '100%', transition: 'width 0.4s' }"></div>
      </div>
      <div class="flex justify-between" style="font-size:0.78rem;color:var(--text-muted);margin-bottom:1rem">
        <span>{{ balance.e_points }} pts</span><span>1000 pts</span>
      </div>
      <div v-if="balance.can_redeem" class="flex gap-2 items-end">
        <div style="flex:1">
          <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Amount to Redeem</label>
          <input type="number" v-model="redeemAmount" :min="1000" :max="balance.e_points" step="100" class="form-input" placeholder="1000" />
        </div>
        <button class="btn btn-primary" @click="redeem" :disabled="redeeming">{{ redeeming ? 'Redeeming…' : 'Redeem' }}</button>
      </div>
      <div v-else class="text-muted" style="font-size:0.85rem">You need {{ 1000 - balance.e_points }} more confirmed E-Points to unlock redemption.</div>
    </div>

    <!-- Transaction History -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">Transaction History</h4>
      <div v-if="loading" class="text-muted" style="padding:2rem;text-align:center">Loading…</div>
      <div v-else-if="transactions.length === 0" class="text-muted" style="padding:2rem;text-align:center">No transactions yet.</div>
      <div v-else>
        <div v-for="t in transactions" :key="t.id" class="flex justify-between items-center" style="padding:0.75rem 0;border-bottom:1px solid var(--border-color)">
          <div>
            <div style="font-weight:500;font-size:0.9rem">{{ t.description }}</div>
            <div class="flex gap-2" style="margin-top:0.25rem">
              <span class="badge" :class="t.status === 'confirmed' ? 'badge-emerald' : 'badge-rose'" style="font-size:0.7rem">{{ t.status }}</span>
              <span class="text-muted" style="font-size:0.78rem">{{ formatDate(t.created_at) }}</span>
            </div>
          </div>
          <div :style="{ fontWeight: 700, fontSize: '1rem', color: t.type === 'credit' ? 'var(--accent-emerald)' : '#ef4444' }">
            {{ t.type === 'credit' ? '+' : '-' }}{{ t.amount }} pts
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'CustomerWallet',
  data() { return { balance: {}, transactions: [], loading: true, redeemAmount: 1000, redeeming: false }; },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    async redeem() {
      if (this.redeemAmount < 1000 || this.redeemAmount > this.balance.e_points) return;
      this.redeeming = true;
      try {
        await axios.post('/api/wallet/redeem', { amount: this.redeemAmount });
        await this.load();
      } catch (e) { alert(e.response?.data?.message || 'Redemption failed.'); }
      finally { this.redeeming = false; }
    },
    async load() {
      const [bal, hist] = await Promise.all([axios.get('/api/wallet/balance'), axios.get('/api/wallet/history')]);
      this.balance = bal.data;
      this.transactions = hist.data.data || [];
      this.loading = false;
    },
  },
  mounted() { this.load(); },
};
</script>
