<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
      <div>
        <h3>Wash Slot Allocations</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Modify the maximum concurrent wash booking capacities per center by date and slot interval.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="showAddModal = true">+ Adjust Cap</button>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading capacity slots...
    </div>

    <div v-else>
      <div v-if="slots.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Franchisee Center</th>
              <th>Date</th>
              <th>Time Range</th>
              <th>Max Capacity Cap</th>
              <th>Active Bookings</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in slots" :key="s.id">
              <td style="font-weight:600; color:var(--text-primary);">{{ s.franchisee?.center_name }}</td>
              <td>{{ s.date }}</td>
              <td style="font-family: monospace;">{{ s.time_range }}</td>
              <td style="font-weight: 700; color: var(--accent-cyan);">{{ s.max_bookings }} washes</td>
              <td>{{ s.current_bookings }} washes</td>
              <td>
                <span class="badge" :class="s.current_bookings >= s.max_bookings ? 'badge-rose' : 'badge-emerald'">
                  {{ s.current_bookings >= s.max_bookings ? 'FULLY BOOKED' : 'SLOTS AVAILABLE' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <p>No customized booking capacity profiles saved. Default is 3 washes per slot.</p>
      </div>
    </div>

    <!-- Edit/Save Slot Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>Adjust Slot Capacity Cap</h3>
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <form @submit.prevent="saveSlot">
          <div class="form-group">
            <label>Franchisee Center</label>
            <select v-model="form.franchisee_id" class="form-select" @change="fetchAssignedSlots" required>
              <option value="">Select Center</option>
              <option v-for="c in centers" :key="c.id" :value="c.id">{{ c.center_name }} ({{ c.city }})</option>
            </select>
          </div>

          <div class="flex gap-2">
            <div class="form-group" style="flex: 1;">
              <label>Start Date</label>
              <input v-model="form.start_date" type="date" class="form-input" required />
            </div>
            <div class="form-group" style="flex: 1;">
              <label>End Date</label>
              <input v-model="form.end_date" type="date" class="form-input" required :min="form.start_date" />
            </div>
          </div>

          <div class="form-group">
            <label>Time Slot Ranges</label>
            <div v-if="!form.franchisee_id" class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">
              Select a center first
            </div>
            <div v-else-if="fetchingSlots" class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">
              Loading slots...
            </div>
            <div v-else-if="availableTimeRanges.length === 0" class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">
              No slots assigned to this center
            </div>
            <div v-else style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">
              <label v-for="range in availableTimeRanges" :key="range" style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" :value="range" v-model="form.time_ranges" />
                <span style="font-family: monospace;">{{ range }}</span>
              </label>
            </div>
            <div v-if="form.time_ranges.length === 0 && availableTimeRanges.length > 0" class="text-rose" style="font-size: 0.75rem; margin-top: 0.25rem;">
              Please select at least one time slot.
            </div>
          </div>

          <div class="form-group">
            <label>Maximum Booking Capacity (Concurrent washes allowed)</label>
            <input v-model="form.max_bookings" type="number" min="1" class="form-input" required />
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Saving...' : 'Confirm Cap' }}
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
  name: 'AdminSlots',
  data() {
    return {
      slots: [],
      centers: [],
      loading: true,
      showAddModal: false,
      submitting: false,
      error: '',
      availableTimeRanges: [],
      fetchingSlots: false,
      form: {
        franchisee_id: '',
        start_date: new Date().toISOString().substr(0, 10),
        end_date: new Date().toISOString().substr(0, 10),
        time_ranges: [],
        max_bookings: 5
      }
    };
  },
  methods: {
    async loadData() {
      try {
        const [slts, cnts] = await Promise.all([
          axios.get('/api/admin/slots'),
          axios.get('/api/centers')
        ]);
        this.slots = slts.data;
        this.centers = cnts.data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    async fetchAssignedSlots() {
      this.form.time_ranges = [];
      this.availableTimeRanges = [];
      if (!this.form.franchisee_id) return;
      
      this.fetchingSlots = true;
      try {
        const { data } = await axios.get('/api/admin/master-slots');
        this.availableTimeRanges = data.filter(s => s.status === 'active').map(s => s.time_range);
      } catch (e) {
        console.error("Could not fetch master slots.");
      }
      this.fetchingSlots = false;
    },
    async saveSlot() {
      if (this.form.time_ranges.length === 0) {
        this.error = 'Please select at least one time slot range.';
        return;
      }
      this.submitting = true;
      this.error = '';
      try {
        await axios.post('/api/admin/slots', this.form);
        this.showAddModal = false;
        this.loadData();
      } catch (e) {
        this.error = e.response?.data?.message || 'Failed to update slot settings.';
      }
      this.submitting = false;
    }
  },
  mounted() {
    this.loadData();
  }
};
</script>
