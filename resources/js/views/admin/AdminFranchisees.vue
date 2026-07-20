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
            <th style="padding: 1rem 0.5rem;">Agreement</th>
            <th style="padding: 1rem 0.5rem;">Status</th>
            <th style="padding: 1rem 0.5rem;">Performance</th>
            <th style="padding: 1rem 0.5rem;">Revenue</th>
            <th style="padding: 1rem 0.5rem;">Bookings (Total / Completed)</th>
            <th style="padding: 1rem 0.5rem; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in paginatedFranchisees" :key="f.id" style="border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
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
                ₹{{ (f.royalty_percentage || 0).toLocaleString() }}
              </div>
            </td>
            <td style="padding: 1rem 0.5rem; font-size: 0.8rem;">
              <div :style="{ color: !f.agreement_expires_at ? 'var(--text-muted)' : (new Date(f.agreement_expires_at) < new Date() ? 'var(--accent-rose)' : 'var(--accent-emerald)') }">
                <span v-if="f.agreement_expires_at">Exp: {{ f.agreement_expires_at }}</span>
                <span v-else>No Date</span>
              </div>
              <div style="margin-top: 0.25rem; display: flex; align-items: center; gap: 5px;">
                <template v-if="f.document_path">
                  <img v-if="f.document_path.match(/\.(jpeg|jpg|png|gif)$/i)" :src="'/' + f.document_path" style="height: 24px; width: 24px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);" />
                  <span v-else style="font-size: 1.1rem; line-height: 1;">📄</span>
                  <a href="#" @click.prevent="showDocumentPopup(f)" style="color:var(--accent-cyan); text-decoration:none;">View Doc</a>
                </template>
                <span v-else class="text-muted">No Doc</span>
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
                <option value="delete_doc" v-if="f.document_path" style="color: var(--accent-rose);">Delete Doc</option>
                <option value="view">View / Slots</option>
                <option value="edit">Edit</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div v-if="franchisees.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
          <select v-model="itemsPerPage" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;" @change="currentPage = 1">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="75">75</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
          </select>
          <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, franchisees.length) }} of {{ franchisees.length }} entries
          </span>
        </div>
        <div class="flex gap-1" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Previous</button>
          
          <template v-for="page in totalPages" :key="page">
            <button v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
              class="btn btn-sm" 
              :class="currentPage === page ? 'btn-primary' : 'btn-outline'"
              @click="currentPage = page">
              {{ page }}
            </button>
            <span v-else-if="page === currentPage - 2 || page === currentPage + 2" class="text-muted" style="padding: 0 0.25rem;">...</span>
          </template>
          
          <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>
    </div>

    <!-- Assign Slots / View Modal -->
    <div v-if="showSlotModal" class="modal-overlay" @click.self="showSlotModal = false">
      <div class="modal-content" style="max-width: 650px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3 style="margin: 0;">Franchise Details & Wash Slots</h3>
          <button class="btn btn-ghost btn-sm" @click="showSlotModal = false" style="padding: 0.2rem 0.5rem;">✕</button>
        </div>

        <div v-if="selectedFranchise" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; font-size: 0.9rem;">
            <div>
              <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Owner Info</div>
              <div style="font-weight: 600;">{{ selectedFranchise.user?.name || '-' }}</div>
              <div class="text-muted">{{ selectedFranchise.user?.phone || '-' }}</div>
              <div class="text-muted">{{ selectedFranchise.user?.email || '-' }}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Center Details</div>
              <div style="font-weight: 600;">{{ selectedFranchise.center_name || '-' }}</div>
              <div class="text-muted">{{ selectedFranchise.city || '-' }}, {{ selectedFranchise.state || 'N/A' }}</div>
              <div class="text-muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;" :title="selectedFranchise.address">{{ selectedFranchise.address || '-' }}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Performance</div>
              <div><span style="font-weight: 600; color: var(--accent-emerald);">{{ selectedFranchise.completed_orders || 0 }}</span> / {{ selectedFranchise.total_orders || 0 }} Bookings Completed</div>
              <div class="text-muted">Success Rate: {{ selectedFranchise.total_orders > 0 ? Math.round((selectedFranchise.completed_orders / selectedFranchise.total_orders) * 100) : 0 }}%</div>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Financials</div>
              <div>Revenue: <span style="font-weight: 600;">₹{{ (selectedFranchise.total_revenue || 0).toLocaleString() }}</span></div>
              <div class="text-muted">Royalty Rate: ₹{{ selectedFranchise.royalty_percentage }}</div>
            </div>
            <div style="grid-column: 1 / -1; border-top: 1px solid var(--border-color); padding-top: 1rem;">
              <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Agreement & Documents</div>
              <div style="display:flex; gap: 2rem;">
                <div>Expires: <span style="font-weight: 600;" :style="{ color: !selectedFranchise.agreement_expires_at ? 'var(--text-muted)' : (new Date(selectedFranchise.agreement_expires_at) < new Date() ? 'var(--accent-rose)' : 'var(--accent-emerald)') }">{{ selectedFranchise.agreement_expires_at || 'Not set' }}</span></div>
                <div>Document: <a v-if="selectedFranchise.document_path" :href="'/' + selectedFranchise.document_path" target="_blank" style="color:var(--accent-cyan); text-decoration:none;">View Document</a><span v-else class="text-muted">No document uploaded</span></div>
              </div>
            </div>
          </div>
        </div>
        
        <h4 style="margin-bottom: 0.5rem;">Assign Wash Slots</h4>
        <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 1rem;">Select which time slots are available for <strong>{{ selectedFranchise?.center_name }}</strong></p>
        
        <div v-if="loadingSlots" class="text-center text-muted" style="padding: 2rem; background: var(--bg-secondary); border-radius: 8px;">Loading slots...</div>
        <div v-else>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem;">
            <div v-for="slot in allMasterSlots" :key="slot.id" style="display: flex; align-items: flex-start; gap: 0.5rem; background: var(--bg-secondary); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color);">
              <input type="checkbox" :id="'slot-'+slot.id" :value="slot.id" v-model="selectedSlotIds" style="width: 1.2rem; height: 1.2rem; accent-color: var(--accent-cyan); margin-top: 0.1rem;" />
              <label :for="'slot-'+slot.id" style="cursor: pointer; flex: 1; line-height: 1.3;">
                <div style="font-weight: 600;">{{ slot.name }}</div>
                <div class="text-muted" style="font-size: 0.8rem;">{{ slot.time_range }}</div>
              </label>
            </div>
          </div>
          
          <div v-if="error" class="alert alert-error" style="margin-top: 1rem;">{{ error }}</div>
          
          <div class="flex gap-2" style="margin-top: 2rem; justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 1rem;">
            <button class="btn btn-ghost" @click="showSlotModal = false">Cancel</button>
            <button class="btn btn-primary" @click="saveSlotAssignments" :disabled="savingSlots">
              {{ savingSlots ? 'Saving...' : 'Save Assignments' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
import Swal from 'sweetalert2';

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
      currentPage: 1,
      itemsPerPage: 10,
      error: ''
    }; 
  },
  computed: {
    paginatedFranchisees() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.franchisees.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.franchisees.length / this.itemsPerPage) || 1;
    }
  },
  methods: {
    async updateStatus(f, newStatus) {
      const result = await Swal.fire({
        title: 'Confirm Action',
        text: `Are you sure you want to ${newStatus} this franchise?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, do it!'
      });
      if (!result.isConfirmed) return;

      try {
        await axios.put(`/api/admin/franchisees/${f.id}/status`, { status: newStatus });
        f.status = newStatus;
        Swal.fire('Updated!', 'Status has been updated successfully.', 'success');
      } catch (e) {
        Swal.fire('Error', 'Failed to update status', 'error');
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
      } else if (action === 'edit') {
        this.openEditModal(f);
      } else if (action === 'renew') {
        this.renewAgreement(f);
      } else if (action === 'upload') {
        this.uploadDocument(f);
      } else if (action === 'delete_doc') {
        this.deleteDocument(f);
      }
    },
    async renewAgreement(f) {
      const today = new Date();
      today.setFullYear(today.getFullYear() + 1);
      const defaultDate = today.toISOString().split('T')[0];
      
      const { value: newDate } = await Swal.fire({
        title: 'Renew Agreement',
        html: `Select new expiration date for <strong>${f.center_name}</strong>`,
        input: 'date',
        inputValue: f.agreement_expires_at || defaultDate,
        showCancelButton: true,
        confirmButtonText: 'Renew'
      });

      if (newDate) {
        try {
          await axios.post(`/api/admin/franchisees/${f.id}/renew`, { agreement_expires_at: newDate });
          f.agreement_expires_at = newDate;
          Swal.fire('Renewed!', 'Agreement has been renewed successfully.', 'success');
        } catch (error) {
          Swal.fire('Error', 'Failed to renew agreement.', 'error');
        }
      }
    },
    async uploadDocument(f) {
      const { value: file } = await Swal.fire({
        title: 'Upload Document',
        html: `<div style="margin-bottom:1rem; font-size:0.9rem;">Select document for <strong>${f.center_name}</strong> (PDF, JPG, PNG)</div>`,
        input: 'file',
        inputAttributes: {
          accept: '.pdf,image/*',
          'aria-label': 'Upload your document'
        },
        showCancelButton: true,
        confirmButtonText: 'Upload',
        inputValidator: (file) => {
          if (!file) return 'You need to select a file!';
        }
      });

      if (file) {
        const formData = new FormData();
        formData.append('document', file);
        
        Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

        try {
          const { data } = await axios.post(`/api/admin/franchisees/${f.id}/upload-document`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          f.document_path = data.franchisee.document_path;
          Swal.fire('Uploaded!', 'Document has been uploaded successfully.', 'success');
        } catch (error) {
          Swal.fire('Error', error.response?.data?.message || 'Failed to upload document.', 'error');
        }
      }
    },
    async deleteDocument(f) {
      const result = await Swal.fire({
        title: 'Delete Document',
        text: `Are you sure you want to delete the document for ${f.center_name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--accent-rose)',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        try {
          await axios.delete(`/api/admin/franchisees/${f.id}/document`);
          f.document_path = null;
          Swal.fire('Deleted!', 'Document has been deleted.', 'success');
        } catch (error) {
          Swal.fire('Error', error.response?.data?.message || 'Failed to delete document', 'error');
        }
      }
    },
    showDocumentPopup(f) {
      if (!f.document_path) return;
      const isImage = f.document_path.match(/\.(jpeg|jpg|png|gif)$/i);
      
      if (isImage) {
        Swal.fire({
          title: 'Franchise Document',
          imageUrl: '/' + f.document_path,
          imageAlt: 'Document',
          width: '80%',
          showCloseButton: true,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          title: 'Franchise Document',
          html: `<iframe src="/${f.document_path}" style="width:100%; height:75vh; border:none;"></iframe>`,
          width: '80%',
          showCloseButton: true,
          showConfirmButton: false,
          customClass: { popup: 'swal2-no-padding' }
        });
      }
    },
    async openEditModal(f) {
      const { value: formValues } = await Swal.fire({
        title: 'Edit Franchise',
        html: `
          <div style="display:flex; flex-direction:column; gap:10px; text-align:left; font-size: 0.9rem;">
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Owner Name</label>
              <input id="swal-name" class="form-input" style="width:100%" placeholder="Owner Name" value="${f.user?.name || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Email</label>
              <input id="swal-email" type="email" class="form-input" style="width:100%" placeholder="Email" value="${f.user?.email || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Phone</label>
              <input id="swal-phone" class="form-input" style="width:100%" placeholder="Phone" value="${f.user?.phone || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Center Name</label>
              <input id="swal-center" class="form-input" style="width:100%" placeholder="Center Name" value="${f.center_name || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">City</label>
              <input id="swal-city" class="form-input" style="width:100%" placeholder="City" value="${f.city || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Address</label>
              <input id="swal-address" class="form-input" style="width:100%" placeholder="Address" value="${f.address || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Royalty Amount (₹)</label>
              <input id="swal-royalty" type="number" step="0.01" class="form-input" style="width:100%" placeholder="Royalty Amount" value="${f.royalty_percentage || ''}">
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        preConfirm: () => {
          return {
            name: document.getElementById('swal-name').value,
            email: document.getElementById('swal-email').value,
            phone: document.getElementById('swal-phone').value,
            center_name: document.getElementById('swal-center').value,
            city: document.getElementById('swal-city').value,
            address: document.getElementById('swal-address').value,
            royalty_percentage: document.getElementById('swal-royalty').value,
            role: 'franchisee',
            status: f.user?.status || 'active'
          }
        }
      });

      if (formValues) {
        try {
          await axios.put(`/api/admin/users/${f.user_id || f.user?.id}`, formValues);
          Swal.fire('Saved!', 'Franchise details have been updated.', 'success');
          
          if (f.user) {
            f.user.name = formValues.name;
            f.user.email = formValues.email;
            f.user.phone = formValues.phone;
          }
          f.center_name = formValues.center_name;
          f.city = formValues.city;
          f.address = formValues.address;
          f.royalty_percentage = formValues.royalty_percentage;
        } catch (error) {
          console.error(error);
          Swal.fire('Error', error.response?.data?.message || 'Failed to update franchise', 'error');
        }
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

