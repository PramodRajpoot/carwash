<template>
  <div>
    <div class="dash-header-compact">
      <div>
        <h1>Partner Valuable Feedback</h1>
        <p class="text-muted">Manage partner testimonial videos shown on the Become a Partner page.</p>
      </div>
    </div>

    <div class="glass-card" style="margin-bottom:2rem">
      <h4 style="margin-bottom:1rem">Add Partner Feedback</h4>
      <form @submit.prevent="addFeedback">
        <div class="grid gap-2" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
          <input v-model="form.name" class="form-input" placeholder="Partner Name (Optional)" />
          <input v-model="form.city" class="form-input" placeholder="City (Optional)" />
          <textarea v-model="form.quote" class="form-input" style="height:42px" placeholder="Feedback / quote *" required></textarea>
          <input type="file" ref="thumbnailInput" @change="handleThumbnail" accept="image/*" class="form-input" />
          <input type="file" ref="videoInput" @change="handleVideo" accept="video/mp4,video/webm,video/ogg,video/quicktime" class="form-input" />
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:1rem">
          <button class="btn btn-primary" :disabled="adding">{{ adding ? 'Adding...' : '+ Add Partner Feedback' }}</button>
        </div>
      </form>
    </div>

    <div class="glass-card">
      <h4 style="margin-bottom:1rem">Partner Feedback Entries</h4>
      <div v-if="loading" class="text-center text-muted py-4">Loading...</div>
      <div v-else-if="feedbacks.length === 0" class="text-center text-muted py-4">No partner feedback found.</div>
      <div v-else style="overflow-x:auto">
        <table class="feedback-table">
          <thead><tr><th>Media</th><th>Partner</th><th>Quote</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            <tr v-for="item in feedbacks" :key="item.id">
              <td>
                <div class="media-preview">
                  <video v-if="item.video_path" controls :poster="item.thumbnail_path"><source :src="item.video_path" /></video>
                  <img v-else-if="item.thumbnail_path" :src="item.thumbnail_path" />
                  <span v-else class="text-muted text-sm">No media</span>
                </div>
              </td>
              <td>
                <template v-if="editingId !== item.id"><strong>{{ item.name || 'Partner' }}</strong><br /><span class="text-muted text-sm">{{ item.city || '-' }}</span></template>
                <div v-else class="flex flex-column gap-1">
                  <input v-model="editForm.name" class="form-input" placeholder="Partner name" />
                  <input v-model="editForm.city" class="form-input" placeholder="City" />
                </div>
              </td>
              <td>
                <template v-if="editingId !== item.id"><span class="feedback-quote">"{{ item.quote }}"</span></template>
                <div v-else>
                  <textarea v-model="editForm.quote" class="form-input" style="height:70px" required></textarea>
                  <input type="file" @change="handleEditThumbnail" accept="image/*" class="form-input mt-1" />
                  <input type="file" @change="handleEditVideo" accept="video/mp4,video/webm,video/ogg,video/quicktime" class="form-input mt-1" />
                </div>
              </td>
              <td>
                <label class="toggle-switch"><input type="checkbox" v-model="item.is_active" @change="toggleActive(item)" /><span class="toggle-slider"></span></label>
                <span class="text-muted text-sm" style="margin-left:.5rem">{{ item.is_active ? 'Active' : 'Hidden' }}</span>
              </td>
              <td>
                <div class="flex gap-1 justify-end">
                  <button v-if="editingId !== item.id" @click="startEdit(item)" class="btn btn-outline btn-sm">Edit</button>
                  <template v-else><button @click="saveEdit(item.id)" class="btn btn-primary btn-sm" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button><button @click="cancelEdit" class="btn btn-outline btn-sm">Cancel</button></template>
                  <button @click="deleteFeedback(item.id)" class="btn btn-danger btn-sm">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'SuperAdminPartnerValuableFeedback',
  data() { return { feedbacks: [], loading: true, adding: false, saving: false, editingId: null, form: { name:'', city:'', quote:'', thumbnail:null, video:null }, editForm: { name:'', city:'', quote:'', thumbnail:null, video:null } }; },
  mounted() { this.fetchFeedbacks(); },
  methods: {
    async fetchFeedbacks() { this.loading=true; try { const {data}=await axios.get('/api/super-admin/partner-valuable-feedback'); this.feedbacks=data; } catch(e){ console.error(e); } finally { this.loading=false; } },
    handleThumbnail(e){ this.validateFile(e,2048*1024,'Thumbnail must be under 2MB',f=>this.form.thumbnail=f); },
    handleVideo(e){ this.validateFile(e,50*1024*1024,'Video must be under 50MB',f=>this.form.video=f); },
    handleEditThumbnail(e){ this.validateFile(e,2048*1024,'Thumbnail must be under 2MB',f=>this.editForm.thumbnail=f); },
    handleEditVideo(e){ this.validateFile(e,50*1024*1024,'Video must be under 50MB',f=>this.editForm.video=f); },
    validateFile(e,max,msg,setFile){ const file=e.target.files[0]||null; if(file&&file.size>max){ alert(msg); e.target.value=''; return; } setFile(file); },
    async addFeedback(){ if(!this.form.quote)return; this.adding=true; try { const fd=new FormData(); fd.append('quote',this.form.quote); fd.append('is_active','1'); if(this.form.name)fd.append('name',this.form.name); if(this.form.city)fd.append('city',this.form.city); if(this.form.thumbnail)fd.append('thumbnail',this.form.thumbnail); if(this.form.video)fd.append('video',this.form.video); await axios.post('/api/super-admin/partner-valuable-feedback',fd); this.form={name:'',city:'',quote:'',thumbnail:null,video:null}; if(this.$refs.thumbnailInput)this.$refs.thumbnailInput.value=''; if(this.$refs.videoInput)this.$refs.videoInput.value=''; await this.fetchFeedbacks(); } catch(e){ alert(e.response?.data?.message||'Failed to add partner feedback'); } finally { this.adding=false; } },
    startEdit(item){ this.editingId=item.id; this.editForm={name:item.name||'',city:item.city||'',quote:item.quote,thumbnail:null,video:null}; },
    cancelEdit(){ this.editingId=null; this.editForm={name:'',city:'',quote:'',thumbnail:null,video:null}; },
    async saveEdit(id){ this.saving=true; try { const fd=new FormData(); fd.append('_method','PUT'); fd.append('quote',this.editForm.quote); fd.append('name',this.editForm.name); fd.append('city',this.editForm.city); if(this.editForm.thumbnail)fd.append('thumbnail',this.editForm.thumbnail); if(this.editForm.video)fd.append('video',this.editForm.video); await axios.post(`/api/super-admin/partner-valuable-feedback/${id}`,fd); this.cancelEdit(); await this.fetchFeedbacks(); } catch(e){ alert(e.response?.data?.message||'Failed to update feedback'); } finally { this.saving=false; } },
    async toggleActive(item){ try{ await axios.put(`/api/super-admin/partner-valuable-feedback/${item.id}`,{is_active:item.is_active}); }catch(e){ item.is_active=!item.is_active; alert('Failed to update status'); } },
    async deleteFeedback(id){ if(!confirm('Delete this partner feedback?'))return; try{ await axios.delete(`/api/super-admin/partner-valuable-feedback/${id}`); this.feedbacks=this.feedbacks.filter(f=>f.id!==id); }catch(e){ alert('Failed to delete feedback'); } }
  }
};
</script>

<style scoped>
.dash-header-compact{display:flex;align-items:center;margin-bottom:2rem}.feedback-table{width:100%;border-collapse:collapse}.feedback-table th,.feedback-table td{padding:.75rem;text-align:left;border:1px solid var(--border-color);vertical-align:middle}.feedback-table th{background:var(--bg-secondary)}.media-preview{width:120px;height:80px;display:flex;align-items:center;justify-content:center;overflow:hidden}.media-preview video,.media-preview img{width:100%;height:100%;object-fit:cover;border-radius:6px}.feedback-quote{font-style:italic;color:var(--text-secondary)}.toggle-switch{position:relative;display:inline-block;width:36px;height:20px}.toggle-switch input{opacity:0;width:0;height:0}.toggle-slider{position:absolute;cursor:pointer;inset:0;background:var(--border-color);border-radius:34px;transition:.3s}.toggle-slider:before{position:absolute;content:'';height:14px;width:14px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.3s}.toggle-switch input:checked+.toggle-slider{background:var(--accent-emerald)}.toggle-switch input:checked+.toggle-slider:before{transform:translateX(16px)}
</style>
