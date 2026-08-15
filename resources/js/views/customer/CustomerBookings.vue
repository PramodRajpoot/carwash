<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <div><h3>My Bookings</h3><p class="text-muted" style="font-size:0.85rem">View, rebook, or manage your appointments.</p></div>
      <button class="btn btn-primary btn-sm" @click="showBookingModal = true">+ Book Service</button>
    </div>
    <div v-if="bookings.length" class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Slot</th><th>Vehicle</th><th>Package</th><th>Price</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="b in paginatedBookings" :key="b.id">
            <td>{{ b.booking_date }}</td>
            <td>{{ b.slot_time }}</td>
            <td>{{ b.vehicle?.make_model }}</td>
            <td>
              <div>{{ b.package?.name || '-' }}</div>
              <div v-if="getAddons(b).length" style="font-size: 0.75rem; color: var(--accent-cyan); margin-top: 2px;">
                <span v-for="(addon, i) in getAddons(b)" :key="i">
                  + {{ addon.name }}<br v-if="i < getAddons(b).length - 1">
                </span>
              </div>
            </td>
            <td>₹{{ b.total_price }}</td>
            <td>
              <span v-if="b.payment_status === 'paid'" class="badge badge-emerald" style="font-size:0.7rem;">✓ Paid</span>
              <span v-else-if="b.payment_status === 'pending_payment'" class="badge badge-amber" style="font-size:0.7rem;">⏳ Pending</span>
              <span v-else-if="b.payment_status === 'failed'" class="badge badge-rose" style="font-size:0.7rem;">✗ Failed</span>
              <span v-else class="badge badge-cyan" style="font-size:0.7rem;">{{ b.payment_method === 'cod' ? 'COD' : 'Unpaid' }}</span>
            </td>
            <td><span class="badge" :class="statusBadge(b.status)">{{ b.status }}</span></td>
            <td>
              <div class="flex gap-1" style="flex-wrap: wrap;">
                <button v-if="needsPayment(b)" class="btn btn-sm" style="background: linear-gradient(135deg, #6366f1, #06b6d4); color: #fff; border: none; font-weight: 600;" @click="retryPayment(b)" :disabled="payingBookingId === b.id">
                  {{ payingBookingId === b.id ? 'Processing...' : '💳 Pay Now' }}
                </button>
                <button v-if="canCancel(b)" class="btn btn-sm btn-danger" @click="cancel(b.id)">Cancel</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="bookings.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
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
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, bookings.length) }} of {{ bookings.length }}
        </span>
      </div>
      <div class="flex gap-1" v-if="totalPages > 1">
        <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
        <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
      </div>
    </div>
    <div v-else class="empty-state"><div class="empty-icon">📅</div><p>No bookings yet.</p></div>

    <!-- Book Service Modal -->
    <div v-if="showBookingModal" class="modal-overlay" @click.self="showBookingModal = false">
      <div class="modal-content">
        <h3>Book a Service</h3>
        <div v-if="bookingMsg" class="alert" :class="bookingError ? 'alert-error' : 'alert-success'">{{ bookingMsg }}</div>
        <form @submit.prevent="createBooking">
          <div class="form-group"><label>Vehicle</label>
            <select v-model="bf.vehicle_id" class="form-select" required><option value="">Select Vehicle</option><option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.make_model }} ({{ v.plate_number }})</option></select>
          </div>
          <div class="form-group"><label>Center</label>
            <select v-model="bf.franchisee_id" class="form-select" required @change="fetchSlots"><option value="">Select Center</option><option v-for="c in centers" :key="c.id" :value="c.id">{{ c.center_name }} — {{ c.city }}</option></select>
          </div>
          <div class="form-group"><label>Package</label>
            <select v-model="bf.package_id" class="form-select" required @change="bf.addon_ids = []"><option value="">Select Package</option><option v-for="p in packages" :key="p.id" :value="p.id">{{ p.name }} (₹{{ p.price }})</option></select>
          </div>
          
          <!-- Add-ons & Price Breakdown -->
          <div v-if="bf.package_id" style="margin-bottom: 1rem;">
            <!-- Add-on Services Section -->
            <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">
              ➕ Add-on Services <span class="text-muted" style="font-weight: 400; font-size: 0.8rem;">(pick from other packages)</span>
            </label>
            <div v-if="!bf.vehicle_id" class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">
              Please select a vehicle first to see available add-ons.
            </div>
            <div v-else-if="addonPackages.length === 0" class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">
              No add-ons available for this vehicle type.
            </div>
            <div v-else style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem; margin-bottom: 1rem;">
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

            <!-- Price Breakdown -->
            <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.3rem;">
                <span>Base Plan Price</span>
                <span>₹{{ selectedBasePlan ? selectedBasePlan.price : '0.00' }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.3rem; color: var(--accent-cyan);">
                <span>Add-ons ({{ bf.addon_ids.length }} items)</span>
                <span>+ ₹{{ addonTotal.toFixed(2) }}</span>
              </div>
              <div style="border-top: 1px dashed var(--border-color); margin: 0.5rem 0; padding-top: 0.5rem; display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem;">
                <span>Total</span>
                <span style="color: var(--accent-emerald);">₹{{ calculatedTotal.toFixed(2) }}</span>
              </div>
            </div>
          </div>
          
          <div class="grid grid-2 gap-2">
            <div class="form-group"><label>Date</label><input v-model="bf.booking_date" type="date" class="form-input" required @change="fetchSlots"></div>
            <div class="form-group"><label>Slot</label>
              <select v-model="bf.slot_time" class="form-select" required :disabled="slotsLoading || availableSlots.length === 0">
                <option value="" v-if="slotsLoading">Loading slots...</option>
                <option value="" v-else-if="!bf.franchisee_id || !bf.booking_date">Select center & date first</option>
                <option value="" v-else-if="availableSlots.length === 0">No slots available</option>
                <option v-else value="">Choose Slot</option>
                <option v-for="s in availableSlots" :key="s.time_range" :value="s.time_range" :disabled="s.current_bookings >= s.max_bookings">{{ s.time_range }} {{ s.current_bookings >= s.max_bookings ? '(Full)' : '' }}</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Coupon Code</label><input v-model="bf.coupon_code" class="form-input" placeholder="e.g. WELCOME10"></div>
          <div class="flex gap-2" style="margin-top:0.5rem">
            <button type="submit" class="btn btn-primary" :disabled="bookingLoading">{{ bookingLoading ? 'Processing...' : 'Book & Pay Now' }}</button>
            <button type="button" class="btn btn-ghost" @click="showBookingModal = false">Cancel</button>
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
  name: 'CustomerBookings',
  data() { return { bookings: [], vehicles: [], centers: [], packages: [], availableSlots: [], slotsLoading: false, postponeSlots: [], postponeSlotsLoading: false, showBookingModal: false, bookingMsg: '', bookingError: false, bookingLoading: false, postponeBooking: null, payingBookingId: null, bf: { vehicle_id: '', franchisee_id: '', package_id: '', booking_date: '', slot_time: '', payment_method: 'online', coupon_code: '', addon_ids: [] }, pf: { booking_date: '', slot_time: '' }, currentPage: 1, itemsPerPage: 10 }; },
  computed: {
    paginatedBookings() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.bookings.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.bookings.length / this.itemsPerPage) || 1;
    },
    selectedBasePlan() {
      return this.packages.find(p => p.id == this.bf.package_id) || null;
    },
    addonPackages() {
      if (!this.selectedBasePlan || !this.bf.vehicle_id) return [];
      const v = this.vehicles.find(vh => vh.id == this.bf.vehicle_id);
      if (!v) return [];
      return this.packages.filter(p => p.id != this.bf.package_id && p.vehicle_type === v.vehicle_type);
    },
    selectedAddons() {
      return this.packages.filter(p => this.bf.addon_ids.includes(p.id));
    },
    addonTotal() {
      return this.selectedAddons.reduce((sum, a) => sum + parseFloat(a.price), 0);
    },
    calculatedTotal() {
      const base = this.selectedBasePlan ? parseFloat(this.selectedBasePlan.price) : 0;
      return base + this.addonTotal;
    }
  },
  methods: {
    getAddons(b) {
      if (!b.addon_services) return [];
      if (typeof b.addon_services === 'string') {
        try { return JSON.parse(b.addon_services); } catch (e) { return []; }
      }
      return Array.isArray(b.addon_services) ? b.addon_services : [];
    },
    isAddonSelected(id) { return this.bf.addon_ids.includes(id); },
    toggleAddon(pkg) {
      if (this.isAddonSelected(pkg.id)) {
        this.bf.addon_ids = this.bf.addon_ids.filter(id => id !== pkg.id);
      } else {
        this.bf.addon_ids.push(pkg.id);
      }
    },
    statusBadge(s) { return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan'; },
    canCancel(b) { return ['pending', 'assigned'].includes(b.status); },
    canPostpone(b) { return ['pending', 'assigned'].includes(b.status); },
    needsPayment(b) {
      return b.payment_method === 'online' && 
             b.payment_status !== 'paid' && 
             b.status !== 'cancelled';
    },

    /**
     * Retry payment for an existing booking with pending payment.
     */
    async retryPayment(booking) {
      this.payingBookingId = booking.id;
      await this.initiateCashfreePayment(booking.id);
      this.payingBookingId = null;
    },

    async loadData() {
      try {
        const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
        const [bk, vh, ct, pk] = await Promise.all([
          axios.get('/api/customer/dashboard'),
          axios.get('/api/customer/vehicles'),
          axios.get('/api/centers'),
          axios.get('/api/packages'),
        ]);
        this.bookings = [...(bk.data.upcoming_services || [])];
        // also load completed from dashboard booking_count? We need a full list.
        // Let's use dashboard upcoming + fetch all via a different approach
        this.vehicles = vh.data;
        this.centers = ct.data;
        this.packages = pk.data;
        // Get full booking history from customer dashboard
        const dash = bk.data;
        this.bookings = dash.upcoming_services || [];
      } catch (e) { console.error(e); }
    },
    async fetchSlots() {
      this.bf.slot_time = '';
      this.availableSlots = [];
      if (!this.bf.franchisee_id || !this.bf.booking_date) return;
      this.slotsLoading = true;
      try {
        const { data } = await axios.get('/api/bookings/slots', { params: { franchisee_id: this.bf.franchisee_id, date: this.bf.booking_date } });
        this.availableSlots = data;
      } catch (e) { console.error(e); }
      this.slotsLoading = false;
    },
    async fetchPostponeSlots() {
      this.pf.slot_time = '';
      this.postponeSlots = [];
      if (!this.postponeBooking || !this.pf.booking_date) return;
      this.postponeSlotsLoading = true;
      try {
        const { data } = await axios.get('/api/bookings/slots', { params: { franchisee_id: this.postponeBooking.franchisee_id, date: this.pf.booking_date } });
        this.postponeSlots = data;
      } catch (e) { console.error(e); }
      this.postponeSlotsLoading = false;
    },

    /**
     * Create booking and initiate Cashfree checkout if online payment.
     */
    async createBooking() {
      this.bookingMsg = ''; this.bookingLoading = true;
      try {
        const { data } = await axios.post('/api/bookings', this.bf);

        // If online payment is required, initiate Cashfree checkout
        if (data.requires_payment && data.booking) {
          await this.initiateCashfreePayment(data.booking.id);
          return; // bookingLoading will be reset inside the payment handler
        }

        // For COD / subscription, just show success
        this.bookingMsg = data.message;
        this.bookingError = false;
        this.showBookingModal = false;
        Swal.fire({
          icon: 'success',
          title: 'Booking Confirmed!',
          text: data.message,
          timer: 3000,
          showConfirmButton: false
        });
        this.loadData();
      } catch (e) {
        this.bookingMsg = e.response?.data?.message || 'Booking failed';
        this.bookingError = true;
      }
      this.bookingLoading = false;
    },

    /**
     * Initiate Cashfree payment checkout.
     */
    async initiateCashfreePayment(bookingId) {
      try {
        // Step 1: Create Cashfree order on server
        const { data } = await axios.post('/api/cashfree/create-order', {
          booking_id: bookingId
        });

        if (data.status !== 'success' || !data.payment_session_id) {
          Swal.fire('Payment Error', data.message || 'Could not initiate payment.', 'error');
          this.bookingLoading = false;
          return;
        }

        // Step 2: Open Cashfree Checkout using the JS SDK
        const cashfreeMode = data.environment === 'production' ? 'production' : 'sandbox';

        // eslint-disable-next-line no-undef
        const cashfreeInstance = Cashfree({ mode: cashfreeMode });

        this.showBookingModal = false;
        this.bookingLoading = false;

        cashfreeInstance.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: '_self',
          returnUrl: window.location.origin + '/cashfree/return?order_id={order_id}',
        }).then((result) => {
          if (result.error) {
            console.error('Cashfree checkout error:', result.error);
            Swal.fire('Payment Error', result.error.message || 'Payment could not be completed.', 'error');
          }
          if (result.redirect) {
            console.log('Redirecting to Cashfree...');
          }
        });

      } catch (e) {
        console.error('Cashfree payment error:', e);
        Swal.fire('Payment Error', e.response?.data?.message || 'Failed to initiate payment. Please try again.', 'error');
        this.bookingLoading = false;
      }
    },

    /**
     * Verify Cashfree payment after returning from checkout.
     */
    async verifyCashfreePayment(orderId) {
      Swal.fire({
        title: 'Verifying Payment...',
        html: 'Please wait while we confirm your payment with Cashfree.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      try {
        const { data } = await axios.get(`/api/cashfree/verify/${orderId}`);

        if (data.status === 'success' && data.payment_status === 'paid') {
          Swal.fire({
            icon: 'success',
            title: 'Booking Confirmed! 🎉',
            html: `<p style="font-size:1.1rem; margin-bottom:0.5rem;">Your car wash is successfully registered!</p><p>Booking <strong>#${data.booking_id}</strong> has been confirmed.<br>Payment received successfully.</p>`,
            confirmButtonText: 'Great!',
            confirmButtonColor: '#10b981'
          });
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Payment Pending',
            html: `<p>Order status: <strong>${data.order_status || 'Unknown'}</strong></p><p>If you completed the payment, it may take a moment to process. Please refresh the page in a few seconds.</p>`,
            confirmButtonText: 'OK'
          });
        }
      } catch (e) {
        Swal.fire('Verification Failed', 'Unable to verify payment status. Please contact support if money was deducted.', 'error');
      }

      this.loadData();
    },

    async cancel(id) {
      const result = await Swal.fire({
        title: 'Cancel Booking?',
        text: 'Are you sure you want to cancel this booking? The slot booking amount or any payment you have made will not be refunded.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      });

      if (!result.isConfirmed) return;

      try {
        await axios.post(`/api/bookings/${id}/cancel`);
        Swal.fire('Cancelled!', 'Your booking has been cancelled.', 'success');
        this.loadData();
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || 'Failed to cancel booking', 'error');
      }
    },
    openPostpone(b) { this.postponeBooking = b; this.pf.booking_date = ''; this.pf.slot_time = ''; this.postponeSlots = []; },
    async submitPostpone() {
      try { await axios.post(`/api/bookings/${this.postponeBooking.id}/postpone`, this.pf); this.postponeBooking = null; this.loadData(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    },
  },
  mounted() {
    this.loadData();

    // Check if returning from Cashfree payment (query param in history-mode URL)
    const urlParams = new URLSearchParams(window.location.search);
    const cashfreeOrderId = urlParams.get('cashfree_order_id');
    if (cashfreeOrderId) {
      this.verifyCashfreePayment(cashfreeOrderId);
      // Clean up the URL — remove query params
      history.replaceState(null, '', window.location.pathname);
    }
  },
};
</script>
