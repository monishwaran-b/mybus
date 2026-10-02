import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Bus, Route, BoardingPoint, Student, Driver, Parent, User, BusStatus } from '../types/index.ts';

// Ensure data folder exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'mybus.db');
export const db = new DatabaseSync(dbPath);

// Enable Foreign Key constraints and WAL mode for optimal concurrent reads
db.exec('PRAGMA foreign_keys = ON;');

// Password hashing utilities using standard PBKDF2
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return check === hash;
}

// Initialize Relational Schema
export function initSchema() {
  db.exec(`
    -- 1. Users table (Authentication & Role Based Access Control)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL, -- ROLE_ADMIN, ROLE_STUDENT, ROLE_PARENT, ROLE_DRIVER
      phone TEXT,
      entity_id TEXT, -- studentId, parentId, driverId
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Drivers
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      driver_id TEXT UNIQUE NOT NULL, -- e.g. DRV-01
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      license_number TEXT UNIQUE NOT NULL,
      assigned_bus_id TEXT,
      assigned_bus_number TEXT,
      assigned_route_number TEXT,
      status TEXT DEFAULT 'ACTIVE',
      rating REAL DEFAULT 4.9,
      experience_years INTEGER DEFAULT 10,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Routes
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      route_number TEXT UNIQUE NOT NULL, -- e.g. RT-01
      name TEXT NOT NULL,
      description TEXT,
      starting_point TEXT NOT NULL,
      destination TEXT NOT NULL DEFAULT 'College Main Campus',
      college_lat REAL DEFAULT 12.8715,
      college_lng REAL DEFAULT 80.0825,
      college_radius_meters INTEGER DEFAULT 200,
      assigned_bus TEXT,
      estimated_travel_time TEXT DEFAULT '45 mins',
      total_distance_km REAL DEFAULT 24.5,
      route_status TEXT DEFAULT 'ON_SCHEDULE',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Boarding Points (Route Stops)
    CREATE TABLE IF NOT EXISTS boarding_points (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius_meters INTEGER DEFAULT 100,
      stop_order INTEGER NOT NULL,
      scheduled_time TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    -- 5. Route Waypoints (Road coordinates for map polyline and realistic demo mode)
    CREATE TABLE IF NOT EXISTS route_waypoints (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      point_order INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    -- 6. Buses
    CREATE TABLE IF NOT EXISTS buses (
      id TEXT PRIMARY KEY,
      bus_number TEXT UNIQUE NOT NULL, -- e.g. BUS-01
      route_number TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      type TEXT DEFAULT '55-Seater Standard Coach',
      capacity INTEGER DEFAULT 55,
      driver_id TEXT,
      driver_name TEXT,
      driver_phone TEXT,
      route_id TEXT,
      route_name TEXT,
      current_status TEXT DEFAULT 'NOT_STARTED', -- NOT_STARTED, ON_TRIP, MOVING, STOPPED, APPROACHING_STOP, ARRIVED_AT_STOP, ARRIVED_AT_COLLEGE, COMPLETED, OFFLINE
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed_kmh REAL DEFAULT 0.0,
      heading INTEGER DEFAULT 0,
      last_gps_update TEXT DEFAULT CURRENT_TIMESTAMP,
      current_trip_id TEXT,
      next_stop_name TEXT,
      next_stop_distance_meters INTEGER DEFAULT 0,
      eta_minutes INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL
    );

    -- 7. Parents
    CREATE TABLE IF NOT EXISTS parents (
      id TEXT PRIMARY KEY,
      parent_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      linked_student_id TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. Students
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_id TEXT UNIQUE NOT NULL, -- e.g. STD-001
      name TEXT NOT NULL,
      register_number TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      section TEXT DEFAULT 'A',
      email TEXT,
      phone TEXT NOT NULL,
      assigned_bus_id TEXT NOT NULL,
      bus_number TEXT NOT NULL,
      route_id TEXT NOT NULL,
      route_number TEXT NOT NULL,
      boarding_point_id TEXT NOT NULL,
      boarding_point_name TEXT NOT NULL,
      drop_point TEXT DEFAULT 'College Main Campus Terminal',
      linked_parent_id TEXT,
      attendance_status TEXT DEFAULT 'PRESENT', -- PRESENT, ABSENT, NOT_MARKED
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_bus_id) REFERENCES buses(id) ON DELETE RESTRICT,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT,
      FOREIGN KEY (boarding_point_id) REFERENCES boarding_points(id) ON DELETE RESTRICT,
      FOREIGN KEY (linked_parent_id) REFERENCES parents(id) ON DELETE SET NULL
    );

    -- 9. Trips
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      bus_id TEXT NOT NULL,
      bus_number TEXT NOT NULL,
      route_id TEXT NOT NULL,
      route_number TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      trip_date TEXT NOT NULL,
      trip_time TEXT NOT NULL,
      trip_type TEXT DEFAULT 'MORNING_PICKUP',
      status TEXT DEFAULT 'ON_TRIP', -- NOT_STARTED, ON_TRIP, MOVING, ARRIVING, ARRIVED_AT_COLLEGE, COMPLETED
      start_time TEXT,
      end_time TEXT,
      total_students INTEGER DEFAULT 0,
      present_count INTEGER DEFAULT 0,
      absent_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
    );

    -- 10. Bus Location Tracking History
    CREATE TABLE IF NOT EXISTS bus_locations (
      id TEXT PRIMARY KEY,
      bus_id TEXT NOT NULL,
      trip_id TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL DEFAULT 10.0,
      speed_kmh REAL DEFAULT 0.0,
      heading INTEGER DEFAULT 0,
      status TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
    );

    -- 11. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT, -- specific student/parent/driver ID or 'ALL'
      user_role TEXT DEFAULT 'ALL',
      type TEXT NOT NULL, -- TRIP_STARTED, BUS_APPROACHING, BUS_ARRIVED_STOP, BUS_ARRIVED_COLLEGE, TRIP_COMPLETED, LOCATION_DELAYED, EMERGENCY
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      bus_id TEXT,
      bus_number TEXT,
      priority TEXT DEFAULT 'MEDIUM',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. Attendance Records
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      register_number TEXT NOT NULL,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      section TEXT,
      bus_number TEXT NOT NULL,
      route_number TEXT NOT NULL,
      boarding_point TEXT NOT NULL,
      status TEXT NOT NULL, -- PRESENT, ABSENT, NOT_MARKED
      trip_date TEXT NOT NULL,
      trip_time TEXT NOT NULL,
      trip_type TEXT DEFAULT 'MORNING_PICKUP',
      marked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      marked_by TEXT DEFAULT 'DRIVER',
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    -- Create Indices for rapid querying and search
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_buses_number ON buses(bus_number);
    CREATE INDEX IF NOT EXISTS idx_students_reg ON students(register_number);
    CREATE INDEX IF NOT EXISTS idx_students_bus ON students(bus_number);
    CREATE INDEX IF NOT EXISTS idx_trips_bus ON trips(bus_id);
    CREATE INDEX IF NOT EXISTS idx_locations_bus ON bus_locations(bus_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
  `);
}

// Clean Seed Function - Runs ONLY IF database has no buses or when forced
export function seedDatabase(force = false) {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM buses').get() as { count: number };
  if (!force && countRow && countRow.count > 0) {
    return; // Already seeded
  }

  // Clear existing tables in correct dependency order
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM attendance;
    DELETE FROM bus_locations;
    DELETE FROM trips;
    DELETE FROM students;
    DELETE FROM parents;
    DELETE FROM buses;
    DELETE FROM route_waypoints;
    DELETE FROM boarding_points;
    DELETE FROM routes;
    DELETE FROM drivers;
    DELETE FROM users;
  `);

  // Default Passwords:
  // Admin: admin123
  // Driver: driver123
  // Student: student123
  // Parent: parent123
  const adminPass = hashPassword('admin123');
  const driverPass = hashPassword('driver123');
  const studentPass = hashPassword('student123');
  const parentPass = hashPassword('parent123');

  // Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, salt, name, role, phone, entity_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('usr-admin', 'admin@mybus.edu', adminPass.hash, adminPass.salt, 'Dr. Arthur Vance', 'ROLE_ADMIN', '+91 98765 43210', 'admin-1', 'ACTIVE');
  insertUser.run('usr-driver-1', 'driver.muthu@mybus.edu', driverPass.hash, driverPass.salt, 'P. Muthuvelan', 'ROLE_DRIVER', '+91 94441 22334', 'drv-1', 'ACTIVE');
  insertUser.run('usr-driver-2', 'driver.selvam@mybus.edu', driverPass.hash, driverPass.salt, 'K. Selvakumar', 'ROLE_DRIVER', '+91 94442 33445', 'drv-2', 'ACTIVE');
  insertUser.run('usr-driver-3', 'driver.thirun@mybus.edu', driverPass.hash, driverPass.salt, 'M. Thirunavukarasu', 'ROLE_DRIVER', '+91 94443 44556', 'drv-3', 'ACTIVE');
  insertUser.run('usr-student-1', 'sarah.student@mybus.edu', studentPass.hash, studentPass.salt, 'Sarah Jenkins', 'ROLE_STUDENT', '+91 98401 12345', 'stud-1', 'ACTIVE');
  insertUser.run('usr-student-2', 'adhav.s@mybus.edu', studentPass.hash, studentPass.salt, 'Adhav Sundaram', 'ROLE_STUDENT', '+91 98402 23456', 'stud-2', 'ACTIVE');
  insertUser.run('usr-student-3', 'ananya.k@mybus.edu', studentPass.hash, studentPass.salt, 'Ananya Krishnan', 'ROLE_STUDENT', '+91 98403 34567', 'stud-3', 'ACTIVE');
  insertUser.run('usr-student-4', 'karthik.r@mybus.edu', studentPass.hash, studentPass.salt, 'R. Karthikeyan', 'ROLE_STUDENT', '+91 98404 45678', 'stud-4', 'ACTIVE');
  insertUser.run('usr-student-5', 'deepika.m@mybus.edu', studentPass.hash, studentPass.salt, 'M. Deepika', 'ROLE_STUDENT', '+91 98405 56789', 'stud-5', 'ACTIVE');
  insertUser.run('usr-parent-1', 'robert.parent@mybus.edu', parentPass.hash, parentPass.salt, 'Robert Jenkins', 'ROLE_PARENT', '+91 98402 54321', 'parent-1', 'ACTIVE');
  insertUser.run('usr-parent-2', 'sundaram.p@mybus.edu', parentPass.hash, parentPass.salt, 'P. Sundaram', 'ROLE_PARENT', '+91 98403 65432', 'parent-2', 'ACTIVE');

  // Insert Parents
  const insertParent = db.prepare(`
    INSERT INTO parents (id, parent_id, name, email, phone, linked_student_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertParent.run('parent-1', 'PAR-001', 'Robert Jenkins', 'robert.parent@mybus.edu', '+91 98402 54321', 'stud-1', 'ACTIVE');
  insertParent.run('parent-2', 'PAR-002', 'P. Sundaram', 'sundaram.p@mybus.edu', '+91 98403 65432', 'stud-2', 'ACTIVE');
  insertParent.run('parent-3', 'PAR-003', 'K. Krishnan', 'krishnan.k@mybus.edu', '+91 98404 76543', 'stud-3', 'ACTIVE');

  // Insert Routes
  const insertRoute = db.prepare(`
    INSERT INTO routes (id, route_number, name, description, starting_point, destination, college_lat, college_lng, college_radius_meters, assigned_bus, estimated_travel_time, total_distance_km, route_status, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRoute.run(
    'route-1', 'RT-01', 'Tambaram Sanatorium Express',
    'Main Southern Trunk corridor via Tambaram Station, Irumbuliyur, Perungalathur to College Main Campus',
    'Tambaram Sanatorium', 'College Main Campus', 12.8715, 80.0825, 200, 'BUS-01', '45 mins', 22.5, 'ON_SCHEDULE', 1
  );

  insertRoute.run(
    'route-2', 'RT-02', 'Guindy - Chromepet Metro Line',
    'Connecting Guindy Metro, Airport, Pallavaram, and Chromepet to College Campus',
    'Guindy Metro Station', 'College Main Campus', 12.8715, 80.0825, 200, 'BUS-02', '50 mins', 26.0, 'ON_SCHEDULE', 1
  );

  insertRoute.run(
    'route-3', 'RT-03', 'Velachery - Medavakkam Corridor',
    'Eastern South corridor serving Velachery MRTS, Pallikaranai, Medavakkam to College',
    'Velachery MRTS Station', 'College Main Campus', 12.8715, 80.0825, 200, 'BUS-03', '55 mins', 28.0, 'ON_SCHEDULE', 1
  );

  insertRoute.run(
    'route-4', 'RT-04', 'OMR IT Corridor Express',
    'Navalur, Sholinganallur, Karapakkam, Thoraipakkam corridor to Campus',
    'Sholinganallur Junction', 'College Main Campus', 12.8715, 80.0825, 200, 'BUS-04', '40 mins', 21.0, 'ON_SCHEDULE', 1
  );

  insertRoute.run(
    'route-5', 'RT-05', 'Koyambedu - Central Metro Route',
    'Western corridor from Koyambedu CMBT via Porur, Guindy to College',
    'Koyambedu CMBT Terminal', 'College Main Campus', 12.8715, 80.0825, 200, 'BUS-05', '60 mins', 32.0, 'ON_SCHEDULE', 1
  );

  // Insert Boarding Points (Route Stops)
  const insertBp = db.prepare(`
    INSERT INTO boarding_points (id, route_id, name, latitude, longitude, radius_meters, stop_order, scheduled_time, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Route 1 Stops
  insertBp.run('bp-101', 'route-1', 'Tambaram Sanatorium', 12.9279, 80.1218, 120, 1, '07:15 AM', 1);
  insertBp.run('bp-102', 'route-1', 'Tambaram Railway Station West', 12.9250, 80.1170, 100, 2, '07:25 AM', 1);
  insertBp.run('bp-103', 'route-1', 'Irumbuliyur Junction', 12.9050, 80.1080, 100, 3, '07:35 AM', 1);
  insertBp.run('bp-104', 'route-1', 'Perungalathur Bus Stand', 12.8980, 80.0960, 100, 4, '07:45 AM', 1);
  insertBp.run('bp-105', 'route-1', 'Vandalur Zoo Gate', 12.8870, 80.0880, 100, 5, '07:55 AM', 1);
  insertBp.run('bp-106', 'route-1', 'College Main Campus Terminal', 12.8715, 80.0825, 200, 6, '08:05 AM', 1);

  // Route 2 Stops
  insertBp.run('bp-201', 'route-2', 'Guindy Metro Station', 13.0067, 80.2026, 120, 1, '07:00 AM', 1);
  insertBp.run('bp-202', 'route-2', 'Airport / Meenambakkam', 12.9860, 80.1760, 100, 2, '07:15 AM', 1);
  insertBp.run('bp-203', 'route-2', 'Pallavaram Bus Stand', 12.9675, 80.1491, 100, 3, '07:30 AM', 1);
  insertBp.run('bp-204', 'route-2', 'Chromepet MIT Gate', 12.9516, 80.1406, 100, 4, '07:40 AM', 1);
  insertBp.run('bp-205', 'route-2', 'Tambaram MEPZ Gate', 12.9360, 80.1290, 100, 5, '07:50 AM', 1);
  insertBp.run('bp-206', 'route-2', 'College Main Campus Terminal', 12.8715, 80.0825, 200, 6, '08:10 AM', 1);

  // Route 3 Stops
  insertBp.run('bp-301', 'route-3', 'Velachery Vijaya Nagar', 12.9759, 80.2212, 120, 1, '07:05 AM', 1);
  insertBp.run('bp-302', 'route-3', 'Pallikaranai Oil Mill', 12.9380, 80.2030, 100, 2, '07:20 AM', 1);
  insertBp.run('bp-303', 'route-3', 'Medavakkam Koot Road', 12.9180, 80.1910, 100, 3, '07:35 AM', 1);
  insertBp.run('bp-304', 'route-3', 'Sithalapakkam Junction', 12.8990, 80.1650, 100, 4, '07:50 AM', 1);
  insertBp.run('bp-305', 'route-3', 'Mambakkam Road Junction', 12.8830, 80.1180, 100, 5, '08:00 AM', 1);
  insertBp.run('bp-306', 'route-3', 'College Main Campus Terminal', 12.8715, 80.0825, 200, 6, '08:15 AM', 1);

  // Route 4 Stops
  insertBp.run('bp-401', 'route-4', 'Sholinganallur Junction', 12.9010, 80.2279, 120, 1, '07:15 AM', 1);
  insertBp.run('bp-402', 'route-4', 'Navalur Toll Plaza', 12.8470, 80.2260, 100, 2, '07:30 AM', 1);
  insertBp.run('bp-403', 'route-4', 'Kelambakkam Bus Stand', 12.7870, 80.2180, 100, 3, '07:45 AM', 1);
  insertBp.run('bp-404', 'route-4', 'College Main Campus Terminal', 12.8715, 80.0825, 200, 4, '08:05 AM', 1);

  // Route 5 Stops
  insertBp.run('bp-501', 'route-5', 'Koyambedu CMBT Terminal', 13.0694, 80.1948, 120, 1, '06:50 AM', 1);
  insertBp.run('bp-502', 'route-5', 'Porur Toll Gate', 13.0330, 80.1580, 100, 2, '07:15 AM', 1);
  insertBp.run('bp-503', 'route-5', 'Kathipara Junction', 13.0070, 80.2030, 100, 3, '07:35 AM', 1);
  insertBp.run('bp-504', 'route-5', 'College Main Campus Terminal', 12.8715, 80.0825, 200, 4, '08:15 AM', 1);

  // Insert Route Waypoints for realistic road movement & demo stepping
  const insertWp = db.prepare(`
    INSERT INTO route_waypoints (id, route_id, point_order, latitude, longitude)
    VALUES (?, ?, ?, ?, ?)
  `);

  const r1Waypoints: [number, number][] = [
    [12.9279, 80.1218],
    [12.9265, 80.1195],
    [12.9250, 80.1170],
    [12.9150, 80.1120],
    [12.9050, 80.1080],
    [12.9015, 80.1020],
    [12.8980, 80.0960],
    [12.8920, 80.0920],
    [12.8870, 80.0880],
    [12.8790, 80.0850],
    [12.8715, 80.0825],
  ];
  r1Waypoints.forEach((wp, idx) => {
    insertWp.run(`wp-1-${idx}`, 'route-1', idx, wp[0], wp[1]);
  });

  const r2Waypoints: [number, number][] = [
    [13.0067, 80.2026],
    [12.9960, 80.1890],
    [12.9860, 80.1760],
    [12.9770, 80.1620],
    [12.9675, 80.1491],
    [12.9595, 80.1450],
    [12.9516, 80.1406],
    [12.9438, 80.1348],
    [12.9360, 80.1290],
    [12.9150, 80.1120],
    [12.8980, 80.0960],
    [12.8870, 80.0880],
    [12.8715, 80.0825],
  ];
  r2Waypoints.forEach((wp, idx) => {
    insertWp.run(`wp-2-${idx}`, 'route-2', idx, wp[0], wp[1]);
  });

  // Insert Drivers
  const insertDriver = db.prepare(`
    INSERT INTO drivers (id, driver_id, name, phone, license_number, assigned_bus_id, assigned_bus_number, assigned_route_number, status, rating, experience_years)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDriver.run('drv-1', 'DRV-01', 'P. Muthuvelan', '+91 94441 22334', 'TN-07-20150008921', 'bus-1', 'BUS-01', 'RT-01', 'ACTIVE', 4.9, 14);
  insertDriver.run('drv-2', 'DRV-02', 'K. Selvakumar', '+91 94442 33445', 'TN-22-20140007812', 'bus-2', 'BUS-02', 'RT-02', 'ACTIVE', 4.8, 11);
  insertDriver.run('drv-3', 'DRV-03', 'M. Thirunavukarasu', '+91 94443 44556', 'TN-09-20160009431', 'bus-3', 'BUS-03', 'RT-03', 'ACTIVE', 4.9, 13);
  insertDriver.run('drv-4', 'DRV-04', 'S. Natarajan', '+91 94444 55667', 'TN-01-20170010542', 'bus-4', 'BUS-04', 'RT-04', 'ACTIVE', 4.7, 9);
  insertDriver.run('drv-5', 'DRV-05', 'V. Soundararajan', '+91 94445 66778', 'TN-10-20130006721', 'bus-5', 'BUS-05', 'RT-05', 'ACTIVE', 4.8, 15);

  // Insert Buses (BUS-01 to BUS-05)
  const insertBus = db.prepare(`
    INSERT INTO buses (
      id, bus_number, route_number, registration_number, type, capacity, driver_id, driver_name, driver_phone,
      route_id, route_name, current_status, latitude, longitude, speed_kmh, heading, last_gps_update,
      next_stop_name, next_stop_distance_meters, eta_minutes, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const nowIso = new Date().toISOString();

  // BUS-01 is actively on Route 1
  insertBus.run(
    'bus-1', 'BUS-01', 'RT-01', 'TN-22-CY-0101', '55-Seater Standard Coach', 55,
    'drv-1', 'P. Muthuvelan', '+91 94441 22334',
    'route-1', 'Tambaram Sanatorium Express',
    'MOVING', 12.9250, 80.1170, 36.5, 185, nowIso,
    'Tambaram Railway Station West', 450, 3, 1
  );

  // BUS-02 is approaching Pallavaram on Route 2
  insertBus.run(
    'bus-2', 'BUS-02', 'RT-02', 'TN-22-CY-0102', '55-Seater AC Coach', 55,
    'drv-2', 'K. Selvakumar', '+91 94442 33445',
    'route-2', 'Guindy - Chromepet Metro Line',
    'APPROACHING_STOP', 12.9690, 80.1510, 28.0, 210, nowIso,
    'Pallavaram Bus Stand', 280, 2, 1
  );

  // BUS-03 is stopped at Medavakkam
  insertBus.run(
    'bus-3', 'BUS-03', 'RT-03', 'TN-22-CY-0103', '50-Seater Deluxe Bus', 50,
    'drv-3', 'M. Thirunavukarasu', '+91 94443 44556',
    'route-3', 'Velachery - Medavakkam Corridor',
    'STOPPED', 12.9180, 80.1910, 0.0, 195, nowIso,
    'Sithalapakkam Junction', 1800, 8, 1
  );

  // BUS-04 has completed morning trip / reached college
  insertBus.run(
    'bus-4', 'BUS-04', 'RT-04', 'TN-22-CY-0104', '45-Seater Coach', 45,
    'drv-4', 'S. Natarajan', '+91 94444 55667',
    'route-4', 'OMR IT Corridor Express',
    'ARRIVED_AT_COLLEGE', 12.8715, 80.0825, 0.0, 0, nowIso,
    'College Main Campus Terminal', 0, 0, 1
  );

  // BUS-05 has not started yet
  insertBus.run(
    'bus-5', 'BUS-05', 'RT-05', 'TN-22-CY-0105', '55-Seater Standard Coach', 55,
    'drv-5', 'V. Soundararajan', '+91 94445 66778',
    'route-5', 'Koyambedu - Central Metro Route',
    'NOT_STARTED', 13.0694, 80.1948, 0.0, 0, nowIso,
    'Porur Toll Gate', 3400, 15, 1
  );

  // Insert Students
  const insertStudent = db.prepare(`
    INSERT INTO students (
      id, student_id, name, register_number, department, year, section, email, phone,
      assigned_bus_id, bus_number, route_id, route_number, boarding_point_id, boarding_point_name,
      drop_point, linked_parent_id, attendance_status, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStudent.run(
    'stud-1', 'STD-001', 'Sarah Jenkins', '310621104001', 'Computer Science & Engineering', 'IV Year', 'A',
    'sarah.student@mybus.edu', '+91 98401 12345',
    'bus-1', 'BUS-01', 'route-1', 'RT-01', 'bp-102', 'Tambaram Railway Station West',
    'College Main Campus Terminal', 'parent-1', 'PRESENT', 'ACTIVE'
  );

  insertStudent.run(
    'stud-2', 'STD-002', 'Adhav Sundaram', '310621104002', 'Information Technology', 'III Year', 'B',
    'adhav.s@mybus.edu', '+91 98402 23456',
    'bus-1', 'BUS-01', 'route-1', 'RT-01', 'bp-101', 'Tambaram Sanatorium',
    'College Main Campus Terminal', 'parent-2', 'PRESENT', 'ACTIVE'
  );

  insertStudent.run(
    'stud-3', 'STD-003', 'Ananya Krishnan', '310621106003', 'Electronics & Communication', 'III Year', 'A',
    'ananya.k@mybus.edu', '+91 98403 34567',
    'bus-2', 'BUS-02', 'route-2', 'RT-02', 'bp-203', 'Pallavaram Bus Stand',
    'College Main Campus Terminal', 'parent-3', 'PRESENT', 'ACTIVE'
  );

  insertStudent.run(
    'stud-4', 'STD-004', 'R. Karthikeyan', '310621114004', 'Mechanical Engineering', 'II Year', 'A',
    'karthik.r@mybus.edu', '+91 98404 45678',
    'bus-2', 'BUS-02', 'route-2', 'RT-02', 'bp-204', 'Chromepet MIT Gate',
    'College Main Campus Terminal', null, 'PRESENT', 'ACTIVE'
  );

  insertStudent.run(
    'stud-5', 'STD-005', 'M. Deepika', '310621104005', 'Computer Science & Engineering', 'I Year', 'C',
    'deepika.m@mybus.edu', '+91 98405 56789',
    'bus-3', 'BUS-03', 'route-3', 'RT-03', 'bp-301', 'Velachery Vijaya Nagar',
    'College Main Campus Terminal', null, 'PRESENT', 'ACTIVE'
  );

  insertStudent.run(
    'stud-6', 'STD-006', 'V. Vignesh', '310621105006', 'Electrical & Electronics', 'IV Year', 'B',
    'vignesh.v@mybus.edu', '+91 98406 67890',
    'bus-3', 'BUS-03', 'route-3', 'RT-03', 'bp-303', 'Medavakkam Koot Road',
    'College Main Campus Terminal', null, 'ABSENT', 'ACTIVE'
  );

  insertStudent.run(
    'stud-7', 'STD-007', 'P. Sneha', '310621205007', 'Biomedical Engineering', 'II Year', 'A',
    'sneha.p@mybus.edu', '+91 98407 78901',
    'bus-4', 'BUS-04', 'route-4', 'RT-04', 'bp-401', 'Sholinganallur Junction',
    'College Main Campus Terminal', null, 'PRESENT', 'ACTIVE'
  );

  insertStudent.run(
    'stud-8', 'STD-008', 'K. Sanjay', '310621103008', 'Civil Engineering', 'III Year', 'A',
    'sanjay.k@mybus.edu', '+91 98408 89012',
    'bus-5', 'BUS-05', 'route-5', 'RT-05', 'bp-501', 'Koyambedu CMBT Terminal',
    'College Main Campus Terminal', null, 'NOT_MARKED', 'ACTIVE'
  );

  // Insert Trips for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const insertTrip = db.prepare(`
    INSERT INTO trips (id, bus_id, bus_number, route_id, route_number, driver_id, driver_name, trip_date, trip_time, trip_type, status, start_time, total_students, present_count, absent_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTrip.run('trip-1', 'bus-1', 'BUS-01', 'route-1', 'RT-01', 'drv-1', 'P. Muthuvelan', todayStr, '07:15 AM', 'MORNING_PICKUP', 'ON_TRIP', `${todayStr}T07:15:00Z`, 48, 45, 3);
  insertTrip.run('trip-2', 'bus-2', 'BUS-02', 'route-2', 'RT-02', 'drv-2', 'K. Selvakumar', todayStr, '07:00 AM', 'MORNING_PICKUP', 'ON_TRIP', `${todayStr}T07:00:00Z`, 52, 48, 4);
  insertTrip.run('trip-3', 'bus-3', 'BUS-03', 'route-3', 'RT-03', 'drv-3', 'M. Thirunavukarasu', todayStr, '07:05 AM', 'MORNING_PICKUP', 'ON_TRIP', `${todayStr}T07:05:00Z`, 46, 42, 4);
  insertTrip.run('trip-4', 'bus-4', 'BUS-04', 'route-4', 'RT-04', 'drv-4', 'S. Natarajan', todayStr, '07:15 AM', 'MORNING_PICKUP', 'COMPLETED', `${todayStr}T07:15:00Z`, 42, 41, 1);

  // Insert Initial Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, user_role, type, title, message, bus_id, bus_number, priority, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run('notif-1', 'stud-1', 'ROLE_STUDENT', 'TRIP_STARTED', 'Bus Has Started Trip', 'BUS-01 has departed from Tambaram Sanatorium on Route RT-01.', 'bus-1', 'BUS-01', 'MEDIUM', 0, nowIso);
  insertNotif.run('notif-2', 'parent-1', 'ROLE_PARENT', 'TRIP_STARTED', 'Child Bus In Transit', 'BUS-01 carrying Sarah Jenkins has started its morning trip.', 'bus-1', 'BUS-01', 'MEDIUM', 0, nowIso);
  insertNotif.run('notif-3', 'stud-1', 'ROLE_STUDENT', 'BUS_APPROACHING', 'Bus Approaching Your Stop', 'BUS-01 is 450m from Tambaram Railway Station West. Please be ready at the pickup point.', 'bus-1', 'BUS-01', 'HIGH', 0, nowIso);
  insertNotif.run('notif-4', 'ALL', 'ALL', 'BUS_ARRIVED_COLLEGE', 'BUS-04 Reached College', 'BUS-04 (OMR Line) has safely arrived at the College Main Campus Terminal.', 'bus-4', 'BUS-04', 'LOW', 1, nowIso);

  // Record initial bus locations in audit log
  const insertLoc = db.prepare(`
    INSERT INTO bus_locations (id, bus_id, trip_id, latitude, longitude, accuracy, speed_kmh, heading, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertLoc.run('loc-1', 'bus-1', 'trip-1', 12.9250, 80.1170, 8.5, 36.5, 185, 'MOVING', nowIso);
  insertLoc.run('loc-2', 'bus-2', 'trip-2', 12.9690, 80.1510, 6.0, 28.0, 210, 'APPROACHING_STOP', nowIso);
  insertLoc.run('loc-3', 'bus-3', 'trip-3', 12.9180, 80.1910, 5.0, 0.0, 195, 'STOPPED', nowIso);
  insertLoc.run('loc-4', 'bus-4', 'trip-4', 12.8715, 80.0825, 5.0, 0.0, 0, 'ARRIVED_AT_COLLEGE', nowIso);

  // Insert Attendance for today
  const insertAtt = db.prepare(`
    INSERT INTO attendance (id, student_id, student_name, register_number, department, year, section, bus_number, route_number, boarding_point, status, trip_date, trip_time, marked_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAtt.run('att-1', 'stud-1', 'Sarah Jenkins', '310621104001', 'Computer Science & Engineering', 'IV Year', 'A', 'BUS-01', 'RT-01', 'Tambaram Railway Station West', 'PRESENT', todayStr, '07:22 AM', 'DRIVER');
  insertAtt.run('att-2', 'stud-2', 'Adhav Sundaram', '310621104002', 'Information Technology', 'III Year', 'B', 'BUS-01', 'RT-01', 'Tambaram Sanatorium', 'PRESENT', todayStr, '07:16 AM', 'RFID_TAP');
  insertAtt.run('att-3', 'stud-3', 'Ananya Krishnan', '310621106003', 'Electronics & Communication', 'III Year', 'A', 'BUS-02', 'RT-02', 'Pallavaram Bus Stand', 'PRESENT', todayStr, '07:28 AM', 'DRIVER');
  insertAtt.run('att-4', 'stud-6', 'V. Vignesh', '310621105006', 'Electrical & Electronics', 'IV Year', 'B', 'BUS-03', 'RT-03', 'Medavakkam Koot Road', 'ABSENT', todayStr, '07:35 AM', 'DRIVER');
}

// Initialize database schema on load
initSchema();
seedDatabase();
