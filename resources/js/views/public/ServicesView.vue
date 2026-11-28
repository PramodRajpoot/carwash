<template>
  <div>
    <!-- Hero / Header -->
    <section class="section" style="padding-bottom: 1rem;">
      <div class="container text-center">
        <div class="section-title" style="margin-bottom: 1.5rem;">
          <h2>Our <span class="text-gradient">Services</span></h2>
          <p>Professional doorstep vehicle detailing & home cleaning services tailored for you.</p>
        </div>

        <!-- Primary Category Tabs -->
        <div class="flex gap-2 justify-center" style="margin-bottom: 1.25rem; flex-wrap: wrap;">
          <button
            type="button"
            class="btn"
            :class="activeCategory === 'all' ? 'btn-primary' : 'btn-outline'"
            style="border-radius: 9999px; padding: 0.5rem 1.25rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem;"
            @click="setCategory('all')"
          >
            <span>✨ All Services</span>
            <span class="badge" style="background: rgba(255,255,255,0.2); font-size: 0.75rem; margin-left: 2px;">{{ counts.all }}</span>
          </button>
          <button
            type="button"
            class="btn"
            :class="activeCategory === 'carwash' ? 'btn-primary' : 'btn-outline'"
            style="border-radius: 9999px; padding: 0.5rem 1.25rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem;"
            @click="setCategory('carwash')"
          >
            <span>🚗 Carwash</span>
            <span class="badge" style="background: rgba(255,255,255,0.2); font-size: 0.75rem; margin-left: 2px;">{{ counts.carwash }}</span>
          </button>
          <button
            type="button"
            class="btn"
            :class="activeCategory === 'home_cleaning' ? 'btn-primary' : 'btn-outline'"
            style="border-radius: 9999px; padding: 0.5rem 1.25rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem;"
            @click="setCategory('home_cleaning')"
          >
            <span>🏠 Home Cleaning</span>
            <span class="badge" style="background: rgba(255,255,255,0.2); font-size: 0.75rem; margin-left: 2px;">{{ counts.home_cleaning }}</span>
          </button>
        </div>

        <!-- Dynamic Sub-filter Pills -->
        <div class="flex gap-2 justify-center" style="margin-bottom: 1.5rem; flex-wrap: wrap;">
          <button
            v-for="sub in currentSubFilters"
            :key="sub.value"
            type="button"
            class="btn btn-sm"
            :class="activeSubFilter === sub.value ? 'btn-primary' : 'btn-outline'"
            @click="activeSubFilter = sub.value"
          >
            {{ sub.label }}
          </button>
        </div>

        <!-- Search Input -->
        <div style="max-width: 460px; margin: 0 auto 2rem auto; position: relative;">
          <input
            v-model="searchQuery"
            type="text"
            class="form-input"
            placeholder="🔍 Search services (e.g. Sofa, Detailing, Foam, Wax)..."
            style="width: 100%; border-radius: 9999px; padding: 0.65rem 1.25rem;"
          />
        </div>
      </div>
    </section>

    <!-- One-Time Services -->
    <section class="section" id="services" style="padding-top: 0;">
      <div class="container">
        <div class="flex justify-between items-center" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
          <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>⚡</span>
            <span>One-Time Services</span>
            <span class="text-muted" style="font-size: 0.85rem; font-weight: normal;">({{ filteredServices.length }})</span>
          </h3>
        </div>

        <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">Loading services...</div>
        
        <div v-else class="grid grid-3 gap-3">
          <div v-for="pkg in filteredServices" :key="pkg.id" class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="flex justify-between items-center" style="margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.35rem;">
                <!-- Category/Vehicle Badge -->
                <span v-if="isHomeCleaning(pkg)" class="badge badge-emerald" style="display: inline-flex; align-items: center; gap: 3px;">
                  🏠 {{ formatServiceType(pkg) }}
                </span>
                <span v-else class="badge badge-cyan" style="text-transform: uppercase;">
                  🚗 {{ pkg.vehicle_type }}
                </span>

                <span class="badge badge-violet">One-Time</span>
                <span v-if="pkg.custom_badge" class="badge" style="background: var(--accent-rose); color: white;">{{ pkg.custom_badge }}</span>

                <!-- Wishlist Heart Button -->
                <button
                  type="button"
                  @click.stop="toggleWishlist(pkg)"
                  style="background: none; border: none; cursor: pointer; font-size: 1.2rem; margin-left: auto; padding: 2px 4px; transition: transform 0.2s;"
                  :title="isWishlisted(pkg.id) ? 'Remove from wishlist' : 'Add to wishlist'"
                >
                  {{ isWishlisted(pkg.id) ? '❤️' : '🤍' }}
                </button>
              </div>

              <h4 style="margin-bottom: 0.5rem;">{{ pkg.name }}</h4>
              <p class="text-muted" style="font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem;">{{ pkg.description }}</p>
            </div>

            <div>
              <div class="flex justify-between items-center" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <div>
                  <span style="font-size: 1.45rem; font-weight: 700; color: var(--accent-cyan);">₹{{ pkg.price }}</span>
                </div>
                <button type="button" @click="bookService(pkg)" class="btn btn-primary btn-sm" style="font-weight: 600;">
                  Book Now →
                </button>
              </div>
              <div v-if="pkg.max_bookings > 1" class="text-muted" style="font-size: 0.75rem; margin-top: 0.4rem;">
                Includes {{ pkg.max_bookings }} {{ isHomeCleaning(pkg) ? 'services' : 'washes' }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="!loading && filteredServices.length === 0" class="empty-state" style="padding: 2.5rem 0;">
          <div class="empty-icon">📦</div>
          <p>No services found for this selection.</p>
        </div>
      </div>
    </section>

    <!-- Subscription Plans Section -->
    <section class="section" id="monthly-packages" style="padding-top: 1.5rem; padding-bottom: 3rem;">
      <div class="container">
        <div class="flex justify-between items-center" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
          <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>🗓️</span>
            <span>Subscription Packages</span>
            <span class="text-muted" style="font-size: 0.85rem; font-weight: normal;">({{ filteredMonthlyPackages.length }})</span>
          </h3>
          <router-link
            to="/customer/subscriptions"
            class="text-gradient"
            style="font-size: 0.9rem; font-weight: 600; text-decoration: none;"
          >
            Manage Subscriptions →
          </router-link>
        </div>

        <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">Loading packages...</div>

        <div v-else class="grid grid-3 gap-3">
          <div
            v-for="pkg in filteredMonthlyPackages"
            :key="pkg.id"
            class="glass-card"
            style="border: 1px solid rgba(139, 92, 246, 0.25); display: flex; flex-direction: column; justify-content: space-between;"
          >
            <div>
              <div class="flex justify-between items-center" style="margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.35rem;">
                <!-- Category/Vehicle Badge -->
                <span v-if="isHomeCleaning(pkg)" class="badge badge-emerald" style="display: inline-flex; align-items: center; gap: 3px;">
                  🏠 {{ formatServiceType(pkg) }}
                </span>
                <span v-else class="badge badge-cyan" style="text-transform: uppercase;">
                  🚗 {{ pkg.vehicle_type }}
                </span>

                <span class="badge badge-emerald">Subscription Pass</span>
                <span v-if="pkg.custom_badge" class="badge" style="background: var(--accent-rose); color: white;">{{ pkg.custom_badge }}</span>

                <!-- Wishlist Heart Button -->
                <button
                  type="button"
                  @click.stop="toggleWishlist(pkg)"
                  style="background: none; border: none; cursor: pointer; font-size: 1.2rem; margin-left: auto; padding: 2px 4px; transition: transform 0.2s;"
                  :title="isWishlisted(pkg.id) ? 'Remove from wishlist' : 'Add to wishlist'"
                >
                  {{ isWishlisted(pkg.id) ? '❤️' : '🤍' }}
                </button>
              </div>

              <h4 style="margin-bottom: 0.5rem;">{{ pkg.name }}</h4>
              <p class="text-muted" style="font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem;">{{ pkg.description }}</p>
            </div>

            <div>
              <div class="flex justify-between items-center" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <div>
                  <span style="font-size: 1.45rem; font-weight: 700; color: var(--accent-cyan);">₹{{ pkg.price }}</span>
                  <span class="text-muted" style="font-size: 0.8rem;"> / mo</span>
                </div>
                <button type="button" @click="subscribePlan(pkg)" class="btn btn-primary btn-sm" style="font-weight: 600;">
                  Subscribe →
                </button>
              </div>
              <div v-if="pkg.max_bookings > 1" class="text-muted" style="font-size: 0.75rem; margin-top: 0.4rem;">
                Includes {{ pkg.max_bookings }} {{ isHomeCleaning(pkg) ? 'services' : 'washes' }} per month
              </div>
            </div>
          </div>
        </div>

        <div v-if="!loading && filteredMonthlyPackages.length === 0" class="empty-state" style="padding: 2.5rem 0;">
          <div class="empty-icon">📦</div>
          <p>No subscription packages found for this selection.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';

export default {
  name: 'ServicesView',
  data() {
    return {
      packages: [],
      categories: [],
      wishlistIds: [],
      loading: true,
      activeCategory: 'all', // 'all', 'carwash', 'home_cleaning'
      activeSubFilter: 'all',
      searchQuery: '',
      vehicleFilters: [
        { label: 'All Vehicles', value: 'all' },
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
    // Dynamic home cleaning service type sub-filters
    homeSubFilters() {
      const types = new Set();
      this.packages.forEach(p => {
        if (this.isHomeCleaning(p) && p.vehicle_type && p.vehicle_type !== 'all' && p.vehicle_type !== 'home') {
          types.add(p.vehicle_type);
        }
      });
      const list = [{ label: 'All Types', value: 'all' }];
      types.forEach(t => {
        list.push({
          label: this.formatHomeType(t),
          value: t,
        });
      });
      return list;
    },

    currentSubFilters() {
      if (this.activeCategory === 'home_cleaning') {
        return this.homeSubFilters;
      }
      return this.vehicleFilters;
    },

    counts() {
      const main = this.packages.filter(
        p =>
          !p.is_addon &&
          !p.is_subscription &&
          (Number(p.frequency_days || 0) < 30 || Number(p.max_bookings || 1) <= 1)
      );
      return {
        all: main.length,
        carwash: main.filter(p => !this.isHomeCleaning(p)).length,
        home_cleaning: main.filter(p => this.isHomeCleaning(p)).length,
      };
    },

    filteredServices() {
      const services = this.packages.filter(
        p =>
          !p.is_addon &&
          !p.is_subscription &&
          (Number(p.frequency_days || 0) < 30 || Number(p.max_bookings || 1) <= 1)
      );
      return this.filterList(services);
    },

    filteredMonthlyPackages() {
      const monthly = this.packages.filter(
        p =>
          !p.is_addon &&
          (p.is_subscription ||
            Number(p.frequency_days || 0) >= 30 ||
            Number(p.max_bookings || 1) > 1)
      );
      return this.filterList(monthly);
    },
  },
  methods: {
    isHomeCleaning(pkg) {
      if (!pkg) return false;
      const cName = (pkg.category?.name || pkg.category_name || '').toLowerCase();
      const vt = (pkg.vehicle_type || '').toLowerCase();
      const name = (pkg.name || '').toLowerCase();
      return (
        cName.includes('home') ||
        vt.includes('sofa') ||
        vt.includes('seator') ||
        vt === 'home' ||
        name.includes('sofa') ||
        name.includes('home clean')
      );
    },

    formatServiceType(pkg) {
      if (!pkg) return '';
      if (this.isHomeCleaning(pkg)) {
        if (pkg.vehicle_type && pkg.vehicle_type !== 'all' && pkg.vehicle_type !== 'home') {
          return this.formatHomeType(pkg.vehicle_type);
        }
        return pkg.category?.name || 'Home Cleaning';
      }
      return (pkg.vehicle_type || 'Vehicle').toUpperCase().replace(/_/g, ' ');
    },

    formatHomeType(vt) {
      if (!vt) return '';
      return vt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },

    setCategory(cat) {
      if (cat === 'home_cleaning') {
        Swal.fire({
          title: 'Coming Soon',
          text: 'Home Cleaning service is coming soon!',
          icon: 'info',
          confirmButtonColor: '#0099ff'
        });
        return;
      }
      this.activeCategory = cat;
      this.activeSubFilter = 'all';
    },

    filterList(list) {
      return list.filter(p => {
        // Category check
        const isHome = this.isHomeCleaning(p);
        if (this.activeCategory === 'carwash' && isHome) return false;
        if (this.activeCategory === 'home_cleaning' && !isHome) return false;

        // Sub-filter check
        if (this.activeSubFilter !== 'all') {
          if (p.vehicle_type !== this.activeSubFilter && p.vehicle_type !== 'all') {
            return false;
          }
        }

        // Search Query check
        if (this.searchQuery && this.searchQuery.trim()) {
          const q = this.searchQuery.trim().toLowerCase();
          const nameMatch = (p.name || '').toLowerCase().includes(q);
          const descMatch = (p.description || '').toLowerCase().includes(q);
          const typeMatch = (p.vehicle_type || '').toLowerCase().includes(q);
          const catMatch = (p.category?.name || '').toLowerCase().includes(q);
          if (!nameMatch && !descMatch && !typeMatch && !catMatch) {
            return false;
          }
        }

        return true;
      });
    },

    isWishlisted(pkgId) {
      return this.wishlistIds.includes(pkgId);
    },

    async toggleWishlist(pkg) {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        this.$router.push('/login');
        return;
      }

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

    bookService(pkg) {
      const isHome = this.isHomeCleaning(pkg);
      if (isHome) {
        Swal.fire({
          title: 'Coming Soon',
          text: 'Home Cleaning service is coming soon!',
          icon: 'info',
          confirmButtonColor: '#0099ff'
        });
        return;
      }
      const catParam = isHome ? 'home_cleaning' : 'carwash';
      const token = localStorage.getItem('auth_token');

      if (token) {
        this.$router.push({
          path: '/customer/bookings',
          query: {
            package_id: pkg.id,
            category: catParam,
            book: 'true',
          },
        });
      } else {
        const redirectUrl = `/customer/bookings?package_id=${pkg.id}&category=${catParam}&book=true`;
        this.$router.push({
          path: '/login',
          query: { redirect: redirectUrl },
        });
      }
    },

    subscribePlan(pkg) {
      const isHome = this.isHomeCleaning(pkg);
      if (isHome) {
        Swal.fire({
          title: 'Coming Soon',
          text: 'Home Cleaning service is coming soon!',
          icon: 'info',
          confirmButtonColor: '#0099ff'
        });
        return;
      }
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.$router.push({
          path: '/customer/subscriptions',
          query: {
            package_id: pkg.id,
          },
        });
      } else {
        const redirectUrl = `/customer/subscriptions?package_id=${pkg.id}`;
        this.$router.push({
          path: '/login',
          query: { redirect: redirectUrl },
        });
      }
    },
  },

  async mounted() {
    // Read route query parameters
    if (this.$route.query.category) {
      const cat = String(this.$route.query.category).toLowerCase();
      if (cat.includes('home')) {
        Swal.fire({
          title: 'Coming Soon',
          text: 'Home Cleaning service is coming soon!',
          icon: 'info',
          confirmButtonColor: '#0099ff'
        });
        this.activeCategory = 'all';
      } else if (cat.includes('car')) {
        this.activeCategory = 'carwash';
      }
    }
    if (this.$route.query.search) {
      this.searchQuery = String(this.$route.query.search);
    }

    try {
      const [pkRes, catRes] = await Promise.allSettled([
        axios.get('/api/packages'),
        axios.get('/api/categories'),
      ]);

      if (pkRes.status === 'fulfilled') {
        this.packages = pkRes.value.data || [];
      }
      if (catRes.status === 'fulfilled') {
        this.categories = catRes.value.data || [];
      }
    } catch (e) {
      console.error('Error fetching services:', e);
    }

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
