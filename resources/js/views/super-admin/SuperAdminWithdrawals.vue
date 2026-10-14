<template>
  <div class="withdrawals-page">
    <div class="page-header flex justify-between items-center" style="margin-bottom: 2rem;">
      <div>
        <h1 style="font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--text-color);">Earning Money Payouts</h1>
        <p class="text-muted" style="margin: 0.25rem 0 0 0; font-size: 0.9rem;">Review and approve customer Earning Money withdrawal requests.</p>
      </div>
      <div class="flex gap-2">
        <select v-model="filters.status" class="form-select" @change="fetchWithdrawals(1)">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-3 gap-3" style="margin-bottom: 2rem;">
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-amber);">⏳</div>
        <div class="stat-value" style="color: var(--accent-amber);">{{ pendingCount }}</div>
        <div class="stat-label">Pending Requests</div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">✅</div>
        <div class="stat-value" style="color: var(--accent-emerald);">{{ approvedCount }}</div>
        <div class="stat-label">Processed Today</div>
      </div>
    </div>

    <div class="glass-card" style="padding: 0;">
      <div v-if="loading" style="padding: 3rem; text-align: center; color: var(--text-muted);">
        Loading withdrawal requests...
      </div>
      
      <div v-else-if="withdrawals.length === 0" style="padding: 3rem; text-align: center; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
        <h3 style="margin: 0 0 0.5rem 0;">No requests found</h3>
        <p style="margin: 0;">There are no withdrawal requests matching your filters.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in withdrawals" :key="req.id">
              <td>#{{ req.id }}</td>
              <td>
                <div style="font-weight: 500;">{{ formatDate(req.created_at) }}</div>
                <div class="text-muted text-xs">{{ formatTime(req.created_at) }}</div>
              </td>
              <td>
                <div style="font-weight: 600; color: var(--text-color);">{{ req.user?.name }}</div>
                <div class="text-muted text-xs">{{ req.user?.email }}</div>
              </td>
              <td>
                <div style="font-weight: 700; color: var(--accent-cyan);">₹{{ parseFloat(req.amount).toFixed(2) }}</div>
                <div class="text-muted text-xs" style="font-size:0.75rem;">Earning Money</div>
              </td>
              <td>
                <span :class="['badge', req.status === 'approved' ? 'badge-success' : (req.status === 'rejected' ? 'badge-danger' : 'badge-warning')]">
                  {{ req.status }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-primary" @click="viewDetails(req)">Review</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="pagination.total > 0" class="flex justify-between items-center" style="padding: 1rem; border-top: 1px solid var(--border-color); flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
          <select v-model="pagination.per_page" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;" @change="fetchWithdrawals(1)">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">
            Showing {{ (pagination.current_page - 1) * pagination.per_page + 1 }} to {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} of {{ pagination.total }}
          </span>
        </div>
        <div class="flex gap-1" v-if="pagination.last_page > 1">
          <button class="btn btn-sm btn-outline-primary" :disabled="pagination.current_page === 1" @click="fetchWithdrawals(pagination.current_page - 1)">Previous</button>
          <button class="btn btn-sm btn-outline-primary" :disabled="pagination.current_page === pagination.last_page" @click="fetchWithdrawals(pagination.current_page + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" style="max-width: 600px; width: 100%;">
        <div class="modal-header">
          <h3>Review Withdrawal Request #{{ selectedRequest?.id }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedRequest">
          <div class="grid grid-2 gap-3" style="margin-bottom: 1.5rem;">
            <div class="glass-card" style="padding: 1rem;">
              <div class="text-muted text-xs uppercase" style="margin-bottom: 0.25rem;">Amount Requested</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-cyan);">₹{{ parseFloat(selectedRequest.amount).toFixed(2) }}</div>
              <div class="text-muted text-xs" style="margin-top: 0.25rem; font-size: 0.75rem;">Earning Money</div>
            </div>
            <div class="glass-card" style="padding: 1rem;">
              <div class="text-muted text-xs uppercase" style="margin-bottom: 0.25rem;">Current Status</div>
              <div>
                <span :class="['badge', selectedRequest.status === 'approved' ? 'badge-success' : (selectedRequest.status === 'rejected' ? 'badge-danger' : 'badge-warning')]">
                  {{ selectedRequest.status }}
                </span>
              </div>
            </div>
          </div>

          <h4 style="margin-bottom: 0.75rem;">Customer Bank/UPI Details</h4>
          <div class="glass-card" style="background: var(--bg-secondary); margin-bottom: 1.5rem;" v-if="selectedRequest.user?.bank_detail">
            <div class="grid grid-2 gap-3" style="font-size: 0.9rem;">
              <div><span class="text-muted">Account Name:</span> <br/><strong>{{ selectedRequest.user.bank_detail.account_holder_name || '-' }}</strong></div>
              <div><span class="text-muted">Bank Name:</span> <br/><strong>{{ selectedRequest.user.bank_detail.bank_name || '-' }}</strong></div>
              <div><span class="text-muted">Account No:</span> <br/><strong>{{ selectedRequest.user.bank_detail.account_number || '-' }}</strong></div>
              <div><span class="text-muted">IFSC Code:</span> <br/><strong>{{ selectedRequest.user.bank_detail.ifsc_code || '-' }}</strong></div>
              <div style="grid-column: span 2;"><span class="text-muted">UPI ID:</span> <br/><strong>{{ selectedRequest.user.bank_detail.upi_id || '-' }}</strong></div>
            </div>
          </div>
          <div v-else class="alert alert-warning" style="margin-bottom: 1.5rem;">
            Customer has not saved their bank details. You cannot process this payout.
          </div>

          <div v-if="selectedRequest.status === 'pending'">
            <div style="margin-bottom: 1rem;">
              <label class="form-label">Admin Notes (Optional)</label>
              <textarea v-model="adminNotes" class="form-input" rows="3" placeholder="Add transaction ID or rejection reason..."></textarea>
            </div>
            
            <div class="flex gap-2 justify-end" style="margin-top: 1.5rem;">
              <button class="btn btn-outline-danger" @click="processRequest('rejected')" :disabled="processing">Reject & Refund</button>
              <button class="btn btn-success" @click="processRequest('approved')" :disabled="processing || !selectedRequest.user?.bank_detail">
                {{ processing ? 'Processing...' : 'Mark as Transferred' }}
              </button>
            </div>
          </div>
          <div v-else>
            <h4 style="margin-bottom: 0.5rem;">Admin Notes</h4>
            <div class="glass-card" style="background: var(--bg-secondary); font-size: 0.9rem;">
              {{ selectedRequest.admin_notes || 'No notes provided.' }}
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';

const withdrawals = ref([]);
const loading = ref(true);
const processing = ref(false);
const isModalOpen = ref(false);
const selectedRequest = ref(null);
const adminNotes = ref('');

const pendingCount = ref(0);
const approvedCount = ref(0); // Today

const pagination = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
  per_page: 20
});

const filters = reactive({
  status: 'pending'
});

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const fetchWithdrawals = async (page = 1) => {
  loading.value = true;
  try {
    const res = await axios.get('/api/super-admin/withdrawals', {
      params: {
        page: page,
        per_page: pagination.value.per_page,
        status: filters.status
      }
    });
    
    withdrawals.value = res.data.data;
    pagination.value = {
      current_page: res.data.current_page,
      last_page: res.data.last_page,
      total: res.data.total,
      per_page: res.data.per_page
    };
    
    // Quick calculate counts if we fetched all or pending
    if (filters.status === 'pending') {
      pendingCount.value = res.data.total;
    }
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    Swal.fire('Error', 'Failed to load withdrawal requests', 'error');
  } finally {
    loading.value = false;
  }
};

const viewDetails = (req) => {
  selectedRequest.value = req;
  adminNotes.value = req.admin_notes || '';
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedRequest.value = null;
  adminNotes.value = '';
};

const processRequest = async (status) => {
  const refundUnit = '₹' + parseFloat(selectedRequest.value.amount).toFixed(2) + ' earning money';
  const actionText = status === 'approved' 
    ? 'transfer the amount and mark as approved' 
    : `reject this request and refund the ${refundUnit}`;
  const confirmResult = await Swal.fire({
    title: 'Are you sure?',
    text: `You are about to ${actionText}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: status === 'approved' ? '#10b981' : '#ef4444',
    confirmButtonText: 'Yes, proceed'
  });

  if (!confirmResult.isConfirmed) return;

  processing.value = true;
  try {
    await axios.post(`/api/super-admin/withdrawals/${selectedRequest.value.id}/process`, {
      status: status,
      admin_notes: adminNotes.value
    });
    
    Swal.fire('Success', `Request has been ${status}.`, 'success');
    closeModal();
    fetchWithdrawals(pagination.value.current_page);
  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || 'Failed to process request', 'error');
  } finally {
    processing.value = false;
  }
};

onMounted(() => {
  fetchWithdrawals();
});
</script>

<style scoped>
.page-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}
.alert-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(245, 158, 11, 0.2);
  font-size: 0.85rem;
}
</style>
