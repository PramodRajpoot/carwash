<template>
  <div>
    <div style="margin-bottom: 2rem;">
      <h3>My Wishlist</h3>
      <p class="text-muted" style="font-size: 0.85rem;">Bookmark packages you plan to book later.</p>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 2rem;">
      Loading wishlist...
    </div>

    <div v-else>
      <div v-if="wishlist.length" class="grid grid-3 gap-3">
        <div v-for="w in wishlist" :key="w.id" class="glass-card flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
              <span class="badge badge-cyan">{{ formatType(w.package?.vehicle_type) }}</span>
              <button class="btn btn-ghost btn-sm text-danger" style="padding: 0.25rem 0.5rem;" @click="removeItem(w.id)">🗑️</button>
            </div>
            <h4 style="margin-bottom: 0.5rem;">{{ w.package?.name }}</h4>
            <p class="text-muted" style="font-size: 0.85rem; line-height: 1.5; margin-bottom: 1rem;">
              {{ w.package?.description }}
            </p>
          </div>
          <div>
            <div class="flex justify-between items-center" style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-top: 0.75rem;">
              <span style="font-size: 1.25rem; font-weight: 700; color: var(--accent-emerald);">₹{{ w.package?.price }}</span>
              <router-link to="/customer/bookings" class="btn btn-primary btn-sm">Book Service</router-link>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">❤️</div>
        <p>Your wishlist is empty. Explore our services and add some!</p>
        <router-link to="/services" class="btn btn-outline btn-sm" style="margin-top: 1rem;">Browse Services</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CustomerWishlist',
  data() {
    return {
      wishlist: [],
      loading: true
    };
  },
  methods: {
    formatType(t) {
      return t ? t.toUpperCase().replace('_', ' ') : '';
    },
    async loadWishlist() {
      try {
        const { data } = await axios.get('/api/customer/wishlist');
        this.wishlist = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    async removeItem(id) {
      try {
        await axios.delete(`/api/customer/wishlist/${id}`);
        this.loadWishlist();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to remove from wishlist.');
      }
    }
  },
  mounted() {
    this.loadWishlist();
  }
};
</script>
