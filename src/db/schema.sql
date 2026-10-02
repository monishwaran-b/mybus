-- ============================================================================
-- MyBus - Smart College Bus Tracking & Fleet Management Database Schema
-- SQL Relational Tables, Constraints, and Indices for Tamil Nadu College Bus Fleet
-- ============================================================================

-- 0. User Authentication & Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,          -- BCrypt hash (NEVER plaintext)
    role VARCHAR(50) NOT NULL,                    -- 'ROLE_SUPER_ADMIN', 'ROLE_COLLEGE_ADMIN', 'ROLE_DRIVER', 'ROLE_STUDENT'
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(30),
    linked_student_id VARCHAR(50),               -- FK to students.student_id
    linked_driver_id VARCHAR(50),                -- FK to drivers.driver_id
    assigned_bus_number VARCHAR(30),
    assigned_route_number VARCHAR(30),
    account_status VARCHAR(30) DEFAULT 'ACTIVE',  -- 'ACTIVE', 'SUSPENDED', 'LOCKED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Login Activity Audit Log
CREATE TABLE IF NOT EXISTS login_activity (
    activity_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    login_status VARCHAR(30) NOT NULL,           -- 'SUCCESS', 'FAILED'
    ip_address VARCHAR(50),
    user_agent TEXT,
    failure_reason VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(50) PRIMARY KEY,
    route_number VARCHAR(20) NOT NULL UNIQUE,     -- e.g., 'RT-01', 'RT-02'
    name VARCHAR(150) NOT NULL,
    description TEXT,
    starting_point VARCHAR(100) NOT NULL,        -- e.g., 'Chennai Central'
    destination VARCHAR(100) NOT NULL,           -- e.g., 'College Main Campus'
    assigned_bus VARCHAR(50),                     -- e.g., 'BUS-01'
    estimated_travel_time VARCHAR(50),            -- e.g., '45 mins'
    route_status VARCHAR(30) DEFAULT 'ON_SCHEDULE', -- 'ON_SCHEDULE', 'DELAYED', 'CONGESTED', 'ACTIVE'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(30) NOT NULL UNIQUE,       -- e.g., 'DRV-01', 'DRV-02'
    name VARCHAR(100) NOT NULL,                  -- e.g., 'P. Muthuvelan'
    phone VARCHAR(30) NOT NULL,                  -- e.g., '+91 94441 22334'
    license_number VARCHAR(50) NOT NULL UNIQUE,  -- e.g., 'TN-07-20150008921'
    license_validity DATE,
    assigned_bus_id VARCHAR(50),
    assigned_bus_number VARCHAR(30),             -- e.g., 'BUS-01'
    assigned_route_number VARCHAR(30),           -- e.g., 'RT-01'
    status VARCHAR(30) DEFAULT 'ACTIVE',          -- 'ACTIVE', 'ON_DUTY', 'ON_LEAVE', 'OFF_DUTY'
    current_trip_status VARCHAR(30) DEFAULT 'NOT_STARTED', -- 'NOT_STARTED', 'ACTIVE', 'DELAYED', 'STOPPED', 'COMPLETED'
    rating DECIMAL(2,1) DEFAULT 4.8,
    experience_years INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buses (
    id VARCHAR(50) PRIMARY KEY,
    bus_number VARCHAR(30) NOT NULL UNIQUE,      -- e.g., 'BUS-01', 'BUS-02', 'BUS-03', 'BUS-04', 'BUS-05'
    route_number VARCHAR(30) NOT NULL,           -- e.g., 'RT-01'
    registration_number VARCHAR(30) NOT NULL,    -- e.g., 'TN-22-CY-7501'
    type VARCHAR(50) NOT NULL,                   -- e.g., '55-Seater AC Coach'
    capacity INT NOT NULL DEFAULT 55,            -- Bus Capacity (e.g. 55)
    driver_id VARCHAR(50),                       -- FK to drivers.id
    driver_name VARCHAR(100),
    driver_phone VARCHAR(30),
    route_id VARCHAR(50),                        -- FK to routes.id
    route_name VARCHAR(150),
    current_status VARCHAR(30) DEFAULT 'ACTIVE', -- 'ACTIVE', 'DELAYED', 'STOPPED', 'COMPLETED'
    latitude DECIMAL(10, 6) NOT NULL,            -- GPS Latitude
    longitude DECIMAL(10, 6) NOT NULL,           -- GPS Longitude
    speed_kmh DECIMAL(5, 1) DEFAULT 0.0,
    heading INT DEFAULT 0,
    last_gps_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    current_stop_index INT DEFAULT 0,
    next_stop_name VARCHAR(100),
    next_stop_distance_meters INT DEFAULT 0,
    eta_minutes INT DEFAULT 0,
    route_status VARCHAR(30) DEFAULT 'ON_SCHEDULE',
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS boarding_points (
    id VARCHAR(50) PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,                  -- e.g., 'Tambaram Sanatorium'
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    radius_meters INT DEFAULT 100,
    stop_order INT NOT NULL,
    scheduled_time VARCHAR(20),                  -- e.g., '07:30 AM'
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(30) NOT NULL UNIQUE,      -- e.g., 'STD-2024-001'
    name VARCHAR(100) NOT NULL,                  -- e.g., 'K. Vigneshwaran'
    register_number VARCHAR(30) NOT NULL UNIQUE, -- e.g., '310621104042'
    department VARCHAR(100) NOT NULL,            -- e.g., 'Computer Science & Engineering'
    year VARCHAR(20) NOT NULL,                   -- e.g., 'IV Year'
    section VARCHAR(20) NOT NULL,                -- e.g., 'CSE-A'
    email VARCHAR(120),
    phone VARCHAR(30) NOT NULL,                  -- e.g., '+91 98401 23456'
    assigned_bus_id VARCHAR(50) NOT NULL,        -- FK to buses.id
    bus_number VARCHAR(30) NOT NULL,             -- e.g., 'BUS-01'
    route_id VARCHAR(50) NOT NULL,               -- FK to routes.id
    route_number VARCHAR(30) NOT NULL,           -- e.g., 'RT-01'
    route_name VARCHAR(150),
    boarding_point_id VARCHAR(50) NOT NULL,      -- FK to boarding_points.id
    boarding_point_name VARCHAR(100) NOT NULL,   -- e.g., 'Tambaram Sanatorium'
    drop_point VARCHAR(100) DEFAULT 'College Main Campus Terminal',
    driver_id VARCHAR(50),                       -- FK to drivers.id
    driver_name VARCHAR(100),
    driver_phone VARCHAR(30),
    bus_capacity INT DEFAULT 55,
    attendance_status VARCHAR(20) DEFAULT 'PRESENT', -- 'PRESENT', 'ABSENT', 'NOT_MARKED'
    trip_date DATE,                              -- Today's date
    trip_time VARCHAR(20) DEFAULT '07:15 AM',
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_bus_id) REFERENCES buses(id) ON DELETE RESTRICT,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT,
    FOREIGN KEY (boarding_point_id) REFERENCES boarding_points(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(30) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    register_number VARCHAR(30) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(20) NOT NULL,
    section VARCHAR(20),
    bus_number VARCHAR(30) NOT NULL,             -- 'BUS-01', 'BUS-02', etc.
    route_number VARCHAR(30) NOT NULL,           -- 'RT-01', 'RT-02', etc.
    boarding_point VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,                 -- 'PRESENT', 'ABSENT', 'NOT_MARKED'
    trip_date DATE NOT NULL,
    trip_time VARCHAR(20) NOT NULL,
    trip_type VARCHAR(30) NOT NULL,              -- 'MORNING_PICKUP', 'EVENING_DROP'
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marked_by VARCHAR(50) DEFAULT 'DRIVER',      -- 'DRIVER', 'ADMIN', 'RFID_TAP'
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(50) PRIMARY KEY,
    trip_date DATE NOT NULL,
    trip_time VARCHAR(20) NOT NULL,
    trip_type VARCHAR(30) NOT NULL,
    bus_number VARCHAR(30) NOT NULL,
    route_number VARCHAR(30) NOT NULL,
    driver_id VARCHAR(50) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(30) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',         -- 'NOT_STARTED', 'ACTIVE', 'DELAYED', 'STOPPED', 'COMPLETED'
    total_students INT DEFAULT 0,
    present_count INT DEFAULT 0,
    absent_count INT DEFAULT 0,
    start_time TIMESTAMP,
    end_time TIMESTAMP
);

-- Indices for rapid querying and filtering
CREATE INDEX idx_students_reg ON students(register_number);
CREATE INDEX idx_students_bus ON students(bus_number);
CREATE INDEX idx_students_dept ON students(department);
CREATE INDEX idx_attendance_date_bus ON attendance(trip_date, bus_number);
CREATE INDEX idx_buses_status ON buses(current_status);
