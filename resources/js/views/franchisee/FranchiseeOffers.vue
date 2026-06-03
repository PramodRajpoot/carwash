<template>
  <div>
    <div class="glass-card" style="margin-bottom:1.5rem">
      <h4 style="margin-bottom:1rem">🎟️ Company Coupons & Announcements</h4>
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading…</div>
      <div v-else-if="offers.length === 0" class="text-muted" style="text-align:center;padding:2rem">No active offers from company right now.</div>
      <div v-else class="grid grid-3 gap-3">
        <div v-for="c in offers" :key="c.id" class="glass-card" style="border:1px dashed var(--accent-violet)">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem">🎟️ COUPON</div>
          <div style="font-size:1.4rem;font-weight:800;color:var(--accent-violet);letter-spacing:2px">{{ c.code }}</div>
          <div style="font-weight:600;margin:0.3rem 0" :style="{ color: c.discount_type === 'percentage' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }">
            {{ c.discount_type === 'percentage' ? c.discount_value + '% OFF' : '₹' + c.discount_value + ' OFF' }}
          </div>
          <div class="text-muted" style="font-size:0.78rem">{{ c.expires_at ? 'Expires: ' + c.expires_at : 'No expiry' }}</div>
        </div>
      </div>
    </div>

    <!-- Announcements -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">📢 Company Announcements</h4>
      <div v-for="a in announcements" :key="a.title" class="glass-card" style="margin-bottom:0.75rem" :style="{ borderLeft: '3px solid ' + a.color }">
        <div class="flex gap-3 items-start">
          <span style="font-size:1.5rem">{{ a.icon }}</span>
          <div>
            <div style="font-weight:600;margin-bottom:0.2rem">{{ a.title }}</div>
            <div class="text-muted" style="font-size:0.85rem;line-height:1.5">{{ a.body }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'FranchiseeOffers',
  data() {
    return {
      offers: [], loading: true,
      announcements: [
        { title: 'New Service Package Launched', body: 'The "Express Shine" package for sedans is now live. Customers can book it directly from the app.', icon: '🚀', color: 'var(--accent-cyan)' },
        { title: 'Training Webinar — June 15', body: 'Monthly operations webinar scheduled. All franchise partners are requested to attend. Topics: quality standards & chemical handling.', icon: '🎓', color: 'var(--accent-emerald)' },
        { title: 'Royalty Payment Reminder', body: 'Ensure royalty payments are submitted by the last day of each month. Late payments attract a 2% penalty.', icon: '💳', color: 'var(--accent-amber)' },
      ],
    };
  },
  async mounted() {
    try { const { data } = await axios.get('/api/franchisee/offers'); this.offers = data.offers || []; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
