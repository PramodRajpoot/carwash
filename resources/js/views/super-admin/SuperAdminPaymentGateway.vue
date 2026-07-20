<template>
  <div class="dash-content-body">
    <div class="dash-header-bar mb-4 flex justify-between items-center">
      <div>
        <h2>Payment Gateway Management</h2>
        <p class="text-muted text-sm mt-1">Configure and manage your payment processors.</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary shadow-sm" style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.25rem;">+</span> Add Payment Gateway
      </button>
    </div>

    <div v-if="loading" class="glass-card flex items-center justify-center p-5">
      <div class="spinner"></div>
      <span class="ml-2">Loading gateways...</span>
    </div>

    <div v-else class="glass-card p-0" style="background: var(--bg-primary); overflow: hidden;">
      <div class="table-responsive">
        <table class="table w-full">
          <thead>
            <tr>
              <th class="text-left py-4 px-5">Gateway Name</th>
              <th class="text-left py-4 px-5">Keys Configured</th>
              <th class="text-left py-4 px-5">Status (Active)</th>
              <th class="text-right py-4 px-5">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="gateway in paginatedGateways" :key="gateway.slug" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td class="py-4 px-5">
                <div class="font-bold text-lg" style="color: var(--text-primary);">{{ gateway.name }}</div>
                <div class="text-xs text-muted">{{ gateway.slug }}</div>
              </td>
              <td class="py-4 px-5">
                <span class="badge badge-info">{{ gateway.config ? Object.keys(gateway.config).length : 0 }} parameters</span>
              </td>
              <td class="py-4 px-5">
                <label class="toggle-switch">
                  <input type="checkbox" :checked="gateway.is_active" @change="setActiveGateway(gateway)" />
                  <span class="toggle-slider"></span>
                </label>
                <span class="ml-2 text-sm font-semibold" :class="gateway.is_active ? 'text-green-500' : 'text-gray-400'">
                  {{ gateway.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="py-4 px-5 text-right">
                <button @click="openEditModal(gateway)" class="btn btn-sm btn-outline mr-2 text-cyan-600 border-cyan-600 hover:bg-cyan-600 hover:text-white">
                  Edit
                </button>
                <button v-if="!gateway.is_default" @click="deleteGateway(gateway)" class="btn btn-sm btn-outline text-red-500 border-red-500 hover:bg-red-500 hover:text-white">
                  Delete
                </button>
              </td>
            </tr>
            <tr v-if="gateways.length === 0">
              <td colspan="4" class="text-center py-8 text-muted">No payment gateways configured.</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="gateways.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
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
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, gateways.length) }} of {{ gateways.length }}
          </span>
        </div>
        <div class="flex gap-1" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
          <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>
      
      <div v-if="message" class="p-4 bg-green-50 text-green-700 border-t border-green-100 text-center font-medium">
        ✅ {{ message }}
      </div>
      <div v-if="error" class="p-4 bg-red-50 text-red-700 border-t border-red-100 text-center font-medium">
        ⚠️ {{ error }}
      </div>
    </div>

    <!-- Edit/Add Modal -->
    <div v-if="showModal" class="modal-backdrop fade-in flex items-center justify-center">
      <div class="glass-card modal-content" style="width: 500px; max-width: 90vw; background: var(--bg-primary);">
        <div class="flex justify-between items-center mb-5 border-b pb-3" style="border-color: var(--border-color);">
          <h3 class="text-xl font-bold">{{ isEditing ? 'Edit' : 'Add' }} Payment Gateway</h3>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-700 text-2xl font-bold focus:outline-none">&times;</button>
        </div>
        
        <div class="modal-body max-h-[60vh] overflow-y-auto pr-2">
          <div class="form-group">
            <label>Gateway Name</label>
            <input type="text" v-model="modalData.name" class="form-input w-full" placeholder="e.g. PayU" :disabled="isEditing && modalData.is_default" />
            <p v-if="!isEditing" class="text-xs text-muted mt-1">ID will be generated automatically.</p>
          </div>

          <div class="mt-5">
            <div class="flex justify-between items-center mb-3">
              <label class="mb-0">Configuration Parameters</label>
              <button @click="addConfigParam" class="text-xs font-bold text-cyan-600 hover:text-cyan-800" type="button">+ Add Field</button>
            </div>
            
            <div v-for="(val, key, index) in modalData.config" :key="index" class="flex gap-2 mb-3 items-start">
              <div class="flex-1">
                <input type="text" :value="key" @change="updateConfigKey(key, $event.target.value)" class="form-input w-full text-sm font-mono bg-gray-50 dark:bg-gray-800" placeholder="Key (e.g. client_id)" :disabled="modalData.is_default" />
              </div>
              <div class="flex-1">
                <input v-if="key.includes('secret') || key.includes('key')" type="password" v-model="modalData.config[key]" class="form-input w-full text-sm" placeholder="Value" />
                <input v-else type="text" v-model="modalData.config[key]" class="form-input w-full text-sm" placeholder="Value" />
              </div>
              <button v-if="!modalData.is_default" @click="removeConfigParam(key)" class="text-red-500 hover:text-red-700 mt-2 px-2" type="button">&times;</button>
            </div>
            <div v-if="Object.keys(modalData.config).length === 0" class="text-center p-4 border border-dashed rounded text-sm text-muted">
              No parameters added yet.
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end gap-3 pt-4 border-t" style="border-color: var(--border-color);">
          <button @click="closeModal" class="btn btn-outline" type="button">Cancel</button>
          <button @click="saveGateway" class="btn btn-primary" type="button" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Gateway' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SuperAdminPaymentGateway',
  data() {
    return {
      loading: true,
      saving: false,
      message: '',
      error: '',
      gateways: [],
      showModal: false,
      isEditing: false,
      modalData: {
        slug: '',
        name: '',
        config: {},
        is_default: false
      },
      currentPage: 1,
      itemsPerPage: 10
    };
  },
  computed: {
    paginatedGateways() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.gateways.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.gateways.length / this.itemsPerPage) || 1;
    }
  },
  mounted() {
    this.fetchGateways();
  },
  methods: {
    async fetchGateways() {
      try {
        const response = await axios.get('/api/super-admin/payment-gateways');
        this.gateways = response.data;
      } catch (err) {
        this.error = 'Failed to load configuration.';
      } finally {
        this.loading = false;
      }
    },
    
    async setActiveGateway(gateway) {
      this.message = '';
      this.error = '';
      
      // Optimistic UI update
      this.gateways.forEach(g => { g.is_active = (g.slug === gateway.slug); });
      
      try {
        const response = await axios.put(`/api/super-admin/payment-gateways/${gateway.slug}/activate`);
        this.message = response.data.message;
        setTimeout(() => { this.message = ''; }, 3000);
      } catch (err) {
        this.error = 'Failed to activate gateway.';
        this.fetchGateways(); // Revert on failure
      }
    },
    
    openAddModal() {
      this.isEditing = false;
      this.modalData = {
        slug: '',
        name: '',
        config: {},
        is_default: false
      };
      this.showModal = true;
    },
    
    openEditModal(gateway) {
      this.isEditing = true;
      this.modalData = {
        slug: gateway.slug,
        name: gateway.name,
        is_default: gateway.is_default,
        // Clone deeply to avoid reactivity issues during editing
        config: JSON.parse(JSON.stringify(gateway.config || {}))
      };
      this.showModal = true;
    },
    
    closeModal() {
      this.showModal = false;
    },
    
    addConfigParam() {
      const tempKey = 'new_key_' + Object.keys(this.modalData.config).length;
      this.modalData.config = { ...this.modalData.config, [tempKey]: '' };
    },
    
    updateConfigKey(oldKey, newKey) {
      if (oldKey === newKey || !newKey.trim()) return;
      
      const newConfig = {};
      Object.keys(this.modalData.config).forEach(k => {
        if (k === oldKey) {
          newConfig[newKey.trim()] = this.modalData.config[oldKey];
        } else {
          newConfig[k] = this.modalData.config[k];
        }
      });
      this.modalData.config = newConfig;
    },
    
    removeConfigParam(key) {
      const newConfig = { ...this.modalData.config };
      delete newConfig[key];
      this.modalData.config = newConfig;
    },
    
    async saveGateway() {
      if (!this.modalData.name.trim()) {
        alert('Gateway Name is required');
        return;
      }
      
      this.saving = true;
      this.message = '';
      this.error = '';
      
      try {
        if (this.isEditing) {
          const response = await axios.put(`/api/super-admin/payment-gateways/${this.modalData.slug}`, {
            name: this.modalData.name,
            config: this.modalData.config
          });
          this.message = response.data.message;
        } else {
          const slug = this.modalData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const response = await axios.post('/api/super-admin/payment-gateways', {
            name: this.modalData.name,
            slug: slug,
            config: this.modalData.config
          });
          this.message = response.data.message;
        }
        
        this.closeModal();
        this.fetchGateways();
        setTimeout(() => { this.message = ''; }, 3000);
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save gateway.';
        this.closeModal();
      } finally {
        this.saving = false;
      }
    },
    
    async deleteGateway(gateway) {
      if (confirm(`Are you sure you want to delete the ${gateway.name} gateway configuration?`)) {
        if (gateway.is_active) {
          alert('Cannot delete the currently active gateway. Please switch to another gateway first.');
          return;
        }
        
        try {
          const response = await axios.delete(`/api/super-admin/payment-gateways/${gateway.slug}`);
          this.message = response.data.message;
          this.fetchGateways();
          setTimeout(() => { this.message = ''; }, 3000);
        } catch (err) {
          this.error = err.response?.data?.message || 'Failed to delete gateway.';
        }
      }
    }
  }
};
</script>

<style scoped>
.table {
  border-collapse: collapse;
}
.table th {
  border-bottom: 2px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge {
  display: inline-block;
  padding: 0.35em 0.65em;
  font-size: 0.75em;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.375rem;
}
.badge-info {
  background-color: rgba(6, 182, 212, 0.1);
  color: #0891b2;
}

/* Toggle Switch Styles */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  vertical-align: middle;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: .3s;
  border-radius: 24px;
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
input:checked + .toggle-slider {
  background-color: #10b981;
}
input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: 1050;
  backdrop-filter: blur(4px);
}
.modal-content {
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  padding: 1.5rem;
  border-radius: 0.75rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(6, 182, 212, 0.2);
  border-top-color: var(--accent-cyan);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
}
</style>
