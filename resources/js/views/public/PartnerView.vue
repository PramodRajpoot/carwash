<template>
  <div>
    <section class="section">
      <div class="container" style="max-width:700px">
        <div class="section-title"><h2>Become a <span class="text-gradient">Franchise Partner</span></h2><p>Join India's fastest-growing eco-friendly car wash network.</p></div>
        <div class="glass-card">
          <div v-if="submitted" class="alert alert-success">🎉 Thank you! Your application has been submitted. Our team will contact you within 48 hours.</div>
          <form v-else @submit.prevent="submit">
            <div class="grid grid-2 gap-2">
              <div class="form-group"><label>Full Name *</label><input v-model="form.name" class="form-input" required></div>
              <div class="form-group"><label>Email *</label><input v-model="form.email" type="email" class="form-input" required></div>
              <div class="form-group"><label>Phone *</label><input v-model="form.phone" class="form-input" required></div>
              <div class="form-group"><label>City *</label><input v-model="form.city" class="form-input" required></div>
            </div>
            <div class="form-group"><label>Investment Budget</label>
              <select v-model="form.budget" class="form-select">
                <option value="">Select Budget Range</option>
                <option>₹2-5 Lakhs</option><option>₹5-10 Lakhs</option><option>₹10-20 Lakhs</option><option>₹20+ Lakhs</option>
              </select>
            </div>
            <div class="form-group"><label>Tell us about yourself</label><textarea v-model="form.message" class="form-textarea" placeholder="Your experience, why you want to join..."></textarea></div>
            <button type="submit" class="btn btn-primary w-full">Submit Application</button>
          </form>
        </div>
        <div class="grid grid-3 gap-3" style="margin-top:3rem">
          <div class="card text-center"><div style="font-size:2rem;margin-bottom:0.5rem">💰</div><h4 style="font-size:1rem">Low Investment</h4><p class="text-muted" style="font-size:0.8rem">Start from ₹2 Lakhs</p></div>
          <div class="card text-center"><div style="font-size:2rem;margin-bottom:0.5rem">📚</div><h4 style="font-size:1rem">Full Training</h4><p class="text-muted" style="font-size:0.8rem">Complete support &amp; setup</p></div>
          <div class="card text-center"><div style="font-size:2rem;margin-bottom:0.5rem">📈</div><h4 style="font-size:1rem">High Returns</h4><p class="text-muted" style="font-size:0.8rem">ROI within 6 months</p></div>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
export default {
  name: 'PartnerView',
  data() { return { submitted: false, form: { name: '', email: '', phone: '', city: '', budget: '', message: '' } }; },
  methods: { submit() { this.submitted = true; } },
};
</script>
