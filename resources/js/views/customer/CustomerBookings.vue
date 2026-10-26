<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom:1.5rem">
      <div><h3>My Bookings</h3><p class="text-muted" style="font-size:0.85rem">View, rebook, or manage your appointments.</p></div>
      <button class="btn btn-primary btn-sm" @click="openBookingModal()">+ Book Service</button>
    </div>
    <div v-if="bookings.length" class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Slot</th><th>Vehicle</th><th>Package</th><th>Total Price</th><th>Slot Advance</th><th>Discounts Used</th><th>Amount Paid</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="b in paginatedBookings" :key="b.id">
            <td>{{ b.booking_date }}</td>
            <td>
              <div style="font-weight: 600;">{{ b.slot_time }}</div>
              <div v-if="b.address" style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px; max-width: 170px; line-height: 1.3;" :title="b.address">
                📍 {{ b.address }}
              </div>
            </td>
            <td>{{ b.vehicle?.make_model }}</td>
            <td>
              <div>{{ b.package?.name || '-' }}</div>
              <div v-if="getAddons(b).length" style="font-size: 0.75rem; color: var(--accent-cyan); margin-top: 2px;">
                <span v-for="(addon, i) in getAddons(b)" :key="i">
                  + {{ addon.name }}<br v-if="i < getAddons(b).length - 1">
                </span>
              </div>
            </td>
            <td>₹{{ (parseFloat(b.total_price) + parseFloat(b.coupon_discount || 0) + parseFloat(b.epoints_used || 0) + parseFloat(b.earning_money_used || 0)).toFixed(2) }}</td>
            <td>
              <div v-if="b.payment_type === 'partial'">
                <span style="font-weight: 700; color: var(--accent-cyan); font-size: 0.88rem;">₹{{ parseFloat(b.advance_amount || 99).toFixed(2) }}</span>
                <div v-if="b.payment_status === 'partially_paid' || b.payment_status === 'paid'" style="font-size: 0.7rem; color: var(--accent-emerald); font-weight: 600;">
                  ✓ Paid
                </div>
                <div v-else style="font-size: 0.7rem; color: var(--accent-amber); font-weight: 600;">
                  ⏳ Unpaid
                </div>
              </div>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <div v-if="b.coupon_code || parseFloat(b.coupon_discount || 0) > 0" style="color: var(--accent-emerald); font-weight: 600; font-size: 0.82rem; margin-bottom: 2px;">
                🎟️ {{ b.coupon_code || 'Coupon' }}: -₹{{ parseFloat(b.coupon_discount || 0).toFixed(2) }}
              </div>
              <div v-if="b.epoints_used > 0" style="color: var(--accent-emerald); font-weight: 600; font-size: 0.82rem; margin-bottom: 2px;">
                {{ b.epoints_used }} pts
              </div>
              <div v-if="parseFloat(b.earning_money_used || 0) > 0" style="color: var(--accent-cyan); font-weight: 600; font-size: 0.82rem;">
                ₹{{ parseFloat(b.earning_money_used).toFixed(2) }}
              </div>
              <span v-if="!(b.coupon_code || parseFloat(b.coupon_discount || 0) > 0) && !(b.epoints_used > 0) && !(parseFloat(b.earning_money_used || 0) > 0)" class="text-muted">-</span>
            </td>
            <td style="font-weight: 600; color: var(--text-primary);">
              <div>
                ₹{{ (b.payment_status === 'paid' ? parseFloat(b.total_price) : parseFloat(b.paid_amount || 0)).toFixed(2) }}
              </div>
              <div v-if="b.payment_status === 'partially_paid'" style="font-size: 0.72rem; color: var(--accent-amber); font-weight: 600; margin-top: 2px;">
                ₹{{ (parseFloat(b.total_price) - parseFloat(b.paid_amount || 0)).toFixed(2) }} Due
              </div>
            </td>
            <td>
              <span v-if="b.payment_status === 'paid'" class="badge badge-emerald" style="font-size:0.7rem;">✓ Paid</span>
              <template v-else-if="b.payment_status === 'partially_paid'">
                <span class="badge badge-cyan" style="font-size:0.7rem;">₹{{ parseFloat(b.paid_amount || 0).toFixed(0) }} Paid (Partial)</span>
                <div style="margin-top: 3px;">
                  <span v-if="b.payment_method === 'cod'" class="badge badge-amber" style="font-size:0.65rem;" title="Remaining amount to be paid via Cash on Delivery">
                    💵 Rest via COD
                  </span>
                  <span v-else class="badge badge-cyan" style="font-size:0.65rem;" title="Remaining amount to be paid Online">
                    💳 Rest Online
                  </span>
                </div>
              </template>
              <span v-else-if="b.payment_status === 'pending_payment'" class="badge badge-amber" style="font-size:0.7rem;">⏳ Pending</span>
              <span v-else-if="b.payment_status === 'failed'" class="badge badge-rose" style="font-size:0.7rem;">✗ Failed</span>
              <span v-else class="badge badge-cyan" style="font-size:0.7rem;">{{ b.payment_method === 'cod' ? 'COD' : 'Unpaid' }}</span>
            </td>
            <td><span class="badge" :class="statusBadge(b.status)">{{ b.status }}</span></td>
            <td>
              <div class="flex gap-1" style="flex-wrap: wrap;">
                <button v-if="needsPayment(b)" class="btn btn-sm" style="background: linear-gradient(135deg, #6366f1, #06b6d4); color: #fff; border: none; font-weight: 600;" @click="retryPayment(b)" :disabled="payingBookingId === b.id">
                  {{ payingBookingId === b.id ? 'Processing...' : (b.payment_type === 'partial' ? '💳 Pay ₹99 Advance' : '💳 Pay Now') }}
                </button>
                <template v-else-if="b.payment_status === 'partially_paid' && b.status !== 'cancelled'">
                  <button 
                    v-if="b.payment_method !== 'cod'" 
                    class="btn btn-sm" 
                    style="background: #f59e0b; color: #111; border: none; font-weight: 700; font-size: 0.78rem;" 
                    @click="switchToCod(b)" 
                    title="Pay remaining balance in cash after car wash completion">
                    💵 Pay via COD
                  </button>
                  <button 
                    class="btn btn-sm" 
                    style="background: linear-gradient(135deg, #10b981, #06b6d4); color: #fff; border: none; font-weight: 600; font-size: 0.78rem;" 
                    @click="promptPayDue(b)" 
                    :disabled="payingBookingId === b.id" 
                    title="Choose to pay full or half due amount">
                    {{ payingBookingId === b.id ? 'Processing...' : '💳 Pay Due ₹' + (parseFloat(b.total_price) - parseFloat(b.paid_amount || 0)).toFixed(2) }}
                  </button>
                  <button 
                    v-if="b.payment_method === 'cod'" 
                    class="btn btn-sm btn-outline" 
                    style="font-size: 0.75rem; border-color: #06b6d4; color: #06b6d4;" 
                    @click="switchToOnline(b)" 
                    title="Switch remaining balance to Online payment">
                    💳 Switch to Online
                  </button>
                </template>
                <button v-if="canCancel(b)" class="btn btn-sm btn-danger" @click="cancel(b.id)">Cancel</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="bookings.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
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
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, bookings.length) }} of {{ bookings.length }}
        </span>
      </div>
      <div class="flex gap-1" v-if="totalPages > 1">
        <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
        <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
      </div>
    </div>
    <div v-else class="empty-state"><div class="empty-icon">📅</div><p>No bookings yet.</p></div>

    <!-- Book Service Modal -->
    <div v-if="showBookingModal" class="modal-overlay" @click.self="showBookingModal = false">
      <div class="modal-content">
        <h3>Book a Service</h3>
        <div v-if="bookingMsg" class="alert" :class="bookingError ? 'alert-error' : 'alert-success'">{{ bookingMsg }}</div>
        <form @submit.prevent="createBooking">
          <div class="form-group">
            <label>Vehicle</label>
            <select v-model="bf.vehicle_id" class="form-select" required>
              <option value="">Select Vehicle</option>
              <option v-for="v in vehicles" :key="v.id" :value="v.id">
                {{ v.make_model }} {{ v.plate_number ? '(' + v.plate_number + ')' : '' }} — {{ formatVehicleType(v.vehicle_type) }}
              </option>
            </select>
            <div v-if="vehicles.length === 0" class="text-muted" style="font-size: 0.78rem; margin-top: 0.35rem;">
              ⚠️ No registered vehicles found. <router-link to="/customer/vehicles" style="color: var(--accent-cyan); text-decoration: underline;">Add vehicle in My Garage</router-link>
            </div>
          </div>
          <div class="form-group"><label>Center</label>
            <select v-model="bf.franchisee_id" class="form-select" required @change="fetchSlots"><option value="">Select Center</option><option v-for="c in centers" :key="c.id" :value="c.id">{{ c.center_name }} — {{ c.city }}</option></select>
          </div>
          <div class="form-group"><label>Package</label>
            <select v-model="bf.package_id" class="form-select" required @change="bf.addon_ids = []"><option value="">Select Package</option><option v-for="p in packages" :key="p.id" :value="p.id">{{ p.name }} (₹{{ p.price }})</option></select>
          </div>
          
          <!-- Add-ons & Price Breakdown -->
          <div v-if="bf.package_id" style="margin-bottom: 1rem;">
            <!-- Add-on Services Section -->
            <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">
              ➕ Add-on Services <span class="text-muted" style="font-weight: 400; font-size: 0.8rem;">(pick from other packages)</span>
            </label>
            <div v-if="!bf.vehicle_id" class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">
              Please select a vehicle first to see available add-ons.
            </div>
            <div v-else-if="addonPackages.length === 0" class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">
              No add-ons available for this vehicle type.
            </div>
            <div v-else style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem; margin-bottom: 1rem;">
              <div v-for="pkg in addonPackages" :key="pkg.id"
                style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--border-color); cursor: pointer;"
                :style="{ background: isAddonSelected(pkg.id) ? 'rgba(16,185,129,0.08)' : 'transparent' }"
                @click="toggleAddon(pkg)">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <input type="checkbox" :checked="isAddonSelected(pkg.id)" style="accent-color: var(--accent-emerald); width: 16px; height: 16px; pointer-events: none;" />
                  <div>
                    <div style="font-weight: 600; font-size: 0.88rem;">{{ pkg.name }}</div>
                    <div class="text-muted" style="font-size: 0.72rem;">{{ pkg.vehicle_type }}</div>
                  </div>
                </div>
                <div style="font-weight: 700; color: var(--accent-cyan); font-size: 0.9rem; white-space: nowrap;">+ ₹{{ pkg.price }}</div>
              </div>
            </div>

            <!-- Price Breakdown -->
            <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.3rem;">
                <span>Base Plan Price</span>
                <span>₹{{ selectedBasePlan ? selectedBasePlan.price : '0.00' }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.3rem; color: var(--accent-cyan);">
                <span>Add-ons ({{ bf.addon_ids.length }} items)</span>
                <span>+ ₹{{ addonTotal.toFixed(2) }}</span>
              </div>
              <div v-if="appliedCouponDiscount > 0" style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.3rem; color: var(--accent-emerald); font-weight: 600;">
                <span>🎟️ Coupon ({{ appliedCouponCode }})</span>
                <span>- ₹{{ appliedCouponDiscount.toFixed(2) }}</span>
              </div>
              <div v-if="appliedEPoints > 0" style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.3rem; color: var(--accent-emerald);">
                <span>E-Points Discount</span>
                <span>- ₹{{ appliedEPoints.toFixed(2) }}</span>
              </div>
              <div v-if="appliedEarningMoney > 0" style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.3rem; color: var(--accent-cyan);">
                <span>Earning Money Applied</span>
                <span>- ₹{{ appliedEarningMoney.toFixed(2) }}</span>
              </div>
              <div style="border-top: 1px dashed var(--border-color); margin: 0.5rem 0; padding-top: 0.5rem; display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem;">
                <span>Total Amount</span>
                <span style="color: var(--accent-emerald);">₹{{ calculatedTotal.toFixed(2) }}</span>
              </div>
              <div v-if="bf.payment_type === 'partial' && calculatedTotal > 99" style="border-top: 1px solid var(--border-color); margin-top: 0.5rem; padding-top: 0.5rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.88rem; font-weight: 600; color: var(--accent-cyan); margin-bottom: 0.25rem;">
                  <span>Payable Now (Slot Booking Advance)</span>
                  <span>₹99.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--accent-amber); font-weight: 600;">
                  <span>Remaining Balance (Due after wash)</span>
                  <span>₹{{ (calculatedTotal - 99).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="grid grid-2 gap-2">
            <div class="form-group"><label>Date</label><input v-model="bf.booking_date" type="date" class="form-input" required @change="fetchSlots"></div>
            <div class="form-group"><label>Slot</label>
              <select v-model="bf.slot_time" class="form-select" required :disabled="slotsLoading || availableSlots.length === 0">
                <option value="" v-if="slotsLoading">Loading slots...</option>
                <option value="" v-else-if="!bf.franchisee_id || !bf.booking_date">Select center & date first</option>
                <option value="" v-else-if="availableSlots.length === 0">No slots available</option>
                <option v-else value="">Choose Slot</option>
                <option v-for="s in availableSlots" :key="s.time_range" :value="s.time_range" :disabled="s.current_bookings >= s.max_bookings">{{ s.time_range }} {{ s.current_bookings >= s.max_bookings ? '(Full)' : '' }}</option>
              </select>
            </div>
          </div>

          <!-- Service Address Section -->
          <div class="form-group" style="margin-top: 0.75rem; margin-bottom: 0.75rem;">
            <label style="font-weight: 700; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem; color: var(--text-primary); font-size: 0.92rem;">
              <span>📍 Doorstep Service Address <span style="color: var(--accent-rose); font-weight: bold;">*</span></span>
              <span v-if="savedAddress && addressChoice === 'saved'" style="font-size: 0.75rem; font-weight: 600; color: var(--accent-emerald);">
                ✓ Using saved address
              </span>
            </label>

            <!-- If user has a saved address on file -->
            <div v-if="savedAddress" style="display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 0.5rem;">
              <!-- Option 1: Use Saved Address -->
              <div 
                @click="chooseSavedAddress()" 
                :style="{
                  border: addressChoice === 'saved' ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                  background: addressChoice === 'saved' ? 'rgba(16,185,129,0.08)' : 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }">
                <div style="display: flex; align-items: flex-start; gap: 0.6rem;">
                  <input 
                    type="radio" 
                    value="saved" 
                    v-model="addressChoice" 
                    @change="chooseSavedAddress"
                    style="accent-color: var(--accent-emerald); margin-top: 0.2rem; cursor: pointer;" 
                  />
                  <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                      <span>Use Same Saved Address</span>
                      <span class="badge badge-emerald" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">Current Default</span>
                    </div>
                    <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.25rem; line-height: 1.35; word-break: break-word;">
                      {{ savedAddress }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Option 2: Enter New / Update Address -->
              <div 
                @click="chooseNewAddress()" 
                :style="{
                  border: addressChoice === 'new' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  background: addressChoice === 'new' ? 'rgba(6,182,212,0.08)' : 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <input 
                      type="radio" 
                      value="new" 
                      v-model="addressChoice" 
                      @change="chooseNewAddress"
                      style="accent-color: var(--accent-cyan); cursor: pointer;" 
                    />
                    <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">
                      Change or Update Address
                    </div>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 600;">
                    {{ addressChoice === 'new' ? 'Entering new' : 'Update address →' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Address input field (shown if user has no saved address OR chose 'new') -->
            <div v-if="!savedAddress || addressChoice === 'new'" style="margin-top: 0.4rem;">
              <textarea 
                v-model="bf.address" 
                class="form-input" 
                rows="3" 
                placeholder="Enter complete doorstep address (Flat/House No., Street/Society, Landmark, Area, City, Pincode)..."
                required
                style="resize: vertical; font-size: 0.88rem; line-height: 1.4;"
              ></textarea>
              
              <label style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.45rem; font-size: 0.82rem; color: var(--text-secondary); cursor: pointer;">
                <input type="checkbox" v-model="bf.save_as_default_address" style="accent-color: var(--accent-emerald); width: 15px; height: 15px;" />
                <span>Save this address as my default address for future bookings</span>
              </label>
            </div>
          </div>
          
          <!-- Coupon Code Input & Apply Button -->
          <div class="form-group" style="margin-top: 0.5rem; margin-bottom: 0.75rem;">
            <label style="font-weight: 600; display: block; margin-bottom: 0.35rem;">Coupon Code</label>
            <div style="display: flex; gap: 0.5rem;">
              <input 
                v-model="bf.coupon_code" 
                class="form-input" 
                placeholder="e.g. SDFS or WELCOME10" 
                style="text-transform: uppercase;"
                :disabled="couponApplied"
                @keyup.enter.prevent="applyCoupon()"
              />
              <button 
                v-if="!couponApplied" 
                type="button" 
                class="btn btn-primary" 
                style="white-space: nowrap; padding: 0.5rem 1.25rem; font-weight: 600;" 
                @click="applyCoupon()" 
                :disabled="couponLoading || !bf.coupon_code || !bf.coupon_code.trim()">
                {{ couponLoading ? 'Checking...' : 'Apply' }}
              </button>
              <button 
                v-else 
                type="button" 
                class="btn btn-ghost text-danger" 
                style="white-space: nowrap; padding: 0.5rem 0.85rem; border: 1px solid var(--border-color);" 
                @click="removeCoupon()">
                ✕ Remove
              </button>
            </div>
            <div v-if="couponFeedback" :style="{ color: couponSuccess ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontSize: '0.82rem', marginTop: '0.35rem', fontWeight: 600 }">
              {{ couponSuccess ? '✓ ' : '✗ ' }}{{ couponFeedback }}
            </div>
          </div>
          
          <!-- E-Points Checkbox Option -->
          <div v-if="bf.package_id && userPoints > 0" class="form-group" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; cursor: pointer; color: var(--text-primary);">
              <input type="checkbox" v-model="bf.use_epoints" style="width: 16px; height: 16px; accent-color: var(--accent-emerald);" />
              <span>Use E-Points</span>
            </label>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem; margin-left: 1.55rem; line-height: 1.4;">
              Redeeming: <strong style="color: var(--accent-emerald);">{{ pointsToBeDeducted }} pts</strong>
              (Available: {{ userPoints }} pts | Capped at 12.5% of wash)
            </div>
          </div>

          <!-- Earning Money Checkbox Option -->
          <div v-if="bf.package_id && userEarningMoney > 0" class="form-group" style="margin-top: 0.5rem; margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; cursor: pointer; color: var(--text-primary);">
              <input type="checkbox" v-model="bf.use_earning_money" style="width: 16px; height: 16px; accent-color: var(--accent-cyan);" />
              <span>Use Earning Money</span>
            </label>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem; margin-left: 1.55rem; line-height: 1.4;">
              Redeeming: <strong style="color: var(--accent-cyan);">₹{{ appliedEarningMoney.toFixed(2) }}</strong>
              (Available: ₹{{ parseFloat(userEarningMoney).toFixed(2) }} | Up to 100% of remaining price)
            </div>
          </div>

          <!-- Payment Choice: Pay Full Balance vs Minimum ₹99 Advance -->
          <div v-if="bf.package_id && calculatedTotal > 99" class="form-group" style="margin-top: 1rem; margin-bottom: 1.25rem;">
            <label style="font-weight: 700; display: block; margin-bottom: 0.6rem; color: var(--text-primary); font-size: 0.92rem;">
              💳 Choose Payment Option
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <!-- Option 1: Pay Full Balance -->
              <div 
                @click="bf.payment_type = 'full'" 
                :style="{
                  border: bf.payment_type === 'full' ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                  background: bf.payment_type === 'full' ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
                  <span style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">Pay Full Balance</span>
                  <input type="radio" value="full" v-model="bf.payment_type" style="accent-color: var(--accent-emerald); cursor: pointer;" />
                </div>
                <div style="font-size: 1.15rem; font-weight: 800; color: var(--accent-emerald); margin-bottom: 0.2rem;">
                  ₹{{ calculatedTotal.toFixed(2) }}
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.3;">
                  Pay 100% upfront now
                </div>
              </div>

              <!-- Option 2: Pay Minimum ₹99 Advance -->
              <div 
                @click="bf.payment_type = 'partial'" 
                :style="{
                  border: bf.payment_type === 'partial' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  background: bf.payment_type === 'partial' ? 'rgba(6,182,212,0.1)' : 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
                  <span style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">Pay ₹99 Advance</span>
                  <input type="radio" value="partial" v-model="bf.payment_type" style="accent-color: var(--accent-cyan); cursor: pointer;" />
                </div>
                <div style="font-size: 1.15rem; font-weight: 800; color: var(--accent-cyan); margin-bottom: 0.2rem;">
                  ₹99.00 <span style="font-size: 0.72rem; font-weight: normal; color: var(--text-muted);">now</span>
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.3;">
                  Rest ₹{{ (calculatedTotal - 99).toFixed(2) }} after wash
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2" style="margin-top:0.75rem">
            <button type="submit" class="btn btn-primary" :disabled="bookingLoading">
              {{ bookingLoading ? 'Processing...' : (
                calculatedTotal <= 0 
                  ? 'Book Now' 
                  : (bf.payment_type === 'partial' && calculatedTotal > 99
                      ? 'Book & Pay ₹99.00 (Advance)'
                      : 'Book & Pay ₹' + calculatedTotal.toFixed(2))
              ) }}
            </button>
            <button type="button" class="btn btn-ghost" @click="showBookingModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
<script>
import axios from 'axios';
import Swal from 'sweetalert2';

export default {
  name: 'CustomerBookings',
  data() {
    return {
      bookings: [],
      vehicles: [],
      centers: [],
      packages: [],
      availableSlots: [],
      slotsLoading: false,
      postponeSlots: [],
      postponeSlotsLoading: false,
      showBookingModal: false,
      bookingMsg: '',
      bookingError: false,
      bookingLoading: false,
      postponeBooking: null,
      payingBookingId: null,
      appliedCouponDiscount: 0,
      appliedCouponCode: '',
      couponApplied: false,
      couponLoading: false,
      couponFeedback: '',
      savedAddress: '',
      addressChoice: 'saved',
      bf: {
        vehicle_id: '',
        franchisee_id: '',
        package_id: '',
        booking_date: '',
        slot_time: '',
        address: '',
        save_as_default_address: true,
        payment_method: 'online',
        coupon_code: '',
        addon_ids: [],
        use_epoints: false,
        use_earning_money: false,
        payment_type: 'full'
      },
      pf: { booking_date: '', slot_time: '' },
      currentPage: 1,
      itemsPerPage: 10,
      userPoints: 0,
      userEarningMoney: 0
    };
  },
  computed: {
    paginatedBookings() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.bookings.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.bookings.length / this.itemsPerPage) || 1;
    },
    selectedBasePlan() {
      return this.packages.find(p => p.id == this.bf.package_id) || null;
    },
    addonPackages() {
      if (!this.selectedBasePlan || !this.bf.vehicle_id) return [];
      const v = this.vehicles.find(vh => vh.id == this.bf.vehicle_id);
      if (!v) return [];
      return this.packages.filter(p => p.id != this.bf.package_id && p.vehicle_type === v.vehicle_type);
    },
    selectedAddons() {
      return this.packages.filter(p => this.bf.addon_ids.includes(p.id));
    },
    addonTotal() {
      return this.selectedAddons.reduce((sum, a) => sum + parseFloat(a.price), 0);
    },
    appliedEPoints() {
      if (!this.bf.use_epoints || !this.bf.package_id) return 0;
      return this.pointsToBeDeducted;
    },
    pointsToBeDeducted() {
      if (!this.bf.package_id) return 0;
      const base = this.selectedBasePlan ? parseFloat(this.selectedBasePlan.price) : 0;
      const total = base + this.addonTotal;
      const totalAfterCoupon = Math.max(0, total - this.appliedCouponDiscount);
      const maxAllowed = Math.floor(totalAfterCoupon * 0.125);
      return Math.min(maxAllowed, this.userPoints);
    },
    appliedEarningMoney() {
      if (!this.bf.use_earning_money || !this.bf.package_id) return 0;
      let total = this.selectedBasePlan ? parseFloat(this.selectedBasePlan.price) : 0;
      total += this.addonTotal;
      total -= this.appliedCouponDiscount;
      total -= this.appliedEPoints;
      if (total <= 0) return 0;
      return Math.min(parseFloat(this.userEarningMoney || 0), total);
    },
    calculatedTotal() {
      const base = this.selectedBasePlan ? parseFloat(this.selectedBasePlan.price) : 0;
      const total = base + this.addonTotal;
      return Math.max(0, total - this.appliedCouponDiscount - this.appliedEPoints - this.appliedEarningMoney);
    }
  },
  watch: {
    'bf.package_id'(newVal) {
      if (!newVal) {
        this.bf.use_epoints = false;
        this.bf.use_earning_money = false;
        this.bf.payment_type = 'full';
        this.removeCoupon();
      } else if (this.couponApplied) {
        this.applyCoupon(true);
      }
    },
    'bf.vehicle_id'() {
      if (this.couponApplied) {
        this.applyCoupon(true);
      }
    },
    'bf.addon_ids': {
      deep: true,
      handler() {
        if (this.couponApplied) {
          this.applyCoupon(true);
        }
      }
    },
    showBookingModal(newVal) {
      if (!newVal) {
        this.removeCoupon();
      }
    },
    calculatedTotal(newVal) {
      if (newVal <= 99) {
        this.bf.payment_type = 'full';
      }
    }
  },
  methods: {
    async applyCoupon(silent = false) {
      if (!this.bf.coupon_code || !this.bf.coupon_code.trim()) {
        if (!silent) {
          this.couponFeedback = 'Please enter a coupon code';
          this.couponSuccess = false;
        }
        return;
      }

      const base = this.selectedBasePlan ? parseFloat(this.selectedBasePlan.price) : 0;
      const subtotal = base + this.addonTotal;
      if (subtotal <= 0) {
        if (!silent) {
          this.couponFeedback = 'Please select a package first';
          this.couponSuccess = false;
        }
        return;
      }

      if (!silent) this.couponLoading = true;
      try {
        const { data } = await axios.post('/api/bookings/apply-coupon', {
          code: this.bf.coupon_code.trim(),
          price: subtotal,
          vehicle_id: this.bf.vehicle_id
        });

        if (data.status === 'success') {
          this.appliedCouponDiscount = parseFloat(data.discount_amount) || 0;
          this.appliedCouponCode = data.code;
          this.couponApplied = true;
          this.couponSuccess = true;
          this.couponFeedback = `Coupon applied! Saved ₹${this.appliedCouponDiscount.toFixed(2)}`;
        } else {
          this.removeCoupon();
          this.couponFeedback = data.message || 'Coupon could not be applied';
          this.couponSuccess = false;
        }
      } catch (e) {
        const msg = e.response?.data?.message || 'Invalid or expired coupon code';
        this.removeCoupon();
        this.couponFeedback = msg;
        this.couponSuccess = false;
      } finally {
        if (!silent) this.couponLoading = false;
      }
    },
    removeCoupon() {
      this.appliedCouponDiscount = 0;
      this.appliedCouponCode = '';
      this.couponApplied = false;
      this.couponFeedback = '';
      this.couponSuccess = false;
      this.bf.coupon_code = '';
    },
    getAddons(b) {
      if (!b.addon_services) return [];
      if (typeof b.addon_services === 'string') {
        try { return JSON.parse(b.addon_services); } catch (e) { return []; }
      }
      return Array.isArray(b.addon_services) ? b.addon_services : [];
    },
    isAddonSelected(id) { return this.bf.addon_ids.includes(id); },
    toggleAddon(pkg) {
      if (this.isAddonSelected(pkg.id)) {
        this.bf.addon_ids = this.bf.addon_ids.filter(id => id !== pkg.id);
      } else {
        this.bf.addon_ids.push(pkg.id);
      }
    },
    statusBadge(s) { return { pending: 'badge-amber', assigned: 'badge-cyan', ongoing: 'badge-violet', completed: 'badge-emerald', cancelled: 'badge-rose', postponed: 'badge-amber' }[s] || 'badge-cyan'; },
    canCancel(b) { return ['pending', 'assigned'].includes(b.status); },
    canPostpone(b) { return ['pending', 'assigned'].includes(b.status); },
    needsPayment(b) {
      return ['pending_payment', 'unpaid', 'failed'].includes(b.payment_status) && 
             b.payment_method === 'online' && 
             b.status !== 'cancelled';
    },

    /**
     * Retry payment for an existing booking with pending payment.
     */
    async retryPayment(booking) {
      this.payingBookingId = booking.id;
      await this.initiateCashfreePayment(booking.id, 'full');
      this.payingBookingId = null;
    },

    /**
     * Prompt customer to pay full or half due amount when clicking Pay Due.
     */
    async promptPayDue(booking) {
      const total = parseFloat(booking.total_price) || 0;
      const paid = parseFloat(booking.paid_amount || 0);
      const due = Math.max(0, total - paid);
      const halfDue = Math.round((due / 2) * 100) / 100;

      const result = await Swal.fire({
        title: 'Pay Due Amount',
        html: `
          <div style="text-align: left; font-size: 0.9rem; margin-bottom: 0.5rem;">
            <p style="margin-bottom: 0.5rem; color: #94a3b8;">
              Booking <strong>#${booking.id}</strong> • Total Wash Price: <strong>₹${total.toFixed(2)}</strong>
            </p>
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 1rem;">
              <div style="font-size: 0.85rem; color: #94a3b8;">Already Paid: <strong style="color: #10b981;">₹${paid.toFixed(2)}</strong></div>
              <div style="font-size: 1.15rem; color: #f59e0b; font-weight: 800; margin-top: 4px;">Remaining Due: ₹${due.toFixed(2)}</div>
            </div>
            <p style="font-size: 0.9rem; margin-bottom: 0.75rem; color: #e2e8f0; font-weight: 600;">
              Would you like to pay the full remaining amount or half now?
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.6rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08); padding: 10px 14px; border-radius: 8px;">
                <div>
                  <div style="font-weight: 700; color: #10b981;">Option 1: Pay Full Amount</div>
                  <div style="font-size: 0.75rem; color: #94a3b8;">Clear 100% of remaining balance</div>
                </div>
                <div style="font-weight: 800; font-size: 1.05rem; color: #10b981;">₹${due.toFixed(2)}</div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(6, 182, 212, 0.4); background: rgba(6, 182, 212, 0.08); padding: 10px 14px; border-radius: 8px;">
                <div>
                  <div style="font-weight: 700; color: #06b6d4;">Option 2: Pay Half Amount (50%)</div>
                  <div style="font-size: 0.75rem; color: #94a3b8;">Remaining ₹${(due - halfDue).toFixed(2)} will remain due</div>
                </div>
                <div style="font-weight: 800; font-size: 1.05rem; color: #06b6d4;">₹${halfDue.toFixed(2)}</div>
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        showConfirmButton: true,
        confirmButtonText: `💳 Pay Full ₹${due.toFixed(2)}`,
        confirmButtonColor: '#10b981',
        showDenyButton: true,
        denyButtonText: `💳 Pay Half ₹${halfDue.toFixed(2)}`,
        denyButtonColor: '#06b6d4',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        this.payingBookingId = booking.id;
        await this.initiateCashfreePayment(booking.id, 'full');
        this.payingBookingId = null;
      } else if (result.isDenied) {
        this.payingBookingId = booking.id;
        await this.initiateCashfreePayment(booking.id, 'half');
        this.payingBookingId = null;
      }
    },

    formatVehicleType(t) {
      if (!t) return '';
      return t.toUpperCase().replace('_', ' ');
    },

    async openBookingModal(preselectedVehicleId = null) {
      this.bookingMsg = '';
      this.bookingError = false;
      if (!this.vehicles || this.vehicles.length === 0) {
        try {
          const { data } = await axios.get('/api/customer/vehicles');
          this.vehicles = data || [];
        } catch (e) {
          console.error('Failed to load vehicles for modal:', e);
        }
      }
      if (preselectedVehicleId) {
        this.bf.vehicle_id = preselectedVehicleId;
      }
      if (this.savedAddress) {
        this.addressChoice = 'saved';
        this.bf.address = this.savedAddress;
      } else {
        this.addressChoice = 'new';
        this.bf.address = '';
      }
      this.showBookingModal = true;
    },
    chooseSavedAddress() {
      this.addressChoice = 'saved';
      this.bf.address = this.savedAddress;
    },
    chooseNewAddress() {
      this.addressChoice = 'new';
      if (this.bf.address === this.savedAddress) {
        this.bf.address = '';
      }
    },

    async loadData() {
      try {
        const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
        const [dashRes, vhRes, ctRes, pkRes] = await Promise.allSettled([
          axios.get('/api/customer/dashboard'),
          axios.get('/api/customer/vehicles'),
          axios.get('/api/centers'),
          axios.get('/api/packages'),
        ]);

        if (vhRes.status === 'fulfilled') {
          this.vehicles = vhRes.value.data || [];
        }
        if (ctRes.status === 'fulfilled') {
          this.centers = ctRes.value.data || [];
        }
        if (pkRes.status === 'fulfilled') {
          this.packages = pkRes.value.data || [];
        }

        let dash = {};
        if (dashRes.status === 'fulfilled') {
          dash = dashRes.value.data || {};
          this.bookings = dash.upcoming_services || [];
          this.userPoints = dash.e_points || 0;
          this.userEarningMoney = dash.earning_money || 0;
        }

        // Load saved address
        this.savedAddress = (dash.address || user.address || '').trim();
        if (this.savedAddress) {
          this.addressChoice = 'saved';
          this.bf.address = this.savedAddress;
        } else {
          this.addressChoice = 'new';
        }

        // Check if query requested opening booking modal
        if (this.$route.query.book === 'true' || this.$route.query.vehicle_id) {
          const vId = this.$route.query.vehicle_id ? Number(this.$route.query.vehicle_id) : null;
          this.openBookingModal(vId);
        }
      } catch (e) { console.error('loadData error:', e); }
    },
    async fetchSlots() {
      this.bf.slot_time = '';
      this.availableSlots = [];
      if (!this.bf.franchisee_id || !this.bf.booking_date) return;
      this.slotsLoading = true;
      try {
        const { data } = await axios.get('/api/bookings/slots', { params: { franchisee_id: this.bf.franchisee_id, date: this.bf.booking_date } });
        this.availableSlots = data;
      } catch (e) { console.error(e); }
      this.slotsLoading = false;
    },
    async fetchPostponeSlots() {
      this.pf.slot_time = '';
      this.postponeSlots = [];
      if (!this.postponeBooking || !this.pf.booking_date) return;
      this.postponeSlotsLoading = true;
      try {
        const { data } = await axios.get('/api/bookings/slots', { params: { franchisee_id: this.postponeBooking.franchisee_id, date: this.pf.booking_date } });
        this.postponeSlots = data;
      } catch (e) { console.error(e); }
      this.postponeSlotsLoading = false;
    },

    /**
     * Create booking and initiate Cashfree checkout if online payment.
     */
    async createBooking() {
      this.bookingMsg = '';
      if (!this.bf.address || !this.bf.address.trim()) {
        this.bookingMsg = 'Please enter your doorstep service address.';
        this.bookingError = true;
        return;
      }

      this.bookingLoading = true;
      try {
        const payload = {
          ...this.bf,
          address: this.bf.address.trim(),
          save_as_default_address: this.addressChoice === 'new' ? this.bf.save_as_default_address : false
        };
        const { data } = await axios.post('/api/bookings', payload);

        if (data.saved_address) {
          this.savedAddress = data.saved_address;
          const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
          user.address = data.saved_address;
          localStorage.setItem('auth_user', JSON.stringify(user));
        }

        // If online payment is required, initiate Cashfree checkout
        if (data.requires_payment && data.booking) {
          await this.initiateCashfreePayment(data.booking.id);
          return; // bookingLoading will be reset inside the payment handler
        }

        // For COD / subscription, just show success
        this.bookingMsg = data.message;
        this.bookingError = false;
        this.showBookingModal = false;
        this.bf = {
          vehicle_id: '',
          franchisee_id: '',
          package_id: '',
          booking_date: '',
          slot_time: '',
          address: this.savedAddress || '',
          save_as_default_address: true,
          payment_method: 'online',
          coupon_code: '',
          addon_ids: [],
          use_epoints: false,
          use_earning_money: false,
          payment_type: 'full'
        };
        this.removeCoupon();
        Swal.fire({
          icon: 'success',
          title: 'Booking Confirmed!',
          text: data.message,
          timer: 3000,
          showConfirmButton: false
        });
        this.loadData();
      } catch (e) {
        this.bookingMsg = e.response?.data?.message || 'Booking failed';
        this.bookingError = true;
      }
      this.bookingLoading = false;
    },

    /**
     * Initiate Cashfree payment checkout.
     */
    async initiateCashfreePayment(bookingId, paymentSplit = 'full') {
      try {
        // Step 1: Create Cashfree order on server
        const { data } = await axios.post('/api/cashfree/create-order', {
          booking_id: bookingId,
          payment_split: paymentSplit
        });

        if (data.status !== 'success' || !data.payment_session_id) {
          Swal.fire('Payment Error', data.message || 'Could not initiate payment.', 'error');
          this.bookingLoading = false;
          return;
        }

        // Step 2: Open Cashfree Checkout using the JS SDK
        const cashfreeMode = data.environment === 'production' ? 'production' : 'sandbox';

        // eslint-disable-next-line no-undef
        const cashfreeInstance = Cashfree({ mode: cashfreeMode });

        this.showBookingModal = false;
        this.bookingLoading = false;

        cashfreeInstance.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: '_self',
          returnUrl: window.location.origin + '/cashfree/return?order_id={order_id}',
        }).then((result) => {
          if (result.error) {
            console.error('Cashfree checkout error:', result.error);
            Swal.fire('Payment Error', result.error.message || 'Payment could not be completed.', 'error');
          }
          if (result.redirect) {
            console.log('Redirecting to Cashfree...');
          }
        });

      } catch (e) {
        console.error('Cashfree payment error:', e);
        Swal.fire('Payment Error', e.response?.data?.message || 'Failed to initiate payment. Please try again.', 'error');
        this.bookingLoading = false;
      }
    },

    /**
     * Verify Cashfree payment after returning from checkout.
     */
    async verifyCashfreePayment(orderId) {
      Swal.fire({
        title: 'Verifying Payment...',
        html: 'Please wait while we confirm your payment with Cashfree.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      try {
        const { data } = await axios.get(`/api/cashfree/verify/${orderId}`);

        if (data.status === 'success' && (data.payment_status === 'paid' || data.payment_status === 'partially_paid')) {
          const isPartial = data.payment_status === 'partially_paid';
          if (isPartial) {
            const due = (parseFloat(data.total_price || data.booking?.total_price || 0) - parseFloat(data.paid_amount || 0)).toFixed(2);
            const paid = parseFloat(data.paid_amount || 0).toFixed(2);
            const title = parseFloat(data.paid_amount || 0) > 99 ? 'Payment Received! (Partial) 🎉' : 'Slot Booked with ₹99 Advance! 🎉';
            const result = await Swal.fire({
              icon: 'success',
              title: title,
              html: `
                <p style="font-size:1.05rem; margin-bottom:0.75rem;">Payment processed successfully for Booking <strong>#${data.booking_id}</strong>.</p>
                <p style="font-size:0.9rem; margin-bottom:0.75rem;">Total paid so far: <strong>₹${paid}</strong>.</p>
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px; margin: 12px 0; text-align: left;">
                  <div style="font-size: 0.95rem; color: #f59e0b; font-weight: 700; margin-bottom: 4px;">Remaining Due Amount: ₹${due}</div>
                  <div style="font-size: 0.82rem; color: var(--text-muted, #94a3b8);">Would you like to pay the remaining balance via <strong>Cash on Delivery (COD)</strong> upon wash completion?</div>
                </div>
              `,
              showCancelButton: true,
              confirmButtonText: '💵 Yes, Pay via COD',
              confirmButtonColor: '#f59e0b',
              cancelButtonText: '💳 Pay Online Later',
              cancelButtonColor: '#06b6d4'
            });

            if (result.isConfirmed) {
              try {
                await axios.post(`/api/bookings/${data.booking_id}/payment-method`, { payment_method: 'cod' });
                Swal.fire({
                  icon: 'success',
                  title: 'COD Method Selected! 💵',
                  text: `Remaining ₹${due} can be paid in cash after your car wash.`,
                  timer: 3000,
                  showConfirmButton: false
                });
              } catch (e) {
                console.error(e);
              }
            }
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Payment Confirmed! 🎉',
              html: `<p style="font-size:1.1rem; margin-bottom:0.5rem;">Your payment was received successfully!</p><p>Booking <strong>#${data.booking_id}</strong> is fully paid.</p>`,
              confirmButtonText: 'Great!',
              confirmButtonColor: '#10b981'
            });
          }
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Payment Pending',
            html: `<p>Order status: <strong>${data.order_status || 'Unknown'}</strong></p><p>If you completed the payment, it may take a moment to process. Please refresh the page in a few seconds.</p>`,
            confirmButtonText: 'OK'
          });
        }
      } catch (e) {
        Swal.fire('Verification Failed', 'Unable to verify payment status. Please contact support if money was deducted.', 'error');
      }

      this.loadData();
    },

    /**
     * Switch remaining balance payment method to COD.
     */
    async switchToCod(booking) {
      const due = (parseFloat(booking.total_price) - parseFloat(booking.paid_amount || 99)).toFixed(2);
      const result = await Swal.fire({
        title: 'Pay Remaining via COD?',
        text: `You can pay the remaining ₹${due} in cash at the service center upon completion of your car wash.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Pay via COD',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) return;

      try {
        const { data } = await axios.post(`/api/bookings/${booking.id}/payment-method`, { payment_method: 'cod' });
        booking.payment_method = 'cod';
        Swal.fire({
          icon: 'success',
          title: 'COD Selected',
          text: data.message || 'Payment method updated to COD.',
          timer: 2500,
          showConfirmButton: false
        });
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || 'Failed to update payment method', 'error');
      }
    },

    /**
     * Switch remaining balance payment method to Online.
     */
    async switchToOnline(booking) {
      try {
        const { data } = await axios.post(`/api/bookings/${booking.id}/payment-method`, { payment_method: 'online' });
        booking.payment_method = 'online';
        Swal.fire({
          icon: 'success',
          title: 'Online Payment Selected',
          text: data.message || 'Payment method updated to Online.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || 'Failed to update payment method', 'error');
      }
    },

    async cancel(id) {
      const result = await Swal.fire({
        title: 'Cancel Booking?',
        text: 'Are you sure you want to cancel this booking? The slot booking amount or any payment you have made will not be refunded.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      });

      if (!result.isConfirmed) return;

      try {
        await axios.post(`/api/bookings/${id}/cancel`);
        Swal.fire('Cancelled!', 'Your booking has been cancelled.', 'success');
        this.loadData();
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || 'Failed to cancel booking', 'error');
      }
    },
    openPostpone(b) { this.postponeBooking = b; this.pf.booking_date = ''; this.pf.slot_time = ''; this.postponeSlots = []; },
    async submitPostpone() {
      try { await axios.post(`/api/bookings/${this.postponeBooking.id}/postpone`, this.pf); this.postponeBooking = null; this.loadData(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    },
  },
  mounted() {
    this.loadData();

    // Check if returning from Cashfree payment (query param in history-mode URL)
    const urlParams = new URLSearchParams(window.location.search);
    const cashfreeOrderId = urlParams.get('cashfree_order_id');
    if (cashfreeOrderId) {
      this.verifyCashfreePayment(cashfreeOrderId);
      // Clean up the URL — remove query params
      history.replaceState(null, '', window.location.pathname);
    }
  },
};
</script>
