<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <h3>Franchise Management</h3>
    </div>
    <div class="glass-card">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="franchisees.length === 0" class="text-muted" style="text-align:center;padding:2rem">No franchise partners yet.</div>
      <div v-else>
        <div v-for="f in franchisees" :key="f.id" class="glass-card" style="margin-bottom:0.75rem">
          <div class="flex justify-between items-start" style="margin-bottom:0.75rem">
            <div>
              <div style="font-weight:700;font-size:1rem">{{ f.center_name }}</div>
              <div class="text-muted" style="font-size:0.82rem">{{ f.city }} • {{ f.user?.name }} • {{ f.user?.phone }}</div>
            </div>
            <div class="flex gap-2 items-center">
              <span class="badge" :class="{ 'badge-emerald': f.status === 'active', 'badge-rose': f.status === 'inactive', 'badge-amber': f.status === 'pending' }">{{ f.status }}</span>
              <select v-model="f.status" class="form-input" style="padding:0.25rem 0.5rem;font-size:0.8rem;width:auto" @change="updateStatus(f)">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div class="grid grid-3 gap-3">
            <div style="text-align:center">
              <div style="font-size:1.2rem;font-weight:700;color:var(--accent-cyan)">{{ f.total_orders || 0 }}</div>
              <div class="text-muted" style="font-size:0.75rem">Total Orders</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:1.2rem;font-weight:700;color:var(--accent-emerald)">{{ f.completed_orders || 0 }}</div>
              <div class="text-muted" style="font-size:0.75rem">Completed</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:1.2rem;font-weight:700;color:var(--accent-violet)">₹{{ (f.total_revenue || 0).toLocaleString() }}</div>
              <div class="text-muted" style="font-size:0.75rem">Revenue</div>
            </div>
          </div>
          <div class="flex gap-3 justify-between items-center" style="margin-top:0.75rem;font-size:0.8rem;color:var(--text-muted);border-top:1px solid var(--border-color);padding-top:0.75rem;">
            <div class="flex gap-3">
              <span>📍 {{ f.address }}</span>
              <span>💰 Royalty: {{ f.royalty_percentage }}%</span>
            </div>
            <button class="btn btn-ghost btn-sm" @click="openSlotModal(f)" style="color:var(--accent-cyan);border:1px solid var(--accent-cyan);padding:0.2rem 0.5rem;">⏰ Assign Wash Slots</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Slots Modal -->
    <div v-if="showSlotModal" class="modal-overlay" @click.self="showSlotModal = false">
      <div class="modal-content">
        <h3>Assign Wash Slots</h3>
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
    async updateStatus(f) {
      await axios.put(`/api/admin/franchisees/${f.id}/status`, { status: f.status });
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
    try { const { data } = await axios.get('/api/admin/franchisees'); this.franchisees = data; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
