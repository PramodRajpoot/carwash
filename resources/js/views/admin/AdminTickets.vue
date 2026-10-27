<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
      <div>
        <h3 style="margin-bottom:0.25rem">Support Tickets</h3>
        <p class="text-muted" style="font-size:0.85rem;margin:0">Manage, view, and respond to support tickets.</p>
      </div>
      <div class="flex gap-1">
        <button v-for="s in statuses" :key="s.val" class="btn btn-sm" :class="filter === s.val ? 'btn-primary' : 'btn-ghost'" @click="filter = s.val">
          {{ s.label }} ({{ count(s.val) }})
        </button>
      </div>
    </div>

    <!-- Main List Card -->
    <div class="glass-card">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="filtered.length === 0" class="text-muted" style="text-align:center;padding:2rem">No tickets with this status.</div>
      <div v-else>
        <div v-for="t in paginatedTickets" :key="t.id" class="glass-card" style="margin-bottom:1rem;border:1px solid var(--border-color)">
          <!-- Top Row: Subject & Status -->
          <div class="flex justify-between items-start" style="margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem">
            <div>
              <div style="font-weight:600;font-size:1.05rem">{{ t.subject }}</div>
              <div class="text-muted" style="font-size:0.78rem;margin-top:0.2rem">
                {{ t.customer?.name || 'User' }} • {{ t.customer?.email }} <span v-if="t.customer?.phone">• {{ t.customer?.phone }}</span> • #{{ t.id }} • {{ formatDate(t.created_at) }}
              </div>
            </div>
            <select v-model="t.status" class="form-input" style="padding:0.25rem 0.5rem;font-size:0.8rem;width:auto;cursor:pointer" @change="save(t)">
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <!-- Ticket Message Body -->
          <div style="background:var(--bg-secondary);padding:0.85rem;border-radius:var(--radius-sm);font-size:0.875rem;line-height:1.6;white-space:pre-wrap;margin-bottom:0.75rem;border:1px solid rgba(255,255,255,0.05)">
            {{ t.body }}
          </div>

          <!-- Uploaded Ticket Image / Screenshot -->
          <div v-if="t.image" style="margin-bottom:0.85rem">
            <div style="font-size:0.76rem;font-weight:600;color:var(--text-muted);margin-bottom:0.35rem;text-transform:uppercase;letter-spacing:0.5px">
              📎 Attached Screenshot / Image:
            </div>
            <div style="display:inline-block;cursor:pointer;position:relative;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border-color)" @click="previewImage(t.image)">
              <img :src="t.image" alt="Ticket Screenshot" style="max-height:140px;max-width:220px;display:block;object-fit:cover;transition:transform 0.2s" />
              <div style="position:absolute;bottom:0;inset-x:0;background:rgba(0,0,0,0.6);color:#fff;font-size:0.7rem;text-align:center;padding:2px 0">
                🔍 Click to zoom
              </div>
            </div>
          </div>

          <!-- Existing Admin Reply -->
          <div v-if="t.admin_reply" style="background:rgba(6,182,212,0.08);border-left:3px solid var(--accent-cyan);padding:0.85rem 1rem;border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-size:0.85rem;margin-bottom:0.85rem">
            <div class="flex justify-between items-center" style="margin-bottom:0.3rem">
              <strong style="color:var(--accent-cyan)">Admin Reply</strong>
              <span class="text-muted" style="font-size:0.75rem" v-if="t.replied_at">{{ formatDate(t.replied_at) }}</span>
            </div>
            <div style="line-height:1.6;white-space:pre-wrap">{{ t.admin_reply }}</div>
            
            <!-- Existing Reply Image -->
            <div v-if="t.reply_image" style="margin-top:0.6rem">
              <div style="font-size:0.74rem;font-weight:600;color:var(--accent-cyan);margin-bottom:0.25rem">Attached Reply Image:</div>
              <img :src="t.reply_image" 
                   alt="Admin Reply Image" 
                   @click="previewImage(t.reply_image)" 
                   style="max-height:120px;max-width:200px;border-radius:var(--radius-sm);border:1px solid rgba(6,182,212,0.3);cursor:pointer;object-fit:cover;display:block"
                   title="Click to zoom" />
            </div>
          </div>

          <!-- Reply Box Form -->
          <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:0.75rem">
            <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.4rem">
              {{ t.admin_reply ? 'Send Another Reply:' : 'Reply to Ticket:' }}
            </div>
            <div style="display:flex;flex-direction:column;gap:0.5rem">
              <textarea v-model="t._reply" class="form-input" rows="2" style="width:100%;resize:vertical" placeholder="Type your reply…"></textarea>
              
              <!-- Reply Image Attachment Section -->
              <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:0.5rem">
                <div class="flex items-center gap-2">
                  <input :ref="'replyFile_' + t.id" type="file" accept="image/*" style="display:none" @change="onReplyFileSelected($event, t)" />
                  <button type="button" class="btn btn-ghost btn-sm" @click="$refs['replyFile_' + t.id][0]?.click()" style="padding:0.25rem 0.6rem;font-size:0.78rem;display:flex;align-items:center;gap:0.3rem">
                    <span>📷</span> Attach Image
                  </button>

                  <div v-if="t._replyPreview" style="display:flex;align-items:center;gap:0.4rem;background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px;border:1px solid var(--border-color)">
                    <img :src="t._replyPreview" style="width:24px;height:24px;object-fit:cover;border-radius:2px" />
                    <span style="font-size:0.72rem;color:var(--text-muted)">Image selected</span>
                    <button type="button" @click="removeReplyImage(t)" style="background:none;border:none;color:#ef4444;font-size:0.8rem;cursor:pointer;padding:0">✕</button>
                  </div>
                </div>

                <button class="btn btn-primary btn-sm" @click="reply(t)" :disabled="t._replying">
                  {{ t._replying ? 'Sending…' : 'Reply' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="filtered.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
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
              Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filtered.length) }} of {{ filtered.length }}
            </span>
          </div>
          <div class="flex gap-1" v-if="totalPages > 1">
            <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
            <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <div v-if="modalImageUrl" 
         @click="modalImageUrl = null" 
         style="position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem">
      <div style="position:relative;max-width:90vw;max-height:90vh" @click.stop>
        <img :src="modalImageUrl" alt="Full Image" style="max-width:100%;max-height:85vh;border-radius:var(--radius-sm);box-shadow:0 10px 30px rgba(0,0,0,0.5);display:block" />
        <button type="button" 
                @click="modalImageUrl = null" 
                style="position:absolute;top:-14px;right:-14px;background:#ef4444;color:#fff;border:none;width:32px;height:32px;border-radius:50%;font-weight:bold;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)">
          ✕
        </button>
        <div style="text-align:center;margin-top:0.5rem">
          <a :href="modalImageUrl" target="_blank" class="text-muted" style="font-size:0.8rem;text-decoration:underline;color:#cbd5e1">Open original image in new tab ↗</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminTickets',
  data() {
    return {
      tickets: [],
      loading: true,
      filter: 'open',
      currentPage: 1,
      itemsPerPage: 10,
      statuses: [
        { val: 'open', label: 'Open' },
        { val: 'in_progress', label: 'In Progress' },
        { val: 'closed', label: 'Closed' },
      ],
      // Lightbox
      modalImageUrl: null,
    };
  },
  computed: {
    filtered() {
      return this.tickets.filter(t => t.status === this.filter);
    },
    paginatedTickets() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filtered.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filtered.length / this.itemsPerPage) || 1;
    },
  },
  watch: {
    filter() {
      this.currentPage = 1;
    },
  },
  methods: {
    count(s) {
      return this.tickets.filter(t => t.status === s).length;
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    },
    previewImage(url) {
      this.modalImageUrl = url;
    },
    async save(t) {
      try {
        await axios.put(`/api/admin/tickets/${t.id}`, { status: t.status });
      } catch (e) {
        alert('Failed to update ticket status.');
      }
    },
    onReplyFileSelected(e, t) {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size exceeds 10MB limit.');
        return;
      }
      t._replyFile = file;
      t._replyPreview = URL.createObjectURL(file);
    },
    removeReplyImage(t) {
      t._replyFile = null;
      if (t._replyPreview) {
        URL.revokeObjectURL(t._replyPreview);
        t._replyPreview = null;
      }
      const ref = this.$refs['replyFile_' + t.id];
      if (ref && ref[0]) {
        ref[0].value = '';
      }
    },
    async reply(t) {
      if (!t._reply?.trim() && !t._replyFile) {
        alert('Please write a reply message or attach an image.');
        return;
      }
      t._replying = true;
      try {
        const formData = new FormData();
        if (t._reply?.trim()) {
          formData.append('admin_reply', t._reply.trim());
        }
        formData.append('status', 'in_progress');
        if (t._replyFile) {
          formData.append('reply_image', t._replyFile);
        }

        const { data } = await axios.post(`/api/admin/tickets/${t.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        t.admin_reply = data.ticket.admin_reply;
        t.reply_image = data.ticket.reply_image;
        t.replied_at = data.ticket.replied_at;
        t.status = 'in_progress';
        t._reply = '';
        this.removeReplyImage(t);
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to submit reply.');
      } finally {
        t._replying = false;
      }
    },
  },
  async mounted() {
    try {
      const { data } = await axios.get('/api/admin/tickets');
      this.tickets = data.map(t => ({
        ...t,
        _reply: '',
        _replyFile: null,
        _replyPreview: null,
        _replying: false,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  },
};
</script>
