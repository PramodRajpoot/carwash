// Layouts
import LandingLayout from '@/layouts/LandingLayout.vue';
import DashboardLayout from '@/layouts/DashboardLayout.vue';

// Public Views
import HomeView from '@/views/public/HomeView.vue';
import AboutView from '@/views/public/AboutView.vue';
import ServicesView from '@/views/public/ServicesView.vue';
import CentersView from '@/views/public/CentersView.vue';
import PartnerView from '@/views/public/PartnerView.vue';
import ContactView from '@/views/public/ContactView.vue';

// Auth Views
import LoginView from '@/views/auth/LoginView.vue';
import RegisterView from '@/views/auth/RegisterView.vue';

// Customer Views
import CustomerDashboard from '@/views/customer/CustomerDashboard.vue';
import CustomerBookings from '@/views/customer/CustomerBookings.vue';
import CustomerVehicles from '@/views/customer/CustomerVehicles.vue';
import CustomerSubscriptions from '@/views/customer/CustomerSubscriptions.vue';
import CustomerWishlist from '@/views/customer/CustomerWishlist.vue';
import CustomerReferrals from '@/views/customer/CustomerReferrals.vue';

// Franchisee Views
import FranchiseeDashboard from '@/views/franchisee/FranchiseeDashboard.vue';
import FranchiseeOrders from '@/views/franchisee/FranchiseeOrders.vue';
import FranchiseeExpenses from '@/views/franchisee/FranchiseeExpenses.vue';
import FranchiseeReports from '@/views/franchisee/FranchiseeReports.vue';

// Admin Views
import AdminDashboard from '@/views/admin/AdminDashboard.vue';
import AdminUsers from '@/views/admin/AdminUsers.vue';
import AdminOrders from '@/views/admin/AdminOrders.vue';
import AdminSlots from '@/views/admin/AdminSlots.vue';
import AdminCoupons from '@/views/admin/AdminCoupons.vue';
import AdminReports from '@/views/admin/AdminReports.vue';

export const routes = [
    // Public Pages
    {
        path: '/',
        component: LandingLayout,
        children: [
            { path: '', name: 'home', component: HomeView },
            { path: 'about', name: 'about', component: AboutView },
            { path: 'services', name: 'services', component: ServicesView },
            { path: 'centers', name: 'centers', component: CentersView },
            { path: 'become-partner', name: 'partner', component: PartnerView },
            { path: 'contact', name: 'contact', component: ContactView },
        ],
    },

    // Auth
    { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { guest: true } },

    // Customer Dashboard
    {
        path: '/customer',
        component: DashboardLayout,
        meta: { requiresAuth: true, role: 'customer' },
        children: [
            { path: '', name: 'customer-dashboard', component: CustomerDashboard },
            { path: 'bookings', name: 'customer-bookings', component: CustomerBookings },
            { path: 'vehicles', name: 'customer-vehicles', component: CustomerVehicles },
            { path: 'subscriptions', name: 'customer-subscriptions', component: CustomerSubscriptions },
            { path: 'wishlist', name: 'customer-wishlist', component: CustomerWishlist },
            { path: 'referrals', name: 'customer-referrals', component: CustomerReferrals },
        ],
    },

    // Franchisee Panel
    {
        path: '/franchisee',
        component: DashboardLayout,
        meta: { requiresAuth: true, role: 'franchisee' },
        children: [
            { path: '', name: 'franchisee-dashboard', component: FranchiseeDashboard },
            { path: 'orders', name: 'franchisee-orders', component: FranchiseeOrders },
            { path: 'expenses', name: 'franchisee-expenses', component: FranchiseeExpenses },
            { path: 'reports', name: 'franchisee-reports', component: FranchiseeReports },
        ],
    },

    // Admin / Super Admin
    {
        path: '/admin',
        component: DashboardLayout,
        meta: { requiresAuth: true, role: 'admin' },
        children: [
            { path: '', name: 'admin-dashboard', component: AdminDashboard },
            { path: 'users', name: 'admin-users', component: AdminUsers },
            { path: 'orders', name: 'admin-orders', component: AdminOrders },
            { path: 'slots', name: 'admin-slots', component: AdminSlots },
            { path: 'coupons', name: 'admin-coupons', component: AdminCoupons },
            { path: 'reports', name: 'admin-reports', component: AdminReports },
        ],
    },

    // Catch-all
    { path: '/:pathMatch(.*)*', redirect: '/' },
];
