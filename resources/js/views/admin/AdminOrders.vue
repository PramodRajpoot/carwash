<template>
  <div>
    <div style="margin-bottom: 1.5rem;">
      <h3>Global Service Bookings</h3>
      <p class="text-muted" style="font-size: 0.85rem;">View all active cleaning appointments, reassign centers, and handle rescheduling requests.</p>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading global ledger...
    </div>

    <div v-else>
      <div v-if="orders.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Service package</th>
              <th>Center Assigned</th>
              <th>Wash Date</th>
              <th>Price</th>
              <th>Progress</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id">
              <td>#{{ o.id }}</td>
              <td>
                <div style="font-weight:600; color:var(--text-primary);">{{ o.customer?.name }}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">{{ o.customer?.email }}</div>
              </td>
              <td>{{ o.vehicle?.make_model }} ({{ o.vehicle?.plate_number }})</td>
              <td>{{ o.package?.name }}</td>
              <td>
                <span v-if="o.franchisee" class="text-secondary" style="font-weight: 500;">
                  🏡 {{ o.franchisee.center_name }}
                </span>
                <span v-else class="text-muted" style="font-style: italic;">Unassigned</span>
              </td>
              <td>
                <div>{{ o.booking_date }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">{{ o.slot_time }}</div>
              </td>
              <td>
                <div style="font-weight:600; color:var(--text-primary);">₹{{ o.total_price }}</div>
                <div style="font-size: 0.7rem;" :style="{ color: o.payment_status === 'paid' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }">
                  {{ o.payment_status?.toUpperCase() }} ({{ o.payment_method?.toUpperCase() }})
                </div>
              </td>
              <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
              <td>
                <button class="btn btn-outline btn-sm" @click="openEditModal(o)">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <p>No bookings have been made on the platform yet.</p>
      </div>
    </div>

    <!-- Edit Order Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click.self="selectedOrder = null">
      <div class="modal-content">
        <h3>Modify Order #{{ selectedOrder.id }}</h3>
        
        <form @submit.prevent="updateOrder">
          <div class="form-group">
            <label>Assigned Franchisee Center</label>
            <select v-model="form.franchisee_id" class="form-select">
              <option value="">-- Unassigned --</option>
              <option v-for="c in centers" :key="c.id" :value="c.id">{{ c.center_name }} ({{ c.city }})</option>
            </select>
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Wash Date</label>
              <input v-model="form.booking_date" type="date" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Time Slot</label>
              <select v-model="form.slot_time" class="form-select" required>
                <option>09:00 AM - 11:00 AM</option>
                <option>11:00 AM - 01:00 PM</option>
                <option>01:00 PM - 03:00 PM</option>
                <option>03:00 PM - 05:00 PM</option>
              </select>
            </div>
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Progress Status</label>
              <select v-model="form.status" class="form-select" required>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>
            <div class="form-group">
              <label>Payment status</label>
              <select v-model="form.payment_status" class="form-select" required>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Override Total Wash Price (₹)</label>
            <input v-model="form.total_price" type="number" min="0" class="form-input" required />
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Updating...' : 'Save Changes' }}
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
  name: 'AdminOrders',
  data() {
    return {
      orders: [],
      centers: [],
      loading: true,
      selectedOrder: null,
      submitting: false,
      form: {
        franchisee_id: '',
        booking_date: '',
        slot_time: '',
        status: '',
        payment_status: '',
        total_price: 0
      }
    };
  },
  methods: {
    statusBadge(s) {
      return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan';
    },
    async loadData() {
      try {
        const [ord, cnt] = await Promise.all([
          axios.get('/api/admin/orders'),
          axios.get('/api/centers')
        ]);
        this.orders = ord.data;
        this.centers = cnt.data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    openEditModal(o) {
      this.selectedOrder = o;
      this.form = {
        franchisee_id: o.franchisee_id || '',
        booking_date: o.booking_date,
        slot_time: o.slot_time,
        status: o.status,
        payment_status: o.payment_status,
        total_price: o.total_price
      };
    },
    async updateOrder() {
      this.submitting = true;
      try {
        await axios.put(`/api/admin/orders/${this.selectedOrder.id}`, this.form);
        this.selectedOrder = null;
        this.loadData();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to modify order.');
      }
      this.submitting = false;
    }
  },
  mounted() {
    this.loadData();
  }
};
</script>
