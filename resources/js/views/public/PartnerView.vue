<template>
  <div>
    <!-- Partner Page Hero Slider -->
    <section class="partner-hero" style="position:relative;overflow:hidden;min-height:70vh;display:flex;align-items:center;background:var(--bg-primary)">
      <template v-if="banners.length">
        <div v-for="(banner,index) in banners" :key="banner.id" style="position:absolute;inset:0;background-position:center;background-size:cover;transition:opacity 1s ease" :style="{backgroundImage:'url('+banner.image_path+')',opacity:currentBannerIndex===index?1:0}"></div>
      </template>
      <div v-else style="position:absolute;inset:0;background:url('/images/hero.png') center/cover no-repeat"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,17,32,.88),rgba(11,17,32,.25));z-index:2"></div>
      <div v-if="banners.length>1" style="position:absolute;bottom:24px;left:0;width:100%;display:flex;justify-content:center;gap:10px;z-index:20">
        <button v-for="(banner,index) in banners" :key="'dot-'+banner.id" @click="goToBanner(index)" aria-label="Show slide" style="width:12px;height:12px;border-radius:50%;border:0;padding:0;cursor:pointer" :style="{background:index===currentBannerIndex?'var(--accent-cyan)':'rgba(255,255,255,.45)',transform:index===currentBannerIndex?'scale(1.25)':'none'}"></button>
      </div>
    </section>

    <!-- Why Partner With Us Section -->
    <section class="section" style="background: var(--bg-secondary); padding: 4rem 0;">
      <div class="container">
        <div class="section-title text-center" style="margin-bottom: 3rem;">
          <span style="display: block; margin-bottom: 0.5rem; text-align: center; color: var(--accent-cyan); font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">WHY PARTNER WITH US</span>
          <h2 style="font-size:2.5rem;font-weight:800;color:var(--text-primary);">A Business Built on Convenience & Trust</h2>
          <p class="text-muted" style="margin-top:0.5rem; font-size:1.1rem;">A concept in strong demand across Indian cities, powered by a supportive company ecosystem.</p>
        </div>

        <div class="grid grid-4 gap-3">
          <!-- Card 1 -->
          <div class="card" style="padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card);">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #0070c0 0%, #00b4ff 100%); color: #ffffff; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            </div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Growing Industry</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">Ride the growing demand for organised car care in India.</p>
          </div>

          <!-- Card 2 -->
          <div class="card" style="padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card);">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #0070c0 0%, #00b4ff 100%); color: #ffffff; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Full Company Support</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">Setup, training, machinery and marketing — end to end.</p>
          </div>

          <!-- Card 3 -->
          <div class="card" style="padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card);">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #0070c0 0%, #00b4ff 100%); color: #ffffff; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
              <span style="font-weight: 700; font-size: 1.4rem;">₹</span>
            </div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Multiple Revenue Streams</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">Doorstep services, subscriptions and center-based operations.</p>
          </div>

          <!-- Card 4 -->
          <div class="card" style="padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card);">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #0070c0 0%, #00b4ff 100%); color: #ffffff; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>
            </div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Ready-Made Brand</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">Leverage a recognised and growing brand from day one.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 6 Steps Section -->
    <section class="section" style="padding: 4rem 0;">
      <div class="container">
        <div class="section-title text-center" style="margin-bottom: 3.5rem;">
          <span style="display: block; margin-bottom: 0.5rem; text-align: center; color: var(--accent-cyan); font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">HOW IT WORKS</span>
          <h2 style="font-size:2.5rem;font-weight:800;color:var(--text-primary);">Become a Partner in 6 Steps</h2>
        </div>

        <div class="grid grid-3 gap-3">
          <!-- Step 1 -->
          <div class="card" style="padding: 1.5rem; padding-top: 2rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); position: relative; margin-top: 0.5rem;">
            <div style="position: absolute; top: -16px; left: 1.5rem; width: 32px; height: 32px; background: var(--gradient-btn); box-shadow: 0 4px 10px rgba(0, 180, 255, 0.35); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">1</div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Submit Enquiry</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">Fill out the franchise enquiry form.</p>
          </div>

          <!-- Step 2 -->
          <div class="card" style="padding: 1.5rem; padding-top: 2rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); position: relative; margin-top: 0.5rem;">
            <div style="position: absolute; top: -16px; left: 1.5rem; width: 32px; height: 32px; background: var(--gradient-btn); box-shadow: 0 4px 10px rgba(0, 180, 255, 0.35); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">2</div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Consultation</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">Our team reaches out for a detailed discussion.</p>
          </div>

          <!-- Step 3 -->
          <div class="card" style="padding: 1.5rem; padding-top: 2rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); position: relative; margin-top: 0.5rem;">
            <div style="position: absolute; top: -16px; left: 1.5rem; width: 32px; height: 32px; background: var(--gradient-btn); box-shadow: 0 4px 10px rgba(0, 180, 255, 0.35); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">3</div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Location Review</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">We review location and eligibility together.</p>
          </div>

          <!-- Step 4 -->
          <div class="card" style="padding: 1.5rem; padding-top: 2rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); position: relative; margin-top: 0.5rem;">
            <div style="position: absolute; top: -16px; left: 1.5rem; width: 32px; height: 32px; background: var(--gradient-btn); box-shadow: 0 4px 10px rgba(0, 180, 255, 0.35); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">4</div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Agreement & Onboarding</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">Sign agreement and complete onboarding.</p>
          </div>

          <!-- Step 5 -->
          <div class="card" style="padding: 1.5rem; padding-top: 2rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); position: relative; margin-top: 0.5rem;">
            <div style="position: absolute; top: -16px; left: 1.5rem; width: 32px; height: 32px; background: var(--gradient-btn); box-shadow: 0 4px 10px rgba(0, 180, 255, 0.35); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">5</div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Training & Setup</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">Complete training and center setup.</p>
          </div>

          <!-- Step 6 -->
          <div class="card" style="padding: 1.5rem; padding-top: 2rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); position: relative; margin-top: 0.5rem;">
            <div style="position: absolute; top: -16px; left: 1.5rem; width: 32px; height: 32px; background: var(--gradient-btn); box-shadow: 0 4px 10px rgba(0, 180, 255, 0.35); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">6</div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Business Launch</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">Go live and start serving customers.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container" style="max-width:700px">
        <div class="section-title">
          <h2>Become a <span class="text-gradient">Franchise Partner</span></h2>
          <p>Join India's fastest-growing eco-friendly car wash network.</p>
        </div>

        <div class="glass-card">
          <!-- Success State -->
          <div v-if="submitted" style="text-align:center;padding:2rem 1rem">
            <div style="font-size:4rem;margin-bottom:1rem">🎉</div>
            <h3 style="margin-bottom:0.5rem;color:var(--accent-emerald)">Application Submitted!</h3>
            <p class="text-muted" style="line-height:1.7;margin-bottom:1.5rem">
              Thank you <strong>{{ form.name }}</strong>! Your franchise application has been received.<br>
              Our partnership team will contact you at <strong>{{ form.phone }}</strong> within <strong>48 hours</strong>.
            </p>
            <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:1rem;font-size:0.85rem;color:var(--text-muted);margin-bottom:1.5rem">
              📧 A confirmation has been recorded for <strong>{{ form.email }}</strong>
            </div>
            <button class="btn btn-outline" @click="submitted = false; form = emptyForm()">Submit Another Application</button>
          </div>

          <!-- Form -->
          <form v-else @submit.prevent="submit">
            <div class="grid grid-2 gap-2" style="margin-bottom:0.75rem">
              <div>
                <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Full Name *</label>
                <input v-model="form.name" type="text" class="form-input" placeholder="Rajesh Kumar" required />
              </div>
              <div>
                <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Email *</label>
                <input v-model="form.email" type="email" class="form-input" placeholder="rajesh@email.com" required />
              </div>
              <div>
                <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Phone *</label>
                <input v-model="form.phone" type="tel" class="form-input" placeholder="9876543210" required />
              </div>
              <div>
                <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">City *</label>
                <input v-model="form.city" type="text" class="form-input" placeholder="Mumbai, Delhi, Pune…" required />
              </div>
            </div>

            <div style="margin-bottom:0.75rem">
              <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Investment Budget</label>
              <select v-model="form.budget" class="form-input">
                <option value="">Select Budget Range</option>
                <option>₹2-5 Lakhs</option>
                <option>₹5-10 Lakhs</option>
                <option>₹10-20 Lakhs</option>
                <option>₹20+ Lakhs</option>
              </select>
            </div>

            <div style="margin-bottom:1rem">
              <label class="text-muted" style="font-size:0.85rem;display:block;margin-bottom:0.25rem">Tell us about yourself</label>
              <textarea v-model="form.message" class="form-input" rows="4" placeholder="Your background, why you want to join Cleanatdoorstep, existing business experience…" style="resize:vertical"></textarea>
            </div>

            <div v-if="error" style="color:#ef4444;font-size:0.85rem;margin-bottom:0.75rem;padding:0.75rem;background:rgba(239,68,68,0.08);border-radius:var(--radius-sm)">
              ⚠️ {{ error }}
            </div>

            <button type="submit" class="btn btn-primary w-full" :disabled="submitting" style="font-size:1rem;padding:0.85rem">
              {{ submitting ? 'Submitting Application…' : '🚀 Submit Application' }}
            </button>
          </form>
        </div>

      </div>
    </section>

    <!-- Support Section -->
    <section class="section" style="background: var(--bg-secondary); padding: 4rem 0;">
      <div class="container">
        <div class="section-title text-center" style="margin-bottom: 3rem;">
          <span style="display: block; margin-bottom: 0.5rem; text-align: center; color: var(--accent-cyan); font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">WHAT WE PROVIDE</span>
          <h2 style="font-size:2.5rem;font-weight:800;color:var(--text-primary);">End-to-End Franchise Support</h2>
        </div>

        <div class="grid grid-3 gap-3">
          <!-- Item 1 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Initial Business Setup</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">End-to-end setup assistance to launch your center.</p>
            </div>
          </div>

          <!-- Item 2 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Machinery & Chemicals</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Company-approved machinery and chemical supply.</p>
            </div>
          </div>

          <!-- Item 3 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Operational Guidance</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Ongoing operational support to run efficiently.</p>
            </div>
          </div>

          <!-- Item 4 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Technical & App Support</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Technical assistance for the platform and app.</p>
            </div>
          </div>

          <!-- Item 5 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Marketing Support</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Local marketing kits and digital promotion support.</p>
            </div>
          </div>

          <!-- Item 6 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Lead Generation</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Booking leads from the app and central marketing.</p>
            </div>
          </div>

          <!-- Item 7 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Customer Care</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Central customer support handling escalations.</p>
            </div>
          </div>

          <!-- Item 8 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Staff Hiring Assistance</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Guidance for hiring and onboarding washers.</p>
            </div>
          </div>

          <!-- Item 9 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Training Support</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Detailed training for you and your staff.</p>
            </div>
          </div>
          
          <!-- Item 10 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Branding Materials</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Uniforms, banners and branded materials.</p>
            </div>
          </div>
          
          <!-- Item 11 -->
          <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); display: flex; align-items: flex-start; gap: 1rem;">
            <svg style="color: #10b981; flex-shrink: 0; margin-top: 0.1rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Ongoing Business Guidance</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Regular business reviews and growth support.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Partners' Valuable Feedback -->
    <section v-if="partnerFeedback.length" class="section" style="background:var(--bg-primary);padding:4rem 0">
      <div class="container">
        <div class="section-header-flex">
          <div class="section-title" style="margin-bottom:0;text-align:left">
            <span style="display:block;margin-bottom:.5rem;color:var(--accent-cyan);font-size:.8rem;font-weight:700;text-transform:uppercase">Partner Testimonials</span>
            <h2 style="font-size:2.5rem;font-weight:800">Our Partners' Valuable Feedback</h2>
          </div>
          <div class="slider-nav-btns" v-if="partnerFeedback.length > 1">
            <button class="slider-arrow-btn" @click="scrollSlider(-1)" aria-label="Previous Partner Feedback">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button class="slider-arrow-btn" @click="scrollSlider(1)" aria-label="Next Partner Feedback">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>

        <div class="cards-slider-container">
          <div ref="feedbackSlider" class="cards-slider-track" @scroll="onSliderScroll">
            <div
              v-for="feedback in partnerFeedback"
              :key="feedback.id"
              class="card feedback-card slider-card"
              style="padding:0;overflow:hidden;cursor:pointer"
              @click="openVideoLightbox(feedback)"
            >
              <div class="feedback-thumb">
                <img v-if="feedback.thumbnail_path" :src="formatMediaUrl(feedback.thumbnail_path)" class="feedback-thumb-img" loading="lazy" />
                <div v-else class="feedback-thumb-placeholder"></div>
                <!-- Play button overlay -->
                <div class="play-btn-overlay" v-if="feedback.video_path">
                  <div class="play-btn-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                </div>
              </div>
              <div style="padding:1.25rem">
                <h4>{{ feedback.name || 'Cleanatdoorstep Partner' }}</h4>
                <p v-if="feedback.city" class="text-muted text-sm">{{ feedback.city }}</p>
                <p class="text-muted" style="font-style:italic">"{{ feedback.quote }}"</p>
              </div>
            </div>
          </div>
        </div>

        <div class="slider-dots" v-if="partnerFeedback.length > 1">
          <span
            v-for="(_, dotIdx) in partnerFeedback"
            :key="dotIdx"
            class="slider-dot"
            :class="{ active: currentFeedbackIndex === dotIdx }"
            @click="scrollToCard(dotIdx)"
          ></span>
        </div>
      </div>

      <!-- Video Lightbox Modal (Same as Home Page) -->
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
              <video
                v-if="lightboxFeedback && lightboxFeedback.video_path"
                :key="lightboxFeedback.id ? String(lightboxFeedback.id) + (lightboxFeedback.video_path || '') : lightboxFeedback.video_path"
                ref="lightboxVideo"
                :src="formatMediaUrl(lightboxFeedback.video_path)"
                :poster="formatMediaUrl(lightboxFeedback.thumbnail_path)"
                controls
                autoplay
                playsinline
                preload="auto"
                class="lightbox-video"
              >
                <source :src="formatMediaUrl(lightboxFeedback.video_path)" type="video/mp4">
                Your browser does not support the video tag.
              </video>
              <div v-else class="lightbox-no-video">
                <img v-if="lightboxFeedback && lightboxFeedback.thumbnail_path" :src="formatMediaUrl(lightboxFeedback.thumbnail_path)" style="width:100%;height:100%;object-fit:cover;" />
                <p v-else class="text-muted" style="text-align:center;padding:3rem;">No video available</p>
              </div>
            </div>

            <div v-if="lightboxFeedback" class="lightbox-info">
              <div class="lightbox-info-inner">
                <div v-if="lightboxFeedback.city" class="lightbox-partner-badge">
                  <span class="lightbox-badge-icon">📍</span>
                  <span>{{ lightboxFeedback.city }}</span>
                </div>
                <h4 class="lightbox-title">{{ lightboxFeedback.name || (lightboxFeedback.city ? lightboxFeedback.city + ' Partner' : 'Partner Feedback') }}</h4>
                <p class="lightbox-quote">"{{ lightboxFeedback.quote }}"</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </section>

  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'PartnerView',
  data() {
    return {
      submitted: false,
      submitting: false,
      error: '',
      form: this.emptyForm(),
      banners: [],
      currentBannerIndex: 0,
      partnerFeedback: [],
      currentFeedbackIndex: 0,
      lightboxOpen: false,
      lightboxFeedback: null,
    };
  },
  methods: {
    formatMediaUrl(url) {
      if (!url || typeof url !== 'string') return '';
      if (
        url.startsWith('http://carwash.local') ||
        url.startsWith('https://carwash.local') ||
        url.startsWith('http://localhost') ||
        url.startsWith('https://localhost')
      ) {
        try {
          const parsed = new URL(url);
          return parsed.pathname;
        } catch (e) {}
      }
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        return '/' + url;
      }
      return url;
    },
    emptyForm() {
      return { name: '', email: '', phone: '', city: '', budget: '', message: '', latitude: null, longitude: null };
    },
    async submit() {
      this.error = '';
      this.submitting = true;

      const doSubmit = async () => {
        try {
          await axios.post('/api/partner/apply', this.form);
          this.submitted = true;
        } catch (e) {
          const msg = e.response?.data?.message;
          this.error = msg || 'Submission failed. Please try again.';
        } finally {
          this.submitting = false;
        }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.form.latitude = position.coords.latitude;
            this.form.longitude = position.coords.longitude;
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
    goToBanner(index) {
      this.currentBannerIndex = index;
    },
    nextFeedback() {
      if (this.partnerFeedback.length) this.currentFeedbackIndex = (this.currentFeedbackIndex + 1) % this.partnerFeedback.length;
    },
    previousFeedback() {
      if (this.partnerFeedback.length) this.currentFeedbackIndex = (this.currentFeedbackIndex - 1 + this.partnerFeedback.length) % this.partnerFeedback.length;
    },
    goToFeedback(index) {
      this.currentFeedbackIndex = index;
    },
    scrollSlider(direction) {
      const container = this.$refs.feedbackSlider;
      if (!container) return;
      const card = container.querySelector('.slider-card');
      const cardWidth = card ? card.offsetWidth + 24 : 340;
      container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
    },
    scrollToCard(index) {
      const container = this.$refs.feedbackSlider;
      if (!container) return;
      const cards = container.querySelectorAll('.slider-card');
      if (cards[index]) {
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    },
    onSliderScroll() {
      const container = this.$refs.feedbackSlider;
      if (!container) return;
      const card = container.querySelector('.slider-card');
      const cardWidth = card ? card.offsetWidth + 24 : 340;
      this.currentFeedbackIndex = Math.max(0, Math.min(this.partnerFeedback.length - 1, Math.round(container.scrollLeft / cardWidth)));
    },
    openVideoLightbox(feedback) {
      this.lightboxFeedback = feedback;
      this.lightboxOpen = true;
      document.body.style.overflow = 'hidden';
      this.$nextTick(() => {
        if (this.$refs.lightboxVideo) {
          try {
            this.$refs.lightboxVideo.load();
            const p = this.$refs.lightboxVideo.play();
            if (p && typeof p.catch === 'function') {
              p.catch(() => {});
            }
          } catch (e) {}
        }
      });
    },
    closeLightbox() {
      if (this.$refs.lightboxVideo) {
        try {
          this.$refs.lightboxVideo.pause();
        } catch (e) {}
      }
      this.lightboxOpen = false;
      this.lightboxFeedback = null;
      document.body.style.overflow = '';
    },
  },
  mounted() {
    // Fetch banners from the server
    axios.get('/api/banners').then((response) => {
      this.banners = response.data;
    });
    // Fetch partner feedback from the server
    axios.get('/api/partner-valuable-feedback').then((response) => {
      this.partnerFeedback = response.data;
    });
  },
};
</script>

<style>
.partner-hero {
  position: relative;
  overflow: hidden;
  min-height: 70vh;
  display: flex;
  align-items: center;
  background: var(--bg-primary);
}

.partner-hero div {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  transition: opacity 1s ease;
}

/* Partner hero slide opacity is controlled by Vue inline styles. */

.section-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.slider-nav-btns {
  display: flex;
  gap: 0.6rem;
}

.slider-arrow-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: var(--shadow-sm);
}

.slider-arrow-btn:hover {
  background: var(--accent-cyan);
  color: #0b1120;
  border-color: var(--accent-cyan);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(6, 182, 212, 0.35);
}

.slider-arrow-btn:active {
  transform: translateY(0);
}

.cards-slider-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.cards-slider-track {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0.5rem 0.25rem 1rem 0.25rem;
}

.cards-slider-track::-webkit-scrollbar {
  display: none;
}

.slider-card {
  flex: 0 0 calc((100% - 3rem) / 3);
  min-width: 300px;
  max-width: 380px;
  scroll-snap-align: start;
  padding: 0 !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 992px) {
  .slider-card {
    flex: 0 0 calc((100% - 1.5rem) / 2);
    min-width: 280px;
  }
}

@media (max-width: 640px) {
  .slider-card {
    flex: 0 0 100%;
    min-width: 100%;
    max-width: 100%;
  }
}

.slider-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.slider-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.slider-dot.active {
  width: 24px;
  background: var(--accent-cyan);
}

.partner-feedback-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.8);
  border: 0;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s;
  z-index: 10;
}

.partner-feedback-arrow:hover {
  background: var(--accent-cyan);
}

.partner-feedback-arrow:focus {
  outline: none;
}

.card {
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  background: var(--bg-card);
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.glass-card:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
  z-index: 1;
}

.glass-card > * {
  position: relative;
  z-index: 2;
}

/* ── Feedback Thumb & Play Button (Identical to Home page) ── */
.feedback-thumb {
  height: 220px;
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

/* ── Video Lightbox (Identical to Home page) ── */
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
  background: linear-gradient(135deg, rgba(0, 180, 255, 0.15) 0%, rgba(0, 112, 192, 0.1) 100%);
  border: 1px solid rgba(0, 180, 255, 0.25);
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
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes lightboxOverlayOut {
  from { opacity: 1; }
  to { opacity: 0; }
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
</style>
