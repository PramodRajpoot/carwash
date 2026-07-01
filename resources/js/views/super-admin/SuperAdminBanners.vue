<template>
  <div>
    <div class="dash-header flex justify-between items-center">
      <div>
        <h1>Hero Banners Management</h1>
        <p class="text-muted">Manage the dynamic slider banners displayed on the homepage.</p>
      </div>
    </div>

    <div class="grid gap-3" style="margin-bottom: 2rem;">
      <div class="glass-card">
        <h4 style="margin-bottom:1rem">Upload New Banner</h4>
        <form @submit.prevent="uploadBanner" class="flex gap-2 items-center">
          <input type="file" ref="bannerInput" @change="handleFileChange" accept="image/*" class="form-input" style="flex:1" required />
          <button type="submit" class="btn btn-primary" :disabled="uploading">
            {{ uploading ? 'Uploading...' : 'Upload Banner' }}
          </button>
        </form>
        <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.5rem;">Recommended size: 800x800px. Max size: 5MB.</p>
      </div>
    </div>

    <div class="glass-card">
      <h4 style="margin-bottom:1rem">Existing Banners</h4>
      <div v-if="loading" class="text-center text-muted py-4">Loading banners...</div>
      <div v-else-if="banners.length === 0" class="text-center text-muted py-4">No banners found.</div>
      <div v-else class="grid grid-3 gap-3">
        <div v-for="banner in banners" :key="banner.id" class="card" style="padding: 1rem; position: relative;">
          <img :src="banner.image_path" alt="Banner" style="width:100%; height:150px; object-fit:cover; border-radius: var(--radius-sm); margin-bottom: 1rem;" />
          
          <div class="flex justify-between items-center">
            <div>
              <label class="text-muted" style="font-size: 0.75rem;">Order</label>
              <input type="number" v-model="banner.order" @change="updateBanner(banner)" class="form-input" style="width: 60px; padding: 0.25rem 0.5rem; height: 30px;" />
            </div>
            <div>
              <label style="display:flex; align-items:center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" v-model="banner.is_active" @change="updateBanner(banner)" />
                Active
              </label>
            </div>
            <button @click="deleteBanner(banner.id)" class="btn btn-danger btn-sm" style="padding: 0.25rem 0.5rem;" title="Delete Banner">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SuperAdminBanners',
  data() {
    return {
      banners: [],
      loading: true,
      uploading: false,
      selectedFile: null,
    };
  },
  methods: {
    async fetchBanners() {
      try {
        const { data } = await axios.get('/api/super-admin/banners');
        this.banners = data;
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        this.loading = false;
      }
    },
    handleFileChange(event) {
      this.selectedFile = event.target.files[0];
    },
    async uploadBanner() {
      if (!this.selectedFile) return;
      this.uploading = true;
      const formData = new FormData();
      formData.append('image', this.selectedFile);

      try {
        await axios.post('/api/super-admin/banners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.selectedFile = null;
        this.$refs.bannerInput.value = '';
        await this.fetchBanners();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to upload banner');
      } finally {
        this.uploading = false;
      }
    },
    async updateBanner(banner) {
      try {
        await axios.put(`/api/super-admin/banners/${banner.id}`, {
          order: banner.order,
          is_active: banner.is_active
        });
      } catch (error) {
        console.error('Failed to update banner:', error);
        alert('Failed to update banner order/status');
      }
    },
    async deleteBanner(id) {
      if (!confirm('Are you sure you want to delete this banner?')) return;
      try {
        await axios.delete(`/api/super-admin/banners/${id}`);
        this.banners = this.banners.filter(b => b.id !== id);
      } catch (error) {
        console.error('Failed to delete banner:', error);
        alert('Failed to delete banner');
      }
    }
  },
  mounted() {
    this.fetchBanners();
  }
};
</script>
