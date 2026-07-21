<template>
  <div class="dash-content-body">
    <div class="dash-header-bar mb-3">
      <h2>CMS: About Us</h2>
      <p class="text-muted text-sm mt-1">Manage the content for the "About Us" section on the home page.</p>
    </div>

    <div v-if="loading" class="glass-card flex items-center justify-center p-5">
      <div class="spinner"></div>
      <span class="ml-2">Loading content...</span>
    </div>

    <div v-else class="grid grid-2 gap-4">
      
      <!-- Edit Form Column -->
      <div class="glass-card p-4" style="background: var(--bg-primary); max-height: 80vh; overflow-y: auto;">
        <h3 class="mb-4" style="color: var(--accent-cyan); font-weight: 600; font-size: 1.25rem;">
          <span style="font-size: 1.5rem; margin-right: 8px;">✏️</span> Editor
        </h3>
        
        <form @submit.prevent="updateAboutUs">
          <div class="mb-3">
            <label class="form-label font-bold text-sm">Title</label>
            <input v-model="form.title" type="text" class="form-input" required />
          </div>

          <div class="mb-3">
            <label class="form-label font-bold text-sm">Description</label>
            <textarea v-model="form.description" class="form-input" rows="4" required style="resize: vertical;"></textarea>
          </div>

          <div class="mb-4">
            <label class="form-label font-bold text-sm">Collage Images (3 Required)</label>
            <div class="grid grid-3 gap-2 mt-2">
              <div v-for="index in 3" :key="`img-${index}`">
                <input type="file" @change="handleFileUpload($event, index-1)" class="form-input text-xs mb-2" accept="image/*" />
                <div style="border-radius: var(--radius-sm); overflow: hidden; height: 80px; border: 1px solid var(--border-color); background: var(--bg-secondary);">
                  <img v-if="getImagePreview(index-1)" :src="getImagePreview(index-1)" style="width: 100%; height: 100%; object-fit: cover;" @error="handleImageError(index-1)" />
                </div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label font-bold text-sm flex justify-between items-center mb-2">
              Features Grid (2x2)
              <button type="button" @click="addFeature" class="btn btn-outline btn-sm" style="padding: 0.25rem 0.75rem;" :disabled="form.features.length >= 4">+ Add Feature</button>
            </label>
            <div class="points-container">
              <div v-for="(feature, index) in form.features" :key="`feat-${index}`" class="point-row mb-3 p-3" style="flex-direction: column; align-items: stretch; gap: 0.75rem;">
                <div class="flex justify-between items-center w-full">
                  <span class="text-sm font-bold text-secondary">Feature {{ index + 1 }}</span>
                  <button type="button" @click="removeFeature(index)" class="btn btn-danger btn-sm p-1" title="Remove" style="border-radius: var(--radius-sm);">
                    🗑 Remove
                  </button>
                </div>
                <div class="grid grid-2 gap-2 w-full">
                  <input v-model="feature.title" type="text" class="form-input text-sm" placeholder="Title (e.g. Doorstep Service)" required />
                  <select v-model="feature.icon" class="form-input text-sm" required>
                    <option value="truck">🚚 Truck (Doorstep)</option>
                    <option value="shield">🛡️ Shield (Trained)</option>
                    <option value="users">👥 Users (Network)</option>
                    <option value="sparkles">✨ Sparkles (Quality)</option>
                    <option value="star">⭐ Star (Premium)</option>
                    <option value="clock">⏱️ Clock (Fast)</option>
                  </select>
                </div>
                <input v-model="feature.description" type="text" class="form-input text-sm w-full" placeholder="Short description" required />
              </div>
              <p v-if="form.features.length === 0" class="text-muted text-sm text-center py-2">No features added. Best viewed with 4 features.</p>
            </div>
          </div>

          <div v-if="message" class="alert alert-success mb-3 fade-in">
            ✅ {{ message }}
          </div>
          <div v-if="error" class="alert alert-danger mb-3 fade-in">
            ⚠️ {{ error }}
          </div>

          <button type="submit" class="btn btn-primary w-full pulse-glow" :disabled="saving" style="font-size: 1.05rem; padding: 0.85rem;">
            {{ saving ? 'Saving Changes...' : '💾 Save Changes' }}
          </button>
        </form>
      </div>

      <!-- Live Preview Column -->
      <div class="glass-card p-0" style="background: #ffffff; overflow-y: auto; max-height: 80vh;">
        <div class="p-3 sticky top-0" style="background: var(--bg-primary); border-bottom: 1px solid var(--border-color); z-index: 10;">
          <h3 style="color: var(--text-primary); font-weight: 600; font-size: 1.1rem;">
            <span style="font-size: 1.2rem; margin-right: 8px;">👀</span> Live Preview
          </h3>
        </div>
        
        <div class="p-5">
          <!-- Preview Box mirroring the website's new look -->
          <div class="about-grid">
            
            <!-- Content Left -->
            <div class="about-content">
              <span class="about-label">ABOUT US</span>
              <h2 class="about-title" v-html="form.title || 'India\'s Trusted Doorstep Car Care Network'"></h2>
              <p class="about-desc">{{ form.description || "Cleanatdoorstep brings professional car wash and detailing services right to your doorstep." }}</p>
              
              <div class="features-grid">
                <div v-for="(feature, idx) in form.features" :key="'p-feat-'+idx" class="feature-item">
                  <div class="feature-icon">
                    <span v-if="feature.icon === 'truck'">🚚</span>
                    <span v-else-if="feature.icon === 'shield'">🛡️</span>
                    <span v-else-if="feature.icon === 'users'">👥</span>
                    <span v-else-if="feature.icon === 'sparkles'">✨</span>
                    <span v-else-if="feature.icon === 'star'">⭐</span>
                    <span v-else-if="feature.icon === 'clock'">⏱️</span>
                    <span v-else>📌</span>
                  </div>
                  <div class="feature-text">
                    <h4>{{ feature.title || 'Feature Title' }}</h4>
                    <p>{{ feature.description || 'Feature description goes here.' }}</p>
                  </div>
                </div>
              </div>
              
              <button class="btn btn-primary mt-4" style="border-radius: 50px; background: #002e5b;">Know More &rarr;</button>
            </div>

            <!-- Image Collage Right -->
            <div class="about-images">
              <div class="img-tall">
                <img :src="getImagePreview(0) || 'https://via.placeholder.com/300x500'" alt="About 1" />
              </div>
              <div class="img-stack">
                <div class="img-square">
                  <img :src="getImagePreview(1) || 'https://via.placeholder.com/300x300'" alt="About 2" />
                </div>
                <div class="img-landscape">
                  <img :src="getImagePreview(2) || 'https://via.placeholder.com/400x250'" alt="About 3" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CmsAboutUs',
  data() {
    return {
      loading: true,
      saving: false,
      message: '',
      error: '',
      form: {
        title: '',
        description: '',
        images: ['', '', ''],
        features: []
      },
      imageFiles: [null, null, null],
      imagePreviews: [null, null, null]
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const response = await axios.get('/api/cms/about-us');
        // Handle migration from old format to new format
        const data = response.data;
        if (data.image_url && !data.images) {
           data.images = [data.image_url, '', ''];
        }
        if (data.points && !data.features) {
           data.features = data.points.map((p, i) => ({
             icon: 'sparkles',
             title: `Feature ${i+1}`,
             description: p.replace('✅ ', '')
           }));
        }
        
        this.form = {
          title: data.title || '',
          description: data.description || '',
          images: data.images || ['', '', ''],
          features: data.features || []
        };
      } catch (err) {
        this.error = 'Failed to load data.';
      } finally {
        this.loading = false;
      }
    },
    handleFileUpload(event, index) {
      const file = event.target.files[0];
      if (file) {
        this.imageFiles[index] = file;
        this.imagePreviews[index] = URL.createObjectURL(file);
      }
    },
    getImagePreview(index) {
      return this.imagePreviews[index] || this.form.images[index];
    },
    handleImageError(index) {
      this.form.images[index] = '';
    },
    addFeature() {
      if (this.form.features.length < 4) {
        this.form.features.push({
          icon: 'truck',
          title: '',
          description: ''
        });
      }
    },
    removeFeature(index) {
      this.form.features.splice(index, 1);
    },
    async updateAboutUs() {
      this.saving = true;
      this.message = '';
      this.error = '';
      try {
        const formData = new FormData();
        formData.append('title', this.form.title);
        formData.append('description', this.form.description);
        formData.append('features', JSON.stringify(this.form.features));
        formData.append('_method', 'PUT');

        for (let i = 0; i < 3; i++) {
          if (this.imageFiles[i]) {
            formData.append(`image_${i}`, this.imageFiles[i]);
          } else if (this.form.images[i]) {
            formData.append(`image_${i}`, this.form.images[i]);
          }
        }

        const response = await axios.post('/api/super-admin/cms/about-us', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        this.message = response.data.message;
        
        // Refresh to get the saved URLs
        await this.fetchData();
        
        setTimeout(() => { this.message = ''; }, 3000);
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update changes.';
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped>
.dash-header-bar {
  margin-bottom: 1.5rem;
}
.dash-header-bar h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(6, 182, 212, 0.2);
  border-top-color: var(--accent-cyan);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.point-row {
  display: flex;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}
.point-row:hover {
  border-color: var(--accent-cyan);
}

/* ── Preview Styles (Light Theme for accuracy) ── */
.about-grid {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  color: #1a1a1a;
}
@media (min-width: 900px) {
  .about-grid {
    flex-direction: row;
    align-items: center;
  }
}
.about-content {
  flex: 1;
}
.about-label {
  color: #e67e22;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 0.5rem;
}
.about-title {
  font-size: 2rem;
  font-weight: 800;
  color: #001f3f;
  line-height: 1.2;
  margin-bottom: 1rem;
}
.about-desc {
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
  margin-bottom: 2rem;
}
.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.feature-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.feature-icon {
  background: #f0f7ff;
  color: #0056b3;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.feature-text h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #001f3f;
  margin-bottom: 0.25rem;
}
.feature-text p {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
  line-height: 1.4;
}
.about-images {
  flex: 1;
  display: flex;
  gap: 1rem;
  height: 400px;
}
.img-tall {
  flex: 1;
  border-radius: 20px;
  overflow: hidden;
}
.img-stack {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.img-square, .img-landscape {
  flex: 1;
  border-radius: 20px;
  overflow: hidden;
}
.about-images img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
