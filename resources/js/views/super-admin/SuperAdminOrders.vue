<template>
  <div>
    <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3>Super Admin Booking Management</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Manage all platform bookings, assign centers, reschedule, process refunds, and generate invoices.</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        + Create Booking
      </button>
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
            <option value="refunded">Refunded</option>
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
              <th>Service</th>
              <th>Center Assigned</th>
              <th>Date & Time</th>
              <th>Price & Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in paginatedOrders" :key="o.id">
              <td>#{{ o.id }}</td>
              <td>
                <div style="font-weight:600; color:var(--text-primary);">{{ o.customer?.name }}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">{{ o.customer?.email }}</div>
              </td>
              <td>
                <div v-if="o.vehicle">
                  {{ o.vehicle?.make_model }}<br>
                  <span style="font-size: 0.75rem; color: var(--text-muted)">{{ o.vehicle?.plate_number }}</span>
                </div>
                <div v-else class="text-muted" style="font-size: 0.75rem;">N/A</div>
              </td>
              <td>{{ o.package?.name || 'Custom' }}</td>
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
                <div style="font-size: 0.7rem;" :style="{ color: o.payment_status === 'paid' ? 'var(--accent-emerald)' : (o.payment_status === 'refunded' ? 'var(--accent-violet)' : 'var(--accent-amber)') }">
                  {{ o.payment_status?.toUpperCase() }} ({{ o.payment_method?.toUpperCase() }})
                </div>
              </td>
              <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
              <td>
                <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                  <button class="btn btn-outline btn-sm" @click="openAssignModal(o)" title="Assign Center">Assign</button>
                  <button class="btn btn-outline btn-sm" @click="openRescheduleModal(o)" title="Reschedule">Reschedule</button>
                  <button v-if="o.status !== 'cancelled' && o.status !== 'completed'" class="btn btn-outline btn-sm" style="border-color: var(--accent-rose); color: var(--accent-rose);" @click="cancelOrder(o.id)" title="Cancel Booking">Cancel</button>
                  <button v-if="o.status === 'cancelled' && o.payment_status === 'paid'" class="btn btn-outline btn-sm" style="border-color: var(--accent-violet); color: var(--accent-violet);" @click="refundOrder(o.id)" title="Process Refund">Refund</button>
                  <button class="btn btn-outline btn-sm" @click="downloadInvoice(o.id)" title="Download Invoice">Invoice</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem;">
        <div class="text-muted" style="font-size: 0.85rem;">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredOrders.length) }} of {{ filteredOrders.length }} entries
        </div>
        <div class="flex gap-1">
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

    <!-- Create Booking Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content" style="max-width: 600px;">
        <h3>Manual Booking creation</h3>
        
        <form @submit.prevent="createOrder">
          <div class="form-group">
            <label>Select Customer</label>
            <select v-model="createForm.customer_id" class="form-select" required @change="onCustomerChange">
              <option value="">-- Choose Customer --</option>
              <option v-for="u in customers" :key="u.id" :value="u.id">{{ u.name }} ({{ u.email }})</option>
            </select>
          </div>

          <div class="form-group">
            <label>Select Vehicle</label>
            <select v-model="createForm.vehicle_id" class="form-select" required :disabled="!createForm.customer_id">
              <option value="">-- Choose Vehicle --</option>
              <option v-for="v in selectedCustomerVehicles" :key="v.id" :value="v.id">{{ v.make_model }} ({{ v.plate_number }})</option>
            </select>
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Service Package</label>
              <select v-model="createForm.package_id" class="form-select" @change="onPackageChange">
                <option value="">-- Custom --</option>
                <option v-for="p in packages" :key="p.id" :value="p.id">{{ p.name }} (₹{{ p.price }})</option>
              </select>
            </div>
            <div class="form-group">
              <label>Assign Center (Optional)</label>
              <select v-model="createForm.franchisee_id" class="form-select">
                <option value="">-- Unassigned --</option>
                <option v-for="c in centers" :key="c.id" :value="c.id">{{ c.center_name }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Wash Date</label>
              <input v-model="createForm.booking_date" type="date" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Time Slot</label>
              <select v-model="createForm.slot_time" class="form-select" required>
                <option>09:00 AM - 11:00 AM</option>
                <option>11:00 AM - 01:00 PM</option>
                <option>01:00 PM - 03:00 PM</option>
                <option>03:00 PM - 05:00 PM</option>
              </select>
            </div>
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Total Price (₹)</label>
              <input v-model="createForm.total_price" type="number" min="0" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Payment Status</label>
              <select v-model="createForm.payment_status" class="form-select" required>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Creating...' : 'Create Booking' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="showCreateModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Assign Modal -->
    <div v-if="assignModalOrder" class="modal-overlay" @click.self="assignModalOrder = null">
      <div class="modal-content">
        <h3>Assign Center for Order #{{ assignModalOrder.id }}</h3>
        <form @submit.prevent="submitAssign">
          <div class="form-group">
            <label>Select Center</label>
            <select v-model="assignForm.franchisee_id" class="form-select" required>
              <option value="">-- Choose Center --</option>
              <option v-for="c in centers" :key="c.id" :value="c.id">{{ c.center_name }}</option>
            </select>
          </div>
          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">Assign</button>
            <button type="button" class="btn btn-ghost" @click="assignModalOrder = null">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reschedule Modal -->
    <div v-if="rescheduleModalOrder" class="modal-overlay" @click.self="rescheduleModalOrder = null">
      <div class="modal-content">
        <h3>Reschedule Order #{{ rescheduleModalOrder.id }}</h3>
        <form @submit.prevent="submitReschedule">
          <div class="form-group">
            <label>New Date</label>
            <input v-model="rescheduleForm.booking_date" type="date" class="form-input" required />
          </div>
          <div class="form-group">
            <label>New Time Slot</label>
            <select v-model="rescheduleForm.slot_time" class="form-select" required>
              <option>09:00 AM - 11:00 AM</option>
              <option>11:00 AM - 01:00 PM</option>
              <option>01:00 PM - 03:00 PM</option>
              <option>03:00 PM - 05:00 PM</option>
            </select>
          </div>
          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">Reschedule</button>
            <button type="button" class="btn btn-ghost" @click="rescheduleModalOrder = null">Cancel</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'SuperAdminOrders',
  data() {
    return {
      orders: [],
      centers: [],
      packages: [],
      customers: [],
      loading: true,
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

      showCreateModal: false,
      createForm: {
        customer_id: '',
        vehicle_id: '',
        package_id: '',
        franchisee_id: '',
        booking_date: '',
        slot_time: '09:00 AM - 11:00 AM',
        total_price: 0,
        payment_status: 'unpaid'
      },

      assignModalOrder: null,
      assignForm: { franchisee_id: '' },

      rescheduleModalOrder: null,
      rescheduleForm: { booking_date: '', slot_time: '' }
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
    },
    selectedCustomerVehicles() {
      if (!this.createForm.customer_id) return [];
      const customer = this.customers.find(c => c.id === this.createForm.customer_id);
      return customer ? customer.vehicles : [];
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
    statusBadge(s) {
      return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan';
    },
    async loadData() {
      this.loading = true;
      try {
        const [ord, cnt, pkg, usr] = await Promise.all([
          axios.get('/api/super-admin/orders'),
          axios.get('/api/centers'),
          axios.get('/api/packages'),
          axios.get('/api/super-admin/users')
        ]);
        this.orders = ord.data;
        this.centers = cnt.data;
        this.packages = pkg.data;
        this.customers = usr.data.filter(u => u.role === 'customer');
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    openCreateModal() {
      this.createForm = {
        customer_id: '',
        vehicle_id: '',
        package_id: '',
        franchisee_id: '',
        booking_date: '',
        slot_time: '09:00 AM - 11:00 AM',
        total_price: 0,
        payment_status: 'unpaid'
      };
      this.showCreateModal = true;
    },
    onCustomerChange() {
      this.createForm.vehicle_id = '';
    },
    onPackageChange() {
      if (this.createForm.package_id) {
        const pkg = this.packages.find(p => p.id === this.createForm.package_id);
        if (pkg) this.createForm.total_price = pkg.price;
      } else {
        this.createForm.total_price = 0;
      }
    },
    async createOrder() {
      this.submitting = true;
      try {
        await axios.post('/api/super-admin/orders', this.createForm);
        this.showCreateModal = false;
        this.loadData();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to create booking.');
      }
      this.submitting = false;
    },
    openAssignModal(o) {
      this.assignModalOrder = o;
      this.assignForm.franchisee_id = o.franchisee_id || '';
    },
    async submitAssign() {
      this.submitting = true;
      try {
        await axios.put(`/api/super-admin/orders/${this.assignModalOrder.id}/assign`, this.assignForm);
        this.assignModalOrder = null;
        this.loadData();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to assign center.');
      }
      this.submitting = false;
    },
    openRescheduleModal(o) {
      this.rescheduleModalOrder = o;
      this.rescheduleForm = { booking_date: o.booking_date, slot_time: o.slot_time };
    },
    async submitReschedule() {
      this.submitting = true;
      try {
        await axios.put(`/api/super-admin/orders/${this.rescheduleModalOrder.id}/reschedule`, this.rescheduleForm);
        this.rescheduleModalOrder = null;
        this.loadData();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to reschedule.');
      }
      this.submitting = false;
    },
    async cancelOrder(id) {
      if (confirm('Are you sure you want to cancel this booking?')) {
        try {
          await axios.put(`/api/super-admin/orders/${id}/cancel`);
          this.loadData();
        } catch (e) {
          alert('Failed to cancel booking.');
        }
      }
    },
    async refundOrder(id) {
      if (confirm('Mark this cancelled booking as refunded?')) {
        try {
          await axios.put(`/api/super-admin/orders/${id}/refund`);
          this.loadData();
        } catch (e) {
          alert(e.response?.data?.message || 'Failed to refund booking.');
        }
      }
    },
    async downloadInvoice(id) {
      try {
        const response = await axios.get(`/api/super-admin/orders/${id}/invoice`);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(response.data);
        printWindow.document.close();
      } catch (e) {
        alert('Failed to load invoice.');
      }
    }
  },
  mounted() {
    this.loadData();
  }
};
</script>
