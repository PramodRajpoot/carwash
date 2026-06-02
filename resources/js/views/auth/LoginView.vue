<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);padding:2rem">
    <div class="glass-card" style="width:100%;max-width:420px">
      <div class="text-center" style="margin-bottom:2rem">
        <router-link to="/" class="navbar-logo" style="font-size:1.5rem">Carbon &amp; Hydro</router-link>
        <h3 style="margin-top:1rem">Welcome Back</h3>
        <p class="text-muted" style="font-size:0.85rem">Sign in to your account</p>
      </div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <form @submit.prevent="login">
        <div class="form-group"><label>Email</label><input v-model="form.email" type="email" class="form-input" placeholder="you@example.com" required></div>
        <div class="form-group"><label>Password</label><input v-model="form.password" type="password" class="form-input" placeholder="••••••••" required></div>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading" style="margin-top:0.5rem">{{ loading ? 'Signing in...' : 'Sign In' }}</button>
      </form>
      <p class="text-center text-muted" style="margin-top:1.5rem;font-size:0.85rem">Don't have an account? <router-link to="/register">Register</router-link></p>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'LoginView',
  data() { return { form: { email: '', password: '' }, error: '', loading: false }; },
  methods: {
    async login() {
      this.error = '';
      this.loading = true;
      try {
        const { data } = await axios.post('/api/auth/login', this.form);
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        const map = { customer: '/customer', franchisee: '/franchisee', admin: '/admin', super_admin: '/admin' };
        this.$router.push(map[data.user.role] || '/customer');
      } catch (e) {
        this.error = e.response?.data?.message || 'Login failed. Please check your credentials.';
      }
      this.loading = false;
    },
  },
};
</script>
