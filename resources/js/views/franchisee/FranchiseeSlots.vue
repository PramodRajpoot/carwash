<template>
  <div>
    <!-- Summary Stats -->
    <div class="grid grid-3 gap-3" style="margin-bottom:1.5rem">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">✅</div>
        <div class="stat-value">{{ activeCount }}</div>
        <div class="stat-label">Active Slots</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">⛔</div>
        <div class="stat-value">{{ inactiveCount }}</div>
        <div class="stat-label">Inactive Slots</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-violet)">📅</div>
        <div class="stat-value">{{ totalSlots }}</div>
        <div class="stat-label">Total Upcoming Slots</div>
      </div>
    </div>

    <!-- Slots Management Table -->
    <div class="glass-card">
      <div class="flex items-center justify-between" style="margin-bottom:1rem; flex-wrap: wrap; gap: 0.75rem;">
        <h4 style="margin:0">🗓️ Manage Your Slots</h4>
        <div class="flex gap-2" style="flex-wrap: wrap;">
          <button class="btn btn-sm" :class="filter === 'all' ? 'btn-primary' : 'btn-ghost'" @click="filter = 'all'">All</button>
          <button class="btn btn-sm" :class="filter === 'active' ? 'btn-primary' : 'btn-ghost'" @click="filter = 'active'">Active</button>
          <button class="btn btn-sm" :class="filter === 'inactive' ? 'btn-primary' : 'btn-ghost'" @click="filter = 'inactive'">Inactive</button>
        </div>
      </div>

      <div v-if="loading" class="text-muted" style="text-align:center; padding: 3rem;">
        Loading slots...
      </div>

      <div v-else-if="filteredGroupedSlots && Object.keys(filteredGroupedSlots).length > 0">
        <div v-for="(slots, date) in filteredGroupedSlots" :key="date" class="slot-date-group">
          <div class="slot-date-header">
            <span class="slot-date-badge">{{ formatDate(date) }}</span>
            <span class="text-muted" style="font-size:0.8rem">{{ slots.length }} slot{{ slots.length > 1 ? 's' : '' }}</span>
          </div>
          <div class="slot-grid">
            <div
              v-for="slot in slots"
              :key="slot.id"
              class="slot-card"
              :class="{ 'slot-inactive': !slot.is_active }"
            >
              <div class="slot-card-top">
                <div class="slot-time-badge">
                  🕐 {{ slot.time_range }}
                </div>
                <label class="toggle-switch" :title="slot.is_active ? 'Click to deactivate' : 'Click to activate'">
                  <input
                    type="checkbox"
                    :checked="!!slot.is_active"
                    @change="toggleSlot(slot)"
                    :disabled="slot.toggling"
                  >
                  <span class="slider round"></span>
                </label>
              </div>
              <div class="slot-card-body">
                <div class="slot-meta">
                  <span>Max Bookings: <strong>{{ slot.max_bookings }}</strong></span>
                  <span>Current: <strong>{{ slot.current_bookings }}</strong></span>
                </div>
                <div class="slot-status-row">
                  <span class="badge" :class="slot.is_active ? 'badge-emerald' : 'badge-red'">
                    {{ slot.is_active ? 'Active' : 'Inactive' }}
                  </span>
                  <span v-if="slot.toggling" class="text-muted" style="font-size:0.75rem">Updating...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div style="font-size:3rem; margin-bottom:0.75rem;">📭</div>
        <div style="font-weight:600; font-size:1.1rem; margin-bottom:0.25rem;">No Slots Found</div>
        <div class="text-muted" style="font-size:0.85rem">
          {{ filter !== 'all' ? 'No ' + filter + ' slots available. Try a different filter.' : 'No upcoming slots have been assigned by the admin yet.' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'FranchiseeSlots',
  data() {
    return {
      slots: [],
      filter: 'all',
      loading: true,
    };
  },
  computed: {
    activeCount() {
      return this.slots.filter(s => s.is_active).length;
    },
    inactiveCount() {
      return this.slots.filter(s => !s.is_active).length;
    },
    totalSlots() {
      return this.slots.length;
    },
    filteredSlots() {
      if (this.filter === 'active') return this.slots.filter(s => s.is_active);
      if (this.filter === 'inactive') return this.slots.filter(s => !s.is_active);
      return this.slots;
    },
    filteredGroupedSlots() {
      return this.filteredSlots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
      }, {});
    },
  },
  async mounted() {
    await this.loadSlots();
  },
  methods: {
    async loadSlots() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/franchisee/dashboard');
        this.slots = (data.upcoming_slots || []).map(s => ({ ...s, toggling: false }));
      } catch (e) {
        console.error('Failed to load slots', e);
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
      });
    },
    async toggleSlot(slot) {
      slot.toggling = true;
      const previousState = slot.is_active;
      try {
        const response = await axios.put(`/api/franchisee/slots/${slot.id}/toggle`);
        if (response.data.status === 'success') {
          slot.is_active = response.data.slot.is_active;
        }
      } catch (e) {
        console.error('Failed to toggle slot', e);
        slot.is_active = previousState;
        alert('Failed to update slot status. Please try again.');
      } finally {
        slot.toggling = false;
      }
    },
  },
};
</script>

<style scoped>
.slot-date-group {
  margin-bottom: 1.5rem;
}
.slot-date-group:last-child {
  margin-bottom: 0;
}
.slot-date-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}
.slot-date-badge {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-color);
}
.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}
.slot-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.3s ease;
}
.slot-card:hover {
  border-color: var(--accent-emerald, #10b981);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.slot-card.slot-inactive {
  opacity: 0.6;
  border-color: rgba(239, 68, 68, 0.3);
}
.slot-card.slot-inactive:hover {
  border-color: #ef4444;
}
.slot-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.slot-time-badge {
  font-weight: 600;
  font-size: 0.95rem;
}
.slot-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.slot-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.slot-status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.badge-red {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: rgba(0,0,0,0.08);
  border-radius: 0.75rem;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-switch .slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #4b5563;
  transition: .35s;
  border-radius: 24px;
}
.toggle-switch .slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .35s;
  border-radius: 50%;
}
.toggle-switch input:checked + .slider {
  background-color: var(--accent-emerald, #10b981);
}
.toggle-switch input:checked + .slider:before {
  transform: translateX(20px);
}
.toggle-switch input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
