<template>
  <div>
    <section class="section">
      <div class="container">
        <div class="section-title"><h2>About <span class="text-gradient">CleanAtDoorstep</span></h2><p>Revolutionizing vehicle care with sustainability at heart.</p></div>
        <div class="grid grid-2 gap-4" style="align-items:center">
          <div>
            <p class="text-secondary" style="line-height:1.8;margin-bottom:1.5rem">CleanAtDoorstep was founded with a simple mission — to make premium car care accessible, sustainable, and convenient. Our waterless, eco-friendly cleaning technology saves over 150 litres of water per wash compared to traditional methods.</p>
            <p class="text-secondary" style="line-height:1.8;margin-bottom:1.5rem">Starting from a single center in Mumbai, we have grown into a pan-India franchise network. Each center is operated by trained professionals using premium German-grade chemicals and micro-fiber technology for a showroom-level finish every time.</p>
            <div class="flex gap-3" style="margin-top:1rem">
              <div class="stat-card"><div class="stat-value" style="color:var(--accent-cyan)">150L</div><div class="stat-label">Water Saved / Wash</div></div>
              <div class="stat-card"><div class="stat-value" style="color:var(--accent-emerald)">100%</div><div class="stat-label">Eco-Friendly</div></div>
            </div>
          </div>
          <div style="text-align:center"><div style="font-size:10rem" class="float">🧽</div></div>
        </div>
      </div>
    </section>
    <section class="section" style="background:var(--bg-secondary)">
      <div class="container">
        <div class="section-title"><h2>Our <span class="text-gradient">Team</span></h2><p>Meet the people behind the sparkle.</p></div>
        <div class="grid grid-4 gap-3">
          <div v-for="m in team" :key="m.name" class="glass-card text-center">
            <div style="width:80px;height:80px;border-radius:50%;background:var(--gradient-btn);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.75rem;font-weight:700;margin:0 auto 1rem">{{ m.name.charAt(0) }}</div>
            <h4 style="font-size:1rem">{{ m.name }}</h4>
            <p class="text-muted" style="font-size:0.8rem">{{ m.title }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
export default {
  name: 'AboutView',
  data() {
    return {
      team: [
        { name: 'Vikram Rajan', title: 'Founder & CEO' },
        { name: 'Sneha Desai', title: 'Head of Operations' },
        { name: 'Arjun Nair', title: 'CTO' },
        { name: 'Meera Kapoor', title: 'Marketing Director' },
      ],
    };
  },
};
</script>
