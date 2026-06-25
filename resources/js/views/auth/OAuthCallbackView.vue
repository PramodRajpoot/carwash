<template>
  <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem">
    <div style="text-align:center;">
      <div style="display:inline-block;width:3rem;height:3rem;border:3px solid var(--accent-cyan);border-right-color:transparent;border-radius:50%;animation:spin 0.75s linear infinite;margin-bottom:1rem;"></div>
      <h2 style="color:var(--text-primary);">Authenticating...</h2>
      <p style="color:var(--text-muted);">Please wait while we log you in.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OAuthCallbackView',
  mounted() {
    this.handleCallback();
  },
  methods: {
    handleCallback() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userStr = urlParams.get('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
          
          const map = { customer: '/customer', franchisee: '/franchisee', admin: '/admin', super_admin: '/super-admin' };
          this.$router.push(map[user.role] || '/customer');
        } catch (e) {
          console.error("Failed to parse user data", e);
          this.$router.push('/login?error=' + encodeURIComponent('Authentication failed.'));
        }
      } else {
        this.$router.push('/login?error=' + encodeURIComponent('Authentication failed.'));
      }
    }
  }
};
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
