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
      <div class="glass-card mb-4 p-4 flex flex-wrap gap-3 items-end" style="background: var(--bg-primary); margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;">
        <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
          <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Search</label>
          <input v-model="filters.search" class="form-input" placeholder="ID, Name, Email, Plate..." />
        </div>
        <div class="form-group" style="min-width: 140px; margin-bottom: 0;">
          <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Status</label>
          <select v-model="filters.status" class="form-select">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>
        <div class="form-group" style="min-width: 150px; margin-bottom: 0;">
          <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Center</label>
          <select v-model="filters.franchisee_id" class="form-select">
            <option value="">All Centers</option>
            <option v-for="c in centers" :key="c.id" :value="c.id">{{ c.center_name }}</option>
          </select>
        </div>
        <div class="form-group" style="min-width: 120px; margin-bottom: 0;">
          <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Payment</label>
          <select v-model="filters.payment_status" class="form-select">
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        <div class="form-group" style="min-width: 140px; margin-bottom: 0;">
          <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Date</label>
          <input v-model="filters.date" type="date" class="form-input" />
        </div>
        <button class="btn btn-ghost" @click="clearFilters" v-if="hasFilters" title="Clear Filters" style="padding: 0.5rem; height: 42px;">✖</button>
      </div>

      <div v-if="filteredOrders.length" class="table-wrap">
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
            <tr v-for="o in paginatedOrders" :key="o.id">
              <td>#{{ o.id }}</td>
              <td>
                <div style="font-weight:600; color:var(--text-primary);">{{ o.customer?.name }}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">{{ o.customer?.email }}</div>
              </td>
              <td>{{ o.vehicle?.make_model }} ({{ o.vehicle?.plate_number }})</td>
              <td>
                <div style="font-weight:600; color:var(--text-primary);">{{ o.package?.name || 'Custom Package' }}</div>

                <!-- Package Wash Numbering: 1/4 in Green and Red -->
                <div v-if="o.package && o.package.max_bookings > 1" style="margin-top: 0.3rem;">
                  <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.75rem; font-weight: 700; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 7px; border-radius: 6px;" title="Wash Progress">
                    <span style="color: #10b981; font-weight: 800;">{{ getWashIndex(o) }}</span>
                    <span style="color: #94a3b8; font-weight: 600;">/</span>
                    <span style="color: #ef4444; font-weight: 800;">{{ o.package.max_bookings }}</span>
                    <span style="color: var(--text-muted); font-size: 0.68rem; font-weight: 500; margin-left: 2px;">Washes</span>
                  </span>
                </div>
                <div v-else-if="o.package" style="margin-top: 0.3rem;">
                  <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.72rem; font-weight: 700; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 6px; border-radius: 6px;">
                    <span style="color: #10b981; font-weight: 800;">1</span>
                    <span style="color: #94a3b8; font-weight: 600;">/</span>
                    <span style="color: #ef4444; font-weight: 800;">1</span>
                    <span style="color: var(--text-muted); font-size: 0.68rem; font-weight: 500; margin-left: 2px;">Wash</span>
                  </span>
                </div>

                <!-- Add-on Services: Clean name and price tags -->
                <div v-if="getAddons(o).length" style="margin-top: 0.35rem; display: flex; flex-direction: column; gap: 2px;">
                  <div v-for="(a, i) in getAddons(o)" :key="i" style="font-size: 0.72rem; color: var(--accent-cyan); display: flex; align-items: center; gap: 4px;">
                    <span style="color: #10b981; font-weight: 700;">+</span>
                    <span>{{ a.name }}</span>
                    <span v-if="a.price" class="text-muted" style="font-size: 0.68rem;">(₹{{ a.price }})</span>
                  </div>
                </div>
              </td>
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
                <div v-if="o.coupon_code || parseFloat(o.coupon_discount || 0) > 0" style="font-size: 0.68rem; color: var(--accent-emerald); font-weight: 600;">
                  🎟️ {{ o.coupon_code }}: -₹{{ parseFloat(o.coupon_discount || 0).toFixed(2) }}
                </div>
                <div style="font-size: 0.7rem;" :style="{ color: o.payment_status === 'paid' ? 'var(--accent-emerald)' : (o.payment_status === 'partially_paid' ? 'var(--accent-cyan)' : 'var(--accent-amber)') }">
                  {{ o.payment_status === 'partially_paid' ? 'PARTIAL (₹' + parseFloat(o.paid_amount || 99).toFixed(0) + ' Paid)' : o.payment_status?.toUpperCase() }} ({{ o.payment_method?.toUpperCase() }})
                </div>
                <div v-if="o.payment_status === 'partially_paid'" style="font-size: 0.68rem; color: var(--accent-amber); font-weight: 600;">
                  ₹{{ (parseFloat(o.total_price) - parseFloat(o.paid_amount || 99)).toFixed(2) }} Due
                </div>
              </td>
              <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
              <td>
                <button 
                  v-if="o.status !== 'completed' && o.status !== 'cancelled'" 
                  class="btn btn-outline btn-sm" 
                  @click="openEditModal(o)">
                  Edit
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
      
      <!-- Pagination -->
      <div v-if="filteredOrders.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
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
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredOrders.length) }} of {{ filteredOrders.length }} entries
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
      <div v-else-if="!orders.length" class="empty-state">
        <p>No bookings have been made on the platform yet.</p>
      </div>
      <div v-else class="empty-state">
        <p>No bookings match your current filter criteria.</p>
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
                <option value="partially_paid">Partially Paid</option>
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
      currentPage: 1,
      itemsPerPage: 10,
      filters: {
        search: '',
        status: '',
        payment_status: '',
        franchisee_id: '',
        date: ''
      },
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
  computed: {
    hasFilters() {
      return Object.values(this.filters).some(v => v !== '');
    },
    filteredOrders() {
      return this.orders.filter(o => {
        if (this.filters.status && o.status !== this.filters.status) return false;
        if (this.filters.payment_status && o.payment_status !== this.filters.payment_status) return false;
        if (this.filters.franchisee_id && String(o.franchisee_id) !== String(this.filters.franchisee_id)) return false;
        if (this.filters.date && o.booking_date !== this.filters.date) return false;
        if (this.filters.search) {
          const s = this.filters.search.toLowerCase();
          const matchId = String(o.id).includes(s);
          const matchName = o.customer?.name?.toLowerCase().includes(s);
          const matchEmail = o.customer?.email?.toLowerCase().includes(s);
          const matchPlate = o.vehicle?.plate_number?.toLowerCase().includes(s);
          if (!matchId && !matchName && !matchEmail && !matchPlate) return false;
        }
        return true;
      });
    },
    paginatedOrders() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredOrders.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filteredOrders.length / this.itemsPerPage) || 1;
    }
  },
  watch: {
    filters: {
      deep: true,
      handler() {
        this.currentPage = 1;
      }
    }
  },
  methods: {
    clearFilters() {
      this.filters = { search: '', status: '', payment_status: '', franchisee_id: '', date: '' };
    },
    getAddons(o) {
      if (!o || !o.addon_services) return [];
      let addons = o.addon_services;
      if (typeof addons === 'string') {
        try { addons = JSON.parse(addons); } catch (e) { return []; }
      }
      if (typeof addons === 'string') {
        try { addons = JSON.parse(addons); } catch (e) { return []; }
      }
      return Array.isArray(addons) ? addons : [];
    },
    getWashIndex(o) {
      if (!o || !o.package || !o.package.max_bookings) return 1;
      const max = o.package.max_bookings;
      if (max <= 1) return 1;

      const custBookings = (this.orders || [])
        .filter(b => b.customer_id === o.customer_id && b.package_id === o.package_id && b.status !== 'cancelled')
        .sort((a, b) => (new Date(a.created_at || a.booking_date || 0)) - (new Date(b.created_at || b.booking_date || 0)));

      const idx = custBookings.findIndex(b => b.id === o.id);
      if (idx === -1) return 1;
      return (idx % max) + 1;
    },
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
      if (o.status === 'completed' || o.status === 'cancelled') {
        alert('Completed or cancelled washes cannot be edited.');
        return;
      }
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
