<template>
  <div>
    <!-- Hero / Banner -->
    <section class="hero" style="position: relative; overflow: hidden; min-height: 70vh; display: flex; align-items: center; padding: 4rem 0;">
      <!-- Background Slider -->
      <div v-if="banners && banners.length > 0">
        <div v-for="(banner, index) in banners" :key="banner.id" class="hero-bg" 
             :style="{ backgroundImage: 'url(' + banner.image_path + ')', opacity: currentBannerIndex === index ? 1 : 0, transition: 'opacity 1s ease-in-out' }">
        </div>
      </div>
      <div v-else class="hero-bg" style="background-image: url('/images/hero.png');"></div>
      
      <!-- Overlay to make text readable -->
      <div class="hero-overlay"></div>

      <!-- Slider Controls -->
      <div v-if="banners && banners.length > 1" class="slider-controls">
        <button v-for="(banner, index) in banners" :key="index" @click="currentBannerIndex = index; resetSliderInterval()" class="dot-btn" :class="{ active: currentBannerIndex === index }"></button>
      </div>

      <!-- Content -->
      <div class="container flex items-center" style="gap:4rem;flex-wrap:wrap;position: relative;z-index: 10;">
        <div class="hero-content fade-in-up" style="max-width: 650px;">
          <h1 style="color: #fff;"><span class="text-gradient">Premium Car Wash</span><br>At Your Doorstep</h1>
          <p style="color: rgba(255,255,255,0.85); font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">Experience eco-friendly, waterless car cleaning with our professional detailing team. Book online, sit back, and watch your vehicle shine — all from the comfort of your home.</p>
          <div class="flex gap-2">
            <router-link to="/services" class="btn btn-primary" style="padding: 0.85rem 1.5rem;">Explore Services</router-link>
            <router-link to="/register" class="btn btn-outline pulse-glow" style="border-color: rgba(255,255,255,0.3); color: #fff; padding: 0.85rem 1.5rem;">Book Now</router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Offers & Coupons Ticker -->
    <div v-if="offers.length > 0" class="offers-ticker">
      <div class="ticker-content">
        <span v-for="(offer, idx) in offers" :key="offer.id" class="ticker-item">
          🔥 <strong style="color:var(--accent-amber)">OFFER:</strong> Use code <strong style="color:var(--accent-cyan)">{{ offer.code }}</strong> to get {{ offer.discount_type === 'percentage' ? offer.discount_value + '%' : '₹' + offer.discount_value }} OFF! <span v-if="offer.expires_at" class="text-muted">(Valid till {{ new Date(offer.expires_at).toLocaleDateString() }})</span>
        </span>
        <!-- Duplicate for seamless scrolling -->
        <span v-for="(offer, idx) in offers" :key="'dup-'+offer.id" class="ticker-item">
          🔥 <strong style="color:var(--accent-amber)">OFFER:</strong> Use code <strong style="color:var(--accent-cyan)">{{ offer.code }}</strong> to get {{ offer.discount_type === 'percentage' ? offer.discount_value + '%' : '₹' + offer.discount_value }} OFF! <span v-if="offer.expires_at" class="text-muted">(Valid till {{ new Date(offer.expires_at).toLocaleDateString() }})</span>
        </span>
      </div>
    </div>

    <!-- Trusted by Customers Stats -->
    <section class="section" style="padding-top:0;">
      <div class="container">
        <div class="grid grid-4 gap-3 glass-card text-center" style="padding: 2rem;">
          <div class="fade-in-up">
            <div style="font-size:2.5rem;font-weight:700;color:var(--accent-cyan)">5000+</div>
            <div class="text-muted" style="font-size:0.9rem;margin-top:0.5rem">Happy Customers</div>
          </div>
          <div class="fade-in-up delay-1">
            <div style="font-size:2.5rem;font-weight:700;color:var(--accent-emerald)">15+</div>
            <div class="text-muted" style="font-size:0.9rem;margin-top:0.5rem">Active Centers</div>
          </div>
          <div class="fade-in-up delay-2">
            <div style="font-size:2.5rem;font-weight:700;color:var(--accent-amber)">100%</div>
            <div class="text-muted" style="font-size:0.9rem;margin-top:0.5rem">Eco-friendly Wash</div>
          </div>
          <div class="fade-in-up delay-3">
            <div style="font-size:2.5rem;font-weight:700;color:var(--accent-violet)">4.9★</div>
            <div class="text-muted" style="font-size:0.9rem;margin-top:0.5rem">Average Rating</div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Us -->
    <section class="section">
      <div class="container flex items-center" style="gap:4rem;flex-wrap:wrap">
        <div style="flex:1;min-width:300px" class="fade-in-up">
           <img src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=800" alt="About CleanAtDoorstep" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);">
        </div>
        <div style="flex:1;min-width:300px" class="fade-in-up delay-1">
          <div class="section-title" style="text-align:left;margin-bottom:1.5rem">
            <h2>About <span class="text-gradient">CleanAtDoorstep</span></h2>
          </div>
          <p class="text-secondary" style="margin-bottom:1.5rem;font-size:1.05rem">We are India's most trusted doorstep car wash and detailing service. Since our inception, we have been committed to providing top-tier vehicle care while saving millions of liters of water using our advanced eco-friendly solutions.</p>
          <ul style="list-style:none;margin-bottom:2rem;color:var(--text-secondary)">
            <li style="margin-bottom:0.75rem">✅ Trained & Verified Professionals</li>
            <li style="margin-bottom:0.75rem">✅ Eco-Friendly & Water Efficient</li>
            <li style="margin-bottom:0.75rem">✅ No Hidden Charges or Hassle</li>
          </ul>
          <router-link to="/about" class="btn btn-primary">Learn More About Us</router-link>
        </div>
      </div>
    </section>

    <!-- Mission & Vision -->
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

    <!-- Authorised Service Partner -->
    <section class="section" style="background:var(--bg-secondary)">
      <div class="container">
        <div class="section-title">
          <h2>Authorised <span class="text-gradient">Service Partners</span></h2>
          <p>Trusted by industry leaders to deliver exceptional care.</p>
        </div>
      </div>
      <div v-if="partners.length > 0" class="offers-ticker" style="border: none; background: transparent; padding: 1rem 0;">
        <div class="ticker-content">
          <template v-for="n in 12" :key="'loop-'+n">
            <div v-for="partner in partners" :key="n+'-'+partner.id" class="ticker-item" style="margin-right: 4rem; vertical-align: middle;">
               <img v-if="partner.image_path" :src="partner.image_path" :alt="partner.name" style="height: 95px; width: auto; object-fit: contain; filter: grayscale(100%) opacity(0.7); transition: all 0.3s ease;" onmouseover="this.style.filter='grayscale(0) opacity(1)'" onmouseout="this.style.filter='grayscale(100%) opacity(0.7)'">
               <div v-else style="font-weight:700;font-size:1.5rem;color:var(--text-muted);">{{ partner.name }}</div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="section">
      <div class="container">
        <div class="section-title">
          <h2>Customer <span class="text-gradient">Testimonials</span></h2>
          <p>What our happy customers say about CleanAtDoorstep.</p>
        </div>
        <div class="grid grid-3 gap-3">
          <div v-for="(t, i) in testimonials" :key="i" class="glass-card fade-in-up" :class="'delay-' + (i+1)" style="position:relative">
            <div style="font-size:3rem; color:var(--border-color); position:absolute; top:10px; right:20px; font-family:serif; line-height:1">""</div>
            <div style="color:var(--accent-amber); font-size:1.1rem; margin-bottom:0.75rem;">⭐⭐⭐⭐⭐</div>
            <p style="font-style:italic;margin-bottom:1.5rem;position:relative;z-index:1;color:var(--text-secondary);">"{{ t.text }}"</p>
            <div class="flex items-center gap-2">
              <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient-btn);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.8rem">{{ t.name.charAt(0) }}</div>
              <div><div style="font-weight:600;font-size:0.9rem">{{ t.name }}</div><div class="text-muted" style="font-size:0.75rem">{{ t.role }}</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Partner Feedback -->
    <section class="section" style="background:var(--bg-secondary)">
      <div class="container">
        <div class="section-title">
          <h2>Our Partners' <span class="text-gradient">Valuable Feedback</span></h2>
          <p>Hear directly from our successful franchise partners across India.</p>
        </div>
        <div class="grid grid-3 gap-3">
          <div v-for="(feedback, i) in partnerFeedback" :key="i" class="card" style="padding:0;overflow:hidden">
            <div style="height:180px;background:var(--bg-card-hover);display:flex;align-items:center;justify-content:center;position:relative">
               <!-- Placeholder for Video -->
               <div style="width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;position:relative;z-index:1;">▶</div>
               <img :src="feedback.thumbnail" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:0.6" />
            </div>
            <div style="padding:1.5rem">
               <h4 style="font-size:1.1rem;margin-bottom:0.25rem">{{ feedback.city }} Partner</h4>
               <p class="text-muted" style="font-size:0.85rem">"{{ feedback.quote }}"</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section">
      <div class="container" style="max-width:800px">
        <div class="section-title">
          <h2>Frequently Asked <span class="text-gradient">Questions</span></h2>
          <p>Everything you need to know about our services.</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div v-for="(faq, i) in faqs" :key="i" class="glass-card" style="padding:1.25rem;cursor:pointer" @click="toggleFaq(i)">
            <div class="flex justify-between items-center">
              <h4 style="font-size:1.05rem;margin:0">{{ faq.q }}</h4>
              <span style="font-size:1.5rem;color:var(--accent-cyan);transition:transform 0.3s" :style="{ transform: faq.open ? 'rotate(45deg)' : 'rotate(0)' }">+</span>
            </div>
            <p v-if="faq.open" class="text-secondary" style="margin-top:1rem;font-size:0.95rem;animation:fadeInUp 0.3s ease">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Franchise Form -->
    <section class="section" style="background: linear-gradient(135deg, rgba(6,182,212,0.1) 0%, var(--bg-primary) 100%); position: relative; border-top: 1px solid var(--border-color);">
      <div class="container flex items-center" style="gap:4rem;flex-wrap:wrap">
        <div style="flex:1;min-width:300px">
          <h2>Start Your <span class="text-gradient">Franchise Journey</span></h2>
          <p class="text-secondary" style="margin:1rem 0 2rem">Partner with India's fastest-growing car care brand. Fill out the form and our team will get in touch with you.</p>
          <ul style="list-style:none;color:var(--text-secondary)">
            <li style="margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem"><span style="color:var(--accent-emerald)">✓</span> High ROI Potential</li>
            <li style="margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem"><span style="color:var(--accent-emerald)">✓</span> End-to-End Training & Support</li>
            <li style="margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem"><span style="color:var(--accent-emerald)">✓</span> Exclusive Territory Rights</li>
          </ul>
        </div>
        <div style="flex:1;min-width:300px">
          <div class="glass-card">
            <!-- Success State -->
            <div v-if="partnerSubmitted" style="text-align:center;padding:2rem 1rem">
              <div style="font-size:4rem;margin-bottom:1rem">🎉</div>
              <h3 style="margin-bottom:0.5rem;color:var(--accent-emerald)">Application Submitted!</h3>
              <p class="text-muted" style="line-height:1.7;margin-bottom:1.5rem">
                Thank you <strong>{{ partnerForm.name }}</strong>! Your franchise application has been received.<br>
                Our partnership team will contact you at <strong>{{ partnerForm.phone }}</strong> within <strong>48 hours</strong>.
              </p>
              <button class="btn btn-outline" @click="partnerSubmitted = false; partnerForm = emptyPartnerForm()">Submit Another Application</button>
            </div>

            <!-- Form -->
            <form v-else @submit.prevent="submitPartner">
              <div class="grid grid-2 gap-2" style="margin-bottom:0.75rem">
                <div>
                  <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Full Name *</label>
                  <input v-model="partnerForm.name" type="text" class="form-input" placeholder="Rajesh Kumar" required />
                </div>
                <div>
                  <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Email *</label>
                  <input v-model="partnerForm.email" type="email" class="form-input" placeholder="rajesh@email.com" required />
                </div>
                <div>
                  <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Phone *</label>
                  <input v-model="partnerForm.phone" type="tel" class="form-input" placeholder="9876543210" required />
                </div>
                <div>
                  <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">City *</label>
                  <input v-model="partnerForm.city" type="text" class="form-input" placeholder="Mumbai, Delhi, Pune…" required />
                </div>
              </div>

              <div style="margin-bottom:0.75rem">
                <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Investment Budget</label>
                <select v-model="partnerForm.budget" class="form-input">
                  <option value="">Select Budget Range</option>
                  <option>₹2-5 Lakhs</option>
                  <option>₹5-10 Lakhs</option>
                  <option>₹10-20 Lakhs</option>
                  <option>₹20+ Lakhs</option>
                </select>
              </div>

              <div style="margin-bottom:1rem">
                <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Tell us about yourself</label>
                <textarea v-model="partnerForm.message" class="form-input" rows="4" placeholder="Your background, why you want to join CleanAtDoorstep, existing business experience…" style="resize:vertical"></textarea>
              </div>

              <div v-if="partnerError" style="color:#ef4444;font-size:0.85rem;margin-bottom:0.75rem;padding:0.75rem;background:rgba(239,68,68,0.08);border-radius:var(--radius-sm)">
                ⚠️ {{ partnerError }}
              </div>

              <button type="submit" class="btn btn-primary w-full pulse-glow" :disabled="partnerSubmitting" style="font-size:1rem;padding:0.85rem">
                {{ partnerSubmitting ? 'Submitting Application…' : '🚀 Submit Application' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- Newsletter -->
    <section class="section" style="padding:4rem 0">
      <div class="container text-center">
        <div class="glass-card" style="max-width:700px;margin:0 auto;background:var(--gradient-card)">
          <h3 style="margin-bottom:0.5rem">Subscribe to our <span class="text-gradient">Newsletter</span></h3>
          <p class="text-secondary" style="margin-bottom:1.5rem">Get the latest offers, tips, and updates directly in your inbox.</p>
          <form @submit.prevent="submitNewsletter" class="flex gap-2" style="max-width:500px;margin:0 auto">
            <input type="email" class="form-input" placeholder="Enter your email address" required style="flex:1">
            <button type="submit" class="btn btn-primary">Subscribe</button>
          </form>
        </div>
      </div>
    </section>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HomeView',
  computed: {
    // currentBanner removed as it is no longer used
  },
  data() {
    return {
      partnerSubmitted: false,
      partnerSubmitting: false,
      partnerError: '',
      partnerForm: { name: '', email: '', phone: '', city: '', budget: '', message: '', latitude: null, longitude: null },
      offers: [],
      banners: [],
      currentBannerIndex: 0,
      sliderInterval: null,
      categories: [
        { type: 'hatchback', name: 'Hatchbacks', icon: '🚙', price: 299 },
        { type: 'sedan', name: 'Sedans', icon: '🚗', price: 399 },
        { type: 'suv', name: 'SUVs', icon: '🚘', price: 499 },
        { type: 'commercial', name: 'Commercial', icon: '🚐', price: 699 },
        { type: 'bus', name: 'Buses', icon: '🚌', price: 1499 },
        { type: 'volvo_bus', name: 'Volvo Buses', icon: '🚍', price: 2499 },
      ],
      partners: [],
      testimonials: [
        { name: 'Rahul Sharma', role: 'SUV Owner, Mumbai', text: 'Absolutely love the waterless wash! My Fortuner looks brand new every week. The monthly package is amazing value.' },
        { name: 'Priya Patel', role: 'Sedan Owner, Delhi', text: 'Reliable, on-time, and professional. The team always goes above and beyond. Best car wash service I have used.' },
        { name: 'Amit Kumar', role: 'Fleet Manager, Pune', text: 'Managing 20+ commercial vehicles is easy with CleanAt Doorstep. Their franchise team handles everything perfectly.' },
      ],
      partnerFeedback: [
        { city: 'Delhi', quote: 'Incredible support and a robust business model.', thumbnail: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&q=80&w=300' },
        { city: 'Mumbai', quote: 'Our bookings grew 300% in the first quarter alone.', thumbnail: 'https://images.unsplash.com/photo-1542744094-24638ea095b4?auto=format&fit=crop&q=80&w=300' },
        { city: 'Bangalore', quote: 'The tech platform makes managing operations a breeze.', thumbnail: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=300' },
      ],
      faqs: [
        { q: 'Do I need to provide water and electricity?', a: 'Yes, we request customers to provide basic water and electricity access for best results. Our team brings all other tools and chemicals required.', open: false },
        { q: 'How often should I get my car washed?', a: 'For best results, we recommend a regular wash weekly or bi-weekly. Deep interior cleaning is ideal every 4 to 6 months.', open: false },
        { q: 'Is the service truly at my doorstep?', a: 'Yes! All our services are completely doorstep-based, so you don’t have to go anywhere — we come to your home or office.', open: false },
        { q: 'Are your cleaning products safe for the environment?', a: 'Absolutely. We use premium, eco-friendly, and biodegradable cleaning agents that are safe for your vehicle and the environment.', open: false }
      ]
    };
  },
  mounted() {
    this.fetchOffers();
    this.fetchBanners();
    this.fetchPartners();
  },
  methods: {
    async fetchBanners() {
      try {
        const response = await fetch('/api/banners');
        if (response.ok) {
          this.banners = await response.json();
          this.startBannerSlider();
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      }
    },
    async fetchPartners() {
      try {
        const response = await fetch('/api/service-partners');
        if (response.ok) {
          this.partners = await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch partners:', error);
      }
    },
    startBannerSlider() {
      if (this.banners && this.banners.length > 1) {
        this.sliderInterval = setInterval(() => {
          this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
        }, 5000);
      }
    },
    nextBanner() {
      if (this.banners && this.banners.length > 1) {
        this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
        this.resetSliderInterval();
      }
    },
    prevBanner() {
      if (this.banners && this.banners.length > 1) {
        this.currentBannerIndex = (this.currentBannerIndex - 1 + this.banners.length) % this.banners.length;
        this.resetSliderInterval();
      }
    },
    resetSliderInterval() {
      if (this.sliderInterval) {
        clearInterval(this.sliderInterval);
      }
      this.startBannerSlider();
    },
    async fetchOffers() {
      try {
        const response = await fetch('/api/offers');
        if (response.ok) {
          this.offers = await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch offers:', error);
      }
    },
    toggleFaq(index) {
      this.faqs[index].open = !this.faqs[index].open;
    },
    emptyPartnerForm() {
      return { name: '', email: '', phone: '', city: '', budget: '', message: '', latitude: null, longitude: null };
    },
    async submitPartner() {
      this.partnerError = '';
      this.partnerSubmitting = true;

      const doSubmit = async () => {
        try {
          await axios.post('/api/partner/apply', this.partnerForm);
          this.partnerSubmitted = true;
        } catch (e) {
          const msg = e.response?.data?.message;
          this.partnerError = msg || 'Submission failed. Please try again.';
        } finally {
          this.partnerSubmitting = false;
        }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.partnerForm.latitude = position.coords.latitude;
            this.partnerForm.longitude = position.coords.longitude;
            doSubmit();
          },
          (err) => {
            console.warn('Geolocation failed or denied:', err);
            doSubmit();
          },
          { timeout: 5000 }
        );
      } else {
        doSubmit();
      }
    },
    submitNewsletter() {
      alert('Thank you for subscribing to our newsletter!');
    }
  }
};
</script>

<style scoped>
.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: 1;
}
.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, rgba(11, 17, 32, 0.95) 0%, rgba(11, 17, 32, 0.4) 100%);
  z-index: 2;
}

.slider-controls {
  position: absolute;
  bottom: 30px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0 1.5rem;
  z-index: 20;
  pointer-events: none;
}
.dot-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.2);
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  padding: 0;
}
.dot-btn:hover {
  background: rgba(255, 255, 255, 0.8);
}
.dot-btn.active {
  background: var(--accent-cyan);
  transform: scale(1.3);
}

.offers-ticker {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 0.65rem 0;
  overflow: hidden;
  white-space: nowrap;
}
.ticker-content {
  display: inline-block;
  animation: ticker 30s linear infinite;
}
.ticker-content:hover {
  animation-play-state: paused;
}
.ticker-item {
  font-size: 0.85rem;
  margin-right: 3rem;
  display: inline-block;
}
@keyframes ticker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
