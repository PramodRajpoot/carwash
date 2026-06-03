<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <h3>Franchise Management</h3>
    </div>
    <div class="glass-card">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="franchisees.length === 0" class="text-muted" style="text-align:center;padding:2rem">No franchise partners yet.</div>
      <div v-else>
        <div v-for="f in franchisees" :key="f.id" class="glass-card" style="margin-bottom:0.75rem">
          <div class="flex justify-between items-start" style="margin-bottom:0.75rem">
            <div>
              <div style="font-weight:700;font-size:1rem">{{ f.center_name }}</div>
              <div class="text-muted" style="font-size:0.82rem">{{ f.city }} • {{ f.user?.name }} • {{ f.user?.phone }}</div>
            </div>
            <div class="flex gap-2 items-center">
              <span class="badge" :class="{ 'badge-emerald': f.status === 'active', 'badge-rose': f.status === 'inactive', 'badge-amber': f.status === 'pending' }">{{ f.status }}</span>
              <select v-model="f.status" class="form-input" style="padding:0.25rem 0.5rem;font-size:0.8rem;width:auto" @change="updateStatus(f)">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div class="grid grid-3 gap-3">
            <div style="text-align:center">
              <div style="font-size:1.2rem;font-weight:700;color:var(--accent-cyan)">{{ f.total_orders || 0 }}</div>
              <div class="text-muted" style="font-size:0.75rem">Total Orders</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:1.2rem;font-weight:700;color:var(--accent-emerald)">{{ f.completed_orders || 0 }}</div>
              <div class="text-muted" style="font-size:0.75rem">Completed</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:1.2rem;font-weight:700;color:var(--accent-violet)">₹{{ (f.total_revenue || 0).toLocaleString() }}</div>
              <div class="text-muted" style="font-size:0.75rem">Revenue</div>
            </div>
          </div>
          <div class="flex gap-3" style="margin-top:0.75rem;font-size:0.8rem;color:var(--text-muted)">
            <span>📍 {{ f.address }}</span>
            <span>💰 Royalty: {{ f.royalty_percentage }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'AdminFranchisees',
  data() { return { franchisees: [], loading: true }; },
  methods: {
    async updateStatus(f) {
      await axios.put(`/api/admin/franchisees/${f.id}/status`, { status: f.status });
    },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/admin/franchisees'); this.franchisees = data; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
