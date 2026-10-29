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
      <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="margin: 0;">Services & Add-ons</h3>
          <p class="text-muted" style="font-size: 0.85rem; margin-top: 0.25rem;">
            Configure primary car wash packages and optional add-on treatments.
          </p>
        </div>
        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-outline" style="border-color: var(--accent-emerald); color: var(--accent-emerald); font-weight: 600;" @click="openServiceModal(null, true)">
            ➕ Add Add-on Service
          </button>
          <button class="btn btn-primary" @click="openServiceModal(null, false)">
            + Add Service
          </button>
        </div>
      </div>

      <!-- Service Sub-filters (All / Main Services / Add-ons) -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
        <button 
          class="btn btn-sm" 
          :class="serviceFilter === 'all' ? 'btn-primary' : 'btn-outline'" 
          @click="serviceFilter = 'all'; servicesCurrentPage = 1">
          All ({{ services.length }})
        </button>
        <button 
          class="btn btn-sm" 
          :class="serviceFilter === 'main' ? 'btn-primary' : 'btn-outline'" 
          @click="serviceFilter = 'main'; servicesCurrentPage = 1">
          ⭐ Main Services ({{ mainServicesCount }})
        </button>
        <button 
          class="btn btn-sm" 
          :class="serviceFilter === 'addon' ? 'btn-primary' : 'btn-outline'" 
          @click="serviceFilter = 'addon'; servicesCurrentPage = 1">
          ➕ Add-on Services ({{ addonServicesCount }})
        </button>
      </div>

      <div class="glass-card mb-4" style="background: var(--bg-primary);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
              <th style="padding: 1rem; text-align: left;">Image</th>
              <th style="padding: 1rem; text-align: left;">Service Name</th>
              <th style="padding: 1rem; text-align: left;">Type</th>
              <th style="padding: 1rem; text-align: left;">Category</th>
              <th style="padding: 1rem; text-align: left;">Vehicle Type</th>
              <th style="padding: 1rem; text-align: left;">Price</th>
              <th style="padding: 1rem; text-align: left;">Frequency</th>
              <th style="padding: 1rem; text-align: left;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredServices.length === 0">
              <td colspan="8" class="text-center" style="padding: 2rem;">No services found.</td>
            </tr>
            <tr v-for="service in paginatedServices" :key="service.id" style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 1rem;">
                <img v-if="service.image_path" :src="'/storage/' + service.image_path" class="service-img" alt="Service Image">
                <div v-else class="service-img placeholder-img">No Img</div>
              </td>
              <td style="padding: 1rem;">
                <div style="font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                  <span>{{ service.name }}</span>
                  <span v-if="service.custom_badge" class="badge badge-emerald" style="font-size: 0.68rem; padding: 1px 6px;">
                    {{ service.custom_badge }}
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ service.description || '-' }}
                </div>
                <div v-if="service.addons && service.addons.length > 0" style="margin-top: 0.35rem; display: flex; flex-wrap: wrap; gap: 4px;">
                  <span v-for="a in service.addons" :key="a.id" style="font-size: 0.68rem; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.25); border-radius: 4px; padding: 1px 6px; font-weight: 600;">
                    + {{ a.name }} (₹{{ a.price }})
                  </span>
                </div>
              </td>
              <td style="padding: 1rem;">
                <span v-if="service.is_addon" style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25);">
                  ➕ Add-on
                </span>
                <span v-else style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background: rgba(59, 130, 246, 0.12); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.25);">
                  ⭐ Main
                </span>
              </td>
              <td style="padding: 1rem;">
                <span style="background: var(--surface-hover); color: var(--text-primary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                  {{ getDisplayCategory(service) }}
                </span>
              </td>
              <td style="padding: 1rem; text-transform: capitalize;">
                <span v-if="service.vehicle_type === 'all'" class="badge badge-cyan" style="font-size: 0.72rem;">All Vehicles</span>
                <span v-else>{{ service.vehicle_type }}</span>
              </td>
              <td style="padding: 1rem; font-weight: 700; color: var(--accent-emerald);">₹{{ service.price }}</td>
              <td style="padding: 1rem;">
                <span v-if="service.is_addon" class="text-muted" style="font-size: 0.82rem;">One-time</span>
                <span v-else>{{ service.frequency_days }} days</span>
              </td>
              <td style="padding: 1rem;">
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                  <button v-if="!service.is_addon" class="btn btn-outline btn-sm" style="border-color: var(--accent-emerald); color: var(--accent-emerald); font-weight: 600; white-space: nowrap;" @click="openManageAddonsModal(service)">
                    ➕ Add-on Service {{ service.addons && service.addons.length ? '(' + service.addons.length + ')' : '' }}
                  </button>
                  <button class="btn btn-outline btn-sm" @click="openServiceModal(service)">Edit</button>
                  <button class="btn btn-outline btn-sm" style="border-color: var(--accent-rose); color: var(--accent-rose);" @click="deleteService(service.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
            <select v-model="servicesPerPage" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;" @change="servicesCurrentPage = 1">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="75">75</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
            </select>
            <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">
              Showing {{ filteredServices.length > 0 ? (servicesCurrentPage - 1) * servicesPerPage + 1 : 0 }} to {{ Math.min(servicesCurrentPage * servicesPerPage, filteredServices.length) }} of {{ filteredServices.length }}
            </span>
          </div>
          <div class="flex gap-1">
            <button class="btn btn-sm btn-outline" :disabled="servicesCurrentPage === 1" @click="servicesCurrentPage--">Prev</button>
            <button class="btn btn-sm btn-outline" :disabled="servicesCurrentPage >= totalServicesPages" @click="servicesCurrentPage++">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- CATEGORIES TAB -->
    <div v-if="activeTab === 'categories'" class="tab-content">
      <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0;">Service Categories</h3>
          <p class="text-muted" style="font-size: 0.85rem; margin-top: 0.25rem;">
            Categories such as Hatchback, Sedan, SUV, and service segments.
          </p>
        </div>
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
            <tr v-for="category in paginatedCategories" :key="category.id" style="border-bottom: 1px solid var(--border-color);">
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
        <div class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
            <select v-model="categoriesPerPage" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;" @change="categoriesCurrentPage = 1">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="75">75</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
            </select>
            <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">
              Showing {{ (categoriesCurrentPage - 1) * categoriesPerPage + 1 }} to {{ Math.min(categoriesCurrentPage * categoriesPerPage, categories.length) }} of {{ categories.length }}
            </span>
          </div>
          <div class="flex gap-1">
            <button class="btn btn-sm btn-outline" :disabled="categoriesCurrentPage === 1" @click="categoriesCurrentPage--">Prev</button>
            <button class="btn btn-sm btn-outline" :disabled="categoriesCurrentPage >= totalCategoriesPages" @click="categoriesCurrentPage++">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL FOR SERVICE (MAIN OR ADD-ON) -->
    <div class="modal-overlay" v-if="showServiceModal" @click.self="closeModal">
      <div class="modal-content" style="max-width: 750px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="margin: 0;">{{ editingService ? (serviceForm.is_addon ? 'Edit Add-on Service' : 'Edit Service') : (serviceForm.is_addon ? '➕ Add New Add-on Service' : '⭐ Add New Service') }}</h3>
          <span class="badge" :style="{ background: serviceForm.is_addon ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: serviceForm.is_addon ? '#10b981' : '#3b82f6' }">
            {{ serviceForm.is_addon ? 'Add-on Service' : 'Main Service' }}
          </span>
        </div>

        <!-- Service Type Selector Toggle -->
        <div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 1.5rem;">
          <span style="font-weight: 600; font-size: 0.9rem;">Service Type:</span>
          <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.9rem;">
            <input type="radio" :value="false" v-model="serviceForm.is_addon" name="service_type_toggle" />
            ⭐ Main Service (e.g. Happy wash)
          </label>
          <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.9rem;">
            <input type="radio" :value="true" v-model="serviceForm.is_addon" name="service_type_toggle" />
            ➕ Add-on Service (e.g. Tyre polish)
          </label>
        </div>
        
        <form @submit.prevent="saveService">
          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>{{ serviceForm.is_addon ? 'Add-on Service Name *' : 'Service Name *' }}</label>
              <input v-model="serviceForm.name" type="text" class="form-input" :placeholder="serviceForm.is_addon ? 'e.g. Tyre polish' : 'e.g. Happy wash'" required>
            </div>
            <div class="form-group">
              <label>Category {{ serviceForm.is_addon ? '(Optional)' : '*' }}</label>
              <select v-model="serviceForm.category_id" class="form-select" :required="!serviceForm.is_addon">
                <option value="">{{ serviceForm.is_addon ? 'All Categories / General' : 'Select Category' }}</option>
                <option v-for="cat in activeCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="serviceForm.description" class="form-textarea" rows="2" placeholder="Brief details about this service"></textarea>
          </div>

          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Vehicle Type *</label>
              <select v-model="serviceForm.vehicle_type" class="form-select" required>
                <option v-if="serviceForm.is_addon" value="all">All Vehicles</option>
                <option value="hatchback">Hatchback</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="commercial">Commercial</option>
                <option value="bus">Bus</option>
                <option value="volvo_bus">Volvo Bus</option>
              </select>
            </div>
            <div class="form-group">
              <label>Price (₹) *</label>
              <input v-model="serviceForm.price" type="number" step="0.01" class="form-input" placeholder="e.g. 50.00" required>
            </div>
          </div>

          <!-- Main Service Specific Fields -->
          <div v-if="!serviceForm.is_addon" class="grid grid-2 gap-2">
            <div class="form-group">
              <label>Frequency (Days) *</label>
              <input v-model="serviceForm.frequency_days" type="number" class="form-input" required>
            </div>
            <div class="form-group">
              <label>Max Bookings / Washes Included *</label>
              <input v-model="serviceForm.max_bookings" type="number" class="form-input" required>
            </div>
          </div>

          <div class="form-group">
            <label>Promotional Badge (Optional)</label>
            <input v-model="serviceForm.custom_badge" type="text" class="form-input" placeholder="e.g. Popular, Recommended, Best Value">
            <small style="color: var(--text-muted); margin-top: 0.25rem; font-size: 0.8rem;">Highlight a special badge or offer on the card.</small>
          </div>

          <div class="form-group">
            <label>Service Image</label>
            <div v-if="editingService && serviceForm.image_path" class="mb-2">
              <img :src="'/storage/' + serviceForm.image_path" alt="Current Image" style="height: 50px; border-radius: 4px;">
            </div>
            <input type="file" ref="serviceImage" @change="handleFileUpload" accept="image/*" class="form-input" style="padding: 0.5rem;">
            <small style="color: var(--text-muted); margin-top: 0.25rem; font-size: 0.8rem;">Upload an image (JPEG, PNG). Leave blank to keep existing image if editing.</small>
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : (serviceForm.is_addon ? 'Save Add-on Service' : 'Save Service') }}
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

    <!-- MODAL FOR MANAGING ADDONS FOR A SERVICE -->
    <div class="modal-overlay" v-if="showManageAddonsModal" @click.self="closeModal">
      <div class="modal-content" style="max-width: 650px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div>
            <h3 style="margin: 0;">➕ Add-on Services for "{{ managingService ? managingService.name : '' }}"</h3>
            <p class="text-muted" style="font-size: 0.85rem; margin-top: 0.25rem;">
              Vehicle: <b style="text-transform: capitalize;">{{ managingService ? managingService.vehicle_type : '' }}</b> • Category: <b>{{ managingService ? getDisplayCategory(managingService) : '' }}</b>
            </p>
          </div>
          <button class="btn btn-ghost btn-sm" @click="closeModal" style="font-size: 1.1rem; line-height: 1;">✕</button>
        </div>

        <!-- Available Add-on Services to Select -->
        <div style="margin-bottom: 1.5rem;">
          <label style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
            Select Add-ons to Offer with this Service:
          </label>
          <div v-if="allAddonList.length === 0" class="text-muted" style="font-size: 0.85rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 6px;">
            No add-on services exist yet. You can create one below!
          </div>
          <div v-else style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem;">
            <div v-for="addon in allAddonList" :key="addon.id"
              style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--border-color); cursor: pointer; border-radius: 4px;"
              :style="{ background: isManagingAddonSelected(addon.id) ? 'rgba(16,185,129,0.08)' : 'transparent' }"
              @click="toggleManagingAddon(addon.id)">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <input type="checkbox" :checked="isManagingAddonSelected(addon.id)" style="accent-color: var(--accent-emerald); width: 16px; height: 16px; pointer-events: none;" />
                <div>
                  <div style="font-weight: 600; font-size: 0.88rem;">{{ addon.name }}</div>
                  <div class="text-muted" style="font-size: 0.72rem;">{{ addon.description || 'Add-on service' }}</div>
                </div>
              </div>
              <div style="font-weight: 700; color: var(--accent-emerald); font-size: 0.9rem;">+ ₹{{ addon.price }}</div>
            </div>
          </div>
        </div>

        <!-- Quick Create & Attach New Addon -->
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; border: 1px dashed var(--border-color);">
          <div style="font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; color: var(--accent-cyan);">
            ✨ Or Create a New Add-on for this Service
          </div>
          <div class="grid grid-2 gap-2" style="margin-bottom: 0.5rem;">
            <div>
              <input v-model="newAddonForm.name" type="text" class="form-input" placeholder="Add-on Name (e.g. Tyre polish)" style="font-size: 0.85rem;" />
            </div>
            <div>
              <input v-model="newAddonForm.price" type="number" step="0.01" class="form-input" placeholder="Price (₹) e.g. 50" style="font-size: 0.85rem;" />
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <input v-model="newAddonForm.description" type="text" class="form-input" placeholder="Description (optional)" style="font-size: 0.85rem; flex: 1;" />
            <button type="button" class="btn btn-sm" style="background: var(--accent-cyan); color: #fff; font-weight: 600; white-space: nowrap;" @click="quickCreateAndAttachAddon" :disabled="!newAddonForm.name || !newAddonForm.price || isSubmitting">
              + Add & Attach
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center" style="margin-top: 1rem;">
          <span class="text-muted" style="font-size: 0.85rem;">{{ selectedManagingAddonIds.length }} add-on(s) selected</span>
          <div class="flex gap-2">
            <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="isSubmitting" @click="saveManagingAddons">
              {{ isSubmitting ? 'Saving...' : 'Save Add-on Services' }}
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
  name: 'SuperAdminServices',
  data() {
    return {
      activeTab: 'services',
      serviceFilter: 'all',
      services: [],
      categories: [],
      
      showServiceModal: false,
      editingService: null,
      serviceForm: {
        is_addon: false,
        category_id: '',
        name: '',
        description: '',
        vehicle_type: 'sedan',
        price: '',
        frequency_days: 15,
        max_bookings: 10,
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

      showManageAddonsModal: false,
      managingService: null,
      selectedManagingAddonIds: [],
      newAddonForm: {
        name: '',
        price: '',
        description: ''
      },

      isSubmitting: false,
      servicesCurrentPage: 1,
      servicesPerPage: 10,
      categoriesCurrentPage: 1,
      categoriesPerPage: 10
    }
  },
  computed: {
    allAddonList() {
      return this.services.filter(s => s.is_addon);
    },
    activeCategories() {
      return this.categories.filter(c => c.status === 'active');
    },
    mainServicesCount() {
      return this.services.filter(s => !s.is_addon).length;
    },
    addonServicesCount() {
      return this.services.filter(s => s.is_addon).length;
    },
    filteredServices() {
      if (this.serviceFilter === 'main') {
        return this.services.filter(s => !s.is_addon);
      }
      if (this.serviceFilter === 'addon') {
        return this.services.filter(s => s.is_addon);
      }
      return this.services;
    },
    paginatedServices() {
      const start = (this.servicesCurrentPage - 1) * this.servicesPerPage;
      return this.filteredServices.slice(start, start + this.servicesPerPage);
    },
    totalServicesPages() {
      return Math.ceil(this.filteredServices.length / this.servicesPerPage) || 1;
    },
    paginatedCategories() {
      const start = (this.categoriesCurrentPage - 1) * this.categoriesPerPage;
      return this.categories.slice(start, start + this.categoriesPerPage);
    },
    totalCategoriesPages() {
      return Math.ceil(this.categories.length / this.categoriesPerPage) || 1;
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
    getDisplayCategory(service) {
      if (service.category && service.category.name) {
        return service.category.name;
      }
      if (service.vehicle_type && service.vehicle_type !== 'all') {
        return service.vehicle_type.charAt(0).toUpperCase() + service.vehicle_type.slice(1);
      }
      return 'General';
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
    openServiceModal(service = null, isAddon = false) {
      this.serviceImageFile = null;
      if (this.$refs.serviceImage) {
        this.$refs.serviceImage.value = '';
      }

      if (service) {
        this.editingService = service;
        this.serviceForm = {
          ...service,
          is_addon: !!service.is_addon
        };
      } else {
        this.editingService = null;
        this.serviceForm = {
          is_addon: isAddon,
          category_id: '',
          name: '',
          description: '',
          vehicle_type: isAddon ? 'all' : 'sedan',
          price: isAddon ? 50 : '',
          frequency_days: isAddon ? 1 : 15,
          max_bookings: 1,
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
          if (key === 'is_addon') {
            formData.append('is_addon', this.serviceForm.is_addon ? '1' : '0');
          } else if (this.serviceForm[key] !== null && this.serviceForm[key] !== '') {
            formData.append(key, this.serviceForm[key]);
          }
        }
        
        if (this.serviceForm.is_addon) {
          if (!formData.has('frequency_days')) formData.append('frequency_days', '1');
          if (!formData.has('max_bookings')) formData.append('max_bookings', '1');
          if (!formData.has('vehicle_type')) formData.append('vehicle_type', 'all');
        }

        if (this.serviceImageFile) {
          formData.append('image', this.serviceImageFile);
        }

        if (this.editingService) {
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

    openManageAddonsModal(service) {
      this.managingService = service;
      this.selectedManagingAddonIds = service.addons ? service.addons.map(a => a.id) : [];
      this.newAddonForm = { name: '', price: 50, description: '' };
      this.showManageAddonsModal = true;
    },
    isManagingAddonSelected(id) {
      return this.selectedManagingAddonIds.includes(id);
    },
    toggleManagingAddon(id) {
      if (this.isManagingAddonSelected(id)) {
        this.selectedManagingAddonIds = this.selectedManagingAddonIds.filter(x => x !== id);
      } else {
        this.selectedManagingAddonIds.push(id);
      }
    },
    async quickCreateAndAttachAddon() {
      if (!this.newAddonForm.name || !this.newAddonForm.price) {
        alert('Please provide name and price for the new add-on.');
        return;
      }
      this.isSubmitting = true;
      try {
        const res = await axios.post(`/api/super-admin/services/${this.managingService.id}/addons`, {
          new_addon_name: this.newAddonForm.name,
          new_addon_price: this.newAddonForm.price,
          new_addon_description: this.newAddonForm.description,
          addon_ids: this.selectedManagingAddonIds
        });
        this.managingService = res.data.service;
        this.selectedManagingAddonIds = res.data.service.addons ? res.data.service.addons.map(a => a.id) : [];
        this.newAddonForm = { name: '', price: 50, description: '' };
        await this.loadData();
        alert('Add-on created and attached successfully!');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to create add-on');
      } finally {
        this.isSubmitting = false;
      }
    },
    async saveManagingAddons() {
      this.isSubmitting = true;
      try {
        await axios.post(`/api/super-admin/services/${this.managingService.id}/addons`, {
          addon_ids: this.selectedManagingAddonIds
        });
        await this.loadData();
        this.closeModal();
        alert('Add-on services updated successfully for this service!');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to update add-ons');
      } finally {
        this.isSubmitting = false;
      }
    },

    closeModal() {
      this.showServiceModal = false;
      this.showCategoryModal = false;
      this.showManageAddonsModal = false;
      this.editingService = null;
      this.editingCategory = null;
      this.managingService = null;
      this.selectedManagingAddonIds = [];
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
