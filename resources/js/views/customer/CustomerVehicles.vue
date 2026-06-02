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
      <div v-if="vehicles.length" class="grid grid-3 gap-3">
        <div v-for="v in vehicles" :key="v.id" class="glass-card flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
              <span class="badge badge-cyan">{{ formatType(v.vehicle_type) }}</span>
              <button class="btn btn-ghost btn-sm text-danger" style="padding:0.25rem 0.5rem;" @click="deleteVehicle(v.id)">🗑️</button>
            </div>
            <h4 style="margin-bottom: 0.25rem;">{{ v.make_model }}</h4>
            <p class="text-secondary" style="font-family: monospace; font-size: 1rem; letter-spacing: 0.5px; background: var(--bg-secondary); padding: 0.4rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: inline-block;">
              {{ v.plate_number }}
            </p>
          </div>
          <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;" class="flex justify-between items-center">
            <span class="text-muted" style="font-size: 0.75rem;">Registered {{ formatDate(v.created_at) }}</span>
            <router-link to="/customer/bookings" class="btn btn-ghost btn-sm" style="color: var(--accent-emerald);">Book Wash</router-link>
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
            <label>License Plate Number</label>
            <input v-model="form.plate_number" class="form-input" placeholder="e.g. MH 12 AB 1234" required />
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
      }
    };
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
