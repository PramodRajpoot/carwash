<template>
  <div>
    <div class="glass-card" style="margin-bottom:1.5rem">
      <h4 style="margin-bottom:1rem">🎟️ Active Offers & Coupons</h4>
      <div v-if="loading" class="text-muted" style="text-align:center;padding:2rem">Loading offers…</div>
      <div v-else-if="coupons.length === 0" class="text-muted" style="text-align:center;padding:2rem">No active offers right now. Check back soon!</div>
      <div v-else class="grid grid-3 gap-3">
        <div v-for="c in coupons" :key="c.id" class="glass-card" style="border:1px dashed var(--accent-violet);position:relative;overflow:hidden">
          <div style="position:absolute;top:0;right:0;width:60px;height:60px;background:var(--accent-violet);opacity:0.07;border-radius:0 0 0 100%"></div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.35rem">{{ typeLabel(c.discount_type) }}</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--accent-violet);letter-spacing:1px">{{ c.code }}</div>
          <div style="font-size:1rem;font-weight:700;margin:0.35rem 0" :style="{ color: c.discount_type === 'percentage' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }">
            {{ c.discount_type === 'percentage' ? c.discount_value + '% OFF' : '₹' + c.discount_value + ' OFF' }}
          </div>
          <div class="text-muted" style="font-size:0.78rem;margin-bottom:0.75rem">{{ c.expires_at ? 'Expires: ' + c.expires_at : 'No expiry' }}</div>
          <button class="btn btn-sm btn-outline" style="width:100%" @click="copy(c.code)">📋 Copy Code</button>
        </div>
      </div>
    </div>

    <!-- Festival / Seasonal Banners -->
    <div class="glass-card">
      <h4 style="margin-bottom:1rem">🎊 Seasonal Promotions</h4>
      <div class="grid grid-2 gap-3">
        <div v-for="b in banners" :key="b.title" class="glass-card" :style="{ border: '1px solid ' + b.color, background: 'rgba(0,0,0,0.2)' }">
          <div style="font-size:2rem;margin-bottom:0.5rem">{{ b.icon }}</div>
          <div style="font-weight:700;margin-bottom:0.25rem" :style="{ color: b.color }">{{ b.title }}</div>
          <div class="text-muted" style="font-size:0.85rem">{{ b.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'CustomerOffers',
  data() {
    return {
      coupons: [],
      loading: true,
      banners: [
        { title: 'Monsoon Special', icon: '🌧️', desc: 'Keep your car protected this monsoon season. Extra care package now available!', color: 'var(--accent-cyan)' },
        { title: 'Fleet Discount', icon: '🚌', desc: '15% off on all commercial vehicle packages booked in bulk this month.', color: 'var(--accent-emerald)' },
        { title: 'Weekend Rush', icon: '⚡', desc: 'Book any Saturday slot and get priority scheduling with our premium team.', color: 'var(--accent-amber)' },
        { title: 'Referral Bonus', icon: '🎁', desc: 'Refer 5 friends this month and earn double E-Points — 20 pts per referral!', color: 'var(--accent-violet)' },
      ],
    };
  },
  methods: {
    typeLabel(t) { return t === 'percentage' ? '🏷️ Percentage Discount' : '💵 Fixed Discount'; },
    copy(code) { navigator.clipboard?.writeText(code); },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/customer/dashboard'); this.coupons = data.active_coupons || []; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
