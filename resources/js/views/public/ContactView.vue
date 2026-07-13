<template>
  <div>
    <section class="section">
      <div class="container" style="max-width:800px">
        <div class="section-title"><h2>Contact <span class="text-gradient">Us</span></h2><p>We would love to hear from you. Reach out with questions, feedback, or partnership inquiries.</p></div>
        <div class="grid grid-2 gap-4">
          <div>
            <div v-if="loading" class="flex items-center justify-center p-5 glass-card" style="margin-bottom:1.5rem">
              <div class="spinner"></div>
            </div>
            <div v-else class="glass-card fade-in-up" style="margin-bottom:1.5rem">
              <div class="cms-content" v-html="contactData.content"></div>
            </div>
          </div>
          <div class="glass-card">
            <h4 style="margin-bottom:1rem">Send a Message</h4>
            <div v-if="sent" class="alert alert-success">✅ Message sent successfully!</div>
            <form v-else @submit.prevent="send">
              <div class="form-group"><label>Name</label><input v-model="form.name" class="form-input" required></div>
              <div class="form-group"><label>Email</label><input v-model="form.email" type="email" class="form-input" required></div>
              <div class="form-group"><label>Subject</label><input v-model="form.subject" class="form-input"></div>
              <div class="form-group"><label>Message</label><textarea v-model="form.message" class="form-textarea" required></textarea></div>
              <button type="submit" class="btn btn-primary w-full">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
export default {
  name: 'ContactView',
  data() { 
    return { 
      sent: false, 
      form: { name: '', email: '', subject: '', message: '' },
      loading: true,
      contactData: { content: '' }
    }; 
  },
  mounted() {
    this.fetchContact();
  },
  methods: { 
    send() { this.sent = true; },
    async fetchContact() {
      try {
        const response = await fetch('/api/cms/contact');
        if (response.ok) {
          this.contactData = await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch Contact:', error);
      } finally {
        this.loading = false;
      }
    }
  },
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

.cms-content :deep(h4) {
  margin-bottom: 1rem;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
}

.cms-content :deep(div) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cms-content :deep(.text-secondary) {
  color: var(--text-secondary);
  font-size: 0.9rem;
}
</style>
