<template>
  <div>
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">📦 Active Customer Subscriptions</h4>
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="subscriptions.length === 0" class="text-muted" style="text-align:center;padding:2rem">No active subscriptions in your area.</div>
      <div v-else>
        <div v-for="s in subscriptions" :key="s.id" class="glass-card" style="margin-bottom:0.75rem">
          <div class="flex justify-between items-start" style="margin-bottom:0.75rem">
            <div>
              <div style="font-weight:600">{{ s.customer?.name }}</div>
              <div class="text-muted" style="font-size:0.8rem">{{ s.customer?.phone }} • {{ s.package?.name }}</div>
            </div>
            <span class="badge badge-emerald">Active</span>
          </div>
          <div class="flex gap-3 items-center">
            <div style="flex:1">
              <div class="text-muted" style="font-size:0.75rem;margin-bottom:0.2rem">Progress: {{ s.booking_count }}/{{ s.package?.max_bookings }} washes</div>
              <div style="background:var(--bg-secondary);border-radius:4px;height:5px">
                <div :style="{ width: Math.round((s.booking_count / s.package?.max_bookings) * 100) + '%', background:'var(--gradient-btn)', height:'100%', borderRadius:'4px' }"></div>
              </div>
            </div>
            <button class="btn btn-sm btn-outline" @click="openReschedule(s)">Reschedule</button>
          </div>
          <div class="text-muted" style="font-size:0.78rem;margin-top:0.5rem">Expires: {{ formatDate(s.expires_at) }}</div>
        </div>
      </div>
    </div>

    <!-- Reschedule Modal -->
    <div v-if="rescheduleModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem" @click.self="rescheduleModal = false">
      <div class="glass-card" style="width:100%;max-width:440px">
        <h4 style="margin-bottom:1rem">Reschedule Service</h4>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <div>
            <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Select Booking</label>
            <select v-model="rescheduleForm.booking_id" class="form-input">
              <option value="">-- Select Booking --</option>
              <option v-for="b in upcomingBookings" :key="b.id" :value="b.id">{{ b.booking_date }} — {{ b.vehicle?.make_model }}</option>
            </select>
          </div>
          <div>
            <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">New Date</label>
            <input type="date" v-model="rescheduleForm.booking_date" class="form-input" :min="today" />
          </div>
          <div>
            <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Time Slot</label>
            <select v-model="rescheduleForm.slot_time" class="form-input">
              <option v-for="slot in timeSlots" :key="slot" :value="slot">{{ slot }}</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" @click="submitReschedule" :disabled="submitting" style="flex:1">{{ submitting ? 'Saving…' : 'Confirm' }}</button>
            <button class="btn btn-ghost" @click="rescheduleModal = false" style="flex:1">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'FranchiseeSubscriptions',
  data() {
    return {
      subscriptions: [], loading: true, rescheduleModal: false,
      upcomingBookings: [], rescheduleForm: { booking_id: '', booking_date: '', slot_time: '' },
      submitting: false, today: new Date().toISOString().split('T')[0],
      timeSlots: ['07:00 AM - 09:00 AM','09:00 AM - 11:00 AM','11:00 AM - 01:00 PM','02:00 PM - 04:00 PM','04:00 PM - 06:00 PM'],
    };
  },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    async openReschedule(s) {
      this.rescheduleModal = true;
      const { data } = await axios.get('/api/franchisee/orders');
      this.upcomingBookings = data.filter(b => b.customer_id === s.customer_id && ['pending', 'assigned'].includes(b.status));
    },
    async submitReschedule() {
      if (!this.rescheduleForm.booking_id || !this.rescheduleForm.booking_date || !this.rescheduleForm.slot_time) return;
      this.submitting = true;
      try {
        await axios.post(`/api/franchisee/orders/${this.rescheduleForm.booking_id}/reschedule`, { booking_date: this.rescheduleForm.booking_date, slot_time: this.rescheduleForm.slot_time });
        this.rescheduleModal = false;
        this.rescheduleForm = { booking_id: '', booking_date: '', slot_time: '' };
      } catch (e) { alert(e.response?.data?.message || 'Reschedule failed.'); }
      finally { this.submitting = false; }
    },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/franchisee/subscriptions'); this.subscriptions = data; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
