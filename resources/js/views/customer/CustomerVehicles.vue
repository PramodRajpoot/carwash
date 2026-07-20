<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
      <div>
        <h3>My Garage</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Add and manage your fleet for simple one-tap booking.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="showAddModal = true">+ Register Vehicle</button>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading garage...
    </div>
    
    <div v-else>
      <div v-if="vehicles.length">
        <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Make & Model</th>
              <th>License Plate</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in paginatedVehicles" :key="v.id">
              <td><span class="badge badge-cyan">{{ formatType(v.vehicle_type) }}</span></td>
              <td style="font-weight: 600;">{{ v.make_model }}</td>
              <td>
                <span v-if="v.plate_number" style="font-family: monospace; background: var(--bg-secondary); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                  {{ v.plate_number }}
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="text-muted" style="font-size: 0.85rem;">{{ formatDate(v.created_at) }}</td>
              <td>
                <div class="flex gap-1">
                  <router-link to="/customer/bookings" class="btn btn-sm btn-outline">Book Wash</router-link>
                  <button class="btn btn-sm btn-danger" @click="deleteVehicle(v.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
          <select v-model="itemsPerPage" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="75">75</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
          </select>
          <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">Showing {{ vehicles.length ? (currentPage - 1) * itemsPerPage + 1 : 0 }} to {{ Math.min(currentPage * itemsPerPage, vehicles.length) }} of {{ vehicles.length }}</span>
        </div>
        <div class="flex gap-2" style="align-items: center;" v-if="totalPages > 1">
          <button class="btn btn-ghost btn-sm" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
          <span style="font-size: 0.85rem; padding: 0.2rem 0.5rem;">{{ currentPage }} / {{ totalPages }}</span>
          <button class="btn btn-ghost btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">🚗</div>
        <p>No vehicles registered. Add a vehicle to get started!</p>
      </div>
    </div>

    <!-- Add Vehicle Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>Register Vehicle</h3>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <form @submit.prevent="addVehicle">
          <div class="form-group">
            <label>Vehicle Type</label>
            <select v-model="form.vehicle_type" class="form-select" required>
              <option value="hatchback">Hatchback (Small/Medium)</option>
              <option value="sedan">Sedan (Luxury/Standard)</option>
              <option value="suv">SUV (Compact/MUV/Large)</option>
              <option value="commercial">Commercial Vehicle (Van/Pickup)</option>
              <option value="bus">Regular Fleet Bus</option>
              <option value="volvo_bus">Luxury Volvo Bus</option>
            </select>
          </div>
          <div class="form-group">
            <label>Make & Model</label>
            <input v-model="form.make_model" class="form-input" placeholder="e.g. Hyundai i20 / Honda City" required />
          </div>
          <div class="form-group">
            <label>License Plate Number <span class="text-muted" style="font-size: 0.8rem; font-weight: normal;">(Optional)</span></label>
            <input v-model="form.plate_number" class="form-input" placeholder="e.g. MH 12 AB 1234" />
          </div>
          <div class="flex gap-2" style="margin-top: 1rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Adding...' : 'Add Vehicle' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="showAddModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CustomerVehicles',
  data() {
    return {
      vehicles: [],
      loading: true,
      showAddModal: false,
      submitting: false,
      error: '',
      form: {
        vehicle_type: 'sedan',
        make_model: '',
        plate_number: ''
      },
      currentPage: 1,
      itemsPerPage: 10
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.vehicles.length / this.itemsPerPage) || 1;
    },
    paginatedVehicles() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.vehicles.slice(start, start + this.itemsPerPage);
    }
  },
  watch: {
    itemsPerPage() {
      this.currentPage = 1;
    }
  },
  methods: {
    formatType(t) {
      return t.toUpperCase().replace('_', ' ');
    },
    formatDate(d) {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    },
    async loadVehicles() {
      try {
        const { data } = await axios.get('/api/customer/vehicles');
        this.vehicles = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    async addVehicle() {
      this.submitting = true;
      this.error = '';
      try {
        await axios.post('/api/customer/vehicles', this.form);
        this.form.make_model = '';
        this.form.plate_number = '';
        this.showAddModal = false;
        this.loadVehicles();
      } catch (e) {
        this.error = e.response?.data?.message || 'Failed to add vehicle.';
      }
      this.submitting = false;
    },
    async deleteVehicle(id) {
      if (!confirm('Are you sure you want to remove this vehicle from your garage?')) return;
      try {
        await axios.delete(`/api/customer/vehicles/${id}`);
        this.loadVehicles();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete vehicle.');
      }
    }
  },
  mounted() {
    this.loadVehicles();
  }
};
</script>
