<template>
  <div class="admin-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Customer Management</h1>
        <p class="page-subtitle">View and manage customer accounts, history, and settings.</p>
      </div>
    </div>

    <!-- Customer List -->
    <div class="glass-card">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>CUSTOMER</th>
              <th>CONTACT</th>
              <th>JOINED</th>
              <th>BOOKINGS</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in customers" :key="customer.id">
              <td>
                <div class="user-info">
                  <div class="avatar">{{ customer.name.charAt(0).toUpperCase() }}</div>
                  <div>
                    <strong>{{ customer.name }}</strong>
                    <div class="text-xs text-muted">ID: {{ customer.id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div>{{ customer.email }}</div>
                <div class="text-xs text-muted">{{ customer.phone || 'N/A' }}</div>
              </td>
              <td>{{ formatDate(customer.created_at) }}</td>
              <td>{{ customer.bookings_count }}</td>
              <td>
                <span :class="['badge', customer.status === 'active' ? 'badge-success' : 'badge-danger']">
                  {{ customer.status }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-primary" @click="viewCustomer(customer.id)">View Details</button>
              </td>
            </tr>
            <tr v-if="customers.length === 0">
              <td colspan="6" class="text-center text-muted" style="padding: 2rem;">No customers found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Customer Details Modal -->
    <div class="modal-overlay" v-if="isModalOpen" @click.self="closeModal">
      <div class="modal-content" style="max-width: 900px; width: 95%;">
        <div class="modal-header" style="margin-bottom: 0;">
          <h2>Customer Details</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div v-if="selectedCustomer" class="customer-details">
          
          <!-- Header Profile info & Toggle -->
          <div class="profile-header">
            <div class="user-info" style="gap: 1rem;">
              <div class="avatar" style="width: 60px; height: 60px; font-size: 1.5rem;">
                {{ selectedCustomer.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--text-color);">{{ selectedCustomer.name }}</h3>
                <div class="text-muted" style="margin-top: 0.25rem;">{{ selectedCustomer.email }} • {{ selectedCustomer.phone || 'No Phone' }}</div>
              </div>
            </div>
            <div>
              <button 
                :class="['btn', selectedCustomer.status === 'active' ? 'btn-danger' : 'btn-success']"
                @click="toggleStatus"
                :disabled="isToggling"
              >
                {{ selectedCustomer.status === 'active' ? 'Block Customer' : 'Unblock Customer' }}
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tabs">
            <button v-for="tab in tabs" :key="tab.id" 
                    :class="['tab-btn', { active: activeTab === tab.id }]" 
                    @click="activeTab = tab.id">
              {{ tab.label }}
            </button>
          </div>

          <div class="tab-content" style="padding: 1.5rem 0; min-height: 300px; max-height: 50vh; overflow-y: auto;">
            
            <!-- Overview Tab -->
            <div v-if="activeTab === 'overview'" class="grid-2">
              <div class="stat-card glass-card">
                <div class="text-muted text-sm" style="text-transform: uppercase;">Reward Points</div>
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--primary-color);">{{ selectedCustomer.reward_coins || 0 }}</div>
              </div>
              <div class="stat-card glass-card">
                <div class="text-muted text-sm" style="text-transform: uppercase;">ePoints</div>
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--primary-color);">{{ selectedCustomer.e_points || 0 }}</div>
              </div>
              <div class="stat-card glass-card">
                <div class="text-muted text-sm" style="text-transform: uppercase;">Total Vehicles</div>
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--primary-color);">{{ selectedCustomer.vehicles?.length || 0 }}</div>
              </div>
              <div class="stat-card glass-card">
                <div class="text-muted text-sm" style="text-transform: uppercase;">Joined Date</div>
                <div style="font-size: 1rem; font-weight: 500; color: var(--text-color); margin-top: 0.5rem;">{{ formatDate(selectedCustomer.created_at) }}</div>
              </div>
            </div>

            <!-- Bookings Tab -->
            <div v-if="activeTab === 'bookings'">
              <div v-if="selectedCustomer.bookings?.length">
                <table class="table text-sm">
                  <thead><tr><th>ID</th><th>Date</th><th>Service</th><th>Status</th><th>Price</th></tr></thead>
                  <tbody>
                    <tr v-for="booking in selectedCustomer.bookings" :key="booking.id">
                      <td>#{{ booking.id }}</td>
                      <td>{{ formatDate(booking.booking_date) }}</td>
                      <td>{{ booking.package?.name || 'Unknown' }}</td>
                      <td><span :class="['badge', 'badge-' + (booking.status === 'completed' ? 'success' : (booking.status==='cancelled'?'danger':'warning'))]">{{ booking.status }}</span></td>
                      <td>₹{{ booking.total_price }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center text-muted" style="padding: 2rem;">No bookings found.</div>
            </div>

            <!-- Wallet Tab -->
            <div v-if="activeTab === 'wallet'">
              <!-- Calculate wallet balance from transactions or just show transactions -->
              <div style="margin-bottom: 1rem;">
                <h4 style="margin: 0;">Transaction History</h4>
              </div>
              <div v-if="selectedCustomer.wallet_transactions?.length">
                <table class="table text-sm">
                  <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr v-for="trx in selectedCustomer.wallet_transactions" :key="trx.id">
                      <td>{{ formatDate(trx.created_at) }}</td>
                      <td>
                        <span :class="trx.type === 'credit' ? 'text-success' : 'text-danger'">
                          {{ trx.type === 'credit' ? '+' : '-' }}
                        </span>
                      </td>
                      <td>₹{{ trx.amount }}</td>
                      <td>{{ trx.description }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center text-muted" style="padding: 2rem;">No wallet transactions.</div>
            </div>

            <!-- Subscriptions Tab -->
            <div v-if="activeTab === 'subscriptions'">
              <div v-if="selectedCustomer.subscriptions?.length">
                <table class="table text-sm">
                  <thead><tr><th>Package</th><th>Start Date</th><th>End Date</th><th>Status</th></tr></thead>
                  <tbody>
                    <tr v-for="sub in selectedCustomer.subscriptions" :key="sub.id">
                      <td>{{ sub.package?.name || 'Unknown' }}</td>
                      <td>{{ formatDate(sub.start_date) }}</td>
                      <td>{{ formatDate(sub.end_date) }}</td>
                      <td><span :class="['badge', sub.status === 'active' ? 'badge-success' : 'badge-secondary']">{{ sub.status }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center text-muted" style="padding: 2rem;">No active subscriptions.</div>
            </div>

            <!-- Referrals Tab -->
            <div v-if="activeTab === 'referrals'">
              <div class="glass-card" style="margin-bottom: 1rem;">
                <div style="font-size: 0.9rem; color: var(--text-muted);">Referral Code</div>
                <div style="font-size: 1.25rem; font-weight: 600; letter-spacing: 1px;">{{ selectedCustomer.referral_code || 'None' }}</div>
              </div>
              <h4 style="margin-bottom: 0.5rem;">Referred Users</h4>
              <div v-if="selectedCustomer.referrals?.length">
                <table class="table text-sm">
                  <thead><tr><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
                  <tbody>
                    <tr v-for="ref in selectedCustomer.referrals" :key="ref.id">
                      <td>{{ ref.name }}</td>
                      <td>{{ ref.email }}</td>
                      <td>{{ formatDate(ref.created_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center text-muted" style="padding: 2rem;">No referrals yet.</div>
            </div>

            <!-- Complaints Tab -->
            <div v-if="activeTab === 'complaints'">
              <div v-if="selectedCustomer.support_tickets?.length">
                <table class="table text-sm">
                  <thead><tr><th>Ticket #</th><th>Subject</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    <tr v-for="ticket in selectedCustomer.support_tickets" :key="ticket.id">
                      <td>#{{ ticket.id }}</td>
                      <td>{{ ticket.subject }}</td>
                      <td><span :class="['badge', ticket.status === 'resolved' ? 'badge-success' : 'badge-warning']">{{ ticket.status }}</span></td>
                      <td>{{ formatDate(ticket.created_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center text-muted" style="padding: 2rem;">No support tickets or complaints.</div>
            </div>

          </div>
        </div>
        <div v-else class="text-center text-muted" style="padding: 3rem;">
          Loading details...
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';

const customers = ref([]);
const isModalOpen = ref(false);
const selectedCustomer = ref(null);
const activeTab = ref('overview');
const isToggling = ref(false);

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'complaints', label: 'Complaints/SOP' }
];

const fetchCustomers = async () => {
  try {
    const res = await axios.get('/api/super-admin/customers', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    customers.value = res.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    Swal.fire('Error', 'Failed to load customers', 'error');
  }
};

const viewCustomer = async (id) => {
  isModalOpen.value = true;
  selectedCustomer.value = null;
  activeTab.value = 'overview';
  
  try {
    const res = await axios.get(`/api/super-admin/customers/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    selectedCustomer.value = res.data;
  } catch (error) {
    console.error('Error fetching customer details:', error);
    Swal.fire('Error', 'Failed to load details', 'error');
    isModalOpen.value = false;
  }
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedCustomer.value = null;
};

const toggleStatus = async () => {
  if (!selectedCustomer.value || isToggling.value) return;
  
  const action = selectedCustomer.value.status === 'active' ? 'block' : 'unblock';
  
  const result = await Swal.fire({
    title: `Are you sure?`,
    text: `Do you want to ${action} this customer?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    isToggling.value = true;
    try {
      const res = await axios.post(`/api/super-admin/customers/${selectedCustomer.value.id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      selectedCustomer.value.status = res.data.customer_status;
      
      // Update in main list as well
      const index = customers.value.findIndex(c => c.id === selectedCustomer.value.id);
      if (index !== -1) {
        customers.value[index].status = res.data.customer_status;
      }
      
      Swal.fire('Success', res.data.message, 'success');
    } catch (error) {
      console.error('Error toggling status:', error);
      Swal.fire('Error', 'Failed to change status', 'error');
    } finally {
      isToggling.value = false;
    }
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

onMounted(() => {
  fetchCustomers();
});
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}
.tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
  overflow-x: auto;
}
.tab-btn {
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}
.tab-btn:hover {
  color: var(--text-color);
}
.tab-btn.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}
.stat-card {
  padding: 1.25rem;
  text-align: center;
}
</style>
