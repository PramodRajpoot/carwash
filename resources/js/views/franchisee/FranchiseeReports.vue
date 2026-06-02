<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h3>Financial Reports</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Review revenues, expenses, net profits, and platform royalties.</p>
      </div>
      
      <!-- Date Filters -->
      <div class="flex gap-2">
        <select v-model="filter.month" class="form-select" style="width: 140px;" @change="loadReport">
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
        <select v-model="filter.year" class="form-select" style="width: 110px;" @change="loadReport">
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>
      </div>
    </div>

    <!-- Financial Performance Cards -->
    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Calculating ledger balances...
    </div>

    <div v-else>
      <div class="grid grid-4 gap-3" style="margin-bottom: 2rem;">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">📈</div>
          <div class="stat-value">₹{{ report.total_income || 0 }}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(244, 63, 94, 0.15); color: var(--accent-rose);">📉</div>
          <div class="stat-value">₹{{ report.total_expense || 0 }}</div>
          <div class="stat-label">Total Expenses</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-amber);">🎟️</div>
          <div class="stat-value">₹{{ Math.round(report.royalty_fee || 0) }}</div>
          <div class="stat-label">Royalty Accrued</div>
        </div>
        <div class="stat-card" style="border-top: 3px solid var(--accent-emerald);">
          <div class="stat-icon" style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan);">💎</div>
          <div class="stat-value" :style="{ color: report.net_profit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }">
            ₹{{ Math.round(report.net_profit || 0) }}
          </div>
          <div class="stat-label">Net Profit (After Royalty)</div>
        </div>
      </div>

      <div class="grid grid-2 gap-3">
        <!-- Completed Orders list -->
        <div class="glass-card">
          <h4 style="margin-bottom: 1rem;">Revenue Sources (Completed Orders)</h4>
          <div v-if="report.bookings && report.bookings.length" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Date</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in report.bookings" :key="b.id">
                  <td>{{ b.vehicle?.make_model }}</td>
                  <td>{{ b.booking_date }}</td>
                  <td style="font-weight:600; color: var(--text-primary);">₹{{ b.total_price }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-muted" style="padding: 1rem 0; font-size: 0.9rem;">
            No revenue records for this period.
          </div>
        </div>

        <!-- Expenditures list -->
        <div class="glass-card">
          <h4 style="margin-bottom: 1rem;">Operating Expenses</h4>
          <div v-if="report.expenses && report.expenses.length" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in report.expenses" :key="e.id">
                  <td><span class="badge" :class="categoryBadge(e.category)">{{ e.category }}</span></td>
                  <td>{{ e.expense_date }}</td>
                  <td style="font-weight:600; color: var(--text-primary);">₹{{ e.amount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-muted" style="padding: 1rem 0; font-size: 0.9rem;">
            No expenditure records for this period.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'FranchiseeReports',
  data() {
    return {
      report: {},
      loading: true,
      filter: {
        month: new Date().getMonth() + 1 + '',
        year: '2026'
      }
    };
  },
  methods: {
    categoryBadge(c) {
      return { salary: 'badge-violet', chemical: 'badge-cyan', maintenance: 'badge-amber', other: 'badge-rose' }[c] || 'badge-cyan';
    },
    async loadReport() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/franchisee/reports', { params: this.filter });
        this.report = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    }
  },
  mounted() {
    this.loadReport();
  }
};
</script>
