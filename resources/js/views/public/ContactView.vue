<template>
  <div>
    <section class="section">
      <div class="container" style="max-width:800px">
        <div class="section-title"><h2>Contact <span class="text-gradient">Us</span></h2><p>We would love to hear from you. Reach out with questions, feedback, or partnership inquiries.</p></div>
        <div class="grid grid-2 gap-4">
          <div>
            <div class="glass-card" style="margin-bottom:1.5rem">
              <h4 style="margin-bottom:1rem">Head Office</h4>
              <div class="flex items-center gap-2" style="margin-bottom:0.75rem"><span>📍</span><span class="text-secondary" style="font-size:0.9rem">Linking Road, Bandra West, Mumbai - 400050</span></div>
              <div class="flex items-center gap-2" style="margin-bottom:0.75rem"><span>📞</span><span class="text-secondary" style="font-size:0.9rem">+91 99999 99999</span></div>
              <div class="flex items-center gap-2" style="margin-bottom:0.75rem"><span>✉️</span><span class="text-secondary" style="font-size:0.9rem">info@carbonhydro.in</span></div>
              <div class="flex items-center gap-2"><span>🕐</span><span class="text-secondary" style="font-size:0.9rem">Mon - Sat: 8AM - 8PM</span></div>
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
  data() { return { sent: false, form: { name: '', email: '', subject: '', message: '' } }; },
  methods: { send() { this.sent = true; } },
};
</script>
