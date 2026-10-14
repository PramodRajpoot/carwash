<template>
  <div>
    <div style="margin-bottom: 1.5rem;">
      <h3>Our Washer Team</h3>
      <p class="text-muted" style="font-size: 0.85rem;">View cleaning technicians assigned to your center by Admin and track their active tasks.</p>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading washer team...
    </div>

    <div v-else>
      <div v-if="washers.length" class="grid grid-3 gap-3" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem;">
        <div v-for="w in washers" :key="w.id" class="glass-card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
              <span class="badge" :class="w.status === 'active' ? 'badge-emerald' : 'badge-rose'">
                {{ w.status.toUpperCase() }}
              </span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">#WSH-{{ w.id }}</span>
            </div>

            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
              <div class="avatar" style="width: 44px; height: 44px; font-size: 1.1rem; background: var(--accent-cyan); color: #000; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                {{ w.user?.name ? w.user.name.charAt(0).toUpperCase() : 'W' }}
              </div>
              <div>
                <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-primary);">{{ w.user?.name }}</h4>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Cleaning Specialist</div>
              </div>
            </div>

            <div style="font-size: 0.85rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
              <div>📞 <strong>Phone:</strong> {{ w.user?.phone || 'No phone' }}</div>
              <div>✉️ <strong>Email:</strong> {{ w.user?.email }}</div>
              <div v-if="w.notes" style="margin-top: 0.25rem; font-size: 0.8rem; color: var(--text-muted); font-style: italic;">
                📝 {{ w.notes }}
              </div>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 0.75rem; border: 1px solid var(--border-color); display: flex; justify-content: space-around; text-align: center;">
            <div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-cyan);">{{ w.active_tasks || 0 }}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">In Progress</div>
            </div>
            <div style="border-left: 1px solid var(--border-color);"></div>
            <div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-emerald);">{{ w.completed_tasks || 0 }}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Completed</div>
            </div>
            <div style="border-left: 1px solid var(--border-color);"></div>
            <div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">{{ w.total_tasks || 0 }}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Total</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🧼</div>
        <p>No washers currently assigned to your franchise center.</p>
        <p class="text-muted" style="font-size: 0.85rem;">Platform administrators can assign washers to your service center.</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'FranchiseeWashers',
  data() {
    return {
      washers: [],
      loading: true,
    };
  },
  methods: {
    async loadWashers() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/franchisee/washers');
        this.washers = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    }
  },
  mounted() {
    this.loadWashers();
  }
};
</script>
