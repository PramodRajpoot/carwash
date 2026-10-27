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
              <th>Assigned Washer</th>
              <th>Price</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in paginatedOrders" :key="o.id">
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
              <td>
                <span v-if="o.washer" class="badge badge-cyan" style="font-size: 0.8rem;">
                  🧼 {{ o.washer.user?.name || 'Washer' }}
                </span>
                <span v-else class="text-muted" style="font-size: 0.8rem; font-style: italic;">
                  Unassigned
                </span>
              </td>
              <td>
                <div style="font-weight: 600;">₹{{ o.total_price }}</div>
                <div v-if="o.coupon_code || parseFloat(o.coupon_discount || 0) > 0" style="font-size: 0.68rem; color: var(--accent-emerald); font-weight: 600;">
                  🎟️ {{ o.coupon_code }}: -₹{{ parseFloat(o.coupon_discount || 0).toFixed(2) }}
                </div>
              </td>
              <td>
                <div v-if="o.payment_status === 'partially_paid'">
                  <span class="badge badge-amber" style="font-size:0.75rem; font-weight:700; display:inline-block; margin-bottom: 0.25rem;">
                    ⚠️ Amount is Remaining
                  </span>
                  <div style="font-size: 0.78rem; color: var(--accent-amber); font-weight: 700;">
                    ₹{{ (parseFloat(o.total_price) - parseFloat(o.paid_amount || 0)).toFixed(2) }} Due
                  </div>
                  <div style="font-size: 0.72rem; color: var(--accent-emerald); margin-top: 2px;">
                    ₹{{ parseFloat(o.paid_amount || 0).toFixed(2) }} Paid
                  </div>
                </div>
                <span v-else class="badge" :class="o.payment_status === 'paid' ? 'badge-emerald' : 'badge-rose'">
                  {{ o.payment_status === 'paid' ? '✓ Fully Paid' : o.payment_status }}
                </span>
                <div style="margin-top: 0.25rem;">
                  <span v-if="o.payment_method === 'cod'" class="badge badge-amber" style="font-size:0.65rem;">💵 COD</span>
                  <span v-else class="badge badge-cyan" style="font-size:0.65rem;">💳 Online</span>
                </div>
              </td>
              <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
              <td>
                <button 
                  v-if="o.status !== 'completed' && o.status !== 'cancelled'" 
                  class="btn btn-outline btn-sm" 
                  @click="openManageModal(o)">
                  Manage
                </button>
                <span 
                  v-else-if="o.status === 'completed'" 
                  class="text-muted" 
                  style="font-size: 0.75rem; padding: 0.2rem 0.5rem; background: rgba(16,185,129,0.08); border-radius: 4px; border: 1px solid rgba(16,185,129,0.2); color: var(--accent-emerald);" 
                  title="Completed washes cannot be edited">
                  🔒 Completed
                </span>
                <span 
                  v-else-if="o.status === 'cancelled'" 
                  class="text-muted" 
                  style="font-size: 0.75rem; padding: 0.2rem 0.5rem; background: rgba(239,68,68,0.08); border-radius: 4px; border: 1px solid rgba(239,68,68,0.2); color: var(--accent-rose);" 
                  title="Cancelled washes cannot be edited">
                  🔒 Cancelled
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="orders.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
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
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, orders.length) }} of {{ orders.length }}
          </span>
        </div>
        <div class="flex gap-1" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
          <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
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

        <div v-if="selectedOrder.status === 'completed'" class="alert alert-success" style="margin-bottom: 1rem; font-size: 0.85rem; padding: 0.6rem 0.8rem; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: var(--accent-emerald); border-radius: 6px;">
          ✓ This wash has been completed and is not editable.
        </div>

        <form @submit.prevent="updateStatus">
          <div class="form-group">
            <label>Wash Progress Status</label>
            <select v-model="form.status" class="form-select" required :disabled="selectedOrder.status === 'completed'">
              <option value="pending">Pending</option>
              <option value="assigned">Assigned / Dispatched</option>
              <option value="ongoing">Wash In-Progress</option>
              <option value="completed">Completed &amp; Sparkling</option>
              <option value="cancelled">Cancelled</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>

          <!-- Payment Status / Balance Collection -->
          <div style="margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 1rem;">
            <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.35rem; display: block;">💰 Payment Status</label>
            <div v-if="selectedOrder.payment_status === 'partially_paid'" style="background: rgba(245, 158, 11, 0.08); border-radius: var(--radius-sm); padding: 0.75rem 0.9rem; margin-bottom: 0.75rem; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span style="font-weight: 700; color: #f59e0b; font-size: 0.92rem;">⚠️ Status: Amount is Remaining</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span>Total Order Price:</span>
                <strong>₹{{ parseFloat(selectedOrder.total_price).toFixed(2) }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span>Amount Paid:</span>
                <strong style="color: var(--accent-emerald);">₹{{ parseFloat(selectedOrder.paid_amount || 0).toFixed(2) }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span>Remaining Balance Due:</span>
                <strong style="color: var(--accent-amber); font-size: 0.95rem;">₹{{ (parseFloat(selectedOrder.total_price) - parseFloat(selectedOrder.paid_amount || 0)).toFixed(2) }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Payment Mode:</span>
                <strong :style="{ color: selectedOrder.payment_method === 'cod' ? 'var(--accent-amber)' : 'var(--accent-cyan)' }">
                  {{ selectedOrder.payment_method === 'cod' ? '💵 Cash on Delivery (COD)' : '💳 Online Payment' }}
                </strong>
              </div>
            </div>
            <select v-model="form.payment_status" class="form-select">
              <option value="partially_paid" v-if="selectedOrder.payment_status === 'partially_paid'">Amount is Remaining (₹{{ (parseFloat(selectedOrder.total_price) - parseFloat(selectedOrder.paid_amount || 0)).toFixed(2) }} Due)</option>
              <option value="paid">Mark as Paid (Full Balance Collected)</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <p v-if="selectedOrder.payment_status === 'partially_paid'" class="text-muted" style="font-size: 0.75rem; margin-top: 0.35rem;">
              Select "Mark as Paid" when customer pays the rest amount upon completion of the car wash.
            </p>
          </div>



          <div class="form-group" style="margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 1rem;">
            <label style="font-weight: 600; color: var(--accent-cyan);">🧼 Assign Washer to Task</label>
            <p class="text-muted" style="font-size: 0.75rem; margin-bottom: 0.5rem;">
              Assign this wash task to an active technician from your center.
            </p>
            <select v-model="form.washer_id" class="form-select" :disabled="selectedOrder.status === 'completed'">
              <option :value="null">-- No Washer Assigned --</option>
              <option v-for="w in washers" :key="w.id" :value="w.id">
                {{ w.user?.name }} (Active Tasks: {{ w.active_tasks || 0 }})
              </option>
            </select>
            <div v-if="washers.length === 0" class="text-muted" style="font-size: 0.75rem; margin-top: 0.25rem;">
              No washers currently assigned to your center. Please contact platform admin.
            </div>
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
      washers: [],
      loading: true,
      selectedOrder: null,
      submitting: false,
      currentPage: 1,
      itemsPerPage: 10,
      form: {
        status: '',
        washer_id: null,
        payment_status: '',
        postponed_date: '',
        postponed_slot: '09:00 AM - 11:00 AM'
      }
    };
  },
  computed: {
    paginatedOrders() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.orders.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.orders.length / this.itemsPerPage) || 1;
    }
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
    async loadWashers() {
      try {
        const { data } = await axios.get('/api/franchisee/washers');
        this.washers = data;
      } catch (e) {
        console.error(e);
      }
    },
    openManageModal(o) {
      if (o.status === 'completed' || o.status === 'cancelled') {
        alert('Completed or cancelled washes cannot be edited.');
        return;
      }
      this.selectedOrder = o;
      this.form.status = o.status;
      this.form.washer_id = o.washer_id || null;
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
        this.loadWashers();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to update order status.');
      }
      this.submitting = false;
    }
  },
  mounted() {
    this.loadOrders();
    this.loadWashers();
  }
};
</script>
