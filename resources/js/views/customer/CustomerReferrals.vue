<template>
  <div>
    <div style="margin-bottom: 2rem;">
      <h3>Refer &amp; Earn</h3>
      <p class="text-muted" style="font-size: 0.85rem;">Invite your friends to Carbon &amp; Hydro and get rewarded together!</p>
    </div>

    <div class="grid grid-3 gap-3" style="margin-bottom: 2rem;">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan);">🔗</div>
        <div class="stat-value">{{ data.referral_coins }}</div>
        <div class="stat-label">Referral Coins</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">🎁</div>
        <div class="stat-value">{{ data.reward_coins }}</div>
        <div class="stat-label">Reward Coins</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-violet);">👥</div>
        <div class="stat-value">{{ referredUsers.length }}</div>
        <div class="stat-label">Friends Referred</div>
      </div>
    </div>

    <!-- Referral link & rewards description -->
    <div class="grid grid-2 gap-3" style="margin-bottom: 2rem;">
      <div class="glass-card">
        <h4 style="margin-bottom: 0.75rem;">Your Referral Code</h4>
        <div class="flex items-center gap-2" style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px dashed var(--border-glow);">
          <span style="font-size: 1.5rem; font-weight: 800; color: var(--accent-cyan); letter-spacing: 2px; flex: 1;">{{ data.referral_code || 'LOADING...' }}</span>
          <button class="btn btn-outline btn-sm" @click="copyCode">Copy</button>
        </div>
        <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.75rem; line-height: 1.5;">
          Copy your code and share it. When your friends register with this code, they get <strong>50 Referral Coins</strong> instantly, and you get <strong>100 Referral Coins</strong>!
        </p>
      </div>

      <div class="glass-card">
        <h4 style="margin-bottom: 0.5rem;">How Loyalty Coins Work</h4>
        <ul style="list-style: none; display: flex; flex-col: column; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
          <li>🔥 <strong>100 Coins</strong> are rewarded on buying any monthly subscription.</li>
          <li>🎁 Redeem coins for exclusive discounts and free washes on checkout.</li>
          <li>💎 Silver tier status active (Earn 1.1x coins on all cash bookings).</li>
        </ul>
      </div>
    </div>

    <!-- Referred Users list -->
    <div class="glass-card">
      <h4 style="margin-bottom: 1rem;">Referred Friends</h4>
      <div v-if="loading" class="text-center text-muted" style="padding: 1.5rem;">
        Loading referrals...
      </div>
      <div v-else>
        <div v-if="referredUsers.length" class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Friend's Name</th>
                <th>Email Address</th>
                <th>Joined Date</th>
                <th>Reward Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in referredUsers" :key="u.id">
                <td>{{ u.name }}</td>
                <td>{{ u.email }}</td>
                <td>{{ formatDate(u.created_at) }}</td>
                <td><span class="badge badge-emerald">100 Coins Awarded</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-muted" style="font-size: 0.9rem; padding: 1.5rem 0; text-align: center;">
          No friends referred yet. Start sharing your code to earn free washes!
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CustomerReferrals',
  data() {
    return {
      data: {},
      referredUsers: [],
      loading: true
    };
  },
  methods: {
    formatDate(d) {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    copyCode() {
      navigator.clipboard?.writeText(this.data.referral_code);
      alert('Referral code copied to clipboard!');
    },
    async loadReferrals() {
      try {
        const { data } = await axios.get('/api/customer/referrals');
        this.data = data;
        this.referredUsers = data.referred_users || [];
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    }
  },
  mounted() {
    this.loadReferrals();
  }
};
</script>
