<template>
  <div class="dashboard-container">
    <div style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">Super Admin Dashboard</h2>
      <p class="text-muted" style="font-size: 0.9rem;">Overview of platform performance and statistics.</p>
    </div>

    <!-- Cards Section -->
    <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">Key Metrics</h3>
    <div class="grid grid-5 gap-3" style="margin-bottom: 2rem;">
      <div class="stat-card" title="Gross Revenue">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">💰</div>
        <div class="stat-value">₹{{ (stats.gross_revenue || 0).toLocaleString() }}</div>
        <div class="stat-label">Gross Revenue</div>
      </div>
      <div class="stat-card" title="Total Bookings">
        <div class="stat-icon" style="background:rgba(59,130,246,0.15);color:var(--accent-blue)">📋</div>
        <div class="stat-value">{{ stats.total_bookings || 0 }}</div>
        <div class="stat-label">Total Bookings</div>
      </div>
      <div class="stat-card" title="Pending Bookings">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">⏳</div>
        <div class="stat-value">{{ stats.pending_bookings || 0 }}</div>
        <div class="stat-label">Pending Bookings</div>
      </div>
      <div class="stat-card" title="Completed / Cancelled">
        <div class="stat-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-violet)">✅</div>
        <div class="stat-value">
          <span style="color: var(--accent-emerald)">{{ stats.completed_bookings || 0 }}</span> / 
          <span style="color: var(--accent-rose)">{{ stats.cancelled_bookings || 0 }}</span>
        </div>
        <div class="stat-label">
          <span style="color: var(--accent-emerald)">Completed</span> / 
          <span style="color: var(--accent-rose)">Cancelled</span>
        </div>
      </div>
      <div class="stat-card" title="Total Subscriptions">
        <div class="stat-icon" style="background:rgba(236,72,153,0.15);color:var(--accent-pink)">⭐</div>
        <div class="stat-value">{{ stats.total_subscriptions || 0 }}</div>
        <div class="stat-label">Total Subscriptions</div>
      </div>
      <div class="stat-card" title="Active / Inactive Cities">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">🏙️</div>
        <div class="stat-value">
          <span style="color: var(--accent-emerald)">{{ stats.active_cities || 0 }}</span> / 
          <span style="color: var(--accent-rose)">{{ stats.inactive_cities || 0 }}</span>
        </div>
        <div class="stat-label">
          <span style="color: var(--accent-emerald)">Active</span> / 
          <span style="color: var(--accent-rose)">Inactive</span> Cities
        </div>
      </div>
      <div class="stat-card" title="Total Franchise">
        <div class="stat-icon" style="background:rgba(249,115,22,0.15);color:var(--accent-orange)">🏪</div>
        <div class="stat-value">{{ stats.total_franchise || 0 }}</div>
        <div class="stat-label">Total Franchise</div>
      </div>
      <div class="stat-card" title="Total Wallet Balance">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">💳</div>
        <div class="stat-value">₹{{ (stats.total_wallet_balance || 0).toLocaleString() }}</div>
        <div class="stat-label">Total Wallet Balance</div>
      </div>
      <div class="stat-card" title="Total Referrals">
        <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:var(--accent-indigo)">🔗</div>
        <div class="stat-value">{{ stats.total_referrals || 0 }}</div>
        <div class="stat-label">Total Referrals</div>
      </div>
      <div class="stat-card" title="Active / Inactive Partners">
        <div class="stat-icon" style="background:rgba(20,184,166,0.15);color:var(--accent-teal)">👥</div>
        <div class="stat-value">
          <span style="color: var(--accent-emerald)">{{ stats.active_franchise_partners || 0 }}</span> / 
          <span style="color: var(--accent-rose)">{{ stats.inactive_franchise_partners || 0 }}</span>
        </div>
        <div class="stat-label">
          <span style="color: var(--accent-emerald)">Active</span> / 
          <span style="color: var(--accent-rose)">Inactive</span> Partners
        </div>
      </div>
    </div>

    <!-- Analytics Section -->
    <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">Analytics</h3>
    <div class="grid grid-2 gap-4" style="margin-bottom: 2rem;">
      <div class="glass-card" style="padding: 1.5rem;">
        <h4 style="margin-bottom: 1rem;">Daily Revenue (Last 30 Days)</h4>
        <div class="chart-container">
          <Line v-if="loaded" :data="dailyRevenueData" :options="chartOptions" />
        </div>
      </div>
      <div class="glass-card" style="padding: 1.5rem;">
        <h4 style="margin-bottom: 1rem;">Monthly Revenue</h4>
        <div class="chart-container">
          <Bar v-if="loaded" :data="monthlyRevenueData" :options="chartOptions" />
        </div>
      </div>
      <div class="glass-card" style="padding: 1.5rem;">
        <h4 style="margin-bottom: 1rem;">Booking Analytics</h4>
        <div class="chart-container">
          <Doughnut v-if="loaded" :data="bookingAnalyticsData" :options="doughnutOptions" />
        </div>
      </div>
      <div class="glass-card" style="padding: 1.5rem;">
        <h4 style="margin-bottom: 1rem;">Services Wise Revenue</h4>
        <div class="chart-container">
          <Bar v-if="loaded" :data="serviceRevenueData" :options="chartOptions" />
        </div>
      </div>
      <div class="glass-card" style="padding: 1.5rem;">
        <h4 style="margin-bottom: 1rem;">City Wise Revenue</h4>
        <div class="chart-container">
          <Bar v-if="loaded" :data="cityRevenueData" :options="chartOptions" />
        </div>
      </div>
      <div class="glass-card" style="padding: 1.5rem;">
        <h4 style="margin-bottom: 1rem;">Franchise Wise Revenue (Top 10)</h4>
        <div class="chart-container">
          <Bar v-if="loaded" :data="franchiseRevenueData" :options="chartOptions" />
        </div>
      </div>
      <div class="glass-card" style="padding: 1.5rem; grid-column: 1 / -1;">
        <h4 style="margin-bottom: 1rem;">Partner Growth</h4>
        <div class="chart-container">
          <Line v-if="loaded" :data="partnerGrowthData" :options="chartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement);

export default {
  name: 'SuperAdminDashboard',
  components: { Bar, Line, Doughnut },
  data() {
    return {
      stats: {},
      loaded: false,
      
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      },
      doughnutOptions: {
        responsive: true,
        maintainAspectRatio: false,
      },

      dailyRevenueData: null,
      monthlyRevenueData: null,
      bookingAnalyticsData: null,
      serviceRevenueData: null,
      cityRevenueData: null,
      franchiseRevenueData: null,
      partnerGrowthData: null,
    };
  },
  async mounted() {
    try {
      const { data } = await axios.get('/api/super-admin/dashboard');
      this.stats = data;
      
      this.prepareCharts(data);
      this.loaded = true;
    } catch (e) {
      console.error(e);
    }
  },
  methods: {
    prepareCharts(data) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // Daily Revenue
      this.dailyRevenueData = {
        labels: data.daily_revenue.map(item => item.date),
        datasets: [{
          label: 'Revenue (₹)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          data: data.daily_revenue.map(item => item.revenue)
        }]
      };

      // Monthly Revenue
      this.monthlyRevenueData = {
        labels: data.monthly_revenue.map(item => monthNames[item.month - 1]),
        datasets: [{
          label: 'Revenue (₹)',
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          data: data.monthly_revenue.map(item => item.revenue)
        }]
      };

      // Booking Analytics
      this.bookingAnalyticsData = {
        labels: data.booking_analytics.map(item => item.status.toUpperCase()),
        datasets: [{
          backgroundColor: ['#f59e0b', '#06b6d4', '#10b981', '#f43f5e', '#8b5cf6'],
          data: data.booking_analytics.map(item => item.count)
        }]
      };

      // Service Revenue
      this.serviceRevenueData = {
        labels: data.service_revenue.map(item => item.service_name),
        datasets: [{
          label: 'Revenue (₹)',
          backgroundColor: 'rgba(139, 92, 246, 0.6)',
          data: data.service_revenue.map(item => item.revenue)
        }]
      };

      // City Revenue
      this.cityRevenueData = {
        labels: data.city_revenue.map(item => item.city),
        datasets: [{
          label: 'Revenue (₹)',
          backgroundColor: 'rgba(236, 72, 153, 0.6)',
          data: data.city_revenue.map(item => item.revenue)
        }]
      };

      // Franchise Revenue
      this.franchiseRevenueData = {
        labels: data.franchise_revenue.map(item => item.center),
        datasets: [{
          label: 'Revenue (₹)',
          backgroundColor: 'rgba(249, 115, 22, 0.6)',
          data: data.franchise_revenue.map(item => item.revenue)
        }]
      };

      // Partner Growth
      this.partnerGrowthData = {
        labels: data.partner_growth.map(item => monthNames[item.month - 1]),
        datasets: [{
          label: 'New Partners',
          backgroundColor: 'rgba(6, 182, 212, 0.2)',
          borderColor: 'rgba(6, 182, 212, 1)',
          data: data.partner_growth.map(item => item.count)
        }]
      };
    }
  }
};
</script>
<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}
.grid-5 {
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
}
</style>
