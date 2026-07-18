<template>
  <div>
    <div style="margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem;">Marketing</h2>
      <p class="text-muted" style="font-size: 0.85rem;">Manage coupons, referral offers, discount campaigns, promo codes and cashback programs.</p>
    </div>

    <!-- Tab Navigation -->
    <div class="marketing-tabs" style="margin-bottom: 1.5rem;">
      <button v-for="tab in tabs" :key="tab.key"
        class="btn btn-sm"
        :class="activeTab === tab.key ? 'btn-primary' : 'btn-ghost'"
        @click="activeTab = tab.key"
        style="border-radius: var(--radius-md);">
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- ═══════════ 1. CREATE COUPONS TAB ═══════════ -->
    <div v-if="activeTab === 'coupons'">
      <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
        <div>
          <h3 style="font-size: 1.15rem;">Vouchers &amp; Coupons</h3>
          <p class="text-muted" style="font-size: 0.85rem;">Manage active discount codes, percentage vouchers and customer loyalty rewards.</p>
        </div>
        <button class="btn btn-primary btn-sm" @click="showCouponModal = true">+ Create Coupon</button>
      </div>

      <div v-if="couponsLoading" class="text-center text-muted" style="padding: 3rem;">Loading coupons list...</div>
      <div v-else>
        <div v-if="coupons.length" class="glass-card" style="overflow-x: auto;">
          <table class="table" style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-muted);">
                <th style="padding: 1rem 0.75rem;">Coupon Code</th>
                <th style="padding: 1rem 0.75rem;">Discount Value</th>
                <th style="padding: 1rem 0.75rem;">Expires Date</th>
                <th style="padding: 1rem 0.75rem;">Status</th>
                <th style="padding: 1rem 0.75rem;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in coupons" :key="c.id" style="border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
                <td style="padding: 1rem 0.75rem; font-family: monospace; font-weight: 700; font-size: 1.1rem; color: var(--accent-cyan);">
                  🎟️ {{ c.code }}
                </td>
                <td style="padding: 1rem 0.75rem; font-weight: 600; color: var(--text-primary);">
                  {{ c.discount_type === 'percentage' ? c.discount_value + '%' : '₹' + c.discount_value }}
                </td>
                <td style="padding: 1rem 0.75rem;">{{ c.expires_at ? formatDate(c.expires_at) : 'NEVER EXPIRES' }}</td>
                <td style="padding: 1rem 0.75rem;">
                  <span class="badge" :class="isExpired(c.expires_at) ? 'badge-rose' : 'badge-emerald'">
                    {{ isExpired(c.expires_at) ? 'EXPIRED' : 'ACTIVE' }}
                  </span>
                </td>
                <td style="padding: 1rem 0.75rem;">
                  <button class="btn btn-ghost btn-sm text-danger" style="padding: 0.25rem 0.5rem;" @click="deleteCoupon(c.id)">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="glass-card" style="padding: 3rem; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎟️</div>
          <p class="text-muted">No active promotional coupons defined on the platform.</p>
        </div>
      </div>

      <!-- Create Coupon Modal -->
      <div v-if="showCouponModal" class="modal-overlay" @click.self="showCouponModal = false">
        <div class="modal-content">
          <h3>Create Platform Coupon</h3>
          <div v-if="couponError" class="alert alert-error">{{ couponError }}</div>
          <form @submit.prevent="createCoupon">
            <div class="form-group">
              <label>Promo Coupon Code</label>
              <input v-model="couponForm.code" class="form-input" placeholder="e.g. WELCOME100" style="text-transform: uppercase;" required />
            </div>
            <div class="grid grid-2 gap-2">
              <div class="form-group">
                <label>Discount Type</label>
                <select v-model="couponForm.discount_type" class="form-select" required>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Discount Value</label>
                <input v-model="couponForm.discount_value" type="number" min="0.5" step="0.5" class="form-input" required />
              </div>
            </div>
            <div class="form-group">
              <label>Expires Date</label>
              <input v-model="couponForm.expires_at" type="date" class="form-input" />
            </div>
            <div class="flex gap-2" style="margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary" :disabled="couponSubmitting">
                {{ couponSubmitting ? 'Generating...' : 'Confirm Voucher' }}
              </button>
              <button type="button" class="btn btn-ghost" @click="showCouponModal = false">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ═══════════ 2. REFERRAL OFFERS TAB ═══════════ -->
    <div v-if="activeTab === 'referrals'">
      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.15rem;">Referral Offers</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Track referral program performance and manage referral-based incentives.</p>
      </div>

      <div v-if="referralsLoading" class="text-center text-muted" style="padding: 3rem;">Loading referral data...</div>
      <div v-else>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="stat-card" title="Total Referrals">
            <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">🔗</div>
            <div class="stat-value">{{ referralStats.total_referrals || 0 }}</div>
            <div class="stat-label">Total Referrals</div>
          </div>
          <div class="stat-card" title="Confirmed">
            <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">✅</div>
            <div class="stat-value" style="color:var(--accent-emerald)">{{ referralStats.confirmed || 0 }}</div>
            <div class="stat-label">Confirmed</div>
          </div>
          <div class="stat-card" title="Pending">
            <div class="stat-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">⏳</div>
            <div class="stat-value" style="color:#ef4444">{{ referralStats.pending || 0 }}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-card" title="Top Referrers">
            <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">🏆</div>
            <div class="stat-value">{{ referralStats.top_referrers?.length || 0 }}</div>
            <div class="stat-label">Top Referrers</div>
          </div>
        </div>

        <div class="grid grid-2 gap-3">
          <!-- Top Referrers -->
          <div class="glass-card">
            <h4 style="margin-bottom:1rem">🏆 Top Referrers</h4>
            <div v-if="!referralStats.top_referrers?.length" class="text-muted" style="padding: 1rem 0;">No referrer data available yet.</div>
            <div v-for="(u, i) in referralStats.top_referrers" :key="u.id" class="flex justify-between items-center" style="padding:0.6rem 0;border-bottom:1px solid var(--border-color)">
              <div class="flex gap-2 items-center">
                <div style="width:24px;font-weight:700;color:var(--text-muted)">{{ i + 1 }}</div>
                <div>
                  <div style="font-weight:600;font-size:0.88rem">{{ u.name }}</div>
                  <div class="text-muted" style="font-size:0.75rem">Code: {{ u.referral_code }}</div>
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:600;color:var(--accent-emerald)">{{ u.e_points }} pts</div>
                <div class="text-muted" style="font-size:0.75rem">{{ u.referrals_count }} referrals</div>
              </div>
            </div>
          </div>

          <!-- Referral List -->
          <div class="glass-card">
            <h4 style="margin-bottom:1rem">📊 Referral Details</h4>
            <div v-if="!referralStats.referral_list?.length" class="text-muted" style="padding: 1rem 0;">No referral details available yet.</div>
            <div style="max-height:400px;overflow-y:auto">
              <div v-for="u in referralStats.referral_list" :key="u.id" class="flex justify-between items-center" style="padding:0.6rem 0;border-bottom:1px solid var(--border-color)">
                <div>
                  <div style="font-weight:600;font-size:0.88rem">{{ u.name }}</div>
                  <div class="text-muted" style="font-size:0.75rem">Referred by: {{ u.referrer?.name }}</div>
                </div>
                <div style="text-align:right">
                  <span class="badge" :class="u.epoint_status === 'confirmed' ? 'badge-emerald' : 'badge-rose'" style="font-size:0.72rem">{{ u.epoint_status }}</span>
                  <div class="text-muted" style="font-size:0.72rem;margin-top:0.2rem">{{ u.total_completed }} services</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════ 3. DISCOUNT CAMPAIGNS TAB ═══════════ -->
    <div v-if="activeTab === 'campaigns'">
      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.15rem;">Discount Campaigns</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Create time-limited discount campaigns for festivals, holidays and seasonal promotions.</p>
      </div>

      <div class="glass-card" style="padding: 3rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div>
        <h4 style="margin-bottom: 0.5rem;">Discount Campaigns</h4>
        <p class="text-muted" style="max-width: 500px; margin: 0 auto;">
          Create and manage time-limited discount campaigns for festivals, seasonal promotions, and special events. This module is coming soon.
        </p>
      </div>
    </div>

    <!-- ═══════════ 4. PROMO CODES TAB ═══════════ -->
    <div v-if="activeTab === 'promo'">
      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.15rem;">Promo Codes</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Generate single-use or limited-use promo codes for targeted customer segments.</p>
      </div>

      <div class="glass-card" style="padding: 3rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🏷️</div>
        <h4 style="margin-bottom: 0.5rem;">Promo Codes</h4>
        <p class="text-muted" style="max-width: 500px; margin: 0 auto;">
          Generate single-use or limited-use promo codes for targeted customer segments and influencer partnerships. This module is coming soon.
        </p>
      </div>
    </div>

    <!-- ═══════════ 5. CASHBACK TAB ═══════════ -->
    <div v-if="activeTab === 'cashback'">
      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.15rem;">Cashback Programs</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Set up cashback rewards on bookings to boost repeat orders.</p>
      </div>

      <div class="glass-card" style="padding: 3rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">💸</div>
        <h4 style="margin-bottom: 0.5rem;">Cashback Programs</h4>
        <p class="text-muted" style="max-width: 500px; margin: 0 auto;">
          Configure cashback reward rules for bookings and subscriptions to drive customer retention. This module is coming soon.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SuperAdminMarketing',
  data() {
    return {
      activeTab: 'coupons',
      tabs: [
        { key: 'coupons', label: 'Create Coupons', icon: '🎟️' },
        { key: 'referrals', label: 'Referral Offers', icon: '🔗' },
        { key: 'campaigns', label: 'Discount Campaigns', icon: '🎯' },
        { key: 'promo', label: 'Promo Codes', icon: '🏷️' },
        { key: 'cashback', label: 'Cashback', icon: '💸' },
      ],

      // Coupons
      coupons: [],
      couponsLoading: true,
      showCouponModal: false,
      couponSubmitting: false,
      couponError: '',
      couponForm: {
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        expires_at: ''
      },

      // Referrals
      referralStats: {},
      referralsLoading: true,
    };
  },
  watch: {
    activeTab(val) {
      if (val === 'coupons' && !this.coupons.length) this.loadCoupons();
      if (val === 'referrals' && !this.referralStats.total_referrals) this.loadReferrals();
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

    // ── Coupons ──
    async loadCoupons() {
      this.couponsLoading = true;
      try {
        const { data } = await axios.get('/api/admin/coupons');
        this.coupons = data;
      } catch (e) { console.error(e); }
      this.couponsLoading = false;
    },
    async createCoupon() {
      this.couponSubmitting = true;
      this.couponError = '';
      try {
        await axios.post('/api/admin/coupons', this.couponForm);
        this.couponForm.code = '';
        this.couponForm.discount_value = '';
        this.couponForm.expires_at = '';
        this.showCouponModal = false;
        this.loadCoupons();
      } catch (e) {
        this.couponError = e.response?.data?.message || 'Failed to generate promo coupon.';
      }
      this.couponSubmitting = false;
    },
    async deleteCoupon(id) {
      if (!confirm('Are you sure you want to delete this coupon?')) return;
      try {
        await axios.delete(`/api/admin/coupons/${id}`);
        this.loadCoupons();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete coupon.');
      }
    },

    // ── Referrals ──
    async loadReferrals() {
      this.referralsLoading = true;
      try {
        const { data } = await axios.get('/api/admin/referrals');
        this.referralStats = data;
      } catch (e) { console.error(e); }
      this.referralsLoading = false;
    },
  },
  mounted() {
    this.loadCoupons();
  }
};
</script>

<style scoped>
.marketing-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}
</style>
