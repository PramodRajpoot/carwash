<template>
  <div>
    <!-- Stats Row -->
    <div class="grid grid-4 gap-3" style="margin-bottom:1.5rem">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">📋</div>
        <div class="stat-value">{{ stats.total || 0 }}</div>
        <div class="stat-label">Total Applications</div>
      </div>
      <div class="stat-card" style="border:1px solid var(--accent-amber)">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">🆕</div>
        <div class="stat-value" style="color:var(--accent-amber)">{{ stats.new || 0 }}</div>
        <div class="stat-label">New (Unread)</div>
      </div>
      <div class="stat-card" style="border:1px solid var(--accent-emerald)">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">✅</div>
        <div class="stat-value" style="color:var(--accent-emerald)">{{ stats.approved || 0 }}</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-violet)">📞</div>
        <div class="stat-value">{{ stats.contacted || 0 }}</div>
        <div class="stat-label">Contacted</div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-2" style="margin-bottom:1rem">
      <button v-for="f in filters" :key="f.val"
        class="btn btn-sm"
        :class="activeFilter === f.val ? 'btn-primary' : 'btn-ghost'"
        @click="activeFilter = f.val; load()">
        {{ f.label }} ({{ f.val === '' ? stats.total : stats[f.val] || 0 }})
      </button>
    </div>

    <!-- Applications List -->
    <div class="glass-card">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading applications…</div>
      <div v-else-if="inquiries.length === 0" class="text-muted" style="text-align:center;padding:2rem">
        No applications in this category.
      </div>
      <div v-else>
        <div v-for="inq in inquiries" :key="inq.id" class="glass-card" style="margin-bottom:0.75rem">
          <!-- Header -->
          <div class="flex justify-between items-start" style="margin-bottom:0.75rem">
            <div class="flex gap-3 items-start">
              <div style="width:42px;height:42px;border-radius:50%;background:var(--gradient-btn);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;flex-shrink:0">
                {{ inq.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div style="font-weight:700;font-size:1rem">{{ inq.name }}</div>
                <div class="text-muted" style="font-size:0.8rem">
                  📧 {{ inq.email }} &nbsp;•&nbsp; 📞 {{ inq.phone }} &nbsp;•&nbsp; 📍 {{ inq.city }}
                </div>
                <div class="flex gap-2" style="margin-top:0.35rem">
                  <span v-if="inq.budget" class="badge badge-cyan" style="font-size:0.72rem">💰 {{ inq.budget }}</span>
                  <span class="text-muted" style="font-size:0.72rem">Applied: {{ formatDate(inq.created_at) }}</span>
                  <span v-if="inq.contacted_at" class="text-muted" style="font-size:0.72rem">• Contacted: {{ formatDate(inq.contacted_at) }}</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2 items-center">
              <span class="badge" :class="statusClass(inq.status)">{{ inq.status }}</span>
              <select v-model="inq.status" class="form-input" style="padding:0.25rem 0.5rem;font-size:0.8rem;width:auto" @change="updateStatus(inq)">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <!-- Message -->
          <div v-if="inq.message" style="background:var(--bg-secondary);padding:0.75rem;border-radius:var(--radius-sm);font-size:0.85rem;line-height:1.6;white-space:pre-wrap;margin-bottom:0.75rem;color:var(--text-secondary)">
            "{{ inq.message }}"
          </div>

          <!-- Admin Notes -->
          <div style="display:flex;gap:0.5rem;align-items:flex-end">
            <div style="flex:1">
              <label class="text-muted" style="font-size:0.78rem;display:block;margin-bottom:0.2rem">Internal Notes</label>
              <textarea v-model="inq._notes" class="form-input" rows="2" style="resize:none;font-size:0.85rem"
                :placeholder="inq.admin_notes || 'Add internal notes about this applicant…'"></textarea>
            </div>
            <div class="flex flex-col gap-1">
              <button class="btn btn-sm btn-primary" @click="saveNotes(inq)">Save</button>
              <button class="btn btn-sm" style="background:rgba(239,68,68,0.15);color:#ef4444" @click="del(inq)">Delete</button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2" style="margin-top:0.75rem">
            <a :href="'tel:' + inq.phone" class="btn btn-sm btn-outline">📞 Call</a>
            <a :href="'mailto:' + inq.email + '?subject=CleanAtDoorstep Franchise Partnership'" class="btn btn-sm btn-outline">📧 Email</a>
            <a :href="'https://wa.me/91' + inq.phone.replace(/\D/g,'')" target="_blank" class="btn btn-sm btn-outline" style="color:#25d366">💬 WhatsApp</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Modal -->
    <div v-if="generatedPasswordData" class="modal-overlay" @click.self="generatedPasswordData = null">
      <div class="modal-content" style="max-width: 500px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
        <h3>Franchise Created Successfully!</h3>
        <p class="text-muted" style="margin-bottom: 1.5rem; line-height: 1.6;">
          A new franchisee account has been created for <strong>{{ generatedPasswordData.name }}</strong>. 
          Please securely share this temporary password with them so they can log in.
        </p>
        
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); font-family: monospace; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); letter-spacing: 2px; border: 1px dashed var(--border-color); margin-bottom: 1.5rem;">
          {{ generatedPasswordData.password }}
        </div>
        
        <button class="btn btn-primary w-full" @click="generatedPasswordData = null">I have copied the password</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'AdminPartners',
  data() {
    return {
      inquiries: [],
      stats: {},
      loading: true,
      activeFilter: '',
      filters: [
        { val: '', label: 'All' },
        { val: 'new', label: '🆕 New' },
        { val: 'contacted', label: '📞 Contacted' },
        { val: 'approved', label: '✅ Approved' },
        { val: 'rejected', label: '❌ Rejected' },
      ],
      generatedPasswordData: null,
    };
  },
  methods: {
    formatDate(d) {
      return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    },
    statusClass(s) {
      return {
        new: 'badge-amber',
        contacted: 'badge-cyan',
        approved: 'badge-emerald',
        rejected: 'badge-rose',
      }[s] || 'badge-amber';
    },
    async updateStatus(inq) {
      try {
        const { data } = await axios.put(`/api/admin/partners/${inq.id}`, { status: inq.status });
        if (data.generated_password) {
          this.generatedPasswordData = {
            name: inq.name,
            password: data.generated_password
          };
        }
      } catch (e) {
        alert('Failed to update status.');
      }
      await this.load();
    },
    async saveNotes(inq) {
      if (!inq._notes?.trim()) return;
      await axios.put(`/api/admin/partners/${inq.id}`, { admin_notes: inq._notes });
      inq.admin_notes = inq._notes;
      inq._notes = '';
    },
    async del(inq) {
      if (!confirm(`Delete application from ${inq.name}?`)) return;
      await axios.delete(`/api/admin/partners/${inq.id}`);
      await this.load();
    },
    async load() {
      this.loading = true;
      try {
        const params = this.activeFilter ? { status: this.activeFilter } : {};
        const { data } = await axios.get('/api/admin/partners', { params });
        this.inquiries = data.inquiries.map(i => ({ ...i, _notes: '' }));
        this.stats = data.stats;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() { this.load(); },
};
</script>
