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

    <div v-if="loading" class="text-center text-muted" style="padding: 2rem;">
      Loading subscription plans...
    </div>

    <div v-else class="grid grid-3 gap-3">
      <div v-for="p in packages" :key="p.id" class="card flex flex-col justify-between" style="border-top: 3px solid var(--accent-cyan);">
        <div>
          <div class="flex justify-between items-center" style="margin-bottom: 0.5rem;">
            <span class="badge badge-cyan">{{ formatType(p.vehicle_type) }}</span>
            <span class="text-muted" style="font-size: 0.75rem;">{{ p.frequency_days }} days</span>
          </div>
          <h4 style="margin-bottom: 0.5rem;">{{ p.name }}</h4>
          <p class="text-secondary" style="font-size: 0.85rem; margin-bottom: 1rem; line-height: 1.5;">{{ p.description }}</p>
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
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CustomerSubscriptions',
  data() {
    return {
      packages: [],
      activeSub: null,
      loading: true,
      subscribingId: null,
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
        const [pk, sub] = await Promise.all([
          axios.get('/api/packages'),
          axios.get('/api/customer/subscriptions')
        ]);
        // Filter packages that are recurring monthly packages (frequency_days = 30)
        this.packages = pk.data.filter(p => p.frequency_days === 30);
        this.activeSub = sub.data.find(s => s.status === 'active') || null;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    async subscribe(packageId) {
      if (!confirm('Subscribing will activate this package immediately and expire any previous active plan. Proceed?')) return;
      this.subscribingId = packageId;
      try {
        const { data } = await axios.post('/api/customer/subscriptions', { package_id: packageId });
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
