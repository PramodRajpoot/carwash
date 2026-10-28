<template>
  <div class="admin-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Customer Management</h1>
        <p class="page-subtitle">View and manage customer accounts, history, and settings.</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="glass-card" style="margin-bottom: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
      <div style="flex: 1; min-width: 250px;">
        <input 
          type="text" 
          class="form-input" 
          placeholder="Search by name, email, or phone..." 
          v-model="filters.search"
          @keyup.enter="fetchCustomers(1)"
        >
      </div>
      <div>
        <select class="form-input" v-model="filters.status" @change="fetchCustomers(1)">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
      <div>
        <button class="btn btn-primary" @click="fetchCustomers(1)">Search</button>
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

      <!-- Pagination -->
      <div v-if="pagination.total > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem; border-top: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
          <select v-model="pagination.per_page" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;" @change="fetchCustomers(1)">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="75">75</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
          </select>
          <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">
            Showing {{ (pagination.current_page - 1) * pagination.per_page + 1 }} to {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} of {{ pagination.total }}
          </span>
        </div>
        <div class="flex gap-1" v-if="pagination.last_page > 1">
          <button class="btn btn-sm btn-outline-primary" :disabled="pagination.current_page === 1" @click="fetchCustomers(pagination.current_page - 1)">Previous</button>
          <button class="btn btn-sm btn-outline-primary" :disabled="pagination.current_page === pagination.last_page" @click="fetchCustomers(pagination.current_page + 1)">Next</button>
        </div>
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
                <div class="text-muted text-sm" style="text-transform: uppercase;">Earning Money</div>
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-cyan);">₹{{ parseFloat(selectedCustomer.earning_money || 0).toFixed(2) }}</div>
              </div>
              <div class="stat-card glass-card">
                <div class="text-muted text-sm" style="text-transform: uppercase;">ePoints</div>
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--primary-color);">{{ selectedCustomer.e_points || 0 }}</div>
              </div>
              <div class="stat-card glass-card">
                <div class="text-muted text-sm" style="text-transform: uppercase;">Reward Points</div>
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--primary-color);">{{ selectedCustomer.reward_coins || 0 }}</div>
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
              <!-- Bank Details -->
              <div class="glass-card" style="margin-bottom: 1.5rem;" v-if="selectedCustomer.bank_detail">
                <h4 style="margin-top:0; margin-bottom: 1rem;">Saved Bank / UPI Details</h4>
                <div class="grid grid-2 gap-3" style="font-size: 0.9rem;">
                  <div><span class="text-muted">Account Name:</span> <br/><strong>{{ selectedCustomer.bank_detail.account_holder_name || '-' }}</strong></div>
                  <div><span class="text-muted">Bank Name:</span> <br/><strong>{{ selectedCustomer.bank_detail.bank_name || '-' }}</strong></div>
                  <div><span class="text-muted">Account No:</span> <br/><strong>{{ selectedCustomer.bank_detail.account_number || '-' }}</strong></div>
                  <div><span class="text-muted">IFSC Code:</span> <br/><strong>{{ selectedCustomer.bank_detail.ifsc_code || '-' }}</strong></div>
                  <div style="grid-column: span 2;"><span class="text-muted">UPI ID:</span> <br/><strong>{{ selectedCustomer.bank_detail.upi_id || '-' }}</strong></div>
                </div>
              </div>
              <div class="glass-card" style="margin-bottom: 1.5rem;" v-else>
                <div class="text-center text-muted" style="padding: 1rem;">No bank details saved by customer.</div>
              </div>

              <!-- Withdrawal Requests -->
              <div style="margin-bottom: 1rem;" v-if="selectedCustomer.withdrawal_requests?.length">
                <h4 style="margin: 0;">Withdrawal Requests</h4>
              </div>
              <div v-if="selectedCustomer.withdrawal_requests?.length" style="margin-bottom: 1.5rem;">
                <table class="table text-sm">
                  <thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    <tr v-for="req in selectedCustomer.withdrawal_requests" :key="req.id">
                      <td>{{ formatDate(req.created_at) }}</td>
                      <td>
                        <span v-if="req.type === 'earning_money'">₹{{ parseFloat(req.amount).toFixed(2) }}</span>
                        <span v-else>{{ req.amount }} pts</span>
                        <span class="text-xs text-muted" style="margin-left: 0.25rem;">({{ req.type === 'earning_money' ? 'Earning Money' : 'E-Points' }})</span>
                      </td>
                      <td>
                        <span :class="['badge', req.status === 'approved' ? 'badge-success' : (req.status === 'rejected' ? 'badge-danger' : 'badge-warning')]">{{ req.status }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Transaction History -->
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
                      <td>
                        <span v-if="trx.source && (trx.source.includes('earning') || trx.source === 'referral_commission')">₹{{ trx.amount }}</span>
                        <span v-else>{{ trx.amount }} pts</span>
                      </td>
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

            <!-- Complaints / SOP Tab -->
            <div v-if="activeTab === 'complaints'">
              <!-- Wash Completion Proofs & SOP Section -->
              <div style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                  <div>
                    <h4 style="margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">
                      <span>📸</span> Wash SOP &amp; Completion Proofs
                    </h4>
                    <p class="text-muted" style="margin: 0.2rem 0 0 0; font-size: 0.78rem;">
                      Service photos, video proof, and washer review recorded upon wash completion.
                    </p>
                  </div>
                  <span class="badge badge-cyan" style="font-weight: 700;">
                    {{ washProofBookings.length }} Wash(es)
                  </span>
                </div>

                <div v-if="washProofBookings.length" style="display: flex; flex-direction: column; gap: 1rem;">
                  <div 
                    v-for="wash in washProofBookings" 
                    :key="wash.id" 
                    class="glass-card" 
                    style="padding: 1rem 1.25rem; border: 1px solid var(--border-color); border-radius: 10px; background: rgba(255,255,255,0.02);">
                    
                    <!-- Wash Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.85rem;">
                      <div>
                        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                          <span style="font-size: 1.1rem; font-weight: 800; color: var(--accent-cyan);">
                            Wash #{{ wash.id }}
                          </span>
                          <span :class="['badge', wash.status === 'completed' ? 'badge-success' : 'badge-primary']" style="font-size: 0.75rem;">
                            {{ wash.status }}
                          </span>
                          <span v-if="wash.package" style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary);">
                            {{ wash.package.name }}
                          </span>
                        </div>

                        <!-- Vehicle and Washer Info -->
                        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.35rem; font-size: 0.8rem; color: var(--text-muted);">
                          <span v-if="wash.vehicle">
                            🚗 <strong>{{ wash.vehicle.make_model }}</strong> ({{ wash.vehicle.plate_number }})
                          </span>
                          <span v-if="wash.washer?.user?.name">
                            🧼 Washer: <strong style="color: var(--text-primary);">{{ wash.washer.user.name }}</strong>
                          </span>
                          <span>
                            🗓️ Scheduled: {{ wash.booking_date }} {{ wash.slot_time || '' }}
                          </span>
                        </div>
                      </div>

                      <!-- Date of Complete -->
                      <div style="text-align: right; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 6px; padding: 0.35rem 0.65rem;">
                        <div style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--accent-emerald);">
                          ✓ Date of Complete
                        </div>
                        <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
                          {{ formatDateTime(wash.updated_at || wash.booking_date) }}
                        </div>
                      </div>
                    </div>

                    <!-- Washer Completion Review / Remarks -->
                    <div style="margin-bottom: 0.85rem; background: rgba(0,0,0,0.25); border-left: 3px solid var(--accent-cyan); padding: 0.6rem 0.85rem; border-radius: 4px;">
                      <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--accent-cyan); margin-bottom: 0.2rem;">
                        📝 Washer Review &amp; Completion Notes
                      </div>
                      <div style="font-size: 0.88rem; color: var(--text-primary); font-style: italic; line-height: 1.4;">
                        "{{ wash.washer_review || 'Wash service completed and delivered.' }}"
                      </div>
                    </div>

                    <!-- Uploaded Photos Grid -->
                    <div style="margin-bottom: 0.75rem;">
                      <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: space-between;">
                        <span>📸 Uploaded Photos ({{ getWashPhotos(wash).length }})</span>
                        <span v-if="getWashPhotos(wash).length" class="text-muted" style="font-size: 0.7rem; text-transform: none;">Click photo to zoom</span>
                      </div>

                      <div v-if="getWashPhotos(wash).length" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 0.5rem;">
                        <div 
                          v-for="(photo, pIdx) in getWashPhotos(wash)" 
                          :key="pIdx"
                          style="position: relative; aspect-ratio: 4/3; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color); cursor: pointer; background: #000;"
                          @click="previewPhotoUrl = photo"
                          title="Click to zoom image">
                          <img :src="photo" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" />
                        </div>
                      </div>
                      <div v-else class="text-muted" style="font-size: 0.8rem; font-style: italic;">
                        No service photos uploaded for this wash.
                      </div>
                    </div>

                    <!-- Uploaded Video Proof -->
                    <div v-if="wash.service_video" style="margin-top: 0.75rem; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
                      <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--accent-emerald); margin-bottom: 0.4rem;">
                        🎥 Service Video Proof
                      </div>
                      <div style="max-width: 400px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); background: #000;">
                        <video controls :src="wash.service_video" style="width: 100%; max-height: 220px; display: block;"></video>
                      </div>
                    </div>

                  </div>
                </div>

                <div v-else class="text-center text-muted" style="padding: 1.5rem; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed var(--border-color);">
                  🚗 No wash completion SOP proofs or photos uploaded for this customer yet.
                </div>
              </div>

              <!-- Customer Support Tickets / Complaints Section -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                  <div>
                    <h4 style="margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">
                      <span>🎫</span> Support Tickets &amp; Complaints
                    </h4>
                    <p class="text-muted" style="margin: 0.2rem 0 0 0; font-size: 0.78rem;">
                      Tickets and grievances raised by this customer.
                    </p>
                  </div>
                  <span class="badge badge-amber" style="font-weight: 700;">
                    {{ selectedCustomer.support_tickets?.length || 0 }} Ticket(s)
                  </span>
                </div>

                <div v-if="selectedCustomer.support_tickets?.length" class="table-wrap">
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
                <div v-else class="text-center text-muted" style="padding: 1.5rem; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed var(--border-color);">
                  No support tickets or complaints recorded.
                </div>
              </div>
            </div>

          </div>
        </div>
        <div v-else class="text-center text-muted" style="padding: 3rem;">
          Loading details...
        </div>
      </div>
    </div>

    <!-- Photo Zoom Lightbox Modal -->
    <div v-if="previewPhotoUrl" class="modal-overlay" style="z-index: 1060; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(4px);" @click="previewPhotoUrl = null">
      <div style="position: relative; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center;" @click.stop>
        <button 
          class="btn btn-ghost" 
          style="position: absolute; top: -38px; right: 0; color: #fff; font-size: 1.4rem; padding: 0.2rem 0.5rem; line-height: 1;" 
          @click="previewPhotoUrl = null">✕</button>
        <img :src="previewPhotoUrl" style="max-width: 100%; max-height: 82vh; object-fit: contain; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 20px 40px rgba(0,0,0,0.6);" />
        <div style="margin-top: 0.75rem;">
          <a :href="previewPhotoUrl" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="color: #fff; border-color: rgba(255,255,255,0.4); font-size: 0.8rem;">
            ⤢ Open Full Resolution in New Tab
          </a>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import Swal from 'sweetalert2';

const route = useRoute();
const apiBase = computed(() => route.path.startsWith('/admin') ? '/api/admin/customers' : '/api/super-admin/customers');

const customers = ref([]);
const pagination = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
  per_page: 10
});

const filters = reactive({
  search: '',
  status: ''
});

const isModalOpen = ref(false);
const selectedCustomer = ref(null);
const activeTab = ref('overview');
const isToggling = ref(false);
const previewPhotoUrl = ref(null);

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getWashPhotos = (wash) => {
  if (!wash || !wash.service_photos) return [];
  let photos = wash.service_photos;
  if (typeof photos === 'string') {
    try { photos = JSON.parse(photos); } catch (e) { return []; }
  }
  if (typeof photos === 'string') {
    try { photos = JSON.parse(photos); } catch (e) { return []; }
  }
  return Array.isArray(photos) ? photos : [];
};

const washProofBookings = computed(() => {
  if (!selectedCustomer.value || !selectedCustomer.value.bookings) return [];
  return selectedCustomer.value.bookings.filter(b => {
    const photos = getWashPhotos(b);
    return photos.length > 0 || b.service_video || b.washer_review || b.status === 'completed';
  });
});

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'complaints', label: 'Complaints/SOP' }
];

const fetchCustomers = async (page = 1) => {
  try {
    const params = {
      page: page,
      search: filters.search,
      status: filters.status,
      per_page: pagination.value.per_page
    };
    
    const res = await axios.get(apiBase.value, {
      params
    });
    
    customers.value = res.data.data; // Laravel pagination wrapper
    pagination.value = {
      current_page: res.data.current_page,
      last_page: res.data.last_page,
      total: res.data.total,
      per_page: parseInt(res.data.per_page) || pagination.value.per_page
    };
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
    const res = await axios.get(`${apiBase.value}/${id}`);
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
      const res = await axios.post(`${apiBase.value}/${selectedCustomer.value.id}/toggle-status`, {});
      
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
