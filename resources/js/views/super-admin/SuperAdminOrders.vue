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
              <td>
                <div>{{ o.package?.name || 'Custom' }}</div>
                <div v-if="o.addon_services && o.addon_services.length" style="margin-top: 0.25rem;">
                  <span v-for="(a, i) in o.addon_services" :key="i" class="badge badge-cyan" style="font-size: 0.65rem; margin-right: 0.25rem; margin-bottom: 0.15rem; display: inline-block;">
                    + {{ a.name }}
                  </span>
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
                <div style="font-size: 0.7rem;" :style="{ color: o.payment_status === 'paid' ? 'var(--accent-emerald)' : (o.payment_status === 'refunded' ? 'var(--accent-violet)' : 'var(--accent-amber)') }">
                  {{ o.payment_status?.toUpperCase() }} ({{ o.payment_method?.toUpperCase() }})
                </div>
              </td>
              <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
              <td>
                <select class="form-select" style="padding: 0.25rem; font-size: 0.8rem; width: 130px;" @change="handleAction($event, o)">
                  <option value="">-- Actions --</option>
                  <option value="assign">Assign Center</option>
                  <option value="reschedule">Reschedule</option>
                  <option value="change_plan" v-if="o.status !== 'cancelled' && o.status !== 'completed'">Change / Customise Plan</option>
                  <option value="cancel" v-if="o.status !== 'cancelled' && o.status !== 'completed'">Cancel Booking</option>
                  <option value="refund" v-if="o.status === 'cancelled' && o.payment_status === 'paid'">Process Refund</option>
                  <option value="invoice">Download Invoice</option>
                </select>
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

    <!-- Change / Customise Plan Modal -->
    <div v-if="changePlanModalOrder" class="modal-overlay" @click.self="changePlanModalOrder = null">
      <div class="modal-content" style="max-width: 680px;">
        <h3 style="margin-bottom: 0.25rem;">Change / Customise Plan for Order #{{ changePlanModalOrder.id }}</h3>
        <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 1.25rem;">
          Select a base plan and optionally add services from other packages as add-ons.
        </p>

        <form @submit.prevent="submitChangePlan">
          <!-- Base Plan Selection -->
          <div class="form-group">
            <label style="font-weight: 600;">Base Plan</label>
            <select v-model="changePlanForm.package_id" class="form-select" @change="onChangePlanPackage" required>
              <option value="">-- Select Plan --</option>
              <option v-for="pkg in packages" :key="pkg.id" :value="pkg.id">{{ pkg.name }} - ₹{{ pkg.price }} ({{ pkg.vehicle_type }})</option>
            </select>
          </div>

          <!-- Base Price -->
          <div v-if="selectedBasePlan" style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; font-size: 0.95rem;">{{ selectedBasePlan.name }}</div>
              <div class="text-muted" style="font-size: 0.75rem;">{{ selectedBasePlan.vehicle_type }} • {{ selectedBasePlan.description ? selectedBasePlan.description.substring(0, 60) + '...' : 'Base service package' }}</div>
            </div>
            <div style="font-weight: 700; font-size: 1.1rem; color: var(--accent-emerald);">₹{{ selectedBasePlan.price }}</div>
          </div>

          <!-- Add-on Services Section -->
          <div style="margin-bottom: 1rem;">
            <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">
              ➕ Add-on Services <span class="text-muted" style="font-weight: 400; font-size: 0.8rem;">(pick from other packages)</span>
            </label>

            <div v-if="addonPackages.length === 0" class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">
              Select a base plan first to see available add-ons.
            </div>

            <div v-else style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem;">
              <div v-for="pkg in addonPackages" :key="pkg.id"
                style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--border-color); cursor: pointer;"
                :style="{ background: isAddonSelected(pkg.id) ? 'rgba(16,185,129,0.08)' : 'transparent' }"
                @click="toggleAddon(pkg)">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <input type="checkbox" :checked="isAddonSelected(pkg.id)" style="accent-color: var(--accent-emerald); width: 16px; height: 16px; pointer-events: none;" />
                  <div>
                    <div style="font-weight: 600; font-size: 0.88rem;">{{ pkg.name }}</div>
                    <div class="text-muted" style="font-size: 0.72rem;">{{ pkg.vehicle_type }}</div>
                  </div>
                </div>
                <div style="font-weight: 700; color: var(--accent-cyan); font-size: 0.9rem; white-space: nowrap;">+ ₹{{ pkg.price }}</div>
              </div>
            </div>
          </div>

          <!-- Selected Addons Summary -->
          <div v-if="changePlanForm.addons.length > 0" style="margin-bottom: 1rem;">
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Selected Add-ons</div>
            <div v-for="(addon, i) in changePlanForm.addons" :key="i"
              style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-bottom: 0.35rem;">
              <span style="font-size: 0.85rem;">{{ addon.name }}</span>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 600; font-size: 0.85rem; color: var(--accent-cyan);">₹{{ addon.price }}</span>
                <button type="button" class="btn btn-ghost btn-sm text-danger" style="padding: 0.1rem 0.3rem; font-size: 0.75rem;" @click="removeAddon(i)">✕</button>
              </div>
            </div>
          </div>

          <!-- Price Breakdown -->
          <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.3rem;">
              <span>Base Plan Price</span>
              <span>₹{{ selectedBasePlan ? selectedBasePlan.price : '0.00' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.3rem; color: var(--accent-cyan);">
              <span>Add-ons ({{ changePlanForm.addons.length }} items)</span>
              <span>+ ₹{{ addonTotal.toFixed(2) }}</span>
            </div>
            <div style="border-top: 1px dashed var(--border-color); margin: 0.5rem 0; padding-top: 0.5rem; display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem;">
              <span>Total</span>
              <span style="color: var(--accent-emerald);">₹{{ calculatedTotal.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Custom Price Override -->
          <div class="form-group">
            <label style="font-weight: 600;">Final Price (₹) <span class="text-muted" style="font-weight: 400; font-size: 0.8rem;">— override if needed</span></label>
            <input v-model="changePlanForm.total_price" type="number" step="0.01" class="form-input" required />
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Updating...' : 'Update Plan' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="changePlanModalOrder = null">Cancel</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';
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
      rescheduleForm: { booking_date: '', slot_time: '' },

      changePlanModalOrder: null,
      changePlanForm: { package_id: '', total_price: 0, addons: [] }
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
    },
    selectedBasePlan() {
      if (!this.changePlanForm.package_id) return null;
      return this.packages.find(p => p.id === this.changePlanForm.package_id) || null;
    },
    addonPackages() {
      if (!this.changePlanForm.package_id) return [];
      return this.packages.filter(p => p.id !== this.changePlanForm.package_id);
    },
    addonTotal() {
      return this.changePlanForm.addons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    },
    calculatedTotal() {
      const base = this.selectedBasePlan ? parseFloat(this.selectedBasePlan.price) : 0;
      return base + this.addonTotal;
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
    handleAction(event, o) {
      const action = event.target.value;
      event.target.value = ""; // reset dropdown
      
      if (!action) return;

      if (action === 'assign') {
        this.openAssignModal(o);
      } else if (action === 'reschedule') {
        this.openRescheduleModal(o);
      } else if (action === 'change_plan') {
        this.openChangePlanModal(o);
      } else if (action === 'cancel') {
        this.cancelOrder(o.id);
      } else if (action === 'refund') {
        this.refundOrder(o.id);
      } else if (action === 'invoice') {
        this.downloadInvoice(o.id);
      }
    },
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
        alert(e.response?.data?.message || 'Failed to reschedule booking.');
      }
      this.submitting = false;
    },
    openChangePlanModal(o) {
      this.changePlanModalOrder = o;
      const existingAddons = o.addon_services || [];
      this.changePlanForm = {
        package_id: o.package_id || '',
        total_price: o.total_price || 0,
        addons: existingAddons.map(a => ({ ...a }))
      };
    },
    onChangePlanPackage() {
      this.changePlanForm.addons = [];
      this.recalcTotal();
    },
    isAddonSelected(pkgId) {
      return this.changePlanForm.addons.some(a => a.id === pkgId);
    },
    toggleAddon(pkg) {
      const idx = this.changePlanForm.addons.findIndex(a => a.id === pkg.id);
      if (idx >= 0) {
        this.changePlanForm.addons.splice(idx, 1);
      } else {
        this.changePlanForm.addons.push({ id: pkg.id, name: pkg.name, price: parseFloat(pkg.price) });
      }
      this.recalcTotal();
    },
    removeAddon(index) {
      this.changePlanForm.addons.splice(index, 1);
      this.recalcTotal();
    },
    recalcTotal() {
      this.changePlanForm.total_price = this.calculatedTotal.toFixed(2);
    },
    async submitChangePlan() {
      this.submitting = true;
      try {
        const payload = {
          package_id: this.changePlanForm.package_id,
          total_price: this.changePlanForm.total_price,
          addon_services: this.changePlanForm.addons.map(a => ({ name: a.name, price: a.price })),
          addon_price: this.addonTotal
        };
        await axios.put(`/api/super-admin/orders/${this.changePlanModalOrder.id}/change-plan`, payload);
        this.changePlanModalOrder = null;
        this.loadData();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to update plan.');
      }
      this.submitting = false;
    },
    async cancelOrder(id) {
      const result = await Swal.fire({
        title: 'Confirm Cancellation',
        text: 'Are you sure you want to cancel this booking?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--accent-rose)',
        confirmButtonText: 'Yes, cancel it!'
      });

      if (result.isConfirmed) {
        try {
          await axios.put(`/api/super-admin/orders/${id}/cancel`);
          this.loadData();
          Swal.fire('Cancelled!', 'The booking has been cancelled.', 'success');
        } catch (e) {
          Swal.fire('Error', 'Failed to cancel booking.', 'error');
        }
      }
    },
    async refundOrder(id) {
      const result = await Swal.fire({
        title: 'Process Refund',
        text: 'Mark this cancelled booking as refunded?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--accent-violet)',
        confirmButtonText: 'Yes, process refund'
      });

      if (result.isConfirmed) {
        try {
          await axios.put(`/api/super-admin/orders/${id}/refund`);
          this.loadData();
          Swal.fire('Refunded!', 'The booking has been marked as refunded.', 'success');
        } catch (e) {
          Swal.fire('Error', e.response?.data?.message || 'Failed to refund booking.', 'error');
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
