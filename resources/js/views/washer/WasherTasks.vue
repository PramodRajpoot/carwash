<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h3>My Assigned Cleaning Tasks</h3>
        <p class="text-muted" style="font-size: 0.85rem;">View vehicle details, customer contact info, and update wash progress.</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="glass-card mb-4 p-4 flex flex-wrap gap-3 items-end" style="background: var(--bg-primary); margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;">
      <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Search</label>
        <input v-model="filters.search" class="form-input" placeholder="Order ID, Customer, Plate..." />
      </div>
      <div class="form-group" style="min-width: 150px; margin-bottom: 0;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Status</label>
        <select v-model="filters.status" class="form-select">
          <option value="">All Tasks</option>
          <option value="assigned">Assigned / To Do</option>
          <option value="ongoing">Wash In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div class="form-group" style="min-width: 140px; margin-bottom: 0;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-muted);">Date</label>
        <input v-model="filters.date" type="date" class="form-input" />
      </div>
      <button class="btn btn-ghost" @click="clearFilters" v-if="hasFilters" title="Clear Filters" style="padding: 0.5rem; height: 42px;">✖</button>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading assigned tasks...
    </div>

    <div v-else>
      <div v-if="filteredTasks.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Vehicle Details</th>
              <th>Service Details</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in paginatedTasks" :key="t.id">
              <td><strong>#{{ t.id }}</strong></td>
              <td>
                <div style="font-weight: 600; color: var(--text-primary);">{{ t.customer?.name }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  <a :href="'tel:' + t.customer?.phone" style="color: var(--accent-cyan); text-decoration: none;">
                    📞 {{ t.customer?.phone || 'No Phone' }}
                  </a>
                </div>
              </td>
              <td>
                <div style="font-weight: 600;">{{ t.vehicle?.make_model }}</div>
                <div style="font-size: 0.75rem; font-family: monospace;" class="text-secondary">{{ t.vehicle?.plate_number }}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: capitalize;">{{ t.vehicle?.vehicle_type }}</div>
              </td>
              <td>
                <div style="font-weight: 500;">{{ t.package?.name || 'Custom Package' }}</div>

                <!-- Package Wash Numbering: 1/4 in Green and Red -->
                <div v-if="t.package && t.package.max_bookings > 1" style="margin-top: 0.25rem;">
                  <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.72rem; font-weight: 700; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); padding: 1px 6px; border-radius: 4px;">
                    <span style="color: #10b981; font-weight: 800;">{{ getWashIndex(t) }}</span>
                    <span style="color: #94a3b8; font-weight: 600;">/</span>
                    <span style="color: #ef4444; font-weight: 800;">{{ t.package.max_bookings }}</span>
                    <span style="color: var(--text-muted); font-size: 0.65rem; font-weight: 500; margin-left: 2px;">Washes</span>
                  </span>
                </div>

                <div v-if="getAddons(t).length" style="margin-top: 0.25rem; display: flex; flex-direction: column; gap: 2px;">
                  <div v-for="(a, i) in getAddons(t)" :key="i" style="font-size: 0.72rem; color: var(--accent-cyan); display: flex; align-items: center; gap: 3px;">
                    <span style="color: #10b981; font-weight: 700;">+</span>
                    <span>{{ a.name }}</span>
                    <span v-if="a.price" class="text-muted" style="font-size: 0.68rem;">(₹{{ a.price }})</span>
                  </div>
                </div>
              </td>
              <td>
                <div style="font-weight: 500;">{{ t.booking_date }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">{{ t.slot_time }}</div>
              </td>
              <td>
                <span class="badge" :class="statusBadge(t.status)">{{ t.status }}</span>
                <div v-if="t.payment_status === 'partially_paid'" style="margin-top: 0.25rem;">
                  <span class="badge badge-amber" style="font-size: 0.65rem;" :title="t.payment_method === 'cod' ? 'Collect remaining balance in cash on completion' : 'Remaining balance to be paid online'">
                    ₹{{ (parseFloat(t.total_price) - parseFloat(t.paid_amount || 99)).toFixed(0) }} Due ({{ t.payment_method === 'cod' ? '💵 COD' : '💳 Online' }})
                  </span>
                </div>
                <div v-else-if="t.payment_status === 'paid'" style="margin-top: 0.25rem;">
                  <span class="badge badge-emerald" style="font-size: 0.65rem;">Paid</span>
                </div>
              </td>
              <td>
                <div class="flex gap-1">
                  <button v-if="t.status === 'assigned'" class="btn btn-sm btn-outline" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" @click="updateStatus(t.id, 'ongoing')">
                    ▶ Start Wash
                  </button>
                  <button v-else-if="t.status === 'ongoing'" class="btn btn-sm btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" @click="openCompleteModal(t)">
                    ✓ Complete Wash
                  </button>
                  <template v-else-if="t.status === 'completed'">
                    <span style="color: var(--accent-emerald); font-size: 0.85rem; font-weight: 600;">
                      ✓ Finished
                    </span>
                    <button v-if="(t.service_photos && t.service_photos.length) || t.service_video || t.washer_review" class="btn btn-sm btn-ghost" style="padding: 0.15rem 0.45rem; font-size: 0.72rem; color: var(--accent-cyan);" @click="openProofModal(t)" title="View service proof & review">
                      👁️ Proof
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredTasks.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.85rem; color: var(--text-muted);">Rows per page:</label>
          <select v-model="itemsPerPage" class="form-select" style="width: 80px; padding: 0.25rem 2rem 0.25rem 0.5rem; font-size: 0.85rem;" @change="currentPage = 1">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span class="text-muted" style="font-size: 0.85rem; margin-left: 0.5rem;">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredTasks.length) }} of {{ filteredTasks.length }}
          </span>
        </div>
        <div class="flex gap-1" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
          <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>

      <div v-if="!filteredTasks.length" class="empty-state">
        <div class="empty-icon">🚗</div>
        <p>No cleaning tasks found matching your criteria.</p>
      </div>
    </div>

    <!-- Complete Service Modal with Photos, Video & Review (Required) -->
    <div v-if="completeModalTask" class="modal-overlay" @click.self="closeCompleteModal">
      <div class="modal-content" style="max-width: 600px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.25rem;">Complete Wash Service</h3>
            <p class="text-secondary" style="font-size: 0.82rem; margin: 0.25rem 0 0 0;">
              Task #{{ completeModalTask.id }} — {{ completeModalTask.vehicle?.make_model }} ({{ completeModalTask.vehicle?.plate_number }})
            </p>
          </div>
          <button class="btn btn-ghost btn-sm" @click="closeCompleteModal" style="font-size: 1.2rem; padding: 0.2rem 0.5rem;">✕</button>
        </div>

        <div class="alert" style="font-size: 0.8rem; padding: 0.6rem 0.85rem; margin-bottom: 1rem; background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 8px; color: var(--accent-cyan);">
          ℹ️ Uploading <strong>service photos</strong>, a <strong>service video</strong>, and providing a <strong>completion review</strong> is mandatory to complete this service.
        </div>

        <form @submit.prevent="submitCompletion">
          <!-- Service Notes / Review -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="font-weight: 600; display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
              <span>📝 Service Review &amp; Notes <span style="color: var(--accent-rose); font-weight: 700;">*</span></span>
              <span class="text-muted" style="font-size: 0.75rem; font-weight: normal;">Min 5 characters</span>
            </label>
            <textarea 
              v-model="completeForm.review" 
              class="form-input" 
              rows="3" 
              placeholder="Detail the cleaning completed (e.g., Exterior foam wash done, tire shine applied, interior vacuumed, glass wiped. Vehicle inspected & delivered sparkling clean.)" 
              required
              style="width: 100%; resize: vertical; font-size: 0.88rem;"></textarea>
          </div>

          <!-- Service Photos Upload -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="font-weight: 600; display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
              <span>📸 Service Photos <span style="color: var(--accent-rose); font-weight: 700;">*</span></span>
              <span class="text-muted" style="font-size: 0.75rem; font-weight: normal;">{{ photoFiles.length }} photo(s) selected</span>
            </label>
            <p class="text-muted" style="font-size: 0.75rem; margin-top: 0; margin-bottom: 0.5rem;">
              Upload clear pictures of the finished vehicle (exterior, wheels, interior).
            </p>
            <div 
              style="border: 2px dashed rgba(6, 182, 212, 0.35); border-radius: 8px; padding: 1rem; text-align: center; cursor: pointer; background: rgba(6, 182, 212, 0.03);"
              @click="$refs.photoInput.click()">
              <input 
                type="file" 
                ref="photoInput" 
                accept="image/*" 
                multiple 
                style="display: none;" 
                @change="handlePhotoSelect" />
              <div style="font-size: 1.8rem; margin-bottom: 0.25rem;">📷</div>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--accent-cyan);">Click to Upload Service Photos</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">PNG, JPG, JPEG, WEBP (Max 20MB each)</div>
            </div>

            <!-- Photos Previews Grid -->
            <div v-if="photoPreviews.length" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;">
              <div 
                v-for="(p, idx) in photoPreviews" 
                :key="idx" 
                style="position: relative; width: 72px; height: 72px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);">
                <img :src="p" style="width: 100%; height: 100%; object-fit: cover;" />
                <button 
                  type="button" 
                  @click.stop="removePhoto(idx)" 
                  style="position: absolute; top: 2px; right: 2px; background: rgba(239,68,68,0.85); color: #fff; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">
                  ✕
                </button>
              </div>
            </div>
            <div v-if="photoError" style="color: var(--accent-rose); font-size: 0.75rem; margin-top: 0.35rem;">
              {{ photoError }}
            </div>
          </div>

          <!-- Service Video Upload -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="font-weight: 600; display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
              <span>🎥 Service Video <span style="color: var(--accent-rose); font-weight: 700;">*</span></span>
              <span class="text-muted" style="font-size: 0.75rem; font-weight: normal;">{{ videoFile ? (videoFile.size / (1024 * 1024)).toFixed(1) + ' MB' : 'Required' }}</span>
            </label>
            <p class="text-muted" style="font-size: 0.75rem; margin-top: 0; margin-bottom: 0.5rem;">
              Upload a 360° walkaround video clip showing the completed wash.
            </p>
            <div 
              style="border: 2px dashed rgba(16, 185, 129, 0.35); border-radius: 8px; padding: 1rem; text-align: center; cursor: pointer; background: rgba(16, 185, 129, 0.03);"
              @click="$refs.videoInput.click()">
              <input 
                type="file" 
                ref="videoInput" 
                accept="video/*" 
                style="display: none;" 
                @change="handleVideoSelect" />
              <div style="font-size: 1.8rem; margin-bottom: 0.25rem;">🎬</div>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--accent-emerald);">
                {{ videoFile ? 'Change Video: ' + videoFile.name : 'Click to Upload Service Video Proof' }}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">MP4, MOV, WEBM, AVI (Max 100MB)</div>
            </div>

            <!-- Video Info Tag -->
            <div v-if="videoFile" style="margin-top: 0.75rem; display: flex; align-items: center; justify-content: space-between; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 0.5rem 0.75rem; border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden;">
                <span>📹</span>
                <span style="font-size: 0.82rem; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ videoFile.name }}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">({{ (videoFile.size / (1024 * 1024)).toFixed(1) }} MB)</span>
              </div>
              <button type="button" class="btn btn-ghost btn-sm text-danger" style="padding: 0.1rem 0.4rem; font-size: 0.75rem;" @click="removeVideo">✕ Remove</button>
            </div>
            <div v-if="videoError" style="color: var(--accent-rose); font-size: 0.75rem; margin-top: 0.35rem;">
              {{ videoError }}
            </div>
          </div>

          <!-- Cash Payment Collection -->
          <div v-if="getDueAmount(completeModalTask) > 0" class="form-group" style="margin-bottom: 1.25rem; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 0.85rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-weight: 700; color: var(--accent-amber); font-size: 0.9rem;">💵 Cash Payment Collection</span>
              <span class="badge badge-amber" style="font-weight: 700; font-size: 0.82rem;">₹{{ getDueAmount(completeModalTask) }} Remaining</span>
            </div>
            <p class="text-muted" style="font-size: 0.75rem; margin-top: 0; margin-bottom: 0.6rem;">
              Payment Method: <strong>{{ completeModalTask.payment_method === 'cod' ? 'Cash on Delivery (COD)' : completeModalTask.payment_method }}</strong>
            </p>
            <label style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; cursor: pointer; font-weight: 600; color: var(--text-primary);">
              <input type="checkbox" v-model="completeForm.cash_collected" style="width: 18px; height: 18px; accent-color: var(--accent-amber);" />
              <span>I have collected full cash of ₹{{ getDueAmount(completeModalTask) }} from customer</span>
            </label>
          </div>
          <div v-else class="form-group" style="margin-bottom: 1.25rem; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 0.6rem 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>✓</span>
            <span style="font-size: 0.82rem; color: var(--accent-emerald); font-weight: 600;">
              Payment fully settled online (₹{{ completeModalTask.total_price }}). No cash collection needed.
            </span>
          </div>

          <!-- Buttons -->
          <div class="flex gap-2" style="margin-top: 1.5rem; justify-content: flex-end;">
            <button type="button" class="btn btn-ghost" @click="closeCompleteModal" :disabled="submitting">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting" style="min-width: 170px;">
              {{ submitting ? 'Uploading & Finishing...' : '✓ Complete Wash' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Service Proof Modal -->
    <div v-if="proofModalTask" class="modal-overlay" @click.self="proofModalTask = null">
      <div class="modal-content" style="max-width: 650px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.25rem;">Wash Proof #{{ proofModalTask.id }}</h3>
            <p class="text-secondary" style="font-size: 0.82rem; margin: 0.25rem 0 0 0;">
              {{ proofModalTask.vehicle?.make_model }} ({{ proofModalTask.vehicle?.plate_number }}) • {{ proofModalTask.package?.name }}
            </p>
          </div>
          <button class="btn btn-ghost btn-sm" @click="proofModalTask = null" style="font-size: 1.2rem; padding: 0.2rem 0.5rem;">✕</button>
        </div>

        <!-- Washer Notes / Review -->
        <div style="margin-bottom: 1.25rem;">
          <div style="font-weight: 600; font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem;">
            📝 Washer Service Review
          </div>
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.9rem; line-height: 1.5; color: var(--text-primary);">
            {{ proofModalTask.washer_review || 'No written review submitted.' }}
          </div>
        </div>

        <!-- Photos Gallery -->
        <div style="margin-bottom: 1.25rem;">
          <div style="font-weight: 600; font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem;">
            📸 Service Photos ({{ (proofModalTask.service_photos || []).length }})
          </div>
          <div v-if="(proofModalTask.service_photos || []).length" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.5rem;">
            <a 
              v-for="(photo, i) in proofModalTask.service_photos" 
              :key="i" 
              :href="photo" 
              target="_blank" 
              rel="noopener noreferrer" 
              style="display: block; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); aspect-ratio: 4/3; background: #000;">
              <img :src="photo" style="width: 100%; height: 100%; object-fit: cover;" />
            </a>
          </div>
          <div v-else class="text-muted" style="font-size: 0.85rem;">No photos available.</div>
        </div>

        <!-- Video Player -->
        <div style="margin-bottom: 1rem;">
          <div style="font-weight: 600; font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem;">
            🎥 Service Video
          </div>
          <div v-if="proofModalTask.service_video" style="border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); background: #000;">
            <video controls :src="proofModalTask.service_video" style="width: 100%; max-height: 320px; display: block;"></video>
          </div>
          <div v-else class="text-muted" style="font-size: 0.85rem;">No video uploaded.</div>
        </div>

        <div style="text-align: right; margin-top: 1.5rem;">
          <button class="btn btn-outline btn-sm" @click="proofModalTask = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';

export default {
  name: 'WasherTasks',
  data() {
    return {
      tasks: [],
      loading: true,
      submitting: false,
      currentPage: 1,
      itemsPerPage: 10,
      filters: {
        search: '',
        status: '',
        date: ''
      },

      // Completion modal state
      completeModalTask: null,
      completeForm: {
        review: '',
        cash_collected: false
      },
      photoFiles: [],
      photoPreviews: [],
      photoError: '',
      videoFile: null,
      videoError: '',

      // View Proof modal
      proofModalTask: null
    };
  },
  computed: {
    hasFilters() {
      return this.filters.search || this.filters.status || this.filters.date;
    },
    filteredTasks() {
      return this.tasks.filter(t => {
        if (this.filters.search) {
          const s = this.filters.search.toLowerCase();
          const matchId = String(t.id).includes(s);
          const matchCustomer = t.customer?.name?.toLowerCase().includes(s);
          const matchPlate = t.vehicle?.plate_number?.toLowerCase().includes(s);
          const matchModel = t.vehicle?.make_model?.toLowerCase().includes(s);
          if (!matchId && !matchCustomer && !matchPlate && !matchModel) return false;
        }
        if (this.filters.status && t.status !== this.filters.status) {
          return false;
        }
        if (this.filters.date && t.booking_date !== this.filters.date) {
          return false;
        }
        return true;
      });
    },
    paginatedTasks() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredTasks.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filteredTasks.length / this.itemsPerPage) || 1;
    }
  },
  watch: {
    filters: {
      deep: true,
      handler() {
        this.currentPage = 1;
      }
    }
  },
  methods: {
    clearFilters() {
      this.filters = { search: '', status: '', date: '' };
    },
    getAddons(t) {
      if (!t || !t.addon_services) return [];
      let addons = t.addon_services;
      if (typeof addons === 'string') {
        try { addons = JSON.parse(addons); } catch (e) { return []; }
      }
      if (typeof addons === 'string') {
        try { addons = JSON.parse(addons); } catch (e) { return []; }
      }
      return Array.isArray(addons) ? addons : [];
    },
    getWashIndex(t) {
      if (!t || !t.package || !t.package.max_bookings) return 1;
      const max = t.package.max_bookings;
      if (max <= 1) return 1;

      const custBookings = (this.tasks || [])
        .filter(b => b.customer_id === t.customer_id && b.package_id === t.package_id && b.status !== 'cancelled')
        .sort((a, b) => (new Date(a.created_at || a.booking_date || 0)) - (new Date(b.created_at || b.booking_date || 0)));

      const idx = custBookings.findIndex(b => b.id === t.id);
      if (idx === -1) return 1;
      return (idx % max) + 1;
    },
    statusBadge(s) {
      return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan';
    },
    getDueAmount(t) {
      if (!t) return 0;
      if (t.payment_status === 'paid') return 0;
      const total = parseFloat(t.total_price || 0);
      const paid = parseFloat(t.paid_amount || 0);
      return Math.max(0, parseFloat((total - paid).toFixed(2)));
    },
    async loadTasks() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/washer/tasks');
        this.tasks = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    async updateStatus(taskId, newStatus) {
      if (newStatus === 'completed') {
        const t = this.tasks.find(item => item.id === taskId);
        if (t) {
          this.openCompleteModal(t);
        }
        return;
      }
      try {
        await axios.put(`/api/washer/tasks/${taskId}/status`, { status: newStatus });
        this.loadTasks();
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || 'Failed to update task status.', 'error');
      }
    },
    openCompleteModal(t) {
      this.completeModalTask = t;
      this.completeForm.review = '';
      this.completeForm.cash_collected = this.getDueAmount(t) > 0;
      this.photoFiles = [];
      this.photoPreviews = [];
      this.photoError = '';
      this.videoFile = null;
      this.videoError = '';
    },
    closeCompleteModal() {
      this.completeModalTask = null;
      this.photoFiles = [];
      this.photoPreviews = [];
      this.videoFile = null;
    },
    handlePhotoSelect(e) {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      this.photoError = '';
      files.forEach(f => {
        if (!f.type.startsWith('image/')) {
          this.photoError = 'Only image files are allowed for photos.';
          return;
        }
        this.photoFiles.push(f);
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.photoPreviews.push(evt.target.result);
        };
        reader.readAsDataURL(f);
      });
      e.target.value = '';
    },
    removePhoto(index) {
      this.photoFiles.splice(index, 1);
      this.photoPreviews.splice(index, 1);
    },
    handleVideoSelect(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      this.videoError = '';
      if (!file.type.startsWith('video/')) {
        this.videoError = 'Please select a valid video file.';
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        this.videoError = 'Video file size must be less than 100MB.';
        return;
      }
      this.videoFile = file;
      e.target.value = '';
    },
    removeVideo() {
      this.videoFile = null;
      this.videoError = '';
    },
    async submitCompletion() {
      if (!this.completeForm.review.trim() || this.completeForm.review.trim().length < 5) {
        Swal.fire('Required Field', 'Please enter a detailed service review/notes (minimum 5 characters).', 'warning');
        return;
      }
      if (!this.photoFiles.length) {
        this.photoError = 'At least 1 service photo is required.';
        Swal.fire('Required Photos', 'Please upload at least one photo of the completed car wash.', 'warning');
        return;
      }
      if (!this.videoFile) {
        this.videoError = 'Service completion video is required.';
        Swal.fire('Required Video', 'Please upload a video proof showing the completed vehicle.', 'warning');
        return;
      }

      this.submitting = true;
      try {
        const formData = new FormData();
        formData.append('status', 'completed');
        formData.append('review', this.completeForm.review.trim());
        if (this.getDueAmount(this.completeModalTask) > 0) {
          formData.append('cash_collected', this.completeForm.cash_collected ? '1' : '0');
        }
        this.photoFiles.forEach(f => {
          formData.append('photos[]', f);
        });
        formData.append('video', this.videoFile);

        await axios.post(`/api/washer/tasks/${this.completeModalTask.id}/complete`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        this.closeCompleteModal();
        Swal.fire('Service Completed!', 'Wash service proof uploaded and marked as completed.', 'success');
        this.loadTasks();
      } catch (e) {
        let msg = e.response?.data?.message || 'Failed to complete wash service.';
        if (e.response?.data?.errors) {
          const firstErr = Object.values(e.response.data.errors).flat()[0];
          if (firstErr) msg = firstErr;
        }
        Swal.fire('Error', msg, 'error');
      }
      this.submitting = false;
    },
    openProofModal(t) {
      this.proofModalTask = t;
    }
  },
  mounted() {
    this.loadTasks();
  }
};
</script>
