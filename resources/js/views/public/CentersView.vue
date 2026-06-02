<template>
  <div>
    <section class="section">
      <div class="container">
        <div class="section-title"><h2>Our <span class="text-gradient">Centers</span></h2><p>Find a Carbon &amp; Hydro center near you.</p></div>
        <div v-if="loading" class="text-center text-muted" style="padding:3rem">Loading centers...</div>
        <div v-else>
          <div class="grid grid-3 gap-3">
            <div v-for="c in centers" :key="c.id" class="glass-card">
              <div style="font-size:2.5rem;margin-bottom:0.75rem">📍</div>
              <h4>{{ c.center_name }}</h4>
              <p class="text-muted" style="font-size:0.85rem;margin-top:0.25rem">{{ c.address }}</p>
              <div class="flex items-center gap-1" style="margin-top:0.5rem">
                <span class="badge badge-cyan">{{ c.city }}</span>
                <span class="badge" :class="c.status === 'active' ? 'badge-emerald' : 'badge-amber'">{{ c.status }}</span>
              </div>
            </div>
          </div>
          <div v-if="centers.length === 0" class="empty-state"><div class="empty-icon">🗺️</div><p>No active centers found.</p></div>
        </div>
        <div class="text-center" style="margin-top:3rem">
          <p class="text-muted" style="margin-bottom:1rem">Want to open a center in your city?</p>
          <router-link to="/become-partner" class="btn btn-primary">Become a Franchise Partner</router-link>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'CentersView',
  data() { return { centers: [], loading: true }; },
  async mounted() {
    try { const { data } = await axios.get('/api/centers'); this.centers = data; } catch (e) { console.error(e); }
    this.loading = false;
  },
};
</script>
