<template>
  <div>
    <!-- Hero -->
    <section class="hero">
      <div class="container flex items-center" style="gap:4rem;flex-wrap:wrap">
        <div class="hero-content fade-in-up">
          <h1><span class="text-gradient">Premium Car Wash</span><br>At Your Doorstep</h1>
          <p>Experience eco-friendly, waterless car cleaning with our professional detailing team. Book online, sit back, and watch your vehicle shine — all from the comfort of your home.</p>
          <div class="flex gap-2">
            <router-link to="/services" class="btn btn-primary">Explore Services</router-link>
            <router-link to="/register" class="btn btn-outline">Book Now</router-link>
          </div>
          <div class="flex gap-4 items-center" style="margin-top:2.5rem">
            <div style="text-align:center"><div style="font-size:1.5rem;font-weight:700;color:var(--accent-cyan)">5000+</div><div class="text-muted" style="font-size:0.8rem">Happy Customers</div></div>
            <div style="width:1px;height:40px;background:var(--border-color)"></div>
            <div style="text-align:center"><div style="font-size:1.5rem;font-weight:700;color:var(--accent-emerald)">15+</div><div class="text-muted" style="font-size:0.8rem">Active Centers</div></div>
            <div style="width:1px;height:40px;background:var(--border-color)"></div>
            <div style="text-align:center"><div style="font-size:1.5rem;font-weight:700;color:var(--accent-violet)">4.9★</div><div class="text-muted" style="font-size:0.8rem">Average Rating</div></div>
          </div>
        </div>
        <div class="fade-in-up delay-2" style="flex:1;min-width:280px;text-align:center">
          <div style="width:320px;height:320px;margin:0 auto;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.15),transparent 70%);display:flex;align-items:center;justify-content:center;font-size:8rem" class="float">🚗</div>
        </div>
      </div>
    </section>

    <!-- Mission Vision -->
    <section class="section" style="background:var(--bg-secondary)">
      <div class="container">
        <div class="section-title">
          <h2>Our <span class="text-gradient">Mission & Vision</span></h2>
          <p>Building a cleaner tomorrow with sustainable vehicle care solutions.</p>
        </div>
        <div class="grid grid-3 gap-4">
          <div class="glass-card fade-in-up text-center">
            <div style="font-size:2.5rem;margin-bottom:0.75rem">🎯</div>
            <h4>Our Mission</h4>
            <p class="text-muted" style="font-size:0.9rem;margin-top:0.5rem">To deliver premium doorstep car cleaning that saves water and time while providing showroom-quality results.</p>
          </div>
          <div class="glass-card fade-in-up delay-1 text-center">
            <div style="font-size:2.5rem;margin-bottom:0.75rem">🔭</div>
            <h4>Our Vision</h4>
            <p class="text-muted" style="font-size:0.9rem;margin-top:0.5rem">To become India's leading eco-friendly vehicle care franchise network with 500+ centers by 2028.</p>
          </div>
          <div class="glass-card fade-in-up delay-2 text-center">
            <div style="font-size:2.5rem;margin-bottom:0.75rem">💎</div>
            <h4>Our Values</h4>
            <p class="text-muted" style="font-size:0.9rem;margin-top:0.5rem">Quality, sustainability, customer trust, and innovation drive every wash we deliver.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Vehicle Categories -->
    <section class="section">
      <div class="container">
        <div class="section-title">
          <h2>Vehicle <span class="text-gradient">Categories</span></h2>
          <p>We service every type of vehicle — from compact hatchbacks to luxury Volvo buses.</p>
        </div>
        <div class="grid grid-3 gap-3">
          <div v-for="cat in categories" :key="cat.type" class="glass-card text-center" style="cursor:pointer" @click="$router.push('/services')">
            <div style="font-size:3rem;margin-bottom:0.75rem">{{ cat.icon }}</div>
            <h4>{{ cat.name }}</h4>
            <p class="text-muted" style="font-size:0.85rem;margin-top:0.3rem">Starting ₹{{ cat.price }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="section" style="background:var(--bg-secondary)">
      <div class="container">
        <div class="section-title">
          <h2>Customer <span class="text-gradient">Testimonials</span></h2>
          <p>What our happy customers say about Carbon &amp; Hydro.</p>
        </div>
        <div class="grid grid-3 gap-3">
          <div v-for="(t, i) in testimonials" :key="i" class="card">
            <div style="font-size:1.5rem;color:var(--accent-amber);margin-bottom:0.5rem">★★★★★</div>
            <p class="text-secondary" style="font-size:0.9rem;line-height:1.6;margin-bottom:1rem">"{{ t.text }}"</p>
            <div class="flex items-center gap-2">
              <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient-btn);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.8rem">{{ t.name.charAt(0) }}</div>
              <div><div style="font-weight:600;font-size:0.9rem">{{ t.name }}</div><div class="text-muted" style="font-size:0.75rem">{{ t.role }}</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section text-center">
      <div class="container">
        <h2 style="margin-bottom:1rem">Ready to <span class="text-gradient">Shine?</span></h2>
        <p class="text-secondary" style="max-width:500px;margin:0 auto 2rem">Join thousands of happy vehicle owners who trust Carbon &amp; Hydro for premium doorstep cleaning.</p>
        <div class="flex justify-center gap-2">
          <router-link to="/register" class="btn btn-primary">Get Started Free</router-link>
          <router-link to="/become-partner" class="btn btn-outline">Become a Partner</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      categories: [
        { type: 'hatchback', name: 'Hatchbacks', icon: '🚙', price: 299 },
        { type: 'sedan', name: 'Sedans', icon: '🚗', price: 399 },
        { type: 'suv', name: 'SUVs', icon: '🚘', price: 499 },
        { type: 'commercial', name: 'Commercial', icon: '🚐', price: 699 },
        { type: 'bus', name: 'Buses', icon: '🚌', price: 1499 },
        { type: 'volvo_bus', name: 'Volvo Buses', icon: '🚍', price: 2499 },
      ],
      testimonials: [
        { name: 'Rahul Sharma', role: 'SUV Owner, Mumbai', text: 'Absolutely love the waterless wash! My Fortuner looks brand new every week. The monthly package is amazing value.' },
        { name: 'Priya Patel', role: 'Sedan Owner, Delhi', text: 'Reliable, on-time, and professional. The team always goes above and beyond. Best car wash service I have used.' },
        { name: 'Amit Kumar', role: 'Fleet Manager, Pune', text: 'Managing 20+ commercial vehicles is easy with Carbon & Hydro. Their franchise team handles everything perfectly.' },
      ],
    };
  },
};
</script>
