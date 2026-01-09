-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               11.8.3-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.11.0.7065
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
DROP DATABASE IF EXISTS `dormitory_management`;
CREATE DATABASE IF NOT EXISTS `dormitory_management` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `dormitory_management`;

-- Dumping structure for table dormitory_management.admins
DROP TABLE IF EXISTS `admins`;
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.buildings
DROP TABLE IF EXISTS `buildings`;
CREATE TABLE IF NOT EXISTS `buildings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'Ví dụ: Tòa A1, Tòa B2',
  `location` varchar(255) DEFAULT NULL,
  `gender_restriction` enum('MALE','FEMALE','MIXED') DEFAULT 'MIXED',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.invoices
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_code` varchar(20) NOT NULL,
  `type` enum('ROOM_FEE','UTILITY_FEE','OTHER') NOT NULL,
  `semester_id` int(11) NOT NULL,
  `time_invoiced` datetime DEFAULT current_timestamp(),
  `room_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `usage_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('UNPAID','SUBMITTED','PAID','CANCELLED') NOT NULL,
  `due_date` date DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `paid_by_student_id` int(11) DEFAULT NULL,
  `payment_method` enum('CASH','BANK_TRANSFER','QR_CODE') DEFAULT NULL,
  `payment_proof` varchar(255) DEFAULT NULL,
  `created_by_manager_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_code` (`invoice_code`),
  KEY `invoices_ibfk_1` (`semester_id`),
  KEY `invoices_ibfk_2` (`room_id`),
  KEY `invoices_ibfk_3` (`student_id`),
  KEY `invoices_ibfk_4` (`paid_by_student_id`),
  KEY `invoices_ibfk_5` (`created_by_manager_id`),
  KEY `invoices_ibfk_6` (`usage_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`),
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `invoices_ibfk_4` FOREIGN KEY (`paid_by_student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `invoices_ibfk_5` FOREIGN KEY (`created_by_manager_id`) REFERENCES `managers` (`id`),
  CONSTRAINT `invoices_ibfk_6` FOREIGN KEY (`usage_id`) REFERENCES `monthly_usages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.managers
DROP TABLE IF EXISTS `managers`;
CREATE TABLE IF NOT EXISTS `managers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `is_first_login` tinyint(1) DEFAULT 1,
  `building_id` int(11) DEFAULT NULL,
  `fcm_token` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `managers_ibfk_1` (`building_id`),
  CONSTRAINT `managers_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.monthly_usages
DROP TABLE IF EXISTS `monthly_usages`;
CREATE TABLE IF NOT EXISTS `monthly_usages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `electricity_old_index` int(11) NOT NULL,
  `electricity_new_index` int(11) NOT NULL,
  `electricity_price` decimal(10,2) NOT NULL,
  `water_old_index` int(11) NOT NULL,
  `water_new_index` int(11) NOT NULL,
  `water_price` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `monthly_usages_ibfk_1` (`room_id`),
  CONSTRAINT `monthly_usages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.notifications
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `content` text NOT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `sender_role` enum('ADMIN','MANAGER') NOT NULL,
  `sender_id` int(11) NOT NULL,
  `target_scope` enum('ALL','BUILDING','ROOM','INDIVIDUAL') NOT NULL,
  `type` enum('ANNOUNCEMENT','REMINDER') DEFAULT 'ANNOUNCEMENT',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.notification_recipients
DROP TABLE IF EXISTS `notification_recipients`;
CREATE TABLE IF NOT EXISTS `notification_recipients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `notification_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `building_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_recipients_ibfk_1` (`notification_id`),
  KEY `notification_recipients_ibfk_2` (`student_id`),
  KEY `notification_recipients_ibfk_3` (`room_id`),
  KEY `notification_recipients_ibfk_4` (`building_id`),
  CONSTRAINT `notification_recipients_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_recipients_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `notification_recipients_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `notification_recipients_ibfk_4` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.registrations
DROP TABLE IF EXISTS `registrations`;
CREATE TABLE IF NOT EXISTS `registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `semester_id` int(11) NOT NULL,
  `registration_type` enum('NORMAL','PRIORITY','RENEWAL') NOT NULL,
  `desired_room_id` int(11) DEFAULT NULL,
  `desired_building_id` int(11) DEFAULT NULL,
  `priority_category` enum('NONE','POOR_HOUSEHOLD','DISABILITY','OTHER') DEFAULT 'NONE',
  `priority_description` text DEFAULT NULL,
  `evidence_file_path` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','RETURN','AWAITING_PAYMENT','APPROVED','COMPLETED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `invoice_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `admin_note` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `registrations_ibfk_1` (`student_id`),
  KEY `registrations_ibfk_2` (`desired_room_id`),
  KEY `registrations_ibfk_3` (`desired_building_id`),
  KEY `registrations_ibfk_4` (`semester_id`),
  CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `registrations_ibfk_2` FOREIGN KEY (`desired_room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `registrations_ibfk_3` FOREIGN KEY (`desired_building_id`) REFERENCES `buildings` (`id`),
  CONSTRAINT `registrations_ibfk_4` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.rooms
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) NOT NULL,
  `room_number` varchar(10) NOT NULL,
  `floor` int(11) NOT NULL,
  `max_capacity` int(11) NOT NULL DEFAULT 4,
  `price_per_semester` decimal(10,2) NOT NULL,
  `has_ac` tinyint(1) DEFAULT 0,
  `has_heater` tinyint(1) DEFAULT 0,
  `has_washer` tinyint(1) DEFAULT 0,
  `status` enum('AVAILABLE','FULL','MAINTENANCE') DEFAULT 'AVAILABLE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_building_room` (`building_id`,`room_number`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.semesters
DROP TABLE IF EXISTS `semesters`;
CREATE TABLE IF NOT EXISTS `semesters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `registration_open_date` datetime DEFAULT NULL,
  `registration_close_date` datetime DEFAULT NULL,
  `registration_special_open_date` datetime DEFAULT NULL,
  `registration_special_close_date` datetime DEFAULT NULL,
  `renewal_open_date` datetime DEFAULT NULL,
  `renewal_close_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `term` enum('1','2','3') NOT NULL,
  `academic_year` varchar(9) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.service_prices
DROP TABLE IF EXISTS `service_prices`;
CREATE TABLE IF NOT EXISTS `service_prices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_name` varchar(50) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `apply_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `unit` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.stay_records
DROP TABLE IF EXISTS `stay_records`;
CREATE TABLE IF NOT EXISTS `stay_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `semester_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('ACTIVE','CHECKED_OUT','CANCELLED') DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  KEY `stay_records_ibfk_1` (`student_id`),
  KEY `stay_records_ibfk_2` (`room_id`),
  KEY `stay_records_ibfk_3` (`semester_id`),
  CONSTRAINT `stay_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `stay_records_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `stay_records_ibfk_3` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.students
DROP TABLE IF EXISTS `students`;
CREATE TABLE IF NOT EXISTS `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mssv` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `gender` enum('MALE','FEMALE') NOT NULL,
  `class_name` varchar(50) DEFAULT NULL,
  `student_status` enum('STUDYING','GRADUATED') DEFAULT 'STUDYING',
  `fcm_token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mssv` (`mssv`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table dormitory_management.support_requests
DROP TABLE IF EXISTS `support_requests`;
CREATE TABLE IF NOT EXISTS `support_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `type` enum('COMPLAINT','REPAIR','PROPOSAL') NOT NULL,
  `title` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','PROCESSING','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  `processed_by_manager_id` int(11) DEFAULT NULL,
  `response_content` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `support_requests_ibfk_1` (`student_id`),
  KEY `support_requests_ibfk_2` (`processed_by_manager_id`),
  CONSTRAINT `support_requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `support_requests_ibfk_2` FOREIGN KEY (`processed_by_manager_id`) REFERENCES `managers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
