<template>
  <div>
    <!-- Stats Row -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div class="stat-card" title="Total Applications">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">📋</div>
        <div class="stat-value">{{ stats.total || 0 }}</div>
        <div class="stat-label">Total Applications</div>
      </div>
      <div class="stat-card" title="New (Unread)">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">🆕</div>
        <div class="stat-value" style="color:var(--accent-amber)">{{ stats.new || 0 }}</div>
        <div class="stat-label">New (Unread)</div>
      </div>
      <div class="stat-card" title="Approved">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">✅</div>
        <div class="stat-value" style="color:var(--accent-emerald)">{{ stats.approved || 0 }}</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat-card" title="Contacted">
        <div class="stat-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-violet)">📞</div>
        <div class="stat-value">{{ stats.contacted || 0 }}</div>
        <div class="stat-label">Contacted</div>
      </div>
      <div class="stat-card" title="Rejected">
        <div class="stat-icon" style="background:rgba(244,63,94,0.15);color:var(--accent-rose)">❌</div>
        <div class="stat-value" style="color:var(--accent-rose)">{{ stats.rejected || 0 }}</div>
        <div class="stat-label">Rejected</div>
      </div>
    </div>

    <!-- Filter Tabs & Search -->
    <div class="flex gap-2 justify-between items-center" style="margin-bottom:1rem; flex-wrap: wrap;">
      <div class="flex gap-2">
        <button v-for="f in filters" :key="f.val"
          class="btn btn-sm"
          :class="activeFilter === f.val ? 'btn-primary' : 'btn-ghost'"
          @click="activeFilter = f.val; currentPage = 1; load()">
          {{ f.label }} ({{ f.val === '' ? stats.total : stats[f.val] || 0 }})
        </button>
      </div>
      
      <div v-if="inquiries.length > 10" style="min-width: 250px;">
        <input type="text" v-model="searchQuery" class="form-input" placeholder="Search name, email, phone..." style="width: 100%; padding: 0.4rem 0.8rem; font-size: 0.85rem;" />
      </div>
    </div>

    <!-- Applications List -->
    <div class="glass-card" style="overflow-x: auto;">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading applications…</div>
      <div v-else-if="inquiries.length === 0" class="text-muted" style="text-align:center;padding:2rem">
        No applications in this category.
      </div>
      <table v-else class="table" style="width: 100%; text-align: left; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-muted);">
            <th style="padding: 1rem 0.5rem;">Applicant</th>
            <th style="padding: 1rem 0.5rem;">Contact</th>
            <th style="padding: 1rem 0.5rem;">City & Budget</th>
            <th style="padding: 1rem 0.5rem;">Dates</th>
            <th style="padding: 1rem 0.5rem; min-width: 250px;">Message & Notes</th>
            <th style="padding: 1rem 0.5rem;">Status</th>
            <th style="padding: 1rem 0.5rem; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inq in paginatedInquiries" :key="inq.id" style="border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
            <td style="padding: 1rem 0.5rem; font-weight: 600;">
              {{ inq.name }}
            </td>
            <td style="padding: 1rem 0.5rem;">
              <div>📞 {{ inq.phone }}</div>
              <div class="text-muted" style="font-size: 0.75rem;">📧 <a :href="'mailto:' + inq.email">{{ inq.email }}</a></div>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <div>📍 {{ inq.city }}</div>
              <div v-if="inq.budget" class="text-muted" style="font-size: 0.75rem;">💰 {{ inq.budget }}</div>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <div style="font-size: 0.8rem;">Applied: {{ formatDate(inq.created_at) }}</div>
              <div v-if="inq.contacted_at" class="text-muted" style="font-size: 0.75rem;">Contacted: {{ formatDate(inq.contacted_at) }}</div>
            </td>
            <td style="padding: 1rem 0.5rem; max-width: 250px;">
              <div v-if="inq.message" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;" :title="inq.message">
                "{{ inq.message }}"
              </div>
              <div class="flex gap-1">
                <textarea v-model="inq._notes" class="form-input" rows="1" style="resize:none;font-size:0.75rem; padding: 0.25rem; flex: 1;"
                  :placeholder="inq.admin_notes || 'Add internal notes...'"></textarea>
                <button class="btn btn-sm btn-outline" style="font-size: 0.7rem; padding: 0.15rem 0.3rem;" @click="saveNotes(inq)">Save</button>
              </div>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <select v-model="inq.status" class="form-input" style="padding:0.25rem;font-size:0.8rem;width:110px; margin-bottom: 0.25rem;" @change="updateStatus(inq)">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <br/>
              <span class="badge" :class="statusClass(inq.status)" style="font-size: 0.7rem;">{{ inq.status.toUpperCase() }}</span>
            </td>
            <td style="padding: 1rem 0.5rem; text-align: center;">
              <div class="flex gap-1 justify-center">
                <a :href="'tel:' + inq.phone" class="btn btn-sm btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" title="Call">📞</a>
                <a :href="'https://wa.me/91' + inq.phone.replace(/\D/g,'')" target="_blank" class="btn btn-sm btn-outline" style="color:#25d366; padding: 0.25rem 0.5rem; font-size: 0.8rem;" title="WhatsApp">💬</a>
                <button class="btn btn-sm btn-ghost text-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" @click="del(inq)" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div v-if="filteredInquiries.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
          <select v-model="itemsPerPage" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;" @change="currentPage = 1">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="75">75</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
          </select>
          <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredInquiries.length) }} of {{ filteredInquiries.length }} entries
          </span>
        </div>
        <div class="flex gap-1" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Previous</button>
          
          <template v-for="page in totalPages" :key="page">
            <button v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
              class="btn btn-sm" 
              :class="currentPage === page ? 'btn-primary' : 'btn-outline'"
              @click="currentPage = page">
              {{ page }}
            </button>
            <span v-else-if="page === currentPage - 2 || page === currentPage + 2" class="text-muted" style="padding: 0 0.25rem;">...</span>
          </template>
          
          <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
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
      searchQuery: '',
      currentPage: 1,
      itemsPerPage: 10,
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
  computed: {
    filteredInquiries() {
      if (!this.searchQuery) return this.inquiries;
      const q = this.searchQuery.toLowerCase();
      return this.inquiries.filter(i => 
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        (i.phone && i.phone.includes(q)) ||
        (i.city && i.city.toLowerCase().includes(q))
      );
    },
    paginatedInquiries() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredInquiries.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filteredInquiries.length / this.itemsPerPage) || 1;
    }
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
    }
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
