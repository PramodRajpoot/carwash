<template>
  <div>
    <!-- Welcome banner with Franchise Center info -->
    <div class="glass-card mb-4 p-4" style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.05)); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; margin-bottom: 1.5rem; padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span style="font-size: 1.5rem;">🧼</span>
            <h2 style="margin: 0; font-size: 1.4rem;">Washer Station</h2>
          </div>
          <p class="text-secondary" style="font-size: 0.9rem; margin: 0;">
            Welcome back, <strong>{{ user.name }}</strong>! Here is your cleaning schedule and performance.
          </p>
        </div>
        <div v-if="franchisee" style="text-align: right; background: rgba(0,0,0,0.2); padding: 0.75rem 1.25rem; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-cyan); font-weight: 600;">Assigned Center</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">🏡 {{ franchisee.center_name }}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">📍 {{ franchisee.city }} ({{ franchisee.address }})</div>
        </div>
        <div v-else style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--accent-amber); padding: 0.75rem 1rem; border-radius: 8px; color: var(--accent-amber); font-size: 0.85rem;">
          ⚠️ No franchise center assigned yet. Please contact admin.
        </div>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-4 gap-3" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div class="glass-card" style="padding: 1.25rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Today's Wash Jobs</div>
        <div style="font-size: 2rem; font-weight: 800; color: var(--accent-cyan); margin: 0.25rem 0;">{{ stats.today_tasks }}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Scheduled for today</div>
      </div>

      <div class="glass-card" style="padding: 1.25rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">In Progress / Active</div>
        <div style="font-size: 2rem; font-weight: 800; color: var(--accent-violet); margin: 0.25rem 0;">{{ stats.active_tasks }}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Currently being serviced</div>
      </div>

      <div class="glass-card" style="padding: 1.25rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Completed Washes</div>
        <div style="font-size: 2rem; font-weight: 800; color: var(--accent-emerald); margin: 0.25rem 0;">{{ stats.completed_tasks }}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Successfully delivered</div>
      </div>

      <div class="glass-card" style="padding: 1.25rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Lifetime Tasks</div>
        <div style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin: 0.25rem 0;">{{ stats.total_tasks }}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Total assigned jobs</div>
      </div>
    </div>

    <!-- Recent Tasks Table -->
    <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
      <h4>Assigned Cleaning Tasks</h4>
      <router-link to="/washer/tasks" class="btn btn-outline btn-sm">View All Tasks →</router-link>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading washer station...
    </div>

    <div v-else>
      <div v-if="recentTasks.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Package</th>
              <th>Date &amp; Slot</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in recentTasks" :key="t.id">
              <td>#{{ t.id }}</td>
              <td>
                <div style="font-weight: 600; color: var(--text-primary);">{{ t.customer?.name }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">📞 {{ t.customer?.phone || 'No phone' }}</div>
              </td>
              <td>
                <div>{{ t.vehicle?.make_model }}</div>
                <div style="font-size: 0.75rem; font-family: monospace;" class="text-secondary">{{ t.vehicle?.plate_number }}</div>
              </td>
              <td>{{ t.package?.name || 'Custom Wash' }}</td>
              <td>
                <div>{{ t.booking_date }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">{{ t.slot_time }}</div>
              </td>
              <td>
                <span class="badge" :class="statusBadge(t.status)">{{ t.status }}</span>
              </td>
              <td>
                <div class="flex gap-1">
                  <button v-if="t.status === 'assigned'" class="btn btn-sm btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" @click="updateStatus(t.id, 'ongoing')">
                    ▶ Start Wash
                  </button>
                  <button v-else-if="t.status === 'ongoing'" class="btn btn-sm btn-primary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" @click="updateStatus(t.id, 'completed')">
                    ✓ Complete
                  </button>
                  <span v-else-if="t.status === 'completed'" style="color: var(--accent-emerald); font-size: 0.8rem; font-weight: 600;">
                    ✓ Done
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🚗</div>
        <p>No active wash tasks assigned to you right now.</p>
        <p class="text-muted" style="font-size: 0.85rem;">Your franchise manager will assign vehicle cleaning jobs to you.</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'WasherDashboard',
  data() {
    return {
      user: JSON.parse(localStorage.getItem('auth_user') || '{}'),
      franchisee: null,
      stats: {
        total_tasks: 0,
        today_tasks: 0,
        active_tasks: 0,
        completed_tasks: 0
      },
      recentTasks: [],
      loading: true
    };
  },
  methods: {
    statusBadge(s) {
      return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan';
    },
    async loadDashboard() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/washer/dashboard');
        this.franchisee = data.franchisee;
        this.stats = {
          total_tasks: data.total_tasks,
          today_tasks: data.today_tasks,
          active_tasks: data.active_tasks,
          completed_tasks: data.completed_tasks
        };
        this.recentTasks = data.recent_tasks;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    async updateStatus(taskId, newStatus) {
      try {
        await axios.put(`/api/washer/tasks/${taskId}/status`, { status: newStatus });
        this.loadDashboard();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to update task status.');
      }
    }
  },
  mounted() {
    this.loadDashboard();
  }
};
</script>
