<template>
  <div>
    <div class="dash-header-compact">
      <div>
        <h1>Partner Feedback Management</h1>
        <p class="text-muted">Manage the Partners' Feedback displayed on the homepage.</p>
      </div>
    </div>

    <!-- Add New Feedback -->
    <div class="glass-card" style="margin-bottom: 2rem;">
      <h4 style="margin-bottom:1rem">Add New Feedback</h4>
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
            {{ adding ? 'Adding...' : '+ Add Feedback' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Existing Feedback -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">Existing Feedback</h4>
      <div v-if="loading" class="text-center text-muted py-4">Loading feedback...</div>
      <div v-else-if="feedbacks.length === 0" class="text-center text-muted py-4">No feedback found.</div>
      <div v-else class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
        <div v-for="feedback in feedbacks" :key="feedback.id" class="card" style="padding: 1.5rem; position: relative;">

          <!-- Media Preview -->
          <div style="height: 140px; background: var(--bg-primary); border-radius: var(--radius-sm); margin-bottom: 1rem; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <video v-if="feedback.video_path" controls :poster="feedback.thumbnail_path" style="width:100%;height:100%;object-fit:cover;">
              <source :src="feedback.video_path">
            </video>
            <template v-else>
              <img v-if="feedback.thumbnail_path" :src="feedback.thumbnail_path" style="width:100%;height:100%;object-fit:cover;" />
              <div v-else class="text-muted text-sm">No Media</div>
            </template>
          </div>

          <!-- Display Mode -->
          <template v-if="editingId !== feedback.id">
            <div style="font-weight:700;font-size:1.1rem;margin-bottom:0.25rem;color:var(--text-secondary);">
              {{ feedback.city }} Partner
            </div>
            <p style="font-style:italic;color:var(--text-secondary);margin-bottom:1rem;font-size:0.95rem;">
              "{{ feedback.quote }}"
            </p>
          </template>

          <!-- Edit Mode -->
          <template v-else>
            <label class="text-muted" style="font-size:0.75rem;">City</label>
            <input type="text" v-model="editForm.city" class="form-input mb-2" />
            <label class="text-muted" style="font-size:0.75rem;">Quote</label>
            <textarea v-model="editForm.quote" class="form-input mb-2" style="height: 50px; resize: none;"></textarea>
            <label class="text-muted" style="font-size:0.75rem;">Replace Thumbnail</label>
            <input type="file" ref="editThumbnailInput" @change="handleEditThumbnail" accept="image/*" class="form-input mb-2" style="font-size:0.8rem; padding:0.25rem;" />
            <label class="text-muted" style="font-size:0.75rem;">Replace Video</label>
            <input type="file" ref="editVideoInput" @change="handleEditVideo" accept="video/mp4,video/webm,video/ogg" class="form-input mb-2" style="font-size:0.8rem; padding:0.25rem;" />
            <div class="flex gap-2" style="margin-top: 0.5rem;">
              <button @click="saveEdit(feedback.id)" class="btn btn-primary btn-sm" :disabled="saving">
                {{ saving ? 'Saving...' : '💾 Save' }}
              </button>
              <button @click="cancelEdit" class="btn btn-outline btn-sm">Cancel</button>
            </div>
          </template>

          <!-- Actions Bar -->
          <div class="flex justify-between items-center" style="gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
            <div class="flex items-center gap-2">
              <label class="toggle-switch">
                <input type="checkbox" v-model="feedback.is_active" @change="toggleActive(feedback)" />
                <span class="toggle-slider"></span>
              </label>
              <span class="text-muted" style="font-size:0.75rem;">{{ feedback.is_active ? 'Active' : 'Hidden' }}</span>
            </div>
            <div class="flex gap-2">
              <button v-if="editingId !== feedback.id" @click="startEdit(feedback)" class="btn btn-outline btn-sm" style="padding: 0.35rem 0.5rem;">
                ✏️ Edit
              </button>
              <button @click="deleteFeedback(feedback.id)" class="btn btn-danger btn-sm" style="padding: 0.35rem 0.5rem;">
                🗑️ Delete
              </button>
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
</style>
