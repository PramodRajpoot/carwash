<template>
  <div>
    <section class="section">
      <div class="container" style="max-width:700px">
        <div class="section-title">
          <h2>Become a <span class="text-gradient">Franchise Partner</span></h2>
          <p>Join India's fastest-growing eco-friendly car wash network.</p>
        </div>

        <div class="glass-card">
          <!-- Success State -->
          <div v-if="submitted" style="text-align:center;padding:2rem 1rem">
            <div style="font-size:4rem;margin-bottom:1rem">🎉</div>
            <h3 style="margin-bottom:0.5rem;color:var(--accent-emerald)">Application Submitted!</h3>
            <p class="text-muted" style="line-height:1.7;margin-bottom:1.5rem">
              Thank you <strong>{{ form.name }}</strong>! Your franchise application has been received.<br>
              Our partnership team will contact you at <strong>{{ form.phone }}</strong> within <strong>48 hours</strong>.
            </p>
            <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:1rem;font-size:0.85rem;color:var(--text-muted);margin-bottom:1.5rem">
              📧 A confirmation has been recorded for <strong>{{ form.email }}</strong>
            </div>
            <button class="btn btn-outline" @click="submitted = false; form = emptyForm()">Submit Another Application</button>
          </div>

          <!-- Form -->
          <form v-else @submit.prevent="submit">
            <div class="grid grid-2 gap-2" style="margin-bottom:0.75rem">
              <div>
                <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Full Name *</label>
                <input v-model="form.name" type="text" class="form-input" placeholder="Rajesh Kumar" required />
              </div>
              <div>
                <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Email *</label>
                <input v-model="form.email" type="email" class="form-input" placeholder="rajesh@email.com" required />
              </div>
              <div>
                <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Phone *</label>
                <input v-model="form.phone" type="tel" class="form-input" placeholder="9876543210" required />
              </div>
              <div>
                <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">City *</label>
                <input v-model="form.city" type="text" class="form-input" placeholder="Mumbai, Delhi, Pune…" required />
              </div>
            </div>

            <div style="margin-bottom:0.75rem">
              <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Investment Budget</label>
              <select v-model="form.budget" class="form-input">
                <option value="">Select Budget Range</option>
                <option>₹2-5 Lakhs</option>
                <option>₹5-10 Lakhs</option>
                <option>₹10-20 Lakhs</option>
                <option>₹20+ Lakhs</option>
              </select>
            </div>

            <div style="margin-bottom:1rem">
              <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Tell us about yourself</label>
              <textarea v-model="form.message" class="form-input" rows="4" placeholder="Your background, why you want to join CleanAtDoorstep, existing business experience…" style="resize:vertical"></textarea>
            </div>

            <div v-if="error" style="color:#ef4444;font-size:0.85rem;margin-bottom:0.75rem;padding:0.75rem;background:rgba(239,68,68,0.08);border-radius:var(--radius-sm)">
              ⚠️ {{ error }}
            </div>

            <button type="submit" class="btn btn-primary w-full" :disabled="submitting" style="font-size:1rem;padding:0.85rem">
              {{ submitting ? 'Submitting Application…' : '🚀 Submit Application' }}
            </button>
          </form>
        </div>

        <!-- Why Join -->
        <div class="grid grid-3 gap-3" style="margin-top:3rem">
          <div class="card text-center">
            <div style="font-size:2rem;margin-bottom:0.5rem">💰</div>
            <h4 style="font-size:1rem">Low Investment</h4>
            <p class="text-muted" style="font-size:0.8rem">Start from ₹2 Lakhs with low overhead costs</p>
          </div>
          <div class="card text-center">
            <div style="font-size:2rem;margin-bottom:0.5rem">📚</div>
            <h4 style="font-size:1rem">Full Training</h4>
            <p class="text-muted" style="font-size:0.8rem">Complete onboarding, support & setup</p>
          </div>
          <div class="card text-center">
            <div style="font-size:2rem;margin-bottom:0.5rem">📈</div>
            <h4 style="font-size:1rem">High Returns</h4>
            <p class="text-muted" style="font-size:0.8rem">Avg. ROI achieved within 6 months</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'PartnerView',
  data() {
    return {
      submitted: false,
      submitting: false,
      error: '',
      form: this.emptyForm(),
    };
  },
  methods: {
    emptyForm() {
      return { name: '', email: '', phone: '', city: '', budget: '', message: '' };
    },
    async submit() {
      this.error = '';
      this.submitting = true;
      try {
        await axios.post('/api/partner/apply', this.form);
        this.submitted = true;
      } catch (e) {
        const msg = e.response?.data?.message;
        this.error = msg || 'Submission failed. Please try again.';
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>
