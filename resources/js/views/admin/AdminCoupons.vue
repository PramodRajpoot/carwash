<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
      <div>
        <h3>Vouchers &amp; Coupons</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Manage active discount codes, percentage vouchers, and customer loyalty rewards campaigns.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="showAddModal = true">+ Create Coupon</button>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading coupons list...
    </div>

    <div v-else>
      <div v-if="coupons.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Discount Value</th>
              <th>Expires Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in paginatedCoupons" :key="c.id">
              <td style="font-family: monospace; font-weight: 700; font-size: 1.1rem; color: var(--accent-cyan);">
                🎟️ {{ c.code }}
              </td>
              <td style="font-weight: 600; color: var(--text-primary);">
                {{ c.discount_type === 'percentage' ? c.discount_value + '%' : '₹' + c.discount_value }}
              </td>
              <td>{{ c.expires_at ? formatDate(c.expires_at) : 'NEVER EXPIRES' }}</td>
              <td>
                <span class="badge" :class="isExpired(c.expires_at) ? 'badge-rose' : 'badge-emerald'">
                  {{ isExpired(c.expires_at) ? 'EXPIRED' : 'ACTIVE' }}
                </span>
              </td>
              <td>
                <button class="btn btn-ghost btn-sm text-danger" style="padding: 0.25rem 0.5rem;" @click="deleteCoupon(c.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="coupons.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
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
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, coupons.length) }} of {{ coupons.length }}
          </span>
        </div>
        <div class="flex gap-1" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
          <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No active promotional coupons defined on the platform.</p>
      </div>
    </div>

    <!-- Create Coupon Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>Create Platform Coupon</h3>
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <form @submit.prevent="createCoupon">
          <div class="form-group">
            <label>Promo Coupon Code</label>
            <input v-model="form.code" class="form-input" placeholder="e.g. WELCOME100" style="text-transform: uppercase;" required />
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Discount Type</label>
              <select v-model="form.discount_type" class="form-select" required>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Discount Value</label>
              <input v-model="form.discount_value" type="number" min="0.5" step="0.5" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label>Expires Date</label>
            <input v-model="form.expires_at" type="date" class="form-input" />
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Generating...' : 'Confirm Voucher' }}
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
  name: 'AdminCoupons',
  data() {
    return {
      coupons: [],
      loading: true,
      showAddModal: false,
      submitting: false,
      error: '',
      currentPage: 1,
      itemsPerPage: 10,
      form: {
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        expires_at: ''
      }
    };
  },
  computed: {
    paginatedCoupons() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.coupons.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.coupons.length / this.itemsPerPage) || 1;
    }
  },
  methods: {
    formatDate(d) {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    isExpired(date) {
      if (!date) return false;
      return new Date(date) < new Date();
    },
    async loadCoupons() {
      try {
        const { data } = await axios.get('/api/admin/coupons');
        this.coupons = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    async createCoupon() {
      this.submitting = true;
      this.error = '';
      try {
        await axios.post('/api/admin/coupons', this.form);
        this.form.code = '';
        this.form.discount_value = '';
        this.form.expires_at = '';
        this.showAddModal = false;
        this.loadCoupons();
      } catch (e) {
        this.error = e.response?.data?.message || 'Failed to generate promo coupon.';
      }
      this.submitting = false;
    },
    async deleteCoupon(id) {
      if (!confirm('Are you sure you want to delete this coupon?')) return;
      try {
        await axios.delete(`/api/admin/coupons/${id}`);
        this.loadCoupons();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete coupon.');
      }
    }
  },
  mounted() {
    this.loadCoupons();
  }
};
</script>
