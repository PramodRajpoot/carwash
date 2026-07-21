<template>
  <div>
    <!-- Hero Header -->
    <div class="page-header text-center" style="padding: 4rem 1rem; background: var(--bg-secondary);">
      <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">About Us</h1>
      <p class="text-muted">Learn more about our mission and vision.</p>
    </div>

    <section class="section" v-if="aboutUs" style="padding-top: 4rem;">
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

    <div v-else class="section flex items-center justify-center" style="min-height: 400px;">
      <div class="spinner"></div>
    </div>

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
export default {
  name: 'AboutView',
  data() {
    return {
      aboutUs: null,
    };
  },
  mounted() {
    this.fetchAboutUs();
  },
  methods: {
    async fetchAboutUs() {
      try {
        const response = await fetch('/api/cms/about-us');
        if (response.ok) {
          const data = await response.json();
          // Migration check
          if (data.image_url && !data.images) {
            data.images = [data.image_url, '', ''];
          }
          if (data.points && !data.features) {
            data.features = data.points.map((p, i) => ({
              icon: 'sparkles',
              title: `Feature ${i+1}`,
              description: p.replace('✅ ', '')
            }));
          }
          this.aboutUs = data;
        }
      } catch (error) {
        console.error('Failed to fetch About Us:', error);
      }
    }
  }
};
</script>

<style scoped>
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(6, 182, 212, 0.2);
  border-top-color: var(--accent-cyan);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease forwards;
}
.delay-1 {
  animation-delay: 0.15s;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
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
