<template>
  <div>
    <!-- Services -->
    <section class="section" id="services">
      <div class="container">
        <div class="section-title"><h2>Our <span class="text-gradient">Services</span></h2><p>Professional vehicle detailing packages for every need.</p></div>
        <div class="flex gap-2 justify-center" style="margin-bottom:2rem;flex-wrap:wrap">
          <button v-for="f in filters" :key="f.value" class="btn btn-sm" :class="activeFilter === f.value ? 'btn-primary' : 'btn-outline'" @click="activeFilter = f.value">{{ f.label }}</button>
        </div>
        <div v-if="loading" class="text-center text-muted" style="padding:3rem">Loading services...</div>
        <div v-else class="grid grid-3 gap-3">
          <div v-for="pkg in filteredServices" :key="pkg.id" class="glass-card">
            <div class="flex justify-between items-center" style="margin-bottom:0.75rem">
              <span class="badge badge-cyan" style="text-transform: uppercase;">{{ pkg.vehicle_type }}</span>
              <span class="badge badge-violet">One-Time</span>
              <span v-if="pkg.custom_badge" class="badge" style="background: var(--accent-rose); color: white;">{{ pkg.custom_badge }}</span>
              <button type="button" @click.stop="toggleWishlist(pkg)" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; margin-left: auto; padding: 2px 4px; transition: transform 0.2s;" :title="isWishlisted(pkg.id) ? 'Remove from wishlist' : 'Add to wishlist'">{{ isWishlisted(pkg.id) ? '❤️' : '🤍' }}</button>
            </div>
            <h4 style="margin-bottom:0.5rem">{{ pkg.name }}</h4>
            <p class="text-muted" style="font-size:0.85rem;line-height:1.6;margin-bottom:1rem">{{ pkg.description }}</p>
            <div class="flex justify-between items-center">
              <div><span style="font-size:1.5rem;font-weight:700;color:var(--accent-cyan)">₹{{ pkg.price }}</span></div>
              <router-link to="/register" class="btn btn-primary btn-sm">Book Now</router-link>
            </div>
            <div v-if="pkg.max_bookings > 1" class="text-muted" style="font-size:0.75rem;margin-top:0.5rem">Includes {{ pkg.max_bookings }} washes</div>
          </div>
        </div>
        <div v-if="!loading && filteredServices.length === 0" class="empty-state"><div class="empty-icon">📦</div><p>No services found for this category.</p></div>
      </div>
    </section>

    <!-- Monthly Packages -->
    <section class="section" id="monthly-packages" style="padding-top:0">
      <div class="container">
        <div class="section-title"><h2>Monthly <span class="text-gradient">Packages</span></h2><p>Affordable recurring care plans with free detailing perks.</p></div>
        <div class="flex gap-2 justify-center" style="margin-bottom:2rem;flex-wrap:wrap">
          <button v-for="f in filters" :key="f.value" class="btn btn-sm" :class="activeMonthlyFilter === f.value ? 'btn-primary' : 'btn-outline'" @click="activeMonthlyFilter = f.value">{{ f.label }}</button>
        </div>
        <div v-if="loading" class="text-center text-muted" style="padding:3rem">Loading packages...</div>
        <div v-else class="grid grid-3 gap-3">
          <div v-for="pkg in filteredMonthlyPackages" :key="pkg.id" class="glass-card" style="border: 1px solid rgba(139, 92, 246, 0.25);">
            <div class="flex justify-between items-center" style="margin-bottom:0.75rem">
              <span class="badge badge-cyan" style="text-transform: uppercase;">{{ pkg.vehicle_type }}</span>
              <span class="badge badge-emerald">Monthly</span>
              <span v-if="pkg.custom_badge" class="badge" style="background: var(--accent-rose); color: white;">{{ pkg.custom_badge }}</span>
              <button type="button" @click.stop="toggleWishlist(pkg)" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; margin-left: auto; padding: 2px 4px; transition: transform 0.2s;" :title="isWishlisted(pkg.id) ? 'Remove from wishlist' : 'Add to wishlist'">{{ isWishlisted(pkg.id) ? '❤️' : '🤍' }}</button>
            </div>
            <h4 style="margin-bottom:0.5rem">{{ pkg.name }}</h4>
            <p class="text-muted" style="font-size:0.85rem;line-height:1.6;margin-bottom:1rem">{{ pkg.description }}</p>
            <div class="flex justify-between items-center">
              <div><span style="font-size:1.5rem;font-weight:700;color:var(--accent-cyan)">₹{{ pkg.price }}</span><span class="text-muted" style="font-size:0.8rem"> / month</span></div>
              <router-link to="/register" class="btn btn-primary btn-sm">Book Now</router-link>
            </div>
            <div v-if="pkg.max_bookings > 1" class="text-muted" style="font-size:0.75rem;margin-top:0.5rem">Includes {{ pkg.max_bookings }} washes</div>
          </div>
        </div>
        <div v-if="!loading && filteredMonthlyPackages.length === 0" class="empty-state"><div class="empty-icon">📦</div><p>No monthly packages found for this category.</p></div>
      </div>
    </section>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'ServicesView',
  data() {
    return {
      packages: [],
      wishlistIds: [],
      loading: true,
      activeFilter: 'all',
      activeMonthlyFilter: 'all',
      filters: [
        { label: 'All', value: 'all' },
        { label: 'Hatchback', value: 'hatchback' },
        { label: 'Sedan', value: 'sedan' },
        { label: 'SUV', value: 'suv' },
        { label: 'Commercial', value: 'commercial' },
        { label: 'Bus', value: 'bus' },
        { label: 'Volvo Bus', value: 'volvo_bus' },
      ],
    };
  },
  computed: {
    // Show only regular one-time services (exclude addons and monthly packages)
    filteredServices() {
      const services = this.packages.filter(p => !p.is_addon && !p.is_subscription && (p.frequency_days < 30 || !p.frequency_days));
      if (this.activeFilter === 'all') return services;
      return services.filter(p => p.vehicle_type === this.activeFilter);
    },
    // Show only monthly subscription packages (exclude addons)
    filteredMonthlyPackages() {
      const monthly = this.packages.filter(p => !p.is_addon && (p.is_subscription || p.frequency_days >= 30));
      if (this.activeMonthlyFilter === 'all') return monthly;
      return monthly.filter(p => p.vehicle_type === this.activeMonthlyFilter);
    },
    filteredPackages() {
      return this.filteredServices;
    },
  },
  methods: {
    isWishlisted(pkgId) {
      return this.wishlistIds.includes(pkgId);
    },
    async toggleWishlist(pkg) {
      if (this.isWishlisted(pkg.id)) {
        this.wishlistIds = this.wishlistIds.filter(id => id !== pkg.id);
        try {
          await axios.delete(`/api/customer/wishlist/${pkg.id}`);
        } catch (e) {
          this.wishlistIds.push(pkg.id);
        }
      } else {
        this.wishlistIds.push(pkg.id);
        try {
          await axios.post('/api/customer/wishlist', { package_id: pkg.id });
        } catch (e) {
          this.wishlistIds = this.wishlistIds.filter(id => id !== pkg.id);
          if (e.response && e.response.status === 401) {
            this.$router.push('/login');
          }
        }
      }
    },
  },
  async mounted() {
    try {
      const { data } = await axios.get('/api/packages');
      this.packages = data;
    } catch (e) { console.error(e); }

    try {
      const { data: wish } = await axios.get('/api/customer/wishlist');
      if (Array.isArray(wish)) {
        this.wishlistIds = wish.map(w => w.package_id || w.package?.id).filter(Boolean);
      }
    } catch (_) {}

    this.loading = false;
  },
};
</script>
