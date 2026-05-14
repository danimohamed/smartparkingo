-- =====================================================
-- Smart Parking System - Database Schema
-- MySQL Database: smartparking_db
-- =====================================================

-- Database is auto-created by JDBC URL (createDatabaseIfNotExist=true)

-- =====================================================
-- Table: users
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     full_name VARCHAR(100) NOT NULL,
                                     email VARCHAR(150) NOT NULL UNIQUE,
                                     password VARCHAR(255) NOT NULL,
                                     phone VARCHAR(20),
                                     default_vehicle_plate VARCHAR(64),
                                     fcm_token VARCHAR(512),
                                     assigned_parking_id BIGINT,
                                     role ENUM('USER', 'ADMIN', 'PARKING_OWNER', 'GUARD') NOT NULL DEFAULT 'USER',
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                     INDEX idx_users_email (email),
                                     INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table: parkings
-- =====================================================
CREATE TABLE IF NOT EXISTS parkings (
                                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                        name VARCHAR(150) NOT NULL UNIQUE,
                                        address VARCHAR(255) NOT NULL,
                                        description VARCHAR(500),
                                        image_url MEDIUMTEXT,
                                        total_slots INT NOT NULL,
                                        price_per_hour DOUBLE NOT NULL,
                                        pricing_tier VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
                                        daily_cap_price DOUBLE,
                                        latitude DOUBLE,
                                        longitude DOUBLE,
                                        layout_floors INT,
                                        layout_spots_per_floor INT,
                                        underground_floors BOOLEAN,
                                        active BOOLEAN DEFAULT TRUE,
                                        owner_id BIGINT,
                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                        INDEX idx_parkings_active (active),
                                        INDEX idx_parkings_name (name),
                                        INDEX idx_parkings_owner (owner_id),
                                        CONSTRAINT fk_parkings_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table: parking_slots
-- =====================================================
CREATE TABLE IF NOT EXISTS parking_slots (
                                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             slot_number VARCHAR(20) NOT NULL,
                                             status ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
                                             slot_type ENUM('STANDARD', 'HANDICAPPED', 'VIP', 'ELECTRIC') NOT NULL DEFAULT 'STANDARD',
                                             floor VARCHAR(10),
                                             parking_id BIGINT NOT NULL,
                                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                             FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE,
                                             INDEX idx_slots_parking (parking_id),
                                             INDEX idx_slots_status (status),
                                             INDEX idx_slots_parking_status (parking_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table: parking_reviews
-- =====================================================
CREATE TABLE IF NOT EXISTS parking_reviews (
                                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                            parking_id BIGINT NOT NULL,
                                            user_id BIGINT NOT NULL,
                                            rating INT NOT NULL,
                                            comment VARCHAR(500),
                                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            INDEX idx_reviews_parking (parking_id),
                                            INDEX idx_reviews_user (user_id),
                                            INDEX idx_reviews_created_at (created_at),
                                            CONSTRAINT fk_reviews_parking FOREIGN KEY (parking_id) REFERENCES parkings (id) ON DELETE CASCADE,
                                            CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table: parking_guards (owners assign multiple GUARD users per parking)
-- =====================================================
CREATE TABLE IF NOT EXISTS parking_guards (
                                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                              parking_id BIGINT NOT NULL,
                                              user_id BIGINT NOT NULL,
                                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              UNIQUE KEY uk_parking_guard_user (parking_id, user_id),
                                              FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE,
                                              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                              INDEX idx_parking_guards_parking (parking_id),
                                              INDEX idx_parking_guards_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table: reservations
-- =====================================================
CREATE TABLE IF NOT EXISTS reservations (
                                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                            user_id BIGINT NOT NULL,
                                            parking_slot_id BIGINT NOT NULL,
                                            start_time DATETIME NOT NULL,
                                            end_time DATETIME NOT NULL,
                                            status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'ACTIVE',
                                            total_price DOUBLE NOT NULL,
                                            grace_period_minutes INT NOT NULL DEFAULT 15,
                                            actual_arrival DATETIME,
                                            actual_departure DATETIME,
                                            checked_in BOOLEAN NOT NULL DEFAULT FALSE,
                                            checked_out BOOLEAN NOT NULL DEFAULT FALSE,
                                            ending_soon_notified BOOLEAN NOT NULL DEFAULT FALSE,
                                             vehicle_plate VARCHAR(64),
                                             vehicle_plate_normalized VARCHAR(32),
                                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                            FOREIGN KEY (parking_slot_id) REFERENCES parking_slots(id) ON DELETE CASCADE,
                                            INDEX idx_reservations_user (user_id),
                                            INDEX idx_reservations_slot (parking_slot_id),
                                            INDEX idx_reservations_status (status),
                                             INDEX idx_reservations_time (start_time, end_time),
                                             INDEX idx_reservations_vehicle_plate (vehicle_plate_normalized)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table: walk_in_parking_sessions (non-app users tracked by plate)
-- =====================================================
CREATE TABLE IF NOT EXISTS walk_in_parking_sessions (
                                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                          parking_id BIGINT NOT NULL,
                                          parking_slot_id BIGINT,
                                          plate_normalized VARCHAR(32) NOT NULL,
                                          plate_raw VARCHAR(64),
                                          entry_time DATETIME NOT NULL,
                                          exit_time DATETIME,
                                          status ENUM('ACTIVE', 'COMPLETED', 'UNPAID', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
                                          price_per_hour_snapshot DOUBLE NOT NULL,
                                          amount_due DOUBLE,
                                          entry_guard_user_id BIGINT,
                                          exit_guard_user_id BIGINT,
                                          notes VARCHAR(500),
                                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                          CONSTRAINT fk_walk_in_parking FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE,
                                          CONSTRAINT fk_walk_in_slot FOREIGN KEY (parking_slot_id) REFERENCES parking_slots(id) ON DELETE SET NULL,
                                          CONSTRAINT fk_walk_in_entry_guard FOREIGN KEY (entry_guard_user_id) REFERENCES users(id) ON DELETE SET NULL,
                                          CONSTRAINT fk_walk_in_exit_guard FOREIGN KEY (exit_guard_user_id) REFERENCES users(id) ON DELETE SET NULL,
                                          INDEX idx_walk_in_parking_status (parking_id, status),
                                          INDEX idx_walk_in_plate_status (parking_id, plate_normalized, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table: parking_plate_scan_stats (daily guard ALPR counters)
-- =====================================================
CREATE TABLE IF NOT EXISTS parking_plate_scan_stats (
                                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                          parking_id BIGINT NOT NULL,
                                          stat_date DATE NOT NULL,
                                          app_users_count BIGINT NOT NULL DEFAULT 0,
                                          non_app_users_count BIGINT NOT NULL DEFAULT 0,
                                          CONSTRAINT fk_plate_scan_stats_parking FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE,
                                          UNIQUE KEY uk_plate_scan_stats_parking_date (parking_id, stat_date),
                                          INDEX idx_plate_scan_stats_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table: payments
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
                                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                        reservation_id BIGINT NOT NULL UNIQUE,
                                        user_id BIGINT NOT NULL,
                                        amount DOUBLE NOT NULL,
                                        status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
                                        payment_method ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'MOBILE_PAYMENT', 'WALLET'),
                                        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
                                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                        INDEX idx_payments_user (user_id),
                                        INDEX idx_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table: wallets
-- =====================================================
CREATE TABLE IF NOT EXISTS wallets (
                                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                       user_id BIGINT NOT NULL UNIQUE,
                                       balance DOUBLE NOT NULL DEFAULT 0.0,
                                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                       INDEX idx_wallets_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table: wallet_transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
                                                   id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                   wallet_id BIGINT NOT NULL,
                                                   type ENUM('TOP_UP', 'PAYMENT', 'REFUND') NOT NULL,
                                                   amount DOUBLE NOT NULL,
                                                   description VARCHAR(255),
                                                   card_last4 VARCHAR(30),
                                                   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                   FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
                                                   INDEX idx_wallet_tx_wallet (wallet_id),
                                                   INDEX idx_wallet_tx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Sample Data (Optional)
-- =====================================================

-- Insert admin user (legacy BCrypt hash; ignored after first run — DataSeeder resets password to app.seed.admin-password, default admin123)
INSERT IGNORE INTO users (full_name, email, password, phone, role)
VALUES ('Admin User', 'admin@smartparking.com',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '+212600000000', 'ADMIN');

-- Insert sample parking (all with 50 slots across 5 floors)
INSERT IGNORE INTO parkings (name, address, description, total_slots, price_per_hour, latitude, longitude)
VALUES
-- Central Medina & Jemaa el-Fna area
('Parking Jemaa el-Fna', 'Place Jemaa el-Fna, Medina, Marrakech', 'Central parking near Jemaa el-Fna square', 50, 10.0, 31.6258, -7.9891),
('Parking Riad Zitoun', 'Rue Riad Zitoun el Jdid, Medina, Marrakech', 'Street parking near Bahia Palace', 50, 7.0, 31.6210, -7.9860),
('Parking Bab Agnaou', 'Bab Agnaou, Medina, Marrakech', 'Outdoor parking near Kasbah', 50, 8.0, 31.6195, -7.9905),
('Parking Moulay El Yazid', 'Rue de la Kasbah, Medina, Marrakech', 'Parking near Saadian Tombs', 50, 6.0, 31.6180, -7.9930),
('Parking Koutoubia', 'Avenue Mohammed V, Medina, Marrakech', 'Large lot beside Koutoubia Mosque', 50, 10.0, 31.6240, -7.9935),

-- Gueliz (Modern City Center)
('Parking Gare Marrakech', 'Avenue Hassan II, Gueliz, Marrakech', 'Covered parking near Marrakech train station', 50, 8.0, 31.6325, -8.0149),
('Parking Carré Eden', 'Boulevard Mohammed V, Gueliz, Marrakech', 'Underground parking with EV charging at Carré Eden', 50, 12.0, 31.6367, -8.0082),
('Parking Plaza Marrakech', 'Avenue Mohammed V, Gueliz, Marrakech', 'Modern covered parking with 24h security', 50, 20.0, 31.6300, -7.9950),
('Parking Liberté', 'Place de la Liberté, Gueliz, Marrakech', 'Central Gueliz parking', 50, 10.0, 31.6350, -8.0050),
('Parking Bab Nkob', 'Rue de Yougoslavie, Gueliz, Marrakech', 'Street parking near Gueliz market', 50, 8.0, 31.6335, -8.0010),
('Parking 16 Novembre', 'Place du 16 Novembre, Gueliz, Marrakech', 'Underground parking in Gueliz center', 50, 12.0, 31.6360, -8.0100),

-- Hivernage
('Parking Hivernage', 'Avenue Echouhada, Hivernage, Marrakech', 'Secure parking in Hivernage district', 50, 15.0, 31.6220, -8.0100),
('Parking Palais des Congrès', 'Avenue de France, Hivernage, Marrakech', 'Parking near Congress Palace', 50, 15.0, 31.6200, -8.0060),
('Parking Royal Tennis', 'Rue du Temple, Hivernage, Marrakech', 'Parking near Royal Tennis Club', 50, 10.0, 31.6190, -8.0040),

-- Majorelle & Semlalia
('Parking Majorelle', 'Rue Yves Saint Laurent, Marrakech', 'Outdoor parking near Jardin Majorelle', 50, 5.0, 31.6417, -8.0032),
('Parking Semlalia', 'Avenue Yacoub El Mansour, Semlalia, Marrakech', 'Parking near Semlalia Hospital', 50, 7.0, 31.6380, -8.0150),

-- Menara & Mohammed VI
('Parking Menara Mall', 'Avenue Mohammed VI, Marrakech', 'Large covered parking at Menara Mall', 50, 15.0, 31.6340, -8.0280),
('Parking Menara Gardens', 'Avenue de la Menara, Marrakech', 'Open-air parking near Menara Gardens', 50, 5.0, 31.6250, -8.0220),
('Parking Al Mazar', 'Route de l''Ourika, Marrakech', 'Covered parking at Al Mazar Mall', 50, 12.0, 31.6150, -7.9750),

-- Agdal & South
('Parking Royal Agdal', 'Avenue Mohammed VI, Agdal, Marrakech', 'Secure parking near Royal Palace Agdal', 50, 8.0, 31.6050, -7.9850),
('Parking Bab Jdid', 'Bab Jdid, Marrakech', 'Historical gate parking', 50, 6.0, 31.6190, -7.9980),
('Parking Bab Doukkala', 'Place Bab Doukkala, Marrakech', 'Large parking near Bab Doukkala gate', 50, 7.0, 31.6320, -7.9960),

-- Palmeraie & North
('Parking Palmeraie', 'Route de la Palmeraie, Marrakech', 'Parking in Palmeraie resort area', 50, 10.0, 31.6700, -8.0050),
('Parking Palmeraie Golf', 'Circuit de la Palmeraie, Marrakech', 'Parking near Palmeraie Golf Palace', 50, 15.0, 31.6650, -7.9900),

-- Route de Fès & Industrial
('Parking Targa', 'Route de Fès, Targa, Marrakech', 'Outdoor parking in Targa district', 50, 5.0, 31.6500, -7.9800),
('Parking Sidi Ghanem', 'Quartier Industriel Sidi Ghanem, Marrakech', 'Parking near Sidi Ghanem industrial zone', 50, 5.0, 31.6580, -8.0250),

-- Route de Casablanca
('Parking Marjane Ménara', 'Route de Casablanca, Marrakech', 'Supermarket parking near Menara', 50, 5.0, 31.6420, -8.0350),
('Parking Bab Ighli', 'Bab Ighli, Marrakech', 'Parking near Bab Ighli and Royal Palace', 50, 8.0, 31.6120, -7.9920),

-- Daoudiate & West
('Parking Daoudiate', 'Quartier Daoudiate, Marrakech', 'Residential area parking', 50, 5.0, 31.6450, -8.0200),
('Parking Massira', 'Quartier Massira, Marrakech', 'Public parking in Massira neighborhood', 50, 4.0, 31.6400, -8.0300);

-- One PARKING_OWNER per seeded lot (legacy BCrypt; DataSeeder sets app.seed.owner-password for owner.*@smartparking.com)
INSERT IGNORE INTO users (full_name, email, password, phone, role) VALUES
('Parking Jemaa el-Fna owner', 'owner.jemaa-el-fna@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000001', 'PARKING_OWNER'),
('Parking Riad Zitoun owner', 'owner.riad-zitoun@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000002', 'PARKING_OWNER'),
('Parking Bab Agnaou owner', 'owner.bab-agnaou@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000003', 'PARKING_OWNER'),
('Parking Moulay El Yazid owner', 'owner.moulay-el-yazid@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000004', 'PARKING_OWNER'),
('Parking Koutoubia owner', 'owner.koutoubia@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000005', 'PARKING_OWNER'),
('Parking Gare Marrakech owner', 'owner.gare-marrakech@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000006', 'PARKING_OWNER'),
('Parking Carré Eden owner', 'owner.carre-eden@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000007', 'PARKING_OWNER'),
('Parking Plaza Marrakech owner', 'owner.plaza-marrakech@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000008', 'PARKING_OWNER'),
('Parking Liberté owner', 'owner.liberte@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000009', 'PARKING_OWNER'),
('Parking Bab Nkob owner', 'owner.bab-nkob@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000010', 'PARKING_OWNER'),
('Parking 16 Novembre owner', 'owner.16-novembre@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000011', 'PARKING_OWNER'),
('Parking Hivernage owner', 'owner.hivernage@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000012', 'PARKING_OWNER'),
('Parking Palais des Congrès owner', 'owner.palais-des-congres@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000013', 'PARKING_OWNER'),
('Parking Royal Tennis owner', 'owner.royal-tennis@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000014', 'PARKING_OWNER'),
('Parking Majorelle owner', 'owner.majorelle@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000015', 'PARKING_OWNER'),
('Parking Semlalia owner', 'owner.semlalia@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000016', 'PARKING_OWNER'),
('Parking Menara Mall owner', 'owner.menara-mall@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000017', 'PARKING_OWNER'),
('Parking Menara Gardens owner', 'owner.menara-gardens@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000018', 'PARKING_OWNER'),
('Parking Al Mazar owner', 'owner.al-mazar@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000019', 'PARKING_OWNER'),
('Parking Royal Agdal owner', 'owner.royal-agdal@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000020', 'PARKING_OWNER'),
('Parking Bab Jdid owner', 'owner.bab-jdid@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000021', 'PARKING_OWNER'),
('Parking Bab Doukkala owner', 'owner.bab-doukkala@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000022', 'PARKING_OWNER'),
('Parking Palmeraie owner', 'owner.palmeraie@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000023', 'PARKING_OWNER'),
('Parking Palmeraie Golf owner', 'owner.palmeraie-golf@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000024', 'PARKING_OWNER'),
('Parking Targa owner', 'owner.targa@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000025', 'PARKING_OWNER'),
('Parking Sidi Ghanem owner', 'owner.sidi-ghanem@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000026', 'PARKING_OWNER'),
('Parking Marjane Ménara owner', 'owner.marjane-menara@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000027', 'PARKING_OWNER'),
('Parking Bab Ighli owner', 'owner.bab-ighli@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000028', 'PARKING_OWNER'),
('Parking Daoudiate owner', 'owner.daoudiate@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000029', 'PARKING_OWNER'),
('Parking Massira owner', 'owner.massira@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212601000030', 'PARKING_OWNER');

UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.jemaa-el-fna@smartparking.com' LIMIT 1) WHERE name = 'Parking Jemaa el-Fna';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.riad-zitoun@smartparking.com' LIMIT 1) WHERE name = 'Parking Riad Zitoun';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.bab-agnaou@smartparking.com' LIMIT 1) WHERE name = 'Parking Bab Agnaou';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.moulay-el-yazid@smartparking.com' LIMIT 1) WHERE name = 'Parking Moulay El Yazid';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.koutoubia@smartparking.com' LIMIT 1) WHERE name = 'Parking Koutoubia';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.gare-marrakech@smartparking.com' LIMIT 1) WHERE name = 'Parking Gare Marrakech';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.carre-eden@smartparking.com' LIMIT 1) WHERE name = 'Parking Carré Eden';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.plaza-marrakech@smartparking.com' LIMIT 1) WHERE name = 'Parking Plaza Marrakech';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.liberte@smartparking.com' LIMIT 1) WHERE name = 'Parking Liberté';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.bab-nkob@smartparking.com' LIMIT 1) WHERE name = 'Parking Bab Nkob';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.16-novembre@smartparking.com' LIMIT 1) WHERE name = 'Parking 16 Novembre';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.hivernage@smartparking.com' LIMIT 1) WHERE name = 'Parking Hivernage';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.palais-des-congres@smartparking.com' LIMIT 1) WHERE name = 'Parking Palais des Congrès';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.royal-tennis@smartparking.com' LIMIT 1) WHERE name = 'Parking Royal Tennis';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.majorelle@smartparking.com' LIMIT 1) WHERE name = 'Parking Majorelle';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.semlalia@smartparking.com' LIMIT 1) WHERE name = 'Parking Semlalia';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.menara-mall@smartparking.com' LIMIT 1) WHERE name = 'Parking Menara Mall';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.menara-gardens@smartparking.com' LIMIT 1) WHERE name = 'Parking Menara Gardens';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.al-mazar@smartparking.com' LIMIT 1) WHERE name = 'Parking Al Mazar';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.royal-agdal@smartparking.com' LIMIT 1) WHERE name = 'Parking Royal Agdal';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.bab-jdid@smartparking.com' LIMIT 1) WHERE name = 'Parking Bab Jdid';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.bab-doukkala@smartparking.com' LIMIT 1) WHERE name = 'Parking Bab Doukkala';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.palmeraie@smartparking.com' LIMIT 1) WHERE name = 'Parking Palmeraie';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.palmeraie-golf@smartparking.com' LIMIT 1) WHERE name = 'Parking Palmeraie Golf';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.targa@smartparking.com' LIMIT 1) WHERE name = 'Parking Targa';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.sidi-ghanem@smartparking.com' LIMIT 1) WHERE name = 'Parking Sidi Ghanem';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.marjane-menara@smartparking.com' LIMIT 1) WHERE name = 'Parking Marjane Ménara';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.bab-ighli@smartparking.com' LIMIT 1) WHERE name = 'Parking Bab Ighli';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.daoudiate@smartparking.com' LIMIT 1) WHERE name = 'Parking Daoudiate';
UPDATE parkings SET owner_id = (SELECT id FROM users WHERE email = 'owner.massira@smartparking.com' LIMIT 1) WHERE name = 'Parking Massira';

-- Insert guards (legacy BCrypt; DataSeeder sets app.seed.guard-password) and assign each guard to a parking
-- NOTE: email is required by schema, but the app will display only the guard name.
INSERT IGNORE INTO users (full_name, email, password, phone, assigned_parking_id, role) VALUES
('Guard Jemaa el-Fna', 'guard01@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000101', (SELECT id FROM parkings WHERE name='Parking Jemaa el-Fna' LIMIT 1), 'GUARD'),
('Guard Riad Zitoun', 'guard02@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000102', (SELECT id FROM parkings WHERE name='Parking Riad Zitoun' LIMIT 1), 'GUARD'),
('Guard Bab Agnaou', 'guard03@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000103', (SELECT id FROM parkings WHERE name='Parking Bab Agnaou' LIMIT 1), 'GUARD'),
('Guard Moulay El Yazid', 'guard04@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000104', (SELECT id FROM parkings WHERE name='Parking Moulay El Yazid' LIMIT 1), 'GUARD'),
('Guard Koutoubia', 'guard05@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000105', (SELECT id FROM parkings WHERE name='Parking Koutoubia' LIMIT 1), 'GUARD'),
('Guard Gare Marrakech', 'guard06@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000106', (SELECT id FROM parkings WHERE name='Parking Gare Marrakech' LIMIT 1), 'GUARD'),
('Guard Carre Eden', 'guard07@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000107', (SELECT id FROM parkings WHERE name='Parking Carré Eden' LIMIT 1), 'GUARD'),
('Guard Plaza Marrakech', 'guard08@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000108', (SELECT id FROM parkings WHERE name='Parking Plaza Marrakech' LIMIT 1), 'GUARD'),
('Guard Liberte', 'guard09@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000109', (SELECT id FROM parkings WHERE name='Parking Liberté' LIMIT 1), 'GUARD'),
('Guard Bab Nkob', 'guard10@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000110', (SELECT id FROM parkings WHERE name='Parking Bab Nkob' LIMIT 1), 'GUARD'),
('Guard 16 Novembre', 'guard11@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000111', (SELECT id FROM parkings WHERE name='Parking 16 Novembre' LIMIT 1), 'GUARD'),
('Guard Hivernage', 'guard12@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000112', (SELECT id FROM parkings WHERE name='Parking Hivernage' LIMIT 1), 'GUARD'),
('Guard Palais des Congres', 'guard13@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000113', (SELECT id FROM parkings WHERE name='Parking Palais des Congrès' LIMIT 1), 'GUARD'),
('Guard Royal Tennis', 'guard14@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000114', (SELECT id FROM parkings WHERE name='Parking Royal Tennis' LIMIT 1), 'GUARD'),
('Guard Majorelle', 'guard15@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000115', (SELECT id FROM parkings WHERE name='Parking Majorelle' LIMIT 1), 'GUARD'),
('Guard Semlalia', 'guard16@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000116', (SELECT id FROM parkings WHERE name='Parking Semlalia' LIMIT 1), 'GUARD'),
('Guard Menara Mall', 'guard17@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000117', (SELECT id FROM parkings WHERE name='Parking Menara Mall' LIMIT 1), 'GUARD'),
('Guard Menara Gardens', 'guard18@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000118', (SELECT id FROM parkings WHERE name='Parking Menara Gardens' LIMIT 1), 'GUARD'),
('Guard Al Mazar', 'guard19@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000119', (SELECT id FROM parkings WHERE name='Parking Al Mazar' LIMIT 1), 'GUARD'),
('Guard Royal Agdal', 'guard20@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000120', (SELECT id FROM parkings WHERE name='Parking Royal Agdal' LIMIT 1), 'GUARD'),
('Guard Bab Jdid', 'guard21@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000121', (SELECT id FROM parkings WHERE name='Parking Bab Jdid' LIMIT 1), 'GUARD'),
('Guard Bab Doukkala', 'guard22@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000122', (SELECT id FROM parkings WHERE name='Parking Bab Doukkala' LIMIT 1), 'GUARD'),
('Guard Palmeraie', 'guard23@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000123', (SELECT id FROM parkings WHERE name='Parking Palmeraie' LIMIT 1), 'GUARD'),
('Guard Palmeraie Golf', 'guard24@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000124', (SELECT id FROM parkings WHERE name='Parking Palmeraie Golf' LIMIT 1), 'GUARD'),
('Guard Targa', 'guard25@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000125', (SELECT id FROM parkings WHERE name='Parking Targa' LIMIT 1), 'GUARD'),
('Guard Sidi Ghanem', 'guard26@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000126', (SELECT id FROM parkings WHERE name='Parking Sidi Ghanem' LIMIT 1), 'GUARD'),
('Guard Marjane Menara', 'guard27@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000127', (SELECT id FROM parkings WHERE name='Parking Marjane Ménara' LIMIT 1), 'GUARD'),
('Guard Bab Ighli', 'guard28@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000128', (SELECT id FROM parkings WHERE name='Parking Bab Ighli' LIMIT 1), 'GUARD'),
('Guard Daoudiate', 'guard29@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000129', (SELECT id FROM parkings WHERE name='Parking Daoudiate' LIMIT 1), 'GUARD'),
('Guard Massira', 'guard30@smartparking.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+212600000130', (SELECT id FROM parkings WHERE name='Parking Massira' LIMIT 1), 'GUARD');

-- Tiered pricing (Morocco-style): premium medina, standard city, economy peripheral
UPDATE parkings SET pricing_tier = 'PREMIUM', daily_cap_price = 40, price_per_hour = 8
WHERE name IN ('Parking Jemaa el-Fna', 'Parking Koutoubia', 'Parking Plaza Marrakech');
UPDATE parkings SET pricing_tier = 'STANDARD', daily_cap_price = 25, price_per_hour = 5
WHERE name IN ('Parking Riad Zitoun', 'Parking Bab Agnaou', 'Parking Moulay El Yazid', 'Parking Gare Marrakech',
               'Parking Liberté', 'Parking Bab Nkob', 'Parking Bab Jdid', 'Parking Bab Doukkala', 'Parking Royal Agdal');
UPDATE parkings SET pricing_tier = 'ECONOMY', daily_cap_price = 15, price_per_hour = 3
WHERE name IN ('Parking Massira', 'Parking Targa', 'Parking Sidi Ghanem', 'Parking Marjane Ménara', 'Parking Menara Gardens', 'Parking Daoudiate');

-- =====================================================
-- Insert 50 parking slots per parking (all 30 parkings)
-- Each parking has 5 floors with 10 slots per floor
-- Mix of types: ~70% STANDARD, ~10% HANDICAPPED, ~10% VIP, ~10% ELECTRIC
-- Mix of statuses: ~70% AVAILABLE, ~15% OCCUPIED, ~10% RESERVED, ~5% MAINTENANCE
-- =====================================================

-- Parking Jemaa el-Fna (id=1) - 5 floors
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 1), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 1), ('A-03', 'AVAILABLE', 'STANDARD', 'RDC', 1), ('A-04', 'OCCUPIED', 'STANDARD', 'RDC', 1), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 1),
                                                                                         ('A-06', 'AVAILABLE', 'HANDICAPPED', 'RDC', 1), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 1), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 1), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 1), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 1),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 1), ('B-02', 'AVAILABLE', 'STANDARD', '1', 1), ('B-03', 'OCCUPIED', 'STANDARD', '1', 1), ('B-04', 'AVAILABLE', 'STANDARD', '1', 1), ('B-05', 'AVAILABLE', 'VIP', '1', 1),
                                                                                         ('B-06', 'AVAILABLE', 'STANDARD', '1', 1), ('B-07', 'AVAILABLE', 'STANDARD', '1', 1), ('B-08', 'RESERVED', 'STANDARD', '1', 1), ('B-09', 'AVAILABLE', 'HANDICAPPED', '1', 1), ('B-10', 'OCCUPIED', 'STANDARD', '1', 1),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 1), ('C-02', 'AVAILABLE', 'STANDARD', '2', 1), ('C-03', 'AVAILABLE', 'STANDARD', '2', 1), ('C-04', 'AVAILABLE', 'VIP', '2', 1), ('C-05', 'OCCUPIED', 'STANDARD', '2', 1),
                                                                                         ('C-06', 'AVAILABLE', 'STANDARD', '2', 1), ('C-07', 'MAINTENANCE', 'STANDARD', '2', 1), ('C-08', 'AVAILABLE', 'ELECTRIC', '2', 1), ('C-09', 'AVAILABLE', 'STANDARD', '2', 1), ('C-10', 'RESERVED', 'STANDARD', '2', 1),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 1), ('D-02', 'OCCUPIED', 'STANDARD', '3', 1), ('D-03', 'AVAILABLE', 'STANDARD', '3', 1), ('D-04', 'AVAILABLE', 'STANDARD', '3', 1), ('D-05', 'AVAILABLE', 'ELECTRIC', '3', 1),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 1), ('D-07', 'AVAILABLE', 'VIP', '3', 1), ('D-08', 'RESERVED', 'STANDARD', '3', 1), ('D-09', 'AVAILABLE', 'STANDARD', '3', 1), ('D-10', 'MAINTENANCE', 'STANDARD', '3', 1),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 1), ('E-02', 'AVAILABLE', 'STANDARD', '4', 1), ('E-03', 'OCCUPIED', 'STANDARD', '4', 1), ('E-04', 'AVAILABLE', 'HANDICAPPED', '4', 1), ('E-05', 'AVAILABLE', 'STANDARD', '4', 1),
                                                                                         ('E-06', 'AVAILABLE', 'ELECTRIC', '4', 1), ('E-07', 'AVAILABLE', 'STANDARD', '4', 1), ('E-08', 'AVAILABLE', 'STANDARD', '4', 1), ('E-09', 'OCCUPIED', 'STANDARD', '4', 1), ('E-10', 'AVAILABLE', 'VIP', '4', 1);

-- Parking Riad Zitoun (id=2)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 2), ('A-02', 'OCCUPIED', 'STANDARD', 'RDC', 2), ('A-03', 'AVAILABLE', 'STANDARD', 'RDC', 2), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 2), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 2),
                                                                                         ('A-06', 'RESERVED', 'STANDARD', 'RDC', 2), ('A-07', 'AVAILABLE', 'STANDARD', 'RDC', 2), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 2), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 2), ('A-10', 'AVAILABLE', 'VIP', 'RDC', 2),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 2), ('B-02', 'AVAILABLE', 'STANDARD', '1', 2), ('B-03', 'AVAILABLE', 'ELECTRIC', '1', 2), ('B-04', 'OCCUPIED', 'STANDARD', '1', 2), ('B-05', 'AVAILABLE', 'STANDARD', '1', 2),
                                                                                         ('B-06', 'AVAILABLE', 'STANDARD', '1', 2), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 2), ('B-08', 'AVAILABLE', 'STANDARD', '1', 2), ('B-09', 'AVAILABLE', 'VIP', '1', 2), ('B-10', 'AVAILABLE', 'STANDARD', '1', 2),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 2), ('C-02', 'RESERVED', 'STANDARD', '2', 2), ('C-03', 'AVAILABLE', 'STANDARD', '2', 2), ('C-04', 'AVAILABLE', 'STANDARD', '2', 2), ('C-05', 'OCCUPIED', 'STANDARD', '2', 2),
                                                                                         ('C-06', 'AVAILABLE', 'HANDICAPPED', '2', 2), ('C-07', 'AVAILABLE', 'STANDARD', '2', 2), ('C-08', 'AVAILABLE', 'ELECTRIC', '2', 2), ('C-09', 'AVAILABLE', 'STANDARD', '2', 2), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 2),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 2), ('D-02', 'AVAILABLE', 'STANDARD', '3', 2), ('D-03', 'OCCUPIED', 'STANDARD', '3', 2), ('D-04', 'AVAILABLE', 'VIP', '3', 2), ('D-05', 'AVAILABLE', 'STANDARD', '3', 2),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 2), ('D-07', 'AVAILABLE', 'STANDARD', '3', 2), ('D-08', 'RESERVED', 'STANDARD', '3', 2), ('D-09', 'AVAILABLE', 'ELECTRIC', '3', 2), ('D-10', 'OCCUPIED', 'STANDARD', '3', 2),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 2), ('E-02', 'AVAILABLE', 'STANDARD', '4', 2), ('E-03', 'AVAILABLE', 'HANDICAPPED', '4', 2), ('E-04', 'OCCUPIED', 'STANDARD', '4', 2), ('E-05', 'AVAILABLE', 'STANDARD', '4', 2),
                                                                                         ('E-06', 'AVAILABLE', 'VIP', '4', 2), ('E-07', 'AVAILABLE', 'STANDARD', '4', 2), ('E-08', 'AVAILABLE', 'STANDARD', '4', 2), ('E-09', 'RESERVED', 'STANDARD', '4', 2), ('E-10', 'AVAILABLE', 'STANDARD', '4', 2);

-- Parking Bab Agnaou (id=3)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 3), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 3), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 3), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 3), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 3),
                                                                                         ('A-06', 'AVAILABLE', 'STANDARD', 'RDC', 3), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 3), ('A-08', 'AVAILABLE', 'VIP', 'RDC', 3), ('A-09', 'AVAILABLE', 'STANDARD', 'RDC', 3), ('A-10', 'OCCUPIED', 'STANDARD', 'RDC', 3),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 3), ('B-02', 'AVAILABLE', 'ELECTRIC', '1', 3), ('B-03', 'AVAILABLE', 'STANDARD', '1', 3), ('B-04', 'OCCUPIED', 'STANDARD', '1', 3), ('B-05', 'AVAILABLE', 'STANDARD', '1', 3),
                                                                                         ('B-06', 'MAINTENANCE', 'STANDARD', '1', 3), ('B-07', 'AVAILABLE', 'STANDARD', '1', 3), ('B-08', 'AVAILABLE', 'VIP', '1', 3), ('B-09', 'AVAILABLE', 'STANDARD', '1', 3), ('B-10', 'RESERVED', 'STANDARD', '1', 3),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 3), ('C-02', 'OCCUPIED', 'STANDARD', '2', 3), ('C-03', 'AVAILABLE', 'STANDARD', '2', 3), ('C-04', 'AVAILABLE', 'STANDARD', '2', 3), ('C-05', 'AVAILABLE', 'ELECTRIC', '2', 3),
                                                                                         ('C-06', 'AVAILABLE', 'HANDICAPPED', '2', 3), ('C-07', 'AVAILABLE', 'STANDARD', '2', 3), ('C-08', 'OCCUPIED', 'STANDARD', '2', 3), ('C-09', 'AVAILABLE', 'STANDARD', '2', 3), ('C-10', 'AVAILABLE', 'STANDARD', '2', 3),
                                                                                         ('D-01', 'RESERVED', 'STANDARD', '3', 3), ('D-02', 'AVAILABLE', 'STANDARD', '3', 3), ('D-03', 'AVAILABLE', 'VIP', '3', 3), ('D-04', 'AVAILABLE', 'STANDARD', '3', 3), ('D-05', 'OCCUPIED', 'STANDARD', '3', 3),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 3), ('D-07', 'AVAILABLE', 'STANDARD', '3', 3), ('D-08', 'MAINTENANCE', 'STANDARD', '3', 3), ('D-09', 'AVAILABLE', 'ELECTRIC', '3', 3), ('D-10', 'AVAILABLE', 'STANDARD', '3', 3),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 3), ('E-02', 'AVAILABLE', 'STANDARD', '4', 3), ('E-03', 'OCCUPIED', 'STANDARD', '4', 3), ('E-04', 'AVAILABLE', 'HANDICAPPED', '4', 3), ('E-05', 'AVAILABLE', 'STANDARD', '4', 3),
                                                                                         ('E-06', 'AVAILABLE', 'VIP', '4', 3), ('E-07', 'RESERVED', 'STANDARD', '4', 3), ('E-08', 'AVAILABLE', 'STANDARD', '4', 3), ('E-09', 'AVAILABLE', 'STANDARD', '4', 3), ('E-10', 'AVAILABLE', 'ELECTRIC', '4', 3);

-- Parking Moulay El Yazid (id=4)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 4), ('A-02', 'OCCUPIED', 'STANDARD', 'RDC', 4), ('A-03', 'AVAILABLE', 'STANDARD', 'RDC', 4), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 4), ('A-05', 'RESERVED', 'STANDARD', 'RDC', 4),
                                                                                         ('A-06', 'AVAILABLE', 'STANDARD', 'RDC', 4), ('A-07', 'AVAILABLE', 'VIP', 'RDC', 4), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 4), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 4), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 4),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 4), ('B-02', 'AVAILABLE', 'ELECTRIC', '1', 4), ('B-03', 'OCCUPIED', 'STANDARD', '1', 4), ('B-04', 'AVAILABLE', 'STANDARD', '1', 4), ('B-05', 'AVAILABLE', 'STANDARD', '1', 4),
                                                                                         ('B-06', 'AVAILABLE', 'STANDARD', '1', 4), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 4), ('B-08', 'AVAILABLE', 'VIP', '1', 4), ('B-09', 'AVAILABLE', 'STANDARD', '1', 4), ('B-10', 'RESERVED', 'STANDARD', '1', 4),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 4), ('C-02', 'AVAILABLE', 'STANDARD', '2', 4), ('C-03', 'AVAILABLE', 'HANDICAPPED', '2', 4), ('C-04', 'OCCUPIED', 'STANDARD', '2', 4), ('C-05', 'AVAILABLE', 'STANDARD', '2', 4),
                                                                                         ('C-06', 'AVAILABLE', 'ELECTRIC', '2', 4), ('C-07', 'AVAILABLE', 'STANDARD', '2', 4), ('C-08', 'AVAILABLE', 'STANDARD', '2', 4), ('C-09', 'RESERVED', 'VIP', '2', 4), ('C-10', 'AVAILABLE', 'STANDARD', '2', 4),
                                                                                         ('D-01', 'OCCUPIED', 'STANDARD', '3', 4), ('D-02', 'AVAILABLE', 'STANDARD', '3', 4), ('D-03', 'AVAILABLE', 'STANDARD', '3', 4), ('D-04', 'AVAILABLE', 'VIP', '3', 4), ('D-05', 'AVAILABLE', 'STANDARD', '3', 4),
                                                                                         ('D-06', 'MAINTENANCE', 'STANDARD', '3', 4), ('D-07', 'AVAILABLE', 'STANDARD', '3', 4), ('D-08', 'AVAILABLE', 'ELECTRIC', '3', 4), ('D-09', 'AVAILABLE', 'STANDARD', '3', 4), ('D-10', 'OCCUPIED', 'STANDARD', '3', 4),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 4), ('E-02', 'AVAILABLE', 'HANDICAPPED', '4', 4), ('E-03', 'AVAILABLE', 'STANDARD', '4', 4), ('E-04', 'RESERVED', 'STANDARD', '4', 4), ('E-05', 'AVAILABLE', 'STANDARD', '4', 4),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '4', 4), ('E-07', 'OCCUPIED', 'VIP', '4', 4), ('E-08', 'AVAILABLE', 'STANDARD', '4', 4), ('E-09', 'AVAILABLE', 'STANDARD', '4', 4), ('E-10', 'AVAILABLE', 'ELECTRIC', '4', 4);

-- Parking Koutoubia (id=5)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 5), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 5), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 5), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 5), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 5),
                                                                                         ('A-06', 'RESERVED', 'STANDARD', 'RDC', 5), ('A-07', 'AVAILABLE', 'VIP', 'RDC', 5), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 5), ('A-09', 'AVAILABLE', 'STANDARD', 'RDC', 5), ('A-10', 'OCCUPIED', 'STANDARD', 'RDC', 5),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 5), ('B-02', 'AVAILABLE', 'ELECTRIC', '1', 5), ('B-03', 'AVAILABLE', 'STANDARD', '1', 5), ('B-04', 'OCCUPIED', 'STANDARD', '1', 5), ('B-05', 'AVAILABLE', 'STANDARD', '1', 5),
                                                                                         ('B-06', 'AVAILABLE', 'VIP', '1', 5), ('B-07', 'AVAILABLE', 'STANDARD', '1', 5), ('B-08', 'MAINTENANCE', 'STANDARD', '1', 5), ('B-09', 'RESERVED', 'STANDARD', '1', 5), ('B-10', 'AVAILABLE', 'STANDARD', '1', 5),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 5), ('C-02', 'OCCUPIED', 'STANDARD', '2', 5), ('C-03', 'AVAILABLE', 'STANDARD', '2', 5), ('C-04', 'AVAILABLE', 'HANDICAPPED', '2', 5), ('C-05', 'AVAILABLE', 'ELECTRIC', '2', 5),
                                                                                         ('C-06', 'AVAILABLE', 'STANDARD', '2', 5), ('C-07', 'AVAILABLE', 'STANDARD', '2', 5), ('C-08', 'RESERVED', 'VIP', '2', 5), ('C-09', 'AVAILABLE', 'STANDARD', '2', 5), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 5),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 5), ('D-02', 'AVAILABLE', 'STANDARD', '3', 5), ('D-03', 'OCCUPIED', 'STANDARD', '3', 5), ('D-04', 'AVAILABLE', 'VIP', '3', 5), ('D-05', 'AVAILABLE', 'STANDARD', '3', 5),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 5), ('D-07', 'AVAILABLE', 'ELECTRIC', '3', 5), ('D-08', 'AVAILABLE', 'STANDARD', '3', 5), ('D-09', 'OCCUPIED', 'STANDARD', '3', 5), ('D-10', 'AVAILABLE', 'HANDICAPPED', '3', 5),
                                                                                         ('E-01', 'RESERVED', 'STANDARD', '4', 5), ('E-02', 'AVAILABLE', 'STANDARD', '4', 5), ('E-03', 'AVAILABLE', 'STANDARD', '4', 5), ('E-04', 'AVAILABLE', 'VIP', '4', 5), ('E-05', 'OCCUPIED', 'STANDARD', '4', 5),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '4', 5), ('E-07', 'AVAILABLE', 'ELECTRIC', '4', 5), ('E-08', 'AVAILABLE', 'STANDARD', '4', 5), ('E-09', 'AVAILABLE', 'STANDARD', '4', 5), ('E-10', 'MAINTENANCE', 'STANDARD', '4', 5);

-- Parking Gare Marrakech (id=6)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 6), ('A-02', 'AVAILABLE', 'HANDICAPPED', 'RDC', 6), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 6), ('A-04', 'AVAILABLE', 'STANDARD', 'RDC', 6), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 6),
                                                                                         ('A-06', 'AVAILABLE', 'VIP', 'RDC', 6), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 6), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 6), ('A-09', 'AVAILABLE', 'STANDARD', 'RDC', 6), ('A-10', 'OCCUPIED', 'ELECTRIC', 'RDC', 6),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 6), ('B-02', 'AVAILABLE', 'STANDARD', '1', 6), ('B-03', 'AVAILABLE', 'STANDARD', '1', 6), ('B-04', 'OCCUPIED', 'STANDARD', '1', 6), ('B-05', 'AVAILABLE', 'VIP', '1', 6),
                                                                                         ('B-06', 'AVAILABLE', 'STANDARD', '1', 6), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 6), ('B-08', 'AVAILABLE', 'HANDICAPPED', '1', 6), ('B-09', 'AVAILABLE', 'STANDARD', '1', 6), ('B-10', 'RESERVED', 'STANDARD', '1', 6),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 6), ('C-02', 'OCCUPIED', 'STANDARD', '2', 6), ('C-03', 'AVAILABLE', 'ELECTRIC', '2', 6), ('C-04', 'AVAILABLE', 'STANDARD', '2', 6), ('C-05', 'AVAILABLE', 'STANDARD', '2', 6),
                                                                                         ('C-06', 'RESERVED', 'STANDARD', '2', 6), ('C-07', 'AVAILABLE', 'VIP', '2', 6), ('C-08', 'AVAILABLE', 'STANDARD', '2', 6), ('C-09', 'OCCUPIED', 'STANDARD', '2', 6), ('C-10', 'AVAILABLE', 'STANDARD', '2', 6),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 6), ('D-02', 'AVAILABLE', 'HANDICAPPED', '3', 6), ('D-03', 'AVAILABLE', 'STANDARD', '3', 6), ('D-04', 'AVAILABLE', 'STANDARD', '3', 6), ('D-05', 'OCCUPIED', 'ELECTRIC', '3', 6),
                                                                                         ('D-06', 'AVAILABLE', 'VIP', '3', 6), ('D-07', 'AVAILABLE', 'STANDARD', '3', 6), ('D-08', 'MAINTENANCE', 'STANDARD', '3', 6), ('D-09', 'AVAILABLE', 'STANDARD', '3', 6), ('D-10', 'RESERVED', 'STANDARD', '3', 6),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 6), ('E-02', 'OCCUPIED', 'STANDARD', '4', 6), ('E-03', 'AVAILABLE', 'STANDARD', '4', 6), ('E-04', 'AVAILABLE', 'VIP', '4', 6), ('E-05', 'AVAILABLE', 'STANDARD', '4', 6),
                                                                                         ('E-06', 'AVAILABLE', 'ELECTRIC', '4', 6), ('E-07', 'AVAILABLE', 'STANDARD', '4', 6), ('E-08', 'AVAILABLE', 'HANDICAPPED', '4', 6), ('E-09', 'OCCUPIED', 'STANDARD', '4', 6), ('E-10', 'AVAILABLE', 'STANDARD', '4', 6);

-- Parking Carré Eden (id=7) - Underground floors
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', '-1', 7), ('A-02', 'AVAILABLE', 'ELECTRIC', '-1', 7), ('A-03', 'OCCUPIED', 'STANDARD', '-1', 7), ('A-04', 'AVAILABLE', 'STANDARD', '-1', 7), ('A-05', 'AVAILABLE', 'VIP', '-1', 7),
                                                                                         ('A-06', 'RESERVED', 'STANDARD', '-1', 7), ('A-07', 'AVAILABLE', 'STANDARD', '-1', 7), ('A-08', 'AVAILABLE', 'HANDICAPPED', '-1', 7), ('A-09', 'AVAILABLE', 'STANDARD', '-1', 7), ('A-10', 'OCCUPIED', 'ELECTRIC', '-1', 7),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '-2', 7), ('B-02', 'AVAILABLE', 'STANDARD', '-2', 7), ('B-03', 'AVAILABLE', 'VIP', '-2', 7), ('B-04', 'OCCUPIED', 'STANDARD', '-2', 7), ('B-05', 'AVAILABLE', 'STANDARD', '-2', 7),
                                                                                         ('B-06', 'AVAILABLE', 'ELECTRIC', '-2', 7), ('B-07', 'MAINTENANCE', 'STANDARD', '-2', 7), ('B-08', 'AVAILABLE', 'STANDARD', '-2', 7), ('B-09', 'RESERVED', 'STANDARD', '-2', 7), ('B-10', 'AVAILABLE', 'STANDARD', '-2', 7),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '-3', 7), ('C-02', 'OCCUPIED', 'STANDARD', '-3', 7), ('C-03', 'AVAILABLE', 'HANDICAPPED', '-3', 7), ('C-04', 'AVAILABLE', 'STANDARD', '-3', 7), ('C-05', 'AVAILABLE', 'STANDARD', '-3', 7),
                                                                                         ('C-06', 'AVAILABLE', 'VIP', '-3', 7), ('C-07', 'AVAILABLE', 'ELECTRIC', '-3', 7), ('C-08', 'RESERVED', 'STANDARD', '-3', 7), ('C-09', 'AVAILABLE', 'STANDARD', '-3', 7), ('C-10', 'OCCUPIED', 'STANDARD', '-3', 7),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '-4', 7), ('D-02', 'AVAILABLE', 'STANDARD', '-4', 7), ('D-03', 'AVAILABLE', 'ELECTRIC', '-4', 7), ('D-04', 'AVAILABLE', 'STANDARD', '-4', 7), ('D-05', 'MAINTENANCE', 'STANDARD', '-4', 7),
                                                                                         ('D-06', 'OCCUPIED', 'VIP', '-4', 7), ('D-07', 'AVAILABLE', 'STANDARD', '-4', 7), ('D-08', 'AVAILABLE', 'STANDARD', '-4', 7), ('D-09', 'AVAILABLE', 'HANDICAPPED', '-4', 7), ('D-10', 'RESERVED', 'STANDARD', '-4', 7),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '-5', 7), ('E-02', 'AVAILABLE', 'ELECTRIC', '-5', 7), ('E-03', 'AVAILABLE', 'STANDARD', '-5', 7), ('E-04', 'OCCUPIED', 'STANDARD', '-5', 7), ('E-05', 'AVAILABLE', 'STANDARD', '-5', 7),
                                                                                         ('E-06', 'AVAILABLE', 'VIP', '-5', 7), ('E-07', 'AVAILABLE', 'STANDARD', '-5', 7), ('E-08', 'MAINTENANCE', 'STANDARD', '-5', 7), ('E-09', 'AVAILABLE', 'STANDARD', '-5', 7), ('E-10', 'AVAILABLE', 'ELECTRIC', '-5', 7);

-- Parking Plaza Marrakech (id=8)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'VIP', 'RDC', 8), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 8), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 8), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 8), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 8),
                                                                                         ('A-06', 'AVAILABLE', 'STANDARD', 'RDC', 8), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 8), ('A-08', 'AVAILABLE', 'ELECTRIC', 'RDC', 8), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 8), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 8),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 8), ('B-02', 'AVAILABLE', 'VIP', '1', 8), ('B-03', 'AVAILABLE', 'STANDARD', '1', 8), ('B-04', 'OCCUPIED', 'STANDARD', '1', 8), ('B-05', 'AVAILABLE', 'STANDARD', '1', 8),
                                                                                         ('B-06', 'MAINTENANCE', 'STANDARD', '1', 8), ('B-07', 'AVAILABLE', 'HANDICAPPED', '1', 8), ('B-08', 'AVAILABLE', 'STANDARD', '1', 8), ('B-09', 'RESERVED', 'STANDARD', '1', 8), ('B-10', 'AVAILABLE', 'ELECTRIC', '1', 8),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 8), ('C-02', 'AVAILABLE', 'STANDARD', '2', 8), ('C-03', 'OCCUPIED', 'VIP', '2', 8), ('C-04', 'AVAILABLE', 'STANDARD', '2', 8), ('C-05', 'AVAILABLE', 'STANDARD', '2', 8),
                                                                                         ('C-06', 'AVAILABLE', 'ELECTRIC', '2', 8), ('C-07', 'RESERVED', 'STANDARD', '2', 8), ('C-08', 'AVAILABLE', 'STANDARD', '2', 8), ('C-09', 'AVAILABLE', 'HANDICAPPED', '2', 8), ('C-10', 'OCCUPIED', 'STANDARD', '2', 8),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 8), ('D-02', 'AVAILABLE', 'STANDARD', '3', 8), ('D-03', 'AVAILABLE', 'VIP', '3', 8), ('D-04', 'MAINTENANCE', 'STANDARD', '3', 8), ('D-05', 'AVAILABLE', 'STANDARD', '3', 8),
                                                                                         ('D-06', 'OCCUPIED', 'STANDARD', '3', 8), ('D-07', 'AVAILABLE', 'ELECTRIC', '3', 8), ('D-08', 'AVAILABLE', 'STANDARD', '3', 8), ('D-09', 'AVAILABLE', 'STANDARD', '3', 8), ('D-10', 'RESERVED', 'STANDARD', '3', 8),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 8), ('E-02', 'OCCUPIED', 'STANDARD', '4', 8), ('E-03', 'AVAILABLE', 'VIP', '4', 8), ('E-04', 'AVAILABLE', 'STANDARD', '4', 8), ('E-05', 'AVAILABLE', 'HANDICAPPED', '4', 8),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '4', 8), ('E-07', 'AVAILABLE', 'ELECTRIC', '4', 8), ('E-08', 'OCCUPIED', 'STANDARD', '4', 8), ('E-09', 'AVAILABLE', 'STANDARD', '4', 8), ('E-10', 'AVAILABLE', 'STANDARD', '4', 8);

-- Parking Liberté (id=9)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 9), ('A-02', 'OCCUPIED', 'STANDARD', 'RDC', 9), ('A-03', 'AVAILABLE', 'HANDICAPPED', 'RDC', 9), ('A-04', 'AVAILABLE', 'STANDARD', 'RDC', 9), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 9),
                                                                                         ('A-06', 'RESERVED', 'VIP', 'RDC', 9), ('A-07', 'AVAILABLE', 'STANDARD', 'RDC', 9), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 9), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 9), ('A-10', 'AVAILABLE', 'ELECTRIC', 'RDC', 9),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 9), ('B-02', 'AVAILABLE', 'STANDARD', '1', 9), ('B-03', 'AVAILABLE', 'VIP', '1', 9), ('B-04', 'OCCUPIED', 'STANDARD', '1', 9), ('B-05', 'AVAILABLE', 'STANDARD', '1', 9),
                                                                                         ('B-06', 'AVAILABLE', 'HANDICAPPED', '1', 9), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 9), ('B-08', 'AVAILABLE', 'STANDARD', '1', 9), ('B-09', 'AVAILABLE', 'STANDARD', '1', 9), ('B-10', 'RESERVED', 'ELECTRIC', '1', 9),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 9), ('C-02', 'AVAILABLE', 'STANDARD', '2', 9), ('C-03', 'OCCUPIED', 'STANDARD', '2', 9), ('C-04', 'AVAILABLE', 'VIP', '2', 9), ('C-05', 'AVAILABLE', 'STANDARD', '2', 9),
                                                                                         ('C-06', 'AVAILABLE', 'STANDARD', '2', 9), ('C-07', 'AVAILABLE', 'ELECTRIC', '2', 9), ('C-08', 'RESERVED', 'STANDARD', '2', 9), ('C-09', 'AVAILABLE', 'HANDICAPPED', '2', 9), ('C-10', 'OCCUPIED', 'STANDARD', '2', 9),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 9), ('D-02', 'AVAILABLE', 'STANDARD', '3', 9), ('D-03', 'AVAILABLE', 'VIP', '3', 9), ('D-04', 'AVAILABLE', 'STANDARD', '3', 9), ('D-05', 'MAINTENANCE', 'STANDARD', '3', 9),
                                                                                         ('D-06', 'OCCUPIED', 'STANDARD', '3', 9), ('D-07', 'AVAILABLE', 'ELECTRIC', '3', 9), ('D-08', 'AVAILABLE', 'STANDARD', '3', 9), ('D-09', 'AVAILABLE', 'STANDARD', '3', 9), ('D-10', 'RESERVED', 'STANDARD', '3', 9),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 9), ('E-02', 'OCCUPIED', 'HANDICAPPED', '4', 9), ('E-03', 'AVAILABLE', 'STANDARD', '4', 9), ('E-04', 'AVAILABLE', 'STANDARD', '4', 9), ('E-05', 'AVAILABLE', 'VIP', '4', 9),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '4', 9), ('E-07', 'AVAILABLE', 'STANDARD', '4', 9), ('E-08', 'OCCUPIED', 'ELECTRIC', '4', 9), ('E-09', 'AVAILABLE', 'STANDARD', '4', 9), ('E-10', 'AVAILABLE', 'STANDARD', '4', 9);

-- Parking Bab Nkob (id=10)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 10), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 10), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 10), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 10), ('A-05', 'AVAILABLE', 'VIP', 'RDC', 10),
                                                                                         ('A-06', 'AVAILABLE', 'STANDARD', 'RDC', 10), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 10), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 10), ('A-09', 'AVAILABLE', 'ELECTRIC', 'RDC', 10), ('A-10', 'OCCUPIED', 'STANDARD', 'RDC', 10),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 10), ('B-02', 'AVAILABLE', 'STANDARD', '1', 10), ('B-03', 'AVAILABLE', 'VIP', '1', 10), ('B-04', 'OCCUPIED', 'STANDARD', '1', 10), ('B-05', 'AVAILABLE', 'STANDARD', '1', 10),
                                                                                         ('B-06', 'MAINTENANCE', 'STANDARD', '1', 10), ('B-07', 'AVAILABLE', 'HANDICAPPED', '1', 10), ('B-08', 'AVAILABLE', 'STANDARD', '1', 10), ('B-09', 'AVAILABLE', 'STANDARD', '1', 10), ('B-10', 'RESERVED', 'ELECTRIC', '1', 10),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 10), ('C-02', 'OCCUPIED', 'STANDARD', '2', 10), ('C-03', 'AVAILABLE', 'STANDARD', '2', 10), ('C-04', 'AVAILABLE', 'VIP', '2', 10), ('C-05', 'AVAILABLE', 'STANDARD', '2', 10),
                                                                                         ('C-06', 'AVAILABLE', 'STANDARD', '2', 10), ('C-07', 'AVAILABLE', 'ELECTRIC', '2', 10), ('C-08', 'RESERVED', 'STANDARD', '2', 10), ('C-09', 'AVAILABLE', 'STANDARD', '2', 10), ('C-10', 'MAINTENANCE', 'HANDICAPPED', '2', 10),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 10), ('D-02', 'AVAILABLE', 'STANDARD', '3', 10), ('D-03', 'OCCUPIED', 'VIP', '3', 10), ('D-04', 'AVAILABLE', 'STANDARD', '3', 10), ('D-05', 'AVAILABLE', 'STANDARD', '3', 10),
                                                                                         ('D-06', 'AVAILABLE', 'ELECTRIC', '3', 10), ('D-07', 'RESERVED', 'STANDARD', '3', 10), ('D-08', 'AVAILABLE', 'STANDARD', '3', 10), ('D-09', 'OCCUPIED', 'STANDARD', '3', 10), ('D-10', 'AVAILABLE', 'STANDARD', '3', 10),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 10), ('E-02', 'AVAILABLE', 'HANDICAPPED', '4', 10), ('E-03', 'AVAILABLE', 'STANDARD', '4', 10), ('E-04', 'OCCUPIED', 'STANDARD', '4', 10), ('E-05', 'AVAILABLE', 'VIP', '4', 10),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '4', 10), ('E-07', 'AVAILABLE', 'STANDARD', '4', 10), ('E-08', 'MAINTENANCE', 'ELECTRIC', '4', 10), ('E-09', 'AVAILABLE', 'STANDARD', '4', 10), ('E-10', 'AVAILABLE', 'STANDARD', '4', 10);

-- Parking 16 Novembre (id=11) - Underground
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', '-1', 11), ('A-02', 'OCCUPIED', 'STANDARD', '-1', 11), ('A-03', 'AVAILABLE', 'VIP', '-1', 11), ('A-04', 'AVAILABLE', 'STANDARD', '-1', 11), ('A-05', 'AVAILABLE', 'HANDICAPPED', '-1', 11),
                                                                                         ('A-06', 'RESERVED', 'STANDARD', '-1', 11), ('A-07', 'AVAILABLE', 'STANDARD', '-1', 11), ('A-08', 'AVAILABLE', 'ELECTRIC', '-1', 11), ('A-09', 'OCCUPIED', 'STANDARD', '-1', 11), ('A-10', 'AVAILABLE', 'STANDARD', '-1', 11),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '-2', 11), ('B-02', 'AVAILABLE', 'VIP', '-2', 11), ('B-03', 'AVAILABLE', 'STANDARD', '-2', 11), ('B-04', 'OCCUPIED', 'STANDARD', '-2', 11), ('B-05', 'AVAILABLE', 'STANDARD', '-2', 11),
                                                                                         ('B-06', 'AVAILABLE', 'ELECTRIC', '-2', 11), ('B-07', 'MAINTENANCE', 'STANDARD', '-2', 11), ('B-08', 'AVAILABLE', 'HANDICAPPED', '-2', 11), ('B-09', 'AVAILABLE', 'STANDARD', '-2', 11), ('B-10', 'RESERVED', 'STANDARD', '-2', 11),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '-3', 11), ('C-02', 'AVAILABLE', 'STANDARD', '-3', 11), ('C-03', 'OCCUPIED', 'VIP', '-3', 11), ('C-04', 'AVAILABLE', 'STANDARD', '-3', 11), ('C-05', 'AVAILABLE', 'STANDARD', '-3', 11),
                                                                                         ('C-06', 'AVAILABLE', 'HANDICAPPED', '-3', 11), ('C-07', 'AVAILABLE', 'ELECTRIC', '-3', 11), ('C-08', 'RESERVED', 'STANDARD', '-3', 11), ('C-09', 'AVAILABLE', 'STANDARD', '-3', 11), ('C-10', 'OCCUPIED', 'STANDARD', '-3', 11),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '-4', 11), ('D-02', 'MAINTENANCE', 'STANDARD', '-4', 11), ('D-03', 'AVAILABLE', 'VIP', '-4', 11), ('D-04', 'AVAILABLE', 'STANDARD', '-4', 11), ('D-05', 'OCCUPIED', 'STANDARD', '-4', 11),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '-4', 11), ('D-07', 'AVAILABLE', 'ELECTRIC', '-4', 11), ('D-08', 'AVAILABLE', 'STANDARD', '-4', 11), ('D-09', 'RESERVED', 'HANDICAPPED', '-4', 11), ('D-10', 'AVAILABLE', 'STANDARD', '-4', 11),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '-5', 11), ('E-02', 'OCCUPIED', 'STANDARD', '-5', 11), ('E-03', 'AVAILABLE', 'STANDARD', '-5', 11), ('E-04', 'AVAILABLE', 'VIP', '-5', 11), ('E-05', 'AVAILABLE', 'ELECTRIC', '-5', 11),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '-5', 11), ('E-07', 'AVAILABLE', 'HANDICAPPED', '-5', 11), ('E-08', 'MAINTENANCE', 'STANDARD', '-5', 11), ('E-09', 'AVAILABLE', 'STANDARD', '-5', 11), ('E-10', 'OCCUPIED', 'STANDARD', '-5', 11);

-- Parking Hivernage (id=12)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 12), ('A-02', 'AVAILABLE', 'VIP', 'RDC', 12), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 12), ('A-04', 'AVAILABLE', 'STANDARD', 'RDC', 12), ('A-05', 'AVAILABLE', 'HANDICAPPED', 'RDC', 12),
                                                                                         ('A-06', 'AVAILABLE', 'STANDARD', 'RDC', 12), ('A-07', 'RESERVED', 'ELECTRIC', 'RDC', 12), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 12), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 12), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 12),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 12), ('B-02', 'AVAILABLE', 'STANDARD', '1', 12), ('B-03', 'AVAILABLE', 'VIP', '1', 12), ('B-04', 'OCCUPIED', 'STANDARD', '1', 12), ('B-05', 'AVAILABLE', 'ELECTRIC', '1', 12),
                                                                                         ('B-06', 'AVAILABLE', 'STANDARD', '1', 12), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 12), ('B-08', 'AVAILABLE', 'HANDICAPPED', '1', 12), ('B-09', 'RESERVED', 'STANDARD', '1', 12), ('B-10', 'AVAILABLE', 'STANDARD', '1', 12),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 12), ('C-02', 'OCCUPIED', 'STANDARD', '2', 12), ('C-03', 'AVAILABLE', 'STANDARD', '2', 12), ('C-04', 'AVAILABLE', 'VIP', '2', 12), ('C-05', 'AVAILABLE', 'STANDARD', '2', 12),
                                                                                         ('C-06', 'RESERVED', 'ELECTRIC', '2', 12), ('C-07', 'AVAILABLE', 'STANDARD', '2', 12), ('C-08', 'AVAILABLE', 'HANDICAPPED', '2', 12), ('C-09', 'AVAILABLE', 'STANDARD', '2', 12), ('C-10', 'OCCUPIED', 'STANDARD', '2', 12),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 12), ('D-02', 'AVAILABLE', 'VIP', '3', 12), ('D-03', 'AVAILABLE', 'STANDARD', '3', 12), ('D-04', 'MAINTENANCE', 'STANDARD', '3', 12), ('D-05', 'OCCUPIED', 'ELECTRIC', '3', 12),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 12), ('D-07', 'AVAILABLE', 'STANDARD', '3', 12), ('D-08', 'RESERVED', 'STANDARD', '3', 12), ('D-09', 'AVAILABLE', 'HANDICAPPED', '3', 12), ('D-10', 'AVAILABLE', 'STANDARD', '3', 12),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 12), ('E-02', 'AVAILABLE', 'STANDARD', '4', 12), ('E-03', 'OCCUPIED', 'VIP', '4', 12), ('E-04', 'AVAILABLE', 'STANDARD', '4', 12), ('E-05', 'AVAILABLE', 'ELECTRIC', '4', 12),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '4', 12), ('E-07', 'RESERVED', 'STANDARD', '4', 12), ('E-08', 'AVAILABLE', 'HANDICAPPED', '4', 12), ('E-09', 'AVAILABLE', 'STANDARD', '4', 12), ('E-10', 'MAINTENANCE', 'STANDARD', '4', 12);

-- Parking Palais des Congrès (id=13)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 13), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 13), ('A-03', 'AVAILABLE', 'HANDICAPPED', 'RDC', 13), ('A-04', 'OCCUPIED', 'STANDARD', 'RDC', 13), ('A-05', 'AVAILABLE', 'VIP', 'RDC', 13),
                                                                                         ('A-06', 'AVAILABLE', 'STANDARD', 'RDC', 13), ('A-07', 'AVAILABLE', 'ELECTRIC', 'RDC', 13), ('A-08', 'RESERVED', 'STANDARD', 'RDC', 13), ('A-09', 'AVAILABLE', 'STANDARD', 'RDC', 13), ('A-10', 'OCCUPIED', 'STANDARD', 'RDC', 13),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 13), ('B-02', 'AVAILABLE', 'VIP', '1', 13), ('B-03', 'OCCUPIED', 'STANDARD', '1', 13), ('B-04', 'AVAILABLE', 'STANDARD', '1', 13), ('B-05', 'AVAILABLE', 'ELECTRIC', '1', 13),
                                                                                         ('B-06', 'MAINTENANCE', 'STANDARD', '1', 13), ('B-07', 'AVAILABLE', 'STANDARD', '1', 13), ('B-08', 'AVAILABLE', 'HANDICAPPED', '1', 13), ('B-09', 'RESERVED', 'STANDARD', '1', 13), ('B-10', 'AVAILABLE', 'STANDARD', '1', 13),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 13), ('C-02', 'OCCUPIED', 'STANDARD', '2', 13), ('C-03', 'AVAILABLE', 'VIP', '2', 13), ('C-04', 'AVAILABLE', 'STANDARD', '2', 13), ('C-05', 'AVAILABLE', 'STANDARD', '2', 13),
                                                                                         ('C-06', 'AVAILABLE', 'HANDICAPPED', '2', 13), ('C-07', 'RESERVED', 'ELECTRIC', '2', 13), ('C-08', 'AVAILABLE', 'STANDARD', '2', 13), ('C-09', 'AVAILABLE', 'STANDARD', '2', 13), ('C-10', 'OCCUPIED', 'STANDARD', '2', 13),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 13), ('D-02', 'AVAILABLE', 'STANDARD', '3', 13), ('D-03', 'AVAILABLE', 'VIP', '3', 13), ('D-04', 'MAINTENANCE', 'STANDARD', '3', 13), ('D-05', 'AVAILABLE', 'ELECTRIC', '3', 13),
                                                                                         ('D-06', 'OCCUPIED', 'STANDARD', '3', 13), ('D-07', 'AVAILABLE', 'STANDARD', '3', 13), ('D-08', 'AVAILABLE', 'HANDICAPPED', '3', 13), ('D-09', 'AVAILABLE', 'STANDARD', '3', 13), ('D-10', 'RESERVED', 'STANDARD', '3', 13),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 13), ('E-02', 'OCCUPIED', 'STANDARD', '4', 13), ('E-03', 'AVAILABLE', 'STANDARD', '4', 13), ('E-04', 'AVAILABLE', 'VIP', '4', 13), ('E-05', 'AVAILABLE', 'ELECTRIC', '4', 13),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '4', 13), ('E-07', 'AVAILABLE', 'HANDICAPPED', '4', 13), ('E-08', 'MAINTENANCE', 'STANDARD', '4', 13), ('E-09', 'AVAILABLE', 'STANDARD', '4', 13), ('E-10', 'AVAILABLE', 'STANDARD', '4', 13);

-- Parking Royal Tennis (id=14)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'VIP', 'RDC', 14), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 14), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 14), ('A-04', 'AVAILABLE', 'STANDARD', 'RDC', 14), ('A-05', 'AVAILABLE', 'HANDICAPPED', 'RDC', 14),
                                                                                         ('A-06', 'RESERVED', 'STANDARD', 'RDC', 14), ('A-07', 'AVAILABLE', 'ELECTRIC', 'RDC', 14), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 14), ('A-09', 'AVAILABLE', 'STANDARD', 'RDC', 14), ('A-10', 'OCCUPIED', 'STANDARD', 'RDC', 14),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 14), ('B-02', 'AVAILABLE', 'STANDARD', '1', 14), ('B-03', 'AVAILABLE', 'VIP', '1', 14), ('B-04', 'OCCUPIED', 'STANDARD', '1', 14), ('B-05', 'AVAILABLE', 'STANDARD', '1', 14),
                                                                                         ('B-06', 'AVAILABLE', 'ELECTRIC', '1', 14), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 14), ('B-08', 'AVAILABLE', 'STANDARD', '1', 14), ('B-09', 'AVAILABLE', 'HANDICAPPED', '1', 14), ('B-10', 'RESERVED', 'STANDARD', '1', 14),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 14), ('C-02', 'OCCUPIED', 'STANDARD', '2', 14), ('C-03', 'AVAILABLE', 'STANDARD', '2', 14), ('C-04', 'AVAILABLE', 'VIP', '2', 14), ('C-05', 'AVAILABLE', 'STANDARD', '2', 14),
                                                                                         ('C-06', 'AVAILABLE', 'HANDICAPPED', '2', 14), ('C-07', 'AVAILABLE', 'ELECTRIC', '2', 14), ('C-08', 'RESERVED', 'STANDARD', '2', 14), ('C-09', 'AVAILABLE', 'STANDARD', '2', 14), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 14),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 14), ('D-02', 'AVAILABLE', 'STANDARD', '3', 14), ('D-03', 'OCCUPIED', 'VIP', '3', 14), ('D-04', 'AVAILABLE', 'STANDARD', '3', 14), ('D-05', 'AVAILABLE', 'ELECTRIC', '3', 14),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 14), ('D-07', 'RESERVED', 'STANDARD', '3', 14), ('D-08', 'AVAILABLE', 'HANDICAPPED', '3', 14), ('D-09', 'OCCUPIED', 'STANDARD', '3', 14), ('D-10', 'AVAILABLE', 'STANDARD', '3', 14),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 14), ('E-02', 'AVAILABLE', 'VIP', '4', 14), ('E-03', 'AVAILABLE', 'STANDARD', '4', 14), ('E-04', 'OCCUPIED', 'STANDARD', '4', 14), ('E-05', 'AVAILABLE', 'STANDARD', '4', 14),
                                                                                         ('E-06', 'MAINTENANCE', 'ELECTRIC', '4', 14), ('E-07', 'AVAILABLE', 'STANDARD', '4', 14), ('E-08', 'AVAILABLE', 'STANDARD', '4', 14), ('E-09', 'AVAILABLE', 'HANDICAPPED', '4', 14), ('E-10', 'RESERVED', 'STANDARD', '4', 14);

-- Parking Majorelle (id=15)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 15), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 15), ('A-03', 'AVAILABLE', 'HANDICAPPED', 'RDC', 15), ('A-04', 'OCCUPIED', 'STANDARD', 'RDC', 15), ('A-05', 'AVAILABLE', 'VIP', 'RDC', 15),
                                                                                         ('A-06', 'AVAILABLE', 'STANDARD', 'RDC', 15), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 15), ('A-08', 'AVAILABLE', 'ELECTRIC', 'RDC', 15), ('A-09', 'AVAILABLE', 'STANDARD', 'RDC', 15), ('A-10', 'OCCUPIED', 'STANDARD', 'RDC', 15),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 15), ('B-02', 'AVAILABLE', 'VIP', '1', 15), ('B-03', 'OCCUPIED', 'STANDARD', '1', 15), ('B-04', 'AVAILABLE', 'STANDARD', '1', 15), ('B-05', 'AVAILABLE', 'STANDARD', '1', 15),
                                                                                         ('B-06', 'AVAILABLE', 'ELECTRIC', '1', 15), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 15), ('B-08', 'AVAILABLE', 'HANDICAPPED', '1', 15), ('B-09', 'AVAILABLE', 'STANDARD', '1', 15), ('B-10', 'RESERVED', 'STANDARD', '1', 15),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 15), ('C-02', 'AVAILABLE', 'STANDARD', '2', 15), ('C-03', 'OCCUPIED', 'VIP', '2', 15), ('C-04', 'AVAILABLE', 'STANDARD', '2', 15), ('C-05', 'AVAILABLE', 'HANDICAPPED', '2', 15),
                                                                                         ('C-06', 'RESERVED', 'STANDARD', '2', 15), ('C-07', 'AVAILABLE', 'ELECTRIC', '2', 15), ('C-08', 'AVAILABLE', 'STANDARD', '2', 15), ('C-09', 'OCCUPIED', 'STANDARD', '2', 15), ('C-10', 'AVAILABLE', 'STANDARD', '2', 15),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 15), ('D-02', 'MAINTENANCE', 'STANDARD', '3', 15), ('D-03', 'AVAILABLE', 'VIP', '3', 15), ('D-04', 'AVAILABLE', 'STANDARD', '3', 15), ('D-05', 'OCCUPIED', 'STANDARD', '3', 15),
                                                                                         ('D-06', 'AVAILABLE', 'ELECTRIC', '3', 15), ('D-07', 'AVAILABLE', 'STANDARD', '3', 15), ('D-08', 'RESERVED', 'HANDICAPPED', '3', 15), ('D-09', 'AVAILABLE', 'STANDARD', '3', 15), ('D-10', 'AVAILABLE', 'STANDARD', '3', 15),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 15), ('E-02', 'OCCUPIED', 'STANDARD', '4', 15), ('E-03', 'AVAILABLE', 'STANDARD', '4', 15), ('E-04', 'AVAILABLE', 'VIP', '4', 15), ('E-05', 'AVAILABLE', 'ELECTRIC', '4', 15),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '4', 15), ('E-07', 'AVAILABLE', 'HANDICAPPED', '4', 15), ('E-08', 'AVAILABLE', 'STANDARD', '4', 15), ('E-09', 'MAINTENANCE', 'STANDARD', '4', 15), ('E-10', 'RESERVED', 'STANDARD', '4', 15);

-- Parking Semlalia (id=16)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 16), ('A-02', 'OCCUPIED', 'STANDARD', 'RDC', 16), ('A-03', 'AVAILABLE', 'HANDICAPPED', 'RDC', 16), ('A-04', 'AVAILABLE', 'STANDARD', 'RDC', 16), ('A-05', 'AVAILABLE', 'VIP', 'RDC', 16),
                                                                                         ('A-06', 'RESERVED', 'STANDARD', 'RDC', 16), ('A-07', 'AVAILABLE', 'STANDARD', 'RDC', 16), ('A-08', 'AVAILABLE', 'ELECTRIC', 'RDC', 16), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 16), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 16),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 16), ('B-02', 'AVAILABLE', 'VIP', '1', 16), ('B-03', 'AVAILABLE', 'STANDARD', '1', 16), ('B-04', 'OCCUPIED', 'STANDARD', '1', 16), ('B-05', 'AVAILABLE', 'HANDICAPPED', '1', 16),
                                                                                         ('B-06', 'AVAILABLE', 'ELECTRIC', '1', 16), ('B-07', 'AVAILABLE', 'STANDARD', '1', 16), ('B-08', 'MAINTENANCE', 'STANDARD', '1', 16), ('B-09', 'RESERVED', 'STANDARD', '1', 16), ('B-10', 'AVAILABLE', 'STANDARD', '1', 16),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 16), ('C-02', 'AVAILABLE', 'STANDARD', '2', 16), ('C-03', 'OCCUPIED', 'VIP', '2', 16), ('C-04', 'AVAILABLE', 'STANDARD', '2', 16), ('C-05', 'AVAILABLE', 'ELECTRIC', '2', 16),
                                                                                         ('C-06', 'AVAILABLE', 'STANDARD', '2', 16), ('C-07', 'RESERVED', 'HANDICAPPED', '2', 16), ('C-08', 'AVAILABLE', 'STANDARD', '2', 16), ('C-09', 'OCCUPIED', 'STANDARD', '2', 16), ('C-10', 'AVAILABLE', 'STANDARD', '2', 16),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 16), ('D-02', 'AVAILABLE', 'VIP', '3', 16), ('D-03', 'AVAILABLE', 'STANDARD', '3', 16), ('D-04', 'MAINTENANCE', 'STANDARD', '3', 16), ('D-05', 'OCCUPIED', 'ELECTRIC', '3', 16),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 16), ('D-07', 'AVAILABLE', 'STANDARD', '3', 16), ('D-08', 'RESERVED', 'HANDICAPPED', '3', 16), ('D-09', 'AVAILABLE', 'STANDARD', '3', 16), ('D-10', 'AVAILABLE', 'STANDARD', '3', 16),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 16), ('E-02', 'OCCUPIED', 'STANDARD', '4', 16), ('E-03', 'AVAILABLE', 'VIP', '4', 16), ('E-04', 'AVAILABLE', 'STANDARD', '4', 16), ('E-05', 'AVAILABLE', 'ELECTRIC', '4', 16),
                                                                                         ('E-06', 'AVAILABLE', 'HANDICAPPED', '4', 16), ('E-07', 'AVAILABLE', 'STANDARD', '4', 16), ('E-08', 'AVAILABLE', 'STANDARD', '4', 16), ('E-09', 'MAINTENANCE', 'STANDARD', '4', 16), ('E-10', 'RESERVED', 'STANDARD', '4', 16);

-- Parking Menara Mall (id=17) - Underground
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', '-1', 17), ('A-02', 'AVAILABLE', 'ELECTRIC', '-1', 17), ('A-03', 'OCCUPIED', 'STANDARD', '-1', 17), ('A-04', 'AVAILABLE', 'VIP', '-1', 17), ('A-05', 'AVAILABLE', 'STANDARD', '-1', 17),
                                                                                         ('A-06', 'AVAILABLE', 'HANDICAPPED', '-1', 17), ('A-07', 'RESERVED', 'STANDARD', '-1', 17), ('A-08', 'AVAILABLE', 'STANDARD', '-1', 17), ('A-09', 'OCCUPIED', 'ELECTRIC', '-1', 17), ('A-10', 'AVAILABLE', 'STANDARD', '-1', 17),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '-2', 17), ('B-02', 'AVAILABLE', 'VIP', '-2', 17), ('B-03', 'AVAILABLE', 'STANDARD', '-2', 17), ('B-04', 'OCCUPIED', 'STANDARD', '-2', 17), ('B-05', 'AVAILABLE', 'ELECTRIC', '-2', 17),
                                                                                         ('B-06', 'AVAILABLE', 'STANDARD', '-2', 17), ('B-07', 'MAINTENANCE', 'STANDARD', '-2', 17), ('B-08', 'AVAILABLE', 'HANDICAPPED', '-2', 17), ('B-09', 'RESERVED', 'STANDARD', '-2', 17), ('B-10', 'AVAILABLE', 'STANDARD', '-2', 17),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '-3', 17), ('C-02', 'OCCUPIED', 'STANDARD', '-3', 17), ('C-03', 'AVAILABLE', 'VIP', '-3', 17), ('C-04', 'AVAILABLE', 'STANDARD', '-3', 17), ('C-05', 'AVAILABLE', 'ELECTRIC', '-3', 17),
                                                                                         ('C-06', 'RESERVED', 'STANDARD', '-3', 17), ('C-07', 'AVAILABLE', 'STANDARD', '-3', 17), ('C-08', 'AVAILABLE', 'HANDICAPPED', '-3', 17), ('C-09', 'OCCUPIED', 'STANDARD', '-3', 17), ('C-10', 'AVAILABLE', 'STANDARD', '-3', 17),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '-4', 17), ('D-02', 'AVAILABLE', 'ELECTRIC', '-4', 17), ('D-03', 'AVAILABLE', 'STANDARD', '-4', 17), ('D-04', 'MAINTENANCE', 'VIP', '-4', 17), ('D-05', 'OCCUPIED', 'STANDARD', '-4', 17),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '-4', 17), ('D-07', 'AVAILABLE', 'HANDICAPPED', '-4', 17), ('D-08', 'RESERVED', 'STANDARD', '-4', 17), ('D-09', 'AVAILABLE', 'STANDARD', '-4', 17), ('D-10', 'AVAILABLE', 'ELECTRIC', '-4', 17),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '-5', 17), ('E-02', 'OCCUPIED', 'STANDARD', '-5', 17), ('E-03', 'AVAILABLE', 'VIP', '-5', 17), ('E-04', 'AVAILABLE', 'STANDARD', '-5', 17), ('E-05', 'AVAILABLE', 'STANDARD', '-5', 17),
                                                                                         ('E-06', 'AVAILABLE', 'ELECTRIC', '-5', 17), ('E-07', 'MAINTENANCE', 'STANDARD', '-5', 17), ('E-08', 'AVAILABLE', 'HANDICAPPED', '-5', 17), ('E-09', 'RESERVED', 'STANDARD', '-5', 17), ('E-10', 'AVAILABLE', 'STANDARD', '-5', 17);

-- Parking Menara Gardens (id=18)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 18), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 18), ('A-03', 'OCCUPIED', 'HANDICAPPED', 'RDC', 18), ('A-04', 'AVAILABLE', 'STANDARD', 'RDC', 18), ('A-05', 'AVAILABLE', 'VIP', 'RDC', 18),
                                                                                         ('A-06', 'RESERVED', 'STANDARD', 'RDC', 18), ('A-07', 'AVAILABLE', 'STANDARD', 'RDC', 18), ('A-08', 'AVAILABLE', 'ELECTRIC', 'RDC', 18), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 18), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 18),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 18), ('B-02', 'AVAILABLE', 'VIP', '1', 18), ('B-03', 'AVAILABLE', 'STANDARD', '1', 18), ('B-04', 'OCCUPIED', 'STANDARD', '1', 18), ('B-05', 'AVAILABLE', 'HANDICAPPED', '1', 18),
                                                                                         ('B-06', 'AVAILABLE', 'ELECTRIC', '1', 18), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 18), ('B-08', 'AVAILABLE', 'STANDARD', '1', 18), ('B-09', 'RESERVED', 'STANDARD', '1', 18), ('B-10', 'AVAILABLE', 'STANDARD', '1', 18),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 18), ('C-02', 'OCCUPIED', 'STANDARD', '2', 18), ('C-03', 'AVAILABLE', 'VIP', '2', 18), ('C-04', 'AVAILABLE', 'STANDARD', '2', 18), ('C-05', 'AVAILABLE', 'STANDARD', '2', 18),
                                                                                         ('C-06', 'AVAILABLE', 'ELECTRIC', '2', 18), ('C-07', 'RESERVED', 'HANDICAPPED', '2', 18), ('C-08', 'AVAILABLE', 'STANDARD', '2', 18), ('C-09', 'AVAILABLE', 'STANDARD', '2', 18), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 18),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 18), ('D-02', 'AVAILABLE', 'STANDARD', '3', 18), ('D-03', 'OCCUPIED', 'VIP', '3', 18), ('D-04', 'AVAILABLE', 'STANDARD', '3', 18), ('D-05', 'AVAILABLE', 'ELECTRIC', '3', 18),
                                                                                         ('D-06', 'AVAILABLE', 'HANDICAPPED', '3', 18), ('D-07', 'RESERVED', 'STANDARD', '3', 18), ('D-08', 'AVAILABLE', 'STANDARD', '3', 18), ('D-09', 'OCCUPIED', 'STANDARD', '3', 18), ('D-10', 'AVAILABLE', 'STANDARD', '3', 18),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 18), ('E-02', 'AVAILABLE', 'VIP', '4', 18), ('E-03', 'AVAILABLE', 'STANDARD', '4', 18), ('E-04', 'OCCUPIED', 'STANDARD', '4', 18), ('E-05', 'AVAILABLE', 'STANDARD', '4', 18),
                                                                                         ('E-06', 'AVAILABLE', 'ELECTRIC', '4', 18), ('E-07', 'AVAILABLE', 'HANDICAPPED', '4', 18), ('E-08', 'MAINTENANCE', 'STANDARD', '4', 18), ('E-09', 'AVAILABLE', 'STANDARD', '4', 18), ('E-10', 'RESERVED', 'STANDARD', '4', 18);

-- Parking Al Mazar (id=19) - Underground
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', '-1', 19), ('A-02', 'OCCUPIED', 'STANDARD', '-1', 19), ('A-03', 'AVAILABLE', 'VIP', '-1', 19), ('A-04', 'AVAILABLE', 'STANDARD', '-1', 19), ('A-05', 'AVAILABLE', 'ELECTRIC', '-1', 19),
                                                                                         ('A-06', 'AVAILABLE', 'HANDICAPPED', '-1', 19), ('A-07', 'RESERVED', 'STANDARD', '-1', 19), ('A-08', 'AVAILABLE', 'STANDARD', '-1', 19), ('A-09', 'OCCUPIED', 'STANDARD', '-1', 19), ('A-10', 'AVAILABLE', 'VIP', '-1', 19),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '-2', 19), ('B-02', 'AVAILABLE', 'ELECTRIC', '-2', 19), ('B-03', 'AVAILABLE', 'STANDARD', '-2', 19), ('B-04', 'OCCUPIED', 'STANDARD', '-2', 19), ('B-05', 'AVAILABLE', 'STANDARD', '-2', 19),
                                                                                         ('B-06', 'MAINTENANCE', 'HANDICAPPED', '-2', 19), ('B-07', 'AVAILABLE', 'STANDARD', '-2', 19), ('B-08', 'RESERVED', 'VIP', '-2', 19), ('B-09', 'AVAILABLE', 'STANDARD', '-2', 19), ('B-10', 'AVAILABLE', 'STANDARD', '-2', 19),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '-3', 19), ('C-02', 'AVAILABLE', 'STANDARD', '-3', 19), ('C-03', 'OCCUPIED', 'ELECTRIC', '-3', 19), ('C-04', 'AVAILABLE', 'VIP', '-3', 19), ('C-05', 'AVAILABLE', 'STANDARD', '-3', 19),
                                                                                         ('C-06', 'RESERVED', 'STANDARD', '-3', 19), ('C-07', 'AVAILABLE', 'STANDARD', '-3', 19), ('C-08', 'AVAILABLE', 'HANDICAPPED', '-3', 19), ('C-09', 'OCCUPIED', 'STANDARD', '-3', 19), ('C-10', 'AVAILABLE', 'STANDARD', '-3', 19),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '-4', 19), ('D-02', 'MAINTENANCE', 'STANDARD', '-4', 19), ('D-03', 'AVAILABLE', 'VIP', '-4', 19), ('D-04', 'AVAILABLE', 'ELECTRIC', '-4', 19), ('D-05', 'OCCUPIED', 'STANDARD', '-4', 19),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '-4', 19), ('D-07', 'AVAILABLE', 'STANDARD', '-4', 19), ('D-08', 'RESERVED', 'HANDICAPPED', '-4', 19), ('D-09', 'AVAILABLE', 'STANDARD', '-4', 19), ('D-10', 'AVAILABLE', 'STANDARD', '-4', 19),
                                                                                         ('E-01', 'OCCUPIED', 'STANDARD', '-5', 19), ('E-02', 'AVAILABLE', 'VIP', '-5', 19), ('E-03', 'AVAILABLE', 'STANDARD', '-5', 19), ('E-04', 'AVAILABLE', 'ELECTRIC', '-5', 19), ('E-05', 'AVAILABLE', 'STANDARD', '-5', 19),
                                                                                         ('E-06', 'RESERVED', 'STANDARD', '-5', 19), ('E-07', 'AVAILABLE', 'HANDICAPPED', '-5', 19), ('E-08', 'AVAILABLE', 'STANDARD', '-5', 19), ('E-09', 'MAINTENANCE', 'STANDARD', '-5', 19), ('E-10', 'OCCUPIED', 'STANDARD', '-5', 19);

-- Parking Royal Agdal (id=20)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'VIP', 'RDC', 20), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 20), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 20), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 20), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 20),
                                                                                         ('A-06', 'RESERVED', 'STANDARD', 'RDC', 20), ('A-07', 'AVAILABLE', 'ELECTRIC', 'RDC', 20), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 20), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 20), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 20),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 20), ('B-02', 'AVAILABLE', 'VIP', '1', 20), ('B-03', 'OCCUPIED', 'STANDARD', '1', 20), ('B-04', 'AVAILABLE', 'STANDARD', '1', 20), ('B-05', 'AVAILABLE', 'ELECTRIC', '1', 20),
                                                                                         ('B-06', 'MAINTENANCE', 'STANDARD', '1', 20), ('B-07', 'AVAILABLE', 'HANDICAPPED', '1', 20), ('B-08', 'AVAILABLE', 'STANDARD', '1', 20), ('B-09', 'RESERVED', 'STANDARD', '1', 20), ('B-10', 'AVAILABLE', 'STANDARD', '1', 20),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 20), ('C-02', 'OCCUPIED', 'STANDARD', '2', 20), ('C-03', 'AVAILABLE', 'VIP', '2', 20), ('C-04', 'AVAILABLE', 'STANDARD', '2', 20), ('C-05', 'AVAILABLE', 'HANDICAPPED', '2', 20),
                                                                                         ('C-06', 'AVAILABLE', 'ELECTRIC', '2', 20), ('C-07', 'RESERVED', 'STANDARD', '2', 20), ('C-08', 'AVAILABLE', 'STANDARD', '2', 20), ('C-09', 'AVAILABLE', 'STANDARD', '2', 20), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 20),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 20), ('D-02', 'AVAILABLE', 'STANDARD', '3', 20), ('D-03', 'OCCUPIED', 'VIP', '3', 20), ('D-04', 'AVAILABLE', 'ELECTRIC', '3', 20), ('D-05', 'AVAILABLE', 'STANDARD', '3', 20),
                                                                                         ('D-06', 'AVAILABLE', 'HANDICAPPED', '3', 20), ('D-07', 'RESERVED', 'STANDARD', '3', 20), ('D-08', 'AVAILABLE', 'STANDARD', '3', 20), ('D-09', 'OCCUPIED', 'STANDARD', '3', 20), ('D-10', 'AVAILABLE', 'STANDARD', '3', 20),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 20), ('E-02', 'AVAILABLE', 'VIP', '4', 20), ('E-03', 'AVAILABLE', 'STANDARD', '4', 20), ('E-04', 'MAINTENANCE', 'STANDARD', '4', 20), ('E-05', 'OCCUPIED', 'ELECTRIC', '4', 20),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '4', 20), ('E-07', 'AVAILABLE', 'HANDICAPPED', '4', 20), ('E-08', 'RESERVED', 'STANDARD', '4', 20), ('E-09', 'AVAILABLE', 'STANDARD', '4', 20), ('E-10', 'AVAILABLE', 'STANDARD', '4', 20);

-- Parking Bab Jdid (id=21)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 21), ('A-02', 'OCCUPIED', 'STANDARD', 'RDC', 21), ('A-03', 'AVAILABLE', 'HANDICAPPED', 'RDC', 21), ('A-04', 'AVAILABLE', 'VIP', 'RDC', 21), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 21),
                                                                                         ('A-06', 'AVAILABLE', 'STANDARD', 'RDC', 21), ('A-07', 'RESERVED', 'ELECTRIC', 'RDC', 21), ('A-08', 'OCCUPIED', 'STANDARD', 'RDC', 21), ('A-09', 'AVAILABLE', 'STANDARD', 'RDC', 21), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 21),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 21), ('B-02', 'AVAILABLE', 'VIP', '1', 21), ('B-03', 'AVAILABLE', 'STANDARD', '1', 21), ('B-04', 'OCCUPIED', 'STANDARD', '1', 21), ('B-05', 'AVAILABLE', 'ELECTRIC', '1', 21),
                                                                                         ('B-06', 'MAINTENANCE', 'STANDARD', '1', 21), ('B-07', 'AVAILABLE', 'HANDICAPPED', '1', 21), ('B-08', 'AVAILABLE', 'STANDARD', '1', 21), ('B-09', 'RESERVED', 'STANDARD', '1', 21), ('B-10', 'AVAILABLE', 'STANDARD', '1', 21),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 21), ('C-02', 'AVAILABLE', 'STANDARD', '2', 21), ('C-03', 'OCCUPIED', 'VIP', '2', 21), ('C-04', 'AVAILABLE', 'STANDARD', '2', 21), ('C-05', 'AVAILABLE', 'HANDICAPPED', '2', 21),
                                                                                         ('C-06', 'RESERVED', 'STANDARD', '2', 21), ('C-07', 'AVAILABLE', 'ELECTRIC', '2', 21), ('C-08', 'AVAILABLE', 'STANDARD', '2', 21), ('C-09', 'OCCUPIED', 'STANDARD', '2', 21), ('C-10', 'AVAILABLE', 'STANDARD', '2', 21),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 21), ('D-02', 'MAINTENANCE', 'STANDARD', '3', 21), ('D-03', 'AVAILABLE', 'VIP', '3', 21), ('D-04', 'AVAILABLE', 'STANDARD', '3', 21), ('D-05', 'OCCUPIED', 'ELECTRIC', '3', 21),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 21), ('D-07', 'AVAILABLE', 'HANDICAPPED', '3', 21), ('D-08', 'RESERVED', 'STANDARD', '3', 21), ('D-09', 'AVAILABLE', 'STANDARD', '3', 21), ('D-10', 'AVAILABLE', 'STANDARD', '3', 21),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 21), ('E-02', 'OCCUPIED', 'STANDARD', '4', 21), ('E-03', 'AVAILABLE', 'VIP', '4', 21), ('E-04', 'AVAILABLE', 'ELECTRIC', '4', 21), ('E-05', 'AVAILABLE', 'STANDARD', '4', 21),
                                                                                         ('E-06', 'AVAILABLE', 'HANDICAPPED', '4', 21), ('E-07', 'AVAILABLE', 'STANDARD', '4', 21), ('E-08', 'MAINTENANCE', 'STANDARD', '4', 21), ('E-09', 'RESERVED', 'STANDARD', '4', 21), ('E-10', 'AVAILABLE', 'STANDARD', '4', 21);

-- Parking Bab Doukkala (id=22)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 22), ('A-02', 'AVAILABLE', 'VIP', 'RDC', 22), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 22), ('A-04', 'AVAILABLE', 'STANDARD', 'RDC', 22), ('A-05', 'AVAILABLE', 'HANDICAPPED', 'RDC', 22),
                                                                                         ('A-06', 'AVAILABLE', 'ELECTRIC', 'RDC', 22), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 22), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 22), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 22), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 22),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 22), ('B-02', 'AVAILABLE', 'STANDARD', '1', 22), ('B-03', 'AVAILABLE', 'VIP', '1', 22), ('B-04', 'OCCUPIED', 'STANDARD', '1', 22), ('B-05', 'AVAILABLE', 'ELECTRIC', '1', 22),
                                                                                         ('B-06', 'AVAILABLE', 'HANDICAPPED', '1', 22), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 22), ('B-08', 'AVAILABLE', 'STANDARD', '1', 22), ('B-09', 'RESERVED', 'STANDARD', '1', 22), ('B-10', 'AVAILABLE', 'STANDARD', '1', 22),
                                                                                         ('C-01', 'OCCUPIED', 'STANDARD', '2', 22), ('C-02', 'AVAILABLE', 'STANDARD', '2', 22), ('C-03', 'AVAILABLE', 'VIP', '2', 22), ('C-04', 'AVAILABLE', 'STANDARD', '2', 22), ('C-05', 'RESERVED', 'ELECTRIC', '2', 22),
                                                                                         ('C-06', 'AVAILABLE', 'STANDARD', '2', 22), ('C-07', 'AVAILABLE', 'HANDICAPPED', '2', 22), ('C-08', 'OCCUPIED', 'STANDARD', '2', 22), ('C-09', 'AVAILABLE', 'STANDARD', '2', 22), ('C-10', 'AVAILABLE', 'STANDARD', '2', 22),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 22), ('D-02', 'AVAILABLE', 'VIP', '3', 22), ('D-03', 'MAINTENANCE', 'STANDARD', '3', 22), ('D-04', 'OCCUPIED', 'STANDARD', '3', 22), ('D-05', 'AVAILABLE', 'ELECTRIC', '3', 22),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 22), ('D-07', 'AVAILABLE', 'HANDICAPPED', '3', 22), ('D-08', 'RESERVED', 'STANDARD', '3', 22), ('D-09', 'AVAILABLE', 'STANDARD', '3', 22), ('D-10', 'AVAILABLE', 'STANDARD', '3', 22),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 22), ('E-02', 'OCCUPIED', 'STANDARD', '4', 22), ('E-03', 'AVAILABLE', 'VIP', '4', 22), ('E-04', 'AVAILABLE', 'STANDARD', '4', 22), ('E-05', 'AVAILABLE', 'ELECTRIC', '4', 22),
                                                                                         ('E-06', 'MAINTENANCE', 'HANDICAPPED', '4', 22), ('E-07', 'AVAILABLE', 'STANDARD', '4', 22), ('E-08', 'AVAILABLE', 'STANDARD', '4', 22), ('E-09', 'RESERVED', 'STANDARD', '4', 22), ('E-10', 'AVAILABLE', 'STANDARD', '4', 22);

-- Parking Palmeraie (id=23)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 23), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 23), ('A-03', 'OCCUPIED', 'VIP', 'RDC', 23), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 23), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 23),
                                                                                         ('A-06', 'RESERVED', 'ELECTRIC', 'RDC', 23), ('A-07', 'AVAILABLE', 'STANDARD', 'RDC', 23), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 23), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 23), ('A-10', 'AVAILABLE', 'VIP', 'RDC', 23),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 23), ('B-02', 'AVAILABLE', 'ELECTRIC', '1', 23), ('B-03', 'OCCUPIED', 'STANDARD', '1', 23), ('B-04', 'AVAILABLE', 'STANDARD', '1', 23), ('B-05', 'AVAILABLE', 'HANDICAPPED', '1', 23),
                                                                                         ('B-06', 'AVAILABLE', 'VIP', '1', 23), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 23), ('B-08', 'AVAILABLE', 'STANDARD', '1', 23), ('B-09', 'RESERVED', 'STANDARD', '1', 23), ('B-10', 'AVAILABLE', 'STANDARD', '1', 23),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 23), ('C-02', 'OCCUPIED', 'STANDARD', '2', 23), ('C-03', 'AVAILABLE', 'VIP', '2', 23), ('C-04', 'AVAILABLE', 'ELECTRIC', '2', 23), ('C-05', 'AVAILABLE', 'STANDARD', '2', 23),
                                                                                         ('C-06', 'AVAILABLE', 'HANDICAPPED', '2', 23), ('C-07', 'RESERVED', 'STANDARD', '2', 23), ('C-08', 'AVAILABLE', 'STANDARD', '2', 23), ('C-09', 'AVAILABLE', 'STANDARD', '2', 23), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 23),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 23), ('D-02', 'AVAILABLE', 'VIP', '3', 23), ('D-03', 'OCCUPIED', 'STANDARD', '3', 23), ('D-04', 'AVAILABLE', 'STANDARD', '3', 23), ('D-05', 'AVAILABLE', 'ELECTRIC', '3', 23),
                                                                                         ('D-06', 'RESERVED', 'STANDARD', '3', 23), ('D-07', 'AVAILABLE', 'HANDICAPPED', '3', 23), ('D-08', 'AVAILABLE', 'STANDARD', '3', 23), ('D-09', 'OCCUPIED', 'STANDARD', '3', 23), ('D-10', 'AVAILABLE', 'STANDARD', '3', 23),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 23), ('E-02', 'AVAILABLE', 'STANDARD', '4', 23), ('E-03', 'AVAILABLE', 'VIP', '4', 23), ('E-04', 'OCCUPIED', 'ELECTRIC', '4', 23), ('E-05', 'AVAILABLE', 'STANDARD', '4', 23),
                                                                                         ('E-06', 'AVAILABLE', 'HANDICAPPED', '4', 23), ('E-07', 'MAINTENANCE', 'STANDARD', '4', 23), ('E-08', 'AVAILABLE', 'STANDARD', '4', 23), ('E-09', 'RESERVED', 'STANDARD', '4', 23), ('E-10', 'AVAILABLE', 'STANDARD', '4', 23);

-- Parking Palmeraie Golf (id=24)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'VIP', 'RDC', 24), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 24), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 24), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 24), ('A-05', 'AVAILABLE', 'ELECTRIC', 'RDC', 24),
                                                                                         ('A-06', 'AVAILABLE', 'STANDARD', 'RDC', 24), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 24), ('A-08', 'AVAILABLE', 'VIP', 'RDC', 24), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 24), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 24),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 24), ('B-02', 'AVAILABLE', 'ELECTRIC', '1', 24), ('B-03', 'AVAILABLE', 'STANDARD', '1', 24), ('B-04', 'OCCUPIED', 'VIP', '1', 24), ('B-05', 'AVAILABLE', 'STANDARD', '1', 24),
                                                                                         ('B-06', 'AVAILABLE', 'HANDICAPPED', '1', 24), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 24), ('B-08', 'AVAILABLE', 'STANDARD', '1', 24), ('B-09', 'RESERVED', 'STANDARD', '1', 24), ('B-10', 'AVAILABLE', 'STANDARD', '1', 24),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 24), ('C-02', 'OCCUPIED', 'STANDARD', '2', 24), ('C-03', 'AVAILABLE', 'VIP', '2', 24), ('C-04', 'AVAILABLE', 'STANDARD', '2', 24), ('C-05', 'AVAILABLE', 'ELECTRIC', '2', 24),
                                                                                         ('C-06', 'RESERVED', 'STANDARD', '2', 24), ('C-07', 'AVAILABLE', 'HANDICAPPED', '2', 24), ('C-08', 'AVAILABLE', 'STANDARD', '2', 24), ('C-09', 'OCCUPIED', 'STANDARD', '2', 24), ('C-10', 'AVAILABLE', 'STANDARD', '2', 24),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 24), ('D-02', 'AVAILABLE', 'VIP', '3', 24), ('D-03', 'MAINTENANCE', 'STANDARD', '3', 24), ('D-04', 'AVAILABLE', 'ELECTRIC', '3', 24), ('D-05', 'OCCUPIED', 'STANDARD', '3', 24),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 24), ('D-07', 'AVAILABLE', 'HANDICAPPED', '3', 24), ('D-08', 'RESERVED', 'STANDARD', '3', 24), ('D-09', 'AVAILABLE', 'STANDARD', '3', 24), ('D-10', 'AVAILABLE', 'STANDARD', '3', 24),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 24), ('E-02', 'OCCUPIED', 'VIP', '4', 24), ('E-03', 'AVAILABLE', 'STANDARD', '4', 24), ('E-04', 'AVAILABLE', 'ELECTRIC', '4', 24), ('E-05', 'AVAILABLE', 'STANDARD', '4', 24),
                                                                                         ('E-06', 'AVAILABLE', 'HANDICAPPED', '4', 24), ('E-07', 'MAINTENANCE', 'STANDARD', '4', 24), ('E-08', 'AVAILABLE', 'STANDARD', '4', 24), ('E-09', 'RESERVED', 'STANDARD', '4', 24), ('E-10', 'AVAILABLE', 'STANDARD', '4', 24);

-- Parking Targa (id=25)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 25), ('A-02', 'AVAILABLE', 'STANDARD', 'RDC', 25), ('A-03', 'OCCUPIED', 'HANDICAPPED', 'RDC', 25), ('A-04', 'AVAILABLE', 'STANDARD', 'RDC', 25), ('A-05', 'AVAILABLE', 'VIP', 'RDC', 25),
                                                                                         ('A-06', 'AVAILABLE', 'ELECTRIC', 'RDC', 25), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 25), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 25), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 25), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 25),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 25), ('B-02', 'AVAILABLE', 'VIP', '1', 25), ('B-03', 'OCCUPIED', 'STANDARD', '1', 25), ('B-04', 'AVAILABLE', 'ELECTRIC', '1', 25), ('B-05', 'AVAILABLE', 'STANDARD', '1', 25),
                                                                                         ('B-06', 'AVAILABLE', 'HANDICAPPED', '1', 25), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 25), ('B-08', 'AVAILABLE', 'STANDARD', '1', 25), ('B-09', 'RESERVED', 'STANDARD', '1', 25), ('B-10', 'AVAILABLE', 'STANDARD', '1', 25),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 25), ('C-02', 'AVAILABLE', 'STANDARD', '2', 25), ('C-03', 'OCCUPIED', 'VIP', '2', 25), ('C-04', 'AVAILABLE', 'STANDARD', '2', 25), ('C-05', 'AVAILABLE', 'ELECTRIC', '2', 25),
                                                                                         ('C-06', 'RESERVED', 'HANDICAPPED', '2', 25), ('C-07', 'AVAILABLE', 'STANDARD', '2', 25), ('C-08', 'AVAILABLE', 'STANDARD', '2', 25), ('C-09', 'OCCUPIED', 'STANDARD', '2', 25), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 25),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 25), ('D-02', 'AVAILABLE', 'VIP', '3', 25), ('D-03', 'AVAILABLE', 'STANDARD', '3', 25), ('D-04', 'OCCUPIED', 'ELECTRIC', '3', 25), ('D-05', 'AVAILABLE', 'STANDARD', '3', 25),
                                                                                         ('D-06', 'AVAILABLE', 'HANDICAPPED', '3', 25), ('D-07', 'RESERVED', 'STANDARD', '3', 25), ('D-08', 'AVAILABLE', 'STANDARD', '3', 25), ('D-09', 'AVAILABLE', 'STANDARD', '3', 25), ('D-10', 'OCCUPIED', 'STANDARD', '3', 25),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 25), ('E-02', 'AVAILABLE', 'ELECTRIC', '4', 25), ('E-03', 'AVAILABLE', 'VIP', '4', 25), ('E-04', 'OCCUPIED', 'STANDARD', '4', 25), ('E-05', 'AVAILABLE', 'STANDARD', '4', 25),
                                                                                         ('E-06', 'AVAILABLE', 'HANDICAPPED', '4', 25), ('E-07', 'MAINTENANCE', 'STANDARD', '4', 25), ('E-08', 'AVAILABLE', 'STANDARD', '4', 25), ('E-09', 'RESERVED', 'STANDARD', '4', 25), ('E-10', 'AVAILABLE', 'STANDARD', '4', 25);

-- Parking Sidi Ghanem (id=26)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 26), ('A-02', 'OCCUPIED', 'STANDARD', 'RDC', 26), ('A-03', 'AVAILABLE', 'VIP', 'RDC', 26), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 26), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 26),
                                                                                         ('A-06', 'AVAILABLE', 'ELECTRIC', 'RDC', 26), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 26), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 26), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 26), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 26),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 26), ('B-02', 'AVAILABLE', 'VIP', '1', 26), ('B-03', 'AVAILABLE', 'STANDARD', '1', 26), ('B-04', 'OCCUPIED', 'ELECTRIC', '1', 26), ('B-05', 'AVAILABLE', 'STANDARD', '1', 26),
                                                                                         ('B-06', 'AVAILABLE', 'HANDICAPPED', '1', 26), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 26), ('B-08', 'AVAILABLE', 'STANDARD', '1', 26), ('B-09', 'RESERVED', 'STANDARD', '1', 26), ('B-10', 'AVAILABLE', 'STANDARD', '1', 26),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 26), ('C-02', 'AVAILABLE', 'STANDARD', '2', 26), ('C-03', 'OCCUPIED', 'VIP', '2', 26), ('C-04', 'AVAILABLE', 'STANDARD', '2', 26), ('C-05', 'AVAILABLE', 'ELECTRIC', '2', 26),
                                                                                         ('C-06', 'RESERVED', 'STANDARD', '2', 26), ('C-07', 'AVAILABLE', 'HANDICAPPED', '2', 26), ('C-08', 'AVAILABLE', 'STANDARD', '2', 26), ('C-09', 'OCCUPIED', 'STANDARD', '2', 26), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 26),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 26), ('D-02', 'AVAILABLE', 'VIP', '3', 26), ('D-03', 'AVAILABLE', 'STANDARD', '3', 26), ('D-04', 'OCCUPIED', 'STANDARD', '3', 26), ('D-05', 'AVAILABLE', 'ELECTRIC', '3', 26),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 26), ('D-07', 'AVAILABLE', 'HANDICAPPED', '3', 26), ('D-08', 'RESERVED', 'STANDARD', '3', 26), ('D-09', 'AVAILABLE', 'STANDARD', '3', 26), ('D-10', 'OCCUPIED', 'STANDARD', '3', 26),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 26), ('E-02', 'MAINTENANCE', 'STANDARD', '4', 26), ('E-03', 'AVAILABLE', 'VIP', '4', 26), ('E-04', 'AVAILABLE', 'ELECTRIC', '4', 26), ('E-05', 'OCCUPIED', 'STANDARD', '4', 26),
                                                                                         ('E-06', 'AVAILABLE', 'STANDARD', '4', 26), ('E-07', 'AVAILABLE', 'HANDICAPPED', '4', 26), ('E-08', 'RESERVED', 'STANDARD', '4', 26), ('E-09', 'AVAILABLE', 'STANDARD', '4', 26), ('E-10', 'AVAILABLE', 'STANDARD', '4', 26);

-- Parking Marjane Ménara (id=27)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 27), ('A-02', 'AVAILABLE', 'VIP', 'RDC', 27), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 27), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 27), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 27),
                                                                                         ('A-06', 'RESERVED', 'ELECTRIC', 'RDC', 27), ('A-07', 'AVAILABLE', 'STANDARD', 'RDC', 27), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 27), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 27), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 27),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 27), ('B-02', 'AVAILABLE', 'STANDARD', '1', 27), ('B-03', 'AVAILABLE', 'VIP', '1', 27), ('B-04', 'OCCUPIED', 'ELECTRIC', '1', 27), ('B-05', 'AVAILABLE', 'STANDARD', '1', 27),
                                                                                         ('B-06', 'AVAILABLE', 'HANDICAPPED', '1', 27), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 27), ('B-08', 'AVAILABLE', 'STANDARD', '1', 27), ('B-09', 'RESERVED', 'STANDARD', '1', 27), ('B-10', 'AVAILABLE', 'STANDARD', '1', 27),
                                                                                         ('C-01', 'OCCUPIED', 'STANDARD', '2', 27), ('C-02', 'AVAILABLE', 'STANDARD', '2', 27), ('C-03', 'AVAILABLE', 'VIP', '2', 27), ('C-04', 'AVAILABLE', 'STANDARD', '2', 27), ('C-05', 'AVAILABLE', 'ELECTRIC', '2', 27),
                                                                                         ('C-06', 'AVAILABLE', 'HANDICAPPED', '2', 27), ('C-07', 'RESERVED', 'STANDARD', '2', 27), ('C-08', 'OCCUPIED', 'STANDARD', '2', 27), ('C-09', 'AVAILABLE', 'STANDARD', '2', 27), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 27),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 27), ('D-02', 'AVAILABLE', 'VIP', '3', 27), ('D-03', 'AVAILABLE', 'STANDARD', '3', 27), ('D-04', 'OCCUPIED', 'ELECTRIC', '3', 27), ('D-05', 'AVAILABLE', 'STANDARD', '3', 27),
                                                                                         ('D-06', 'AVAILABLE', 'STANDARD', '3', 27), ('D-07', 'RESERVED', 'HANDICAPPED', '3', 27), ('D-08', 'AVAILABLE', 'STANDARD', '3', 27), ('D-09', 'AVAILABLE', 'STANDARD', '3', 27), ('D-10', 'OCCUPIED', 'STANDARD', '3', 27),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 27), ('E-02', 'AVAILABLE', 'ELECTRIC', '4', 27), ('E-03', 'AVAILABLE', 'VIP', '4', 27), ('E-04', 'OCCUPIED', 'STANDARD', '4', 27), ('E-05', 'AVAILABLE', 'STANDARD', '4', 27),
                                                                                         ('E-06', 'MAINTENANCE', 'HANDICAPPED', '4', 27), ('E-07', 'AVAILABLE', 'STANDARD', '4', 27), ('E-08', 'RESERVED', 'STANDARD', '4', 27), ('E-09', 'AVAILABLE', 'STANDARD', '4', 27), ('E-10', 'AVAILABLE', 'STANDARD', '4', 27);

-- Parking Bab Ighli (id=28)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 28), ('A-02', 'OCCUPIED', 'VIP', 'RDC', 28), ('A-03', 'AVAILABLE', 'STANDARD', 'RDC', 28), ('A-04', 'AVAILABLE', 'HANDICAPPED', 'RDC', 28), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 28),
                                                                                         ('A-06', 'AVAILABLE', 'ELECTRIC', 'RDC', 28), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 28), ('A-08', 'OCCUPIED', 'STANDARD', 'RDC', 28), ('A-09', 'AVAILABLE', 'STANDARD', 'RDC', 28), ('A-10', 'AVAILABLE', 'VIP', 'RDC', 28),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 28), ('B-02', 'AVAILABLE', 'STANDARD', '1', 28), ('B-03', 'OCCUPIED', 'ELECTRIC', '1', 28), ('B-04', 'AVAILABLE', 'STANDARD', '1', 28), ('B-05', 'AVAILABLE', 'HANDICAPPED', '1', 28),
                                                                                         ('B-06', 'AVAILABLE', 'VIP', '1', 28), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 28), ('B-08', 'RESERVED', 'STANDARD', '1', 28), ('B-09', 'AVAILABLE', 'STANDARD', '1', 28), ('B-10', 'AVAILABLE', 'STANDARD', '1', 28),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 28), ('C-02', 'OCCUPIED', 'STANDARD', '2', 28), ('C-03', 'AVAILABLE', 'VIP', '2', 28), ('C-04', 'AVAILABLE', 'STANDARD', '2', 28), ('C-05', 'AVAILABLE', 'ELECTRIC', '2', 28),
                                                                                         ('C-06', 'AVAILABLE', 'HANDICAPPED', '2', 28), ('C-07', 'RESERVED', 'STANDARD', '2', 28), ('C-08', 'AVAILABLE', 'STANDARD', '2', 28), ('C-09', 'OCCUPIED', 'STANDARD', '2', 28), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 28),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 28), ('D-02', 'AVAILABLE', 'VIP', '3', 28), ('D-03', 'OCCUPIED', 'STANDARD', '3', 28), ('D-04', 'AVAILABLE', 'ELECTRIC', '3', 28), ('D-05', 'AVAILABLE', 'STANDARD', '3', 28),
                                                                                         ('D-06', 'AVAILABLE', 'HANDICAPPED', '3', 28), ('D-07', 'AVAILABLE', 'STANDARD', '3', 28), ('D-08', 'RESERVED', 'STANDARD', '3', 28), ('D-09', 'AVAILABLE', 'STANDARD', '3', 28), ('D-10', 'OCCUPIED', 'STANDARD', '3', 28),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 28), ('E-02', 'AVAILABLE', 'ELECTRIC', '4', 28), ('E-03', 'MAINTENANCE', 'VIP', '4', 28), ('E-04', 'AVAILABLE', 'STANDARD', '4', 28), ('E-05', 'OCCUPIED', 'STANDARD', '4', 28),
                                                                                         ('E-06', 'AVAILABLE', 'HANDICAPPED', '4', 28), ('E-07', 'RESERVED', 'STANDARD', '4', 28), ('E-08', 'AVAILABLE', 'STANDARD', '4', 28), ('E-09', 'AVAILABLE', 'STANDARD', '4', 28), ('E-10', 'AVAILABLE', 'VIP', '4', 28);

-- Parking Daoudiate (id=29)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 29), ('A-02', 'AVAILABLE', 'HANDICAPPED', 'RDC', 29), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 29), ('A-04', 'AVAILABLE', 'VIP', 'RDC', 29), ('A-05', 'AVAILABLE', 'STANDARD', 'RDC', 29),
                                                                                         ('A-06', 'RESERVED', 'ELECTRIC', 'RDC', 29), ('A-07', 'AVAILABLE', 'STANDARD', 'RDC', 29), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 29), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 29), ('A-10', 'AVAILABLE', 'VIP', 'RDC', 29),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 29), ('B-02', 'AVAILABLE', 'ELECTRIC', '1', 29), ('B-03', 'OCCUPIED', 'STANDARD', '1', 29), ('B-04', 'AVAILABLE', 'STANDARD', '1', 29), ('B-05', 'AVAILABLE', 'HANDICAPPED', '1', 29),
                                                                                         ('B-06', 'AVAILABLE', 'VIP', '1', 29), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 29), ('B-08', 'AVAILABLE', 'STANDARD', '1', 29), ('B-09', 'RESERVED', 'STANDARD', '1', 29), ('B-10', 'AVAILABLE', 'STANDARD', '1', 29),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 29), ('C-02', 'OCCUPIED', 'STANDARD', '2', 29), ('C-03', 'AVAILABLE', 'VIP', '2', 29), ('C-04', 'AVAILABLE', 'ELECTRIC', '2', 29), ('C-05', 'AVAILABLE', 'STANDARD', '2', 29),
                                                                                         ('C-06', 'AVAILABLE', 'HANDICAPPED', '2', 29), ('C-07', 'RESERVED', 'STANDARD', '2', 29), ('C-08', 'AVAILABLE', 'STANDARD', '2', 29), ('C-09', 'MAINTENANCE', 'STANDARD', '2', 29), ('C-10', 'OCCUPIED', 'STANDARD', '2', 29),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 29), ('D-02', 'AVAILABLE', 'VIP', '3', 29), ('D-03', 'AVAILABLE', 'STANDARD', '3', 29), ('D-04', 'OCCUPIED', 'ELECTRIC', '3', 29), ('D-05', 'AVAILABLE', 'STANDARD', '3', 29),
                                                                                         ('D-06', 'AVAILABLE', 'HANDICAPPED', '3', 29), ('D-07', 'RESERVED', 'STANDARD', '3', 29), ('D-08', 'AVAILABLE', 'STANDARD', '3', 29), ('D-09', 'AVAILABLE', 'STANDARD', '3', 29), ('D-10', 'OCCUPIED', 'VIP', '3', 29),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 29), ('E-02', 'AVAILABLE', 'ELECTRIC', '4', 29), ('E-03', 'MAINTENANCE', 'STANDARD', '4', 29), ('E-04', 'AVAILABLE', 'VIP', '4', 29), ('E-05', 'OCCUPIED', 'STANDARD', '4', 29),
                                                                                         ('E-06', 'AVAILABLE', 'HANDICAPPED', '4', 29), ('E-07', 'AVAILABLE', 'STANDARD', '4', 29), ('E-08', 'RESERVED', 'STANDARD', '4', 29), ('E-09', 'AVAILABLE', 'STANDARD', '4', 29), ('E-10', 'AVAILABLE', 'STANDARD', '4', 29);

-- Parking Massira (id=30)
INSERT IGNORE INTO parking_slots (slot_number, status, slot_type, floor, parking_id) VALUES
                                                                                         ('A-01', 'AVAILABLE', 'STANDARD', 'RDC', 30), ('A-02', 'AVAILABLE', 'VIP', 'RDC', 30), ('A-03', 'OCCUPIED', 'STANDARD', 'RDC', 30), ('A-04', 'AVAILABLE', 'STANDARD', 'RDC', 30), ('A-05', 'AVAILABLE', 'HANDICAPPED', 'RDC', 30),
                                                                                         ('A-06', 'AVAILABLE', 'ELECTRIC', 'RDC', 30), ('A-07', 'RESERVED', 'STANDARD', 'RDC', 30), ('A-08', 'AVAILABLE', 'STANDARD', 'RDC', 30), ('A-09', 'OCCUPIED', 'STANDARD', 'RDC', 30), ('A-10', 'AVAILABLE', 'STANDARD', 'RDC', 30),
                                                                                         ('B-01', 'AVAILABLE', 'STANDARD', '1', 30), ('B-02', 'AVAILABLE', 'STANDARD', '1', 30), ('B-03', 'AVAILABLE', 'VIP', '1', 30), ('B-04', 'OCCUPIED', 'ELECTRIC', '1', 30), ('B-05', 'AVAILABLE', 'STANDARD', '1', 30),
                                                                                         ('B-06', 'AVAILABLE', 'HANDICAPPED', '1', 30), ('B-07', 'MAINTENANCE', 'STANDARD', '1', 30), ('B-08', 'AVAILABLE', 'STANDARD', '1', 30), ('B-09', 'RESERVED', 'STANDARD', '1', 30), ('B-10', 'AVAILABLE', 'STANDARD', '1', 30),
                                                                                         ('C-01', 'AVAILABLE', 'STANDARD', '2', 30), ('C-02', 'OCCUPIED', 'STANDARD', '2', 30), ('C-03', 'AVAILABLE', 'VIP', '2', 30), ('C-04', 'AVAILABLE', 'STANDARD', '2', 30), ('C-05', 'AVAILABLE', 'ELECTRIC', '2', 30),
                                                                                         ('C-06', 'RESERVED', 'HANDICAPPED', '2', 30), ('C-07', 'AVAILABLE', 'STANDARD', '2', 30), ('C-08', 'AVAILABLE', 'STANDARD', '2', 30), ('C-09', 'OCCUPIED', 'STANDARD', '2', 30), ('C-10', 'MAINTENANCE', 'STANDARD', '2', 30),
                                                                                         ('D-01', 'AVAILABLE', 'STANDARD', '3', 30), ('D-02', 'AVAILABLE', 'ELECTRIC', '3', 30), ('D-03', 'AVAILABLE', 'VIP', '3', 30), ('D-04', 'OCCUPIED', 'STANDARD', '3', 30), ('D-05', 'AVAILABLE', 'STANDARD', '3', 30),
                                                                                         ('D-06', 'AVAILABLE', 'HANDICAPPED', '3', 30), ('D-07', 'RESERVED', 'STANDARD', '3', 30), ('D-08', 'AVAILABLE', 'STANDARD', '3', 30), ('D-09', 'AVAILABLE', 'STANDARD', '3', 30), ('D-10', 'OCCUPIED', 'VIP', '3', 30),
                                                                                         ('E-01', 'AVAILABLE', 'STANDARD', '4', 30), ('E-02', 'AVAILABLE', 'STANDARD', '4', 30), ('E-03', 'MAINTENANCE', 'ELECTRIC', '4', 30), ('E-04', 'AVAILABLE', 'VIP', '4', 30), ('E-05', 'OCCUPIED', 'STANDARD', '4', 30),
                                                                                         ('E-06', 'AVAILABLE', 'HANDICAPPED', '4', 30), ('E-07', 'AVAILABLE', 'STANDARD', '4', 30), ('E-08', 'RESERVED', 'STANDARD', '4', 30), ('E-09', 'AVAILABLE', 'STANDARD', '4', 30), ('E-10', 'AVAILABLE', 'STANDARD', '4', 30);

-- =====================================================
-- Guard ↔ customer chats (opened when user books at a guarded parking)
-- =====================================================
CREATE TABLE IF NOT EXISTS guard_chats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    guard_user_id BIGINT NOT NULL,
    parking_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE KEY uk_guard_chat_customer_guard_parking (customer_id, guard_user_id, parking_id),
    CONSTRAINT fk_gc_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_gc_guard FOREIGN KEY (guard_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_gc_parking FOREIGN KEY (parking_id) REFERENCES parkings (id) ON DELETE CASCADE,
    INDEX idx_gc_customer (customer_id),
    INDEX idx_gc_guard (guard_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS guard_chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    sender_id BIGINT NULL,
    body VARCHAR(4000) NOT NULL,
    system_message BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_gcm_chat FOREIGN KEY (chat_id) REFERENCES guard_chats (id) ON DELETE CASCADE,
    CONSTRAINT fk_gcm_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_gcm_chat (chat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

