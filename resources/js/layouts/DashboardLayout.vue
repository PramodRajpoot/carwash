<template>
  <div class="dash-layout">
    <!-- Fixed top-right theme toggle -->
    <button class="theme-toggle-fixed" @click="toggleTheme" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
      {{ isDark ? '☀️' : '🌙' }}
    </button>

    <aside class="dash-sidebar">
      <div class="dash-sidebar-logo">Carbon &amp; Hydro</div>
      <ul class="dash-sidebar-nav">
        <template v-if="role === 'customer'">
          <li><router-link to="/customer"><span class="nav-icon">📊</span> Dashboard</router-link></li>
          <li><router-link to="/customer/bookings"><span class="nav-icon">📅</span> Bookings</router-link></li>
          <li><router-link to="/customer/vehicles"><span class="nav-icon">🚗</span> My Vehicles</router-link></li>
          <li><router-link to="/customer/subscriptions"><span class="nav-icon">📦</span> Subscriptions</router-link></li>
          <li><router-link to="/customer/wishlist"><span class="nav-icon">❤️</span> Wishlist</router-link></li>
          <li><router-link to="/customer/referrals"><span class="nav-icon">🎁</span> Referrals</router-link></li>
        </template>
        <template v-else-if="role === 'franchisee'">
          <li><router-link to="/franchisee"><span class="nav-icon">📊</span> Dashboard</router-link></li>
          <li><router-link to="/franchisee/orders"><span class="nav-icon">📋</span> Orders</router-link></li>
          <li><router-link to="/franchisee/expenses"><span class="nav-icon">💰</span> Expenses</router-link></li>
          <li><router-link to="/franchisee/reports"><span class="nav-icon">📈</span> Reports</router-link></li>
        </template>
        <template v-else>
          <li><router-link to="/admin"><span class="nav-icon">📊</span> Dashboard</router-link></li>
          <li><router-link to="/admin/users"><span class="nav-icon">👥</span> Users</router-link></li>
          <li><router-link to="/admin/orders"><span class="nav-icon">📋</span> Orders</router-link></li>
          <li><router-link to="/admin/slots"><span class="nav-icon">🕐</span> Slots</router-link></li>
          <li><router-link to="/admin/coupons"><span class="nav-icon">🎟️</span> Coupons</router-link></li>
          <li><router-link to="/admin/reports"><span class="nav-icon">📈</span> Reports</router-link></li>
        </template>
      </ul>
      <div style="padding:0 1.5rem;margin-top:auto;border-top:1px solid var(--border-color);padding-top:1rem">
        <router-link to="/" class="btn btn-ghost btn-sm w-full" style="justify-content:flex-start;gap:0.5rem">🏠 Website</router-link>
        <button class="btn btn-ghost btn-sm w-full" style="justify-content:flex-start;gap:0.5rem;margin-top:0.25rem" @click="logout">🚪 Logout</button>
      </div>
    </aside>
    <main class="dash-main">
      <div class="dash-header">
        <h1>{{ pageTitle }}</h1>
        <div class="user-info">
          <span class="text-secondary" style="font-size:0.85rem">{{ user.name }}</span>
          <div class="avatar">{{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}</div>
        </div>
      </div>
      <router-view />
    </main>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'DashboardLayout',
  data() {
    return {
      user: JSON.parse(localStorage.getItem('auth_user') || '{}'),
      isDark: true,
    };
  },
  computed: {
    role() { return this.user.role || 'customer'; },
    pageTitle() {
      const n = this.$route.name || '';
      if (n.includes('dashboard')) return 'Dashboard';
      const part = n.split('-').pop() || '';
      return part.charAt(0).toUpperCase() + part.slice(1);
    },
  },
  methods: {
    toggleTheme() {
      this.isDark = !this.isDark;
      const theme = this.isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('ch_theme', theme);
    },
    loadTheme() {
      const saved = localStorage.getItem('ch_theme') || 'dark';
      this.isDark = saved === 'dark';
      document.documentElement.setAttribute('data-theme', saved);
    },
    async logout() {
      try { await axios.post('/api/auth/logout'); } catch (e) {}
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      this.$router.push('/login');
    },
  },
  mounted() {
    this.loadTheme();
  },
};
</script>
