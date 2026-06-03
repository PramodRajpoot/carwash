<template>
  <div>
    <div class="glass-card">
      <h4 style="margin-bottom:1.5rem">⚙️ Platform Master Settings</h4>
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading settings…</div>
      <div v-else>
        <div v-for="group in groups" :key="group" style="margin-bottom:2rem">
          <div style="font-weight:700;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:var(--accent-cyan);margin-bottom:0.75rem;padding-bottom:0.35rem;border-bottom:1px solid var(--border-color)">{{ group }}</div>
          <div v-for="s in byGroup(group)" :key="s.key" class="flex justify-between items-center" style="padding:0.75rem 0;border-bottom:1px solid var(--border-color)">
            <div>
              <div style="font-weight:600;font-size:0.9rem">{{ s.label }}</div>
              <div class="text-muted" style="font-size:0.78rem">Key: {{ s.key }}</div>
            </div>
            <div>
              <input v-if="s.key.includes('notification')" type="checkbox" :checked="s.value === 'true'" @change="s.value = $event.target.checked ? 'true' : 'false'" style="width:18px;height:18px;cursor:pointer" />
              <input v-else v-model="s.value" type="text" class="form-input" style="width:160px;text-align:right" />
            </div>
          </div>
        </div>
        <button class="btn btn-primary" @click="save" :disabled="saving" style="margin-top:1rem">{{ saving ? 'Saving…' : 'Save All Settings' }}</button>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'SuperAdminSettings',
  data() { return { settings: [], loading: true, saving: false }; },
  computed: {
    groups() { return [...new Set(this.settings.map(s => s.group))]; },
  },
  methods: {
    byGroup(g) { return this.settings.filter(s => s.group === g); },
    async save() {
      this.saving = true;
      try { await axios.post('/api/super-admin/settings', { settings: this.settings.map(s => ({ key: s.key, value: s.value })) }); }
      catch (e) { alert('Save failed.'); }
      finally { this.saving = false; }
    },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/super-admin/settings'); this.settings = data; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
