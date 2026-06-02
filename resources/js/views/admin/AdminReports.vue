<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h3>Platform Financial Performance</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Global gross volume, order numbers, and franchisee center royalty collections analysis.</p>
      </div>

      <!-- Filters Form -->
      <div class="flex gap-2 items-end" style="flex-wrap: wrap;">
        <div class="form-group" style="margin-bottom:0; width: 180px;">
          <label style="margin-bottom:0.25rem;">Franchisee Center</label>
          <select v-model="filter.franchisee_id" class="form-select" @change="loadReport">
            <option value="">-- All Centers --</option>
            <option v-for="c in centers" :key="c.id" :value="c.id">{{ c.center_name }}</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0; width: 140px;">
          <label style="margin-bottom:0.25rem;">Start Date</label>
          <input v-model="filter.start_date" type="date" class="form-input" @change="loadReport" />
        </div>
        <div class="form-group" style="margin-bottom:0; width: 140px;">
          <label style="margin-bottom:0.25rem;">End Date</label>
          <input v-model="filter.end_date" type="date" class="form-input" @change="loadReport" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Calculating aggregate sheets...
    </div>

    <div v-else>
      <!-- Main Metrics -->
      <div class="grid grid-3 gap-3" style="margin-bottom: 2rem;">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">📈</div>
          <div class="stat-value">₹{{ report.total_revenue || 0 }}</div>
          <div class="stat-label">Platform Gross Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan);">📋</div>
          <div class="stat-value">{{ report.total_bookings || 0 }}</div>
          <div class="stat-label">Completed Washes</div>
        </div>
        <div class="stat-card" style="border-top: 3px solid var(--accent-emerald);">
          <div class="stat-icon" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-violet);">💎</div>
          <div class="stat-value" style="color: var(--accent-emerald);">
            ₹{{ Math.round(report.total_royalty_earnings || 0) }}
          </div>
          <div class="stat-label">Royalty Accrued Collection</div>
        </div>
      </div>

      <!-- Center breakdowns table -->
      <div class="glass-card">
        <h4 style="margin-bottom: 1rem;">Franchisee Performance Sheets</h4>
        <div v-if="report.franchisee_breakdown && report.franchisee_breakdown.length" class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Center Hub</th>
                <th>Location City</th>
                <th>Washes Handled</th>
                <th>Gross Turnover</th>
                <th>Royalty Rate</th>
                <th>Accrued Royalties</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fb in report.franchisee_breakdown" :key="fb.franchisee_id">
                <td style="font-weight: 600; color: var(--text-primary);">
                  {{ fb.franchisee?.center_name || 'System Hub' }}
                </td>
                <td>{{ fb.franchisee?.city || '-' }}</td>
                <td>{{ fb.count }} washes completed</td>
                <td style="font-weight:600; color: var(--text-primary);">₹{{ fb.revenue }}</td>
                <td>{{ fb.franchisee?.royalty_percentage || 10 }}%</td>
                <td style="font-weight: 700; color: var(--accent-emerald);">₹{{ Math.round(fb.royalty) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-muted" style="padding: 1.5rem 0; text-align: center;">
          No center transaction metrics match the active filter criteria.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'AdminReports',
  data() {
    return {
      report: {},
      centers: [],
      loading: true,
      filter: {
        franchisee_id: '',
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substr(0, 10),
        end_date: new Date().toISOString().substr(0, 10)
      }
    };
  },
  methods: {
    async loadReport() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/admin/reports', { params: this.filter });
        this.report = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    async loadCenters() {
      try {
        const { data } = await axios.get('/api/centers');
        this.centers = data;
      } catch (e) {
        console.error(e);
      }
    }
  },
  async mounted() {
    await this.loadCenters();
    this.loadReport();
  }
};
</script>
