<template>
  <div>
    <!-- Balance Cards -->
    <div class="grid grid-3 gap-3" style="margin-bottom:2rem">
      <div class="stat-card" style="border:1px solid var(--accent-emerald)">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald)">💰</div>
        <div class="stat-value" style="color:var(--accent-emerald)">₹{{ parseFloat(balance.earning_money || 0).toFixed(2) }}</div>
        <div class="stat-label">Earning Money</div>
      </div>
      <div class="stat-card" style="border:1px solid var(--accent-amber)">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-amber)">✅</div>
        <div class="stat-value" style="color:var(--accent-amber)">{{ balance.e_points }} pts</div>
        <div class="stat-label">Confirmed E-Points</div>
      </div>
      <div class="stat-card" style="border:1px solid var(--accent-cyan)">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">👥</div>
        <div class="stat-value" style="color:var(--accent-cyan)">{{ balance.referral_count || 0 }}</div>
        <div class="stat-label">Referred Users</div>
      </div>
    </div>

    <div class="grid grid-2 gap-4" style="margin-bottom:1.5rem">
      <!-- Bank & UPI Details -->
      <div class="glass-card">
        <h4 style="margin-bottom:1rem">Bank & UPI Details</h4>
        <div class="text-muted" style="font-size:0.85rem;margin-bottom:1rem">
          Add your bank details or UPI ID to receive payouts.
        </div>
        <form @submit.prevent="saveBankDetails">
          <div style="margin-bottom:1rem">
            <label class="form-label">Account Holder Name</label>
            <input type="text" v-model="bankDetails.account_holder_name" class="form-input" placeholder="Name as per bank account" />
          </div>
          <div class="grid grid-2 gap-2" style="margin-bottom:1rem">
            <div>
              <label class="form-label">Bank Name</label>
              <input type="text" v-model="bankDetails.bank_name" class="form-input" placeholder="e.g. HDFC Bank" />
            </div>
            <div>
              <label class="form-label">IFSC Code</label>
              <input type="text" v-model="bankDetails.ifsc_code" class="form-input" placeholder="IFSC Code" />
            </div>
          </div>
          <div style="margin-bottom:1rem">
            <label class="form-label">Account Number</label>
            <input type="text" v-model="bankDetails.account_number" class="form-input" placeholder="Account Number" />
          </div>
          <div style="margin-bottom:1rem">
            <label class="form-label">UPI ID (Optional)</label>
            <input type="text" v-model="bankDetails.upi_id" class="form-input" placeholder="yourname@upi" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%" :disabled="savingBank">
            {{ savingBank ? 'Saving...' : 'Save Bank Details' }}
          </button>
        </form>
      </div>

      <!-- Redemption / Withdrawal -->
      <div class="glass-card">
        <h4 style="margin-bottom:0.75rem">Withdraw Earning Money</h4>
        <div class="text-muted" style="font-size:0.85rem;margin-bottom:1rem">
          Request a withdrawal of your Earning Money to your bank account.
        </div>
        
        <div v-if="!hasBankDetails" class="alert alert-warning" style="margin-bottom:1rem">
          Please save your bank details first before requesting a withdrawal.
        </div>

        <div class="text-muted" style="font-size:0.82rem;margin-bottom:0.5rem">
          Minimum <strong style="color:var(--accent-cyan)">₹2,000.00</strong> required to withdraw.
        </div>
        <div style="background:var(--bg-secondary);border-radius:var(--radius-md);height:8px;margin-bottom:0.5rem">
          <div :style="{ width: Math.min((balance.earning_money / 2000) * 100, 100) + '%', background: balance.earning_money >= 2000 ? 'var(--gradient-btn)' : 'linear-gradient(135deg,#ef4444,#f97316)', borderRadius: 'var(--radius-md)', height: '100%', transition: 'width 0.4s' }"></div>
        </div>
        <div class="flex justify-between" style="font-size:0.78rem;color:var(--text-muted);margin-bottom:1.5rem">
          <span>₹{{ parseFloat(balance.earning_money || 0).toFixed(2) }}</span><span>₹2,000.00</span>
        </div>

        <div v-if="balance.earning_money >= 2000" class="flex gap-2 items-end">
          <div style="flex:1">
            <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Amount to Withdraw (₹)</label>
            <input type="number" v-model="redeemAmountMoney" :min="2000" :max="balance.earning_money" step="100" class="form-input" placeholder="2000" />
          </div>
          <button class="btn btn-primary" @click="requestWithdrawal" :disabled="redeeming || !hasBankDetails">{{ redeeming ? 'Requesting…' : 'Withdraw' }}</button>
        </div>
        <div v-else class="text-muted" style="font-size:0.85rem">You need ₹{{ (2000 - (balance.earning_money || 0)).toFixed(2) }} more to unlock withdrawals.</div>
      </div>
    </div>

    <!-- Transaction History -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">Transaction History</h4>
      <div v-if="loading" class="text-muted" style="padding:2rem;text-align:center">Loading…</div>
      <div v-else-if="transactions.length === 0" class="text-muted" style="padding:2rem;text-align:center">No transactions yet.</div>
      <div v-else>
        <div v-for="t in transactions" :key="t.id" class="flex justify-between items-center" style="padding:0.75rem 0;border-bottom:1px solid var(--border-color)">
          <div>
            <div style="font-weight:500;font-size:0.9rem">{{ t.description }}</div>
            <div class="flex gap-2" style="margin-top:0.25rem">
              <span class="badge" :class="t.status === 'confirmed' || t.status === 'completed' ? 'badge-emerald' : (t.status === 'failed' || t.status === 'rejected' ? 'badge-rose' : 'badge-amber')" style="font-size:0.7rem">{{ t.status }}</span>
              <span class="text-muted" style="font-size:0.78rem">{{ formatDate(t.created_at) }}</span>
            </div>
          </div>
          <div :style="{ fontWeight: 700, fontSize: '1rem', color: t.type === 'credit' ? 'var(--accent-emerald)' : '#ef4444' }">
            {{ t.type === 'credit' ? '+' : '-' }}<span v-if="t.source && (t.source.includes('earning') || t.source === 'referral_commission')">₹{{ t.amount }}</span><span v-else>{{ t.amount }} pts</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';

export default {
  name: 'CustomerWallet',
  data() {
    return {
      balance: {},
      transactions: [],
      bankDetails: {
        account_holder_name: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        upi_id: '',
      },
      loading: true,
      redeemAmountMoney: 2000,
      redeeming: false,
      savingBank: false
    };
  },
  computed: {
    hasBankDetails() {
      return this.bankDetails && ((this.bankDetails.account_number && this.bankDetails.ifsc_code) || this.bankDetails.upi_id);
    }
  },
  methods: {
    formatDate(d) {
      return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    },
    async saveBankDetails() {
      this.savingBank = true;
      try {
        const res = await axios.post('/api/wallet/bank-details', this.bankDetails);
        this.bankDetails = res.data.data;
        Swal.fire({ icon: 'success', title: 'Saved!', text: 'Bank details saved successfully.', timer: 1500, showConfirmButton: false });
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || 'Failed to save bank details.', 'error');
      } finally {
        this.savingBank = false;
      }
    },
    async requestWithdrawal() {
      if (!this.hasBankDetails) {
        Swal.fire('Error', 'Please save your bank details first.', 'error');
        return;
      }
      
      const amount = this.redeemAmountMoney;
      if (amount < 2000 || amount > this.balance.earning_money) {
        Swal.fire('Error', 'Invalid withdrawal amount. Minimum is ₹2,000.', 'error');
        return;
      }
      
      this.redeeming = true;
      try {
        await axios.post('/api/wallet/withdraw', { 
          amount: amount
        });
        Swal.fire({ icon: 'success', title: 'Success', text: 'Withdrawal request submitted successfully.', timer: 2000, showConfirmButton: false });
        await this.load();
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || 'Request failed.', 'error');
      } finally {
        this.redeeming = false;
      }
    },
    async load() {
      try {
        const [bal, hist, bank] = await Promise.all([
          axios.get('/api/wallet/balance'),
          axios.get('/api/wallet/history'),
          axios.get('/api/wallet/bank-details')
        ]);
        this.balance = bal.data;
        this.transactions = hist.data.data || [];
        if (bank.data) {
            this.bankDetails = Object.assign(this.bankDetails, bank.data);
        }
        this.loading = false;
      } catch (e) {
        console.error(e);
        this.loading = false;
      }
    },
  },
  mounted() {
    this.load();
  },
};
</script>

<style scoped>
.alert-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(245, 158, 11, 0.2);
  font-size: 0.85rem;
}
</style>
