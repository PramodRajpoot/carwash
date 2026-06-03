<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <h3>Blog Management</h3>
      <button class="btn btn-primary" @click="openCreate">+ New Post</button>
    </div>

    <div class="glass-card">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="posts.length === 0" class="text-muted" style="text-align:center;padding:2rem">No posts yet. Write your first one!</div>
      <div v-else>
        <div v-for="p in posts" :key="p.id" class="flex justify-between items-center" style="padding:0.85rem 0;border-bottom:1px solid var(--border-color)">
          <div>
            <div style="font-weight:600">{{ p.title }}</div>
            <div class="flex gap-2" style="margin-top:0.25rem">
              <span class="badge" :class="p.status === 'published' ? 'badge-emerald' : 'badge-amber'">{{ p.status }}</span>
              <span class="text-muted" style="font-size:0.78rem">{{ p.author?.name }} • {{ formatDate(p.published_at || p.created_at) }}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-ghost" @click="openEdit(p)">Edit</button>
            <button class="btn btn-sm" style="background:rgba(239,68,68,0.15);color:#ef4444" @click="del(p)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto" @click.self="modal = false">
      <div class="glass-card" style="width:100%;max-width:600px;max-height:90vh;overflow-y:auto">
        <h4 style="margin-bottom:1rem">{{ form.id ? 'Edit' : 'New' }} Blog Post</h4>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <input v-model="form.title" type="text" class="form-input" placeholder="Post Title" />
          <textarea v-model="form.content" class="form-input" rows="10" placeholder="Write your post content here…" style="resize:vertical"></textarea>
          <select v-model="form.status" class="form-input">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <div class="flex gap-2">
            <button class="btn btn-primary" @click="save" :disabled="saving" style="flex:1">{{ saving ? 'Saving…' : 'Save Post' }}</button>
            <button class="btn btn-ghost" @click="modal = false" style="flex:1">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'AdminBlog',
  data() {
    return {
      posts: [], loading: true, modal: false, saving: false,
      form: { id: null, title: '', content: '', status: 'draft' },
    };
  },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    openCreate() { this.form = { id: null, title: '', content: '', status: 'draft' }; this.modal = true; },
    openEdit(p) { this.form = { id: p.id, title: p.title, content: p.content, status: p.status }; this.modal = true; },
    async save() {
      this.saving = true;
      try {
        if (this.form.id) { await axios.put(`/api/admin/blog/${this.form.id}`, this.form); }
        else { await axios.post('/api/admin/blog', this.form); }
        this.modal = false; await this.load();
      } catch (e) { alert(e.response?.data?.message || 'Save failed.'); }
      finally { this.saving = false; }
    },
    async del(p) {
      if (!confirm(`Delete "${p.title}"?`)) return;
      await axios.delete(`/api/admin/blog/${p.id}`); await this.load();
    },
    async load() { const { data } = await axios.get('/api/admin/blog'); this.posts = data; this.loading = false; },
  },
  mounted() { this.load(); },
};
</script>
