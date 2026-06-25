<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem">
    <div class="glass-card" style="width:100%;max-width:420px">
      <div style="text-align:center;margin-bottom:2rem">
        <router-link to="/" style="text-decoration:none"><h2 class="text-gradient" style="font-size:1.5rem">CleanAtDoorstep</h2></router-link>
        <p class="text-muted" style="font-size:0.9rem;margin-top:0.25rem">Sign in to your account</p>
      </div>

      <!-- Tab Toggle -->
      <div v-if="mode !== 'forgot'" class="flex" style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:4px;margin-bottom:1.5rem">
        <button class="btn btn-sm" :class="mode === 'email' ? 'btn-primary' : 'btn-ghost'" style="flex:1" @click="mode = 'email'">📧 Email</button>
        <button class="btn btn-sm" :class="mode === 'otp' ? 'btn-primary' : 'btn-ghost'" style="flex:1" @click="mode = 'otp'">📱 OTP</button>
      </div>

      <!-- Email Login -->
      <div v-if="mode === 'email'" style="display:flex;flex-direction:column;gap:0.75rem">
        <div>
          <input v-model="email" type="email" class="form-input" placeholder="Email address" id="login-email" />
          <div v-if="errors.email" style="color:#ef4444;font-size:0.85rem;margin-top:0.25rem">{{ errors.email[0] }}</div>
        </div>
        <div>
          <div class="input-wrapper">
            <input v-model="password" :type="showPwd ? 'text' : 'password'" class="form-input" placeholder="Password" id="login-password" @keyup.enter="loginEmail" />
            <span class="pwd-toggle" @click="showPwd = !showPwd">
              <svg v-if="!showPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </span>
          </div>
          <div v-if="errors.password" style="color:#ef4444;font-size:0.85rem;margin-top:0.25rem">{{ errors.password[0] }}</div>
        </div>
        <div style="text-align:right">
          <a href="#" @click.prevent="mode = 'forgot'; error=''; errors={}" style="color:var(--accent-cyan);font-size:0.85rem;text-decoration:none;font-weight:600">Forgot Password?</a>
        </div>
        <div v-if="error" style="color:#ef4444;font-size:0.85rem">{{ error }}</div>
        <button class="btn btn-primary w-full" @click="loginEmail" :disabled="loading">{{ loading ? 'Signing in…' : 'Sign In' }}</button>
      </div>

      <!-- OTP Login -->
      <div v-else-if="mode === 'otp'" style="display:flex;flex-direction:column;gap:0.75rem">
        <div>
          <input v-model="identifier" type="text" class="form-input" placeholder="Mobile Number or Email" id="login-identifier" />
          <div v-if="errors.identifier" style="color:#ef4444;font-size:0.85rem;margin-top:0.25rem">{{ errors.identifier[0] }}</div>
        </div>
        <div v-if="!otpSent" class="flex gap-2">
          <input v-model="identifier" type="text" class="form-input" style="display:none" />
          <button class="btn btn-primary w-full" @click="sendOtp(false)" :disabled="loading">
            <span v-if="loading" style="display:inline-block;width:1rem;height:1rem;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin 0.75s linear infinite;margin-right:0.5rem;vertical-align:middle;"></span>
            {{ loading ? 'Sending…' : 'Send OTP' }}
          </button>
        </div>
        <div v-else>
          <div style="margin-bottom:0.75rem;font-size:0.85rem;color:var(--text-muted);text-align:center;">
            OTP sent to your email/mobile.
          </div>
          <div>
            <input v-model="otp" type="text" class="form-input" placeholder="Enter 4-digit OTP" maxlength="4" id="login-otp" />
            <div v-if="errors.otp" style="color:#ef4444;font-size:0.85rem;margin-top:0.25rem">{{ errors.otp[0] }}</div>
          </div>
          <div v-if="error" style="color:#ef4444;font-size:0.85rem;margin-top:0.4rem">{{ error }}</div>
          <div class="flex gap-2" style="margin-top:0.75rem">
            <button class="btn btn-primary w-full" @click="verifyOtp" :disabled="loading">
              <span v-if="loading" style="display:inline-block;width:1rem;height:1rem;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin 0.75s linear infinite;margin-right:0.5rem;vertical-align:middle;"></span>
              {{ loading ? 'Verifying…' : 'Verify & Login' }}
            </button>
          </div>
          <div style="text-align:center;margin-top:1rem;font-size:0.85rem;" class="text-muted">
            <span v-if="countdown > 0">Resend OTP in <strong style="color:var(--text-primary)">{{ formatTime(countdown) }}</strong></span>
            <div v-else>
              <a href="#" @click.prevent="sendOtp(true)" :style="{ pointerEvents: (loading || resendCount >= 2) ? 'none' : 'auto', opacity: (loading || resendCount >= 2) ? 0.5 : 1, color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }">
                Resend OTP <span v-if="resendCount < 2">({{ 2 - resendCount }} left)</span>
              </a>
              <div v-if="resendCount >= 2" style="color:#ef4444;margin-top:0.25rem;">Maximum resend limit reached.</div>
            </div>
          </div>
          <div style="text-align:center;margin-top:0.75rem">
             <a href="#" @click.prevent="otpSent = false; otp = ''; countdown = 0; if(timer) clearInterval(timer);" style="color:var(--text-muted);font-size:0.8rem;text-decoration:underline;">Change Email/Mobile</a>
          </div>
        </div>
      </div>

      <!-- Forgot Password -->
      <div v-else-if="mode === 'forgot'" style="display:flex;flex-direction:column;gap:0.75rem">
        <div>
          <input v-model="email" type="email" class="form-input" placeholder="Enter your email address" id="forgot-email" />
          <div v-if="errors.email" style="color:#ef4444;font-size:0.85rem;margin-top:0.25rem">{{ errors.email[0] }}</div>
        </div>
        <div v-if="forgotSuccess" style="color:#10b981;font-size:0.85rem">{{ forgotSuccess }}</div>
        <div v-if="error" style="color:#ef4444;font-size:0.85rem">{{ error }}</div>
        <button class="btn btn-primary w-full" @click="sendForgotPassword" :disabled="loading">{{ loading ? 'Sending Reset Link…' : 'Send Reset Link' }}</button>
        <div style="text-align:center;margin-top:0.5rem">
          <button class="btn btn-ghost btn-sm" @click="mode = 'email'; error=''; errors={}; forgotSuccess=''">Back to Login</button>
        </div>
      </div>

      <div v-if="mode !== 'forgot'" style="margin:1.5rem 0;display:flex;align-items:center;gap:1rem;">
        <div style="flex:1;height:1px;background:var(--border-color);"></div>
        <span style="color:var(--text-muted);font-size:0.85rem;font-weight:500;">OR</span>
        <div style="flex:1;height:1px;background:var(--border-color);"></div>
      </div>

      <div v-if="mode !== 'forgot'">
        <a href="/api/auth/google" class="btn btn-ghost w-full" style="display:flex;align-items:center;justify-content:center;gap:0.75rem;border:1px solid var(--border-color);background:var(--bg-primary);text-decoration:none;color:var(--text-primary);font-weight:600;">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.275c0-.853-.07-1.673-.21-2.46H12v4.545h6.583c-.292 1.517-1.168 2.804-2.455 3.664v2.993h3.948c2.316-2.128 3.66-5.263 3.414-8.742z"/><path fill="#34A853" d="M12 24c3.24 0 5.956-1.077 7.948-2.915l-3.948-2.993c-1.08.723-2.457 1.15-3.978 1.15-3.056 0-5.642-2.062-6.57-4.838H1.36v3.106C3.332 21.436 7.37 24 12 24z"/><path fill="#FBBC05" d="M5.43 14.404a7.172 7.172 0 0 1-.38-2.404c0-.837.144-1.65.394-2.404V6.49H1.359A11.968 11.968 0 0 0 0 12c0 1.94.464 3.784 1.285 5.43l4.145-3.026z"/><path fill="#EA4335" d="M12 4.792c1.764 0 3.348.608 4.595 1.796l3.447-3.447C17.95 1.213 15.234 0 12 0 7.37 0 3.332 2.564 1.36 6.49l4.085 3.106C6.377 6.842 8.944 4.792 12 4.792z"/></svg>
          Continue with Google
        </a>
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
  data() { return { mode: 'email', email: '', password: '', identifier: '', otp: '', otpSent: false, loading: false, error: '', errors: {}, showPwd: false, forgotSuccess: '', resendCount: 0, countdown: 0, timer: null }; },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
  },
  methods: {
    formatTime(seconds) {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    },
    startCountdown() {
      this.countdown = 120;
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          clearInterval(this.timer);
        }
      }, 1000);
    },
    async loginEmail() {
      this.error = ''; this.errors = {}; this.loading = true;
      try {
        const { data } = await axios.post('/api/auth/login', { email: this.email, password: this.password });
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        const map = { customer: '/customer', franchisee: '/franchisee', admin: '/admin', super_admin: '/super-admin' };
        this.$router.push(map[data.user.role] || '/customer');
      } catch (e) {
        if (e.response?.status === 422) {
          this.errors = e.response.data.errors || {};
        } else {
          this.error = e.response?.data?.message || 'Login failed.';
        }
      }
      finally { this.loading = false; }
    },
    async sendOtp(isResend = false) {
      if (isResend && this.resendCount >= 2) return;
      this.loading = true; this.error = ''; this.errors = {};
      try {
        const { data } = await axios.post('/api/auth/otp/send', { identifier: this.identifier });
        this.otpSent = true;
        if (isResend) {
          this.resendCount++;
        }
        this.startCountdown();
      } catch (e) {
        if (e.response?.status === 422) {
          this.errors = e.response.data.errors || {};
        } else {
          this.error = e.response?.data?.message || 'Failed to send OTP.';
        }
      }
      finally { this.loading = false; }
    },
    async verifyOtp() {
      this.error = ''; this.errors = {}; this.loading = true;
      try {
        const { data } = await axios.post('/api/auth/otp/verify', { identifier: this.identifier, otp: this.otp });
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        this.$router.push('/customer');
      } catch (e) {
        if (e.response?.status === 422) {
          this.errors = e.response.data.errors || {};
        } else {
          this.error = e.response?.data?.message || 'Invalid OTP.';
        }
      }
      finally { this.loading = false; }
    },
    async sendForgotPassword() {
      this.error = ''; this.errors = {}; this.forgotSuccess = ''; this.loading = true;
      try {
        await axios.post('/api/auth/forgot-password', { email: this.email });
        this.forgotSuccess = 'Password reset link sent to your email.';
      } catch (e) {
        if (e.response?.status === 422) {
          this.errors = e.response.data.errors || {};
        } else {
          this.error = e.response?.data?.message || 'Failed to send reset link. Please try again later.';
        }
      }
      finally { this.loading = false; }
    },
  },
};
</script>
<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
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
