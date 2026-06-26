<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem">
    <div class="glass-card" style="width:100%;max-width:460px">
      <div style="text-align:center;margin-bottom:2rem">
        <router-link to="/" style="text-decoration:none"><h2 class="text-gradient" style="font-size:1.5rem">CleanAtDoorstep</h2></router-link>
        <p class="text-muted" style="font-size:0.9rem;margin-top:0.25rem">Create your free account</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <!-- Full Name -->
        <div>
          <label class="reg-label" for="reg-name">Full Name <span class="req-star">*</span></label>
          <input v-model="form.name" type="text" class="form-input" :class="{ 'input-error': errors.name }" placeholder="Full Name" id="reg-name" @blur="validateName" @input="clearError('name')" />
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <!-- Email -->
        <div>
          <label class="reg-label" for="reg-email">Email Address <span class="req-star">*</span></label>
          <input v-model="form.email" type="email" class="form-input" :class="{ 'input-error': errors.email }" placeholder="Email Address" id="reg-email" @blur="validateEmail" @input="clearError('email')" />
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        </div>

        <!-- Mobile Number -->
        <div>
          <label class="reg-label" for="reg-phone">Mobile Number <span class="req-star">*</span></label>
          <input v-model="form.phone" type="tel" class="form-input" :class="{ 'input-error': errors.phone }" placeholder="Mobile Number" id="reg-phone" @blur="validatePhone" @input="filterPhone" maxlength="10" />
          <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
        </div>

        <!-- Password -->
        <div>
          <label class="reg-label" for="reg-password">Password <span class="req-star">*</span></label>
          <div class="input-wrapper">
            <input v-model="form.password" :type="showPwd.main ? 'text' : 'password'" class="form-input" :class="{ 'input-error': errors.password }" placeholder="Password (min 6 chars)" id="reg-password" @blur="validatePassword" @input="clearError('password')" />
            <span class="pwd-toggle" @click="showPwd.main = !showPwd.main">
              <svg v-if="!showPwd.main" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </span>
          </div>
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <!-- Confirm Password -->
        <div>
          <label class="reg-label" for="reg-confirm">Confirm Password <span class="req-star">*</span></label>
          <div class="input-wrapper">
            <input v-model="form.password_confirmation" :type="showPwd.confirm ? 'text' : 'password'" class="form-input" :class="{ 'input-error': errors.password_confirmation }" placeholder="Confirm Password" id="reg-confirm" @blur="validateConfirmPassword" @input="clearError('password_confirmation')" />
            <span class="pwd-toggle" @click="showPwd.confirm = !showPwd.confirm">
              <svg v-if="!showPwd.confirm" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </span>
          </div>
          <span v-if="errors.password_confirmation" class="field-error">{{ errors.password_confirmation }}</span>
        </div>

        <!-- Referral Code (Optional) -->
        <div style="position:relative">
          <label class="reg-label" for="reg-referral">Referral Code <span class="opt-label">(optional)</span></label>
          <input v-model="form.referred_by_code" type="text" class="form-input" placeholder="Referral Code — get 10% off!" id="reg-referral" style="text-transform:uppercase" />
          <div v-if="form.referred_by_code" style="font-size:0.75rem;color:var(--accent-emerald);margin-top:0.25rem">🎉 10% discount applied on your first booking!</div>
        </div>

        <div v-if="serverError" style="color:#ef4444;font-size:0.85rem">{{ serverError }}</div>
        <button class="btn btn-primary w-full reg-btn" @click="register" :disabled="loading">
          <svg v-if="loading" class="btn-spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="31.4 31.4" /></svg>
          <span>{{ loading ? 'Creating Account…' : 'Create Account' }}</span>
        </button>
      </div>

      <div style="margin:1.5rem 0;display:flex;align-items:center;gap:1rem;">
        <div style="flex:1;height:1px;background:var(--border-color);"></div>
        <span style="color:var(--text-muted);font-size:0.85rem;font-weight:500;">OR</span>
        <div style="flex:1;height:1px;background:var(--border-color);"></div>
      </div>

      <div>
        <a href="/api/auth/google" class="btn btn-ghost w-full" style="display:flex;align-items:center;justify-content:center;gap:0.75rem;border:1px solid var(--border-color);background:var(--bg-primary);text-decoration:none;color:var(--text-primary);font-weight:600;">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.275c0-.853-.07-1.673-.21-2.46H12v4.545h6.583c-.292 1.517-1.168 2.804-2.455 3.664v2.993h3.948c2.316-2.128 3.66-5.263 3.414-8.742z"/><path fill="#34A853" d="M12 24c3.24 0 5.956-1.077 7.948-2.915l-3.948-2.993c-1.08.723-2.457 1.15-3.978 1.15-3.056 0-5.642-2.062-6.57-4.838H1.36v3.106C3.332 21.436 7.37 24 12 24z"/><path fill="#FBBC05" d="M5.43 14.404a7.172 7.172 0 0 1-.38-2.404c0-.837.144-1.65.394-2.404V6.49H1.359A11.968 11.968 0 0 0 0 12c0 1.94.464 3.784 1.285 5.43l4.145-3.026z"/><path fill="#EA4335" d="M12 4.792c1.764 0 3.348.608 4.595 1.796l3.447-3.447C17.95 1.213 15.234 0 12 0 7.37 0 3.332 2.564 1.36 6.49l4.085 3.106C6.377 6.842 8.944 4.792 12 4.792z"/></svg>
          Continue with Google
        </a>
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
      errors: { name: '', email: '', phone: '', password: '', password_confirmation: '' },
      loading: false, serverError: '', showPwd: { main: false, confirm: false }
    };
  },
  mounted() {
    // Pre-fill referral code from URL query param
    const ref = this.$route.query.ref;
    if (ref) this.form.referred_by_code = ref.toUpperCase();
  },
  methods: {
    clearError(field) {
      this.errors[field] = '';
    },

    filterPhone() {
      this.form.phone = this.form.phone.replace(/[^0-9]/g, '');
      this.errors.phone = '';
    },

    validateName() {
      if (!this.form.name.trim()) {
        this.errors.name = 'Full name is required.';
        return false;
      }
      if (this.form.name.trim().length < 2) {
        this.errors.name = 'Name must be at least 2 characters.';
        return false;
      }
      this.errors.name = '';
      return true;
    },

    validateEmail() {
      if (!this.form.email.trim()) {
        this.errors.email = 'Email address is required.';
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.form.email.trim())) {
        this.errors.email = 'Please enter a valid email address.';
        return false;
      }
      this.errors.email = '';
      return true;
    },

    validatePhone() {
      if (!this.form.phone.trim()) {
        this.errors.phone = 'Mobile number is required.';
        return false;
      }
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(this.form.phone.trim())) {
        this.errors.phone = 'Please enter a valid 10-digit mobile number.';
        return false;
      }
      this.errors.phone = '';
      return true;
    },

    validatePassword() {
      if (!this.form.password) {
        this.errors.password = 'Password is required.';
        return false;
      }
      if (this.form.password.length < 6) {
        this.errors.password = 'Password must be at least 6 characters.';
        return false;
      }
      this.errors.password = '';
      return true;
    },

    validateConfirmPassword() {
      if (!this.form.password_confirmation) {
        this.errors.password_confirmation = 'Please confirm your password.';
        return false;
      }
      if (this.form.password !== this.form.password_confirmation) {
        this.errors.password_confirmation = 'Passwords do not match.';
        return false;
      }
      this.errors.password_confirmation = '';
      return true;
    },

    validateAll() {
      const v1 = this.validateName();
      const v2 = this.validateEmail();
      const v3 = this.validatePhone();
      const v4 = this.validatePassword();
      const v5 = this.validateConfirmPassword();
      return v1 && v2 && v3 && v4 && v5;
    },

    async register() {
      this.serverError = '';
      if (!this.validateAll()) return;

      this.loading = true;
      try {
        const { data } = await axios.post('/api/auth/register', this.form);
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        this.$router.push('/customer');
      } catch (e) {
        const errs = e.response?.data?.errors;
        if (errs) {
          // Map backend errors to individual fields
          if (errs.name) this.errors.name = errs.name[0];
          if (errs.email) this.errors.email = errs.email[0];
          if (errs.phone) this.errors.phone = errs.phone[0];
          if (errs.password) this.errors.password = errs.password[0];
          if (errs.password_confirmation) this.errors.password_confirmation = errs.password_confirmation[0];
          // Show any remaining errors in the general area
          const mappedFields = ['name', 'email', 'phone', 'password', 'password_confirmation'];
          const remaining = Object.entries(errs).filter(([k]) => !mappedFields.includes(k)).flatMap(([, v]) => v);
          if (remaining.length) this.serverError = remaining.join(' ');
        } else {
          this.serverError = e.response?.data?.message || 'Registration failed. Please try again.';
        }
      } finally { this.loading = false; }
    },
  },
};
</script>
<style scoped>
.reg-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
  color: var(--text-secondary, #b0b0b0);
}

.req-star {
  color: #ef4444;
  font-weight: 700;
}

.opt-label {
  color: var(--text-muted, #888);
  font-weight: 400;
  font-size: 0.78rem;
}

.field-error {
  display: block;
  font-size: 0.78rem;
  color: #ef4444;
  margin-top: 0.2rem;
}

.input-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15) !important;
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

.reg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
