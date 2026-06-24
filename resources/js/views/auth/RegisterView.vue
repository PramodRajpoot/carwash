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
          <input v-model="form.password" type="password" class="form-input" :class="{ 'input-error': errors.password }" placeholder="Password (min 6 chars)" id="reg-password" @blur="validatePassword" @input="clearError('password')" />
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <!-- Confirm Password -->
        <div>
          <label class="reg-label" for="reg-confirm">Confirm Password <span class="req-star">*</span></label>
          <input v-model="form.password_confirmation" type="password" class="form-input" :class="{ 'input-error': errors.password_confirmation }" placeholder="Confirm Password" id="reg-confirm" @blur="validateConfirmPassword" @input="clearError('password_confirmation')" />
          <span v-if="errors.password_confirmation" class="field-error">{{ errors.password_confirmation }}</span>
        </div>

        <!-- Referral Code (Optional) -->
        <div style="position:relative">
          <label class="reg-label" for="reg-referral">Referral Code <span class="opt-label">(optional)</span></label>
          <input v-model="form.referred_by_code" type="text" class="form-input" placeholder="Referral Code — get 10% off!" id="reg-referral" style="text-transform:uppercase" />
          <div v-if="form.referred_by_code" style="font-size:0.75rem;color:var(--accent-emerald);margin-top:0.25rem">🎉 10% discount applied on your first booking!</div>
        </div>

        <div v-if="serverError" style="color:#ef4444;font-size:0.85rem">{{ serverError }}</div>
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
      errors: { name: '', email: '', phone: '', password: '', password_confirmation: '' },
      loading: false, serverError: '',
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
</style>
