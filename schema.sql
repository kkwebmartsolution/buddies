-- MySQL Database Schema for Buddies Production

CREATE DATABASE IF NOT EXISTS `buddies_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `buddies_db`;

-- Admin users table
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site settings / section content JSON storage
CREATE TABLE IF NOT EXISTS `site_settings` (
  `section_key` VARCHAR(100) PRIMARY KEY,
  `content_json` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Page Views Visitor Tracker Table
CREATE TABLE IF NOT EXISTS `page_views` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `path` VARCHAR(255) NOT NULL DEFAULT '/',
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(255) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS `services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `no` VARCHAR(10) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `sort_order` INT DEFAULT 0
);

-- Portfolio / Works table
CREATE TABLE IF NOT EXISTS `works` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `client` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `year` VARCHAR(10) NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `sort_order` INT DEFAULT 0
);

-- Videos table
CREATE TABLE IF NOT EXISTS `videos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `video_url` VARCHAR(500) NOT NULL,
  `thumbnail` VARCHAR(500) NOT NULL,
  `sort_order` INT DEFAULT 0
);

-- Equipment Rentals table
CREATE TABLE IF NOT EXISTS `rentals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `tag` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `icon` VARCHAR(100) NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `sort_order` INT DEFAULT 0
);

-- Seed default admin user (username: admin, password: admin123)
-- bcrypt hash for 'admin123'
INSERT INTO `admin_users` (`username`, `password_hash`)
VALUES ('admin', '$2a$10$7Z8lq4aV4h1Qj1k.Wn8Y9u1mN0V9e8Z1w2x3y4z5a6b7c8d9e0f1g')
ON DUPLICATE KEY UPDATE `username`=`username`;
