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
  </div>
</template>

<script>
import axios from 'axios';
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
    };
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

      this.loading = false;
    },
    async subscribe(packageId) {
      const plan = this.packages.find(p => p.id === packageId);
      const washes = plan ? Number(plan.max_bookings) : 0;
      const planRule = washes === 4
        ? 'The 4-wash plan allows one wash on each separate day in the selected month.'
        : 'The 26-wash plan allows the 26 washes to be scheduled during the selected month.';

      if (!confirm(`${planRule}\n\nPayment will be full, in advance and non-refundable. You may reschedule your washes. Proceed?`)) return;
      this.subscribingId = packageId;
      try {
        const { data } = await axios.post('/api/customer/subscriptions', {
          package_id: packageId,
          selected_month: this.selectedMonth,
          payment_status: 'paid',
          paid_amount: plan?.price,
          payment_method: 'online',
        });
        alert(data.message);
        this.loadSubscriptions();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to subscribe.');
      }
      this.subscribingId = null;
    }
  },
  mounted() {
    this.loadSubscriptions();
  }
};
</script>
