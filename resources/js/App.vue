<template>
  <router-view />
</template>

<script>
export default {
  name: 'App',
  mounted() {
    // Apply saved theme on app boot — ensures login, register, and all pages respect the user's preference
    const saved = localStorage.getItem('ch_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  },
};
</script>
