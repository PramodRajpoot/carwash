<template>
  <div>
    <!-- Hero / Banner -->
    <section class="hero" style="position: relative; overflow: hidden; display: flex; align-items: center;">
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
        <div class="hero-content fade-in-up" style="max-width: 650px; width: 100%;">
          <h1 style="color: #fff;"><span class="text-gradient">Premium Car Wash</span><br>At Your Doorstep</h1>
          <p class="hero-text" style="color: rgba(255,255,255,0.85); line-height: 1.6;">Experience eco-friendly, waterless car cleaning with our professional detailing team. Book online, sit back, and watch your vehicle shine — all from the comfort of your home.</p>
          <div class="flex gap-2" style="flex-wrap: wrap;">
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

    <!-- Refer & Earn Section -->
    <section class="refer-earn-section">
      <!-- Animated background particles -->
      <div class="re-particle re-particle-1"></div>
      <div class="re-particle re-particle-2"></div>
      <div class="re-particle re-particle-3"></div>
      <div class="re-particle re-particle-4"></div>

      <div class="container" style="position:relative;z-index:2">
        <div class="refer-earn-header">
          <div class="re-badge-pill">🎁 REFER &amp; EARN</div>
          <h2 class="refer-earn-title">Refer Friends.<br><span class="re-highlight">Earn Rewards Together.</span></h2>
          <p class="refer-earn-desc">Invite friends to CleanAtDoorstep and both of you get rewarded on eligible bookings.</p>
        </div>

        <div class="refer-earn-steps">
          <!-- Step 1 -->
          <div class="refer-step-card fade-in-up">
            <div class="re-step-number">1</div>
            <div class="refer-step-icon refer-step-icon-1">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <h4 class="refer-step-title">Share Your Code</h4>
            <p class="refer-step-desc">Get your unique referral code from the app and share it with friends &amp; family.</p>
          </div>

          <!-- Connector Arrow 1 -->
          <div class="re-connector fade-in-up delay-1">
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none"><path d="M0 12h40M36 6l6 6-6 6" stroke="url(#arrow-grad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="arrow-grad" x1="0" y1="12" x2="48" y2="12"><stop stop-color="#06b6d4" stop-opacity="0.3"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs></svg>
          </div>

          <!-- Step 2 -->
          <div class="refer-step-card fade-in-up delay-1">
            <div class="re-step-number">2</div>
            <div class="refer-step-icon refer-step-icon-2">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <h4 class="refer-step-title">Friend Books a Service</h4>
            <p class="refer-step-desc">Your friend books an eligible service using your unique referral code.</p>
          </div>

          <!-- Connector Arrow 2 -->
          <div class="re-connector fade-in-up delay-2">
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none"><path d="M0 12h40M36 6l6 6-6 6" stroke="url(#arrow-grad2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="arrow-grad2" x1="0" y1="12" x2="48" y2="12"><stop stop-color="#f59e0b" stop-opacity="0.3"/><stop offset="1" stop-color="#10b981"/></linearGradient></defs></svg>
          </div>

          <!-- Step 3 -->
          <div class="refer-step-card fade-in-up delay-2">
            <div class="re-step-number">3</div>
            <div class="refer-step-icon refer-step-icon-3">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <h4 class="refer-step-title">Both Earn Rewards</h4>
            <p class="refer-step-desc">You both earn E-Points rewards as per company terms. It's a win-win!</p>
          </div>
        </div>

        <div class="re-cta-row">
          <router-link to="/register" class="re-cta-btn">
            Start Referring Now
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="section" v-if="testimonials && testimonials.length > 0">
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
    <section class="section" v-if="aboutUs">
      <div class="container">
        <div class="about-grid">
          
          <!-- Content Left -->
          <div class="about-content fade-in-up">
            <span class="about-label">ABOUT US</span>
            <h2 class="about-title" v-html="aboutUs.title"></h2>
            <p class="about-desc">{{ aboutUs.description }}</p>
            
            <div class="features-grid">
              <div v-for="(feature, idx) in aboutUs.features" :key="'feat-'+idx" class="feature-item">
                <div class="feature-icon">
                  <svg v-if="feature.icon === 'truck'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                  <svg v-else-if="feature.icon === 'shield'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>
                  <svg v-else-if="feature.icon === 'users'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  <svg v-else-if="feature.icon === 'sparkles'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path></svg>
                  <svg v-else-if="feature.icon === 'star'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <svg v-else-if="feature.icon === 'clock'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span v-else>📌</span>
                </div>
                <div class="feature-text">
                  <h4>{{ feature.title }}</h4>
                  <p>{{ feature.description }}</p>
                </div>
              </div>
            </div>
            
            <router-link to="/about" class="btn btn-primary mt-4" style="border-radius: 50px; background: #002e5b;">Know More &rarr;</router-link>
          </div>

          <!-- Image Collage Right -->
          <div class="about-images fade-in-up delay-1" v-if="aboutUs.images && aboutUs.images.length === 3">
            <div class="img-tall">
              <img :src="aboutUs.images[0]" alt="Car Wash Service 1" />
            </div>
            <div class="img-stack">
              <div class="img-square">
                <img :src="aboutUs.images[1]" alt="Car Wash Service 2" />
              </div>
              <div class="img-landscape">
                <img :src="aboutUs.images[2]" alt="Car Wash Service 3" />
              </div>
            </div>
          </div>

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


    <!-- Services -->
    <section class="section">
      <div class="container">
        <div class="section-title">
          <h2>Our <span class="text-gradient">Services</span></h2>
          <p>Professional vehicle detailing packages for every need.</p>
        </div>
        <div class="flex gap-2 justify-center" style="margin-bottom:2rem;flex-wrap:wrap">
          <button v-for="f in filters" :key="f.value" class="btn btn-sm" :class="activeFilter === f.value ? 'btn-primary' : 'btn-outline'" @click="activeFilter = f.value">{{ f.label }}</button>
        </div>
        <div v-if="loadingServices" class="text-center text-muted" style="padding:3rem">Loading packages...</div>
        <div v-else class="grid grid-3 gap-3">
          <div v-for="pkg in filteredPackages" :key="pkg.id" class="glass-card">
            <div class="flex justify-between items-center" style="margin-bottom:0.75rem">
              <span class="badge badge-cyan" style="text-transform: uppercase;">{{ pkg.vehicle_type }}</span>
              <span v-if="pkg.frequency_days >= 30" class="badge badge-emerald">Monthly</span>
              <span v-else class="badge badge-violet">One-Time</span>
              <span v-if="pkg.custom_badge" class="badge" style="background: var(--accent-rose); color: white; margin-left: auto;">{{ pkg.custom_badge }}</span>
            </div>
            <h4 style="margin-bottom:0.5rem">{{ pkg.name }}</h4>
            <p class="text-muted" style="font-size:0.85rem;line-height:1.6;margin-bottom:1rem">{{ pkg.description }}</p>
            <div class="flex justify-between items-center">
              <div><span style="font-size:1.5rem;font-weight:700;color:var(--accent-cyan)">₹{{ pkg.price }}</span><span v-if="pkg.frequency_days >= 30" class="text-muted" style="font-size:0.8rem"> / month</span></div>
              <router-link to="/register" class="btn btn-primary btn-sm">Book Now</router-link>
            </div>
            <div v-if="pkg.max_bookings > 1" class="text-muted" style="font-size:0.75rem;margin-top:0.5rem">Includes {{ pkg.max_bookings }} washes</div>
          </div>
        </div>
        <div v-if="!loadingServices && filteredPackages.length === 0" class="empty-state"><div class="empty-icon">📦</div><p>No packages found for this category.</p></div>
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
          <div v-for="(feedback, i) in partnerFeedback" :key="i" class="card feedback-card" style="padding:0;overflow:hidden;cursor:pointer;" @click="openVideoLightbox(feedback)">
            <div class="feedback-thumb">
               <img v-if="feedback.thumbnail_path" :src="feedback.thumbnail_path" class="feedback-thumb-img" />
               <div v-else class="feedback-thumb-placeholder"></div>
               <!-- Play button overlay -->
               <div class="play-btn-overlay" v-if="feedback.video_path">
                 <div class="play-btn-circle">
                   <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                 </div>
               </div>
            </div>
            <div style="padding:1.5rem">
               <h4 style="font-size:1.1rem;margin-bottom:0.25rem">{{ feedback.city }} Partner</h4>
               <p class="text-muted" style="font-size:0.85rem">"{{ feedback.quote }}"</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Video Lightbox Modal -->
      <transition name="lightbox">
        <div v-if="lightboxOpen" class="video-lightbox-overlay" @click.self="closeLightbox">
          <!-- Floating ambient particles -->
          <div class="lightbox-particle lightbox-particle-1"></div>
          <div class="lightbox-particle lightbox-particle-2"></div>
          <div class="lightbox-particle lightbox-particle-3"></div>

          <div class="video-lightbox-content">
            <!-- Animated gradient border glow -->
            <div class="lightbox-glow"></div>

            <button class="lightbox-close-btn" @click="closeLightbox" aria-label="Close video">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>
            </button>

            <div class="lightbox-video-wrapper">
              <video v-if="lightboxFeedback && lightboxFeedback.video_path" ref="lightboxVideo" controls autoplay :poster="lightboxFeedback.thumbnail_path" class="lightbox-video">
                <source :src="lightboxFeedback.video_path" type="video/mp4">
                Your browser does not support the video tag.
              </video>
              <div v-else class="lightbox-no-video">
                <img v-if="lightboxFeedback && lightboxFeedback.thumbnail_path" :src="lightboxFeedback.thumbnail_path" style="width:100%;height:100%;object-fit:cover;" />
                <p v-else class="text-muted" style="text-align:center;padding:3rem;">No video available</p>
              </div>
            </div>

            <div v-if="lightboxFeedback" class="lightbox-info">
              <div class="lightbox-info-inner">
                <div class="lightbox-partner-badge">
                  <span class="lightbox-badge-icon">📍</span>
                  <span>{{ lightboxFeedback.city }}</span>
                </div>
                <h4 class="lightbox-title">{{ lightboxFeedback.city }} Partner</h4>
                <p class="lightbox-quote">"{{ lightboxFeedback.quote }}"</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
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

    <!-- FAQ -->
    <section class="section">
      <div class="container" style="max-width:800px">
        <div class="section-title">
          <h2>Frequently Asked <span class="text-gradient">Questions</span></h2>
          <p>Everything you need to know about our services.</p>
        </div>
        <div v-if="faqs.length > 0" style="display:flex;flex-direction:column;gap:1rem">
          <div v-for="(faq, i) in faqs" :key="faq.id || i" class="glass-card" style="padding:1.25rem;cursor:pointer" @click="toggleFaq(i)">
            <div class="flex justify-between items-center">
              <h4 style="font-size:1.05rem;margin:0">{{ faq.question }}</h4>
              <span style="font-size:1.5rem;color:var(--accent-cyan);transition:transform 0.3s" :style="{ transform: faq.open ? 'rotate(45deg)' : 'rotate(0)' }">+</span>
            </div>
            <p v-if="faq.open" class="text-secondary" style="margin-top:1rem;font-size:0.95rem;animation:fadeInUp 0.3s ease">{{ faq.answer }}</p>
          </div>
        </div>
        <div v-else class="text-center text-muted" style="padding:2rem;">No FAQs available.</div>
      </div>
    </section>

    <!-- Newsletter -->
    <section class="section" style="padding:4rem 0">
      <div class="container text-center">
        <div class="glass-card" style="max-width:700px;margin:0 auto;background:var(--gradient-card)">
          <h3 style="margin-bottom:0.5rem">Subscribe to our <span class="text-gradient">Newsletter</span></h3>
          <p class="text-secondary" style="margin-bottom:1.5rem">Get the latest offers, tips, and updates directly in your inbox.</p>
          <form @submit.prevent="submitNewsletter" class="flex gap-2" style="max-width:500px;margin:0 auto;position:relative;flex-wrap:wrap">
            <input type="email" v-model="newsletterEmail" class="form-input" placeholder="Enter your email address" required style="flex:1" :disabled="newsletterSubmitting">
            <button type="submit" class="btn btn-primary" :disabled="newsletterSubmitting">
              {{ newsletterSubmitting ? 'Subscribing...' : 'Subscribe' }}
            </button>
          </form>
          <div v-if="newsletterMessage" :class="newsletterError ? 'text-danger' : 'text-success'" style="margin-top: 1rem; font-size: 0.9rem;">
            {{ newsletterMessage }}
          </div>
        </div>
      </div>
    </section>

    <!-- App Download Section -->
    <section class="section" style="padding: 2rem 0; background: var(--bg-primary);">
      <div class="container">
        <div class="app-download-banner">
          <div class="app-download-content fade-in-up">
            <span class="app-label">DOWNLOAD THE APP</span>
            <h2 class="app-title">Book Car Wash & Care<br>Services From Your Phone</h2>
            <p class="app-desc">Track washers in real-time, manage bookings, redeem rewards and get exclusive in-app offers.</p>
            
            <ul class="app-features">
              <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Doorstep booking in a few taps</li>
              <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Live tracking of your service</li>
              <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Referral rewards & exclusive offers</li>
              <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Secure payments and receipts</li>
            </ul>

            <div class="app-buttons">
              <a href="#" class="btn-store btn-play">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                <div class="store-text">
                  <span class="small-text">GET IT ON</span>
                  <span class="big-text">Google Play</span>
                </div>
              </a>
              <a href="#" class="btn-store btn-apple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                <div class="store-text">
                  <span class="small-text">DOWNLOAD ON</span>
                  <span class="big-text">App Store</span>
                </div>
              </a>
              <div class="scan-btn">
                <div class="qr-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0f172a"><path d="M3 3h6v6H3V3m2 2v2h2V5H5m8-2h6v6h-6V3m2 2v2h2V5h-2M3 15h6v6H3v-6m2 2v2h2v-2H5m10 4h2v2h-2v-2m-2-4h2v2h-2v-2m4 0h2v2h-2v-2m2-2h2v2h-2v-2m-4 0h2v2h-2v-2m2-4h2v2h-2v-2m-2 0h2v2h-2v-2m-4 0h2v2h-2v-2"/></svg>
                </div>
                <div class="store-text">
                  <span class="small-text">Scan to</span>
                  <span class="small-text">download</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="app-download-image fade-in-up delay-1">
            <img src="/images/app-mockup.png" alt="App Mockup" />
          </div>
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
    filteredPackages() {
      if (this.activeFilter === 'all') return this.packages;
      return this.packages.filter(p => p.vehicle_type === this.activeFilter);
    },
  },
  data() {
    return {
      packages: [],
      loadingServices: true,
      activeFilter: 'all',
      filters: [
        { label: 'All', value: 'all' },
        { label: 'Hatchback', value: 'hatchback' },
        { label: 'Sedan', value: 'sedan' },
        { label: 'SUV', value: 'suv' },
        { label: 'Commercial', value: 'commercial' },
        { label: 'Bus', value: 'bus' },
        { label: 'Volvo Bus', value: 'volvo_bus' },
      ],
      lightboxOpen: false,
      lightboxFeedback: null,
      partnerSubmitted: false,
      partnerSubmitting: false,
      partnerError: '',
      partnerForm: { name: '', email: '', phone: '', city: '', budget: '', message: '', latitude: null, longitude: null },
      newsletterEmail: '',
      newsletterSubmitting: false,
      newsletterMessage: '',
      newsletterError: false,
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
      testimonials: [],
      partnerFeedback: [],
      faqs: [],
      aboutUs: null
    };
  },
  mounted() {
    this.fetchPackages();
    this.fetchOffers();
    this.fetchBanners();
    this.fetchPartners();
    this.fetchTestimonials();
    this.fetchPartnerFeedback();
    this.fetchFaqs();
    this.fetchAboutUs();
  },
  methods: {
    async fetchPackages() {
      try {
        const { data } = await axios.get('/api/packages');
        this.packages = data;
      } catch (e) {
        console.error('Failed to fetch packages:', e);
      }
      this.loadingServices = false;
    },
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
    async fetchTestimonials() {
      try {
        const response = await fetch('/api/testimonials');
        if (response.ok) {
          this.testimonials = await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
      }
    },
    async fetchPartnerFeedback() {
      try {
        const response = await fetch('/api/partner-feedback');
        if (response.ok) {
          this.partnerFeedback = await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch partner feedback:', error);
      }
    },
    async fetchFaqs() {
      try {
        const response = await fetch('/api/faqs');
        if (response.ok) {
          const data = await response.json();
          this.faqs = data.map(faq => ({ ...faq, open: false }));
        }
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
      }
    },
    async fetchAboutUs() {
      try {
        const response = await fetch('/api/cms/about-us');
        if (response.ok) {
          this.aboutUs = await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch About Us:', error);
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
      const wasOpen = this.faqs[index].open;
      this.faqs.forEach(faq => faq.open = false);
      this.faqs[index].open = !wasOpen;
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
    async submitNewsletter() {
      if (!this.newsletterEmail) return;
      this.newsletterSubmitting = true;
      this.newsletterMessage = '';
      this.newsletterError = false;

      try {
        const response = await axios.post('/api/newsletter/subscribe', { email: this.newsletterEmail });
        this.newsletterMessage = response.data.message || 'Successfully subscribed!';
        this.newsletterEmail = '';
      } catch (error) {
        this.newsletterError = true;
        this.newsletterMessage = error.response?.data?.message || 'Failed to subscribe. Please try again.';
      } finally {
        this.newsletterSubmitting = false;
        setTimeout(() => {
          this.newsletterMessage = '';
        }, 5000);
      }
    },
    openVideoLightbox(feedback) {
      this.lightboxFeedback = feedback;
      this.lightboxOpen = true;
      document.body.style.overflow = 'hidden';
    },
    closeLightbox() {
      if (this.$refs.lightboxVideo) {
        this.$refs.lightboxVideo.pause();
      }
      this.lightboxOpen = false;
      this.lightboxFeedback = null;
      document.body.style.overflow = '';
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

/* ── Feedback Cards ── */
.feedback-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.feedback-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(6, 182, 212, 0.15);
}
.feedback-thumb {
  height: 200px;
  background: var(--bg-card-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.feedback-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.feedback-card:hover .feedback-thumb-img {
  transform: scale(1.05);
}
.feedback-thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card-hover) 100%);
}
.play-btn-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  transition: background 0.3s ease;
  z-index: 2;
}
.feedback-card:hover .play-btn-overlay {
  background: rgba(0, 0, 0, 0.45);
}
.play-btn-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(6, 182, 212, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 4px;
  transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
}
.feedback-card:hover .play-btn-circle {
  transform: scale(1.15);
  background: rgba(6, 182, 212, 1);
  box-shadow: 0 6px 30px rgba(6, 182, 212, 0.5);
}

/* ── Video Lightbox ── */
.video-lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: radial-gradient(ellipse at center, rgba(6, 28, 44, 0.92) 0%, rgba(0, 0, 0, 0.95) 100%);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  overflow: hidden;
}

/* Floating ambient particles */
.lightbox-particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(60px);
  opacity: 0.35;
}
.lightbox-particle-1 {
  width: 300px;
  height: 300px;
  background: rgba(6, 182, 212, 0.4);
  top: -80px;
  left: -60px;
  animation: floatParticle1 8s ease-in-out infinite;
}
.lightbox-particle-2 {
  width: 200px;
  height: 200px;
  background: rgba(139, 92, 246, 0.35);
  bottom: -40px;
  right: -40px;
  animation: floatParticle2 10s ease-in-out infinite;
}
.lightbox-particle-3 {
  width: 150px;
  height: 150px;
  background: rgba(16, 185, 129, 0.3);
  top: 50%;
  right: 10%;
  animation: floatParticle3 12s ease-in-out infinite;
}
@keyframes floatParticle1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, 30px) scale(1.15); }
}
@keyframes floatParticle2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, -40px) scale(1.1); }
}
@keyframes floatParticle3 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
  50% { transform: translate(-20px, 20px) scale(1.2); opacity: 0.4; }
}

.video-lightbox-content {
  position: relative;
  width: 100%;
  max-width: 900px;
  border-radius: 20px;
  overflow: hidden;
  background: #0c1222;
  box-shadow:
    0 30px 100px rgba(0, 0, 0, 0.7),
    0 0 80px rgba(6, 182, 212, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 1;
}

/* Animated gradient glow behind the card */
.lightbox-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 22px;
  background: conic-gradient(
    from 0deg,
    rgba(6, 182, 212, 0.5),
    rgba(139, 92, 246, 0.4),
    rgba(16, 185, 129, 0.4),
    rgba(245, 158, 11, 0.3),
    rgba(6, 182, 212, 0.5)
  );
  z-index: -1;
  animation: rotateGlow 4s linear infinite;
  opacity: 0.6;
  filter: blur(4px);
}
@keyframes rotateGlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.lightbox-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  z-index: 10;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.lightbox-close-btn:hover {
  background: rgba(239, 68, 68, 0.7);
  color: #fff;
  border-color: rgba(239, 68, 68, 0.5);
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
}

.lightbox-video-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  position: relative;
}
.lightbox-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.lightbox-no-video {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-info {
  position: relative;
  background: linear-gradient(180deg, #0e1629 0%, #0c1222 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.lightbox-info-inner {
  padding: 1.25rem 1.75rem 1.5rem;
}
.lightbox-partner-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 20px;
  padding: 0.3rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent-cyan);
  letter-spacing: 0.03em;
  margin-bottom: 0.75rem;
}
.lightbox-badge-icon {
  font-size: 0.85rem;
}
.lightbox-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
  background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.lightbox-quote {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  line-height: 1.5;
}

/* Lightbox transitions */
.lightbox-enter-active {
  animation: lightboxOverlayIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.lightbox-leave-active {
  animation: lightboxOverlayOut 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
}
@keyframes lightboxOverlayIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes lightboxOverlayOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
.lightbox-enter-active .video-lightbox-content {
  animation: lightboxContentIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.lightbox-leave-active .video-lightbox-content {
  animation: lightboxContentOut 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
}
@keyframes lightboxContentIn {
  from {
    opacity: 0;
    transform: scale(0.85) translateY(30px);
    filter: blur(6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}
@keyframes lightboxContentOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.92) translateY(20px);
  }
}

@media (max-width: 768px) {
  .video-lightbox-overlay {
    padding: 1rem;
  }
  .video-lightbox-content {
    max-width: 100%;
    border-radius: 14px;
  }
  .lightbox-glow {
    border-radius: 16px;
  }
  .lightbox-info-inner {
    padding: 1rem 1.25rem 1.25rem;
  }
}

/* ── Refer & Earn Section ── */
.refer-earn-section {
  padding: 5rem 0 4rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  position: relative;
  overflow: hidden;
}
.refer-earn-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse 600px 400px at 20% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 70%),
    radial-gradient(ellipse 500px 350px at 80% 30%, rgba(245, 158, 11, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

/* Floating particles */
.re-particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(40px);
  opacity: 0.4;
}
.re-particle-1 {
  width: 200px; height: 200px;
  background: rgba(6, 182, 212, 0.3);
  top: -60px; left: 10%;
  animation: reFloat1 8s ease-in-out infinite;
}
.re-particle-2 {
  width: 150px; height: 150px;
  background: rgba(245, 158, 11, 0.25);
  bottom: -40px; right: 15%;
  animation: reFloat2 10s ease-in-out infinite;
}
.re-particle-3 {
  width: 100px; height: 100px;
  background: rgba(16, 185, 129, 0.2);
  top: 40%; left: 50%;
  animation: reFloat3 12s ease-in-out infinite;
}
.re-particle-4 {
  width: 80px; height: 80px;
  background: rgba(139, 92, 246, 0.2);
  top: 20%; right: 5%;
  animation: reFloat1 9s ease-in-out infinite reverse;
}
@keyframes reFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 20px) scale(1.15); }
}
@keyframes reFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-25px, -30px) scale(1.1); }
}
@keyframes reFloat3 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
  50% { transform: translate(-15px, 15px) scale(1.2); opacity: 0.35; }
}

.refer-earn-header {
  text-align: center;
  margin-bottom: 3.5rem;
}
.re-badge-pill {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 2.5px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  margin-bottom: 1.25rem;
}
.refer-earn-title {
  font-size: 2.6rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 1rem;
  line-height: 1.2;
}
.re-highlight {
  background: linear-gradient(135deg, #06b6d4, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.refer-earn-desc {
  color: rgba(255, 255, 255, 0.55);
  font-size: 1.1rem;
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.7;
}

/* Steps grid with connectors */
.refer-earn-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  max-width: 1050px;
  margin: 0 auto;
}

/* Connector arrows */
.re-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  flex-shrink: 0;
  opacity: 0.7;
}

/* Step cards */
.refer-step-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2.5rem 1.75rem 2rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  flex: 1;
  max-width: 280px;
}
.refer-step-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 40px rgba(6, 182, 212, 0.05);
}

/* Glowing step number */
.re-step-number {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
}

/* Icons */
.refer-step-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.refer-step-card:hover .refer-step-icon {
  transform: scale(1.08);
}
.refer-step-icon-1 {
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
}
.refer-step-icon-2 {
  background: linear-gradient(135deg, #134e4a 0%, #0d9488 100%);
  box-shadow: 0 8px 25px rgba(13, 148, 136, 0.3);
}
.refer-step-icon-3 {
  background: linear-gradient(135deg, #78350f 0%, #f59e0b 100%);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
}

.refer-step-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
}
.refer-step-desc {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
  margin: 0;
}

/* CTA button */
.re-cta-row {
  text-align: center;
  margin-top: 3rem;
}
.re-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 2.25rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000;
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: 50px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 6px 25px rgba(245, 158, 11, 0.35);
}
.re-cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 35px rgba(245, 158, 11, 0.5);
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}
.re-cta-btn svg {
  transition: transform 0.3s ease;
}
.re-cta-btn:hover svg {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .refer-earn-steps {
    flex-direction: column;
    gap: 1.5rem;
  }
  .re-connector {
    transform: rotate(90deg);
    padding: 0;
  }
  .refer-step-card {
    max-width: 320px;
    width: 100%;
  }
  .refer-earn-title {
    font-size: 1.8rem;
  }
  .refer-earn-section {
    padding: 3.5rem 0 3rem;
  }
}

/* ── About Us Redesign ── */
.about-grid {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}
@media (min-width: 900px) {
  .about-grid {
    flex-direction: row;
    align-items: center;
  }
}
.about-content {
  flex: 1;
}
.about-label {
  color: #e67e22;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 0.5rem;
}
.about-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 1rem;
}
.about-desc {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
  white-space: pre-wrap;
}
.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
@media (min-width: 500px) {
  .features-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.feature-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.feature-icon {
  background: rgba(6, 182, 212, 0.1);
  color: var(--accent-cyan);
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.feature-text h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}
.feature-text p {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}
.about-images {
  flex: 1;
  display: flex;
  gap: 1rem;
  height: 400px;
}
.img-tall {
  flex: 1;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}
.img-stack {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.img-square, .img-landscape {
  flex: 1;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}
.about-images img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.about-images img:hover {
  transform: scale(1.05);
}

/* ── App Download Section ── */
.app-download-banner {
  background: linear-gradient(135deg, #021a36 0%, #153c6c 100%);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}
@media (min-width: 900px) {
  .app-download-banner {
    flex-direction: row;
    align-items: center;
    padding: 0;
  }
}
.app-download-content {
  flex: 1;
  padding: 3rem 2rem 0;
}
@media (min-width: 900px) {
  .app-download-content {
    padding: 4rem 1rem 4rem 4rem;
  }
}
.app-label {
  color: #e67e22;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 0.5rem;
}
.app-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
  margin-bottom: 1rem;
}
.app-desc {
  font-size: 1.05rem;
  color: #cbd5e1;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}
.app-features {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}
.app-features li {
  color: #cbd5e1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}
.app-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.btn-store {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
}
.btn-play {
  background: #ffffff;
  color: #0f172a;
}
.btn-play:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
}
.btn-apple {
  background: rgba(255,255,255,0.05);
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.2);
}
.btn-apple:hover {
  background: rgba(255,255,255,0.15);
  transform: translateY(-2px);
}
.store-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.small-text {
  font-size: 0.65rem;
  line-height: 1;
  opacity: 0.8;
}
.big-text {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
}
.scan-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.2);
}
.qr-icon {
  background: #ffffff;
  color: #0f172a;
  border-radius: 6px;
  padding: 4px;
  display: flex;
}
.app-download-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}
.app-download-image img {
  width: 100%;
  max-width: 350px;
  height: auto;
  margin-top: 2rem;
}
@media (min-width: 900px) {
  .app-download-image {
     justify-content: flex-end;
  }
  .app-download-image img {
    margin-top: 0;
    margin-right: -2rem;
    margin-bottom: -4rem;
  }
}
</style>
