<template>
  <div>
    <div style="margin-bottom: 1.5rem;">
      <h3>Service Wash Orders</h3>
      <p class="text-muted" style="font-size: 0.85rem;">Manage active cleaning jobs and process payment collections.</p>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading orders...
    </div>

    <div v-else>
      <div v-if="orders.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Info</th>
              <th>Vehicle Details</th>
              <th>Package</th>
              <th>Date &amp; Slot</th>
              <th>Price</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id">
              <td>#{{ o.id }}</td>
              <td>
                <div style="font-weight: 600; color: var(--text-primary);">{{ o.customer?.name }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">{{ o.customer?.phone || 'No Phone' }}</div>
              </td>
              <td>
                <div>{{ o.vehicle?.make_model }}</div>
                <div style="font-size: 0.75rem; font-family: monospace;" class="text-secondary">{{ o.vehicle?.plate_number }}</div>
              </td>
              <td>{{ o.package?.name }}</td>
              <td>
                <div>{{ o.booking_date }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">{{ o.slot_time }}</div>
              </td>
              <td>₹{{ o.total_price }}</td>
              <td>
                <span class="badge" :class="o.payment_status === 'paid' ? 'badge-emerald' : 'badge-amber'">
                  {{ o.payment_status }}
                </span>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">Via {{ o.payment_method?.toUpperCase() }}</div>
              </td>
              <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
              <td>
                <button class="btn btn-outline btn-sm" @click="openManageModal(o)">Manage</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No active wash bookings assigned to your center.</p>
      </div>
    </div>

    <!-- Manage Order Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click.self="selectedOrder = null">
      <div class="modal-content">
        <h3>Manage Order #{{ selectedOrder.id }}</h3>
        <p class="text-secondary" style="font-size: 0.85rem; margin-bottom: 1rem;">
          Customer: <strong>{{ selectedOrder.customer?.name }}</strong> | Vehicle: <strong>{{ selectedOrder.vehicle?.make_model }}</strong>
        </p>

        <form @submit.prevent="updateStatus">
          <div class="form-group">
            <label>Wash Progress Status</label>
            <select v-model="form.status" class="form-select" required>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned / Dispatched</option>
              <option value="ongoing">Wash In-Progress</option>
              <option value="completed">Completed &amp; Sparkling</option>
              <option value="cancelled">Cancelled</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>

          <div class="form-group">
            <label>Payment Status</label>
            <select v-model="form.payment_status" class="form-select" required>
              <option value="unpaid">Unpaid / Collect Cash</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <!-- If postponed selected, show new inputs -->
          <div v-if="form.status === 'postponed'" style="margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 1rem;">
            <div class="form-group">
              <label>New Booking Date</label>
              <input v-model="form.postponed_date" type="date" class="form-input" required />
            </div>
            <div class="form-group">
              <label>New Slot Time</label>
              <select v-model="form.postponed_slot" class="form-select" required>
                <option>09:00 AM - 11:00 AM</option>
                <option>11:00 AM - 01:00 PM</option>
                <option>01:00 PM - 03:00 PM</option>
                <option>03:00 PM - 05:00 PM</option>
              </select>
            </div>
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Updating...' : 'Save Settings' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="selectedOrder = null">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'FranchiseeOrders',
  data() {
    return {
      orders: [],
      loading: true,
      selectedOrder: null,
      submitting: false,
      form: {
        status: '',
        payment_status: '',
        postponed_date: '',
        postponed_slot: '09:00 AM - 11:00 AM'
      }
    };
  },
  methods: {
    statusBadge(s) {
      return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan';
    },
    async loadOrders() {
      try {
        const { data } = await axios.get('/api/franchisee/orders');
        this.orders = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    openManageModal(o) {
      this.selectedOrder = o;
      this.form.status = o.status;
      this.form.payment_status = o.payment_status;
      this.form.postponed_date = o.booking_date;
      this.form.postponed_slot = o.slot_time;
    },
    async updateStatus() {
      this.submitting = true;
      try {
        await axios.put(`/api/franchisee/orders/${this.selectedOrder.id}/status`, this.form);
        this.selectedOrder = null;
        this.loadOrders();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to update order status.');
      }
      this.submitting = false;
    }
  },
  mounted() {
    this.loadOrders();
  }
};
</script>
