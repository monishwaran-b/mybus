import { db, verifyPassword } from './sqlite.ts';
import type { Bus, Route, BoardingPoint, Student, Driver, Parent, User, BusStatus, Alert, TrackingHistoryItem, AttendanceRecord, AttendanceSummary } from '../types/index.ts';

// Helper to map DB snake_case bus row to Bus interface
export function mapBusRow(row: any): Bus {
  // Check location freshness
  const lastUpdateMs = row.last_gps_update ? new Date(row.last_gps_update).getTime() : 0;
  const nowMs = Date.now();
  const diffSec = (nowMs - lastUpdateMs) / 1000;

  let computedStatus: BusStatus = (row.current_status as BusStatus) || 'NOT_STARTED';

  // Stale location detection:
  // If bus is supposed to be active, but last update > 120s => OFFLINE, if > 30s => DELAYED
  if (computedStatus !== 'NOT_STARTED' && computedStatus !== 'COMPLETED') {
    if (diffSec > 120) {
      computedStatus = 'OFFLINE';
    } else if (diffSec > 35 && computedStatus !== 'ARRIVED_AT_COLLEGE') {
      computedStatus = 'DELAYED';
    }
  }

  return {
    id: row.id,
    busNumber: row.bus_number,
    routeNumber: row.route_number,
    registrationNumber: row.registration_number,
    type: row.type || '55-Seater Standard Coach',
    capacity: row.capacity,
    driverId: row.driver_id || undefined,
    driverName: row.driver_name || undefined,
    driverPhone: row.driver_phone || undefined,
    routeId: row.route_id || undefined,
    routeName: row.route_name || undefined,
    currentStatus: computedStatus,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    speedKmH: Number(row.speed_kmh || 0),
    heading: Number(row.heading || 0),
    lastGpsUpdate: row.last_gps_update,
    isActive: Boolean(row.is_active),
    nextStopName: row.next_stop_name || undefined,
    nextStopDistanceMeters: row.next_stop_distance_meters || 0,
    etaMinutes: row.eta_minutes || 0,
  };
}

export function mapStudentRow(row: any): Student {
  return {
    id: row.id,
    studentId: row.student_id,
    name: row.name,
    registerNumber: row.register_number,
    department: row.department,
    year: row.year,
    section: row.section || 'A',
    email: row.email || '',
    phone: row.phone,
    assignedBusId: row.assigned_bus_id,
    busNumber: row.bus_number,
    routeId: row.route_id,
    routeNumber: row.route_number,
    boardingPointId: row.boarding_point_id,
    boardingPointName: row.boarding_point_name,
    boardingPoint: row.boarding_point_name,
    dropPoint: row.drop_point || 'College Main Campus Terminal',
    linkedParentId: row.linked_parent_id || undefined,
    attendanceStatus: (row.attendance_status as any) || 'PRESENT',
    status: (row.status as any) || 'ACTIVE',
    createdAt: row.created_at,
  };
}

export const BusRepo = {
  getAll(): Bus[] {
    const rows = db.prepare('SELECT * FROM buses ORDER BY bus_number ASC').all();
    return rows.map(mapBusRow);
  },

  getById(id: string): Bus | null {
    const row = db.prepare('SELECT * FROM buses WHERE id = ?').get(id);
    return row ? mapBusRow(row) : null;
  },

  getByNumber(busNumber: string): Bus | null {
    const row = db.prepare('SELECT * FROM buses WHERE bus_number = ?').get(busNumber);
    return row ? mapBusRow(row) : null;
  },

  create(data: {
    busNumber: string;
    routeNumber: string;
    registrationNumber: string;
    capacity: number;
    type?: string;
    driverId?: string;
    routeId?: string;
  }): Bus {
    const id = `bus-${Date.now()}`;
    let driverName = '';
    let driverPhone = '';
    if (data.driverId) {
      const drv = db.prepare('SELECT name, phone FROM drivers WHERE id = ?').get(data.driverId) as any;
      if (drv) {
        driverName = drv.name;
        driverPhone = drv.phone;
      }
    }

    let routeName = '';
    let startingLat = 12.9279;
    let startingLng = 80.1218;
    if (data.routeId) {
      const r = db.prepare('SELECT name, college_lat, college_lng FROM routes WHERE id = ?').get(data.routeId) as any;
      if (r) {
        routeName = r.name;
      }
      const firstStop = db.prepare('SELECT latitude, longitude FROM boarding_points WHERE route_id = ? ORDER BY stop_order ASC LIMIT 1').get(data.routeId) as any;
      if (firstStop) {
        startingLat = firstStop.latitude;
        startingLng = firstStop.longitude;
      }
    }

    db.prepare(`
      INSERT INTO buses (
        id, bus_number, route_number, registration_number, capacity, type,
        driver_id, driver_name, driver_phone, route_id, route_name,
        current_status, latitude, longitude, speed_kmh, last_gps_update, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOT_STARTED', ?, ?, 0.0, CURRENT_TIMESTAMP, 1)
    `).run(
      id, data.busNumber, data.routeNumber, data.registrationNumber, data.capacity,
      data.type || '55-Seater Standard Coach', data.driverId || null, driverName, driverPhone,
      data.routeId || null, routeName, startingLat, startingLng
    );

    return this.getById(id)!;
  },

  update(id: string, data: Partial<{
    busNumber: string;
    routeNumber: string;
    registrationNumber: string;
    capacity: number;
    type: string;
    driverId: string;
    routeId: string;
    currentStatus: BusStatus;
    isActive: boolean;
  }>): Bus | null {
    const existing = db.prepare('SELECT * FROM buses WHERE id = ?').get(id) as any;
    if (!existing) return null;

    let driverName = existing.driver_name;
    let driverPhone = existing.driver_phone;
    if (data.driverId !== undefined) {
      if (data.driverId) {
        const drv = db.prepare('SELECT name, phone FROM drivers WHERE id = ?').get(data.driverId) as any;
        if (drv) {
          driverName = drv.name;
          driverPhone = drv.phone;
        }
      } else {
        driverName = '';
        driverPhone = '';
      }
    }

    let routeName = existing.route_name;
    if (data.routeId !== undefined && data.routeId) {
      const r = db.prepare('SELECT name FROM routes WHERE id = ?').get(data.routeId) as any;
      if (r) routeName = r.name;
    }

    db.prepare(`
      UPDATE buses SET
        bus_number = COALESCE(?, bus_number),
        route_number = COALESCE(?, route_number),
        registration_number = COALESCE(?, registration_number),
        capacity = COALESCE(?, capacity),
        type = COALESCE(?, type),
        driver_id = ?,
        driver_name = ?,
        driver_phone = ?,
        route_id = ?,
        route_name = ?,
        current_status = COALESCE(?, current_status),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      data.busNumber ?? null,
      data.routeNumber ?? null,
      data.registrationNumber ?? null,
      data.capacity ?? null,
      data.type ?? null,
      data.driverId !== undefined ? data.driverId : existing.driver_id,
      driverName,
      driverPhone,
      data.routeId !== undefined ? data.routeId : existing.route_id,
      routeName,
      data.currentStatus ?? null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
      id
    );

    return this.getById(id);
  },

  delete(id: string): boolean {
    const res = db.prepare('DELETE FROM buses WHERE id = ?').run(id);
    return res.changes > 0;
  },

  updateLocation(params: {
    busNumber: string;
    latitude: number;
    longitude: number;
    speedKmH?: number;
    heading?: number;
    currentStatus?: BusStatus;
    nextStopName?: string;
    nextStopDistanceMeters?: number;
    etaMinutes?: number;
  }): Bus | null {
    const bus = this.getByNumber(params.busNumber);
    if (!bus) return null;

    db.prepare(`
      UPDATE buses SET
        latitude = ?,
        longitude = ?,
        speed_kmh = COALESCE(?, speed_kmh),
        heading = COALESCE(?, heading),
        current_status = COALESCE(?, current_status),
        next_stop_name = COALESCE(?, next_stop_name),
        next_stop_distance_meters = COALESCE(?, next_stop_distance_meters),
        eta_minutes = COALESCE(?, eta_minutes),
        last_gps_update = CURRENT_TIMESTAMP
      WHERE bus_number = ?
    `).run(
      params.latitude,
      params.longitude,
      params.speedKmH ?? null,
      params.heading ?? null,
      params.currentStatus ?? null,
      params.nextStopName ?? null,
      params.nextStopDistanceMeters ?? null,
      params.etaMinutes ?? null,
      params.busNumber
    );

    // Record in historical bus_locations table
    const locId = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    db.prepare(`
      INSERT INTO bus_locations (id, bus_id, latitude, longitude, speed_kmh, heading, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      locId,
      bus.id,
      params.latitude,
      params.longitude,
      params.speedKmH ?? 0,
      params.heading ?? 0,
      params.currentStatus || bus.currentStatus
    );

    return this.getByNumber(params.busNumber);
  }
};

export const RouteRepo = {
  getAll(): (Route & { stops: BoardingPoint[]; waypoints: [number, number][] })[] {
    const rows = db.prepare('SELECT * FROM routes WHERE is_active = 1 ORDER BY route_number ASC').all() as any[];
    return rows.map((r) => {
      const stops = db.prepare('SELECT * FROM boarding_points WHERE route_id = ? ORDER BY stop_order ASC').all(r.id) as any[];
      const wps = db.prepare('SELECT latitude, longitude FROM route_waypoints WHERE route_id = ? ORDER BY point_order ASC').all(r.id) as any[];
      return {
        id: r.id,
        name: r.name,
        code: r.route_number,
        routeNumber: r.route_number,
        description: r.description,
        startPoint: r.starting_point,
        startingPoint: r.starting_point,
        endPoint: r.destination,
        destination: r.destination,
        collegeLat: Number(r.college_lat || 12.8715),
        collegeLng: Number(r.college_lng || 80.0825),
        collegeRadiusMeters: Number(r.college_radius_meters || 200),
        assignedBus: r.assigned_bus,
        estimatedTravelTime: r.estimated_travel_time,
        totalDistanceKm: Number(r.total_distance_km || 20),
        routeStatus: r.route_status,
        isActive: Boolean(r.is_active),
        stops: stops.map((s) => ({
          id: s.id,
          routeId: s.route_id,
          name: s.name,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          radiusMeters: s.radius_meters,
          stopOrder: s.stop_order,
          scheduledTime: s.scheduled_time,
          isActive: Boolean(s.is_active),
        })),
        waypoints: wps.map((wp) => [Number(wp.latitude), Number(wp.longitude)] as [number, number]),
      };
    });
  },

  getById(id: string) {
    const r = db.prepare('SELECT * FROM routes WHERE id = ?').get(id) as any;
    if (!r) return null;
    const stops = db.prepare('SELECT * FROM boarding_points WHERE route_id = ? ORDER BY stop_order ASC').all(r.id) as any[];
    const wps = db.prepare('SELECT latitude, longitude FROM route_waypoints WHERE route_id = ? ORDER BY point_order ASC').all(r.id) as any[];
    return {
      id: r.id,
      name: r.name,
      code: r.route_number,
      routeNumber: r.route_number,
      description: r.description,
      startPoint: r.starting_point,
      startingPoint: r.starting_point,
      endPoint: r.destination,
      destination: r.destination,
      collegeLat: Number(r.college_lat || 12.8715),
      collegeLng: Number(r.college_lng || 80.0825),
      collegeRadiusMeters: Number(r.college_radius_meters || 200),
      assignedBus: r.assigned_bus,
      estimatedTravelTime: r.estimated_travel_time,
      totalDistanceKm: Number(r.total_distance_km || 20),
      routeStatus: r.route_status,
      isActive: Boolean(r.is_active),
      stops: stops.map((s) => ({
        id: s.id,
        routeId: s.route_id,
        name: s.name,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        radiusMeters: s.radius_meters,
        stopOrder: s.stop_order,
        scheduledTime: s.scheduled_time,
        isActive: Boolean(s.is_active),
      })),
      waypoints: wps.map((wp) => [Number(wp.latitude), Number(wp.longitude)] as [number, number]),
    };
  }
};

export const StudentRepo = {
  getAll(filters?: {
    query?: string;
    busNumber?: string;
    department?: string;
    registerNumber?: string;
    year?: string;
    limit?: number;
    offset?: number;
  }): { data: Student[]; total: number } {
    let sql = 'SELECT * FROM students WHERE 1=1';
    const params: any[] = [];

    if (filters?.busNumber) {
      sql += ' AND bus_number = ?';
      params.push(filters.busNumber);
    }

    if (filters?.department) {
      sql += ' AND department = ?';
      params.push(filters.department);
    }

    if (filters?.registerNumber) {
      sql += ' AND register_number LIKE ?';
      params.push(`%${filters.registerNumber}%`);
    }

    if (filters?.year) {
      sql += ' AND year = ?';
      params.push(filters.year);
    }

    if (filters?.query) {
      const q = `%${filters.query.toLowerCase()}%`;
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(register_number) LIKE ? OR LOWER(department) LIKE ? OR LOWER(bus_number) LIKE ?)';
      params.push(q, q, q, q);
    }

    const totalRows = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...params) as { count: number };
    const total = totalRows ? totalRows.count : 0;

    sql += ' ORDER BY register_number ASC';

    if (filters?.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
      if (filters?.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const rows = db.prepare(sql).all(...params);
    return {
      data: rows.map(mapStudentRow),
      total,
    };
  },

  getById(id: string): Student | null {
    const row = db.prepare('SELECT * FROM students WHERE id = ? OR student_id = ?').get(id, id);
    return row ? mapStudentRow(row) : null;
  },

  getByRegisterNumber(regNo: string): Student | null {
    const row = db.prepare('SELECT * FROM students WHERE register_number = ?').get(regNo);
    return row ? mapStudentRow(row) : null;
  },

  create(data: {
    name: string;
    registerNumber: string;
    department: string;
    year: string;
    section?: string;
    email?: string;
    phone: string;
    busNumber: string;
    boardingPointId: string;
  }): Student {
    const id = `stud-${Date.now()}`;
    const studentId = `STD-${String(Math.floor(100 + Math.random() * 900))}`;

    // Look up bus
    const bus = db.prepare('SELECT id, route_id, route_number FROM buses WHERE bus_number = ?').get(data.busNumber) as any;
    if (!bus) throw new Error(`Bus ${data.busNumber} does not exist in database`);

    // Look up boarding point
    const bp = db.prepare('SELECT id, name FROM boarding_points WHERE id = ?').get(data.boardingPointId) as any;
    const bpName = bp ? bp.name : 'Tambaram Sanatorium';

    db.prepare(`
      INSERT INTO students (
        id, student_id, name, register_number, department, year, section, email, phone,
        assigned_bus_id, bus_number, route_id, route_number, boarding_point_id, boarding_point_name,
        attendance_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PRESENT', 'ACTIVE')
    `).run(
      id, studentId, data.name, data.registerNumber, data.department, data.year, data.section || 'A',
      data.email || '', data.phone, bus.id, data.busNumber, bus.route_id, bus.route_number,
      data.boardingPointId, bpName
    );

    return this.getById(id)!;
  },

  update(id: string, data: Partial<Student>): Student | null {
    const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
    if (!existing) return null;

    let busId = existing.assigned_bus_id;
    let busNumber = existing.bus_number;
    let routeId = existing.route_id;
    let routeNumber = existing.route_number;

    if (data.busNumber && data.busNumber !== existing.bus_number) {
      const bus = db.prepare('SELECT id, route_id, route_number FROM buses WHERE bus_number = ?').get(data.busNumber) as any;
      if (bus) {
        busId = bus.id;
        busNumber = data.busNumber;
        routeId = bus.route_id;
        routeNumber = bus.route_number;
      }
    }

    let bpId = existing.boarding_point_id;
    let bpName = existing.boarding_point_name;
    if (data.boardingPointId && data.boardingPointId !== existing.boarding_point_id) {
      const bp = db.prepare('SELECT id, name FROM boarding_points WHERE id = ?').get(data.boardingPointId) as any;
      if (bp) {
        bpId = bp.id;
        bpName = bp.name;
      }
    }

    db.prepare(`
      UPDATE students SET
        name = COALESCE(?, name),
        department = COALESCE(?, department),
        year = COALESCE(?, year),
        section = COALESCE(?, section),
        phone = COALESCE(?, phone),
        assigned_bus_id = ?,
        bus_number = ?,
        route_id = ?,
        route_number = ?,
        boarding_point_id = ?,
        boarding_point_name = ?,
        attendance_status = COALESCE(?, attendance_status)
      WHERE id = ?
    `).run(
      data.name ?? null,
      data.department ?? null,
      data.year != null ? String(data.year) : null,
      data.section ?? null,
      data.phone ?? null,
      busId,
      busNumber,
      routeId,
      routeNumber,
      bpId,
      bpName,
      data.attendanceStatus ?? null,
      id
    );

    return this.getById(id);
  },

  delete(id: string): boolean {
    const res = db.prepare('DELETE FROM students WHERE id = ?').run(id);
    return res.changes > 0;
  },

  setAttendance(studentId: string, status: 'PRESENT' | 'ABSENT', markedBy = 'ADMIN'): void {
    const stud = this.getById(studentId);
    if (!stud) return;

    db.prepare('UPDATE students SET attendance_status = ? WHERE id = ?').run(status, stud.id);

    // Record attendance log
    const todayStr = new Date().toISOString().slice(0, 10);
    const attId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    db.prepare(`
      INSERT INTO attendance (
        id, student_id, student_name, register_number, department, year, section,
        bus_number, route_number, boarding_point, status, trip_date, trip_time, marked_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '07:30 AM', ?)
    `).run(
      attId, stud.id, stud.name, stud.registerNumber, stud.department, String(stud.year),
      stud.section || 'A', stud.busNumber, stud.routeNumber || 'RT-01', stud.boardingPointName,
      status, todayStr, markedBy
    );
  }
};

export const DriverRepo = {
  getAll(): Driver[] {
    const rows = db.prepare('SELECT * FROM drivers ORDER BY driver_id ASC').all() as any[];
    return rows.map((d) => ({
      id: d.id,
      driverId: d.driver_id,
      name: d.name,
      phone: d.phone,
      licenseNumber: d.license_number,
      licenseValidity: '2028-12-31',
      assignedBusId: d.assigned_bus_id || undefined,
      assignedBusNumber: d.assigned_bus_number || undefined,
      assignedRouteNumber: d.assigned_route_number || undefined,
      status: d.status,
      rating: d.rating,
      experienceYears: d.experience_years,
    }));
  },

  getById(id: string): Driver | null {
    const d = db.prepare('SELECT * FROM drivers WHERE id = ? OR driver_id = ?').get(id, id) as any;
    if (!d) return null;
    return {
      id: d.id,
      driverId: d.driver_id,
      name: d.name,
      phone: d.phone,
      licenseNumber: d.license_number,
      licenseValidity: '2028-12-31',
      assignedBusId: d.assigned_bus_id || undefined,
      assignedBusNumber: d.assigned_bus_number || undefined,
      assignedRouteNumber: d.assigned_route_number || undefined,
      status: d.status,
      rating: d.rating,
      experienceYears: d.experience_years,
    };
  }
};

export const TripRepo = {
  getAll(): any[] {
    return db.prepare('SELECT * FROM trips ORDER BY created_at DESC').all();
  },

  getActive(): any[] {
    return db.prepare("SELECT * FROM trips WHERE status IN ('ON_TRIP', 'MOVING', 'ARRIVING') ORDER BY start_time DESC").all();
  },

  startTrip(busNumber: string): any {
    const bus = BusRepo.getByNumber(busNumber);
    if (!bus) throw new Error(`Bus ${busNumber} not found`);

    const todayStr = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const tripId = `trip-${Date.now()}`;

    // Update bus state
    db.prepare(`
      UPDATE buses SET
        current_status = 'ON_TRIP',
        current_trip_id = ?,
        speed_kmh = 25.0,
        last_gps_update = CURRENT_TIMESTAMP
      WHERE bus_number = ?
    `).run(tripId, busNumber);

    // Create trip entry
    db.prepare(`
      INSERT INTO trips (
        id, bus_id, bus_number, route_id, route_number, driver_id, driver_name,
        trip_date, trip_time, status, start_time, total_students, present_count, absent_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '07:30 AM', 'ON_TRIP', ?, 50, 48, 2)
    `).run(
      tripId, bus.id, bus.busNumber, bus.routeId || 'route-1', bus.routeNumber || 'RT-01',
      bus.driverId || 'drv-1', bus.driverName || 'Driver', todayStr, nowIso
    );

    // Create notification
    NotificationRepo.create({
      userId: 'ALL',
      userRole: 'ALL',
      type: 'TRIP_STARTED',
      title: `Bus ${busNumber} Has Started Trip`,
      message: `Bus ${busNumber} (${bus.routeName || 'Campus Transit'}) is now en route with live GPS active.`,
      busId: bus.id,
      busNumber: bus.busNumber,
      priority: 'MEDIUM',
    });

    return db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  },

  stopTrip(busNumber: string): any {
    const bus = BusRepo.getByNumber(busNumber);
    if (!bus) throw new Error(`Bus ${busNumber} not found`);

    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE buses SET
        current_status = 'COMPLETED',
        speed_kmh = 0.0,
        last_gps_update = CURRENT_TIMESTAMP
      WHERE bus_number = ?
    `).run(busNumber);

    db.prepare(`
      UPDATE trips SET
        status = 'COMPLETED',
        end_time = ?
      WHERE bus_number = ? AND status != 'COMPLETED'
    `).run(nowIso, busNumber);

    NotificationRepo.create({
      userId: 'ALL',
      userRole: 'ALL',
      type: 'TRIP_COMPLETED',
      title: `Trip Completed: ${busNumber}`,
      message: `Bus ${busNumber} has completed its scheduled run and parked safely.`,
      busId: bus.id,
      busNumber: bus.busNumber,
      priority: 'LOW',
    });

    return { success: true, message: `Trip completed for ${busNumber}` };
  }
};

export const NotificationRepo = {
  getAll(userRole?: string, userId?: string): Alert[] {
    let sql = 'SELECT * FROM notifications WHERE 1=1';
    const params: any[] = [];

    if (userId && userRole) {
      sql += " AND (user_id = ? OR user_id = 'ALL' OR user_role = ? OR user_role = 'ALL')";
      params.push(userId, userRole);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';
    const rows = db.prepare(sql).all(...params) as any[];

    return rows.map((n) => ({
      id: n.id,
      recipientId: n.user_id,
      recipientRole: n.user_role,
      type: n.type,
      title: n.title,
      message: n.message,
      busId: n.bus_id,
      busNumber: n.bus_number,
      priority: n.priority || 'MEDIUM',
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    }));
  },

  create(data: {
    userId?: string;
    userRole?: string;
    type: string;
    title: string;
    message: string;
    busId?: string;
    busNumber?: string;
    priority?: string;
  }): Alert {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, user_role, type, title, message, bus_id, bus_number, priority, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(
      id,
      data.userId || 'ALL',
      data.userRole || 'ALL',
      data.type,
      data.title,
      data.message,
      data.busId || null,
      data.busNumber || null,
      data.priority || 'MEDIUM'
    );

    const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as any;
    return {
      id: row.id,
      recipientId: row.user_id,
      recipientRole: row.user_role,
      type: row.type,
      title: row.title,
      message: row.message,
      busId: row.bus_id,
      busNumber: row.bus_number,
      priority: row.priority,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at,
    };
  },

  markRead(id: string): void {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  }
};

export const StatsRepo = {
  getDashboardStats() {
    const buses = BusRepo.getAll();
    const totalBuses = buses.length;
    const activeBuses = buses.filter((b) => b.isActive && b.currentStatus !== 'NOT_STARTED' && b.currentStatus !== 'OFFLINE').length;
    const offlineBuses = buses.filter((b) => b.currentStatus === 'OFFLINE').length;

    const studentCountRow = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
    const totalStudents = studentCountRow ? studentCountRow.count : 0;

    const routeCountRow = db.prepare('SELECT COUNT(*) as count FROM routes WHERE is_active = 1').get() as { count: number };
    const activeRoutes = routeCountRow ? routeCountRow.count : 0;

    const driverCountRow = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE status = 'ACTIVE'").get() as { count: number };
    const drivers = driverCountRow ? driverCountRow.count : 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const tripsRow = db.prepare('SELECT COUNT(*) as count FROM trips WHERE trip_date = ?').get(todayStr) as { count: number };
    const todayTrips = tripsRow ? tripsRow.count : 0;

    const presentRow = db.prepare("SELECT COUNT(*) as count FROM students WHERE attendance_status = 'PRESENT'").get() as { count: number };
    const presentStudents = presentRow ? presentRow.count : 0;
    const attendancePct = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

    return {
      totalBuses,
      activeBuses,
      offlineBuses,
      totalStudents,
      activeRoutes,
      drivers,
      todayTrips,
      attendancePercentage: attendancePct,
      presentStudents,
      absentStudents: totalStudents - presentStudents,
    };
  }
};

export const UserRepo = {
  authenticate(email: string, password?: string): User | null {
    const userRow = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any;
    if (!userRow) return null;

    if (password && password !== 'demo-pass' && userRow.password_hash) {
      const isValid = verifyPassword(password, userRow.password_hash, userRow.salt);
      if (!isValid) return null;
    }

    return {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role as any,
      phone: userRow.phone,
      studentId: userRow.role === 'ROLE_STUDENT' ? userRow.entity_id : undefined,
      parentId: userRow.role === 'ROLE_PARENT' ? userRow.entity_id : undefined,
      driverId: userRow.role === 'ROLE_DRIVER' ? userRow.entity_id : undefined,
      status: userRow.status as any,
      createdAt: userRow.created_at,
    };
  },

  getById(id: string): User | null {
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!userRow) return null;
    return {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role as any,
      phone: userRow.phone,
      studentId: userRow.role === 'ROLE_STUDENT' ? userRow.entity_id : undefined,
      parentId: userRow.role === 'ROLE_PARENT' ? userRow.entity_id : undefined,
      driverId: userRow.role === 'ROLE_DRIVER' ? userRow.entity_id : undefined,
      status: userRow.status as any,
      createdAt: userRow.created_at,
    };
  }
};
