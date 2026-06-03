<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <h3>Support Tickets</h3>
      <div class="flex gap-2">
        <button v-for="s in statuses" :key="s.val" class="btn btn-sm" :class="filter === s.val ? 'btn-primary' : 'btn-ghost'" @click="filter = s.val">{{ s.label }} ({{ count(s.val) }})</button>
      </div>
    </div>

    <div class="glass-card">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="filtered.length === 0" class="text-muted" style="text-align:center;padding:2rem">No tickets with this status.</div>
      <div v-else>
        <div v-for="t in filtered" :key="t.id" class="glass-card" style="margin-bottom:0.75rem">
          <div class="flex justify-between items-start" style="margin-bottom:0.75rem">
            <div>
              <div style="font-weight:600">{{ t.subject }}</div>
              <div class="text-muted" style="font-size:0.78rem">{{ t.customer?.name }} • {{ t.customer?.email }} • #{{ t.id }} • {{ formatDate(t.created_at) }}</div>
            </div>
            <select v-model="t.status" class="form-input" style="padding:0.25rem 0.5rem;font-size:0.8rem;width:auto" @change="save(t)">
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div style="background:var(--bg-secondary);padding:0.75rem;border-radius:var(--radius-sm);font-size:0.85rem;line-height:1.6;white-space:pre-wrap;margin-bottom:0.75rem">{{ t.body }}</div>
          <div v-if="t.admin_reply" style="background:rgba(6,182,212,0.08);border-left:3px solid var(--accent-cyan);padding:0.75rem;border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-size:0.85rem;margin-bottom:0.75rem">
            <strong style="color:var(--accent-cyan)">Admin Reply:</strong> {{ t.admin_reply }}
          </div>
          <div style="display:flex;gap:0.5rem">
            <textarea v-model="t._reply" class="form-input" rows="2" style="flex:1;resize:none" placeholder="Type your reply…"></textarea>
            <button class="btn btn-primary btn-sm" @click="reply(t)">Reply</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'AdminTickets',
  data() {
    return {
      tickets: [], loading: true, filter: 'open',
      statuses: [{ val: 'open', label: 'Open' }, { val: 'in_progress', label: 'In Progress' }, { val: 'closed', label: 'Closed' }],
    };
  },
  computed: {
    filtered() { return this.tickets.filter(t => t.status === this.filter); },
  },
  methods: {
    count(s) { return this.tickets.filter(t => t.status === s).length; },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    async save(t) { await axios.put(`/api/admin/tickets/${t.id}`, { status: t.status }); },
    async reply(t) {
      if (!t._reply?.trim()) return;
      await axios.put(`/api/admin/tickets/${t.id}`, { admin_reply: t._reply, status: 'in_progress' });
      t.admin_reply = t._reply; t._reply = ''; t.status = 'in_progress';
    },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/admin/tickets'); this.tickets = data.map(t => ({ ...t, _reply: '' })); }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
