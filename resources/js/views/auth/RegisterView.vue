<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem">
    <div class="glass-card" style="width:100%;max-width:460px">
      <div style="text-align:center;margin-bottom:2rem">
        <router-link to="/" style="text-decoration:none"><h2 class="text-gradient" style="font-size:1.5rem">CleanAtDoorstep</h2></router-link>
        <p class="text-muted" style="font-size:0.9rem;margin-top:0.25rem">Create your free account</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <input v-model="form.name" type="text" class="form-input" placeholder="Full Name" id="reg-name" />
        <input v-model="form.email" type="email" class="form-input" placeholder="Email Address" id="reg-email" />
        <input v-model="form.phone" type="tel" class="form-input" placeholder="Mobile Number" id="reg-phone" />
        <input v-model="form.password" type="password" class="form-input" placeholder="Password (min 6 chars)" id="reg-password" />
        <input v-model="form.password_confirmation" type="password" class="form-input" placeholder="Confirm Password" id="reg-confirm" />
        <div style="position:relative">
          <input v-model="form.referred_by_code" type="text" class="form-input" placeholder="Referral Code (optional) — get 10% off!" id="reg-referral" style="text-transform:uppercase" />
          <div v-if="form.referred_by_code" style="font-size:0.75rem;color:var(--accent-emerald);margin-top:0.25rem">🎉 10% discount applied on your first booking!</div>
        </div>
        <div v-if="error" style="color:#ef4444;font-size:0.85rem">{{ error }}</div>
        <button class="btn btn-primary w-full" @click="register" :disabled="loading">{{ loading ? 'Creating Account…' : 'Create Account' }}</button>
      </div>

      <div style="text-align:center;margin-top:1.5rem">
        <span class="text-muted" style="font-size:0.85rem">Already have an account? </span>
        <router-link to="/login" style="color:var(--accent-cyan);font-size:0.85rem;font-weight:600">Sign In</router-link>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'RegisterView',
  data() {
    return {
      form: { name: '', email: '', phone: '', password: '', password_confirmation: '', referred_by_code: '' },
      loading: false, error: '',
    };
  },
  mounted() {
    // Pre-fill referral code from URL query param
    const ref = this.$route.query.ref;
    if (ref) this.form.referred_by_code = ref.toUpperCase();
  },
  methods: {
    async register() {
      this.error = ''; this.loading = true;
      try {
        const { data } = await axios.post('/api/auth/register', this.form);
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        this.$router.push('/customer');
      } catch (e) {
        const errs = e.response?.data?.errors;
        this.error = errs ? Object.values(errs).flat().join(' ') : (e.response?.data?.message || 'Registration failed.');
      } finally { this.loading = false; }
    },
  },
};
</script>
