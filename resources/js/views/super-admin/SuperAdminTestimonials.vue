<template>
  <div>
    <div class="dash-header-compact">
      <div>
        <h1>Testimonials Management</h1>
        <p class="text-muted">Manage the Customer Testimonials displayed on the homepage.</p>
      </div>
    </div>

    <div class="glass-card" style="margin-bottom: 2rem;">
      <h4 style="margin-bottom:1rem">Add New Testimonial</h4>
      <form @submit.prevent="addTestimonial" class="flex gap-2 items-center flex-wrap">
        <input type="text" v-model="newTestimonial.name" class="form-input" style="flex:1; min-width: 200px;" placeholder="Customer Name" required />
        <input type="text" v-model="newTestimonial.role" class="form-input" style="flex:1; min-width: 200px;" placeholder="Role/Vehicle (e.g. SUV Owner, Mumbai)" required />
        <textarea v-model="newTestimonial.text" class="form-input" style="flex:2; min-width: 300px; height: 42px; resize: none;" placeholder="Testimonial text..." required></textarea>
        <button type="submit" class="btn btn-primary" :disabled="adding">
          {{ adding ? 'Adding...' : 'Add Testimonial' }}
        </button>
      </form>
    </div>

    <div class="glass-card">
      <h4 style="margin-bottom:1rem">Existing Testimonials</h4>
      <div v-if="loading" class="text-center text-muted py-4">Loading testimonials...</div>
      <div v-else-if="testimonials.length === 0" class="text-center text-muted py-4">No testimonials found.</div>
      <div v-else class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
        <div v-for="testimonial in testimonials" :key="testimonial.id" class="card" style="padding: 1.5rem; position: relative;">
          <div style="font-weight:700;font-size:1.1rem;margin-bottom:0.25rem;color:var(--text-secondary);">
             {{ testimonial.name }}
          </div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem;">
             {{ testimonial.role }}
          </div>
          <p style="font-style:italic;color:var(--text-secondary);margin-bottom:1rem;font-size:0.95rem;">
            "{{ testimonial.text }}"
          </p>
          
          <div class="flex justify-between items-center" style="gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
            <div class="flex items-center gap-2">
              <label class="toggle-switch">
                <input type="checkbox" v-model="testimonial.is_active" @change="updateTestimonial(testimonial)" />
                <span class="toggle-slider"></span>
              </label>
              <span class="text-muted" style="font-size:0.75rem;">{{ testimonial.is_active ? 'Active' : 'Hidden' }}</span>
            </div>
            <button @click="deleteTestimonial(testimonial.id)" class="btn btn-danger btn-sm" style="padding: 0.35rem 0.5rem;" title="Delete Testimonial">
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
  name: 'SuperAdminTestimonials',
  data() {
    return {
      testimonials: [],
      loading: true,
      adding: false,
      newTestimonial: {
        name: '',
        role: '',
        text: ''
      }
    };
  },
  methods: {
    async fetchTestimonials() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/super-admin/testimonials');
        this.testimonials = data;
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
      } finally {
        this.loading = false;
      }
    },
    async addTestimonial() {
      if (!this.newTestimonial.name || !this.newTestimonial.role || !this.newTestimonial.text) return;
      this.adding = true;
      try {
        await axios.post('/api/super-admin/testimonials', {
          name: this.newTestimonial.name,
          role: this.newTestimonial.role,
          text: this.newTestimonial.text,
          is_active: true
        });
        
        this.newTestimonial.name = '';
        this.newTestimonial.role = '';
        this.newTestimonial.text = '';
        await this.fetchTestimonials();
      } catch (error) {
        console.error('Failed to add testimonial:', error);
        alert(error.response?.data?.message || 'Failed to add testimonial');
      } finally {
        this.adding = false;
      }
    },
    async updateTestimonial(testimonial) {
      try {
        await axios.put(`/api/super-admin/testimonials/${testimonial.id}`, {
          is_active: testimonial.is_active
        });
      } catch (error) {
        console.error('Failed to update testimonial:', error);
        alert('Failed to update testimonial status');
        this.fetchTestimonials();
      }
    },
    async deleteTestimonial(id) {
      if (!confirm('Are you sure you want to delete this testimonial?')) return;
      try {
        await axios.delete(`/api/super-admin/testimonials/${id}`);
        this.testimonials = this.testimonials.filter(t => t.id !== id);
      } catch (error) {
        console.error('Failed to delete testimonial:', error);
        alert('Failed to delete testimonial');
      }
    }
  },
  mounted() {
    this.fetchTestimonials();
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
