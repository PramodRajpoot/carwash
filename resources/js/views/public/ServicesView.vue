<template>
  <div>
    <section class="section">
      <div class="container">
        <div class="section-title"><h2>Our <span class="text-gradient">Services</span></h2><p>Professional vehicle detailing packages for every need.</p></div>
        <div class="flex gap-2 justify-center" style="margin-bottom:2rem;flex-wrap:wrap">
          <button v-for="f in filters" :key="f.value" class="btn btn-sm" :class="activeFilter === f.value ? 'btn-primary' : 'btn-outline'" @click="activeFilter = f.value">{{ f.label }}</button>
        </div>
        <div v-if="loading" class="text-center text-muted" style="padding:3rem">Loading packages...</div>
        <div v-else class="grid grid-3 gap-3">
          <div v-for="pkg in filteredPackages" :key="pkg.id" class="glass-card">
            <div class="flex justify-between items-center" style="margin-bottom:0.75rem">
              <span class="badge badge-cyan">{{ pkg.vehicle_type }}</span>
              <span v-if="pkg.frequency_days > 0" class="badge badge-emerald">Monthly</span>
              <span v-else class="badge badge-violet">One-Time</span>
            </div>
            <h4 style="margin-bottom:0.5rem">{{ pkg.name }}</h4>
            <p class="text-muted" style="font-size:0.85rem;line-height:1.6;margin-bottom:1rem">{{ pkg.description }}</p>
            <div class="flex justify-between items-center">
              <div><span style="font-size:1.5rem;font-weight:700;color:var(--accent-cyan)">₹{{ pkg.price }}</span><span v-if="pkg.frequency_days > 0" class="text-muted" style="font-size:0.8rem"> / month</span></div>
              <router-link to="/register" class="btn btn-primary btn-sm">Book Now</router-link>
            </div>
            <div v-if="pkg.max_bookings > 1" class="text-muted" style="font-size:0.75rem;margin-top:0.5rem">Includes {{ pkg.max_bookings }} washes</div>
          </div>
        </div>
        <div v-if="!loading && filteredPackages.length === 0" class="empty-state"><div class="empty-icon">📦</div><p>No packages found for this category.</p></div>
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
      loading: true,
      activeFilter: 'all',
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
    filteredPackages() {
      if (this.activeFilter === 'all') return this.packages;
      return this.packages.filter(p => p.vehicle_type === this.activeFilter);
    },
  },
  async mounted() {
    try {
      const { data } = await axios.get('/api/packages');
      this.packages = data;
    } catch (e) { console.error(e); }
    this.loading = false;
  },
};
</script>
