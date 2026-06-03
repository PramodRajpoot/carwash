<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <h3>Admin Management</h3>
      <button class="btn btn-primary" @click="openCreate">+ New Admin</button>
    </div>
    <div class="glass-card">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <table v-else style="width:100%;border-collapse:collapse;font-size:0.87rem">
        <thead><tr style="border-bottom:2px solid var(--border-color)">
          <th style="text-align:left;padding:0.6rem 0.5rem;color:var(--text-muted)">Name</th>
          <th style="text-align:left;padding:0.6rem 0.5rem;color:var(--text-muted)">Email</th>
          <th style="text-align:left;padding:0.6rem 0.5rem;color:var(--text-muted)">Role</th>
          <th style="text-align:left;padding:0.6rem 0.5rem;color:var(--text-muted)">Status</th>
          <th style="text-align:right;padding:0.6rem 0.5rem;color:var(--text-muted)">Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="a in admins" :key="a.id" style="border-bottom:1px solid var(--border-color)">
            <td style="padding:0.7rem 0.5rem;font-weight:600">{{ a.name }}</td>
            <td style="padding:0.7rem 0.5rem" class="text-muted">{{ a.email }}</td>
            <td style="padding:0.7rem 0.5rem"><span class="badge" :class="a.role === 'super_admin' ? 'badge-violet' : 'badge-cyan'" style="font-size:0.73rem">{{ a.role }}</span></td>
            <td style="padding:0.7rem 0.5rem"><span class="badge" :class="a.status === 'active' ? 'badge-emerald' : 'badge-rose'" style="font-size:0.73rem">{{ a.status }}</span></td>
            <td style="padding:0.7rem 0.5rem;text-align:right">
              <button class="btn btn-sm btn-ghost" @click="openEdit(a)">Edit</button>
              <button v-if="a.role !== 'super_admin'" class="btn btn-sm" style="background:rgba(239,68,68,0.15);color:#ef4444;margin-left:0.25rem" @click="del(a)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem" @click.self="modal = false">
      <div class="glass-card" style="width:100%;max-width:480px">
        <h4 style="margin-bottom:1rem">{{ form.id ? 'Edit' : 'Create' }} Admin</h4>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <input v-model="form.name" type="text" class="form-input" placeholder="Full Name" />
          <input v-model="form.email" type="email" class="form-input" placeholder="Email" />
          <input v-model="form.phone" type="text" class="form-input" placeholder="Phone" />
          <input v-if="!form.id" v-model="form.password" type="password" class="form-input" placeholder="Password" />
          <select v-model="form.role" class="form-input">
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select v-if="form.id" v-model="form.status" class="form-input">
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <div class="flex gap-2">
            <button class="btn btn-primary" @click="save" :disabled="saving" style="flex:1">{{ saving ? 'Saving…' : 'Save' }}</button>
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
  name: 'SuperAdminAdmins',
  data() {
    return { admins: [], loading: true, modal: false, saving: false, form: { id: null, name: '', email: '', phone: '', password: '', role: 'admin', status: 'active' } };
  },
  methods: {
    openCreate() { this.form = { id: null, name: '', email: '', phone: '', password: '', role: 'admin', status: 'active' }; this.modal = true; },
    openEdit(a) { this.form = { id: a.id, name: a.name, email: a.email, phone: a.phone, role: a.role, status: a.status }; this.modal = true; },
    async save() {
      this.saving = true;
      try {
        if (this.form.id) { await axios.put(`/api/super-admin/admins/${this.form.id}`, this.form); }
        else { await axios.post('/api/super-admin/admins', this.form); }
        this.modal = false; await this.load();
      } catch (e) { alert(e.response?.data?.message || 'Save failed.'); }
      finally { this.saving = false; }
    },
    async del(a) {
      if (!confirm(`Delete admin "${a.name}"?`)) return;
      await axios.delete(`/api/super-admin/admins/${a.id}`); await this.load();
    },
    async load() { const { data } = await axios.get('/api/super-admin/admins'); this.admins = data; this.loading = false; },
  },
  mounted() { this.load(); },
};
</script>
