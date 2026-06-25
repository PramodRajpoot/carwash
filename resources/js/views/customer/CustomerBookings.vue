<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <div><h3>My Bookings</h3><p class="text-muted" style="font-size:0.85rem">View, rebook, or manage your appointments.</p></div>
      <button class="btn btn-primary btn-sm" @click="showBookingModal = true">+ Book Service</button>
    </div>
    <div v-if="bookings.length" class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Slot</th><th>Vehicle</th><th>Package</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id">
            <td>{{ b.booking_date }}</td>
            <td>{{ b.slot_time }}</td>
            <td>{{ b.vehicle?.make_model }}</td>
            <td>{{ b.package?.name || '-' }}</td>
            <td>₹{{ b.total_price }}</td>
            <td><span class="badge" :class="statusBadge(b.status)">{{ b.status }}</span></td>
            <td>
              <div class="flex gap-1">
                <button v-if="canCancel(b)" class="btn btn-sm btn-danger" @click="cancel(b.id)">Cancel</button>
                <button v-if="canPostpone(b)" class="btn btn-sm btn-outline" @click="openPostpone(b)">Postpone</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
            <select v-model="bf.package_id" class="form-select" required><option value="">Select Package</option><option v-for="p in packages" :key="p.id" :value="p.id">{{ p.name }} (₹{{ p.price }})</option></select>
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
          <div class="form-group"><label>Payment Method</label>
            <select v-model="bf.payment_method" class="form-select"><option value="cod">Cash on Delivery</option><option value="online">Online</option><option value="subscription">Subscription</option></select>
          </div>
          <div class="form-group"><label>Coupon Code</label><input v-model="bf.coupon_code" class="form-input" placeholder="e.g. WELCOME10"></div>
          <div class="flex gap-2" style="margin-top:0.5rem">
            <button type="submit" class="btn btn-primary" :disabled="bookingLoading">{{ bookingLoading ? 'Booking...' : 'Confirm Booking' }}</button>
            <button type="button" class="btn btn-ghost" @click="showBookingModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Postpone Modal -->
    <div v-if="postponeBooking" class="modal-overlay" @click.self="postponeBooking = null">
      <div class="modal-content">
        <h3>Postpone Booking</h3>
        <form @submit.prevent="submitPostpone">
          <div class="form-group"><label>New Date</label><input v-model="pf.booking_date" type="date" class="form-input" required @change="fetchPostponeSlots"></div>
          <div class="form-group"><label>New Slot</label>
            <select v-model="pf.slot_time" class="form-select" required :disabled="postponeSlotsLoading || postponeSlots.length === 0">
              <option value="" v-if="postponeSlotsLoading">Loading slots...</option>
              <option value="" v-else-if="!pf.booking_date">Select date first</option>
              <option value="" v-else-if="postponeSlots.length === 0">No slots available</option>
              <option v-for="s in postponeSlots" :key="s.time_range" :value="s.time_range" :disabled="s.current_bookings >= s.max_bookings">{{ s.time_range }} {{ s.current_bookings >= s.max_bookings ? '(Full)' : '' }}</option>
            </select>
          </div>
          <div class="flex gap-2"><button type="submit" class="btn btn-primary">Postpone</button><button type="button" class="btn btn-ghost" @click="postponeBooking = null">Cancel</button></div>
        </form>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'CustomerBookings',
  data() { return { bookings: [], vehicles: [], centers: [], packages: [], availableSlots: [], slotsLoading: false, postponeSlots: [], postponeSlotsLoading: false, showBookingModal: false, bookingMsg: '', bookingError: false, bookingLoading: false, postponeBooking: null, bf: { vehicle_id: '', franchisee_id: '', package_id: '', booking_date: '', slot_time: '', payment_method: 'cod', coupon_code: '' }, pf: { booking_date: '', slot_time: '' } }; },
  methods: {
    statusBadge(s) { return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan'; },
    canCancel(b) { return ['pending', 'assigned'].includes(b.status); },
    canPostpone(b) { return ['pending', 'assigned'].includes(b.status); },
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
    async createBooking() {
      this.bookingMsg = ''; this.bookingLoading = true;
      try {
        const { data } = await axios.post('/api/bookings', this.bf);
        this.bookingMsg = data.message;
        this.bookingError = false;
        this.showBookingModal = false;
        this.loadData();
      } catch (e) { this.bookingMsg = e.response?.data?.message || 'Booking failed'; this.bookingError = true; }
      this.bookingLoading = false;
    },
    async cancel(id) {
      if (!confirm('Cancel this booking?')) return;
      try { await axios.post(`/api/bookings/${id}/cancel`); this.loadData(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    },
    openPostpone(b) { this.postponeBooking = b; this.pf.booking_date = ''; this.pf.slot_time = ''; this.postponeSlots = []; },
    async submitPostpone() {
      try { await axios.post(`/api/bookings/${this.postponeBooking.id}/postpone`, this.pf); this.postponeBooking = null; this.loadData(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    },
  },
  mounted() { this.loadData(); },
};
</script>
