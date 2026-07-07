<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <h3>Franchise Management</h3>
    </div>
    <div class="glass-card" style="overflow-x: auto;">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="franchisees.length === 0" class="text-muted" style="text-align:center;padding:2rem">No franchise partners yet.</div>
      <table v-else class="table" style="width: 100%; text-align: left; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-muted);">
            <th style="padding: 1rem 0.5rem;">Owner Name</th>
            <th style="padding: 1rem 0.5rem;">City</th>
            <th style="padding: 1rem 0.5rem;">State</th>
            <th style="padding: 1rem 0.5rem;">Address</th>
            <th style="padding: 1rem 0.5rem;">Contact Info</th>
            <th style="padding: 1rem 0.5rem;">Royalty (₹)</th>
            <th style="padding: 1rem 0.5rem;">Status</th>
            <th style="padding: 1rem 0.5rem;">Performance</th>
            <th style="padding: 1rem 0.5rem;">Revenue</th>
            <th style="padding: 1rem 0.5rem;">Bookings (Total / Completed)</th>
            <th style="padding: 1rem 0.5rem; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in franchisees" :key="f.id" style="border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
            <td style="padding: 1rem 0.5rem;">
              <div style="font-weight: 600;">{{ f.user?.name || '-' }}</div>
              <div class="text-muted" style="font-size: 0.75rem;">{{ f.center_name }}</div>
            </td>
            <td style="padding: 1rem 0.5rem;">{{ f.city || '-' }}</td>
            <td style="padding: 1rem 0.5rem;">{{ f.state || 'N/A' }}</td>
            <td style="padding: 1rem 0.5rem; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="f.address">
              {{ f.address || '-' }}
            </td>
            <td style="padding: 1rem 0.5rem;">
              <div>{{ f.user?.phone || '-' }}</div>
              <div class="text-muted" style="font-size: 0.75rem;">{{ f.user?.email || '-' }}</div>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <div style="font-weight: 600; color: var(--accent-cyan);">
                ₹{{ ((f.total_revenue || 0) * (f.royalty_percentage / 100)).toLocaleString() }}
              </div>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <span class="badge" :class="{ 'badge-emerald': f.status === 'active', 'badge-rose': f.status === 'inactive' || f.status === 'suspended', 'badge-amber': f.status === 'pending' }">
                {{ f.status.toUpperCase() }}
              </span>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <div v-if="f.total_orders > 0">
                {{ Math.round((f.completed_orders / f.total_orders) * 100) }}%
              </div>
              <div v-else class="text-muted">-</div>
            </td>
            <td style="padding: 1rem 0.5rem; font-weight: 600;">
              ₹{{ (f.total_revenue || 0).toLocaleString() }}
            </td>
            <td style="padding: 1rem 0.5rem; text-align: center;">
              {{ f.total_orders || 0 }} / <span style="color: var(--accent-emerald);">{{ f.completed_orders || 0 }}</span>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <select class="form-input" style="padding: 0.25rem; font-size: 0.8rem; width: 120px;" @change="handleAction($event, f)">
                <option value="">-- Actions --</option>
                <option value="approve" v-if="f.status !== 'active'">Approve</option>
                <option value="reject" v-if="f.status !== 'inactive'">Reject</option>
                <option value="suspend" v-if="f.status !== 'suspended'">Suspend</option>
                <option value="renew">Renew Agreement</option>
                <option value="upload">Upload Docs</option>
                <option value="view">View / Slots</option>
                <option value="edit">Edit</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Assign Slots / View Modal (Reusing the existing slot modal logic for 'view') -->
    <div v-if="showSlotModal" class="modal-overlay" @click.self="showSlotModal = false">
      <div class="modal-content">
        <h3>View & Assign Wash Slots</h3>
        <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 1rem;">Select which time slots are available for <strong>{{ selectedFranchise?.center_name }}</strong></p>
        
        <div v-if="loadingSlots" class="text-center text-muted" style="padding: 1rem;">Loading slots...</div>
        <div v-else>
          <div v-for="slot in allMasterSlots" :key="slot.id" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" :id="'slot-'+slot.id" :value="slot.id" v-model="selectedSlotIds" style="width: 1.2rem; height: 1.2rem; accent-color: var(--accent-cyan);" />
            <label :for="'slot-'+slot.id" style="cursor: pointer;">
              <strong>{{ slot.name }}</strong> <span class="text-muted">({{ slot.time_range }})</span>
            </label>
          </div>
          
          <div v-if="error" class="alert alert-error" style="margin-top: 1rem;">{{ error }}</div>
          
          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button class="btn btn-primary" @click="saveSlotAssignments" :disabled="savingSlots">
              {{ savingSlots ? 'Saving...' : 'Save Assignments' }}
            </button>
            <button class="btn btn-ghost" @click="showSlotModal = false">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'AdminFranchisees',
  data() { 
    return { 
      franchisees: [], 
      loading: true,
      
      showSlotModal: false,
      loadingSlots: false,
      savingSlots: false,
      selectedFranchise: null,
      allMasterSlots: [],
      selectedSlotIds: [],
      error: ''
    }; 
  },
  methods: {
    async updateStatus(f, newStatus) {
      if (!confirm(`Are you sure you want to ${newStatus} this franchise?`)) return;
      try {
        await axios.put(`/api/admin/franchisees/${f.id}/status`, { status: newStatus });
        f.status = newStatus;
      } catch (e) {
        alert('Failed to update status');
      }
    },
    handleAction(event, f) {
      const action = event.target.value;
      event.target.value = ""; // reset dropdown
      
      if (!action) return;

      if (action === 'approve') {
        this.updateStatus(f, 'active');
      } else if (action === 'reject') {
        this.updateStatus(f, 'inactive');
      } else if (action === 'suspend') {
        this.updateStatus(f, 'suspended');
      } else if (action === 'view') {
        this.openSlotModal(f);
      } else if (action === 'edit' || action === 'renew' || action === 'upload') {
        alert(`${action} action triggered for ${f.center_name}. (To be implemented)`);
      }
    },
    async openSlotModal(f) {
      this.selectedFranchise = f;
      this.showSlotModal = true;
      this.loadingSlots = true;
      this.error = '';
      this.selectedSlotIds = [];
      
      try {
        const { data } = await axios.get(`/api/admin/franchisees/${f.id}/slots`);
        
        this.allMasterSlots = data.filter(s => s.status === 'active');
        this.selectedSlotIds = data.filter(s => s.assigned).map(s => s.id);
      } catch (e) {
        this.error = 'Failed to load slot data.';
      }
      this.loadingSlots = false;
    },
    async saveSlotAssignments() {
      this.savingSlots = true;
      this.error = '';
      try {
        await axios.post(`/api/admin/franchisees/${this.selectedFranchise.id}/slots`, {
          master_slot_ids: this.selectedSlotIds
        });
        this.showSlotModal = false;
      } catch (e) {
        this.error = 'Failed to save slot assignments.';
      }
      this.savingSlots = false;
    }
  },
  async mounted() {
    try { 
      const { data } = await axios.get('/api/admin/franchisees'); 
      this.franchisees = data; 
    }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>

