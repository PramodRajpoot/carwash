<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem">
    <div class="glass-card" style="width:100%;max-width:440px;padding:2rem;">
      <div style="text-align:center;margin-bottom:1.5rem">
        <router-link to="/" style="text-decoration:none;display:inline-block;margin-bottom:0.5rem">
          <img src="/logo.png" alt="CleanAt Doorstep" style="height:60px;max-width:220px;object-fit:contain;" />
        </router-link>
        <p class="text-muted" style="font-size:0.9rem;margin:0;">Create a new secure password for your account</p>
      </div>

      <!-- Success State -->
      <div v-if="successMsg" style="text-align:center;padding:1.5rem 0;">
        <div style="width:54px;height:54px;border-radius:50%;background:rgba(16,185,129,0.15);color:#10b981;font-size:1.75rem;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
          ✓
        </div>
        <h3 style="color:#10b981;font-size:1.2rem;margin-bottom:0.5rem;">Password Updated!</h3>
        <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:1.5rem;line-height:1.5;">
          Your password has been successfully updated in the database. Redirecting to login in {{ countdown }}s...
        </p>
        <router-link to="/login" class="btn btn-primary w-full" style="display:inline-block;text-align:center;text-decoration:none;">
          Go to Login Now
        </router-link>
      </div>

      <!-- Reset Form -->
      <form v-else @submit.prevent="resetPassword">
        <!-- Target Email Box -->
        <div v-if="email" style="background:rgba(255,255,255,0.04);border:1px solid var(--border-color);border-radius:8px;padding:0.75rem 1rem;margin-bottom:1.25rem;">
          <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:0.25rem;">
            Account Email
          </div>
          <div style="font-weight:600;color:var(--text-primary);font-size:0.92rem;display:flex;align-items:center;gap:0.4rem;">
            <span>✉️</span> {{ email }}
          </div>
        </div>
        <div v-else class="form-group" style="margin-bottom:1.25rem;">
          <label style="display:block;font-size:0.85rem;color:var(--text-muted);margin-bottom:0.35rem;">Email Address</label>
          <input v-model="email" type="email" class="form-input" placeholder="Enter your registered email" required />
          <div v-if="errors.email" style="color:#ef4444;font-size:0.8rem;margin-top:0.25rem;">{{ errors.email[0] }}</div>
        </div>

        <!-- New Password Field -->
        <div class="form-group" style="margin-bottom:1rem;">
          <label style="display:block;font-size:0.85rem;color:var(--text-muted);margin-bottom:0.35rem;">New Password</label>
          <div class="input-wrapper">
            <input 
              v-model="password" 
              :type="showPwd ? 'text' : 'password'" 
              class="form-input" 
              placeholder="Minimum 6 characters" 
              required 
              minlength="6"
            />
            <span class="pwd-toggle" @click="showPwd = !showPwd" title="Toggle visibility">
              <svg v-if="!showPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y2="23"/></svg>
            </span>
          </div>
          <div v-if="errors.password" style="color:#ef4444;font-size:0.8rem;margin-top:0.25rem;">{{ errors.password[0] }}</div>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group" style="margin-bottom:1.25rem;">
          <label style="display:block;font-size:0.85rem;color:var(--text-muted);margin-bottom:0.35rem;">Confirm New Password</label>
          <div class="input-wrapper">
            <input 
              v-model="password_confirmation" 
              :type="showPwdConfirm ? 'text' : 'password'" 
              class="form-input" 
              placeholder="Re-enter new password" 
              required 
              minlength="6"
            />
            <span class="pwd-toggle" @click="showPwdConfirm = !showPwdConfirm" title="Toggle visibility">
              <svg v-if="!showPwdConfirm" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y2="23"/></svg>
            </span>
          </div>
          <div v-if="password && password_confirmation" style="margin-top:0.35rem;font-size:0.8rem;">
            <span v-if="password === password_confirmation" style="color:#10b981;">✓ Passwords match</span>
            <span v-else style="color:#ef4444;">✗ Passwords do not match</span>
          </div>
          <div v-if="errors.password_confirmation" style="color:#ef4444;font-size:0.8rem;margin-top:0.25rem;">{{ errors.password_confirmation[0] }}</div>
        </div>

        <!-- General Error Alert -->
        <div v-if="error" class="alert alert-error" style="margin-bottom:1.25rem;font-size:0.85rem;padding:0.75rem 1rem;">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary w-full" 
          :disabled="loading || !token || (password_confirmation && password !== password_confirmation)"
          style="padding:0.75rem;font-weight:600;font-size:0.95rem;"
        >
          {{ loading ? 'Updating Password...' : 'Reset & Update Password' }}
        </button>

        <div style="text-align:center;margin-top:1.5rem">
          <router-link to="/login" style="color:var(--text-muted);font-size:0.85rem;text-decoration:none">
            ← Back to Login
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ResetPasswordView',
  data() {
    return {
      token: '',
      email: '',
      password: '',
      password_confirmation: '',
      showPwd: false,
      showPwdConfirm: false,
      loading: false,
      error: '',
      errors: {},
      successMsg: '',
      countdown: 3,
      countdownTimer: null
    };
  },
  mounted() {
    this.token = this.$route.query.token || '';
    this.email = this.$route.query.email || '';
    if (!this.token) {
      this.error = 'Invalid or missing password reset token. Please request a new link.';
    }
  },
  beforeUnmount() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  },
  methods: {
    async resetPassword() {
      if (!this.token) return;
      if (this.password !== this.password_confirmation) {
        this.error = 'Password and confirm password do not match.';
        return;
      }
      this.error = '';
      this.errors = {};
      this.successMsg = '';
      this.loading = true;

      try {
        const response = await axios.post('/api/auth/reset-password', {
          token: this.token,
          email: this.email,
          password: this.password,
          password_confirmation: this.password_confirmation
        });
        this.successMsg = response.data.message || 'Password has been successfully reset.';
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        delete axios.defaults.headers.common['Authorization'];
        this.countdown = 3;
        this.countdownTimer = setInterval(() => {
          this.countdown--;
          if (this.countdown <= 0) {
            clearInterval(this.countdownTimer);
            this.$router.push('/login');
          }
        }, 1000);
      } catch (e) {
        if (e.response?.status === 422) {
          this.errors = e.response.data.errors || {};
          if (!this.errors.email && !this.errors.password && !this.errors.password_confirmation) {
            this.error = e.response.data.message || 'Validation failed.';
          }
        } else {
          this.error = e.response?.data?.message || 'Failed to reset password. The link may have expired.';
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-wrapper .form-input {
  padding-right: 2.5rem;
}
.pwd-toggle {
  position: absolute;
  right: 12px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}
.pwd-toggle:hover {
  color: var(--accent-cyan);
}
</style>
