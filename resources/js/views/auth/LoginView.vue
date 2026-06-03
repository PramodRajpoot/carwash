<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem">
    <div class="glass-card" style="width:100%;max-width:420px">
      <div style="text-align:center;margin-bottom:2rem">
        <router-link to="/" style="text-decoration:none"><h2 class="text-gradient" style="font-size:1.5rem">CleanAtDoorstep</h2></router-link>
        <p class="text-muted" style="font-size:0.9rem;margin-top:0.25rem">Sign in to your account</p>
      </div>

      <!-- Tab Toggle -->
      <div class="flex" style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:4px;margin-bottom:1.5rem">
        <button class="btn btn-sm" :class="mode === 'email' ? 'btn-primary' : 'btn-ghost'" style="flex:1" @click="mode = 'email'">📧 Email</button>
        <button class="btn btn-sm" :class="mode === 'otp' ? 'btn-primary' : 'btn-ghost'" style="flex:1" @click="mode = 'otp'">📱 OTP</button>
      </div>

      <!-- Email Login -->
      <div v-if="mode === 'email'" style="display:flex;flex-direction:column;gap:0.75rem">
        <input v-model="email" type="email" class="form-input" placeholder="Email address" id="login-email" />
        <input v-model="password" type="password" class="form-input" placeholder="Password" id="login-password" @keyup.enter="loginEmail" />
        <div v-if="error" style="color:#ef4444;font-size:0.85rem">{{ error }}</div>
        <button class="btn btn-primary w-full" @click="loginEmail" :disabled="loading">{{ loading ? 'Signing in…' : 'Sign In' }}</button>
      </div>

      <!-- OTP Login -->
      <div v-else style="display:flex;flex-direction:column;gap:0.75rem">
        <input v-model="phone" type="tel" class="form-input" placeholder="Mobile Number (e.g. 9999999999)" id="login-phone" />
        <div v-if="!otpSent" class="flex gap-2">
          <input v-model="phone" type="tel" class="form-input" style="display:none" />
          <button class="btn btn-primary w-full" @click="sendOtp" :disabled="loading || !phone">{{ loading ? 'Sending…' : 'Send OTP' }}</button>
        </div>
        <div v-else>
          <input v-model="otp" type="text" class="form-input" placeholder="Enter 4-digit OTP" maxlength="4" id="login-otp" />
          <div v-if="devOtp" class="text-muted" style="font-size:0.78rem;margin-top:0.25rem">Dev OTP: <strong style="color:var(--accent-cyan)">{{ devOtp }}</strong></div>
          <div v-if="error" style="color:#ef4444;font-size:0.85rem;margin-top:0.4rem">{{ error }}</div>
          <div class="flex gap-2" style="margin-top:0.75rem">
            <button class="btn btn-primary" style="flex:1" @click="verifyOtp" :disabled="loading">{{ loading ? 'Verifying…' : 'Verify & Login' }}</button>
            <button class="btn btn-ghost" @click="otpSent = false; otp = ''" style="flex:1">Resend</button>
          </div>
        </div>
      </div>

      <div style="text-align:center;margin-top:1.5rem">
        <span class="text-muted" style="font-size:0.85rem">Don't have an account? </span>
        <router-link to="/register" style="color:var(--accent-cyan);font-size:0.85rem;font-weight:600">Register</router-link>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'LoginView',
  data() { return { mode: 'email', email: '', password: '', phone: '', otp: '', otpSent: false, devOtp: null, loading: false, error: '' }; },
  methods: {
    async loginEmail() {
      this.error = ''; this.loading = true;
      try {
        const { data } = await axios.post('/api/auth/login', { email: this.email, password: this.password });
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        const map = { customer: '/customer', franchisee: '/franchisee', admin: '/admin', super_admin: '/super-admin' };
        this.$router.push(map[data.user.role] || '/customer');
      } catch (e) { this.error = e.response?.data?.message || 'Login failed.'; }
      finally { this.loading = false; }
    },
    async sendOtp() {
      this.loading = true; this.error = '';
      try {
        const { data } = await axios.post('/api/auth/otp/send', { phone: this.phone });
        this.otpSent = true;
        if (data.otp) this.devOtp = data.otp;
      } catch (e) { this.error = e.response?.data?.message || 'Failed to send OTP.'; }
      finally { this.loading = false; }
    },
    async verifyOtp() {
      this.error = ''; this.loading = true;
      try {
        const { data } = await axios.post('/api/auth/otp/verify', { phone: this.phone, otp: this.otp });
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        this.$router.push('/customer');
      } catch (e) { this.error = e.response?.data?.message || 'Invalid OTP.'; }
      finally { this.loading = false; }
    },
  },
};
</script>
