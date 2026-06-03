<template>
  <div>
    <!-- Royalty Summary -->
    <div class="grid grid-3 gap-3" style="margin-bottom:1.5rem">
      <div class="stat-card" :style="data.alert ? 'border:1px solid #ef4444' : ''">
        <div class="stat-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">💳</div>
        <div class="stat-value" :style="{ color: data.alert ? '#ef4444' : 'var(--text-primary)' }">
          {{ data.upcoming ? '₹' + data.upcoming.amount : '—' }}
        </div>
        <div class="stat-label">Next Due Amount</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">📅</div>
        <div class="stat-value" style="font-size:1rem">{{ data.upcoming?.due_date || '—' }}</div>
        <div class="stat-label">Due Date</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">📊</div>
        <div class="stat-value">{{ data.royalty_rate || 10 }}%</div>
        <div class="stat-label">Royalty Rate</div>
      </div>
    </div>

    <!-- Alert -->
    <div v-if="data.alert" class="glass-card" style="margin-bottom:1.5rem;border:1px solid #ef4444;background:rgba(239,68,68,0.08)">
      <div class="flex items-center gap-3">
        <span style="font-size:2rem">⚠️</span>
        <div>
          <div style="font-weight:700;color:#ef4444">Payment Due in {{ data.days_until_due }} day{{ data.days_until_due !== 1 ? 's' : '' }}!</div>
          <div class="text-muted" style="font-size:0.85rem">Please arrange your royalty payment of ₹{{ data.upcoming?.amount }} before {{ data.upcoming?.due_date }} to avoid service disruption.</div>
        </div>
      </div>
    </div>

    <!-- Payment History -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">Payment History</h4>
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="!data.royalties || data.royalties.length === 0" class="text-muted" style="text-align:center;padding:2rem">No royalty payment records yet.</div>
      <div v-else>
        <div v-for="r in data.royalties" :key="r.id" class="flex justify-between items-center" style="padding:0.75rem 0;border-bottom:1px solid var(--border-color)">
          <div>
            <div style="font-weight:600">₹{{ r.amount }}</div>
            <div class="text-muted" style="font-size:0.8rem">Due: {{ r.due_date }}</div>
          </div>
          <div style="text-align:right">
            <span class="badge" :class="{ 'badge-emerald': r.status === 'paid', 'badge-rose': r.status === 'overdue', 'badge-amber': r.status === 'pending' }">{{ r.status }}</span>
            <div v-if="r.paid_date" class="text-muted" style="font-size:0.75rem;margin-top:0.2rem">Paid: {{ r.paid_date }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'FranchiseeRoyalty',
  data() { return { data: {}, loading: true }; },
  async mounted() {
    try { const { data } = await axios.get('/api/franchisee/royalty'); this.data = data; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
