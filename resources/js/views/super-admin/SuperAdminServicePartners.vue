<template>
  <div>
    <div class="dash-header-compact">
      <div>
        <h1>Service Partners Management</h1>
        <p class="text-muted">Manage the Authorised Service Partners displayed on the homepage.</p>
      </div>
    </div>

    <div class="glass-card" style="margin-bottom: 2rem;">
      <h4 style="margin-bottom:1rem">Add New Partner</h4>
      <form @submit.prevent="addPartner" class="flex gap-2 items-center">
        <input type="text" v-model="newPartner.name" class="form-input" style="flex:1" placeholder="Partner Name (e.g. AutoGlym)" required />
        <input type="file" ref="partnerInput" @change="handleFileChange" accept="image/*" class="form-input" style="flex:1" />
        <button type="submit" class="btn btn-primary" :disabled="adding">
          {{ adding ? 'Adding...' : 'Add Partner' }}
        </button>
      </form>
    </div>

    <div class="glass-card">
      <h4 style="margin-bottom:1rem">Existing Partners</h4>
      <div v-if="loading" class="text-center text-muted py-4">Loading partners...</div>
      <div v-else-if="partners.length === 0" class="text-center text-muted py-4">No partners found.</div>
      <div v-else class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
        <div v-for="partner in partners" :key="partner.id" class="card" style="padding: 1rem; position: relative;">
          <div style="font-weight:700;font-size:1.1rem;margin-bottom:1rem;color:var(--text-secondary);text-align:center;">
             {{ partner.name }}
          </div>
          <div v-if="partner.image_path" class="text-center" style="margin-bottom: 1rem; background: var(--bg-primary); padding: 0.5rem; border-radius: var(--radius-sm);">
            <img :src="partner.image_path" alt="Partner Logo" style="max-height: 50px; max-width: 100%; object-fit: contain;" />
          </div>
          <div style="margin-bottom: 1rem;">
            <input type="file" @change="handleUpdateImage($event, partner)" accept="image/*" class="form-input" style="font-size: 0.8rem; padding: 0.25rem;" />
          </div>
          
          <div class="flex justify-between items-center" style="gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
            <div class="flex items-center gap-2">
              <label class="text-muted" style="font-size: 0.75rem;">Order:</label>
              <input type="number" v-model="partner.order" @change="updatePartner(partner)" class="form-input" style="width: 60px; padding: 0.25rem 0.5rem; height: 30px;" />
            </div>
            <div class="flex items-center gap-2">
              <label class="toggle-switch">
                <input type="checkbox" v-model="partner.is_active" @change="updatePartner(partner)" />
                <span class="toggle-slider"></span>
              </label>
              <span class="text-muted" style="font-size:0.75rem;">{{ partner.is_active ? 'Active' : 'Hidden' }}</span>
            </div>
          </div>
          <div style="margin-top: 1rem; text-align: right;">
            <button @click="deletePartner(partner.id)" class="btn btn-danger btn-sm w-full" style="padding: 0.35rem 0.5rem;" title="Delete Partner">
              🗑️ Delete
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
  name: 'SuperAdminServicePartners',
  data() {
    return {
      partners: [],
      loading: true,
      adding: false,
      newPartner: {
        name: '',
        image: null
      }
    };
  },
  methods: {
    async fetchPartners() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/super-admin/service-partners');
        this.partners = data;
      } catch (error) {
        console.error('Failed to fetch partners:', error);
      } finally {
        this.loading = false;
      }
    },
    handleFileChange(event) {
      if (event.target.files.length > 0) {
        this.newPartner.image = event.target.files[0];
      } else {
        this.newPartner.image = null;
      }
    },
    async addPartner() {
      if (!this.newPartner.name) return;
      this.adding = true;
      try {
        const formData = new FormData();
        formData.append('name', this.newPartner.name);
        if (this.newPartner.image) {
          formData.append('image', this.newPartner.image);
        }

        await axios.post('/api/super-admin/service-partners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        this.newPartner.name = '';
        this.newPartner.image = null;
        this.$refs.partnerInput.value = '';
        await this.fetchPartners();
      } catch (error) {
        console.error('Failed to add partner:', error);
        alert(error.response?.data?.message || 'Failed to add partner');
      } finally {
        this.adding = false;
      }
    },
    async handleUpdateImage(event, partner) {
      if (event.target.files.length === 0) return;
      
      const formData = new FormData();
      formData.append('_method', 'PUT'); // Laravel trick for PUT with FormData
      formData.append('name', partner.name);
      formData.append('order', partner.order);
      formData.append('is_active', partner.is_active ? 1 : 0);
      formData.append('image', event.target.files[0]);

      try {
        await axios.post(`/api/super-admin/service-partners/${partner.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.fetchPartners();
      } catch (error) {
        console.error('Failed to update image:', error);
        alert('Failed to update image');
      }
    },
    async updatePartner(partner) {
      try {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', partner.name);
        formData.append('order', partner.order);
        formData.append('is_active', partner.is_active ? 1 : 0);

        await axios.post(`/api/super-admin/service-partners/${partner.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (error) {
        console.error('Failed to update partner:', error);
        alert('Failed to update partner order/status');
        this.fetchPartners();
      }
    },
    async deletePartner(id) {
      if (!confirm('Are you sure you want to delete this partner?')) return;
      try {
        await axios.delete(`/api/super-admin/service-partners/${id}`);
        this.partners = this.partners.filter(p => p.id !== id);
      } catch (error) {
        console.error('Failed to delete partner:', error);
        alert('Failed to delete partner');
      }
    }
  },
  mounted() {
    this.fetchPartners();
  }
};
</script>

<style scoped>
.dash-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}
.toggle-switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--border-color);
  transition: .4s;
  border-radius: 34px;
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}
input:checked + .toggle-slider {
  background-color: var(--accent-emerald);
}
input:checked + .toggle-slider:before {
  transform: translateX(16px);
}
</style>
