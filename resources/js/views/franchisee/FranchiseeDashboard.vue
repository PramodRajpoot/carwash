<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h3>{{ data.center_name || 'Center Dashboard' }}</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Operational overview, revenues, and center efficiency metrics.</p>
      </div>
      <router-link to="/franchisee/orders" class="btn btn-primary btn-sm">Manage Active Wash Orders</router-link>
    </div>

    <!-- Stat Grid -->
    <div class="grid grid-4 gap-3" style="margin-bottom: 2rem;">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">💰</div>
        <div class="stat-value">₹{{ data.today_earnings || 0 }}</div>
        <div class="stat-label">Today's Revenue</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan);">📈</div>
        <div class="stat-value">₹{{ data.monthly_earnings || 0 }}</div>
        <div class="stat-label">Monthly Revenue</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-violet);">🚙</div>
        <div class="stat-value">{{ data.today_orders || 0 }}</div>
        <div class="stat-label">Today's Orders</div>
      </div>
      <div class="stat-card" style="border-top: 3px solid var(--accent-amber);">
        <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-amber);">🎟️</div>
        <div class="stat-value">₹{{ Math.round(data.royalty_pending || 0) }}</div>
        <div class="stat-label">Royalty Accrued ({{ data.royalty_rate }}%)</div>
      </div>
    </div>

    <!-- Center Operations Visual Gauges -->
    <div class="grid grid-3 gap-3" style="margin-bottom: 2rem;">
      <div class="glass-card">
        <h4 style="margin-bottom: 1rem;">Chemical Supplies</h4>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div>
            <div class="flex justify-between" style="font-size: 0.8rem; margin-bottom: 0.25rem;">
              <span>Shampoo &amp; Foam Agent</span>
              <strong style="color: var(--accent-emerald);">78%</strong>
            </div>
            <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
              <div style="width: 78%; height: 100%; background: var(--accent-emerald);"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between" style="font-size: 0.8rem; margin-bottom: 0.25rem;">
              <span>Wax Coating Compound</span>
              <strong style="color: var(--accent-cyan);">92%</strong>
            </div>
            <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
              <div style="width: 92%; height: 100%; background: var(--accent-cyan);"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between" style="font-size: 0.8rem; margin-bottom: 0.25rem;">
              <span>Microfiber Detergent</span>
              <strong style="color: var(--accent-amber);">42%</strong>
            </div>
            <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
              <div style="width: 42%; height: 100%; background: var(--accent-amber);"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-card">
        <h4 style="margin-bottom: 1rem;">Equipment Status</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem;">
          <div class="flex justify-between items-center" style="padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
            <span>High-Pressure Foam Jet</span>
            <span class="badge badge-emerald">Optimal</span>
          </div>
          <div class="flex justify-between items-center" style="padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
            <span>Water Extraction Vacuum</span>
            <span class="badge badge-emerald">Optimal</span>
          </div>
          <div class="flex justify-between items-center">
            <span>Buffer &amp; Polishing Units</span>
            <span class="badge badge-amber">Service Due</span>
          </div>
        </div>
      </div>

      <div class="glass-card">
        <h4 style="margin-bottom: 0.5rem;">Quick Operations Tips</h4>
        <p class="text-muted" style="font-size: 0.8rem; line-height: 1.6;">
          Maintain active inventory of eco-friendly solutions. Ensure washers wear high-visibility uniforms for premium customer feedback. Clean buffing pads daily to prevent micro-scratches.
        </p>
        <div style="margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;" class="flex justify-between items-center">
          <span style="font-size: 0.75rem;" class="text-muted">Need Support?</span>
          <a href="#" class="btn btn-outline btn-sm" style="padding: 0.25rem 0.75rem;">Support Desk</a>
        </div>
      </div>
    </div>

    <!-- Recent Assigned Bookings -->
    <div class="glass-card">
      <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
        <h4>Recent Wash Assignments</h4>
        <router-link to="/franchisee/orders" class="btn btn-sm btn-outline">View All assignments</router-link>
      </div>
      <div v-if="data.recent_orders && data.recent_orders.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Date / Slot</th>
              <th>Price</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in data.recent_orders" :key="o.id">
              <td>{{ o.customer?.name }}</td>
              <td>{{ o.vehicle?.make_model }} ({{ o.vehicle?.plate_number }})</td>
              <td>{{ o.booking_date }} • {{ o.slot_time }}</td>
              <td>₹{{ o.total_price }}</td>
              <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
              <td>
                <router-link to="/franchisee/orders" class="btn btn-ghost btn-sm" style="color:var(--accent-cyan);">Manage</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-muted" style="padding: 1.5rem 0; text-align: center;">
        No bookings assigned to this center.
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'FranchiseeDashboard',
  data() {
    return {
      data: {}
    };
  },
  methods: {
    statusBadge(s) {
      return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan';
    }
  },
  async mounted() {
    try {
      const { data } = await axios.get('/api/franchisee/dashboard');
      this.data = data;
    } catch (e) {
      console.error(e);
    }
  }
};
</script>
