<template>
  <div>
    <div class="grid grid-4 gap-3" style="margin-bottom:1.5rem">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">🔗</div><div class="stat-value">{{ stats.total_referrals }}</div><div class="stat-label">Total Referrals</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">✅</div><div class="stat-value" style="color:var(--accent-emerald)">{{ stats.confirmed }}</div><div class="stat-label">Confirmed</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">⏳</div><div class="stat-value" style="color:#ef4444">{{ stats.pending }}</div><div class="stat-label">Pending</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">🏆</div><div class="stat-value">{{ stats.top_referrers?.length || 0 }}</div><div class="stat-label">Top Referrers</div></div>
    </div>

    <div class="grid grid-2 gap-3">
      <!-- Top Referrers -->
      <div class="glass-card">
        <h4 style="margin-bottom:1rem">🏆 Top Referrers</h4>
        <div v-for="(u, i) in stats.top_referrers" :key="u.id" class="flex justify-between items-center" style="padding:0.6rem 0;border-bottom:1px solid var(--border-color)">
          <div class="flex gap-2 items-center">
            <div style="width:24px;font-weight:700;color:var(--text-muted)">{{ i + 1 }}</div>
            <div>
              <div style="font-weight:600;font-size:0.88rem">{{ u.name }}</div>
              <div class="text-muted" style="font-size:0.75rem">Code: {{ u.referral_code }}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:600;color:var(--accent-emerald)">{{ u.e_points }} pts</div>
            <div class="text-muted" style="font-size:0.75rem">{{ u.referrals_count }} referrals</div>
          </div>
        </div>
      </div>

      <!-- Referral List -->
      <div class="glass-card">
        <h4 style="margin-bottom:1rem">📊 Referral Details</h4>
        <div style="max-height:400px;overflow-y:auto">
          <div v-for="u in paginatedReferrals" :key="u.id" class="flex justify-between items-center" style="padding:0.6rem 0;border-bottom:1px solid var(--border-color)">
            <div>
              <div style="font-weight:600;font-size:0.88rem">{{ u.name }}</div>
              <div class="text-muted" style="font-size:0.75rem">Referred by: {{ u.referrer?.name }}</div>
            </div>
            <div style="text-align:right">
              <span class="badge" :class="u.epoint_status === 'confirmed' ? 'badge-emerald' : 'badge-rose'" style="font-size:0.72rem">{{ u.epoint_status }}</span>
              <div class="text-muted" style="font-size:0.72rem;margin-top:0.2rem">{{ u.total_completed }} services</div>
            </div>
          </div>
        </div>
        <div v-if="stats.referral_list && stats.referral_list.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
            <select v-model="itemsPerPage" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;" @change="currentPage = 1">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="75">75</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
            </select>
            <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">
              Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, stats.referral_list.length) }} of {{ stats.referral_list.length }}
            </span>
          </div>
          <div class="flex gap-1" v-if="totalPages > 1">
            <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
            <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'AdminReferrals',
  data() { return { stats: {}, loading: true, currentPage: 1, itemsPerPage: 10 }; },
  computed: {
    paginatedReferrals() {
      if (!this.stats.referral_list) return [];
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.stats.referral_list.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      if (!this.stats.referral_list) return 1;
      return Math.ceil(this.stats.referral_list.length / this.itemsPerPage) || 1;
    }
  },
  async mounted() {
    try { const { data } = await axios.get('/api/admin/referrals'); this.stats = data; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
