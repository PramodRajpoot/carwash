<template>
  <div>
    <!-- Welcome banner with Franchise Center info -->
    <div class="glass-card mb-4 p-4" style="background: linear-gradient(135deg, rgba(0, 180, 255, 0.12), rgba(0, 112, 192, 0.05)); border: 1px solid rgba(0, 180, 255, 0.25); border-radius: 12px; margin-bottom: 1.5rem; padding: 1.5rem;">
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
                  <button v-else-if="t.status === 'ongoing'" class="btn btn-sm btn-primary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" @click="openCompleteModal(t)">
                    ✓ Complete
                  </button>
                  <template v-else-if="t.status === 'completed'">
                    <span style="color: var(--accent-emerald); font-size: 0.8rem; font-weight: 600;">
                      ✓ Done
                    </span>
                    <button v-if="(t.service_photos && t.service_photos.length) || t.service_video || t.washer_review" class="btn btn-sm btn-ghost" style="padding: 0.15rem 0.4rem; font-size: 0.72rem; color: var(--accent-cyan);" @click="openProofModal(t)" title="View service proof & review">
                      👁️ Proof
                    </button>
                  </template>
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
          ℹ️ Upload <strong>service photos</strong> and <strong>video clip</strong> to mark this wash booking as completed.
        </div>

        <form @submit.prevent="submitCompletion">
          <!-- Service Notes / Review (Optional) -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="font-weight: 600; display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
              <span>📝 Service Notes / Remarks <span class="text-muted" style="font-size: 0.75rem; font-weight: normal;">(Optional)</span></span>
            </label>
            <textarea 
              v-model="completeForm.review" 
              class="form-input" 
              rows="2" 
              placeholder="Optional notes: e.g. Exterior foam wash done, tire shine applied, interior vacuumed. Delivered sparkling clean." 
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
      loading: true,
      submitting: false,

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
  methods: {
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
      if (newStatus === 'completed') {
        const t = this.recentTasks.find(item => item.id === taskId);
        if (t) {
          this.openCompleteModal(t);
        }
        return;
      }
      try {
        await axios.put(`/api/washer/tasks/${taskId}/status`, { status: newStatus });
        this.loadDashboard();
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
      if (!this.photoFiles.length) {
        this.photoError = 'At least 1 service photo is required.';
        Swal.fire('Required Photos', 'Please upload at least one photo of the completed car wash.', 'warning');
        return;
      }

      this.submitting = true;
      try {
        const formData = new FormData();
        formData.append('status', 'completed');
        formData.append('review', this.completeForm.review?.trim() || 'Wash service completed successfully.');
        if (this.getDueAmount(this.completeModalTask) > 0) {
          formData.append('cash_collected', this.completeForm.cash_collected ? '1' : '0');
        }
        this.photoFiles.forEach(f => {
          formData.append('photos[]', f);
        });
        if (this.videoFile) {
          formData.append('video', this.videoFile);
        }

        await axios.post(`/api/washer/tasks/${this.completeModalTask.id}/complete`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        this.closeCompleteModal();
        Swal.fire('Service Completed!', 'Wash service proof uploaded and marked as completed.', 'success');
        this.loadDashboard();
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
    this.loadDashboard();
  }
};
</script>
