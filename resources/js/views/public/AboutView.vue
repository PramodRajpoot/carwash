<template>
  <div>
    <!-- Hero Header -->
    <div class="page-header text-center" style="padding: 4rem 1rem; background: var(--bg-secondary);">
      <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">About Us</h1>
      <p class="text-muted">Learn more about our mission and vision.</p>
    </div>

    <section class="section" v-if="aboutUs" style="padding-top: 4rem;">
      <div class="container flex items-center" style="gap:4rem;flex-wrap:wrap">
        <div style="flex:1;min-width:250px" class="fade-in-up">
           <img :src="aboutUs.image_url" alt="About CleanAtDoorstep" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);width:100%;">
        </div>
        <div style="flex:1;min-width:250px" class="fade-in-up delay-1">
          <div class="section-title" style="text-align:left;margin-bottom:1.5rem">
            <h2 v-html="aboutUs.title"></h2>
          </div>
          <p class="text-secondary" style="margin-bottom:1.5rem;font-size:1.05rem;line-height:1.7">{{ aboutUs.description }}</p>
          <ul style="list-style:none;margin-bottom:2rem;color:var(--text-secondary)">
            <li v-for="(point, idx) in aboutUs.points" :key="idx" style="margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem">
              {{ point }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <div v-else class="section flex items-center justify-center" style="min-height: 400px;">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutView',
  data() {
    return {
      aboutUs: null,
    };
  },
  mounted() {
    this.fetchAboutUs();
  },
  methods: {
    async fetchAboutUs() {
      try {
        const response = await fetch('/api/cms/about-us');
        if (response.ok) {
          this.aboutUs = await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch About Us:', error);
      }
    }
  }
};
</script>

<style scoped>
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(6, 182, 212, 0.2);
  border-top-color: var(--accent-cyan);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
