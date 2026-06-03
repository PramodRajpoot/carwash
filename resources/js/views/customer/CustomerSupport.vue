<template>
  <div>
    <!-- Create Ticket -->
    <div class="glass-card" style="margin-bottom:1.5rem">
      <h4 style="margin-bottom:1rem">🎫 Raise a Support Ticket</h4>
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <input v-model="form.subject" type="text" class="form-input" placeholder="Subject — e.g. Service not completed on time" />
        <textarea v-model="form.body" class="form-input" rows="4" placeholder="Describe your issue in detail…" style="resize:vertical"></textarea>
        <button class="btn btn-primary" @click="submit" :disabled="submitting" style="align-self:flex-start">
          {{ submitting ? 'Submitting…' : 'Submit Ticket' }}
        </button>
      </div>
    </div>

    <!-- Tickets List -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">My Support Tickets</h4>
      <div v-if="loading" class="text-muted" style="padding:2rem;text-align:center">Loading…</div>
      <div v-else-if="tickets.length === 0" class="text-muted" style="padding:2rem;text-align:center">No tickets yet. Raise one above if you need help.</div>
      <div v-else>
        <div v-for="t in tickets" :key="t.id" class="glass-card" style="margin-bottom:0.75rem;cursor:pointer" @click="selected = selected?.id === t.id ? null : t">
          <div class="flex justify-between items-start">
            <div>
              <div style="font-weight:600">{{ t.subject }}</div>
              <div class="text-muted" style="font-size:0.8rem;margin-top:0.2rem">{{ formatDate(t.created_at) }} • Ticket #{{ t.id }}</div>
            </div>
            <span class="badge" :class="statusClass(t.status)">{{ t.status.replace('_', ' ') }}</span>
          </div>
          <!-- Expanded detail -->
          <div v-if="selected?.id === t.id" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-color)">
            <div class="text-muted" style="font-size:0.85rem;line-height:1.6;white-space:pre-wrap">{{ t.body }}</div>
            <div v-if="t.admin_reply" style="margin-top:1rem;background:rgba(6,182,212,0.08);border-left:3px solid var(--accent-cyan);padding:0.75rem 1rem;border-radius:0 var(--radius-sm) var(--radius-sm) 0">
              <div style="font-weight:600;font-size:0.8rem;color:var(--accent-cyan);margin-bottom:0.3rem">Admin Reply • {{ formatDate(t.replied_at) }}</div>
              <div style="font-size:0.85rem;line-height:1.6">{{ t.admin_reply }}</div>
            </div>
            <div v-else class="text-muted" style="font-size:0.8rem;margin-top:0.75rem">⏳ Awaiting admin response…</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'CustomerSupport',
  data() { return { tickets: [], form: { subject: '', body: '' }, loading: true, submitting: false, selected: null }; },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    statusClass(s) { return { open: 'badge-amber', in_progress: 'badge-cyan', closed: 'badge-emerald' }[s] || 'badge-amber'; },
    async submit() {
      if (!this.form.subject.trim() || !this.form.body.trim()) return;
      this.submitting = true;
      try {
        await axios.post('/api/support/tickets', this.form);
        this.form = { subject: '', body: '' };
        await this.load();
      } catch (e) { alert(e.response?.data?.message || 'Failed to submit ticket.'); }
      finally { this.submitting = false; }
    },
    async load() {
      const { data } = await axios.get('/api/support/tickets');
      this.tickets = data;
      this.loading = false;
    },
  },
  mounted() { this.load(); },
};
</script>
