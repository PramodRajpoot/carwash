<template>
  <div>
    <!-- Fixed top-right theme toggle -->
    <button class="theme-toggle-fixed" @click="toggleTheme" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
      {{ isDark ? '☀️' : '🌙' }}
    </button>

    <div class="notification-strip">
      🚗 Book your first wash &amp; get <strong>10% OFF</strong> — Use code <strong>WELCOME10</strong> | India's #1 Doorstep Car Cleaning Service
    </div>
    <nav class="navbar">
      <div class="navbar-inner">
        <router-link to="/" class="navbar-logo">CleanAtDoorstep</router-link>
        <button class="mobile-toggle" @click="menuOpen = !menuOpen">☰</button>
        <ul class="navbar-links" :class="{ open: menuOpen }">
          <li><router-link to="/" @click="menuOpen = false">Home</router-link></li>
          <li><router-link to="/about" @click="menuOpen = false">About Us</router-link></li>
          <li><router-link to="/services" @click="menuOpen = false">Services</router-link></li>
          <li><router-link to="/centers" @click="menuOpen = false">Our Centers</router-link></li>
          <li><router-link to="/become-partner" @click="menuOpen = false">Become Partner</router-link></li>
          <li><router-link to="/blog" @click="menuOpen = false">Blog</router-link></li>
          <li><router-link to="/contact" @click="menuOpen = false">Contact</router-link></li>
          <li v-if="!isLoggedIn"><router-link to="/login" class="btn btn-primary btn-sm" @click="menuOpen = false">Login</router-link></li>
          <li v-else><router-link :to="dashboardPath" class="btn btn-primary btn-sm" @click="menuOpen = false">Dashboard</router-link></li>
        </ul>
      </div>
    </nav>
    <router-view />
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h4 class="text-gradient">CleanAtDoorstep</h4>
            <p class="text-muted" style="font-size:0.9rem;line-height:1.7">India's premium doorstep vehicle cleaning &amp; detailing service. We bring the shine to your doorstep using eco-friendly waterless technology.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><router-link to="/about">About Us</router-link></li>
              <li><router-link to="/services">Services</router-link></li>
              <li><router-link to="/centers">Our Centers</router-link></li>
              <li><router-link to="/blog">Blog</router-link></li>
              <li><router-link to="/contact">Contact</router-link></li>
              <li><router-link to="/terms">Terms &amp; Conditions</router-link></li>
              <li><router-link to="/privacy">Privacy Policy</router-link></li>
            </ul>
          </div>
          <div>
            <h4>Services</h4>
            <ul>
              <li><a href="#">Hatchback Wash</a></li>
              <li><a href="#">Sedan Detailing</a></li>
              <li><a href="#">SUV Premium Wash</a></li>
              <li><a href="#">Bus &amp; Fleet Cleaning</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li><span class="text-muted" style="font-size:0.9rem">📞 +91 99999 99999</span></li>
              <li><span class="text-muted" style="font-size:0.9rem">✉️ info@cleanatdoorstep.in</span></li>
              <li><span class="text-muted" style="font-size:0.9rem">📍 Mumbai, India</span></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          © {{ new Date().getFullYear() }} CleanAtDoorstep. All rights reserved. | <router-link to="/terms" style="color:var(--text-muted)">Terms</router-link> · <router-link to="/privacy" style="color:var(--text-muted)">Privacy</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'LandingLayout',
  data() {
    return {
      menuOpen: false,
      isDark: true,
    };
  },
  computed: {
    isLoggedIn() { return !!localStorage.getItem('auth_token'); },
    dashboardPath() {
      const u = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const map = { customer: '/customer', franchisee: '/franchisee', admin: '/admin', super_admin: '/admin' };
      return map[u.role] || '/customer';
    }
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
  },
  mounted() {
    this.loadTheme();
  },
};
</script>
