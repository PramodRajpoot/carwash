<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
      <div>
        <h3>Platform User Profiles</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Manage admin accounts, franchisees center staff, and registered customers.</p>
      </div>
      <div class="flex gap-2 items-center">
        <select v-model="selectedRoleFilter" class="form-input" style="padding: 0.25rem 0.5rem; font-size: 0.9rem; margin: 0;">
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="franchisee">Franchisee</option>
          <option value="washer">Washer</option>
          <option value="customer">Customer</option>
        </select>
        <button v-if="isSuperAdmin" class="btn btn-primary btn-sm" @click="openCreateModal">+ Generate User</button>
      </div>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading accounts list...
    </div>

    <div v-else>
      <div v-if="filteredUsers.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Center Linked</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in paginatedUsers" :key="u.id">
              <td style="font-weight: 600; color: var(--text-primary);">{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.phone || 'N/A' }}</td>
              <td>
                <span class="badge" :class="roleBadge(u.role)">
                  {{ formatRole(u.role) }}
                </span>
              </td>
              <td>
                <span v-if="u.role === 'franchisee' && u.franchisee" class="text-secondary" style="font-size: 0.85rem; font-weight: 500;">
                  🏡 {{ u.franchisee.center_name }}
                </span>
                <span v-else-if="u.role === 'washer' && u.washer?.franchisee" class="text-secondary" style="font-size: 0.85rem; font-weight: 500;">
                  🏡 {{ u.washer.franchisee.center_name }}
                </span>
                <span v-else-if="u.role === 'washer'" class="badge badge-amber" style="font-size: 0.75rem;">
                  Unassigned
                </span>
                <span v-else class="text-muted" style="font-size: 0.8rem;">-</span>
              </td>
              <td>
                <span class="badge" :class="u.status === 'active' ? 'badge-emerald' : (u.status === 'inactive' ? 'badge-amber' : 'badge-rose')">
                  {{ u.status }}
                </span>
              </td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem;" @click="openEditModal(u)">✏️</button>
                  <button class="btn btn-sm btn-outline btn-amber" style="padding: 0.25rem 0.5rem;" title="Send Password Reset Link" @click="openResetModal(u)">🔑</button>
                  <button class="btn btn-ghost btn-sm text-danger" style="padding: 0.25rem 0.5rem;" @click="deleteUser(u.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="filteredUsers.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
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
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }} of {{ filteredUsers.length }} entries
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

      <div v-if="!filteredUsers.length" class="empty-state">
        <p>No user accounts found.</p>
      </div>
    </div>

    <!-- Create / Edit User Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3>{{ isEdit ? 'Update User Details' : 'Generate User Account' }}</h3>
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <form @submit.prevent="saveUser">
          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Full Name</label>
              <input v-model="form.name" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input v-model="form.email" type="email" class="form-input" required />
            </div>
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Phone Number</label>
              <input v-model="form.phone" class="form-input" />
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="form.status" class="form-select" required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Platform Role</label>
            <select v-model="form.role" class="form-select" required>
              <option value="customer">Customer</option>
              <option value="washer">Washer / Cleaning Technician</option>
              <option value="franchisee">Franchisee Center Manager</option>
              <option value="admin">Administrator</option>
              <option value="super_admin">Super Administrator</option>
            </select>
          </div>

          <!-- Password field (only for creation) -->
          <div v-if="!isEdit" class="form-group">
            <label>Security Password</label>
            <input v-model="form.password" type="password" class="form-input" placeholder="Min 6 characters" required />
          </div>

          <!-- Center Config details (only if role is washer) -->
          <div v-if="form.role === 'washer'" style="margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 1rem;">
            <h4>🏡 Assign Franchise Center</h4>
            <div class="form-group" style="margin-top: 0.5rem;">
              <label>Franchise Service Center</label>
              <select v-model="form.franchisee_id" class="form-select">
                <option :value="null">-- Unassigned --</option>
                <option v-for="c in centers" :key="c.id" :value="c.id">
                  {{ c.center_name }} ({{ c.city }})
                </option>
              </select>
            </div>
          </div>

          <!-- Center Config details (only if role is franchisee) -->
          <div v-if="form.role === 'franchisee'" style="margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 1rem;">
            <h4>🏡 Center Configuration</h4>
            <div class="form-group" style="margin-top: 0.5rem;">
              <label>Center Name</label>
              <input v-model="form.center_name" class="form-input" required />
            </div>
            <div class="grid grid-2 gap-2">
              <div class="form-group">
                <label>City Location</label>
                <input v-model="form.city" class="form-input" required />
              </div>
              <div class="form-group">
                <label>Royalty Fee Rate (%)</label>
                <input v-model="form.royalty_percentage" type="number" min="0" max="100" step="0.5" class="form-input" required />
              </div>
            </div>
            <div class="form-group">
              <label>Center Street Address</label>
              <input v-model="form.address" class="form-input" required />
            </div>
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Saving...' : 'Confirm Save' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="showModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Password Reset Modal -->
    <div v-if="resetUser" class="modal-overlay" @click.self="closeResetModal">
      <div class="modal-content" style="max-width: 480px;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="width: 42px; height: 42px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
            🔑
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.2rem;">Reset User Password</h3>
            <p class="text-secondary" style="font-size: 0.82rem; margin: 0.2rem 0 0 0;">
              Send password reset link via email
            </p>
          </div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="text-muted" style="font-size: 0.85rem;">User:</span>
            <strong style="color: var(--text-primary);">{{ resetUser.name }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="text-muted" style="font-size: 0.85rem;">Email:</span>
            <strong style="color: var(--color-primary, #38bdf8);">{{ resetUser.email }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="text-muted" style="font-size: 0.85rem;">Role:</span>
            <span class="badge" :class="roleBadge(resetUser.role)">{{ formatRole(resetUser.role) }}</span>
          </div>
        </div>

        <div style="background: rgba(14, 165, 233, 0.08); border-left: 3px solid #0ea5e9; border-radius: 4px; padding: 0.75rem; margin-bottom: 1.25rem;">
          <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin: 0;">
            A secure password reset link will be sent to <strong>{{ resetUser.email }}</strong>. The user can open the link to set their own password. This link will expire in <strong>10 minutes</strong>.
          </p>
        </div>

        <div v-if="resetFeedback.message" :class="['alert', resetFeedback.type === 'success' ? 'alert-success' : 'alert-error']" style="margin-bottom: 1.25rem; font-size: 0.85rem;">
          {{ resetFeedback.message }}
        </div>

        <div class="flex gap-2" style="justify-content: flex-end;">
          <button type="button" class="btn btn-ghost" @click="closeResetModal" :disabled="sendingReset">
            {{ resetFeedback.type === 'success' ? 'Close' : 'Cancel' }}
          </button>
          <button v-if="resetFeedback.type !== 'success'" type="button" class="btn btn-primary" @click="sendPasswordResetLink" :disabled="sendingReset">
            {{ sendingReset ? 'Sending Link...' : 'Send Reset Link' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'AdminUsers',
  data() {
    return {
      currentUser: JSON.parse(localStorage.getItem('auth_user') || '{}'),
      users: [],
      centers: [],
      selectedRoleFilter: '',
      loading: true,
      showModal: false,
      isEdit: false,
      submitting: false,
      error: '',
      resetUser: null,
      sendingReset: false,
      resetFeedback: { type: null, message: '' },
      selectedUserId: null,
      currentPage: 1,
      itemsPerPage: 10,
      form: {
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer',
        status: 'active',
        franchisee_id: null,
        center_name: '',
        city: '',
        address: '',
        royalty_percentage: 10
      }
    };
  },
  computed: {
    isSuperAdmin() {
      return this.currentUser && this.currentUser.role === 'super_admin';
    },
    filteredUsers() {
      if (!this.selectedRoleFilter) return this.users;
      return this.users.filter(u => u.role === this.selectedRoleFilter);
    },
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredUsers.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.itemsPerPage) || 1;
    }
  },
  watch: {
    selectedRoleFilter() {
      this.currentPage = 1;
    }
  },
  methods: {
    roleBadge(r) {
      return { super_admin: 'badge-rose', admin: 'badge-violet', franchisee: 'badge-cyan', washer: 'badge-amber', customer: 'badge-emerald' }[r] || 'badge-cyan';
    },
    formatRole(r) {
      return r.toUpperCase().replace('_', ' ');
    },
    async loadUsers() {
      try {
        const [uRes, cRes] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/centers')
        ]);
        this.users = uRes.data;
        this.centers = cRes.data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    openCreateModal() {
      if (!this.isSuperAdmin) return;
      this.isEdit = false;
      this.error = '';
      this.form = {
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer',
        status: 'active',
        franchisee_id: null,
        center_name: 'Superwash Hub',
        city: 'Mumbai',
        address: 'Bandra Linking Road',
        royalty_percentage: 10
      };
      this.showModal = true;
    },
    openEditModal(u) {
      this.isEdit = true;
      this.error = '';
      this.selectedUserId = u.id;
      this.form = {
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        status: u.status,
        franchisee_id: u.washer?.franchisee_id || null,
        center_name: u.franchisee?.center_name || '',
        city: u.franchisee?.city || '',
        address: u.franchisee?.address || '',
        royalty_percentage: u.franchisee?.royalty_percentage || 10
      };
      this.showModal = true;
    },
    async saveUser() {
      if (!this.isEdit && !this.isSuperAdmin) {
        this.error = 'Only Super Admin can generate new user accounts.';
        return;
      }
      this.submitting = true;
      this.error = '';
      try {
        if (this.isEdit) {
          await axios.put(`/api/admin/users/${this.selectedUserId}`, this.form);
        } else {
          await axios.post('/api/admin/users', this.form);
        }
        this.showModal = false;
        this.loadUsers();
      } catch (e) {
        this.error = e.response?.data?.message || 'Failed to save user account.';
      }
      this.submitting = false;
    },
    openResetModal(u) {
      this.resetUser = u;
      this.sendingReset = false;
      this.resetFeedback = { type: null, message: '' };
    },
    closeResetModal() {
      this.resetUser = null;
      this.sendingReset = false;
      this.resetFeedback = { type: null, message: '' };
    },
    async sendPasswordResetLink() {
      if (!this.resetUser) return;
      this.sendingReset = true;
      this.resetFeedback = { type: null, message: '' };
      try {
        const { data } = await axios.post(`/api/admin/users/${this.resetUser.id}/reset-password`);
        this.resetFeedback = {
          type: 'success',
          message: data.message || `Password reset link sent to ${this.resetUser.email} (expires in 10 minutes).`
        };
      } catch (e) {
        this.resetFeedback = {
          type: 'error',
          message: e.response?.data?.message || 'Failed to send password reset link.'
        };
      } finally {
        this.sendingReset = false;
      }
    },
    async deleteUser(id) {
      if (!confirm('Are you sure you want to permanently delete this user account?')) return;
      try {
        await axios.delete(`/api/admin/users/${id}`);
        this.loadUsers();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete user.');
      }
    }
  },
  mounted() {
    this.loadUsers();
  }
};
</script>
