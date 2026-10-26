<template>
  <div>
    <div class="grid grid-4 gap-3" style="margin-bottom:1.5rem">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">🔗</div>
        <div class="stat-value">{{ stats.total_referrals || 0 }}</div>
        <div class="stat-label">Total Referrals</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">✅</div>
        <div class="stat-value" style="color:var(--accent-emerald)">{{ stats.confirmed || 0 }}</div>
        <div class="stat-label">Confirmed</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">⏳</div>
        <div class="stat-value" style="color:#ef4444">{{ stats.pending || 0 }}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">🏆</div>
        <div class="stat-value">{{ stats.top_referrers?.length || 0 }}</div>
        <div class="stat-label">Top Referrers</div>
      </div>
    </div>

    <div class="grid grid-2 gap-3">
      <!-- Top Referrers -->
      <div class="glass-card">
        <h4 style="margin-bottom:1rem">🏆 Top Referrers</h4>
        <div v-if="stats.top_referrers && stats.top_referrers.length > 0">
          <div v-for="(u, i) in stats.top_referrers" :key="u.id" class="flex justify-between items-center" style="padding:0.6rem 0.5rem;border-bottom:1px solid var(--border-color);border-radius:4px;">
            <div class="flex gap-2 items-center">
              <div style="width:24px;font-weight:700;color:var(--text-muted)">{{ i + 1 }}</div>
              <div>
                <div style="font-weight:600;font-size:0.88rem">{{ u.name }}</div>
                <div class="text-muted" style="font-size:0.75rem">Code: {{ u.referral_code || 'N/A' }}</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:600;color:var(--accent-emerald)">{{ u.e_points }} pts</div>
              <div class="text-muted" style="font-size:0.75rem">{{ u.referrals_count }} referrals</div>
            </div>
          </div>
        </div>
        <div v-else class="text-muted text-center" style="padding: 2rem 0;">
          No top referrers found.
        </div>
      </div>

      <!-- Referral List -->
      <div class="glass-card">
        <div class="flex justify-between items-center" style="margin-bottom:1rem">
          <h4 style="margin:0">📊 Referral Details</h4>
          <span class="text-muted" style="font-size:0.75rem">Click any row to view full details</span>
        </div>

        <div style="max-height:420px;overflow-y:auto">
          <div
            v-for="u in paginatedReferrals"
            :key="u.id"
            class="referral-row flex justify-between items-center"
            @click="openReferralDetails(u)"
            title="Click to view referred person details"
          >
            <div>
              <div style="font-weight:600;font-size:0.88rem;display:flex;align-items:center;gap:0.4rem;">
                {{ u.name }}
                <span v-if="u.phone" class="badge" style="font-size:0.68rem;padding:0.1rem 0.35rem;background:rgba(255,255,255,0.06);font-weight:normal;">
                  {{ u.phone }}
                </span>
              </div>
              <div class="text-muted" style="font-size:0.75rem;margin-top:0.2rem">
                Referred by: <strong style="color:var(--text-primary)">{{ u.referrer?.name || 'Unknown' }}</strong>
              </div>
            </div>
            <div style="text-align:right;display:flex;align-items:center;gap:0.75rem">
              <div>
                <span class="badge" :class="u.epoint_status === 'confirmed' ? 'badge-emerald' : 'badge-rose'" style="font-size:0.72rem;text-transform:capitalize">
                  {{ u.epoint_status }}
                </span>
                <div class="text-muted" style="font-size:0.72rem;margin-top:0.2rem">{{ u.total_completed }} completed</div>
              </div>
              <button class="btn btn-sm btn-outline view-btn" style="padding:0.2rem 0.5rem;font-size:0.72rem" @click.stop="openReferralDetails(u)">
                View
              </button>
            </div>
          </div>

          <div v-if="!stats.referral_list || stats.referral_list.length === 0" class="text-muted text-center" style="padding:2.5rem 0;">
            No referral records found.
          </div>
        </div>

        <div v-if="stats.referral_list && stats.referral_list.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem 0; flex-wrap: wrap; gap: 0.75rem; border-top: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-size: 0.82rem; color: var(--text-muted);">Rows:</label>
            <select v-model="itemsPerPage" class="form-select" style="width: 75px; padding: 0.2rem 1.8rem 0.2rem 0.4rem; font-size: 0.82rem;" @change="currentPage = 1">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <span class="text-muted" style="font-size: 0.8rem; margin-left: 0.3rem;">
              {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, stats.referral_list.length) }} of {{ stats.referral_list.length }}
            </span>
          </div>
          <div class="flex gap-1" v-if="totalPages > 1">
            <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
            <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Referral Details Modal -->
    <div v-if="selectedReferral" class="modal-overlay" @click.self="selectedReferral = null">
      <div class="modal-content" style="max-width: 540px; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 42px; height: 42px; border-radius: 50%; background: rgba(6,182,212,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: var(--accent-cyan);">
              👤
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem;">Referred Person Details</h3>
              <p class="text-muted" style="font-size: 0.8rem; margin: 0.15rem 0 0 0;">
                Complete profile and referral tracking details
              </p>
            </div>
          </div>
          <button class="btn btn-sm btn-outline" @click="selectedReferral = null" style="padding: 0.2rem 0.55rem; font-size: 0.85rem;" title="Close">✕</button>
        </div>

        <!-- Section 1: Referred Person's Info -->
        <div class="detail-box" style="margin-bottom: 1rem;">
          <div class="detail-header" style="color: var(--accent-cyan);">
            Referred Customer Details
          </div>
          <div class="grid grid-2 gap-2" style="font-size: 0.85rem;">
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Full Name</div>
              <strong style="color: var(--text-primary); font-size: 0.92rem;">{{ selectedReferral.name }}</strong>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Mobile Number</div>
              <strong style="color: var(--text-primary); font-size: 0.92rem;">{{ selectedReferral.phone || 'N/A' }}</strong>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Email Address</div>
              <span style="color: var(--accent-cyan); word-break: break-all; font-weight: 500;">{{ selectedReferral.email || 'N/A' }}</span>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Referral Code</div>
              <code style="background: rgba(255,255,255,0.08); padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 600; color: #38bdf8;">
                {{ selectedReferral.referral_code || 'N/A' }}
              </code>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Registration Date</div>
              <strong style="color: var(--text-primary);">{{ formatDate(selectedReferral.created_at) }}</strong>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Account Status</div>
              <span class="badge" :class="selectedReferral.status === 'active' || !selectedReferral.status ? 'badge-emerald' : 'badge-rose'" style="text-transform: capitalize; font-size: 0.72rem;">
                {{ selectedReferral.status || 'Active' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Section 2: Referred By (Existing Customer) -->
        <div class="detail-box" style="margin-bottom: 1rem;">
          <div class="detail-header" style="color: var(--accent-amber);">
            Referred By (Existing Customer)
          </div>
          <div v-if="selectedReferral.referrer" class="grid grid-2 gap-2" style="font-size: 0.85rem;">
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Customer Name</div>
              <strong style="color: var(--text-primary); font-size: 0.92rem;">{{ selectedReferral.referrer.name }}</strong>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Mobile Number</div>
              <strong style="color: var(--text-primary); font-size: 0.92rem;">{{ selectedReferral.referrer.phone || 'N/A' }}</strong>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Email Address</div>
              <span style="color: var(--text-secondary); word-break: break-all;">{{ selectedReferral.referrer.email || 'N/A' }}</span>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Referral Code</div>
              <code style="background: rgba(255,255,255,0.08); padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 600; color: var(--accent-amber);">
                {{ selectedReferral.referrer.referral_code || 'N/A' }}
              </code>
            </div>
          </div>
          <div v-else class="text-muted" style="font-size: 0.85rem;">
            Referrer ID: {{ selectedReferral.referred_by }} (No additional profile details found)
          </div>
        </div>

        <!-- Section 3: Referral Status & Points -->
        <div class="detail-box" style="margin-bottom: 1.25rem;">
          <div class="detail-header" style="color: var(--accent-emerald);">
            Referral Status & Performance
          </div>
          <div class="grid grid-3 gap-2 text-center">
            <div style="background: rgba(255,255,255,0.02); padding: 0.6rem 0.4rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
              <div class="text-muted" style="font-size: 0.72rem; margin-bottom: 0.25rem;">Referral Status</div>
              <span class="badge" :class="selectedReferral.epoint_status === 'confirmed' ? 'badge-emerald' : 'badge-rose'" style="font-size: 0.75rem; text-transform: capitalize;">
                {{ selectedReferral.epoint_status }}
              </span>
            </div>
            <div style="background: rgba(255,255,255,0.02); padding: 0.6rem 0.4rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
              <div class="text-muted" style="font-size: 0.72rem; margin-bottom: 0.25rem;">Completed Washes</div>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">
                {{ selectedReferral.total_completed }}
              </div>
            </div>
            <div style="background: rgba(255,255,255,0.02); padding: 0.6rem 0.4rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
              <div class="text-muted" style="font-size: 0.72rem; margin-bottom: 0.25rem;">E-Points Earned</div>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--accent-emerald);">
                {{ selectedReferral.e_points || 0 }} pts
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button class="btn btn-outline" @click="selectedReferral = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminReferrals',
  data() {
    return {
      stats: {},
      loading: true,
      currentPage: 1,
      itemsPerPage: 10,
      selectedReferral: null,
    };
  },
  computed: {
    paginatedReferrals() {
      if (!this.stats.referral_list) return [];
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.stats.referral_list.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      if (!this.stats.referral_list || this.stats.referral_list.length === 0) return 1;
      return Math.ceil(this.stats.referral_list.length / this.itemsPerPage) || 1;
    }
  },
  async mounted() {
    await this.fetchReferrals();
  },
  methods: {
    async fetchReferrals() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/admin/referrals');
        this.stats = data;
      } catch (e) {
        console.error('Error fetching referrals:', e);
      } finally {
        this.loading = false;
      }
    },
    openReferralDetails(referral) {
      this.selectedReferral = referral;
    },
    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return dateStr;
      }
    }
  }
};
</script>

<style scoped>
.referral-row {
  padding: 0.65rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s ease, transform 0.1s ease;
}
.referral-row:hover {
  background: rgba(255, 255, 255, 0.05);
}
.detail-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.9rem 1rem;
}
.detail-header {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  margin-bottom: 0.65rem;
}
</style>
