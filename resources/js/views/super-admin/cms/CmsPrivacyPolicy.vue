<template>
  <div class="dash-content-body">
    <div class="dash-header-bar mb-3">
      <h2>CMS: Privacy Policy</h2>
      <p class="text-muted text-sm mt-1">Manage the content for the "Privacy Policy" page on the public website.</p>
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
        
        <form @submit.prevent="updatePrivacyPolicy">
          <div class="mb-3">
            <label class="form-label font-bold text-sm">Content (HTML allowed)</label>
            <textarea v-model="form.content" class="form-input" rows="18" required style="resize: vertical; font-family: monospace; font-size: 0.9rem; line-height: 1.5;"></textarea>
            <p class="text-muted text-xs mt-2">You can use standard HTML tags like &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, and &lt;ul&gt; to format the content.</p>
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
        
        <div class="p-5 flex-1" style="overflow-y: auto; max-height: 700px;">
          <!-- Preview Box mirroring the website's look -->
          <div class="preview-box">
             <div class="preview-content" v-html="form.content || '<p>Your content will appear here...</p>'"></div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CmsPrivacyPolicy',
  data() {
    return {
      loading: true,
      saving: false,
      message: '',
      error: '',
      form: {
        content: ''
      }
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const response = await axios.get('/api/cms/privacy-policy');
        this.form = response.data;
      } catch (err) {
        this.error = 'Failed to load data.';
      } finally {
        this.loading = false;
      }
    },
    async updatePrivacyPolicy() {
      this.saving = true;
      this.message = '';
      this.error = '';
      try {
        const response = await axios.put('/api/super-admin/cms/privacy-policy', this.form);
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

/* ── Preview Styles ── */
.preview-box {
  background: var(--bg-primary);
  padding: 2.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  color: var(--text-secondary);
  line-height: 1.7;
}

.preview-content :deep(h2) {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.preview-content :deep(h3) {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.preview-content :deep(p) {
  margin-bottom: 1.25rem;
}

.preview-content :deep(ul) {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
  list-style: disc;
}

.preview-content :deep(li) {
  margin-bottom: 0.5rem;
}
</style>
