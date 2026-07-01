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
import BlogView from '@/views/public/BlogView.vue';
import BlogPostView from '@/views/public/BlogPostView.vue';
import TermsView from '@/views/public/TermsView.vue';
import PrivacyView from '@/views/public/PrivacyView.vue';

// Auth Views
import LoginView from '@/views/auth/LoginView.vue';
import RegisterView from '@/views/auth/RegisterView.vue';
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue';
import OAuthCallbackView from '@/views/auth/OAuthCallbackView.vue';

// Customer Views
import CustomerDashboard from '@/views/customer/CustomerDashboard.vue';
import CustomerBookings from '@/views/customer/CustomerBookings.vue';
import CustomerVehicles from '@/views/customer/CustomerVehicles.vue';
import CustomerSubscriptions from '@/views/customer/CustomerSubscriptions.vue';
import CustomerWishlist from '@/views/customer/CustomerWishlist.vue';
import CustomerReferrals from '@/views/customer/CustomerReferrals.vue';
import CustomerWallet from '@/views/customer/CustomerWallet.vue';
import CustomerSupport from '@/views/customer/CustomerSupport.vue';
import CustomerOffers from '@/views/customer/CustomerOffers.vue';
import CustomerNotifications from '@/views/customer/CustomerNotifications.vue';
import CustomerProfile from '@/views/customer/CustomerProfile.vue';

// Franchisee Views
import FranchiseeDashboard from '@/views/franchisee/FranchiseeDashboard.vue';
import FranchiseeOrders from '@/views/franchisee/FranchiseeOrders.vue';
import FranchiseeExpenses from '@/views/franchisee/FranchiseeExpenses.vue';
import FranchiseeReports from '@/views/franchisee/FranchiseeReports.vue';
import FranchiseeRoyalty from '@/views/franchisee/FranchiseeRoyalty.vue';
import FranchiseeSubscriptions from '@/views/franchisee/FranchiseeSubscriptions.vue';
import FranchiseeOffers from '@/views/franchisee/FranchiseeOffers.vue';
import FranchiseeSlots from '@/views/franchisee/FranchiseeSlots.vue';

// Admin Views
import AdminDashboard from '@/views/admin/AdminDashboard.vue';
import AdminUsers from '@/views/admin/AdminUsers.vue';
import AdminOrders from '@/views/admin/AdminOrders.vue';
import AdminSlots from '@/views/admin/AdminSlots.vue';
import AdminCoupons from '@/views/admin/AdminCoupons.vue';
import AdminReports from '@/views/admin/AdminReports.vue';
import AdminFranchisees from '@/views/admin/AdminFranchisees.vue';
import AdminPackages from '@/views/admin/AdminPackages.vue';
import AdminReferrals from '@/views/admin/AdminReferrals.vue';
import AdminBlog from '@/views/admin/AdminBlog.vue';
import AdminTickets from '@/views/admin/AdminTickets.vue';
import AdminPartners from '@/views/admin/AdminPartners.vue';

// Super Admin Views
import SuperAdminDashboard from '@/views/super-admin/SuperAdminDashboard.vue';
import SuperAdminAdmins from '@/views/super-admin/SuperAdminAdmins.vue';
import SuperAdminSettings from '@/views/super-admin/SuperAdminSettings.vue';
import SuperAdminSlots from '@/views/super-admin/SuperAdminSlots.vue';

export const routes = [
    // ── Public Pages ─────────────────────────────────────────────
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
            { path: 'blog', name: 'blog', component: BlogView },
            { path: 'blog/:slug', name: 'blog-post', component: BlogPostView },
            { path: 'terms', name: 'terms', component: TermsView },
            { path: 'privacy', name: 'privacy', component: PrivacyView },
        ],
    },

    // ── Auth ─────────────────────────────────────────────────────
    { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { guest: true } },
    { path: '/reset-password', name: 'reset-password', component: ResetPasswordView, meta: { guest: true } },
    { path: '/oauth/callback', name: 'oauth-callback', component: OAuthCallbackView, meta: { guest: true } },

    // ── Customer Dashboard ───────────────────────────────────────
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
            { path: 'wallet', name: 'customer-wallet', component: CustomerWallet },
            { path: 'support', name: 'customer-support', component: CustomerSupport },
            { path: 'offers', name: 'customer-offers', component: CustomerOffers },
            { path: 'notifications', name: 'customer-notifications', component: CustomerNotifications },
            { path: 'profile', name: 'customer-profile', component: CustomerProfile },
        ],
    },

    // ── Franchisee Panel ─────────────────────────────────────────
    {
        path: '/franchisee',
        component: DashboardLayout,
        meta: { requiresAuth: true, role: 'franchisee' },
        children: [
            { path: '', name: 'franchisee-dashboard', component: FranchiseeDashboard },
            { path: 'orders', name: 'franchisee-orders', component: FranchiseeOrders },
            { path: 'slots', name: 'franchisee-slots', component: FranchiseeSlots },
            { path: 'expenses', name: 'franchisee-expenses', component: FranchiseeExpenses },
            { path: 'reports', name: 'franchisee-reports', component: FranchiseeReports },
            { path: 'royalty', name: 'franchisee-royalty', component: FranchiseeRoyalty },
            { path: 'subscriptions', name: 'franchisee-subscriptions', component: FranchiseeSubscriptions },
            { path: 'offers', name: 'franchisee-offers', component: FranchiseeOffers },
        ],
    },

    // ── Admin / Super Admin ───────────────────────────────────────
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
            { path: 'franchisees', name: 'admin-franchisees', component: AdminFranchisees },
            { path: 'packages', name: 'admin-packages', component: AdminPackages },
            { path: 'referrals', name: 'admin-referrals', component: AdminReferrals },
            { path: 'blog', name: 'admin-blog', component: AdminBlog },
            { path: 'tickets', name: 'admin-tickets', component: AdminTickets },
            { path: 'partners', name: 'admin-partners', component: AdminPartners },
        ],
    },

    // ── Super Admin ───────────────────────────────────────────────
    {
        path: '/super-admin',
        component: DashboardLayout,
        meta: { requiresAuth: true, role: 'super_admin' },
        children: [
            { path: '', name: 'superadmin-dashboard', component: SuperAdminDashboard },
            { path: 'admins', name: 'superadmin-admins', component: SuperAdminAdmins },
            { path: 'settings', name: 'superadmin-settings', component: SuperAdminSettings },
            { path: 'master-slots', name: 'superadmin-slots', component: SuperAdminSlots },
            // Super admin also has access to all admin sub-pages via their own routes
            { path: 'users', name: 'superadmin-users', component: AdminUsers },
            { path: 'orders', name: 'superadmin-orders', component: AdminOrders },
            { path: 'franchisees', name: 'superadmin-franchisees', component: AdminFranchisees },
            { path: 'packages', name: 'superadmin-packages', component: AdminPackages },
            { path: 'referrals', name: 'superadmin-referrals', component: AdminReferrals },
            { path: 'coupons', name: 'superadmin-coupons', component: AdminCoupons },
            { path: 'blog', name: 'superadmin-blog', component: AdminBlog },
            { path: 'tickets', name: 'superadmin-tickets', component: AdminTickets },
            { path: 'partners', name: 'superadmin-partners', component: AdminPartners },
            { path: 'reports', name: 'superadmin-reports', component: AdminReports },
        ],
    },

    // ── Catch-all ─────────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', redirect: '/' },
];
