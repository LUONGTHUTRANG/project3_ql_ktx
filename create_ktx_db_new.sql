-- Tạo Database
CREATE DATABASE IF NOT EXISTS `dormitory_management` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dormitory_management`;

-- 1. Bảng Buildings
CREATE TABLE IF NOT EXISTS `buildings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'Ví dụ: Tòa A1, Tòa B2',
  `location` varchar(255) DEFAULT NULL,
  `gender_restriction` enum('MALE','FEMALE','MIXED') DEFAULT 'MIXED',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Rooms
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `building_id` int NOT NULL,
  `room_number` varchar(10) NOT NULL,
  `floor` int NOT NULL,
  `max_capacity` int NOT NULL DEFAULT '4',
  `price_per_semester` decimal(10,2) NOT NULL,
  `has_ac` tinyint(1) DEFAULT '0',
  `has_heater` tinyint(1) DEFAULT '0',
  `has_washer` tinyint(1) DEFAULT '0',
  `status` enum('AVAILABLE','FULL','MAINTENANCE') DEFAULT 'AVAILABLE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_building_room` (`building_id`,`room_number`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Students (Đã bỏ current_room_id và stay_status)
CREATE TABLE IF NOT EXISTS `students` (
  `id` int NOT NULL AUTO_INCREMENT,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Admins
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng Managers
CREATE TABLE IF NOT EXISTS `managers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `is_first_login` tinyint(1) DEFAULT '1',
  `building_id` int DEFAULT NULL,
  `fcm_token` varchar(255) DEFAULT NULL,
  `is_active` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `managers_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng Semesters
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
  `is_active` tinyint(1) DEFAULT '0',
  `term` enum('1','2','3') NOT NULL,
  `academic_year` varchar(9) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng Monthly Usages
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
  CONSTRAINT `monthly_usages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng Invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_code` varchar(20) NOT NULL,
  `type` enum('ROOM_FEE','UTILITY_FEE','OTHER') NOT NULL,
  `semester_id` int NOT NULL,
  `time_invoiced` datetime DEFAULT CURRENT_TIMESTAMP,
  `room_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `usage_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('UNPAID','SUBMITTED','PAID','CANCELLED') NOT NULL,
  `due_date` date DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `paid_by_student_id` int DEFAULT NULL,
  `payment_method` enum('CASH','BANK_TRANSFER','QR_CODE') DEFAULT NULL,
  `payment_proof` varchar(255) DEFAULT NULL,
  `created_by_manager_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_code` (`invoice_code`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`),
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `invoices_ibfk_4` FOREIGN KEY (`paid_by_student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `invoices_ibfk_5` FOREIGN KEY (`created_by_manager_id`) REFERENCES `managers` (`id`),
  CONSTRAINT `invoices_ibfk_6` FOREIGN KEY (`usage_id`) REFERENCES `monthly_usages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng Registrations
CREATE TABLE IF NOT EXISTS `registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `semester_id` int NOT NULL,
  `registration_type` enum('NORMAL','PRIORITY','RENEWAL') NOT NULL,
  `desired_room_id` int DEFAULT NULL,
  `desired_building_id` int DEFAULT NULL,
  `priority_category` enum('NONE','POOR_HOUSEHOLD','DISABILITY','OTHER') DEFAULT 'NONE',
  `priority_description` text,
  `evidence_file_path` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','RETURN','AWAITING_PAYMENT','APPROVED','COMPLETED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `invoice_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `admin_note` text,
  PRIMARY KEY (`id`),
  CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `registrations_ibfk_2` FOREIGN KEY (`desired_room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `registrations_ibfk_3` FOREIGN KEY (`desired_building_id`) REFERENCES `buildings` (`id`),
  CONSTRAINT `registrations_ibfk_4` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng Stay Records
CREATE TABLE IF NOT EXISTS `stay_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `room_id` int NOT NULL,
  `semester_id` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('ACTIVE','CHECKED_OUT','CANCELLED') DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  CONSTRAINT `stay_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `stay_records_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `stay_records_ibfk_3` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng Support Requests
CREATE TABLE IF NOT EXISTS `support_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `type` enum('COMPLAINT','REPAIR','PROPOSAL') NOT NULL,
  `title` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','PROCESSING','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  `processed_by_manager_id` int DEFAULT NULL,
  `response_content` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `support_requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `support_requests_ibfk_2` FOREIGN KEY (`processed_by_manager_id`) REFERENCES `managers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Bảng Notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `content` text NOT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `sender_role` enum('ADMIN','MANAGER') NOT NULL,
  `sender_id` int NOT NULL,
  `target_scope` enum('ALL','BUILDING','ROOM','INDIVIDUAL') NOT NULL,
  `type` enum('ANNOUNCEMENT','REMINDER') DEFAULT 'ANNOUNCEMENT',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Bảng Notification Recipients
CREATE TABLE IF NOT EXISTS `notification_recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notification_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `room_id` int DEFAULT NULL,
  `building_id` int DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `notification_recipients_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_recipients_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `notification_recipients_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `notification_recipients_ibfk_4` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Bảng Service Prices
CREATE TABLE IF NOT EXISTS `service_prices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_name` varchar(50) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `apply_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;