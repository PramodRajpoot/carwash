-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 03, 2026 at 11:46 AM
-- Server version: 8.0.45-0ubuntu0.24.04.1
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `carwash`
--

-- --------------------------------------------------------

--
-- Table structure for table `blog_posts`
--

CREATE TABLE `blog_posts` (
  `id` bigint UNSIGNED NOT NULL,
  `author_id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `featured_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `vehicle_id` bigint UNSIGNED NOT NULL,
  `franchisee_id` bigint UNSIGNED DEFAULT NULL,
  `package_id` bigint UNSIGNED DEFAULT NULL,
  `booking_date` date NOT NULL,
  `slot_time` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cod',
  `total_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `customer_id`, `vehicle_id`, `franchisee_id`, `package_id`, `booking_date`, `slot_time`, `status`, `payment_status`, `payment_method`, `total_price`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 1, 6, '2026-05-28', '11:00 AM - 01:00 PM', 'completed', 'paid', 'subscription', 0.00, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(2, 4, 2, 1, 1, '2026-05-23', '03:00 PM - 05:00 PM', 'completed', 'paid', 'cod', 299.00, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(3, 4, 1, 1, 6, '2026-06-03', '09:00 AM - 11:00 AM', 'assigned', 'paid', 'subscription', 0.00, '2026-06-02 02:48:13', '2026-06-02 02:48:13');

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` bigint UNSIGNED NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `expires_at` date DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `discount_type`, `discount_value`, `expires_at`, `status`, `created_at`, `updated_at`) VALUES
(1, 'WELCOME10', 'percentage', 10.00, '2026-07-02', 'active', '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(2, 'CLEAN50', 'fixed', 50.00, '2026-07-02', 'active', '2026-06-02 02:48:13', '2026-06-02 02:48:13');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` bigint UNSIGNED NOT NULL,
  `franchisee_id` bigint UNSIGNED NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `expense_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `franchisee_id`, `category`, `amount`, `description`, `expense_date`, `created_at`, `updated_at`) VALUES
(1, 1, 'salary', 12000.00, 'Monthly salary paid to Washer Amit', '2026-05-31', '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(2, 1, 'chemical', 3500.00, 'Chemical wax shampoo refill pack (50L)', '2026-05-29', '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(3, 1, 'maintenance', 1200.00, 'Pressure motor pump servicing and oil change', '2026-05-26', '2026-06-02 02:48:13', '2026-06-02 02:48:13');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback_reviews`
--

CREATE TABLE `feedback_reviews` (
  `id` bigint UNSIGNED NOT NULL,
  `booking_id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `rating` tinyint UNSIGNED NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `franchisees`
--

CREATE TABLE `franchisees` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `center_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `royalty_percentage` decimal(5,2) NOT NULL DEFAULT '10.00',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `franchisees`
--

INSERT INTO `franchisees` (`id`, `user_id`, `center_name`, `address`, `city`, `latitude`, `longitude`, `royalty_percentage`, `status`, `created_at`, `updated_at`) VALUES
(1, 3, 'Mumbai North Center', 'Linking Road, Bandra West', 'Mumbai', 19.05960000, 72.82950000, 10.00, 'active', '2026-06-02 02:48:13', '2026-06-03 06:05:52');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2014_10_12_100000_create_password_reset_tokens_table', 1),
(3, '2019_08_19_000000_create_failed_jobs_table', 1),
(4, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(5, '2026_06_02_000000_create_carwash_tables', 1),
(6, '2026_06_03_000001_extend_users_and_create_platform_tables', 2);

-- --------------------------------------------------------

--
-- Table structure for table `notifications_log`
--

CREATE TABLE `notifications_log` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(17, 'App\\Models\\User', 4, 'auth_token', '702ccf488dc7e2fbd34b4f01116bf7ce7183c5d3e403a921a689ace6c9567e53', '[\"*\"]', '2026-06-03 06:08:22', NULL, '2026-06-03 06:06:46', '2026-06-03 06:08:22');

-- --------------------------------------------------------

--
-- Table structure for table `platform_settings`
--

CREATE TABLE `platform_settings` (
  `id` bigint UNSIGNED NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `group` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `royalty_payments`
--

CREATE TABLE `royalty_payments` (
  `id` bigint UNSIGNED NOT NULL,
  `franchisee_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `due_date` date NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `paid_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_packages`
--

CREATE TABLE `service_packages` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `vehicle_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `frequency_days` int NOT NULL DEFAULT '30',
  `max_bookings` int NOT NULL DEFAULT '4',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_packages`
--

INSERT INTO `service_packages` (`id`, `name`, `description`, `vehicle_type`, `price`, `frequency_days`, `max_bookings`, `created_at`, `updated_at`) VALUES
(1, 'Eco Hatchback Wash', 'Exterior waterless foam wash, tire dressing, and vacuuming.', 'hatchback', 299.00, 0, 1, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(2, 'Premium Hatchback Monthly', '4 detailed foam washes per month, deep interior vacuuming, dashboard polish.', 'hatchback', 999.00, 30, 4, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(3, 'Eco Sedan Wash', 'Eco-friendly waterless pressure wash, interior vacuuming and perfume spray.', 'sedan', 399.00, 0, 1, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(4, 'Premium Sedan Monthly', '4 complete detailing washes, wax coating, deep carpet vacuuming and glass cleaning.', 'sedan', 1299.00, 30, 4, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(5, 'Eco SUV Wash', 'Pressure wash, mud removal, underbody spray, vacuuming and tire glaze.', 'suv', 499.00, 0, 1, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(6, 'Premium SUV Monthly', '4 premium underbody & exterior washes, complete leather conditioning, and wheel detailing.', 'suv', 1499.00, 30, 4, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(7, 'Eco Commercial Wash', 'High-efficiency pressure wash for light commercial vans, cabin dusting, outer cleaning.', 'commercial', 699.00, 0, 1, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(8, 'Bus Wash Standard', 'Heavy duty exterior pressure wash, wheels wash, and basic windows spray.', 'bus', 1499.00, 0, 1, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(9, 'Volvo Bus Luxury Wash', 'Detailed multi-stage pressure wash, windshield buffing, side panel wax coating, interior deodorizing.', 'volvo_bus', 2499.00, 0, 1, '2026-06-02 02:48:13', '2026-06-02 02:48:13');

-- --------------------------------------------------------

--
-- Table structure for table `slots`
--

CREATE TABLE `slots` (
  `id` bigint UNSIGNED NOT NULL,
  `franchisee_id` bigint UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `time_range` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_bookings` int NOT NULL DEFAULT '3',
  `current_bookings` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `slots`
--

INSERT INTO `slots` (`id`, `franchisee_id`, `date`, `time_range`, `max_bookings`, `current_bookings`, `created_at`, `updated_at`) VALUES
(1, 1, '2026-06-02', '09:00 AM - 11:00 AM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(2, 1, '2026-06-02', '11:00 AM - 01:00 PM', 3, 1, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(3, 1, '2026-06-02', '01:00 PM - 03:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(4, 1, '2026-06-02', '03:00 PM - 05:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(5, 1, '2026-06-03', '09:00 AM - 11:00 AM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(6, 1, '2026-06-03', '11:00 AM - 01:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(7, 1, '2026-06-03', '01:00 PM - 03:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(8, 1, '2026-06-03', '03:00 PM - 05:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(9, 1, '2026-06-04', '09:00 AM - 11:00 AM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(10, 1, '2026-06-04', '11:00 AM - 01:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(11, 1, '2026-06-04', '01:00 PM - 03:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(12, 1, '2026-06-04', '03:00 PM - 05:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(13, 1, '2026-06-05', '09:00 AM - 11:00 AM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(14, 1, '2026-06-05', '11:00 AM - 01:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(15, 1, '2026-06-05', '01:00 PM - 03:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(16, 1, '2026-06-05', '03:00 PM - 05:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(17, 1, '2026-06-06', '09:00 AM - 11:00 AM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(18, 1, '2026-06-06', '11:00 AM - 01:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(19, 1, '2026-06-06', '01:00 PM - 03:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(20, 1, '2026-06-06', '03:00 PM - 05:00 PM', 3, 0, '2026-06-02 02:48:13', '2026-06-02 02:48:13');

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `package_id` bigint UNSIGNED NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `booking_count` int NOT NULL DEFAULT '0',
  `starts_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `customer_id`, `package_id`, `status`, `booking_count`, `starts_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 4, 6, 'active', 1, '2026-05-28 02:48:13', '2026-06-27 02:48:13', '2026-06-02 02:48:13', '2026-06-02 02:48:13');

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `admin_reply` text COLLATE utf8mb4_unicode_ci,
  `replied_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `referral_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referred_by` bigint UNSIGNED DEFAULT NULL,
  `referral_coins` int NOT NULL DEFAULT '0',
  `reward_coins` int NOT NULL DEFAULT '0',
  `e_points` bigint UNSIGNED NOT NULL DEFAULT '0',
  `pending_epoints` bigint UNSIGNED NOT NULL DEFAULT '0',
  `first_booking_discount` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `email_verified_at`, `password`, `role`, `referral_code`, `referred_by`, `referral_coins`, `reward_coins`, `e_points`, `pending_epoints`, `first_booking_discount`, `status`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'superadmin@carwash.com', '9999999991', NULL, '$2y$12$D5ha6sbxzRXqzS2OkYRJwOjL0yA5fn.fa0/WCG42LhDYL8T67US1u', 'super_admin', NULL, NULL, 0, 0, 0, 0, 0, 'active', NULL, '2026-06-02 02:48:12', '2026-06-03 06:05:52'),
(2, 'Customer Care Admin', 'admin@carwash.com', '9999999992', NULL, '$2y$12$SMXpna89r69W5KQcBfEdDu2/jV.WRPe0RZPYqTGJ23yC9sQIuQR3q', 'admin', NULL, NULL, 0, 0, 0, 0, 0, 'active', NULL, '2026-06-02 02:48:12', '2026-06-03 06:05:52'),
(3, 'John Franchisee', 'franchisee@carwash.com', '9999999993', NULL, '$2y$12$I05jSOeRtxl/doXf1OGv2u5yTNQFYIsCUZO7GyxhUtdeixYeRAWJm', 'franchisee', NULL, NULL, 0, 0, 0, 0, 0, 'active', NULL, '2026-06-02 02:48:12', '2026-06-03 06:05:52'),
(4, 'David Customer', 'customer@carwash.com', '9999999994', NULL, '$2y$12$LL8jokBiUU6a0UvxB2DKb.wiQ014n5FblPOQbvXhmsCgKWI/Yrlge', 'customer', 'DAVID100', NULL, 500, 250, 0, 0, 0, 'active', NULL, '2026-06-02 02:48:13', '2026-06-03 06:05:52'),
(5, 'Test Customer', 'customer@carbonhydro.in', '1234567890', NULL, '$2y$12$ivcFvFK7YmzZW9YbwEBdJeKOrxrv2YTV5vr8rMg5.HhuBSihWvKHq', 'customer', 'YJX69ODO', NULL, 0, 0, 0, 0, 0, 'active', NULL, '2026-06-02 04:29:50', '2026-06-02 04:29:50'),
(6, 'Admin User', 'admin@carbonhydro.in', NULL, NULL, '$2y$12$MhyEVq4UOho3ZBE.VSCvpObFifYzlBCWc5nYTnhONLDrx9n8Tu496', 'customer', 'MJVNKXSA', NULL, 0, 0, 0, 0, 0, 'active', NULL, '2026-06-02 04:34:15', '2026-06-02 04:34:15'),
(7, 'Franchisee User', 'franchisee@carbonhydro.in', '+91 99999 99999', NULL, '$2y$12$gPDO6oy5Si4MHTfFF5Pf7O0N.rYXBWPjZ7YDBFRtLLNRdb6p2voY2', 'customer', 'POJO8V9A', NULL, 0, 0, 0, 0, 0, 'active', NULL, '2026-06-02 05:30:04', '2026-06-02 05:30:04');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `vehicle_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `make_model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plate_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `customer_id`, `vehicle_type`, `make_model`, `plate_number`, `created_at`, `updated_at`) VALUES
(1, 4, 'suv', 'Toyota Fortuner (Black)', 'MH-01-AB-1234', '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(2, 4, 'hatchback', 'Hyundai i20 (White)', 'MH-01-CD-5678', '2026-06-02 02:48:13', '2026-06-02 02:48:13'),
(3, 5, 'hatchback', 'Tesla Model 3', 'MH 12 TS 1234', '2026-06-02 04:31:30', '2026-06-02 04:31:30'),
(4, 5, 'hatchback', 'Tesla Model Y', 'MH-12-CH-2026', '2026-06-02 05:11:33', '2026-06-02 05:11:33');

-- --------------------------------------------------------

--
-- Table structure for table `wallet_transactions`
--

CREATE TABLE `wallet_transactions` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint UNSIGNED NOT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmed',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wishlists`
--

CREATE TABLE `wishlists` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `package_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `wishlists`
--

INSERT INTO `wishlists` (`id`, `customer_id`, `package_id`, `created_at`, `updated_at`) VALUES
(1, 4, 2, '2026-06-02 02:48:13', '2026-06-02 02:48:13');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `blog_posts_slug_unique` (`slug`),
  ADD KEY `blog_posts_author_id_foreign` (`author_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookings_customer_id_foreign` (`customer_id`),
  ADD KEY `bookings_vehicle_id_foreign` (`vehicle_id`),
  ADD KEY `bookings_franchisee_id_foreign` (`franchisee_id`),
  ADD KEY `bookings_package_id_foreign` (`package_id`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `coupons_code_unique` (`code`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expenses_franchisee_id_foreign` (`franchisee_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `feedback_reviews`
--
ALTER TABLE `feedback_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `feedback_reviews_booking_id_foreign` (`booking_id`),
  ADD KEY `feedback_reviews_customer_id_foreign` (`customer_id`);

--
-- Indexes for table `franchisees`
--
ALTER TABLE `franchisees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `franchisees_user_id_foreign` (`user_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications_log`
--
ALTER TABLE `notifications_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_log_user_id_foreign` (`user_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `platform_settings`
--
ALTER TABLE `platform_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `platform_settings_key_unique` (`key`);

--
-- Indexes for table `royalty_payments`
--
ALTER TABLE `royalty_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `royalty_payments_franchisee_id_foreign` (`franchisee_id`);

--
-- Indexes for table `service_packages`
--
ALTER TABLE `service_packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `slots`
--
ALTER TABLE `slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `slots_franchisee_id_foreign` (`franchisee_id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subscriptions_customer_id_foreign` (`customer_id`),
  ADD KEY `subscriptions_package_id_foreign` (`package_id`);

--
-- Indexes for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `support_tickets_customer_id_foreign` (`customer_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_referral_code_unique` (`referral_code`),
  ADD KEY `users_referred_by_foreign` (`referred_by`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicles_customer_id_foreign` (`customer_id`);

--
-- Indexes for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wallet_transactions_user_id_foreign` (`user_id`);

--
-- Indexes for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wishlists_customer_id_foreign` (`customer_id`),
  ADD KEY `wishlists_package_id_foreign` (`package_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `blog_posts`
--
ALTER TABLE `blog_posts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedback_reviews`
--
ALTER TABLE `feedback_reviews`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `franchisees`
--
ALTER TABLE `franchisees`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `notifications_log`
--
ALTER TABLE `notifications_log`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `platform_settings`
--
ALTER TABLE `platform_settings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `royalty_payments`
--
ALTER TABLE `royalty_payments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_packages`
--
ALTER TABLE `service_packages`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `slots`
--
ALTER TABLE `slots`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `support_tickets`
--
ALTER TABLE `support_tickets`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wishlists`
--
ALTER TABLE `wishlists`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD CONSTRAINT `blog_posts_author_id_foreign` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_franchisee_id_foreign` FOREIGN KEY (`franchisee_id`) REFERENCES `franchisees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `bookings_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `service_packages` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `bookings_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_franchisee_id_foreign` FOREIGN KEY (`franchisee_id`) REFERENCES `franchisees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `feedback_reviews`
--
ALTER TABLE `feedback_reviews`
  ADD CONSTRAINT `feedback_reviews_booking_id_foreign` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedback_reviews_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `franchisees`
--
ALTER TABLE `franchisees`
  ADD CONSTRAINT `franchisees_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications_log`
--
ALTER TABLE `notifications_log`
  ADD CONSTRAINT `notifications_log_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `royalty_payments`
--
ALTER TABLE `royalty_payments`
  ADD CONSTRAINT `royalty_payments_franchisee_id_foreign` FOREIGN KEY (`franchisee_id`) REFERENCES `franchisees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `slots`
--
ALTER TABLE `slots`
  ADD CONSTRAINT `slots_franchisee_id_foreign` FOREIGN KEY (`franchisee_id`) REFERENCES `franchisees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscriptions_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `service_packages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD CONSTRAINT `support_tickets_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_referred_by_foreign` FOREIGN KEY (`referred_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD CONSTRAINT `wallet_transactions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD CONSTRAINT `wishlists_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlists_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `service_packages` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
