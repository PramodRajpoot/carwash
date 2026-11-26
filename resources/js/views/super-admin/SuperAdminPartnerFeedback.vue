<template>
  <div>
    <div class="dash-header-compact">
      <div>
        <h1>Happy Customers Management</h1>
        <p class="text-muted">Manage the customer stories displayed in the “Our Happy Customers” homepage section.</p>
      </div>
    </div>

    <!-- Add New Feedback -->
    <div class="glass-card" style="margin-bottom: 2rem;">
      <h4 style="margin-bottom:1rem">Add Happy Customer</h4>
      <form @submit.prevent="addFeedback">
        <div class="flex gap-2 items-start flex-wrap">
          <div style="flex:1; min-width: 200px;">
            <label class="text-muted text-sm block mb-1">City *</label>
            <input type="text" v-model="newFeedback.city" class="form-input mb-2" placeholder="City (e.g. Delhi)" required />
            <label class="text-muted text-sm block mb-1">Quote *</label>
            <textarea v-model="newFeedback.quote" class="form-input" style="height: 60px; resize: none;" placeholder="Feedback Quote..." required></textarea>
          </div>
          <div style="flex:1; min-width: 200px;">
            <label class="text-muted text-sm block mb-1">Thumbnail Image (Optional)</label>
            <input type="file" ref="thumbnailInput" @change="handleThumbnailChange" accept="image/*" class="form-input mb-2" />
            <label class="text-muted text-sm block mb-1">Video (Optional, Max 50MB)</label>
            <input type="file" ref="videoInput" @change="handleVideoChange" accept="video/mp4,video/webm,video/ogg" class="form-input" />
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
          <button type="submit" class="btn btn-primary" :disabled="adding">
            {{ adding ? 'Adding...' : '+ Add Customer' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Existing Feedback -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">Happy Customer Entries</h4>
      <div v-if="loading" class="text-center text-muted py-4">Loading customer entries...</div>
      <div v-else-if="feedbacks.length === 0" class="text-center text-muted py-4">No happy customers found.</div>
      <div v-else style="overflow-x:auto;">
        <table class="feedback-table">
          <thead>
            <tr>
              <th>Media</th>
              <th>City</th>
              <th>Customer Quote</th>
              <th>Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="feedback in feedbacks" :key="feedback.id">
              <td>
                <div class="feedback-media">
                  <video v-if="feedback.video_path" controls :poster="feedback.thumbnail_path">
                    <source :src="feedback.video_path">
                  </video>
                  <img v-else-if="feedback.thumbnail_path" :src="feedback.thumbnail_path" />
                  <span v-else class="text-muted text-sm">No media</span>
                </div>
              </td>
              <td>
                <template v-if="editingId !== feedback.id">
                  <strong>{{ feedback.city }}</strong>
                </template>
                <input v-else type="text" v-model="editForm.city" class="form-input" />
              </td>
              <td>
                <template v-if="editingId !== feedback.id">
                  <span class="feedback-quote">"{{ feedback.quote }}"</span>
                </template>
                <div v-else>
                  <textarea v-model="editForm.quote" class="form-input" style="height:70px;resize:vertical;"></textarea>
                  <div class="edit-media-inputs">
                    <input type="file" @change="handleEditThumbnail" accept="image/*" class="form-input" />
                    <input type="file" @change="handleEditVideo" accept="video/mp4,video/webm,video/ogg" class="form-input" />
                  </div>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="feedback.is_active" @change="toggleActive(feedback)" />
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="text-muted text-sm">{{ feedback.is_active ? 'Active' : 'Hidden' }}</span>
                </div>
              </td>
              <td>
                <div class="flex gap-2 justify-end">
                  <template v-if="editingId !== feedback.id">
                    <button @click="startEdit(feedback)" class="btn btn-outline btn-sm">✏️ Edit</button>
                  </template>
                  <template v-else>
                    <button @click="saveEdit(feedback.id)" class="btn btn-primary btn-sm" :disabled="saving">
                      {{ saving ? 'Saving...' : 'Save' }}
                    </button>
                    <button @click="cancelEdit" class="btn btn-outline btn-sm">Cancel</button>
                  </template>
                  <button @click="deleteFeedback(feedback.id)" class="btn btn-danger btn-sm">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SuperAdminPartnerFeedback',
  data() {
    return {
      feedbacks: [],
      loading: true,
      adding: false,
      saving: false,
      editingId: null,
      newFeedback: {
        city: '',
        quote: '',
        thumbnail: null,
        video: null
      },
      editForm: {
        city: '',
        quote: '',
        thumbnail: null,
        video: null
      }
    };
  },
  methods: {
    async fetchFeedbacks() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/super-admin/partner-feedback');
        this.feedbacks = data;
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
      } finally {
        this.loading = false;
      }
    },

    // ── Create ──
    handleThumbnailChange(e) {
      const file = e.target.files.length ? e.target.files[0] : null;
      if (file && file.size > 2 * 1024 * 1024) {
        alert('Thumbnail size must be less than 2MB');
        e.target.value = '';
        this.newFeedback.thumbnail = null;
        return;
      }
      this.newFeedback.thumbnail = file;
    },
    handleVideoChange(e) {
      const file = e.target.files.length ? e.target.files[0] : null;
      if (file && file.size > 50 * 1024 * 1024) {
        alert('Video size must be less than 50MB');
        e.target.value = '';
        this.newFeedback.video = null;
        return;
      }
      this.newFeedback.video = file;
    },
    async addFeedback() {
      if (!this.newFeedback.city || !this.newFeedback.quote) return;
      this.adding = true;
      try {
        const formData = new FormData();
        formData.append('city', this.newFeedback.city);
        formData.append('quote', this.newFeedback.quote);
        formData.append('is_active', '1');
        if (this.newFeedback.thumbnail) formData.append('thumbnail', this.newFeedback.thumbnail);
        if (this.newFeedback.video) formData.append('video', this.newFeedback.video);

        await axios.post('/api/super-admin/partner-feedback', formData);

        this.newFeedback = { city: '', quote: '', thumbnail: null, video: null };
        if (this.$refs.thumbnailInput) this.$refs.thumbnailInput.value = '';
        if (this.$refs.videoInput) this.$refs.videoInput.value = '';
        await this.fetchFeedbacks();
      } catch (error) {
        console.error('Failed to add feedback:', error);
        const msg = error.response?.data?.message || error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : 'Failed to add feedback';
        alert(msg);
      } finally {
        this.adding = false;
      }
    },

    // ── Toggle Active ──
    async toggleActive(feedback) {
      try {
        await axios.put(`/api/super-admin/partner-feedback/${feedback.id}`, {
          is_active: feedback.is_active
        });
      } catch (error) {
        console.error('Failed to toggle status:', error);
        alert('Failed to update feedback status');
        this.fetchFeedbacks();
      }
    },

    // ── Edit / Update ──
    startEdit(feedback) {
      this.editingId = feedback.id;
      this.editForm = {
        city: feedback.city,
        quote: feedback.quote,
        thumbnail: null,
        video: null
      };
    },
    cancelEdit() {
      this.editingId = null;
      this.editForm = { city: '', quote: '', thumbnail: null, video: null };
    },
    handleEditThumbnail(e) {
      const file = e.target.files.length ? e.target.files[0] : null;
      if (file && file.size > 2 * 1024 * 1024) {
        alert('Thumbnail size must be less than 2MB');
        e.target.value = '';
        this.editForm.thumbnail = null;
        return;
      }
      this.editForm.thumbnail = file;
    },
    handleEditVideo(e) {
      const file = e.target.files.length ? e.target.files[0] : null;
      if (file && file.size > 50 * 1024 * 1024) {
        alert('Video size must be less than 50MB');
        e.target.value = '';
        this.editForm.video = null;
        return;
      }
      this.editForm.video = file;
    },
    async saveEdit(id) {
      this.saving = true;
      try {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('city', this.editForm.city);
        formData.append('quote', this.editForm.quote);
        if (this.editForm.thumbnail) formData.append('thumbnail', this.editForm.thumbnail);
        if (this.editForm.video) formData.append('video', this.editForm.video);

        await axios.post(`/api/super-admin/partner-feedback/${id}`, formData);

        this.cancelEdit();
        await this.fetchFeedbacks();
      } catch (error) {
        console.error('Failed to update feedback:', error);
        alert(error.response?.data?.message || 'Failed to update feedback');
      } finally {
        this.saving = false;
      }
    },

    // ── Delete ──
    async deleteFeedback(id) {
      if (!confirm('Are you sure you want to delete this feedback?')) return;
      try {
        await axios.delete(`/api/super-admin/partner-feedback/${id}`);
        this.feedbacks = this.feedbacks.filter(f => f.id !== id);
        if (this.editingId === id) this.cancelEdit();
      } catch (error) {
        console.error('Failed to delete feedback:', error);
        alert('Failed to delete feedback');
      }
    }
  },
  mounted() {
    this.fetchFeedbacks();
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
.feedback-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
.feedback-table th, .feedback-table td {
  padding: 0.75rem;
  text-align: left;
  border: 1px solid var(--border-color);
}
.feedback-table th {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}
.feedback-media {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.feedback-media video, .feedback-media img {
  max-width: 100px;
  border-radius: var(--radius-sm);
}
.feedback-quote {
  font-style: italic;
  color: var(--text-secondary);
}
.edit-media-inputs {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .feedback-table th, .feedback-table td {
    padding: 0.5rem;
    font-size: 14px;
  }
  .feedback-media video, .feedback-media img {
    max-width: 80px;
  }
}
</style>
