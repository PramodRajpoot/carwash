<template>
  <div class="services-management">
    <header class="page-header">
      <div>
        <h1 class="page-title">Services Management</h1>
        <p class="page-subtitle">Manage service categories, service packages, pricing, and images.</p>
      </div>
    </header>

    <div class="tabs-container">
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'services' }" @click="activeTab = 'services'">Services / Packages</button>
        <button class="tab" :class="{ active: activeTab === 'categories' }" @click="activeTab = 'categories'">Categories</button>
      </div>
    </div>

    <!-- SERVICES TAB -->
    <div v-if="activeTab === 'services'" class="tab-content">
      <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <h3>All Services</h3>
        <button class="btn btn-primary" @click="openServiceModal()">+ Add Service</button>
      </div>

      <div class="glass-card mb-4" style="background: var(--bg-primary);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
              <th style="padding: 1rem; text-align: left;">Image</th>
              <th style="padding: 1rem; text-align: left;">Service Name</th>
              <th style="padding: 1rem; text-align: left;">Category</th>
              <th style="padding: 1rem; text-align: left;">Vehicle Type</th>
              <th style="padding: 1rem; text-align: left;">Price</th>
              <th style="padding: 1rem; text-align: left;">Frequency</th>
              <th style="padding: 1rem; text-align: left;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="services.length === 0">
              <td colspan="7" class="text-center" style="padding: 2rem;">No services found.</td>
            </tr>
            <tr v-for="service in services" :key="service.id" style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 1rem;">
                <img v-if="service.image_path" :src="'/storage/' + service.image_path" class="service-img" alt="Service Image">
                <div v-else class="service-img placeholder-img">No Img</div>
              </td>
              <td style="padding: 1rem;">
                <div style="font-weight: 600;">{{ service.name }}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ service.description }}</div>
              </td>
              <td style="padding: 1rem;">
                <span style="background: var(--surface-hover); color: var(--text-primary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">{{ service.category ? service.category.name : 'Uncategorized' }}</span>
              </td>
              <td style="padding: 1rem; text-transform: capitalize;">{{ service.vehicle_type }}</td>
              <td style="padding: 1rem; font-weight: 600;">₹{{ service.price }}</td>
              <td style="padding: 1rem;">{{ service.frequency_days }} days</td>
              <td style="padding: 1rem;">
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-outline btn-sm" @click="openServiceModal(service)">Edit</button>
                  <button class="btn btn-outline btn-sm" style="border-color: var(--accent-rose); color: var(--accent-rose);" @click="deleteService(service.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CATEGORIES TAB -->
    <div v-if="activeTab === 'categories'" class="tab-content">
      <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <h3>Service Categories</h3>
        <button class="btn btn-primary" @click="openCategoryModal()">+ Add Category</button>
      </div>

      <div class="glass-card mb-4" style="background: var(--bg-primary);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
              <th style="padding: 1rem; text-align: left;">ID</th>
              <th style="padding: 1rem; text-align: left;">Category Name</th>
              <th style="padding: 1rem; text-align: left;">Description</th>
              <th style="padding: 1rem; text-align: left;">Status</th>
              <th style="padding: 1rem; text-align: left;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="categories.length === 0">
              <td colspan="5" class="text-center" style="padding: 2rem;">No categories found.</td>
            </tr>
            <tr v-for="category in categories" :key="category.id" style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 1rem;">#{{ category.id }}</td>
              <td style="padding: 1rem; font-weight: 600;">{{ category.name }}</td>
              <td style="padding: 1rem; color: var(--text-muted); font-size: 0.85rem;">{{ category.description }}</td>
              <td style="padding: 1rem;">
                <span :style="{ background: category.status === 'active' ? '#dcfce7' : '#fee2e2', color: category.status === 'active' ? '#166534' : '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' }">
                  {{ category.status }}
                </span>
              </td>
              <td style="padding: 1rem;">
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-outline btn-sm" @click="openCategoryModal(category)">Edit</button>
                  <button class="btn btn-outline btn-sm" style="border-color: var(--accent-rose); color: var(--accent-rose);" @click="deleteCategory(category.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL FOR SERVICE -->
    <div class="modal-overlay" v-if="showServiceModal" @click.self="closeModal">
      <div class="modal-content" style="max-width: 750px;">
        <h3>{{ editingService ? 'Edit Service' : 'Add New Service' }}</h3>
        
        <form @submit.prevent="saveService">
          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Service Name *</label>
              <input v-model="serviceForm.name" type="text" class="form-input" required>
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select v-model="serviceForm.category_id" class="form-select" required>
                <option value="" disabled>Select Category</option>
                <option v-for="cat in activeCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="serviceForm.description" class="form-textarea" rows="3"></textarea>
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Vehicle Type *</label>
              <select v-model="serviceForm.vehicle_type" class="form-select" required>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
              </select>
            </div>
            <div class="form-group">
              <label>Price (₹) *</label>
              <input v-model="serviceForm.price" type="number" step="0.01" class="form-input" required>
            </div>
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Frequency (Days) *</label>
              <input v-model="serviceForm.frequency_days" type="number" class="form-input" required>
            </div>
            <div class="form-group">
              <label>Max Bookings per Day *</label>
              <input v-model="serviceForm.max_bookings" type="number" class="form-input" required>
            </div>
          </div>

          <div class="form-group">
            <label>Promotional Badge (Optional)</label>
            <input v-model="serviceForm.custom_badge" type="text" class="form-input" placeholder="e.g. Free Interior Polish, 10% Off">
            <small style="color: var(--text-muted); margin-top: 0.25rem; font-size: 0.8rem;">Highlight a special offer or feature on the service card.</small>
          </div>

          <div class="form-group">
            <label>Service Image</label>
            <div v-if="editingService && serviceForm.image_path" class="mb-2">
              <img :src="'/storage/' + serviceForm.image_path" alt="Current Image" style="height: 50px; border-radius: 4px;">
            </div>
            <input type="file" ref="serviceImage" @change="handleFileUpload" accept="image/*" class="form-input" style="padding: 0.5rem;">
            <small style="color: var(--text-muted); margin-top: 0.25rem; font-size: 0.8rem;">Upload an image for this service (JPEG, PNG). Leave blank to keep existing image if editing.</small>
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Save Service' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL FOR CATEGORY -->
    <div class="modal-overlay" v-if="showCategoryModal" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ editingCategory ? 'Edit Category' : 'Add New Category' }}</h3>
        
        <form @submit.prevent="saveCategory">
          <div class="form-group">
            <label>Category Name *</label>
            <input v-model="categoryForm.name" type="text" class="form-input" required>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="categoryForm.description" class="form-textarea" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Status</label>
            <select v-model="categoryForm.status" class="form-select">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Save Category' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SuperAdminServices',
  data() {
    return {
      activeTab: 'services',
      services: [],
      categories: [],
      
      showServiceModal: false,
      editingService: null,
      serviceForm: {
        category_id: '',
        name: '',
        description: '',
        vehicle_type: 'sedan',
        price: '',
        frequency_days: '',
        max_bookings: '',
        custom_badge: '',
        image_path: ''
      },
      serviceImageFile: null,

      showCategoryModal: false,
      editingCategory: null,
      categoryForm: {
        name: '',
        description: '',
        status: 'active'
      },

      isSubmitting: false
    }
  },
  computed: {
    activeCategories() {
      return this.categories.filter(c => c.status === 'active');
    }
  },
  methods: {
    async loadData() {
      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          axios.get('/api/super-admin/services'),
          axios.get('/api/super-admin/categories')
        ]);
        this.services = servicesRes.data;
        this.categories = categoriesRes.data;
      } catch (error) {
        console.error('Failed to load data', error);
      }
    },
    
    // Category Methods
    openCategoryModal(category = null) {
      if (category) {
        this.editingCategory = category;
        this.categoryForm = { ...category };
      } else {
        this.editingCategory = null;
        this.categoryForm = { name: '', description: '', status: 'active' };
      }
      this.showCategoryModal = true;
    },
    async saveCategory() {
      this.isSubmitting = true;
      try {
        if (this.editingCategory) {
          await axios.put(`/api/super-admin/categories/${this.editingCategory.id}`, this.categoryForm);
        } else {
          await axios.post('/api/super-admin/categories', this.categoryForm);
        }
        await this.loadData();
        this.closeModal();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to save category');
      } finally {
        this.isSubmitting = false;
      }
    },
    async deleteCategory(id) {
      if (confirm('Are you sure you want to delete this category? Ensure no services are using it.')) {
        try {
          await axios.delete(`/api/super-admin/categories/${id}`);
          await this.loadData();
        } catch (error) {
          alert('Failed to delete category');
        }
      }
    },

    // Service Methods
    openServiceModal(service = null) {
      this.serviceImageFile = null;
      if (this.$refs.serviceImage) {
        this.$refs.serviceImage.value = '';
      }

      if (service) {
        this.editingService = service;
        this.serviceForm = { ...service };
      } else {
        this.editingService = null;
        this.serviceForm = {
          category_id: '',
          name: '',
          description: '',
          vehicle_type: 'sedan',
          price: '',
          frequency_days: 15,
          max_bookings: 10,
          custom_badge: '',
          image_path: ''
        };
      }
      this.showServiceModal = true;
    },
    handleFileUpload(event) {
      this.serviceImageFile = event.target.files[0];
    },
    async saveService() {
      this.isSubmitting = true;
      try {
        const formData = new FormData();
        for (const key in this.serviceForm) {
          if (this.serviceForm[key] !== null && this.serviceForm[key] !== '') {
            formData.append(key, this.serviceForm[key]);
          }
        }
        
        if (this.serviceImageFile) {
          formData.append('image', this.serviceImageFile);
        }

        if (this.editingService) {
          // Send via POST instead of PUT because FormData handles file uploads best with POST in PHP
          // Alternatively, Laravel allows method spoofing:
          // formData.append('_method', 'PUT');
          await axios.post(`/api/super-admin/services/${this.editingService.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await axios.post('/api/super-admin/services', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        await this.loadData();
        this.closeModal();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to save service');
      } finally {
        this.isSubmitting = false;
      }
    },
    async deleteService(id) {
      if (confirm('Are you sure you want to delete this service?')) {
        try {
          await axios.delete(`/api/super-admin/services/${id}`);
          await this.loadData();
        } catch (error) {
          alert('Failed to delete service');
        }
      }
    },

    closeModal() {
      this.showServiceModal = false;
      this.showCategoryModal = false;
      this.editingService = null;
      this.editingCategory = null;
      this.serviceImageFile = null;
    }
  },
  mounted() {
    this.loadData();
  }
}
</script>

<style scoped>
/* Scoped styles removed to rely on global utilities */
.placeholder-img {
  background: var(--surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}
.service-img {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
.tabs-container {
  margin-bottom: 1.5rem;
}
.tabs {
  display: flex;
  gap: 2rem;
  border-bottom: 1px solid var(--border-color);
}
.tab {
  background: none;
  border: none;
  padding: 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}
.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}
.tab:hover:not(.active) {
  color: var(--text-primary);
}
</style>
