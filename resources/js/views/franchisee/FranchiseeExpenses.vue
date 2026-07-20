<template>
  <div>
    <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
      <div>
        <h3>Center Expenditures</h3>
        <p class="text-muted" style="font-size: 0.85rem;">Record wages, chemicals purchases, equipment maintenance, and other running costs.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="showAddModal = true">+ Log Expense</button>
    </div>

    <div v-if="loading" class="text-center text-muted" style="padding: 3rem;">
      Loading expenditures...
    </div>

    <div v-else>
      <div v-if="expenses.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in paginatedExpenses" :key="e.id">
              <td>{{ e.expense_date }}</td>
              <td><span class="badge" :class="categoryBadge(e.category)">{{ e.category }}</span></td>
              <td>{{ e.description || 'No details provided' }}</td>
              <td style="font-weight: 600; color: var(--text-primary);">₹{{ e.amount }}</td>
              <td>
                <button class="btn btn-ghost btn-sm text-danger" style="padding: 0.25rem 0.5rem;" @click="deleteExpense(e.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="expenses.length > 0" class="flex justify-between items-center" style="margin-top: 1rem; padding: 0.5rem; flex-wrap: wrap; gap: 1rem;">
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
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, expenses.length) }} of {{ expenses.length }}
          </span>
        </div>
        <div class="flex gap-1" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
          <button class="btn btn-sm btn-outline" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">💰</div>
        <p>No logged expenses for this center.</p>
      </div>
    </div>

    <!-- Log Expense Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>Log Center Expense</h3>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        
        <form @submit.prevent="addExpense">
          <div class="form-group">
            <label>Expense Category</label>
            <select v-model="form.category" class="form-select" required>
              <option value="salary">Salary / Wages</option>
              <option value="chemical">Chemicals &amp; Consumables</option>
              <option value="maintenance">Equipment Repair &amp; Spares</option>
              <option value="other">Other Overhead / Utilities</option>
            </select>
          </div>

          <div class="form-group">
            <label>Amount (₹)</label>
            <input v-model="form.amount" type="number" min="1" class="form-input" placeholder="e.g. 2500" required />
          </div>

          <div class="form-group">
            <label>Expense Date</label>
            <input v-model="form.expense_date" type="date" class="form-input" required />
          </div>

          <div class="form-group">
            <label>Description / Vendor details</label>
            <textarea v-model="form.description" class="form-textarea" placeholder="Provide extra invoice references or notes..."></textarea>
          </div>

          <div class="flex gap-2" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Logging...' : 'Confirm Log' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="showAddModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'FranchiseeExpenses',
  data() {
    return {
      expenses: [],
      loading: true,
      showAddModal: false,
      submitting: false,
      error: '',
      currentPage: 1,
      itemsPerPage: 10,
      form: {
        category: 'chemical',
        amount: '',
        expense_date: new Date().toISOString().substr(0, 10),
        description: ''
      }
    };
  },
  computed: {
    paginatedExpenses() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.expenses.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.expenses.length / this.itemsPerPage) || 1;
    }
  },
  methods: {
    categoryBadge(c) {
      return { salary: 'badge-violet', chemical: 'badge-cyan', maintenance: 'badge-amber', other: 'badge-rose' }[c] || 'badge-cyan';
    },
    async loadExpenses() {
      try {
        const { data } = await axios.get('/api/franchisee/expenses');
        this.expenses = data;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    async addExpense() {
      this.submitting = true;
      this.error = '';
      try {
        await axios.post('/api/franchisee/expenses', this.form);
        this.form.amount = '';
        this.form.description = '';
        this.showAddModal = false;
        this.loadExpenses();
      } catch (e) {
        this.error = e.response?.data?.message || 'Failed to log expense.';
      }
      this.submitting = false;
    },
    async deleteExpense(id) {
      if (!confirm('Are you sure you want to delete this expense record?')) return;
      try {
        await axios.delete(`/api/franchisee/expenses/${id}`);
        this.loadExpenses();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete expense.');
      }
    }
  },
  mounted() {
    this.loadExpenses();
  }
};
</script>
