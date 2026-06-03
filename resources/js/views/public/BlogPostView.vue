<template>
  <div>
    <section class="section" style="padding-top:4rem">
      <div class="container" style="max-width:800px">
        <div v-if="loading" class="text-muted" style="text-align:center;padding:3rem">Loading…</div>
        <div v-else-if="!post" class="text-muted" style="text-align:center;padding:3rem">Post not found.</div>
        <div v-else>
          <router-link to="/blog" class="btn btn-ghost btn-sm" style="margin-bottom:1.5rem;display:inline-flex">← Back to Blog</router-link>
          <div class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">{{ formatDate(post.published_at) }} • {{ post.author?.name }}</div>
          <h1 style="margin-bottom:2rem;line-height:1.3">{{ post.title }}</h1>
          <div class="glass-card" style="line-height:1.8;white-space:pre-wrap;font-size:0.95rem">{{ post.content }}</div>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'BlogPostView',
  data() { return { post: null, loading: true }; },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; },
  },
  async mounted() {
    try { const { data } = await axios.get('/api/blog/' + this.$route.params.slug); this.post = data; }
    catch (e) { console.error(e); }
    finally { this.loading = false; }
  },
};
</script>
