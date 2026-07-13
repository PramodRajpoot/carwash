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
      <div class="glass-card p-4" style="background: var(--bg-primary);">
        <h3 class="mb-4" style="color: var(--accent-cyan); font-weight: 600; font-size: 1.25rem;">
          <span style="font-size: 1.5rem; margin-right: 8px;">✏️</span> Editor
        </h3>
        
        <form @submit.prevent="updateAboutUs">
          <div class="mb-3">
            <label class="form-label font-bold text-sm">Title (HTML allowed)</label>
            <input v-model="form.title" type="text" class="form-input" required />
            <p class="text-muted text-xs mt-1">Example: About &lt;span class="text-gradient"&gt;CleanAtDoorstep&lt;/span&gt;</p>
          </div>

          <div class="mb-3">
            <label class="form-label font-bold text-sm">Description</label>
            <textarea v-model="form.description" class="form-input" rows="4" required style="resize: vertical;"></textarea>
          </div>

          <div class="mb-3">
            <label class="form-label font-bold text-sm">Image URL</label>
            <input v-model="form.image_url" type="url" class="form-input" required />
            <div v-if="form.image_url" class="mt-2" style="border-radius: var(--radius-md); overflow: hidden; height: 120px; border: 1px solid var(--border-color);">
              <img :src="form.image_url" style="width: 100%; height: 100%; object-fit: cover;" @error="form.image_url = ''" />
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label font-bold text-sm flex justify-between items-center mb-2">
              Key Points
              <button type="button" @click="addPoint" class="btn btn-outline btn-sm" style="padding: 0.25rem 0.75rem;">+ Add Point</button>
            </label>
            <div class="points-container">
              <div v-for="(point, index) in form.points" :key="index" class="point-row mb-2">
                <span class="point-drag-handle">≡</span>
                <input v-model="form.points[index]" type="text" class="form-input flex-1" required />
                <button type="button" @click="removePoint(index)" class="btn btn-danger btn-sm p-2" title="Remove" style="aspect-ratio: 1; border-radius: var(--radius-sm);">
                  🗑
                </button>
              </div>
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
      <div class="glass-card p-0" style="background: var(--bg-secondary); overflow: hidden; display: flex; flex-direction: column;">
        <div class="p-4" style="background: var(--bg-primary); border-bottom: 1px solid var(--border-color);">
          <h3 style="color: var(--text-primary); font-weight: 600; font-size: 1.25rem;">
            <span style="font-size: 1.5rem; margin-right: 8px;">👀</span> Live Preview
          </h3>
        </div>
        
        <div class="p-4 flex-1" style="display: flex; flex-direction: column; justify-content: center;">
          <!-- Preview Box mirroring the website's look -->
          <div class="preview-box">
            <div class="preview-img-wrapper fade-in-up">
               <img v-if="form.image_url" :src="form.image_url" alt="About Preview" class="preview-img">
               <div v-else class="preview-placeholder">Image Preview</div>
            </div>
            
            <div class="preview-content fade-in-up delay-1">
              <div class="preview-title" v-html="form.title || 'About <span>Us</span>'"></div>
              <p class="preview-desc">{{ form.description || 'Your description will appear here...' }}</p>
              
              <ul class="preview-points">
                <li v-for="(point, idx) in form.points" :key="idx" class="preview-point">
                  {{ point }}
                </li>
              </ul>
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
        image_url: '',
        points: []
      }
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const response = await axios.get('/api/cms/about-us');
        this.form = response.data;
      } catch (err) {
        this.error = 'Failed to load data.';
      } finally {
        this.loading = false;
      }
    },
    addPoint() {
      this.form.points.push('✅ New point');
    },
    removePoint(index) {
      this.form.points.splice(index, 1);
    },
    async updateAboutUs() {
      this.saving = true;
      this.message = '';
      this.error = '';
      try {
        const response = await axios.put('/api/super-admin/cms/about-us', this.form);
        this.message = response.data.message;
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
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-secondary);
  padding: 0.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}
.point-row:hover {
  border-color: var(--accent-cyan);
}
.point-drag-handle {
  color: var(--text-muted);
  cursor: grab;
  padding: 0 0.25rem;
  font-size: 1.25rem;
  line-height: 1;
}
.point-drag-handle:active {
  cursor: grabbing;
}

/* ── Preview Styles ── */
.preview-box {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}
@media (min-width: 1200px) {
  .preview-box {
    flex-direction: row;
    align-items: center;
  }
}
.preview-img-wrapper {
  flex: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}
.preview-img {
  width: 100%;
  height: auto;
  display: block;
}
.preview-placeholder {
  width: 100%;
  aspect-ratio: 4/3;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-weight: 600;
}
.preview-content {
  flex: 1;
}
.preview-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
/* This targets the text-gradient span if used in the title */
.preview-title :deep(.text-gradient) {
  background: linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-emerald) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.preview-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.25rem;
}
.preview-points {
  list-style: none;
  padding: 0;
  margin: 0;
  color: var(--text-secondary);
}
.preview-point {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
</style>
