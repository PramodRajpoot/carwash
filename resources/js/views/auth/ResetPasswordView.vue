<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem">
    <div class="glass-card" style="width:100%;max-width:420px">
      <div style="text-align:center;margin-bottom:2rem">
        <router-link to="/" style="text-decoration:none"><h2 class="text-gradient" style="font-size:1.5rem">CleanAtDoorstep</h2></router-link>
        <p class="text-muted" style="font-size:0.9rem;margin-top:0.25rem">Set your new password</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <div>
          <div class="input-wrapper">
            <input v-model="password" :type="showPwd ? 'text' : 'password'" class="form-input" placeholder="New Password" />
            <span class="pwd-toggle" @click="showPwd = !showPwd">
              <svg v-if="!showPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </span>
          </div>
          <div v-if="errors.password" style="color:#ef4444;font-size:0.85rem;margin-top:0.25rem">{{ errors.password[0] }}</div>
        </div>

        <div>
          <div class="input-wrapper">
            <input v-model="password_confirmation" :type="showPwdConfirm ? 'text' : 'password'" class="form-input" placeholder="Confirm Password" />
            <span class="pwd-toggle" @click="showPwdConfirm = !showPwdConfirm">
              <svg v-if="!showPwdConfirm" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </span>
          </div>
          <div v-if="errors.password_confirmation" style="color:#ef4444;font-size:0.85rem;margin-top:0.25rem">{{ errors.password_confirmation[0] }}</div>
        </div>

        <div v-if="error" style="color:#ef4444;font-size:0.85rem">{{ error }}</div>
        <div v-if="successMsg" style="color:#10b981;font-size:0.85rem">{{ successMsg }}</div>

        <button class="btn btn-primary w-full" @click="resetPassword" :disabled="loading || !token">{{ loading ? 'Resetting…' : 'Reset Password' }}</button>
      </div>

      <div style="text-align:center;margin-top:1.5rem">
        <router-link to="/login" style="color:var(--text-muted);font-size:0.85rem;text-decoration:none">Back to Login</router-link>
      </div>
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
      successMsg: ''
    };
  },
  mounted() {
    this.token = this.$route.query.token || '';
    this.email = this.$route.query.email || '';
    if (!this.token) {
      this.error = 'Invalid or missing password reset token.';
    }
  },
  methods: {
    async resetPassword() {
      if (!this.token) return;
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
        setTimeout(() => {
          this.$router.push('/login');
        }, 2000);
      } catch (e) {
        if (e.response?.status === 422) {
          this.errors = e.response.data.errors || {};
          // Only show general error if there are no specific field errors
          if (!this.errors.email && !this.errors.password) {
            this.error = e.response.data.message || 'Validation failed.';
          }
        } else {
          this.error = e.response?.data?.message || 'Failed to reset password. Please try again.';
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
