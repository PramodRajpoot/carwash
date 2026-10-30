<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <h3>Franchise Management</h3>
    </div>
    <div class="glass-card" style="overflow-x: auto;">
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="franchisees.length === 0" class="text-muted" style="text-align:center;padding:2rem">No franchise partners yet.</div>
      <table v-else class="table" style="width: 100%; text-align: left; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-muted);">
            <th style="padding: 1rem 0.5rem;">Owner Name</th>
            <th style="padding: 1rem 0.5rem;">City</th>
            <th style="padding: 1rem 0.5rem;">State</th>
            <th style="padding: 1rem 0.5rem;">Address</th>
            <th style="padding: 1rem 0.5rem;">Contact Info</th>
            <th style="padding: 1rem 0.5rem;">Royalty (₹)</th>
            <th style="padding: 1rem 0.5rem;">Agreement</th>
            <th style="padding: 1rem 0.5rem;">Status</th>
            <th style="padding: 1rem 0.5rem;">Performance</th>
            <th style="padding: 1rem 0.5rem;">Revenue</th>
            <th style="padding: 1rem 0.5rem;">Bookings (Total / Completed)</th>
            <th style="padding: 1rem 0.5rem; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in paginatedFranchisees" :key="f.id" style="border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
            <td style="padding: 1rem 0.5rem;">
              <div style="font-weight: 600;">{{ f.user?.name || '-' }}</div>
              <div class="text-muted" style="font-size: 0.75rem;">{{ f.center_name }}</div>
            </td>
            <td style="padding: 1rem 0.5rem;">{{ f.city || '-' }}</td>
            <td style="padding: 1rem 0.5rem;">{{ f.state || 'N/A' }}</td>
            <td style="padding: 1rem 0.5rem; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="f.address">
              {{ f.address || '-' }}
            </td>
            <td style="padding: 1rem 0.5rem;">
              <div>{{ f.user?.phone || '-' }}</div>
              <div class="text-muted" style="font-size: 0.75rem;">{{ f.user?.email || '-' }}</div>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <div style="font-weight: 600; color: var(--accent-cyan);">
                ₹{{ (f.royalty_percentage || 0).toLocaleString() }}
              </div>
            </td>
            <td style="padding: 1rem 0.5rem; font-size: 0.8rem;">
              <div :style="{ color: !f.agreement_expires_at ? 'var(--text-muted)' : (new Date(f.agreement_expires_at) < new Date() ? 'var(--accent-rose)' : 'var(--accent-emerald)') }">
                <span v-if="f.agreement_expires_at">Exp: {{ f.agreement_expires_at.split('T')[0] }}</span>
                <span v-else>No Date</span>
              </div>
              <div style="margin-top: 0.35rem; display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
                <template v-if="getDocs(f).length > 0">
                  <button 
                    type="button" 
                    @click="openDocumentsModal(f)" 
                    class="badge badge-cyan" 
                    style="border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font-weight: 500; font-size: 0.75rem;"
                    title="Click to view and manage all documents"
                  >
                    <span>📁</span>
                    <span>{{ getDocs(f).length }} Doc{{ getDocs(f).length > 1 ? 's' : '' }} (View)</span>
                  </button>
                </template>
                <button 
                  v-else 
                  type="button" 
                  @click="openDocumentsModal(f)" 
                  class="btn btn-xs btn-outline" 
                  style="font-size: 0.75rem; padding: 2px 7px;"
                  title="Upload documents"
                >
                  + Upload Doc
                </button>
              </div>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <span class="badge" :class="{ 'badge-emerald': f.status === 'active', 'badge-amber': f.status === 'inactive' || f.status === 'pending', 'badge-rose': f.status === 'suspended' || f.status === 'rejected' }">
                {{ (f.status || '').toUpperCase() }}
              </span>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <div v-if="f.total_orders > 0">
                {{ Math.round((f.completed_orders / f.total_orders) * 100) }}%
              </div>
              <div v-else class="text-muted">-</div>
            </td>
            <td style="padding: 1rem 0.5rem; font-weight: 600;">
              ₹{{ (f.total_revenue || 0).toLocaleString() }}
            </td>
            <td style="padding: 1rem 0.5rem; text-align: center;">
              {{ f.total_orders || 0 }} / <span style="color: var(--accent-emerald);">{{ f.completed_orders || 0 }}</span>
            </td>
            <td style="padding: 1rem 0.5rem;">
              <select class="form-input" style="padding: 0.25rem; font-size: 0.8rem; width: 120px;" @change="handleAction($event, f)">
                <option value="">-- Actions --</option>
                <option value="approve" v-if="f.status !== 'active'">Approve</option>
                <option value="inactive" v-if="f.status !== 'inactive'">Inactive</option>
                <option value="suspend" v-if="f.status !== 'suspended'">Suspend</option>
                <option value="reject" v-if="f.status !== 'rejected'">Reject</option>
                <option value="renew">Renew Agreement</option>
                <option value="upload">Manage Docs ({{ getDocs(f).length }})</option>
                <option value="delete_doc" v-if="getDocs(f).length > 0" style="color: var(--accent-rose);">Delete All Docs</option>
                <option value="view">View / Slots</option>
                <option value="edit">Edit</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div v-if="franchisees.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
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
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, franchisees.length) }} of {{ franchisees.length }} entries
          </span>
        </div>
        <div class="flex gap-1" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Previous</button>
          
          <template v-for="page in totalPages" :key="page">
            <button v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
              class="btn btn-sm" 
              :class="currentPage === page ? 'btn-primary' : 'btn-outline'"
              @click="currentPage = page">
              {{ page }}
            </button>
            <span v-else-if="page === currentPage - 2 || page === currentPage + 2" class="text-muted" style="padding: 0 0.25rem;">...</span>
          </template>
          
          <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>
    </div>

    <!-- Assign Slots / View Modal -->
    <div v-if="showSlotModal" class="modal-overlay" @click.self="showSlotModal = false">
      <div class="modal-content" style="max-width: 650px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3 style="margin: 0;">Franchise Details & Wash Slots</h3>
          <button class="btn btn-ghost btn-sm" @click="showSlotModal = false" style="padding: 0.2rem 0.5rem;">✕</button>
        </div>

        <div v-if="selectedFranchise" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; font-size: 0.9rem;">
            <div>
              <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Owner Info</div>
              <div style="font-weight: 600;">{{ selectedFranchise.user?.name || '-' }}</div>
              <div class="text-muted">{{ selectedFranchise.user?.phone || '-' }}</div>
              <div class="text-muted">{{ selectedFranchise.user?.email || '-' }}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Center Details</div>
              <div style="font-weight: 600;">{{ selectedFranchise.center_name || '-' }}</div>
              <div class="text-muted">{{ selectedFranchise.city || '-' }}, {{ selectedFranchise.state || 'N/A' }}</div>
              <div class="text-muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;" :title="selectedFranchise.address">{{ selectedFranchise.address || '-' }}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Performance</div>
              <div><span style="font-weight: 600; color: var(--accent-emerald);">{{ selectedFranchise.completed_orders || 0 }}</span> / {{ selectedFranchise.total_orders || 0 }} Bookings Completed</div>
              <div class="text-muted">Success Rate: {{ selectedFranchise.total_orders > 0 ? Math.round((selectedFranchise.completed_orders / selectedFranchise.total_orders) * 100) : 0 }}%</div>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Financials</div>
              <div>Revenue: <span style="font-weight: 600;">₹{{ (selectedFranchise.total_revenue || 0).toLocaleString() }}</span></div>
              <div class="text-muted">Royalty Amount: ₹{{ (selectedFranchise.royalty_percentage || 0).toLocaleString() }}</div>
            </div>
            <div style="grid-column: 1 / -1; border-top: 1px solid var(--border-color); padding-top: 1rem;">
              <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Agreement & Documents</div>
              <div style="display:flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
                <div>Expires: <span style="font-weight: 600;" :style="{ color: !selectedFranchise.agreement_expires_at ? 'var(--text-muted)' : (new Date(selectedFranchise.agreement_expires_at) < new Date() ? 'var(--accent-rose)' : 'var(--accent-emerald)') }">{{ selectedFranchise.agreement_expires_at ? selectedFranchise.agreement_expires_at.split('T')[0] : 'Not set' }}</span></div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span>Documents:</span>
                  <button 
                    type="button"
                    class="badge badge-cyan" 
                    style="border: none; cursor: pointer; padding: 3px 8px; font-weight: 500;"
                    @click="openDocumentsModal(selectedFranchise)"
                  >
                    📁 {{ getDocs(selectedFranchise).length }} Document(s) (Manage / View)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <h4 style="margin-bottom: 0.5rem;">Assign Wash Slots</h4>
        <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 1rem;">Select which time slots are available for <strong>{{ selectedFranchise?.center_name }}</strong></p>
        
        <div v-if="loadingSlots" class="text-center text-muted" style="padding: 2rem; background: var(--bg-secondary); border-radius: 8px;">Loading slots...</div>
        <div v-else>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem;">
            <div v-for="slot in allMasterSlots" :key="slot.id" style="display: flex; align-items: flex-start; gap: 0.5rem; background: var(--bg-secondary); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color);">
              <input type="checkbox" :id="'slot-'+slot.id" :value="slot.id" v-model="selectedSlotIds" style="width: 1.2rem; height: 1.2rem; accent-color: var(--accent-cyan); margin-top: 0.1rem;" />
              <label :for="'slot-'+slot.id" style="cursor: pointer; flex: 1; line-height: 1.3;">
                <div style="font-weight: 600;">{{ slot.name }}</div>
                <div class="text-muted" style="font-size: 0.8rem;">{{ slot.time_range }}</div>
              </label>
            </div>
          </div>
          
          <div v-if="error" class="alert alert-error" style="margin-top: 1rem;">{{ error }}</div>
          
          <div class="flex gap-2" style="margin-top: 2rem; justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 1rem;">
            <button class="btn btn-ghost" @click="showSlotModal = false">Cancel</button>
            <button class="btn btn-primary" @click="saveSlotAssignments" :disabled="savingSlots">
              {{ savingSlots ? 'Saving...' : 'Save Assignments' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Multi-Document Management Modal -->
    <div v-if="showDocumentsModal" class="modal-overlay" style="z-index: 1050;" @click.self="showDocumentsModal = false">
      <div class="modal-content" style="max-width: 820px; max-height: 90vh; display: flex; flex-direction: column;">
        
        <!-- Modal Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
          <div>
            <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>📁</span> Franchise Documents
            </h3>
            <p class="text-muted" style="margin: 0.25rem 0 0 0; font-size: 0.85rem;">
              Manage agreements & documents for <strong style="color: var(--text-primary);">{{ activeFranchiseForDocs?.center_name }}</strong> 
              <span v-if="activeFranchiseForDocs?.user?.name">({{ activeFranchiseForDocs.user.name }})</span>
            </p>
          </div>
          <button class="btn btn-ghost btn-sm" @click="showDocumentsModal = false" style="font-size: 1.1rem; line-height: 1; padding: 0.2rem 0.5rem;">✕</button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div style="overflow-y: auto; flex: 1; padding-right: 4px;">
          
          <!-- Upload Area (Supports Multi-File Upload) -->
          <div style="background: var(--bg-secondary); border: 2px dashed var(--border-color); border-radius: 8px; padding: 1.25rem; text-align: center; margin-bottom: 1.5rem;">
            <input 
              type="file" 
              ref="multiFileInput" 
              multiple 
              accept=".pdf,image/*" 
              @change="onFilesSelected" 
              style="display: none;" 
            />
            <div style="font-size: 2rem; margin-bottom: 0.4rem;">📤</div>
            <div style="font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem;">Upload Documents</div>
            <p class="text-muted" style="font-size: 0.85rem; margin: 0 0 0.85rem 0;">
              You can select and upload <strong>more than one document</strong> at a time (PDF, PNG, JPG, JPEG — up to 10MB each)
            </p>
            <button type="button" class="btn btn-sm btn-primary" @click="$refs.multiFileInput.click()">
              Choose Files to Upload
            </button>

            <!-- Pending Staged Files to Upload -->
            <div v-if="selectedFilesForUpload.length > 0" style="margin-top: 1rem; text-align: left; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.85rem;">
              <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <span>Selected to Upload ({{ selectedFilesForUpload.length }} files):</span>
                <span class="badge badge-amber" style="font-size: 0.75rem;">Pending Upload</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.4rem; max-height: 140px; overflow-y: auto;">
                <div v-for="(file, idx) in selectedFilesForUpload" :key="idx" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 0.45rem 0.65rem; border-radius: 4px; font-size: 0.8rem;">
                  <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
                    <span>{{ file.type.includes('pdf') ? '📄' : '🖼️' }}</span>
                    <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ file.name }}</span>
                    <span class="text-muted" style="font-size: 0.75rem;">({{ formatBytes(file.size) }})</span>
                  </div>
                  <button type="button" class="btn btn-ghost btn-xs" @click="removeSelectedFile(idx)" style="color: var(--accent-rose); padding: 2px 6px;" title="Remove this file">✕</button>
                </div>
              </div>
              <div style="margin-top: 0.85rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button type="button" class="btn btn-sm btn-ghost" @click="selectedFilesForUpload = []">Cancel All</button>
                <button type="button" class="btn btn-sm btn-primary" :disabled="uploadingDocs" @click="uploadSelectedDocuments">
                  {{ uploadingDocs ? 'Uploading...' : `Upload ${selectedFilesForUpload.length} Document(s)` }}
                </button>
              </div>
            </div>
          </div>

          <!-- Document Preview Section (Shown Above the Uploaded Documents) -->
          <div v-if="previewDoc" ref="previewBox" style="margin-bottom: 1.5rem; background: var(--bg-primary); border: 1.5px solid var(--accent-cyan); border-radius: 8px; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; gap: 0.75rem; flex-wrap: wrap;">
              <div style="font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
                <span style="flex-shrink: 0;">👁️ Previewing:</span>
                <span style="color: var(--accent-cyan); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="previewDoc.name || 'Document'">
                  {{ previewDoc.name || 'Document' }}
                </span>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0;">
                <a :href="getDocViewUrl(previewDoc)" target="_blank" class="btn btn-xs btn-outline" style="text-decoration: none;">Open In New Tab ↗</a>
                <button type="button" class="btn btn-xs btn-outline" @click="downloadDocumentFile(previewDoc)" title="Download">⬇️ Download</button>
                <button type="button" class="btn btn-xs btn-ghost" @click="previewDoc = null" style="color: var(--text-muted);">Close Preview ✕</button>
              </div>
            </div>

            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; min-height: 250px; display: flex; justify-content: center; align-items: center;">
              <template v-if="isImageDoc(previewDoc.path)">
                <img :src="getDocViewUrl(previewDoc)" style="max-width: 100%; max-height: 55vh; object-fit: contain; padding: 0.75rem;" />
              </template>
              <template v-else>
                <iframe :src="getDocViewUrl(previewDoc)" style="width: 100%; height: 55vh; border: none;"></iframe>
              </template>
            </div>
          </div>

          <!-- Uploaded Documents List -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
              <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                <span>All Uploaded Documents</span>
                <span class="badge badge-cyan" style="font-size: 0.75rem;">{{ getDocs(activeFranchiseForDocs).length }} total</span>
              </h4>
              <button 
                v-if="getDocs(activeFranchiseForDocs).length > 1" 
                type="button" 
                class="btn btn-xs btn-ghost" 
                @click="deleteDocument(activeFranchiseForDocs)"
                style="color: var(--accent-rose);"
              >
                Delete All
              </button>
            </div>

            <div v-if="getDocs(activeFranchiseForDocs).length === 0" style="text-align: center; padding: 2rem; background: var(--bg-secondary); border-radius: 8px; border: 1px dashed var(--border-color);" class="text-muted">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">📂</div>
              <div>No documents uploaded yet for this franchise.</div>
              <div style="font-size: 0.8rem; margin-top: 0.25rem;">Use the upload box above to add multiple documents.</div>
            </div>

            <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 0.85rem;">
              <div 
                v-for="(doc, idx) in getDocs(activeFranchiseForDocs)" 
                :key="doc.id || idx"
                style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.85rem; display: flex; flex-direction: column; justify-content: space-between;"
              >
                <!-- Thumbnail / Type Icon -->
                <div style="text-align: center; padding: 0.5rem 0; cursor: pointer; min-height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center;" @click="previewDocument(doc)">
                  <template v-if="isImageDoc(doc.path)">
                    <img :src="getDocViewUrl(doc)" style="max-height: 80px; max-width: 100%; object-fit: contain; border-radius: 4px; border: 1px solid var(--border-color); box-shadow: 0 2px 4px rgba(0,0,0,0.2);" />
                  </template>
                  <template v-else>
                    <div style="font-size: 2.5rem; line-height: 1;">📄</div>
                    <span class="badge badge-rose" style="font-size: 0.65rem; margin-top: 4px;">PDF</span>
                  </template>
                </div>

                <!-- Info -->
                <div style="margin: 0.5rem 0; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
                  <div style="font-weight: 600; font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="doc.name || 'Document ' + (idx + 1)">
                    {{ doc.name || 'Document ' + (idx + 1) }}
                  </div>
                  <div class="text-muted" style="font-size: 0.72rem; margin-top: 3px;">
                    <span v-if="doc.uploaded_at">{{ doc.uploaded_at.split('T')[0] }}</span>
                    <span v-if="doc.size"> • {{ formatBytes(doc.size) }}</span>
                  </div>
                </div>

                <!-- Action buttons -->
                <div style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
                  <button type="button" class="btn btn-xs btn-outline" @click="previewDocument(doc)" title="Preview Document">
                    👁️ View
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-xs btn-outline" 
                    :disabled="downloadingDocId === (doc.id || doc.path)" 
                    @click="downloadDocumentFile(doc)" 
                    title="Download Document"
                  >
                    <span v-if="downloadingDocId === (doc.id || doc.path)">⏳</span>
                    <span v-else>⬇️</span>
                  </button>
                  <button type="button" class="btn btn-xs btn-ghost" @click="deleteSingleDoc(doc)" title="Delete Document" style="color: var(--accent-rose); padding: 2px 6px;">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Modal Footer -->
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
          <button class="btn btn-ghost" @click="showDocumentsModal = false">Close</button>
        </div>

      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
import Swal from 'sweetalert2';

export default {
  name: 'AdminFranchisees',
  data() { 
    return { 
      franchisees: [], 
      loading: true,
      
      showSlotModal: false,
      loadingSlots: false,
      savingSlots: false,
      selectedFranchise: null,
      allMasterSlots: [],
      selectedSlotIds: [],
      currentPage: 1,
      itemsPerPage: 10,
      error: '',

      // Multi-Document Management state
      showDocumentsModal: false,
      activeFranchiseForDocs: null,
      selectedFilesForUpload: [],
      uploadingDocs: false,
      previewDoc: null,
      downloadingDocId: null
    }; 
  },
  computed: {
    paginatedFranchisees() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.franchisees.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.franchisees.length / this.itemsPerPage) || 1;
    }
  },
  methods: {
    async updateStatus(f, newStatus) {
      const actionLabels = {
        active: 'activate/approve',
        inactive: 'mark as inactive',
        suspended: 'suspend',
        rejected: 'reject'
      };
      const label = actionLabels[newStatus] || newStatus;
      const result = await Swal.fire({
        title: 'Confirm Action',
        text: `Are you sure you want to ${label} this franchise?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, proceed!'
      });
      if (!result.isConfirmed) return;

      try {
        const { data } = await axios.put(`/api/admin/franchisees/${f.id}/status`, { status: newStatus });
        f.status = newStatus;
        if (data.franchisee) {
          Object.assign(f, data.franchisee);
        }
        Swal.fire('Updated!', 'Status has been updated successfully.', 'success');
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || 'Failed to update status', 'error');
      }
    },
    handleAction(event, f) {
      const action = event.target.value;
      event.target.value = ""; // reset dropdown
      
      if (!action) return;

      if (action === 'approve') {
        this.updateStatus(f, 'active');
      } else if (action === 'inactive') {
        this.updateStatus(f, 'inactive');
      } else if (action === 'suspend') {
        this.updateStatus(f, 'suspended');
      } else if (action === 'reject') {
        this.updateStatus(f, 'rejected');
      } else if (action === 'view') {
        this.openSlotModal(f);
      } else if (action === 'edit') {
        this.openEditModal(f);
      } else if (action === 'renew') {
        this.renewAgreement(f);
      } else if (action === 'upload') {
        this.uploadDocument(f);
      } else if (action === 'delete_doc') {
        this.deleteDocument(f);
      }
    },
    async renewAgreement(f) {
      const today = new Date();
      today.setFullYear(today.getFullYear() + 1);
      const defaultDate = today.toISOString().split('T')[0];
      
      const { value: newDate } = await Swal.fire({
        title: 'Renew Agreement',
        html: `Select new expiration date for <strong>${f.center_name}</strong>`,
        input: 'date',
        inputValue: f.agreement_expires_at || defaultDate,
        showCancelButton: true,
        confirmButtonText: 'Renew'
      });

      if (newDate) {
        try {
          await axios.post(`/api/admin/franchisees/${f.id}/renew`, { agreement_expires_at: newDate });
          f.agreement_expires_at = newDate;
          Swal.fire('Renewed!', 'Agreement has been renewed successfully.', 'success');
        } catch (error) {
          Swal.fire('Error', 'Failed to renew agreement.', 'error');
        }
      }
    },
    getDocs(f) {
      if (!f) return [];
      if (Array.isArray(f.documents) && f.documents.length > 0) return f.documents;
      if (typeof f.documents === 'string') {
        try {
          const parsed = JSON.parse(f.documents);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
      if (f.document_path) {
        return [{
          id: 'legacy_1',
          name: f.document_path.split('/').pop(),
          path: f.document_path,
          uploaded_at: f.created_at || null
        }];
      }
      return [];
    },
    isImageDoc(path) {
      return !!(path && path.match(/\.(jpeg|jpg|png|gif|webp)$/i));
    },
    formatBytes(bytes) {
      if (!bytes || bytes === 0) return '';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },
    openDocumentsModal(f) {
      this.activeFranchiseForDocs = f;
      this.selectedFilesForUpload = [];
      this.previewDoc = null;
      this.showDocumentsModal = true;
    },
    onFilesSelected(e) {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        this.selectedFilesForUpload = [...this.selectedFilesForUpload, ...files];
      }
      if (this.$refs.multiFileInput) {
        this.$refs.multiFileInput.value = '';
      }
    },
    removeSelectedFile(idx) {
      this.selectedFilesForUpload.splice(idx, 1);
    },
    async uploadSelectedDocuments() {
      if (!this.selectedFilesForUpload.length || !this.activeFranchiseForDocs) return;
      
      const formData = new FormData();
      this.selectedFilesForUpload.forEach(file => {
        formData.append('documents[]', file);
      });

      this.uploadingDocs = true;
      try {
        const { data } = await axios.post(`/api/admin/franchisees/${this.activeFranchiseForDocs.id}/upload-document`, formData, {
          headers: {
            'Accept': 'application/json'
          }
        });

        this.activeFranchiseForDocs.documents = data.documents;
        this.activeFranchiseForDocs.document_path = data.franchisee.document_path;

        const target = this.franchisees.find(i => i.id === this.activeFranchiseForDocs.id);
        if (target) {
          target.documents = data.documents;
          target.document_path = data.franchisee.document_path;
        }

        this.selectedFilesForUpload = [];
        Swal.fire({
          icon: 'success',
          title: 'Uploaded!',
          text: data.message || 'Documents uploaded successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        let msg = 'Failed to upload documents.';
        if (error.response?.status === 413) {
          msg = 'File size is too large for the web server (HTTP 413 Request Entity Too Large). Please increase client_max_body_size in Nginx (e.g. 50M).';
        } else if (error.response?.status === 401) {
          msg = 'Your session has expired. Please log in again.';
        } else if (error.response?.data?.message) {
          msg = error.response.data.message;
        } else if (error.response?.data?.errors) {
          msg = Object.values(error.response.data.errors).flat().join('\n');
        }
        Swal.fire('Upload Failed', msg, 'error');
      } finally {
        this.uploadingDocs = false;
      }
    },
    getDocViewUrl(doc) {
      if (!doc || !doc.path) return '';
      if (this.activeFranchiseForDocs && this.activeFranchiseForDocs.id) {
        return `/api/admin/franchisees/${this.activeFranchiseForDocs.id}/documents/view?doc_id=${encodeURIComponent(doc.id || '')}&path=${encodeURIComponent(doc.path || '')}`;
      }
      const cleanPath = doc.path.replace(/^\/+/, '');
      return '/' + cleanPath;
    },
    async downloadDocumentFile(doc) {
      if (!doc) return;
      const docIdentifier = doc.id || doc.path;
      this.downloadingDocId = docIdentifier;
      const filename = doc.name || (doc.path ? doc.path.split('/').pop() : 'document.pdf');

      try {
        if (this.activeFranchiseForDocs && this.activeFranchiseForDocs.id) {
          const downloadApiUrl = `/api/admin/franchisees/${this.activeFranchiseForDocs.id}/documents/download?doc_id=${encodeURIComponent(doc.id || '')}&path=${encodeURIComponent(doc.path || '')}`;
          const response = await axios.get(downloadApiUrl, { responseType: 'blob' });
          const contentType = response.headers['content-type'] || 'application/pdf';
          const blob = new Blob([response.data], { type: contentType });
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
          return;
        }
      } catch (err) {
        if (err.response && err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            const json = JSON.parse(text);
            if (json && json.message) {
              Swal.fire('Document Error', json.message, 'warning');
              return;
            }
          } catch (_) {}
        }
        Swal.fire('Download Error', err.response?.data?.message || 'Failed to download document from server.', 'error');
        return;
      } finally {
        this.downloadingDocId = null;
      }

      // Fallback: direct download link with download query param
      const cleanPath = (doc.path || '').replace(/^\/+/, '');
      window.open(`/franchise_documents/${cleanPath.split('/').pop()}?download=1`, '_blank');
    },
    previewDocument(doc) {
      this.previewDoc = doc;
      this.$nextTick(() => {
        if (this.$refs.previewBox) {
          this.$refs.previewBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    },
    async deleteSingleDoc(doc) {
      const result = await Swal.fire({
        title: 'Delete Document',
        text: `Are you sure you want to delete "${doc.name || 'this document'}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--accent-rose)',
        confirmButtonText: 'Yes, delete it!'
      });
      if (!result.isConfirmed) return;

      try {
        const docId = doc.id || doc.path;
        await axios.delete(`/api/admin/franchisees/${this.activeFranchiseForDocs.id}/document`, {
          params: { doc_id: docId }
        });

        const currentDocs = this.getDocs(this.activeFranchiseForDocs);
        const updatedDocs = currentDocs.filter(d => (d.id || d.path) !== docId);

        this.activeFranchiseForDocs.documents = updatedDocs;
        this.activeFranchiseForDocs.document_path = updatedDocs.length > 0 ? updatedDocs[0].path : null;

        const target = this.franchisees.find(i => i.id === this.activeFranchiseForDocs.id);
        if (target) {
          target.documents = updatedDocs;
          target.document_path = updatedDocs.length > 0 ? updatedDocs[0].path : null;
        }

        if (this.previewDoc && (this.previewDoc.id || this.previewDoc.path) === docId) {
          this.previewDoc = null;
        }

        Swal.fire('Deleted!', 'Document has been removed.', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete document.', 'error');
      }
    },
    uploadDocument(f) {
      this.openDocumentsModal(f);
    },
    async deleteDocument(f) {
      const result = await Swal.fire({
        title: 'Delete All Documents',
        text: `Are you sure you want to delete ALL documents for ${f.center_name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--accent-rose)',
        confirmButtonText: 'Yes, delete all!'
      });

      if (result.isConfirmed) {
        try {
          await axios.delete(`/api/admin/franchisees/${f.id}/document`);
          f.document_path = null;
          f.documents = [];
          if (this.activeFranchiseForDocs && this.activeFranchiseForDocs.id === f.id) {
            this.activeFranchiseForDocs.document_path = null;
            this.activeFranchiseForDocs.documents = [];
            this.previewDoc = null;
          }
          Swal.fire('Deleted!', 'All documents have been deleted.', 'success');
        } catch (error) {
          Swal.fire('Error', error.response?.data?.message || 'Failed to delete documents', 'error');
        }
      }
    },
    showDocumentPopup(f) {
      this.openDocumentsModal(f);
    },
    async openEditModal(f) {
      const { value: formValues } = await Swal.fire({
        title: 'Edit Franchise',
        html: `
          <div style="display:flex; flex-direction:column; gap:10px; text-align:left; font-size: 0.9rem;">
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Owner Name</label>
              <input id="swal-name" class="form-input" style="width:100%" placeholder="Owner Name" value="${f.user?.name || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Email</label>
              <input id="swal-email" type="email" class="form-input" style="width:100%" placeholder="Email" value="${f.user?.email || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Phone</label>
              <input id="swal-phone" class="form-input" style="width:100%" placeholder="Phone" value="${f.user?.phone || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Center Name</label>
              <input id="swal-center" class="form-input" style="width:100%" placeholder="Center Name" value="${f.center_name || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">City</label>
              <input id="swal-city" class="form-input" style="width:100%" placeholder="City" value="${f.city || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Address</label>
              <input id="swal-address" class="form-input" style="width:100%" placeholder="Address" value="${f.address || ''}">
            </div>
            <div>
              <label style="font-weight:600; margin-bottom:0.25rem; display:block;">Royalty Amount (₹)</label>
              <input id="swal-royalty" type="number" step="0.01" class="form-input" style="width:100%" placeholder="Royalty Amount" value="${f.royalty_percentage || ''}">
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        preConfirm: () => {
          return {
            name: document.getElementById('swal-name').value,
            email: document.getElementById('swal-email').value,
            phone: document.getElementById('swal-phone').value,
            center_name: document.getElementById('swal-center').value,
            city: document.getElementById('swal-city').value,
            address: document.getElementById('swal-address').value,
            royalty_percentage: document.getElementById('swal-royalty').value,
            role: 'franchisee',
            status: f.user?.status || 'active'
          }
        }
      });

      if (formValues) {
        try {
          await axios.put(`/api/admin/users/${f.user_id || f.user?.id}`, formValues);
          Swal.fire('Saved!', 'Franchise details have been updated.', 'success');
          
          if (f.user) {
            f.user.name = formValues.name;
            f.user.email = formValues.email;
            f.user.phone = formValues.phone;
          }
          f.center_name = formValues.center_name;
          f.city = formValues.city;
          f.address = formValues.address;
          f.royalty_percentage = formValues.royalty_percentage;
        } catch (error) {
          console.error(error);
          Swal.fire('Error', error.response?.data?.message || 'Failed to update franchise', 'error');
        }
      }
    },
    async openSlotModal(f) {
      this.selectedFranchise = f;
      this.showSlotModal = true;
      this.loadingSlots = true;
      this.error = '';
      this.selectedSlotIds = [];
      
      try {
        const { data } = await axios.get(`/api/admin/franchisees/${f.id}/slots`);
        
        this.allMasterSlots = data.filter(s => s.status === 'active');
        this.selectedSlotIds = data.filter(s => s.assigned).map(s => s.id);
      } catch (e) {
        this.error = 'Failed to load slot data.';
      }
      this.loadingSlots = false;
    },
    async saveSlotAssignments() {
      this.savingSlots = true;
      this.error = '';
      try {
        await axios.post(`/api/admin/franchisees/${this.selectedFranchise.id}/slots`, {
          master_slot_ids: this.selectedSlotIds
        });
        this.showSlotModal = false;
      } catch (e) {
        this.error = 'Failed to save slot assignments.';
      }
      this.savingSlots = false;
    }
  },
  async mounted() {
    try { 
      const { data } = await axios.get('/api/admin/franchisees'); 
      this.franchisees = data; 
    }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>

