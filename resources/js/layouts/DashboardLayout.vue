<template>
  <div class="dash-layout">

    <aside class="dash-sidebar">
      <div class="dash-sidebar-logo">CleanAt Doorstep</div>
      <ul class="dash-sidebar-nav">
        <!-- Customer Sidebar -->
        <template v-if="role === 'customer'">
          <li><router-link to="/customer"><span class="nav-icon">📊</span> Dashboard</router-link></li>
          <li><router-link to="/customer/bookings"><span class="nav-icon">📅</span> Bookings</router-link></li>
          <li><router-link to="/customer/vehicles"><span class="nav-icon">🚗</span> My Vehicles</router-link></li>
          <li><router-link to="/customer/subscriptions"><span class="nav-icon">📦</span> Subscriptions</router-link></li>
          <li><router-link to="/customer/wallet"><span class="nav-icon">💰</span> E-Points Wallet</router-link></li>
          <li><router-link to="/customer/referrals"><span class="nav-icon">🔗</span> Referrals</router-link></li>
          <li><router-link to="/customer/offers"><span class="nav-icon">🎟️</span> Offers</router-link></li>
          <li><router-link to="/customer/support"><span class="nav-icon">🎫</span> Support</router-link></li>
          <li>
            <router-link to="/customer/notifications">
              <span class="nav-icon">🔔</span> Notifications
              <span v-if="unreadCount > 0" style="margin-left:auto;background:var(--accent-cyan);color:#000;font-size:0.7rem;padding:0.15rem 0.4rem;border-radius:999px;font-weight:700">{{ unreadCount }}</span>
            </router-link>
          </li>
          <li><router-link to="/customer/wishlist"><span class="nav-icon">❤️</span> Wishlist</router-link></li>
        </template>

        <!-- Franchisee Sidebar -->
        <template v-else-if="role === 'franchisee'">
          <li><router-link to="/franchisee"><span class="nav-icon">📊</span> Dashboard</router-link></li>
          <li><router-link to="/franchisee/orders"><span class="nav-icon">📋</span> Orders</router-link></li>
          <li><router-link to="/franchisee/subscriptions"><span class="nav-icon">📦</span> Subscriptions</router-link></li>
          <li><router-link to="/franchisee/royalty"><span class="nav-icon">💳</span> Royalty</router-link></li>
          <li><router-link to="/franchisee/expenses"><span class="nav-icon">💰</span> Expenses</router-link></li>
          <li><router-link to="/franchisee/reports"><span class="nav-icon">📈</span> Reports</router-link></li>
          <li><router-link to="/franchisee/offers"><span class="nav-icon">🎟️</span> Offers</router-link></li>
        </template>

        <!-- Admin Sidebar -->
        <template v-else-if="role === 'admin'">
          <li><router-link to="/admin"><span class="nav-icon">📊</span> Dashboard</router-link></li>
          <li><router-link to="/admin/franchisees"><span class="nav-icon">🏪</span> Franchisees</router-link></li>
          <li><router-link to="/admin/users"><span class="nav-icon">👥</span> Users</router-link></li>
          <li><router-link to="/admin/orders"><span class="nav-icon">📋</span> Orders</router-link></li>
          <li><router-link to="/admin/packages"><span class="nav-icon">📦</span> Packages</router-link></li>
          <li><router-link to="/admin/slots"><span class="nav-icon">🕐</span> Slots</router-link></li>
          <li><router-link to="/admin/coupons"><span class="nav-icon">🎟️</span> Coupons</router-link></li>
          <li><router-link to="/admin/referrals"><span class="nav-icon">🔗</span> Referrals</router-link></li>
          <li><router-link to="/admin/tickets"><span class="nav-icon">🎫</span> Support Tickets</router-link></li>
          <li><router-link to="/admin/partners"><span class="nav-icon">🤝</span> Partner Applications</router-link></li>
          <li><router-link to="/admin/blog"><span class="nav-icon">📝</span> Blog</router-link></li>
          <li><router-link to="/admin/reports"><span class="nav-icon">📈</span> Reports</router-link></li>
        </template>

        <!-- Super Admin Sidebar -->
        <template v-else-if="role === 'super_admin'">
          <li><router-link to="/super-admin"><span class="nav-icon">🛡️</span> Dashboard</router-link></li>
          <li><router-link to="/super-admin/admins"><span class="nav-icon">👤</span> Admin Management</router-link></li>
          <li><router-link to="/super-admin/settings"><span class="nav-icon">⚙️</span> Settings</router-link></li>
          <li style="padding:0.5rem 1.5rem;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);border-top:1px solid var(--border-color);margin-top:0.5rem">Platform</li>
          <li><router-link to="/super-admin/franchisees"><span class="nav-icon">🏪</span> Franchisees</router-link></li>
          <li><router-link to="/super-admin/users"><span class="nav-icon">👥</span> Users</router-link></li>
          <li><router-link to="/super-admin/orders"><span class="nav-icon">📋</span> Orders</router-link></li>
          <li><router-link to="/super-admin/packages"><span class="nav-icon">📦</span> Packages</router-link></li>
          <li><router-link to="/super-admin/coupons"><span class="nav-icon">🎟️</span> Coupons</router-link></li>
          <li><router-link to="/super-admin/referrals"><span class="nav-icon">🔗</span> Referrals</router-link></li>
          <li><router-link to="/super-admin/tickets"><span class="nav-icon">🎫</span> Support</router-link></li>
          <li><router-link to="/super-admin/partners"><span class="nav-icon">🤝</span> Partner Apps</router-link></li>
          <li><router-link to="/super-admin/blog"><span class="nav-icon">📝</span> Blog</router-link></li>
          <li><router-link to="/super-admin/reports"><span class="nav-icon">📈</span> Reports</router-link></li>
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
          <div class="user-menu-wrapper" style="position:relative">
            <div class="avatar avatar-btn" @click="showUserMenu = !showUserMenu" tabindex="0" @blur="delayCloseMenu">
              <img v-if="user.avatar" :src="'/' + user.avatar" class="avatar-img-header" alt="" />
              <span v-else>{{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}</span>
            </div>
            <transition name="menu-fade">
              <div v-if="showUserMenu" class="user-dropdown">
                <router-link :to="profileRoute" class="dropdown-item" @click.native="showUserMenu = false">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile
                </router-link>
                <button class="dropdown-item" @click="logout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </div>
            </transition>
          </div>
          <button class="theme-toggle-inline" @click="toggleTheme" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            {{ isDark ? '☀️' : '🌙' }}
          </button>
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
      unreadCount: 0,
      showUserMenu: false,
    };
  },
  computed: {
    role() { return this.user.role || 'customer'; },
    profileRoute() {
      const base = { customer: '/customer', franchisee: '/franchisee', admin: '/admin', super_admin: '/super-admin' };
      return (base[this.role] || '/customer') + '/profile';
    },
    pageTitle() {
      const n = this.$route.name || '';
      const map = {
        'customer-dashboard': 'Dashboard', 'customer-bookings': 'Bookings', 'customer-vehicles': 'My Vehicles',
        'customer-subscriptions': 'Subscriptions', 'customer-wallet': 'E-Points Wallet', 'customer-referrals': 'Referrals',
        'customer-offers': 'Offers & Coupons', 'customer-support': 'Help & Support', 'customer-notifications': 'Notifications',
        'customer-wishlist': 'Wishlist', 'customer-profile': 'My Profile',
        'franchisee-dashboard': 'Dashboard', 'franchisee-orders': 'Orders', 'franchisee-expenses': 'Expenses',
        'franchisee-reports': 'Reports', 'franchisee-royalty': 'Royalty Management', 'franchisee-subscriptions': 'Subscriptions',
        'franchisee-offers': 'Offers',
        'admin-dashboard': 'Dashboard', 'admin-users': 'Users', 'admin-orders': 'Orders', 'admin-slots': 'Slots',
        'admin-coupons': 'Coupons', 'admin-reports': 'Reports', 'admin-franchisees': 'Franchise Management',
        'admin-packages': 'Subscription Packages', 'admin-referrals': 'Referral Network', 'admin-blog': 'Blog',
        'admin-tickets': 'Support Tickets', 'admin-partners': 'Partner Applications',
        'superadmin-dashboard': 'Super Admin Dashboard', 'superadmin-admins': 'Admin Management',
        'superadmin-settings': 'Platform Settings',
      };
      return map[n] || n.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
    delayCloseMenu() {
      setTimeout(() => { this.showUserMenu = false; }, 200);
    },
    async logout() {
      this.showUserMenu = false;
      try { await axios.post('/api/auth/logout'); } catch (e) {}
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      this.$router.push('/login');
    },
    async loadUnread() {
      if (this.role === 'customer') {
        try { const { data } = await axios.get('/api/notifications'); this.unreadCount = data.unread_count || 0; }
        catch (e) {}
      }
    },
    updateLocalUser() {
      this.user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    },
  },
  mounted() {
    this.loadTheme();
    this.loadUnread();
    window.addEventListener('user-updated', this.updateLocalUser);
  },
  beforeUnmount() {
    window.removeEventListener('user-updated', this.updateLocalUser);
  },
};
</script>
