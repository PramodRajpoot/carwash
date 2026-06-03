<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <h3>Subscription Packages</h3>
      <button class="btn btn-primary" @click="openCreate">+ New Package</button>
    </div>

    <div class="glass-card">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="packages.length === 0" class="text-muted" style="text-align:center;padding:2rem">No packages yet. Create one!</div>
      <table v-else style="width:100%;border-collapse:collapse;font-size:0.87rem">
        <thead>
          <tr style="border-bottom:2px solid var(--border-color)">
            <th style="text-align:left;padding:0.6rem 0.5rem;color:var(--text-muted)">Package</th>
            <th style="text-align:left;padding:0.6rem 0.5rem;color:var(--text-muted)">Vehicle</th>
            <th style="text-align:right;padding:0.6rem 0.5rem;color:var(--text-muted)">Price</th>
            <th style="text-align:right;padding:0.6rem 0.5rem;color:var(--text-muted)">Washes</th>
            <th style="text-align:right;padding:0.6rem 0.5rem;color:var(--text-muted)">Days</th>
            <th style="text-align:right;padding:0.6rem 0.5rem;color:var(--text-muted)">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in packages" :key="p.id" style="border-bottom:1px solid var(--border-color)">
            <td style="padding:0.7rem 0.5rem">
              <div style="font-weight:600">{{ p.name }}</div>
              <div class="text-muted" style="font-size:0.78rem">{{ p.description }}</div>
            </td>
            <td style="padding:0.7rem 0.5rem"><span class="badge badge-cyan" style="font-size:0.73rem">{{ p.vehicle_type }}</span></td>
            <td style="padding:0.7rem 0.5rem;text-align:right;font-weight:600;color:var(--accent-emerald)">₹{{ p.price }}</td>
            <td style="padding:0.7rem 0.5rem;text-align:right">{{ p.max_bookings }}</td>
            <td style="padding:0.7rem 0.5rem;text-align:right">{{ p.frequency_days }}</td>
            <td style="padding:0.7rem 0.5rem;text-align:right">
              <button class="btn btn-sm btn-ghost" @click="openEdit(p)">Edit</button>
              <button class="btn btn-sm" style="background:rgba(239,68,68,0.15);color:#ef4444;margin-left:0.25rem" @click="del(p)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem" @click.self="modal = false">
      <div class="glass-card" style="width:100%;max-width:500px">
        <h4 style="margin-bottom:1rem">{{ form.id ? 'Edit' : 'Create' }} Package</h4>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <input v-model="form.name" type="text" class="form-input" placeholder="Package Name" />
          <textarea v-model="form.description" class="form-input" rows="2" placeholder="Description"></textarea>
          <select v-model="form.vehicle_type" class="form-input">
            <option value="">-- Vehicle Type --</option>
            <option v-for="t in vehicleTypes" :key="t.val" :value="t.val">{{ t.label }}</option>
          </select>
          <div class="grid grid-3 gap-2">
            <div><input v-model="form.price" type="number" class="form-input" placeholder="Price ₹" /></div>
            <div><input v-model="form.max_bookings" type="number" class="form-input" placeholder="Max Washes" /></div>
            <div><input v-model="form.frequency_days" type="number" class="form-input" placeholder="Days" /></div>
          </div>
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
  name: 'AdminPackages',
  data() {
    return {
      packages: [], loading: true, modal: false, saving: false,
      form: { id: null, name: '', description: '', vehicle_type: '', price: '', max_bookings: '', frequency_days: 30 },
      vehicleTypes: [
        { val: 'hatchback', label: 'Hatchback' }, { val: 'sedan', label: 'Sedan' }, { val: 'suv', label: 'SUV' },
        { val: 'commercial', label: 'Commercial' }, { val: 'bus', label: 'Bus' }, { val: 'volvo_bus', label: 'Volvo Bus' },
      ],
    };
  },
  methods: {
    openCreate() { this.form = { id: null, name: '', description: '', vehicle_type: '', price: '', max_bookings: '', frequency_days: 30 }; this.modal = true; },
    openEdit(p) { this.form = { ...p }; this.modal = true; },
    async save() {
      this.saving = true;
      try {
        if (this.form.id) { await axios.put(`/api/admin/packages/${this.form.id}`, this.form); }
        else { await axios.post('/api/admin/packages', this.form); }
        this.modal = false; await this.load();
      } catch (e) { alert(e.response?.data?.message || 'Save failed.'); }
      finally { this.saving = false; }
    },
    async del(p) {
      if (!confirm(`Delete "${p.name}"?`)) return;
      await axios.delete(`/api/admin/packages/${p.id}`);
      await this.load();
    },
    async load() { const { data } = await axios.get('/api/admin/packages'); this.packages = data; this.loading = false; },
  },
  mounted() { this.load(); },
};
</script>
