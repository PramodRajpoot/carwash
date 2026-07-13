<template>
  <div>
    <section class="section" style="padding-top:4rem">
      <div class="container" style="max-width:800px">
        <h1 style="margin-bottom:0.5rem">Terms & <span class="text-gradient">Conditions</span></h1>
        <p class="text-muted" style="margin-bottom:2rem">Last updated: June 2026</p>

        <div v-if="loading" class="flex items-center justify-center py-10">
          <div class="spinner"></div>
        </div>

        <div v-else class="glass-card fade-in-up" style="line-height:1.85;font-size:0.92rem">
           <div class="cms-content" v-html="termsData.content"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'TermsView',
  data() {
    return {
      loading: true,
      termsData: { content: '' },
    };
  },
  mounted() {
    this.fetchTerms();
  },
  methods: {
    async fetchTerms() {
      try {
        const response = await fetch('/api/cms/terms');
        if (response.ok) {
          this.termsData = await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch Terms:', error);
      } finally {
        this.loading = false;
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

.cms-content :deep(h3) {
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.cms-content :deep(p) {
  margin-bottom: 1.5rem;
  color: var(--text-muted);
}
</style>
