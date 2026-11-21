<template>
  <div>
    <div style="margin-bottom: 2rem;">
      <h3>Service Subscriptions</h3>
      <p class="text-muted" style="font-size: 0.85rem;">Save big with monthly recurring packages for your vehicle.</p>
    </div>

    <!-- Active Subscription Summary -->
    <div class="glass-card" style="margin-bottom: 2rem; border-left: 4px solid var(--accent-emerald);">
      <h4 style="margin-bottom: 0.75rem;">Your Current Subscription</h4>
      <div v-if="activeSub">
        <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-cyan);">{{ activeSub.package?.name }}</div>
            <div class="text-secondary" style="font-size: 0.9rem; margin-top: 0.25rem;">
              Usage: <strong style="color: var(--text-primary);">{{ activeSub.booking_count }} / {{ activeSub.package?.max_bookings }} washes</strong> completed
            </div>
            <div class="text-muted" style="font-size: 0.8rem; margin-top: 0.25rem;">
              Valid from {{ formatDate(activeSub.starts_at) }} to {{ formatDate(activeSub.expires_at) }}
            </div>
          </div>
          <div class="flex gap-2">
            <span class="badge badge-emerald">Active</span>
            <router-link to="/customer/bookings" class="btn btn-primary btn-sm">Schedule Wash</router-link>
          </div>
        </div>
      </div>
      <div v-else class="text-muted" style="font-size: 0.9rem;">
        You do not have an active monthly subscription. Choose a package below to subscribe and start saving!
      </div>
    </div>

    <!-- Available Packages -->
    <div style="margin-bottom: 1.5rem;">
      <h4>Available Subscription Plans</h4>
    </div>

    <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1rem;">
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <strong style="display: block; margin-bottom: 0.25rem;">Select Subscription Month</strong>
          <span class="text-muted" style="font-size: 0.78rem;">The plan is valid only for the selected month.</span>
        </div>
        <select v-model="selectedMonth" class="form-select" style="width: 220px;">
          <option v-for="month in monthOptions" :key="month.value" :value="month.value">{{ month.label }}</option>
        </select>
      </div>
      <div class="text-muted" style="font-size: 0.78rem; margin-top: 0.75rem;">
        Full advance payment • Non-refundable • Rescheduling allowed
      </div>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 2rem;">
      Loading subscription plans...
    </div>

    <div v-else-if="packages.length" class="grid grid-3 gap-3">
      <div v-for="p in packages" :key="p.id" class="card flex flex-col justify-between" style="border-top: 3px solid var(--accent-cyan);">
        <div>
          <div class="flex justify-between items-center" style="margin-bottom: 0.5rem;">
            <span class="badge badge-cyan">{{ formatType(p.vehicle_type) }}</span>
            <span class="text-muted" style="font-size: 0.75rem;">{{ p.frequency_days }} days</span>
          </div>
          <h4 style="margin-bottom: 0.5rem;">{{ p.name }}</h4>
          <p class="text-secondary" style="font-size: 0.85rem; margin-bottom: 1rem; line-height: 1.5;">{{ p.description }}</p>
          <div class="text-muted" style="font-size: 0.78rem; margin-bottom: 1rem; min-height: 2.4rem;">
            <template v-if="Number(p.max_bookings) === 4">
              4 separate wash slots may be booked on separate days in the selected month.
            </template>
            <template v-else-if="Number(p.max_bookings) === 26">
              26 washes are available in the selected month; choose the month only at purchase.
            </template>
          </div>
        </div>
        <div>
          <div style="margin-bottom: 1rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-color);" class="flex justify-between items-end">
            <div>
              <div class="text-muted" style="font-size: 0.75rem;">Washes included</div>
              <strong style="font-size: 1.1rem; color: var(--text-primary);">{{ p.max_bookings }} Washes</strong>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 1.5rem; font-weight: 800; color: var(--accent-emerald);">₹{{ p.price }}</span>
              <span class="text-muted" style="font-size: 0.75rem;">/mo</span>
            </div>
          </div>
          <button class="btn btn-primary btn-sm w-full" :disabled="subscribingId === p.id" @click="subscribe(p.id)">
            {{ subscribingId === p.id ? 'Subscribing...' : 'Subscribe Now' }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-muted" style="padding: 2rem;">
      No subscription plans are currently available.
    </div>

    <div v-if="showScheduleModal" class="modal-overlay">
      <div class="modal-content" style="max-width: 680px; max-height: 92vh; overflow-y: auto;">
        <h3>Choose Your {{ schedulePlan?.max_bookings || 4 }} Wash Dates & Slots</h3>
        <p class="text-muted" style="font-size: 0.82rem; margin-bottom: 1rem;">
          Select {{ schedulePlan?.max_bookings || 4 }} separate days in {{ selectedMonthLabel }}. Full payment is required after these details are confirmed.
        </p>

        <div class="grid grid-2 gap-2">
          <div class="form-group">
            <label>Vehicle</label>
            <select v-model="scheduleVehicleId" class="form-select">
              <option value="">Select Vehicle</option>
              <option v-for="v in vehicles" :key="v.id" :value="String(v.id)">{{ v.make_model }} {{ v.plate_number ? '(' + v.plate_number + ')' : '' }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Service Center</label>
            <select v-model="scheduleCenterId" class="form-select" @change="refreshAllScheduleSlots">
              <option value="">Select Center</option>
              <option v-for="c in centers" :key="c.id" :value="String(c.id)">{{ c.center_name }} - {{ c.city }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Doorstep Address</label>
          <textarea v-model="scheduleAddress" class="form-input" rows="2" placeholder="Enter complete service address"></textarea>
        </div>

        <div v-if="Number(schedulePlan?.max_bookings) === 26" class="glass-card" style="padding: 0.75rem; margin-bottom: 0.75rem;">
          <div class="form-group">
            <label>Select the first wash date</label>
            <input v-model="scheduleItems[0].date" type="date" class="form-input" :min="monthMinDate" :max="monthMaxDate" @change="autoGenerate26Dates">
          </div>
          <div v-if="scheduleItems[0].date" class="text-muted" style="font-size: 0.78rem;">
            25 following dates are selected automatically. No slot selection is required.
          </div>
          <div v-if="scheduleItems[0].date" class="grid grid-2 gap-2" style="margin-top: 0.75rem; max-height: 260px; overflow-y: auto;">
            <div v-for="(item, index) in scheduleItems" :key="index" style="padding: 0.45rem 0.6rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.78rem;">
              <strong>Wash {{ index + 1 }}:</strong> {{ formatScheduleDate(item.date) }}
            </div>
          </div>
        </div>

        <div v-else v-for="(item, index) in scheduleItems" :key="index" class="glass-card" style="padding: 0.75rem; margin-bottom: 0.75rem;">
          <strong style="display: block; margin-bottom: 0.5rem;">Wash {{ index + 1 }}</strong>
          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Date</label>
              <input
                v-model="item.date"
                type="date"
                class="form-input"
                :min="getWashMinDate(index)"
                :max="monthMaxDate"
                :disabled="isWashDisabled(index)"
                @change="onScheduleDateChange(index)"
              >
              <div v-if="Number(schedulePlan?.max_bookings) === 4">
                <small v-if="isWashDisabled(index)" class="text-muted" style="display: block; font-size: 0.74rem; margin-top: 0.25rem;">
                  Please select Wash {{ index }} date first
                </small>
                <small v-else-if="index > 0 && scheduleItems[index - 1]?.date" class="text-muted" style="display: block; font-size: 0.74rem; margin-top: 0.25rem;">
                  Must be after {{ formatScheduleDate(scheduleItems[index - 1].date) }}
                </small>
              </div>
            </div>
            <div class="form-group">
              <label>Time Slot</label>
              <select v-model="item.slot" class="form-select" :disabled="!item.date || !scheduleCenterId || scheduleSlotLoading[index]">
                <option value="">{{ scheduleSlotLoading[index] ? 'Loading slots...' : 'Select Slot' }}</option>
                <option v-for="slot in scheduleSlots[index]" :key="slot.time_range" :value="slot.time_range" :disabled="slot.is_full || slot.current_bookings >= slot.max_bookings">
                  {{ slot.time_range }}{{ slot.is_full || slot.current_bookings >= slot.max_bookings ? ' — Full' : '' }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex gap-2" style="margin-top: 1rem;">
          <button type="button" class="btn btn-primary" :disabled="subscribingId !== null" @click="confirmWashSchedule">Continue to Full Payment</button>
          <button type="button" class="btn btn-ghost" @click="showScheduleModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';
export default {
  name: 'CustomerSubscriptions',
  data() {
    const now = new Date();
    const selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthOptions = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthOptions.push({
        value,
        label: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      });
    }

    return {
      packages: [],
      activeSub: null,
      loading: true,
      subscribingId: null,
      selectedMonth,
      monthOptions,
      showScheduleModal: false,
      schedulePlan: null,
      vehicles: [],
      centers: [],
      scheduleVehicleId: '',
      scheduleCenterId: '',
      scheduleAddress: '',
      scheduleItems: [{ date: '', slot: '' }, { date: '', slot: '' }, { date: '', slot: '' }, { date: '', slot: '' }],
      scheduleSlots: [[], [], [], []],
      scheduleSlotLoading: [false, false, false, false],
    };
  },
  computed: {
    selectedMonthLabel() {
      const month = this.monthOptions.find(m => m.value === this.selectedMonth);
      return month ? month.label : this.selectedMonth;
    },
    monthMinDate() {
      const today = new Date();
      const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const currentMonth = todayValue.slice(0, 7);
      if (this.selectedMonth === currentMonth) return todayValue;
      return `${this.selectedMonth}-01`;
    },
    monthMaxDate() {
      const [year, month] = this.selectedMonth.split('-').map(Number);
      const nextMonthObj = new Date(year, month, 1);
      const nextYear = nextMonthObj.getFullYear();
      const nextMonthStr = String(nextMonthObj.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(nextYear, nextMonthObj.getMonth() + 1, 0).getDate();
      return `${nextYear}-${nextMonthStr}-${String(lastDay).padStart(2, '0')}`;
    },
  },
  methods: {
    formatType(t) {
      return t.toUpperCase().replace('_', ' ');
    },
    formatDate(d) {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    async loadSubscriptions() {
      try {
        const pk = await axios.get('/api/packages');
        this.packages = pk.data.filter(p => {
          const washes = Number(p.max_bookings || 0);
          const isSubscription = p.is_subscription || (!p.is_addon && Number(p.frequency_days || 0) >= 30);
          return isSubscription && [4, 26].includes(washes);
        });
      } catch (e) {
        console.error(e);
      }

      try {
        const sub = await axios.get('/api/customer/subscriptions');
        this.activeSub = sub.data.find(s => s.status === 'active') || null;
      } catch (e) {
        console.error(e);
      }

      try {
        const [vehicles, centers, dashboard] = await Promise.all([
          axios.get('/api/customer/vehicles'),
          axios.get('/api/centers'),
          axios.get('/api/customer/dashboard'),
        ]);
        this.vehicles = vehicles.data;
        this.centers = centers.data;
        this.scheduleAddress = dashboard.data.address || '';
      } catch (e) {
        console.error(e);
      }

      this.loading = false;
    },
    async subscribe(packageId) {
      const plan = this.packages.find(p => p.id === packageId);
      const washes = plan ? Number(plan.max_bookings) : 0;
      const planRule = washes === 4
        ? 'The 4-wash plan allows one wash on each separate day in the selected month.'
        : 'The 26-wash plan allows the 26 washes to be scheduled during the selected month.';

      if ([4, 26].includes(washes)) {
        this.schedulePlan = plan;
        this.scheduleItems = Array.from({ length: washes }, () => ({ date: '', slot: '' }));
        this.scheduleSlots = Array.from({ length: washes }, () => []);
        this.scheduleSlotLoading = Array.from({ length: washes }, () => false);
        this.showScheduleModal = true;
        return;
      }

      const result = await Swal.fire({
        title: 'Confirm Subscription',
        text: `${planRule}\n\nPayment will be full, in advance and non-refundable. You may reschedule your washes. Proceed to secure payment?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, proceed',
        cancelButtonText: 'No, cancel',
      });

      if (!result.isConfirmed) return;

      this.subscribingId = packageId;
      try {
        const { data } = await axios.post('/api/cashfree/create-subscription-order', {
          package_id: packageId,
          selected_month: this.selectedMonth,
        });

        if (data.status !== 'success' || !data.payment_session_id) {
          Swal.fire({
            title: 'Error',
            text: data.message || 'Could not initiate subscription payment.',
            icon: 'error',
          });
          this.subscribingId = null;
          return;
        }

        // eslint-disable-next-line no-undef
        const cashfreeInstance = Cashfree({ mode: data.environment === 'production' ? 'production' : 'sandbox' });
        cashfreeInstance.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: '_self',
          returnUrl: window.location.origin + '/cashfree/return?order_id=' + encodeURIComponent(data.cashfree_order_id),
        });
      } catch (e) {
        Swal.fire({
          title: 'Error',
          text: e.response?.data?.message || 'Failed to subscribe.',
          icon: 'error',
        });
      }
      this.subscribingId = null;
    },
    formatScheduleDate(date) {
      if (!date) return '';
      return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    getNextDate(dateString) {
      if (!dateString) return '';
      const [year, month, day] = dateString.split('-').map(Number);
      const d = new Date(year, month - 1, day + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    },
    getWashMinDate(index) {
      if (Number(this.schedulePlan?.max_bookings) !== 4) {
        return this.monthMinDate;
      }
      if (index === 0) {
        return this.monthMinDate;
      }
      const prevDate = this.scheduleItems[index - 1]?.date;
      if (!prevDate) {
        return this.monthMinDate;
      }
      const nextDay = this.getNextDate(prevDate);
      return nextDay > this.monthMinDate ? nextDay : this.monthMinDate;
    },
    isWashDisabled(index) {
      if (Number(this.schedulePlan?.max_bookings) !== 4) {
        return false;
      }
      if (index === 0) {
        return false;
      }
      return !this.scheduleItems[index - 1]?.date;
    },
    onScheduleDateChange(index) {
      if (Number(this.schedulePlan?.max_bookings) === 4) {
        // If current date is invalid compared to previous date, clear it
        if (index > 0) {
          const prevDate = this.scheduleItems[index - 1]?.date;
          if (prevDate && this.scheduleItems[index].date && this.scheduleItems[index].date <= prevDate) {
            this.scheduleItems[index].date = '';
            this.scheduleItems[index].slot = '';
            this.scheduleSlots[index] = [];
            Swal.fire({
              title: 'Invalid Date',
              text: `Wash ${index + 1} date must be after Wash ${index} date (${this.formatScheduleDate(prevDate)}).`,
              icon: 'warning',
            });
            return;
          }
        }
        // If any subsequent wash has a date that is <= its preceding wash date or preceding wash date is empty, reset it
        for (let i = index + 1; i < this.scheduleItems.length; i++) {
          const prevDate = this.scheduleItems[i - 1]?.date;
          if (!prevDate || (this.scheduleItems[i].date && this.scheduleItems[i].date <= prevDate)) {
            this.scheduleItems[i].date = '';
            this.scheduleItems[i].slot = '';
            this.scheduleSlots[i] = [];
          }
        }
      }
      this.loadScheduleSlots(index);
    },
    autoGenerate26Dates() {
      const start = this.scheduleItems[0]?.date;
      if (!start) return;
      if (start < this.monthMinDate) {
        this.scheduleItems[0].date = '';
        Swal.fire('Invalid Date', 'Previous dates cannot be selected.', 'warning');
        return;
      }
      const first = new Date(`${start}T00:00:00`);
      const maxDate = new Date(`${this.monthMaxDate}T23:59:59`);

      for (let i = 0; i < 26; i++) {
        const date = new Date(first);
        date.setDate(first.getDate() + i);
        if (date > maxDate) {
          this.scheduleItems[i].date = '';
        } else {
          const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          this.scheduleItems[i].date = value;
        }
        this.scheduleItems[i].slot = '';
      }
    },
    async loadScheduleSlots(index) {
      const item = this.scheduleItems[index];
      item.slot = '';
      if (!this.scheduleCenterId || !item.date) {
        this.scheduleSlots[index] = [];
        return;
      }
      this.scheduleSlotLoading[index] = true;
      try {
        const { data } = await axios.get('/api/bookings/slots', {
          params: { franchisee_id: this.scheduleCenterId, date: item.date },
        });
        this.scheduleSlots[index] = data || [];
      } catch (e) {
        this.scheduleSlots[index] = [];
      }
      this.scheduleSlotLoading[index] = false;
    },
    refreshAllScheduleSlots() {
      this.scheduleItems.forEach((item, index) => {
        if (item.date) this.loadScheduleSlots(index);
      });
    },
    async confirmWashSchedule() {
      if (!this.schedulePlan) return;
      if (!this.scheduleVehicleId) return Swal.fire('Select Vehicle', 'Please select a vehicle.', 'warning');
      if (!this.scheduleCenterId) return Swal.fire('Select Center', 'Please select a service center.', 'warning');
      if (!this.scheduleAddress.trim()) return Swal.fire('Enter Address', 'Please enter the doorstep address.', 'warning');

      const requiredCount = Number(this.schedulePlan.max_bookings);
      const dates = this.scheduleItems.map(item => item.date);
      const is26Plan = requiredCount === 26;
      if (dates.some(date => !date) || (!is26Plan && this.scheduleItems.some(item => !item.slot))) {
        return Swal.fire('Incomplete Selection', `Please select date${is26Plan ? '' : ' and slot'} for all ${requiredCount} washes.`, 'warning');
      }
      if (new Set(dates).size !== requiredCount) return Swal.fire('Duplicate Dates', `Please select ${requiredCount} different dates.`, 'warning');
      const [year, month] = this.selectedMonth.split('-').map(Number);
      const nextMonthObj = new Date(year, month, 1);
      const nextMonthValue = `${nextMonthObj.getFullYear()}-${String(nextMonthObj.getMonth() + 1).padStart(2, '0')}`;
      const allowedMonths = [this.selectedMonth, nextMonthValue];

      if (dates.some(date => !allowedMonths.includes(date.slice(0, 7)))) {
        return Swal.fire('Invalid Dates', 'All wash dates must be inside the selected month or following month.', 'warning');
      }
      if (dates.some(date => date < this.monthMinDate || date > this.monthMaxDate)) {
        return Swal.fire('Invalid Dates', 'Selected dates are outside the allowed subscription period.', 'warning');
      }
      if (requiredCount === 4) {
        for (let i = 1; i < dates.length; i++) {
          if (dates[i] <= dates[i - 1]) {
            return Swal.fire(
              'Invalid Date Sequence',
              `Wash ${i + 1} date must be after Wash ${i} date (${this.formatScheduleDate(dates[i - 1])}).`,
              'warning'
            );
          }
        }
      }

      this.subscribingId = this.schedulePlan.id;
      try {
        const { data } = await axios.post('/api/cashfree/create-subscription-order', {
          package_id: this.schedulePlan.id,
          selected_month: this.selectedMonth,
          vehicle_id: Number(this.scheduleVehicleId),
          franchisee_id: Number(this.scheduleCenterId),
          address: this.scheduleAddress.trim(),
          schedules: this.scheduleItems.map(item => ({ date: item.date, slot: is26Plan ? '' : item.slot })),
        });

        if (data.status !== 'success' || !data.payment_session_id) {
          return Swal.fire('Error', data.message || 'Could not initiate subscription payment.', 'error');
        }

        // eslint-disable-next-line no-undef
        const cashfreeInstance = Cashfree({ mode: data.environment === 'production' ? 'production' : 'sandbox' });
        cashfreeInstance.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: '_self',
          returnUrl: window.location.origin + '/cashfree/return?order_id=' + encodeURIComponent(data.cashfree_order_id),
        });
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || 'Failed to initiate subscription payment.', 'error');
      } finally {
        this.subscribingId = null;
      }
    },
  },
  mounted() {
    this.loadSubscriptions();
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7, 13, 26, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

[data-theme="light"] .modal-overlay {
  background: rgba(10, 25, 47, 0.45);
}

.modal-content {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 2rem;
  width: 90%;
  max-width: 700px;
  box-shadow: var(--shadow-lg);
}

.glass-card {
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  color: var(--text-primary);
}
</style>
