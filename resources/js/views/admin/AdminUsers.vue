<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
      <div>
        <h3>Platform User Profiles</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Manage admin accounts, franchisees center staff, and registered customers.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="openCreateModal">+ Generate User</button>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading accounts list...
    </div>

    <div v-else>
      <div v-if="users.length" class="table-wrap">
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
            <tr v-for="u in users" :key="u.id">
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
                <span v-else class="text-muted" style="font-size: 0.8rem;">-</span>
              </td>
              <td>
                <span class="badge" :class="u.status === 'active' ? 'badge-emerald' : 'badge-rose'">
                  {{ u.status }}
                </span>
              </td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem;" @click="openEditModal(u)">✏️</button>
                  <button class="btn btn-sm btn-outline btn-amber" style="padding: 0.25rem 0.5rem;" @click="openResetModal(u)">🔑</button>
                  <button class="btn btn-ghost btn-sm text-danger" style="padding: 0.25rem 0.5rem;" @click="deleteUser(u.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
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
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Platform Role</label>
            <select v-model="form.role" class="form-select" required>
              <option value="customer">Customer</option>
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
    <div v-if="resetUser" class="modal-overlay" @click.self="resetUser = null">
      <div class="modal-content">
        <h3>Reset Password</h3>
        <p class="text-secondary" style="font-size: 0.85rem; margin-bottom: 1rem;">
          Assigning a new security key for: <strong>{{ resetUser.name }}</strong>
        </p>

        <form @submit.prevent="resetPassword">
          <div class="form-group">
            <label>New Security Password</label>
            <input v-model="resetPasswordVal" type="password" class="form-input" placeholder="Min 6 characters" required />
          </div>
          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary">Confirm Reset</button>
            <button type="button" class="btn btn-ghost" @click="resetUser = null">Cancel</button>
          </div>
        </form>
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
      users: [],
      loading: true,
      showModal: false,
      isEdit: false,
      submitting: false,
      error: '',
      resetUser: null,
      resetPasswordVal: '',
      selectedUserId: null,
      form: {
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer',
        status: 'active',
        center_name: '',
        city: '',
        address: '',
        royalty_percentage: 10
      }
    };
  },
  methods: {
    roleBadge(r) {
      return { super_admin: 'badge-rose', admin: 'badge-violet', franchisee: 'badge-cyan', customer: 'badge-emerald' }[r] || 'badge-cyan';
    },
    formatRole(r) {
      return r.toUpperCase().replace('_', ' ');
    },
    async loadUsers() {
      try {
        const { data } = await axios.get('/api/admin/users');
        this.users = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    openCreateModal() {
      this.isEdit = false;
      this.error = '';
      this.form = {
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer',
        status: 'active',
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
        center_name: u.franchisee?.center_name || '',
        city: u.franchisee?.city || '',
        address: u.franchisee?.address || '',
        royalty_percentage: u.franchisee?.royalty_percentage || 10
      };
      this.showModal = true;
    },
    async saveUser() {
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
      this.resetPasswordVal = '';
    },
    async resetPassword() {
      try {
        const { data } = await axios.post(`/api/admin/users/${this.resetUser.id}/reset-password`, { password: this.resetPasswordVal });
        alert(data.message);
        this.resetUser = null;
      } catch (e) {
        alert(e.response?.data?.message || 'Password reset failed.');
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
