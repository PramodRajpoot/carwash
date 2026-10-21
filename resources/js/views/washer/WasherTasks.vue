<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h3>My Assigned Cleaning Tasks</h3>
        <p class="text-muted" style="font-size: 0.85rem;">View vehicle details, customer contact info, and update wash progress.</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="glass-card mb-4 p-4 flex flex-wrap gap-3 items-end" style="background: var(--bg-primary); margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;">
      <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Search</label>
        <input v-model="filters.search" class="form-input" placeholder="Order ID, Customer, Plate..." />
      </div>
      <div class="form-group" style="min-width: 150px; margin-bottom: 0;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Status</label>
        <select v-model="filters.status" class="form-select">
          <option value="">All Tasks</option>
          <option value="assigned">Assigned / To Do</option>
          <option value="ongoing">Wash In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div class="form-group" style="min-width: 140px; margin-bottom: 0;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Date</label>
        <input v-model="filters.date" type="date" class="form-input" />
      </div>
      <button class="btn btn-ghost" @click="clearFilters" v-if="hasFilters" title="Clear Filters" style="padding: 0.5rem; height: 42px;">✖</button>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading assigned tasks...
    </div>

    <div v-else>
      <div v-if="filteredTasks.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Vehicle Details</th>
              <th>Service Details</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in paginatedTasks" :key="t.id">
              <td><strong>#{{ t.id }}</strong></td>
              <td>
                <div style="font-weight: 600; color: var(--text-primary);">{{ t.customer?.name }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  <a :href="'tel:' + t.customer?.phone" style="color: var(--accent-cyan); text-decoration: none;">
                    📞 {{ t.customer?.phone || 'No Phone' }}
                  </a>
                </div>
              </td>
              <td>
                <div style="font-weight: 600;">{{ t.vehicle?.make_model }}</div>
                <div style="font-size: 0.75rem; font-family: monospace;" class="text-secondary">{{ t.vehicle?.plate_number }}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: capitalize;">{{ t.vehicle?.vehicle_type }}</div>
              </td>
              <td>
                <div style="font-weight: 500;">{{ t.package?.name || 'Custom Package' }}</div>
                <div v-if="t.addon_services && t.addon_services.length" style="margin-top: 0.25rem;">
                  <span v-for="(a, i) in t.addon_services" :key="i" class="badge badge-cyan" style="font-size: 0.65rem; margin-right: 0.25rem; margin-bottom: 0.15rem; display: inline-block;">
                    + {{ a.name }}
                  </span>
                </div>
              </td>
              <td>
                <div style="font-weight: 500;">{{ t.booking_date }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">{{ t.slot_time }}</div>
              </td>
              <td>
                <span class="badge" :class="statusBadge(t.status)">{{ t.status }}</span>
                <div v-if="t.payment_status === 'partially_paid'" style="margin-top: 0.25rem;">
                  <span class="badge badge-amber" style="font-size: 0.65rem;" title="Collect remaining balance on completion">
                    ₹{{ (parseFloat(t.total_price) - parseFloat(t.paid_amount || 99)).toFixed(0) }} Due
                  </span>
                </div>
                <div v-else-if="t.payment_status === 'paid'" style="margin-top: 0.25rem;">
                  <span class="badge badge-emerald" style="font-size: 0.65rem;">Paid</span>
                </div>
              </td>
              <td>
                <div class="flex gap-1">
                  <button v-if="t.status === 'assigned'" class="btn btn-sm btn-outline" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" @click="updateStatus(t.id, 'ongoing')">
                    ▶ Start Wash
                  </button>
                  <button v-else-if="t.status === 'ongoing'" class="btn btn-sm btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" @click="updateStatus(t.id, 'completed')">
                    ✓ Complete Wash
                  </button>
                  <span v-else-if="t.status === 'completed'" style="color: var(--accent-emerald); font-size: 0.85rem; font-weight: 600;">
                    ✓ Finished
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredTasks.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
          <select v-model="itemsPerPage" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;" @change="currentPage = 1">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredTasks.length) }} of {{ filteredTasks.length }}
          </span>
        </div>
        <div class="flex gap-1" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
          <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>

      <div v-if="!filteredTasks.length" class="empty-state">
        <div class="empty-icon">🚗</div>
        <p>No cleaning tasks found matching your criteria.</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'WasherTasks',
  data() {
    return {
      tasks: [],
      loading: true,
      currentPage: 1,
      itemsPerPage: 10,
      filters: {
        search: '',
        status: '',
        date: ''
      }
    };
  },
  computed: {
    hasFilters() {
      return this.filters.search || this.filters.status || this.filters.date;
    },
    filteredTasks() {
      return this.tasks.filter(t => {
        if (this.filters.search) {
          const s = this.filters.search.toLowerCase();
          const matchId = String(t.id).includes(s);
          const matchCustomer = t.customer?.name?.toLowerCase().includes(s);
          const matchPlate = t.vehicle?.plate_number?.toLowerCase().includes(s);
          const matchModel = t.vehicle?.make_model?.toLowerCase().includes(s);
          if (!matchId && !matchCustomer && !matchPlate && !matchModel) return false;
        }
        if (this.filters.status && t.status !== this.filters.status) {
          return false;
        }
        if (this.filters.date && t.booking_date !== this.filters.date) {
          return false;
        }
        return true;
      });
    },
    paginatedTasks() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredTasks.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filteredTasks.length / this.itemsPerPage) || 1;
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
      this.filters = { search: '', status: '', date: '' };
    },
    statusBadge(s) {
      return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan';
    },
    async loadTasks() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/washer/tasks');
        this.tasks = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    async updateStatus(taskId, newStatus) {
      try {
        await axios.put(`/api/washer/tasks/${taskId}/status`, { status: newStatus });
        this.loadTasks();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to update task status.');
      }
    }
  },
  mounted() {
    this.loadTasks();
  }
};
</script>
