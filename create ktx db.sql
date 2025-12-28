-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               9.4.0 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.12.0.7122
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for dormitory_management
CREATE DATABASE IF NOT EXISTS `dormitory_management` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `dormitory_management`;

-- Dumping structure for table dormitory_management.admins
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.admins: ~1 rows (approximately)
DELETE FROM `admins`;
INSERT INTO `admins` (`id`, `username`, `password_hash`, `full_name`) VALUES
	(6, 'admin', '$2b$10$oCdeCC2QX.VlqFVQLRVY0O3CrqwNxgrm2oJi3tzBbSYkerSM2LWAW', 'System Administrator');

-- Dumping structure for table dormitory_management.buildings
CREATE TABLE IF NOT EXISTS `buildings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ví dụ: Tòa A1, Tòa B2',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Vị trí trong khuôn viên',
  `gender_restriction` enum('MALE','FEMALE','MIXED') COLLATE utf8mb4_unicode_ci DEFAULT 'MIXED' COMMENT 'Tòa dành riêng cho nam/nữ hoặc hỗn hợp',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.buildings: ~3 rows (approximately)
DELETE FROM `buildings`;
INSERT INTO `buildings` (`id`, `name`, `location`, `gender_restriction`) VALUES
	(1, 'C1', 'Khu ký túc xá – Dãy C1', 'MIXED'),
	(2, 'C2', 'Khu ký túc xá – Dãy C2', 'MIXED'),
	(3, 'C3', 'Khu ký túc xá – Dãy C3', 'MIXED');

-- Dumping structure for table dormitory_management.invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('ROOM_FEE','UTILITY_FEE','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester_id` int NOT NULL,
  `time_invoiced` datetime DEFAULT CURRENT_TIMESTAMP,
  `room_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `usage_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('UNPAID','PAID','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'UNPAID',
  `due_date` date DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `paid_by_student_id` int DEFAULT NULL COMMENT 'Người đại diện thanh toán (quan trọng với hóa đơn điện nước)',
  `payment_method` enum('CASH','BANK_TRANSFER','QR_CODE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_proof` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lưu ảnh bill chuyển khoản hoặc mã giao dịch',
  `created_by_manager_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_code` (`invoice_code`),
  KEY `semester_id` (`semester_id`),
  KEY `room_id` (`room_id`),
  KEY `student_id` (`student_id`),
  KEY `paid_by_student_id` (`paid_by_student_id`),
  KEY `created_by_manager_id` (`created_by_manager_id`),
  KEY `usage_id` (`usage_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`),
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `invoices_ibfk_4` FOREIGN KEY (`paid_by_student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `invoices_ibfk_5` FOREIGN KEY (`created_by_manager_id`) REFERENCES `managers` (`id`),
  CONSTRAINT `invoices_ibfk_6` FOREIGN KEY (`usage_id`) REFERENCES `monthly_usages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.invoices: ~0 rows (approximately)
DELETE FROM `invoices`;
INSERT INTO `invoices` (`id`, `invoice_code`, `type`, `semester_id`, `time_invoiced`, `room_id`, `student_id`, `usage_id`, `amount`, `description`, `status`, `due_date`, `paid_at`, `paid_by_student_id`, `payment_method`, `payment_proof`, `created_by_manager_id`) VALUES
	(1, 'U15-82055169-0', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 15, NULL, 1, 263500.00, 'Tiền điện nước tháng 12/2025 phòng P101', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(2, 'U16-82055170-4', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 16, NULL, 2, 163500.00, 'Tiền điện nước tháng 12/2025 phòng P102', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(3, 'U17-82055171-4', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 17, NULL, 3, 253000.00, 'Tiền điện nước tháng 12/2025 phòng P103', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(4, 'U18-82055173-6', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 18, NULL, 4, 502000.00, 'Tiền điện nước tháng 12/2025 phòng P104', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(5, 'U19-82055174-1', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 19, NULL, 5, 782500.00, 'Tiền điện nước tháng 12/2025 phòng P105', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(6, 'U20-82055175-0', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 20, NULL, 6, 382000.00, 'Tiền điện nước tháng 12/2025 phòng P106', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(7, 'U21-82055176-9', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 21, NULL, 7, 629000.00, 'Tiền điện nước tháng 12/2025 phòng P107', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(8, 'U22-82055177-4', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 22, NULL, 8, 225000.00, 'Tiền điện nước tháng 12/2025 phòng P108', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(9, 'U23-82055178-4', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 23, NULL, 9, 229000.00, 'Tiền điện nước tháng 12/2025 phòng P109', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(10, 'U24-82055179-5', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 24, NULL, 10, 402000.00, 'Tiền điện nước tháng 12/2025 phòng P110', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(11, 'U25-82055180-5', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 25, NULL, 11, 396000.00, 'Tiền điện nước tháng 12/2025 phòng P111', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(12, 'U26-82055182-5', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 26, NULL, 12, 158000.00, 'Tiền điện nước tháng 12/2025 phòng P112', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(13, 'U27-82055183-7', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 27, NULL, 13, 386000.00, 'Tiền điện nước tháng 12/2025 phòng P113', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(14, 'U28-82055184-8', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 28, NULL, 14, 472500.00, 'Tiền điện nước tháng 12/2025 phòng P114', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(15, 'U29-82055185-9', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 29, NULL, 15, 765500.00, 'Tiền điện nước tháng 12/2025 phòng P201', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(16, 'U30-82055186-7', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 30, NULL, 16, 185000.00, 'Tiền điện nước tháng 12/2025 phòng P202', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(17, 'U31-82055187-5', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 31, NULL, 17, 267000.00, 'Tiền điện nước tháng 12/2025 phòng P203', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(18, 'U32-82055188-0', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 32, NULL, 18, 595000.00, 'Tiền điện nước tháng 12/2025 phòng P204', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(19, 'U33-82055189-9', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 33, NULL, 19, 380500.00, 'Tiền điện nước tháng 12/2025 phòng P205', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(20, 'U34-82055190-5', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 34, NULL, 20, 355000.00, 'Tiền điện nước tháng 12/2025 phòng P206', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(21, 'U35-82055191-9', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 35, NULL, 21, 718000.00, 'Tiền điện nước tháng 12/2025 phòng P207', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(22, 'U36-82055192-7', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 36, NULL, 22, 377000.00, 'Tiền điện nước tháng 12/2025 phòng P208', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(23, 'U37-82055193-2', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 37, NULL, 23, 519500.00, 'Tiền điện nước tháng 12/2025 phòng P209', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(24, 'U38-82055195-2', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 38, NULL, 24, 114500.00, 'Tiền điện nước tháng 12/2025 phòng P210', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(25, 'U39-82055196-4', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 39, NULL, 25, 317500.00, 'Tiền điện nước tháng 12/2025 phòng P211', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(26, 'U40-82055198-5', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 40, NULL, 26, 585500.00, 'Tiền điện nước tháng 12/2025 phòng P212', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(27, 'U41-82055199-6', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 41, NULL, 27, 457500.00, 'Tiền điện nước tháng 12/2025 phòng P213', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(28, 'U42-82055200-1', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 42, NULL, 28, 751500.00, 'Tiền điện nước tháng 12/2025 phòng P214', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(29, 'U43-82055201-5', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 43, NULL, 29, 374000.00, 'Tiền điện nước tháng 12/2025 phòng P301', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(30, 'U44-82055203-6', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 44, NULL, 30, 368500.00, 'Tiền điện nước tháng 12/2025 phòng P302', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(31, 'U45-82055203-6', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 45, NULL, 31, 435000.00, 'Tiền điện nước tháng 12/2025 phòng P303', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(32, 'U46-82055204-1', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 46, NULL, 32, 453500.00, 'Tiền điện nước tháng 12/2025 phòng P304', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(33, 'U47-82055205-6', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 47, NULL, 33, 467000.00, 'Tiền điện nước tháng 12/2025 phòng P305', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(34, 'U48-82055206-9', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 48, NULL, 34, 115000.00, 'Tiền điện nước tháng 12/2025 phòng P306', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(35, 'U49-82055207-4', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 49, NULL, 35, 730000.00, 'Tiền điện nước tháng 12/2025 phòng P307', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(36, 'U50-82055209-6', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 50, NULL, 36, 322500.00, 'Tiền điện nước tháng 12/2025 phòng P308', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(37, 'U51-82055210-9', 'UTILITY_FEE', 4, '2025-12-16 17:47:35', 51, NULL, 37, 407500.00, 'Tiền điện nước tháng 12/2025 phòng P309', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8),
	(44, 'U52-85054838-1', 'UTILITY_FEE', 4, '2025-12-16 18:37:34', 52, NULL, 44, 1527500.00, 'Tiền điện nước tháng 12/2025 phòng P310', 'UNPAID', '2026-01-10', NULL, NULL, NULL, NULL, 8);

-- Dumping structure for table dormitory_management.managers
CREATE TABLE IF NOT EXISTS `managers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_first_login` tinyint(1) DEFAULT '1' COMMENT 'Bắt buộc đổi mật khẩu lần đầu',
  `building_id` int DEFAULT NULL,
  `fcm_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `building_id` (`building_id`),
  CONSTRAINT `managers_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.managers: ~2 rows (approximately)
DELETE FROM `managers`;
INSERT INTO `managers` (`id`, `username`, `email`, `password_hash`, `full_name`, `phone_number`, `is_first_login`, `building_id`, `fcm_token`) VALUES
	(8, 'manager1', 'manager1@ktx.com', '$2b$10$wvVqmwZKsG37zpFO.f/ePunp1ETHdPvNQDaz9Y6C3VrN1PlAYVKSO', 'Manager One', '0901234561', 1, 1, NULL),
	(9, 'manager2', 'manager2@ktx.com', '$2b$10$wvVqmwZKsG37zpFO.f/ePunp1ETHdPvNQDaz9Y6C3VrN1PlAYVKSO', 'Manager Two', '0901234562', 1, 2, NULL);

-- Dumping structure for table dormitory_management.monthly_usages
CREATE TABLE IF NOT EXISTS `monthly_usages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `electricity_old_index` int NOT NULL,
  `electricity_new_index` int NOT NULL,
  `electricity_price` decimal(10,2) NOT NULL,
  `water_old_index` int NOT NULL,
  `water_new_index` int NOT NULL,
  `water_price` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `monthly_usages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.monthly_usages: ~0 rows (approximately)
DELETE FROM `monthly_usages`;
INSERT INTO `monthly_usages` (`id`, `room_id`, `month`, `year`, `electricity_old_index`, `electricity_new_index`, `electricity_price`, `water_old_index`, `water_new_index`, `water_price`, `total_amount`, `created_at`) VALUES
	(1, 15, 12, 2025, 123, 176, 3500.00, 299, 312, 6000.00, 263500.00, '2025-12-16 17:47:35'),
	(2, 16, 12, 2025, 850, 883, 3500.00, 27, 35, 6000.00, 163500.00, '2025-12-16 17:47:35'),
	(3, 17, 12, 2025, 710, 772, 3500.00, 259, 265, 6000.00, 253000.00, '2025-12-16 17:47:35'),
	(4, 18, 12, 2025, 205, 345, 3500.00, 497, 499, 6000.00, 502000.00, '2025-12-16 17:47:35'),
	(5, 19, 12, 2025, 442, 633, 3500.00, 367, 386, 6000.00, 782500.00, '2025-12-16 17:47:35'),
	(6, 20, 12, 2025, 726, 818, 3500.00, 93, 103, 6000.00, 382000.00, '2025-12-16 17:47:35'),
	(7, 21, 12, 2025, 474, 652, 3500.00, 84, 85, 6000.00, 629000.00, '2025-12-16 17:47:35'),
	(8, 22, 12, 2025, 435, 465, 3500.00, 65, 85, 6000.00, 225000.00, '2025-12-16 17:47:35'),
	(9, 23, 12, 2025, 517, 555, 3500.00, 45, 61, 6000.00, 229000.00, '2025-12-16 17:47:35'),
	(10, 24, 12, 2025, 546, 630, 3500.00, 475, 493, 6000.00, 402000.00, '2025-12-16 17:47:35'),
	(11, 25, 12, 2025, 409, 517, 3500.00, 5, 8, 6000.00, 396000.00, '2025-12-16 17:47:35'),
	(12, 26, 12, 2025, 436, 476, 3500.00, 293, 296, 6000.00, 158000.00, '2025-12-16 17:47:35'),
	(13, 27, 12, 2025, 385, 473, 3500.00, 322, 335, 6000.00, 386000.00, '2025-12-16 17:47:35'),
	(14, 28, 12, 2025, 102, 213, 3500.00, 126, 140, 6000.00, 472500.00, '2025-12-16 17:47:35'),
	(15, 29, 12, 2025, 526, 731, 3500.00, 60, 68, 6000.00, 765500.00, '2025-12-16 17:47:35'),
	(16, 30, 12, 2025, 98, 132, 3500.00, 263, 274, 6000.00, 185000.00, '2025-12-16 17:47:35'),
	(17, 31, 12, 2025, 419, 473, 3500.00, 221, 234, 6000.00, 267000.00, '2025-12-16 17:47:35'),
	(18, 32, 12, 2025, 430, 576, 3500.00, 250, 264, 6000.00, 595000.00, '2025-12-16 17:47:35'),
	(19, 33, 12, 2025, 870, 977, 3500.00, 460, 461, 6000.00, 380500.00, '2025-12-16 17:47:35'),
	(20, 34, 12, 2025, 373, 471, 3500.00, 228, 230, 6000.00, 355000.00, '2025-12-16 17:47:35'),
	(21, 35, 12, 2025, 441, 617, 3500.00, 265, 282, 6000.00, 718000.00, '2025-12-16 17:47:35'),
	(22, 36, 12, 2025, 101, 195, 3500.00, 186, 194, 6000.00, 377000.00, '2025-12-16 17:47:35'),
	(23, 37, 12, 2025, 56, 201, 3500.00, 228, 230, 6000.00, 519500.00, '2025-12-16 17:47:35'),
	(24, 38, 12, 2025, 170, 201, 3500.00, 51, 52, 6000.00, 114500.00, '2025-12-16 17:47:35'),
	(25, 39, 12, 2025, 115, 180, 3500.00, 335, 350, 6000.00, 317500.00, '2025-12-16 17:47:35'),
	(26, 40, 12, 2025, 816, 961, 3500.00, 367, 380, 6000.00, 585500.00, '2025-12-16 17:47:35'),
	(27, 41, 12, 2025, 808, 925, 3500.00, 37, 45, 6000.00, 457500.00, '2025-12-16 17:47:35'),
	(28, 42, 12, 2025, 159, 348, 3500.00, 41, 56, 6000.00, 751500.00, '2025-12-16 17:47:35'),
	(29, 43, 12, 2025, 157, 245, 3500.00, 366, 377, 6000.00, 374000.00, '2025-12-16 17:47:35'),
	(30, 44, 12, 2025, 749, 844, 3500.00, 95, 101, 6000.00, 368500.00, '2025-12-16 17:47:35'),
	(31, 45, 12, 2025, 242, 356, 3500.00, 166, 172, 6000.00, 435000.00, '2025-12-16 17:47:35'),
	(32, 46, 12, 2025, 816, 925, 3500.00, 163, 175, 6000.00, 453500.00, '2025-12-16 17:47:35'),
	(33, 47, 12, 2025, 695, 825, 3500.00, 54, 56, 6000.00, 467000.00, '2025-12-16 17:47:35'),
	(34, 48, 12, 2025, 727, 753, 3500.00, 124, 128, 6000.00, 115000.00, '2025-12-16 17:47:35'),
	(35, 49, 12, 2025, 13, 213, 3500.00, 160, 165, 6000.00, 730000.00, '2025-12-16 17:47:35'),
	(36, 50, 12, 2025, 730, 817, 3500.00, 27, 30, 6000.00, 322500.00, '2025-12-16 17:47:35'),
	(37, 51, 12, 2025, 525, 626, 3500.00, 150, 159, 6000.00, 407500.00, '2025-12-16 17:47:35'),
	(44, 52, 12, 2025, 0, 450, 2950.00, 0, 20, 10000.00, 1527500.00, '2025-12-16 18:37:34');

-- Dumping structure for table dormitory_management.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sender_role` enum('ADMIN','MANAGER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` int NOT NULL,
  `target_scope` enum('ALL','BUILDING','ROOM','INDIVIDUAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('ANNOUNCEMENT','REMINDER') COLLATE utf8mb4_unicode_ci DEFAULT 'ANNOUNCEMENT',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.notifications: ~0 rows (approximately)
DELETE FROM `notifications`;

-- Dumping structure for table dormitory_management.notification_recipients
CREATE TABLE IF NOT EXISTS `notification_recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notification_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `room_id` int DEFAULT NULL,
  `building_id` int DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_id` (`notification_id`),
  KEY `student_id` (`student_id`),
  KEY `room_id` (`room_id`),
  KEY `building_id` (`building_id`),
  CONSTRAINT `notification_recipients_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_recipients_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `notification_recipients_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `notification_recipients_ibfk_4` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`),
  CONSTRAINT `notification_recipients_chk_1` CHECK ((((`student_id` is not null) and (`room_id` is null) and (`building_id` is null)) or ((`student_id` is null) and (`room_id` is not null) and (`building_id` is null)) or ((`student_id` is null) and (`room_id` is null) and (`building_id` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.notification_recipients: ~0 rows (approximately)
DELETE FROM `notification_recipients`;

-- Dumping structure for table dormitory_management.registrations
CREATE TABLE IF NOT EXISTS `registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `semester_id` int NOT NULL,
  `registration_type` enum('NORMAL','PRIORITY','RENEWAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `desired_room_id` int DEFAULT NULL,
  `desired_building_id` int DEFAULT NULL,
  `priority_category` enum('NONE','POOR_HOUSEHOLD','DISABILITY','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT 'NONE',
  `priority_description` text COLLATE utf8mb4_unicode_ci,
  `evidence_file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','RETURN','AWAITING_PAYMENT','APPROVED','COMPLETED','REJECTED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `invoice_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `desired_room_id` (`desired_room_id`),
  KEY `desired_building_id` (`desired_building_id`),
  KEY `semester_id` (`semester_id`),
  CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `registrations_ibfk_2` FOREIGN KEY (`desired_room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `registrations_ibfk_3` FOREIGN KEY (`desired_building_id`) REFERENCES `buildings` (`id`),
  CONSTRAINT `registrations_ibfk_4` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.registrations: ~1 rows (approximately)
DELETE FROM `registrations`;
INSERT INTO `registrations` (`id`, `student_id`, `semester_id`, `registration_type`, `desired_room_id`, `desired_building_id`, `priority_category`, `priority_description`, `evidence_file_path`, `status`, `invoice_id`, `created_at`, `updated_at`, `admin_note`) VALUES
	(1, 2, 4, 'PRIORITY', NULL, 2, 'POOR_HOUSEHOLD', NULL, 'uploads/evidence/evidence-1765648805977-776628501.docx', 'RETURN', NULL, '2025-12-14 01:00:06', '2025-12-14 01:42:06', 'thiếu minh chứng');

-- Dumping structure for table dormitory_management.rooms
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `building_id` int NOT NULL,
  `room_number` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Số phòng, vd: 301',
  `floor` int NOT NULL COMMENT 'Tầng',
  `max_capacity` int NOT NULL DEFAULT '4',
  `price_per_semester` decimal(10,2) NOT NULL,
  `has_ac` tinyint(1) DEFAULT '0' COMMENT 'Điều hòa',
  `has_heater` tinyint(1) DEFAULT '0' COMMENT 'Nóng lạnh',
  `has_washer` tinyint(1) DEFAULT '0' COMMENT 'Máy giặt chung/riêng',
  `status` enum('AVAILABLE','FULL','MAINTENANCE') COLLATE utf8mb4_unicode_ci DEFAULT 'AVAILABLE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `building_id` (`building_id`,`room_number`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.rooms: ~42 rows (approximately)
DELETE FROM `rooms`;
INSERT INTO `rooms` (`id`, `building_id`, `room_number`, `floor`, `max_capacity`, `price_per_semester`, `has_ac`, `has_heater`, `has_washer`, `status`) VALUES
	(15, 1, 'P101', 1, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(16, 1, 'P102', 1, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(17, 1, 'P103', 1, 6, 3500000.00, 0, 0, 0, 'AVAILABLE'),
	(18, 1, 'P104', 1, 6, 3500000.00, 0, 0, 0, 'AVAILABLE'),
	(19, 1, 'P105', 1, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(20, 1, 'P106', 1, 8, 4000000.00, 0, 0, 0, 'AVAILABLE'),
	(21, 1, 'P107', 1, 8, 4000000.00, 0, 0, 0, 'AVAILABLE'),
	(22, 1, 'P108', 1, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(23, 1, 'P109', 1, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(24, 1, 'P110', 1, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(25, 1, 'P111', 1, 6, 3500000.00, 0, 0, 0, 'AVAILABLE'),
	(26, 1, 'P112', 1, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(27, 1, 'P113', 1, 10, 4500000.00, 0, 0, 0, 'AVAILABLE'),
	(28, 1, 'P114', 1, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(29, 2, 'P201', 2, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(30, 2, 'P202', 2, 6, 3500000.00, 0, 0, 0, 'AVAILABLE'),
	(31, 2, 'P203', 2, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(32, 2, 'P204', 2, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(33, 2, 'P205', 2, 8, 4000000.00, 0, 0, 0, 'AVAILABLE'),
	(34, 2, 'P206', 2, 8, 4000000.00, 0, 0, 0, 'AVAILABLE'),
	(35, 2, 'P207', 2, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(36, 2, 'P208', 2, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(37, 2, 'P209', 2, 6, 3500000.00, 0, 0, 0, 'AVAILABLE'),
	(38, 2, 'P210', 2, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(39, 2, 'P211', 2, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(40, 2, 'P212', 2, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(41, 2, 'P213', 2, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(42, 2, 'P214', 2, 10, 4500000.00, 0, 0, 0, 'AVAILABLE'),
	(43, 3, 'P301', 3, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(44, 3, 'P302', 3, 6, 3500000.00, 0, 0, 0, 'AVAILABLE'),
	(45, 3, 'P303', 3, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(46, 3, 'P304', 3, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(47, 3, 'P305', 3, 8, 4000000.00, 0, 0, 0, 'AVAILABLE'),
	(48, 3, 'P306', 3, 8, 4000000.00, 0, 0, 0, 'AVAILABLE'),
	(49, 3, 'P307', 3, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(50, 3, 'P308', 3, 6, 3500000.00, 0, 0, 0, 'AVAILABLE'),
	(51, 3, 'P309', 3, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(52, 3, 'P310', 3, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(53, 3, 'P311', 3, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(54, 3, 'P312', 3, 4, 3000000.00, 0, 0, 0, 'AVAILABLE'),
	(55, 3, 'P313', 3, 10, 4500000.00, 0, 0, 0, 'AVAILABLE'),
	(56, 3, 'P314', 3, 4, 3000000.00, 0, 0, 0, 'AVAILABLE');

-- Dumping structure for table dormitory_management.semesters
CREATE TABLE IF NOT EXISTS `semesters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `registration_open_date` datetime DEFAULT NULL,
  `registration_close_date` datetime DEFAULT NULL,
  `registration_special_open_date` datetime DEFAULT NULL,
  `registration_special_close_date` datetime DEFAULT NULL,
  `renewal_open_date` datetime DEFAULT NULL,
  `renewal_close_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0' COMMENT 'Chỉ có 1 học kỳ active tại 1 thời điểm',
  `term` enum('1','2','3') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Học kỳ (1, 2, hoặc 3)',
  `academic_year` varchar(9) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Năm học, ví dụ: 2024-2025',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.semesters: ~4 rows (approximately)
DELETE FROM `semesters`;
INSERT INTO `semesters` (`id`, `start_date`, `end_date`, `registration_open_date`, `registration_close_date`, `registration_special_open_date`, `registration_special_close_date`, `renewal_open_date`, `renewal_close_date`, `is_active`, `term`, `academic_year`) VALUES
	(2, '2025-02-01', '2025-06-15', '2025-01-05 08:00:00', '2025-01-20 17:00:00', '2025-01-01 08:00:00', '2025-01-04 17:00:00', '2025-01-21 08:00:00', '2025-01-30 17:00:00', 0, '2', '2024-2025'),
	(3, '2025-07-01', '2025-08-15', '2025-06-10 08:00:00', '2025-06-20 17:00:00', NULL, NULL, '2025-06-21 08:00:00', '2025-06-30 17:00:00', 0, '3', '2024-2025'),
	(4, '2025-09-15', '2026-02-03', '2025-09-01 09:41:00', '2025-09-10 09:41:00', '2025-08-10 09:41:00', '2025-08-20 09:41:00', '2025-08-10 09:42:00', '2025-08-25 09:42:00', 1, '1', '2025-2026');

-- Dumping structure for table dormitory_management.service_prices
CREATE TABLE IF NOT EXISTS `service_prices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `apply_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.service_prices: ~0 rows (approximately)
DELETE FROM `service_prices`;
INSERT INTO `service_prices` (`id`, `service_name`, `unit_price`, `apply_date`, `is_active`) VALUES
	(1, 'ELECTRICITY', 2950.00, '2025-12-16', 1),
	(2, 'WATER', 10000.00, '2025-12-16', 1);

-- Dumping structure for table dormitory_management.stay_records
CREATE TABLE IF NOT EXISTS `stay_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `room_id` int NOT NULL,
  `semester_id` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('ACTIVE','CHECKED_OUT','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `room_id` (`room_id`),
  KEY `semester_id` (`semester_id`),
  CONSTRAINT `stay_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `stay_records_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `stay_records_ibfk_3` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.stay_records: ~0 rows (approximately)
DELETE FROM `stay_records`;

-- Dumping structure for table dormitory_management.students
CREATE TABLE IF NOT EXISTS `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mssv` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã số sinh viên',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mật khẩu đồng bộ hệ thống trường',
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('MALE','FEMALE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `class_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_status` enum('STUDYING','GRADUATED') COLLATE utf8mb4_unicode_ci DEFAULT 'STUDYING' COMMENT 'Trạng thái sinh viên hiện tại',
  `stay_status` enum('NOT_STAYING','STAYING','APPLIED') COLLATE utf8mb4_unicode_ci DEFAULT 'NOT_STAYING' COMMENT 'Trạng thái lưu trú hiện tại',
  `fcm_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lưu Device Token để bắn thông báo',
  `current_room_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mssv` (`mssv`),
  KEY `current_room_id` (`current_room_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`current_room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.students: ~6 rows (approximately)
DELETE FROM `students`;
INSERT INTO `students` (`id`, `mssv`, `password_hash`, `full_name`, `email`, `phone_number`, `gender`, `class_name`, `student_status`, `stay_status`, `fcm_token`, `current_room_id`) VALUES
	(12, '20225001', '$2b$10$zMV7wWQ9DVT2GLbcG1RbnOZ07wr0OQkSRGLWbOa99ikbssLI/aEnC', 'Nguyen Van A', 'sv001@student.com', '0912345671', 'MALE', 'CNTT1', 'STUDYING', 'NOT_STAYING', NULL, 15),
	(13, '20225002', '$2b$10$zMV7wWQ9DVT2GLbcG1RbnOZ07wr0OQkSRGLWbOa99ikbssLI/aEnC', 'Tran Thi B', 'sv002@student.com', '0912345672', 'FEMALE', 'KT1', 'STUDYING', 'NOT_STAYING', NULL, 15),
	(14, '20225003', '$2b$10$zMV7wWQ9DVT2GLbcG1RbnOZ07wr0OQkSRGLWbOa99ikbssLI/aEnC', 'Le Van C', 'sv003@student.com', '0912345673', 'MALE', 'CNTT2', 'STUDYING', 'NOT_STAYING', NULL, 20),
	(15, '20225004', '$2b$10$zMV7wWQ9DVT2GLbcG1RbnOZ07wr0OQkSRGLWbOa99ikbssLI/aEnC', 'Pham Thi D', 'sv004@student.com', '0912345674', 'FEMALE', 'NNA1', 'STUDYING', 'NOT_STAYING', NULL, 26),
	(16, '20225005', '$2b$10$zMV7wWQ9DVT2GLbcG1RbnOZ07wr0OQkSRGLWbOa99ikbssLI/aEnC', 'Hoang Van E', 'sv005@student.com', '0912345675', 'MALE', 'DT1', 'STUDYING', 'NOT_STAYING', NULL, 49);

-- Dumping structure for table dormitory_management.support_requests
CREATE TABLE IF NOT EXISTS `support_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `type` enum('COMPLAINT','REPAIR','PROPOSAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','PROCESSING','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `processed_by_manager_id` int DEFAULT NULL,
  `response_content` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `processed_by_manager_id` (`processed_by_manager_id`),
  CONSTRAINT `support_requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `support_requests_ibfk_2` FOREIGN KEY (`processed_by_manager_id`) REFERENCES `managers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dormitory_management.support_requests: ~0 rows (approximately)
DELETE FROM `support_requests`;
INSERT INTO `support_requests` (`id`, `student_id`, `type`, `title`, `content`, `attachment_path`, `status`, `processed_by_manager_id`, `response_content`, `created_at`, `updated_at`) VALUES
	(3, 1, 'REPAIR', 'bò iu ', 'bò iu ti béoooooooo', 'uploads/support_requests/attachment-1765266235742-729552709.jpeg', 'PROCESSING', 4, '3h 15/10 chiều cần có người ở phòng để xử lý', '2025-12-09 14:43:55', '2025-12-14 00:25:08');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
