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
      <div class="ref-modal-dialog">
        <!-- Top Gradient Accent -->
        <div class="ref-modal-stripe"></div>

        <!-- Header -->
        <div class="ref-modal-header">
          <div class="ref-header-info">
            <div class="ref-avatar">
              {{ getInitials(selectedReferral.name) }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="ref-title">Referred Person Details</h3>
                <span class="badge" :class="selectedReferral.epoint_status === 'confirmed' ? 'badge-emerald' : 'badge-amber'" style="font-size: 0.72rem; text-transform: capitalize;">
                  {{ selectedReferral.epoint_status }}
                </span>
              </div>
              <p class="ref-subtitle">
                Referral profile and connection tracking
              </p>
            </div>
          </div>
          <button class="close-x-btn" @click="selectedReferral = null" title="Close">✕</button>
        </div>

        <!-- Modal Body -->
        <div class="ref-modal-body">
          <!-- Overview Metrics Strip -->
          <div class="ref-metrics-bar">
            <div class="metric-item">
              <span class="metric-label">Referral Status</span>
              <span class="metric-val" :style="{ color: selectedReferral.epoint_status === 'confirmed' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }">
                {{ selectedReferral.epoint_status === 'confirmed' ? '● Confirmed' : '○ Pending' }}
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Completed Washes</span>
              <span class="metric-val">{{ selectedReferral.total_completed }} {{ selectedReferral.total_completed === 1 ? 'service' : 'services' }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">E-Points Earned</span>
              <span class="metric-val" style="color: var(--accent-emerald)">{{ selectedReferral.e_points || 0 }} pts</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Registration Date</span>
              <span class="metric-val" style="font-size: 0.85rem">{{ formatDate(selectedReferral.created_at) }}</span>
            </div>
          </div>

          <!-- Side-by-Side Cards Grid -->
          <div class="ref-cards-grid">
            <!-- Card 1: Referred Person -->
            <div class="ref-card referred-card">
              <div class="ref-card-header">
                <div class="ref-card-title cyan">
                  <span>👤</span> Referred Customer
                </div>
                <span class="badge" :class="selectedReferral.status === 'active' || !selectedReferral.status ? 'badge-emerald' : 'badge-rose'" style="font-size: 0.7rem; text-transform: capitalize;">
                  {{ selectedReferral.status || 'Active' }}
                </span>
              </div>

              <div class="ref-customer-name">
                {{ selectedReferral.name }}
              </div>

              <div class="ref-info-list">
                <div class="ref-info-row">
                  <span class="ref-info-label">📞 Mobile Number</span>
                  <span class="ref-info-value">{{ selectedReferral.phone || 'N/A' }}</span>
                </div>
                <div class="ref-info-row">
                  <span class="ref-info-label">✉️ Email Address</span>
                  <span class="ref-info-value cyan-link">{{ selectedReferral.email || 'N/A' }}</span>
                </div>
                <div class="ref-info-row">
                  <span class="ref-info-label">🏷️ Referral Code</span>
                  <span class="ref-code-pill cyan">{{ selectedReferral.referral_code || 'N/A' }}</span>
                </div>
                <div class="ref-info-row">
                  <span class="ref-info-label">📅 Registered</span>
                  <span class="ref-info-value">{{ formatDate(selectedReferral.created_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Card 2: Referred By (Sponsor) -->
            <div class="ref-card referrer-card">
              <div class="ref-card-header">
                <div class="ref-card-title amber">
                  <span>🤝</span> Referred By (Existing)
                </div>
                <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); font-size: 0.7rem;">
                  Sponsor
                </span>
              </div>

              <div v-if="selectedReferral.referrer">
                <div class="ref-customer-name">
                  {{ selectedReferral.referrer.name }}
                </div>

                <div class="ref-info-list">
                  <div class="ref-info-row">
                    <span class="ref-info-label">📞 Mobile Number</span>
                    <span class="ref-info-value">{{ selectedReferral.referrer.phone || 'N/A' }}</span>
                  </div>
                  <div class="ref-info-row">
                    <span class="ref-info-label">✉️ Email Address</span>
                    <span class="ref-info-value">{{ selectedReferral.referrer.email || 'N/A' }}</span>
                  </div>
                  <div class="ref-info-row">
                    <span class="ref-info-label">🏷️ Referral Code</span>
                    <span class="ref-code-pill amber">{{ selectedReferral.referrer.referral_code || 'N/A' }}</span>
                  </div>
                  <div class="ref-info-row">
                    <span class="ref-info-label">🆔 Customer ID</span>
                    <span class="ref-info-value text-muted">#{{ selectedReferral.referrer.id }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-muted" style="padding: 1rem 0; font-size: 0.85rem; text-align: center;">
                Referrer ID: {{ selectedReferral.referred_by }}<br>
                <span style="font-size: 0.75rem;">(No extended sponsor profile found)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="ref-modal-footer">
          <div class="text-muted" style="font-size: 0.78rem;">
            💡 E-Points confirm automatically upon customer's first completed wash service.
          </div>
          <button class="btn btn-sm btn-outline" @click="selectedReferral = null" style="padding: 0.4rem 1.25rem;">
            Close
          </button>
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
    getInitials(name) {
      if (!name) return '👤';
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
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

/* Custom modal dialog */
.ref-modal-dialog {
  width: 95%;
  max-width: 740px;
  background: linear-gradient(180deg, #182234 0%, #0F172A 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65), 0 0 35px rgba(6, 182, 212, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.ref-modal-stripe {
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald), var(--accent-amber));
}

.ref-modal-header {
  padding: 1.15rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ref-header-info {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.ref-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.2));
  border: 1px solid rgba(6, 182, 212, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: var(--accent-cyan);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
}

.ref-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.ref-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0.15rem 0 0 0;
}

.close-x-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}
.close-x-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.4);
}

.ref-modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: calc(88vh - 130px);
  overflow-y: auto;
}

.ref-modal-body::-webkit-scrollbar {
  width: 6px;
}
.ref-modal-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

/* Metrics bar */
.ref-metrics-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 0.75rem 1rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.metric-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.metric-val {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Cards grid */
.ref-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.ref-card {
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color 0.2s ease;
}

.ref-card.referred-card {
  border-left: 3px solid var(--accent-cyan);
}

.ref-card.referrer-card {
  border-left: 3px solid var(--accent-amber);
}

.ref-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.ref-card-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ref-card-title.cyan {
  color: var(--accent-cyan);
}

.ref-card-title.amber {
  color: var(--accent-amber);
}

.ref-customer-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: -0.2rem;
}

.ref-info-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.ref-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.83rem;
  padding: 0.15rem 0;
}

.ref-info-label {
  color: var(--text-secondary);
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.ref-info-value {
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
  word-break: break-all;
  max-width: 62%;
}

.ref-info-value.cyan-link {
  color: var(--accent-cyan);
  font-weight: 500;
}

.ref-code-pill {
  font-family: monospace;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  display: inline-block;
  letter-spacing: 0.05em;
}

.ref-code-pill.cyan {
  background: rgba(6, 182, 212, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.ref-code-pill.amber {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.ref-modal-footer {
  padding: 0.85rem 1.5rem;
  background: rgba(11, 17, 32, 0.5);
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

@media (max-width: 680px) {
  .ref-cards-grid {
    grid-template-columns: 1fr;
  }
  .ref-metrics-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  .ref-modal-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
