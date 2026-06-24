<template>
  <div class="profile-page">
    <div class="profile-grid">

      <!-- Left Column: Avatar + Info -->
      <div class="profile-left">
        <div class="profile-card">
          <div class="profile-avatar-section">
            <div class="avatar-ring" @click="triggerAvatarUpload">
              <div class="avatar-inner">
                <img v-if="user.avatar" :src="'/' + user.avatar" class="avatar-photo" alt="Profile Photo" />
                <div v-else class="avatar-initials">{{ userInitial }}</div>
                <div class="avatar-cam">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
              </div>
              <input type="file" ref="avatarInput" @change="uploadAvatar" accept="image/jpeg,image/png,image/jpg,image/webp" style="display:none" />
            </div>
            <div v-if="avatarUploading" class="avatar-badge uploading">Uploading…</div>
            <div v-if="avatarMsg" :class="['avatar-badge', avatarMsgType]">{{ avatarMsg }}</div>
          </div>

          <h2 class="profile-name">{{ user.name || 'User' }}</h2>
          <span class="profile-role-badge">{{ user.role || 'customer' }}</span>

          <div class="profile-meta">
            <div class="meta-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
              <span>{{ user.email || '—' }}</span>
            </div>
            <div class="meta-row" v-if="user.phone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>{{ user.phone }}</span>
            </div>
            <div class="meta-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Member since {{ memberSince }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Forms -->
      <div class="profile-right">

        <!-- Update Profile -->
        <div class="form-card">
          <div class="form-card-header">
            <div class="form-icon-wrap cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h3>Personal Information</h3>
              <p class="text-muted" style="font-size:0.8rem;margin-top:0.15rem">Update your name, email and phone number</p>
            </div>
          </div>

          <div class="form-body">
            <div class="form-row">
              <div class="field">
                <label for="profile-name">Full Name <span class="req">*</span></label>
                <input v-model="profileForm.name" type="text" class="form-input" id="profile-name" placeholder="Full Name" />
              </div>
            </div>
            <div class="form-row two-col">
              <div class="field">
                <label for="profile-email">Email Address <span class="req">*</span></label>
                <input v-model="profileForm.email" type="email" class="form-input" id="profile-email" placeholder="Email Address" />
              </div>
              <div class="field">
                <label for="profile-phone">Mobile Number</label>
                <input v-model="profileForm.phone" type="tel" class="form-input" id="profile-phone" placeholder="Mobile Number" maxlength="10" @input="filterPhone" />
              </div>
            </div>
            <div v-if="profileError" class="msg msg-error">{{ profileError }}</div>
            <div v-if="profileSuccess" class="msg msg-success">✓ {{ profileSuccess }}</div>
            <div class="form-actions">
              <button class="btn btn-primary btn-sm" @click="updateProfile" :disabled="profileLoading">
                <svg v-if="profileLoading" class="spin" width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="31.4 31.4" /></svg>
                {{ profileLoading ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Change Password -->
        <div class="form-card">
          <div class="form-card-header">
            <div class="form-icon-wrap emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <h3>Security</h3>
              <p class="text-muted" style="font-size:0.8rem;margin-top:0.15rem">Change your account password</p>
            </div>
          </div>

          <div class="form-body">
            <div class="form-row">
              <div class="field">
                <label for="current-pwd">Current Password <span class="req">*</span></label>
                <input v-model="passwordForm.current_password" type="password" class="form-input" id="current-pwd" placeholder="Enter current password" />
              </div>
            </div>
            <div class="form-row two-col">
              <div class="field">
                <label for="new-pwd">New Password <span class="req">*</span></label>
                <input v-model="passwordForm.password" type="password" class="form-input" id="new-pwd" placeholder="Min 6 characters" />
              </div>
              <div class="field">
                <label for="confirm-pwd">Confirm Password <span class="req">*</span></label>
                <input v-model="passwordForm.password_confirmation" type="password" class="form-input" id="confirm-pwd" placeholder="Re-enter new password" />
              </div>
            </div>
            <div v-if="pwdError" class="msg msg-error">{{ pwdError }}</div>
            <div v-if="pwdSuccess" class="msg msg-success">✓ {{ pwdSuccess }}</div>
            <div class="form-actions">
              <button class="btn btn-primary btn-sm" @click="changePassword" :disabled="pwdLoading">
                <svg v-if="pwdLoading" class="spin" width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="31.4 31.4" /></svg>
                {{ pwdLoading ? 'Updating…' : 'Update Password' }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CustomerProfile',
  data() {
    return {
      user: JSON.parse(localStorage.getItem('auth_user') || '{}'),
      profileForm: { name: '', email: '', phone: '' },
      passwordForm: { current_password: '', password: '', password_confirmation: '' },
      profileLoading: false, profileError: '', profileSuccess: '',
      pwdLoading: false, pwdError: '', pwdSuccess: '',
      avatarUploading: false, avatarMsg: '', avatarMsgType: '',
    };
  },
  computed: {
    userInitial() {
      return this.user.name ? this.user.name.charAt(0).toUpperCase() : 'U';
    },
    memberSince() {
      if (!this.user.created_at) return '—';
      return new Date(this.user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    },
  },
  mounted() {
    this.loadProfile();
  },
  methods: {
    async loadProfile() {
      try {
        const { data } = await axios.get('/api/auth/me');
        this.user = data;
        localStorage.setItem('auth_user', JSON.stringify(data));
      } catch (e) {}
      this.profileForm.name = this.user.name || '';
      this.profileForm.email = this.user.email || '';
      this.profileForm.phone = this.user.phone || '';
    },

    filterPhone() {
      this.profileForm.phone = this.profileForm.phone.replace(/[^0-9]/g, '');
    },

    triggerAvatarUpload() {
      this.$refs.avatarInput.click();
    },

    async uploadAvatar(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.avatarUploading = true;
      this.avatarMsg = '';
      const formData = new FormData();
      formData.append('avatar', file);
      try {
        const { data } = await axios.post('/api/auth/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        this.user.avatar = data.avatar;
        this.user = { ...this.user, ...data.user };
        localStorage.setItem('auth_user', JSON.stringify(this.user));
        window.dispatchEvent(new Event('user-updated'));
        this.avatarMsg = 'Photo updated!';
        this.avatarMsgType = 'success';
      } catch (err) {
        const errs = err.response?.data?.errors;
        this.avatarMsg = errs ? Object.values(errs).flat().join(' ') : (err.response?.data?.message || 'Upload failed.');
        this.avatarMsgType = 'error';
      } finally {
        this.avatarUploading = false;
        this.$refs.avatarInput.value = '';
      }
    },

    async updateProfile() {
      this.profileError = ''; this.profileSuccess = ''; this.profileLoading = true;
      try {
        const { data } = await axios.put('/api/auth/profile', this.profileForm);
        this.user = data.user;
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('user-updated'));
        this.profileSuccess = data.message || 'Profile updated!';
      } catch (err) {
        const errs = err.response?.data?.errors;
        this.profileError = errs ? Object.values(errs).flat().join(' ') : (err.response?.data?.message || 'Update failed.');
      } finally { this.profileLoading = false; }
    },

    async changePassword() {
      this.pwdError = ''; this.pwdSuccess = ''; this.pwdLoading = true;
      if (!this.passwordForm.current_password || !this.passwordForm.password || !this.passwordForm.password_confirmation) {
        this.pwdError = 'All password fields are required.';
        this.pwdLoading = false;
        return;
      }
      if (this.passwordForm.password.length < 6) {
        this.pwdError = 'New password must be at least 6 characters.';
        this.pwdLoading = false;
        return;
      }
      if (this.passwordForm.password !== this.passwordForm.password_confirmation) {
        this.pwdError = 'New passwords do not match.';
        this.pwdLoading = false;
        return;
      }
      try {
        const { data } = await axios.put('/api/auth/password', this.passwordForm);
        this.pwdSuccess = data.message || 'Password changed!';
        this.passwordForm = { current_password: '', password: '', password_confirmation: '' };
      } catch (err) {
        const errs = err.response?.data?.errors;
        this.pwdError = errs ? Object.values(errs).flat().join(' ') : (err.response?.data?.message || 'Password change failed.');
      } finally { this.pwdLoading = false; }
    },
  },
};
</script>

<style scoped>
/* ── Grid Layout ─────────────────────────────── */
.profile-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.75rem;
  align-items: start;
}

@media (max-width: 900px) {
  .profile-grid { grid-template-columns: 1fr; }
}

/* ── Left Column: Profile Card ────────────────── */
.profile-card {
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: sticky;
  top: 2rem;
}

/* ── Avatar ────────────────────────────────────── */
.avatar-ring {
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald));
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background: var(--bg-secondary);
}

.avatar-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--accent-cyan);
  background: var(--bg-secondary);
}

.avatar-cam {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 50%;
}

.avatar-ring:hover .avatar-cam {
  opacity: 1;
}

.avatar-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.75rem;
  border-radius: var(--radius-full);
  font-weight: 600;
}
.avatar-badge.success { color: var(--accent-emerald); background: rgba(16,185,129,0.12); }
.avatar-badge.error { color: #ef4444; background: rgba(239,68,68,0.1); }
.avatar-badge.uploading { color: var(--accent-amber); background: rgba(245,158,11,0.12); }

.profile-name {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0.75rem 0 0.35rem;
}

.profile-role-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 0.2rem 0.85rem;
  border-radius: var(--radius-full);
  background: rgba(6,182,212,0.12);
  color: var(--accent-cyan);
  margin-bottom: 1.25rem;
}

.profile-meta {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.meta-row svg {
  flex-shrink: 0;
  color: var(--text-muted);
}

/* ── Right Column: Form Cards ─────────────────── */
.form-card {
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.form-card + .form-card {
  margin-top: 1.5rem;
}

.form-card:hover {
  border-color: var(--border-glow);
  box-shadow: var(--shadow-glow);
}

.form-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.form-card-header h3 {
  font-size: 1.05rem;
  margin: 0;
}

.form-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.form-icon-wrap.cyan {
  background: rgba(6,182,212,0.12);
  color: var(--accent-cyan);
}
.form-icon-wrap.emerald {
  background: rgba(16,185,129,0.12);
  color: var(--accent-emerald);
}

.form-body {
  padding: 1.5rem;
}

.form-row {
  margin-bottom: 1rem;
}

.form-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .form-row.two-col { grid-template-columns: 1fr; }
}

.field label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.35rem;
}

.req {
  color: #ef4444;
  font-weight: 700;
}

.msg {
  font-size: 0.82rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm, 8px);
  margin-bottom: 0.75rem;
}
.msg-error {
  color: #ef4444;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
}
.msg-success {
  color: var(--accent-emerald);
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.form-actions .btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
