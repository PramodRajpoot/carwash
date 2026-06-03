import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import { routes } from './router/index.js';
import axios from 'axios';
import '../css/app.css';

// Configure Axios
axios.defaults.baseURL = '';
axios.defaults.headers.common['Accept'] = 'application/json';

// Attach token to every request if present
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Create Router
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 };
    },
});

// Navigation guards
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (to.meta.requiresAuth && !token) {
        return next({ name: 'login' });
    }

    if (to.meta.role && user && user.role !== to.meta.role && 
        !(to.meta.role === 'admin' && user.role === 'super_admin') &&
        !(to.meta.role === 'super_admin' && user.role === 'super_admin')) {
        return next({ name: 'home' });
    }

    if (to.meta.guest && token) {
        if (user) {
            const dashMap = {
                customer: 'customer-dashboard',
                franchisee: 'franchisee-dashboard',
                admin: 'admin-dashboard',
                super_admin: 'superadmin-dashboard',
            };
            return next({ name: dashMap[user.role] || 'home' });
        }
    }

    next();
});

// Create App
const app = createApp(App);
app.config.globalProperties.$axios = axios;
app.use(router);
app.mount('#app');
