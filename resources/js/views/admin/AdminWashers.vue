<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h3>Washer Management</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Manage washer staff accounts and assign them to franchise service centers.</p>
      </div>
      <div class="flex gap-2 items-center">
        <button class="btn btn-primary btn-sm" @click="openCreateModal">+ Add Washer</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="glass-card mb-4 p-4 flex flex-wrap gap-3 items-end" style="background: var(--bg-primary); margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;">
      <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Search</label>
        <input v-model="filters.search" class="form-input" placeholder="Name, Email, Phone..." />
      </div>
      <div class="form-group" style="min-width: 180px; margin-bottom: 0;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Franchise Center</label>
        <select v-model="filters.franchisee_id" class="form-select">
          <option value="">All Centers</option>
          <option value="unassigned">Unassigned Only</option>
          <option v-for="c in centers" :key="c.id" :value="c.id">{{ c.center_name }} ({{ c.city }})</option>
        </select>
      </div>
      <div class="form-group" style="min-width: 140px; margin-bottom: 0;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Status</label>
        <select v-model="filters.status" class="form-select">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <button class="btn btn-ghost" @click="clearFilters" v-if="hasFilters" title="Clear Filters" style="padding: 0.5rem; height: 42px;">✖</button>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading washers list...
    </div>

    <div v-else>
      <div v-if="filteredWashers.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Washer Info</th>
              <th>Contact</th>
              <th>Assigned Franchise</th>
              <th>Tasks (Active / Done / Total)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in paginatedWashers" :key="w.id">
              <td>
                <div style="font-weight: 600; color: var(--text-primary);">{{ w.user?.name }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">ID: #WSH-{{ w.id }}</div>
              </td>
              <td>
                <div>{{ w.user?.email }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">{{ w.user?.phone || 'No phone' }}</div>
              </td>
              <td>
                <div v-if="w.franchisee" class="text-secondary" style="font-weight: 600;">
                  🏡 {{ w.franchisee.center_name }}
                  <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">📍 {{ w.franchisee.city }}</div>
                </div>
                <div v-else>
                  <span class="badge badge-amber">Unassigned</span>
                  <button class="btn btn-ghost btn-sm text-cyan" style="font-size: 0.75rem; padding: 0.1rem 0.4rem; margin-left: 0.5rem;" @click="openAssignFranchiseModal(w)">Assign</button>
                </div>
              </td>
              <td>
                <span class="text-cyan" style="font-weight: 600;">{{ w.active_tasks || 0 }}</span> active / 
                <span class="text-emerald" style="font-weight: 600;">{{ w.completed_tasks || 0 }}</span> done / 
                <strong>{{ w.total_tasks || 0 }}</strong> total
              </td>
              <td>
                <span class="badge" :class="w.status === 'active' ? 'badge-emerald' : 'badge-rose'">
                  {{ w.status }}
                </span>
              </td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-outline btn-sm" title="Edit Washer" style="padding: 0.25rem 0.5rem;" @click="openEditModal(w)">✏️</button>
                  <button class="btn btn-outline btn-sm" title="Reassign Franchise" style="padding: 0.25rem 0.5rem;" @click="openAssignFranchiseModal(w)">🏡</button>
                  <button class="btn btn-ghost btn-sm text-danger" title="Delete Washer" style="padding: 0.25rem 0.5rem;" @click="deleteWasher(w.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredWashers.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
          <select v-model="itemsPerPage" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;" @change="currentPage = 1">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredWashers.length) }} of {{ filteredWashers.length }}
          </span>
        </div>
        <div class="flex gap-1" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
          <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>

      <div v-if="!filteredWashers.length" class="empty-state">
        <div class="empty-icon">🧼</div>
        <p>No washer staff found matching your criteria.</p>
      </div>
    </div>

    <!-- Create / Edit Washer Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3>{{ isEdit ? 'Update Washer Profile' : 'Add New Washer' }}</h3>
        <p class="text-secondary" style="font-size: 0.85rem; margin-bottom: 1rem;">
          {{ isEdit ? 'Update washer contact details and franchise assignment.' : 'Create a login account for the washer and assign them to a franchise center.' }}
        </p>
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <form @submit.prevent="saveWasher">
          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Full Name</label>
              <input v-model="form.name" class="form-input" placeholder="e.g. Rahul Sharma" required />
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input v-model="form.email" type="email" class="form-input" placeholder="rahul@example.com" required />
            </div>
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Phone Number</label>
              <input v-model="form.phone" class="form-input" placeholder="+91 9876543210" />
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="form.status" class="form-select" required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>{{ isEdit ? 'Security Password (leave blank to keep unchanged)' : 'Security Password' }}</label>
            <input v-model="form.password" type="password" class="form-input" placeholder="Min 6 characters" :required="!isEdit" />
          </div>

          <div class="form-group" style="margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 1rem;">
            <label style="font-weight: 600; color: var(--accent-cyan);">🏡 Assign Franchise Center</label>
            <p class="text-muted" style="font-size: 0.75rem; margin-bottom: 0.5rem;">
              Admin can assign which franchise center this washer works for. The franchisee can then assign wash tasks to this washer.
            </p>
            <select v-model="form.franchisee_id" class="form-select">
              <option :value="null">-- No Franchise Assigned (Unassigned) --</option>
              <option v-for="c in centers" :key="c.id" :value="c.id">
                {{ c.center_name }} ({{ c.city }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Notes / Skills (Optional)</label>
            <textarea v-model="form.notes" class="form-input" rows="2" placeholder="e.g. Specialized in exterior detailing, interior sanitization..."></textarea>
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Saving...' : 'Save Washer' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="showModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Quick Franchise Assign Modal -->
    <div v-if="assignWasher" class="modal-overlay" @click.self="assignWasher = null">
      <div class="modal-content">
        <h3>Assign Franchise for {{ assignWasher.user?.name }}</h3>
        <p class="text-secondary" style="font-size: 0.85rem; margin-bottom: 1rem;">
          Select the franchise service center where this washer will be dispatched to wash vehicles.
        </p>

        <form @submit.prevent="saveFranchiseAssignment">
          <div class="form-group">
            <label>Franchise Center</label>
            <select v-model="selectedFranchiseId" class="form-select">
              <option :value="null">-- Unassign Franchise --</option>
              <option v-for="c in centers" :key="c.id" :value="c.id">
                {{ c.center_name }} ({{ c.city }} - {{ c.address }})
              </option>
            </select>
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Updating...' : 'Confirm Assignment' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="assignWasher = null">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminWashers',
  data() {
    return {
      washers: [],
      centers: [],
      loading: true,
      submitting: false,
      showModal: false,
      isEdit: false,
      selectedWasherId: null,
      assignWasher: null,
      selectedFranchiseId: null,
      error: '',
      currentPage: 1,
      itemsPerPage: 10,
      filters: {
        search: '',
        franchisee_id: '',
        status: ''
      },
      form: {
        name: '',
        email: '',
        phone: '',
        password: '',
        status: 'active',
        franchisee_id: null,
        notes: ''
      }
    };
  },
  computed: {
    hasFilters() {
      return this.filters.search || this.filters.franchisee_id !== '' || this.filters.status !== '';
    },
    filteredWashers() {
      return this.washers.filter(w => {
        if (this.filters.search) {
          const s = this.filters.search.toLowerCase();
          const matchName = w.user?.name?.toLowerCase().includes(s);
          const matchEmail = w.user?.email?.toLowerCase().includes(s);
          const matchPhone = w.user?.phone?.includes(s);
          if (!matchName && !matchEmail && !matchPhone) return false;
        }
        if (this.filters.franchisee_id === 'unassigned') {
          if (w.franchisee_id) return false;
        } else if (this.filters.franchisee_id) {
          if (String(w.franchisee_id) !== String(this.filters.franchisee_id)) return false;
        }
        if (this.filters.status && w.status !== this.filters.status) {
          return false;
        }
        return true;
      });
    },
    paginatedWashers() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredWashers.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filteredWashers.length / this.itemsPerPage) || 1;
    }
  },
  watch: {
    filters: {
      deep: true,
      handler() {
        this.currentPage = 1;
      }
    }
  },
  methods: {
    clearFilters() {
      this.filters = { search: '', franchisee_id: '', status: '' };
    },
    async loadData() {
      this.loading = true;
      try {
        const [wRes, cRes] = await Promise.all([
          axios.get('/api/admin/washers'),
          axios.get('/api/centers')
        ]);
        this.washers = wRes.data;
        this.centers = cRes.data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    openCreateModal() {
      this.isEdit = false;
      this.error = '';
      this.selectedWasherId = null;
      this.form = {
        name: '',
        email: '',
        phone: '',
        password: '',
        status: 'active',
        franchisee_id: this.centers.length > 0 ? this.centers[0].id : null,
        notes: ''
      };
      this.showModal = true;
    },
    openEditModal(w) {
      this.isEdit = true;
      this.error = '';
      this.selectedWasherId = w.id;
      this.form = {
        name: w.user?.name || '',
        email: w.user?.email || '',
        phone: w.user?.phone || '',
        password: '',
        status: w.status,
        franchisee_id: w.franchisee_id,
        notes: w.notes || ''
      };
      this.showModal = true;
    },
    openAssignFranchiseModal(w) {
      this.assignWasher = w;
      this.selectedFranchiseId = w.franchisee_id;
    },
    async saveWasher() {
      this.submitting = true;
      this.error = '';
      try {
        if (this.isEdit) {
          await axios.put(`/api/admin/washers/${this.selectedWasherId}`, this.form);
        } else {
          await axios.post('/api/admin/washers', this.form);
        }
        this.showModal = false;
        this.loadData();
      } catch (e) {
        this.error = e.response?.data?.message || 'Failed to save washer.';
      }
      this.submitting = false;
    },
    async saveFranchiseAssignment() {
      if (!this.assignWasher) return;
      this.submitting = true;
      try {
        await axios.put(`/api/admin/washers/${this.assignWasher.id}/assign-franchise`, {
          franchisee_id: this.selectedFranchiseId
        });
        this.assignWasher = null;
        this.loadData();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to assign franchise.');
      }
      this.submitting = false;
    },
    async deleteWasher(id) {
      if (!confirm('Are you sure you want to permanently delete this washer account?')) return;
      try {
        await axios.delete(`/api/admin/washers/${id}`);
        this.loadData();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete washer.');
      }
    }
  },
  mounted() {
    this.loadData();
  }
};
</script>
