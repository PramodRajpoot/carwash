<template>
  <div>
    <div class="dash-header-compact">
      <div>
        <h1>FAQ Management</h1>
        <p class="text-muted">Manage the Frequently Asked Questions displayed on the homepage.</p>
      </div>
    </div>

    <!-- Add New FAQ -->
    <div class="glass-card" style="margin-bottom: 2rem;">
      <h4 style="margin-bottom:1rem">Add New FAQ</h4>
      <form @submit.prevent="addFaq">
        <div style="margin-bottom: 0.75rem;">
          <label class="text-muted text-sm block mb-1">Question *</label>
          <input type="text" v-model="newFaq.question" class="form-input" placeholder="Enter the question..." required />
        </div>
        <div style="margin-bottom: 0.75rem;">
          <label class="text-muted text-sm block mb-1">Answer *</label>
          <textarea v-model="newFaq.answer" class="form-input" style="height: 80px; resize: vertical;" placeholder="Enter the answer..." required></textarea>
        </div>
        <div class="flex gap-2 items-end" style="margin-bottom: 0.75rem;">
          <div style="width: 120px;">
            <label class="text-muted text-sm block mb-1">Sort Order</label>
            <input type="number" v-model.number="newFaq.sort_order" class="form-input" placeholder="0" />
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
          <button type="submit" class="btn btn-primary" :disabled="adding">
            {{ adding ? 'Adding...' : '+ Add FAQ' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Existing FAQs -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">Existing FAQs</h4>
      <div v-if="loading" class="text-center text-muted py-4">Loading FAQs...</div>
      <div v-else-if="faqs.length === 0" class="text-center text-muted py-4">No FAQs found.</div>
      <div v-else style="display:flex;flex-direction:column;gap:1rem;">
        <div v-for="faq in faqs" :key="faq.id" class="card" style="padding: 1.25rem; position: relative;">

          <!-- Display Mode -->
          <template v-if="editingId !== faq.id">
            <div class="flex justify-between items-start" style="gap:1rem;">
              <div style="flex:1;">
                <div style="font-weight:700;font-size:1.05rem;margin-bottom:0.35rem;color:var(--text-primary);">
                  {{ faq.question }}
                </div>
                <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;margin:0;">
                  {{ faq.answer }}
                </p>
                <div class="text-muted" style="font-size:0.75rem;margin-top:0.5rem;">
                  Sort Order: {{ faq.sort_order }}
                </div>
              </div>
            </div>
          </template>

          <!-- Edit Mode -->
          <template v-else>
            <label class="text-muted" style="font-size:0.75rem;">Question</label>
            <input type="text" v-model="editForm.question" class="form-input mb-2" />
            <label class="text-muted" style="font-size:0.75rem;">Answer</label>
            <textarea v-model="editForm.answer" class="form-input mb-2" style="height: 80px; resize: vertical;"></textarea>
            <label class="text-muted" style="font-size:0.75rem;">Sort Order</label>
            <input type="number" v-model.number="editForm.sort_order" class="form-input mb-2" style="width:120px;" />
            <div class="flex gap-2" style="margin-top: 0.5rem;">
              <button @click="saveEdit(faq.id)" class="btn btn-primary btn-sm" :disabled="saving">
                {{ saving ? 'Saving...' : '💾 Save' }}
              </button>
              <button @click="cancelEdit" class="btn btn-outline btn-sm">Cancel</button>
            </div>
          </template>

          <!-- Actions Bar -->
          <div class="flex justify-between items-center" style="gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
            <div class="flex items-center gap-2">
              <label class="toggle-switch">
                <input type="checkbox" v-model="faq.is_active" @change="toggleActive(faq)" />
                <span class="toggle-slider"></span>
              </label>
              <span class="text-muted" style="font-size:0.75rem;">{{ faq.is_active ? 'Active' : 'Hidden' }}</span>
            </div>
            <div class="flex gap-2">
              <button v-if="editingId !== faq.id" @click="startEdit(faq)" class="btn btn-outline btn-sm" style="padding: 0.35rem 0.5rem;">
                ✏️ Edit
              </button>
              <button @click="deleteFaq(faq.id)" class="btn btn-danger btn-sm" style="padding: 0.35rem 0.5rem;">
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
  name: 'SuperAdminFaqs',
  data() {
    return {
      faqs: [],
      loading: true,
      adding: false,
      saving: false,
      editingId: null,
      newFaq: {
        question: '',
        answer: '',
        sort_order: 0
      },
      editForm: {
        question: '',
        answer: '',
        sort_order: 0
      }
    };
  },
  methods: {
    async fetchFaqs() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/super-admin/faqs');
        this.faqs = data;
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
      } finally {
        this.loading = false;
      }
    },

    async addFaq() {
      if (!this.newFaq.question || !this.newFaq.answer) return;
      this.adding = true;
      try {
        await axios.post('/api/super-admin/faqs', {
          question: this.newFaq.question,
          answer: this.newFaq.answer,
          sort_order: this.newFaq.sort_order || 0,
          is_active: true
        });
        this.newFaq = { question: '', answer: '', sort_order: 0 };
        await this.fetchFaqs();
      } catch (error) {
        console.error('Failed to add FAQ:', error);
        alert(error.response?.data?.message || 'Failed to add FAQ');
      } finally {
        this.adding = false;
      }
    },

    async toggleActive(faq) {
      try {
        await axios.put(`/api/super-admin/faqs/${faq.id}`, {
          is_active: faq.is_active
        });
      } catch (error) {
        console.error('Failed to toggle status:', error);
        alert('Failed to update FAQ status');
        this.fetchFaqs();
      }
    },

    startEdit(faq) {
      this.editingId = faq.id;
      this.editForm = {
        question: faq.question,
        answer: faq.answer,
        sort_order: faq.sort_order
      };
    },
    cancelEdit() {
      this.editingId = null;
      this.editForm = { question: '', answer: '', sort_order: 0 };
    },
    async saveEdit(id) {
      this.saving = true;
      try {
        await axios.put(`/api/super-admin/faqs/${id}`, {
          question: this.editForm.question,
          answer: this.editForm.answer,
          sort_order: this.editForm.sort_order
        });
        this.cancelEdit();
        await this.fetchFaqs();
      } catch (error) {
        console.error('Failed to update FAQ:', error);
        alert(error.response?.data?.message || 'Failed to update FAQ');
      } finally {
        this.saving = false;
      }
    },

    async deleteFaq(id) {
      if (!confirm('Are you sure you want to delete this FAQ?')) return;
      try {
        await axios.delete(`/api/super-admin/faqs/${id}`);
        this.faqs = this.faqs.filter(f => f.id !== id);
        if (this.editingId === id) this.cancelEdit();
      } catch (error) {
        console.error('Failed to delete FAQ:', error);
        alert('Failed to delete FAQ');
      }
    }
  },
  mounted() {
    this.fetchFaqs();
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
