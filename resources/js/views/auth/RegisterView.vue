<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);padding:2rem">
    <div class="glass-card" style="width:100%;max-width:460px">
      <div class="text-center" style="margin-bottom:2rem">
        <router-link to="/" class="navbar-logo" style="font-size:1.5rem">Carbon &amp; Hydro</router-link>
        <h3 style="margin-top:1rem">Create Account</h3>
        <p class="text-muted" style="font-size:0.85rem">Join thousands of happy vehicle owners</p>
      </div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <form @submit.prevent="register">
        <div class="grid grid-2 gap-2">
          <div class="form-group"><label>Full Name *</label><input v-model="form.name" class="form-input" required></div>
          <div class="form-group"><label>Phone</label><input v-model="form.phone" class="form-input"></div>
        </div>
        <div class="form-group"><label>Email *</label><input v-model="form.email" type="email" class="form-input" required></div>
        <div class="grid grid-2 gap-2">
          <div class="form-group"><label>Password *</label><input v-model="form.password" type="password" class="form-input" required></div>
          <div class="form-group"><label>Confirm Password *</label><input v-model="form.password_confirmation" type="password" class="form-input" required></div>
        </div>
        <div class="form-group"><label>Referral Code (optional)</label><input v-model="form.referred_by_code" class="form-input" placeholder="e.g. DAVID100"></div>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading" style="margin-top:0.5rem">{{ loading ? 'Creating...' : 'Create Account' }}</button>
      </form>
      <p class="text-center text-muted" style="margin-top:1.5rem;font-size:0.85rem">Already have an account? <router-link to="/login">Sign In</router-link></p>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'RegisterView',
  data() { return { form: { name: '', email: '', phone: '', password: '', password_confirmation: '', referred_by_code: '' }, error: '', loading: false }; },
  methods: {
    async register() {
      this.error = '';
      this.loading = true;
      try {
        const { data } = await axios.post('/api/auth/register', this.form);
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        this.$router.push('/customer');
      } catch (e) {
        const errs = e.response?.data?.errors;
        this.error = errs ? Object.values(errs).flat().join(' ') : (e.response?.data?.message || 'Registration failed.');
      }
      this.loading = false;
    },
  },
};
</script>
