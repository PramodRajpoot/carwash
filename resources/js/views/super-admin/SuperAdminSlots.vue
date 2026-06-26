<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
      <div>
        <h3>Master Slots Configuration</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Create and manage standard wash slots globally across all franchises.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="openModal()">+ Add Master Slot</button>
    </div>

    <div class="glass-card">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading...</div>
      <div v-else-if="masterSlots.length === 0" class="text-muted" style="text-align:center;padding:2rem">No master slots configured yet.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Time Range</th>
              <th>Default Max Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in masterSlots" :key="slot.id">
              <td>{{ slot.id }}</td>
              <td style="font-weight:600">{{ slot.name }}</td>
              <td style="font-family: monospace;">{{ slot.time_range }}</td>
              <td>{{ slot.default_max_bookings }} washes</td>
              <td>
                <span class="badge" :class="slot.status === 'active' ? 'badge-emerald' : 'badge-rose'">
                  {{ slot.status }}
                </span>
              </td>
              <td>
                <button class="btn btn-ghost btn-sm" @click="openModal(slot)" style="padding: 0.2rem 0.5rem; margin-right: 0.5rem; color: var(--accent-cyan);">Edit</button>
                <button class="btn btn-ghost btn-sm" @click="deleteSlot(slot.id)" style="padding: 0.2rem 0.5rem; color: var(--accent-rose);">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit/Save Slot Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Edit Master Slot' : 'Create Master Slot' }}</h3>
        <div v-if="error" class="alert alert-error" style="margin-bottom: 1rem;">{{ error }}</div>

        <form @submit.prevent="saveSlot">
          <div class="form-group">
            <label>Name</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="e.g. Morning Slot 1" required />
          </div>

          <div class="form-group">
            <label>Time Range</label>
            <input v-model="form.time_range" type="text" class="form-input" placeholder="e.g. 09:00 AM - 11:00 AM" required />
            <span class="text-muted" style="font-size: 0.75rem;">This precise string will be displayed to customers.</span>
          </div>

          <div class="form-group">
            <label>Default Max Capacity</label>
            <input v-model="form.default_max_bookings" type="number" min="1" class="form-input" required />
          </div>

          <div class="form-group">
            <label>Status</label>
            <select v-model="form.status" class="form-select" required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Saving...' : 'Save Slot' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="showModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'SuperAdminSlots',
  data() {
    return {
      masterSlots: [],
      loading: true,
      showModal: false,
      submitting: false,
      isEditing: false,
      error: '',
      form: { id: null, name: '', time_range: '', default_max_bookings: 3, status: 'active' }
    };
  },
  methods: {
    async loadSlots() {
      try {
        const { data } = await axios.get('/api/admin/master-slots');
        this.masterSlots = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    openModal(slot = null) {
      this.error = '';
      if (slot) {
        this.isEditing = true;
        this.form = { ...slot };
      } else {
        this.isEditing = false;
        this.form = { id: null, name: '', time_range: '', default_max_bookings: 3, status: 'active' };
      }
      this.showModal = true;
    },
    async saveSlot() {
      this.submitting = true;
      this.error = '';
      try {
        if (this.isEditing) {
          await axios.put(`/api/super-admin/master-slots/${this.form.id}`, this.form);
        } else {
          await axios.post('/api/super-admin/master-slots', this.form);
        }
        this.showModal = false;
        this.loadSlots();
      } catch (e) {
        this.error = e.response?.data?.message || 'Failed to save master slot.';
      }
      this.submitting = false;
    },
    async deleteSlot(id) {
      if (!confirm('Are you sure you want to delete this master slot? This will not affect existing bookings but will remove it from the global pool.')) return;
      try {
        await axios.delete(`/api/super-admin/master-slots/${id}`);
        this.loadSlots();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete master slot.');
      }
    }
  },
  mounted() {
    this.loadSlots();
  }
};
</script>
