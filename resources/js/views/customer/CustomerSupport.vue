<template>
  <div>
    <!-- Create Ticket -->
    <div class="glass-card" style="margin-bottom:1.5rem">
      <h4 style="margin-bottom:1rem">🎫 Raise a Support Ticket</h4>
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <input v-model="form.subject" type="text" class="form-input" placeholder="Subject — e.g. Service not completed on time" />
        <textarea v-model="form.body" class="form-input" rows="4" placeholder="Describe your issue in detail…" style="resize:vertical"></textarea>
        
        <!-- Image Attachment -->
        <div>
          <label style="display:block;font-size:0.82rem;font-weight:600;margin-bottom:0.35rem;color:var(--text-secondary)">
            Attach Image / Screenshot (Optional):
          </label>
          <div v-if="!imagePreview" 
               @click="$refs.fileInput.click()" 
               style="border:1.5px dashed var(--accent-cyan, #00b4ff);border-radius:var(--radius-sm, 8px);padding:1.25rem 1rem;text-align:center;cursor:pointer;background:rgba(0,180,255,0.04);transition:all 0.2s"
               @dragover.prevent
               @drop.prevent="handleDrop">
            <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileSelected" />
            <div style="font-size:1.6rem;margin-bottom:0.25rem">📸</div>
            <div style="font-size:0.9rem;font-weight:600;color:var(--text-main, #fff);margin-bottom:0.25rem">
              Click or drag & drop to upload screenshot / image
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted, #94a3b8);margin-bottom:0.6rem">Supports PNG, JPG, JPEG, WebP up to 10MB</div>
            <button type="button" class="btn btn-sm btn-outline" style="pointer-events:none;font-size:0.8rem;padding:0.3rem 0.9rem">
              📁 Browse Image
            </button>
          </div>
          <div v-else style="position:relative;display:inline-block;margin-top:0.25rem">
            <img :src="imagePreview" alt="Attachment Preview" style="max-height:160px;max-width:260px;border-radius:var(--radius-sm);border:1px solid var(--border-color);object-fit:cover;display:block" />
            <button type="button" 
                    @click="removeSelectedImage" 
                    class="btn btn-sm" 
                    style="position:absolute;top:6px;right:6px;background:rgba(239,68,68,0.9);color:#fff;border:none;padding:2px 8px;border-radius:999px;font-size:0.72rem;cursor:pointer">
              ✕ Remove
            </button>
          </div>
        </div>

        <button class="btn btn-primary" @click="submit" :disabled="submitting" style="align-self:flex-start">
          {{ submitting ? 'Submitting…' : 'Submit Ticket' }}
        </button>
      </div>
    </div>

    <!-- Tickets List -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">My Support Tickets</h4>
      <div v-if="loading" class="text-muted" style="padding:2rem;text-align:center">Loading…</div>
      <div v-else-if="tickets.length === 0" class="text-muted" style="padding:2rem;text-align:center">No tickets yet. Raise one above if you need help.</div>
      <div v-else>
        <div v-for="t in tickets" :key="t.id" class="glass-card" style="margin-bottom:0.75rem;cursor:pointer" @click="selected = selected?.id === t.id ? null : t">
          <div class="flex justify-between items-start">
            <div>
              <div style="font-weight:600">{{ t.subject }}</div>
              <div class="text-muted" style="font-size:0.8rem;margin-top:0.2rem">{{ formatDate(t.created_at) }} • Ticket #{{ t.id }}</div>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="t.image" title="Has image attachment" style="font-size:0.85rem">📎</span>
              <span class="badge" :class="statusClass(t.status)">{{ t.status.replace('_', ' ') }}</span>
            </div>
          </div>

          <!-- Expanded detail -->
          <div v-if="selected?.id === t.id" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-color)" @click.stop>
            <div class="text-muted" style="font-size:0.85rem;line-height:1.6;white-space:pre-wrap">{{ t.body }}</div>

            <!-- Attached Image -->
            <div v-if="t.image" style="margin-top:1rem">
              <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:0.4rem">ATTACHED SCREENSHOT / IMAGE:</div>
              <img :src="t.image" 
                   alt="Ticket attachment" 
                   @click="previewModalImage = t.image" 
                   style="max-height:160px;max-width:260px;border-radius:var(--radius-sm);border:1px solid var(--border-color);cursor:pointer;object-fit:cover;display:block;transition:opacity 0.2s"
                   title="Click to view full image" />
            </div>

            <!-- Admin Reply -->
            <div v-if="t.admin_reply" style="margin-top:1rem;background:rgba(6,182,212,0.08);border-left:3px solid var(--accent-cyan);padding:0.75rem 1rem;border-radius:0 var(--radius-sm) var(--radius-sm) 0">
              <div style="font-weight:600;font-size:0.8rem;color:var(--accent-cyan);margin-bottom:0.3rem">Admin Reply • {{ formatDate(t.replied_at) }}</div>
              <div style="font-size:0.85rem;line-height:1.6">{{ t.admin_reply }}</div>
              <div v-if="t.reply_image" style="margin-top:0.75rem">
                <div style="font-size:0.75rem;font-weight:600;color:var(--accent-cyan);margin-bottom:0.25rem">ATTACHMENT FROM ADMIN:</div>
                <img :src="t.reply_image" 
                     alt="Admin reply attachment" 
                     @click="previewModalImage = t.reply_image" 
                     style="max-height:150px;max-width:240px;border-radius:var(--radius-sm);border:1px solid rgba(6,182,212,0.3);cursor:pointer;object-fit:cover;display:block"
                     title="Click to view full image" />
              </div>
            </div>
            <div v-else class="text-muted" style="font-size:0.8rem;margin-top:0.75rem">⏳ Awaiting admin response…</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <div v-if="previewModalImage" 
         @click="previewModalImage = null" 
         style="position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem">
      <div style="position:relative;max-width:90vw;max-height:90vh" @click.stop>
        <img :src="previewModalImage" alt="Full Image" style="max-width:100%;max-height:85vh;border-radius:var(--radius-sm);box-shadow:0 10px 30px rgba(0,0,0,0.5);display:block" />
        <button type="button" 
                @click="previewModalImage = null" 
                style="position:absolute;top:-14px;right:-14px;background:#ef4444;color:#fff;border:none;width:32px;height:32px;border-radius:50%;font-weight:bold;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)">
          ✕
        </button>
        <div style="text-align:center;margin-top:0.5rem">
          <a :href="previewModalImage" target="_blank" class="text-muted" style="font-size:0.8rem;text-decoration:underline;color:#cbd5e1">Open in new tab ↗</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CustomerSupport',
  data() {
    return {
      tickets: [],
      form: { subject: '', body: '' },
      selectedFile: null,
      imagePreview: null,
      loading: true,
      submitting: false,
      selected: null,
      previewModalImage: null,
    };
  },
  methods: {
    formatDate(d) {
      return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    },
    statusClass(s) {
      return { open: 'badge-amber', in_progress: 'badge-cyan', closed: 'badge-emerald' }[s] || 'badge-amber';
    },
    onFileSelected(e) {
      const file = e.target.files?.[0];
      this.processFile(file);
    },
    handleDrop(e) {
      const file = e.dataTransfer?.files?.[0];
      this.processFile(file);
    },
    processFile(file) {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, WebP, etc.).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size exceeds 10MB limit.');
        return;
      }
      this.selectedFile = file;
      this.imagePreview = URL.createObjectURL(file);
    },
    removeSelectedImage() {
      this.selectedFile = null;
      if (this.imagePreview) {
        URL.revokeObjectURL(this.imagePreview);
        this.imagePreview = null;
      }
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    async submit() {
      if (!this.form.subject.trim() || !this.form.body.trim()) {
        alert('Please provide both subject and description.');
        return;
      }
      this.submitting = true;
      try {
        const formData = new FormData();
        formData.append('subject', this.form.subject.trim());
        formData.append('body', this.form.body.trim());
        if (this.selectedFile) {
          formData.append('image', this.selectedFile);
        }

        await axios.post('/api/support/tickets', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        this.form = { subject: '', body: '' };
        this.removeSelectedImage();
        await this.load();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to submit ticket.');
      } finally {
        this.submitting = false;
      }
    },
    async load() {
      try {
        const { data } = await axios.get('/api/support/tickets');
        this.tickets = data;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.load();
  },
};
</script>
