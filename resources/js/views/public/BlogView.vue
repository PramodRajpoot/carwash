<template>
  <div>
    <section class="section" style="padding-top:4rem">
      <div class="container">
        <div class="section-title">
          <h1>Our <span class="text-gradient">Blog</span></h1>
          <p>Tips, updates, and insights from the CleanAtDoorstep team.</p>
        </div>

        <div v-if="loading" class="text-muted" style="text-align:center;padding:3rem">Loading posts…</div>
        <div v-else-if="posts.length === 0" class="text-muted" style="text-align:center;padding:3rem">No blog posts yet. Check back soon!</div>
        <div v-else class="grid grid-3 gap-4">
          <div v-for="p in posts" :key="p.id" class="card" style="cursor:pointer" @click="$router.push('/blog/' + p.slug)">
            <div style="width:100%;height:160px;background:var(--bg-secondary);border-radius:var(--radius-md);margin-bottom:1rem;display:flex;align-items:center;justify-content:center;font-size:3rem">📝</div>
            <div class="text-muted" style="font-size:0.78rem;margin-bottom:0.5rem">{{ formatDate(p.published_at) }} • {{ p.author?.name }}</div>
            <h4 style="margin-bottom:0.5rem;line-height:1.4">{{ p.title }}</h4>
            <div style="color:var(--accent-cyan);font-size:0.85rem;font-weight:600">Read more →</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'BlogView',
  data() { return { posts: [], loading: true }; },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/blog'); this.posts = data; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
