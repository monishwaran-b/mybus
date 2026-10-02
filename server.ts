import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

import {
  calculateHaversineDistanceMeters,
  calculateBearingDegrees,
  calculateEtaMinutes,
  THRESHOLD_ARRIVED_METERS,
  THRESHOLD_APPROACHING_METERS,
} from './src/utils/haversine.ts';

import {
  BusRepo,
  RouteRepo,
  StudentRepo,
  DriverRepo,
  TripRepo,
  NotificationRepo,
  StatsRepo,
  UserRepo,
} from './src/db/repository.ts';

import { seedDatabase, db } from './src/db/sqlite.ts';
import type { BusStatus } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize AI if configured
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'demo-key',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ============================================================================
// REAL-TIME SERVER-SENT EVENTS (SSE) ENGINE
// ============================================================================
const sseClients = new Set<Response>();

export function broadcastSSE(type: string, payload: any) {
  const message = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

// SSE Stream Endpoint
app.get('/api/tracking/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial connected event
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  sseClients.add(res);

  // Heartbeat to keep connection alive through browser iframes and proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (_) {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    database: 'SQLite 3 (node:sqlite)',
    realtime: 'Server-Sent Events (SSE)',
    activeClients: sseClients.size,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// AUTHENTICATION & RBAC APIS
// ============================================================================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = UserRepo.authenticate(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = `mybus_token_${user.id}_${Date.now()}`;
  res.json({
    token,
    user,
    expiresIn: 86400,
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Default to student for unauthenticated preview
    const defaultUser = UserRepo.authenticate('sarah.student@mybus.edu');
    return res.json({ user: defaultUser });
  }

  const token = authHeader.replace('Bearer ', '');
  const parts = token.split('_');
  const userId = parts[2];

  const user = userId ? UserRepo.getById(userId) : UserRepo.authenticate('sarah.student@mybus.edu');
  res.json({ user });
});

// ============================================================================
// BUS FLEET APIS
// ============================================================================
app.get('/api/buses', (req: Request, res: Response) => {
  const buses = BusRepo.getAll();
  res.json({ data: buses, count: buses.length });
});

app.get('/api/buses/:id', (req: Request, res: Response) => {
  const bus = BusRepo.getById(req.params.id) || BusRepo.getByNumber(req.params.id);
  if (!bus) {
    return res.status(404).json({ error: 'Bus not found' });
  }

  const route = bus.routeId ? RouteRepo.getById(bus.routeId) : null;
  const stops = route ? route.stops : [];
  const students = StudentRepo.getAll({ busNumber: bus.busNumber });

  res.json({
    bus,
    route: route || undefined,
    stops,
    studentCount: students.total,
  });
});

app.post('/api/buses', (req: Request, res: Response) => {
  try {
    const { busNumber, routeNumber, registrationNumber, capacity, type, driverId, routeId } = req.body;
    if (!busNumber || !routeNumber || !registrationNumber) {
      return res.status(400).json({ error: 'Bus Number, Route Number, and Registration Number are required' });
    }

    const existing = BusRepo.getByNumber(busNumber);
    if (existing) {
      return res.status(409).json({ error: `Bus ${busNumber} already exists in database` });
    }

    const bus = BusRepo.create({
      busNumber,
      routeNumber,
      registrationNumber,
      capacity: Number(capacity) || 55,
      type,
      driverId,
      routeId,
    });

    broadcastSSE('BUS_CREATED', bus);
    res.status(201).json(bus);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/buses/:id', (req: Request, res: Response) => {
  try {
    const updated = BusRepo.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Bus not found' });
    }
    broadcastSSE('BUS_UPDATED', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/buses/:id', (req: Request, res: Response) => {
  const success = BusRepo.delete(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Bus not found' });
  }
  broadcastSSE('BUS_DELETED', { id: req.params.id });
  res.json({ success: true, message: 'Bus deleted from database' });
});

// Live Fleet for Real-Time Tracking
app.get('/api/tracking/live', (req: Request, res: Response) => {
  const buses = BusRepo.getAll();
  res.json({
    timestamp: new Date().toISOString(),
    count: buses.length,
    simulationActive: false,
    simulationSpeedMultiplier: 1,
    buses,
  });
});

app.get('/api/tracking/bus/:id', (req: Request, res: Response) => {
  const bus = BusRepo.getById(req.params.id) || BusRepo.getByNumber(req.params.id);
  if (!bus) {
    return res.status(404).json({ error: 'Bus not found' });
  }

  const route = bus.routeId ? RouteRepo.getById(bus.routeId) : null;
  const stops = route ? route.stops : [];

  // Recent tracking history from SQLite
  const historyRows = db.prepare('SELECT * FROM bus_locations WHERE bus_id = ? ORDER BY timestamp DESC LIMIT 20').all(bus.id) as any[];
  const recentHistory = historyRows.map((h) => ({
    id: h.id,
    busId: h.bus_id,
    busNumber: bus.busNumber,
    latitude: Number(h.latitude),
    longitude: Number(h.longitude),
    speedKmH: Number(h.speed_kmh || 0),
    heading: Number(h.heading || 0),
    timestamp: h.timestamp,
    source: 'DRIVER_TELEMETRY' as const,
    status: h.status as BusStatus,
  }));

  res.json({
    bus,
    route: route || undefined,
    stops,
    recentHistory,
  });
});

app.get('/api/tracking/history/:busId', (req: Request, res: Response) => {
  const bus = BusRepo.getById(req.params.busId) || BusRepo.getByNumber(req.params.busId);
  if (!bus) {
    return res.status(404).json({ error: 'Bus not found' });
  }

  const rows = db.prepare('SELECT * FROM bus_locations WHERE bus_id = ? ORDER BY timestamp DESC LIMIT 100').all(bus.id) as any[];
  res.json({
    busId: bus.id,
    data: rows.map((r) => ({
      id: r.id,
      busId: r.bus_id,
      busNumber: bus.busNumber,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      speedKmH: Number(r.speed_kmh || 0),
      heading: Number(r.heading || 0),
      timestamp: r.timestamp,
      source: 'DRIVER_TELEMETRY',
      status: r.status,
    })),
    count: rows.length,
  });
});

// ============================================================================
// CORE REAL-TIME GPS TRACKING & GEOFENCE ENGINE
// ============================================================================
function processLocationTelemetry(params: {
  busNumber: string;
  latitude: number;
  longitude: number;
  speedKmH?: number;
  heading?: number;
}) {
  const bus = BusRepo.getByNumber(params.busNumber);
  if (!bus) return null;

  const lat = Number(params.latitude);
  const lng = Number(params.longitude);
  const speed = params.speedKmH != null ? Number(params.speedKmH) : (bus.speedKmH || 30);
  const heading = params.heading != null ? Number(params.heading) : bus.heading;

  let currentStatus: BusStatus = speed > 3 ? 'MOVING' : 'STOPPED';
  let nextStopName = bus.nextStopName || 'College Main Campus Terminal';
  let nextStopDistance = 0;
  let etaMinutes = 0;

  // Retrieve assigned route
  const route = bus.routeId ? RouteRepo.getById(bus.routeId) : null;
  if (route) {
    // 1. Check College Destination Geofence (Radius 200m)
    const collegeLat = route.collegeLat || 12.8715;
    const collegeLng = route.collegeLng || 80.0825;
    const distToCollege = calculateHaversineDistanceMeters(lat, lng, collegeLat, collegeLng);

    if (distToCollege <= 200) {
      currentStatus = 'ARRIVED_AT_COLLEGE';
      nextStopName = 'College Main Campus';
      nextStopDistance = distToCollege;
      etaMinutes = 0;

      // Notification if just arrived
      if (bus.currentStatus !== 'ARRIVED_AT_COLLEGE') {
        NotificationRepo.create({
          userId: 'ALL',
          userRole: 'ALL',
          type: 'BUS_ARRIVED_COLLEGE',
          title: `Bus ${bus.busNumber} Reached College`,
          message: `${bus.busNumber} has entered the campus gate and reached the college terminal safely.`,
          busId: bus.id,
          busNumber: bus.busNumber,
          priority: 'MEDIUM',
        });
      }
    } else {
      // 2. Check Boarding Points on route
      let nearestStop: any = null;
      let minDistance = Infinity;

      for (const stop of route.stops) {
        const d = calculateHaversineDistanceMeters(lat, lng, stop.latitude, stop.longitude);
        if (d < minDistance) {
          minDistance = d;
          nearestStop = stop;
        }
      }

      if (nearestStop) {
        nextStopName = nearestStop.name;
        nextStopDistance = minDistance;
        etaMinutes = calculateEtaMinutes(minDistance, speed > 5 ? speed : 30);

        if (minDistance <= (nearestStop.radiusMeters || 100)) {
          currentStatus = 'ARRIVED_AT_STOP';
          // Trigger notification to students assigned to this stop
          if (bus.currentStatus !== 'ARRIVED_AT_STOP') {
            NotificationRepo.create({
              userId: 'ALL',
              userRole: 'ALL',
              type: 'BUS_ARRIVED_STOP',
              title: `Bus Arrived at ${nearestStop.name}`,
              message: `Bus ${bus.busNumber} has arrived at ${nearestStop.name}. Boarding in progress.`,
              busId: bus.id,
              busNumber: bus.busNumber,
              priority: 'HIGH',
            });
          }
        } else if (minDistance <= 500) {
          currentStatus = 'APPROACHING_STOP';
          if (bus.currentStatus !== 'APPROACHING_STOP' && bus.currentStatus !== 'ARRIVED_AT_STOP') {
            NotificationRepo.create({
              userId: 'ALL',
              userRole: 'ALL',
              type: 'BUS_APPROACHING',
              title: `Bus Approaching ${nearestStop.name}`,
              message: `Bus ${bus.busNumber} is approx ${minDistance}m from ${nearestStop.name}. ETA: ~${etaMinutes} mins.`,
              busId: bus.id,
              busNumber: bus.busNumber,
              priority: 'MEDIUM',
            });
          }
        }
      }
    }
  }

  // Persist updated coordinates and status in SQLite
  const updatedBus = BusRepo.updateLocation({
    busNumber: params.busNumber,
    latitude: lat,
    longitude: lng,
    speedKmH: speed,
    heading,
    currentStatus,
    nextStopName,
    nextStopDistanceMeters: nextStopDistance,
    etaMinutes,
  });

  // Broadcast real-time event to all connected dashboards via SSE
  if (updatedBus) {
    broadcastSSE('BUS_LOCATION_UPDATE', updatedBus);
  }

  return updatedBus;
}

// Location API called by Driver device GPS or Demo Tracking
app.post('/api/tracking/location', (req: Request, res: Response) => {
  const { busId, busNumber, latitude, longitude, speed, heading, accuracy } = req.body;

  let targetNumber = busNumber;
  if (!targetNumber && busId) {
    const b = BusRepo.getById(busId);
    if (b) targetNumber = b.busNumber;
  }

  if (!targetNumber || latitude == null || longitude == null) {
    return res.status(400).json({ error: 'busNumber, latitude, and longitude are required' });
  }

  const updatedBus = processLocationTelemetry({
    busNumber: targetNumber,
    latitude: Number(latitude),
    longitude: Number(longitude),
    speedKmH: speed != null ? Number(speed) : undefined,
    heading: heading != null ? Number(heading) : undefined,
  });

  if (!updatedBus) {
    return res.status(404).json({ error: `Bus ${targetNumber} not found` });
  }

  res.json({
    success: true,
    bus: updatedBus,
    status: updatedBus.currentStatus,
  });
});

app.post('/api/driver/update-location', (req: Request, res: Response) => {
  const { busNumber, latitude, longitude, speedKmH, heading } = req.body;
  if (!busNumber || latitude == null || longitude == null) {
    return res.status(400).json({ error: 'busNumber, latitude, and longitude are required' });
  }

  const updatedBus = processLocationTelemetry({
    busNumber,
    latitude: Number(latitude),
    longitude: Number(longitude),
    speedKmH: speedKmH != null ? Number(speedKmH) : undefined,
    heading: heading != null ? Number(heading) : undefined,
  });

  if (!updatedBus) {
    return res.status(404).json({ error: `Bus ${busNumber} not found` });
  }

  res.json({
    success: true,
    bus: updatedBus,
  });
});

// Driver Start / Stop Trip Controls
app.post('/api/driver/start-trip', (req: Request, res: Response) => {
  const { busNumber } = req.body;
  if (!busNumber) {
    return res.status(400).json({ error: 'busNumber is required' });
  }

  try {
    const trip = TripRepo.startTrip(busNumber);
    const bus = BusRepo.getByNumber(busNumber);
    broadcastSSE('TRIP_STARTED', { bus, trip });
    res.json({ success: true, bus, trip });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/driver/stop-trip', (req: Request, res: Response) => {
  const { busNumber } = req.body;
  if (!busNumber) {
    return res.status(400).json({ error: 'busNumber is required' });
  }

  try {
    const result = TripRepo.stopTrip(busNumber);
    const bus = BusRepo.getByNumber(busNumber);
    broadcastSSE('TRIP_COMPLETED', { bus });
    res.json({ success: true, bus, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/driver/update-status', (req: Request, res: Response) => {
  const { busNumber, status } = req.body;
  if (!busNumber || !status) {
    return res.status(400).json({ error: 'busNumber and status are required' });
  }

  const bus = BusRepo.getByNumber(busNumber);
  if (!bus) {
    return res.status(404).json({ error: 'Bus not found' });
  }

  const updated = BusRepo.update(bus.id, { currentStatus: status as BusStatus });
  if (updated) {
    broadcastSSE('BUS_STATUS_UPDATE', updated);
  }
  res.json({ success: true, bus: updated });
});

// ============================================================================
// ROUTES & BOARDING POINTS APIS
// ============================================================================
app.get('/api/routes', (req: Request, res: Response) => {
  const routes = RouteRepo.getAll();
  res.json({ data: routes, count: routes.length });
});

app.get('/api/routes/:id', (req: Request, res: Response) => {
  const route = RouteRepo.getById(req.params.id);
  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }
  const buses = BusRepo.getAll().filter((b) => b.routeId === route.id || b.routeNumber === route.code);
  res.json({ route, stops: route.stops, buses });
});

app.get('/api/boarding-points', (req: Request, res: Response) => {
  const { routeId } = req.query;
  let sql = 'SELECT * FROM boarding_points WHERE is_active = 1';
  const params: any[] = [];
  if (routeId) {
    sql += ' AND route_id = ?';
    params.push(String(routeId));
  }
  sql += ' ORDER BY route_id, stop_order ASC';

  const rows = db.prepare(sql).all(...params) as any[];
  const data = rows.map((s) => ({
    id: s.id,
    routeId: s.route_id,
    name: s.name,
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
    radiusMeters: s.radius_meters,
    stopOrder: s.stop_order,
    scheduledTime: s.scheduled_time,
    isActive: Boolean(s.is_active),
  }));

  res.json({ data, count: data.length });
});

// ============================================================================
// STUDENTS MANAGEMENT & SEARCH APIS
// ============================================================================
app.get('/api/students', (req: Request, res: Response) => {
  const { busNumber, department, registerNumber, year, search, limit, offset } = req.query;
  const result = StudentRepo.getAll({
    busNumber: busNumber ? String(busNumber) : undefined,
    department: department ? String(department) : undefined,
    registerNumber: registerNumber ? String(registerNumber) : undefined,
    year: year ? String(year) : undefined,
    query: search ? String(search) : undefined,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });
  res.json(result);
});

app.get('/api/students/search', (req: Request, res: Response) => {
  const { query, registerNumber, busNumber, department, year } = req.query;
  const result = StudentRepo.getAll({
    query: query ? String(query) : undefined,
    registerNumber: registerNumber ? String(registerNumber) : undefined,
    busNumber: busNumber ? String(busNumber) : undefined,
    department: department ? String(department) : undefined,
    year: year ? String(year) : undefined,
    limit: 100,
  });
  res.json(result);
});

app.get('/api/students/:id', (req: Request, res: Response) => {
  const student = StudentRepo.getById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const bus = student.busNumber ? BusRepo.getByNumber(student.busNumber) : null;
  const route = student.routeId ? RouteRepo.getById(student.routeId) : null;
  const boardingPoint = student.boardingPointId ? db.prepare('SELECT * FROM boarding_points WHERE id = ?').get(student.boardingPointId) : null;
  const parent = student.linkedParentId ? db.prepare('SELECT * FROM parents WHERE id = ?').get(student.linkedParentId) : null;

  res.json({
    student,
    bus: bus || undefined,
    route: route || undefined,
    boardingPoint: boardingPoint || undefined,
    parent: parent || undefined,
  });
});

app.post('/api/students', (req: Request, res: Response) => {
  try {
    const student = StudentRepo.create(req.body);
    broadcastSSE('STUDENT_CREATED', student);
    res.status(201).json({ success: true, student });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/students/:id', (req: Request, res: Response) => {
  try {
    const student = StudentRepo.update(req.params.id, req.body);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    broadcastSSE('STUDENT_UPDATED', student);
    res.json({ success: true, student });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/students/:id', (req: Request, res: Response) => {
  const success = StudentRepo.delete(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Student not found' });
  }
  broadcastSSE('STUDENT_DELETED', { id: req.params.id });
  res.json({ success: true, message: 'Student deleted from database' });
});

// ============================================================================
// ATTENDANCE APIS
// ============================================================================
app.get('/api/attendance', (req: Request, res: Response) => {
  const { date, busNumber } = req.query;
  let sql = 'SELECT * FROM attendance WHERE 1=1';
  const params: any[] = [];

  if (date) {
    sql += ' AND trip_date = ?';
    params.push(String(date));
  }
  if (busNumber) {
    sql += ' AND bus_number = ?';
    params.push(String(busNumber));
  }
  sql += ' ORDER BY marked_at DESC LIMIT 100';

  const rows = db.prepare(sql).all(...params) as any[];
  const data = rows.map((r) => ({
    id: r.id,
    studentId: r.student_id,
    studentName: r.student_name,
    registerNumber: r.register_number,
    department: r.department,
    year: r.year,
    section: r.section || 'A',
    busNumber: r.bus_number,
    routeNumber: r.route_number,
    boardingPoint: r.boarding_point,
    status: r.status,
    tripDate: r.trip_date,
    tripTime: r.trip_time,
    tripType: r.trip_type,
    markedAt: r.marked_at,
    markedBy: r.marked_by,
  }));

  res.json({ data, total: data.length });
});

app.post('/api/attendance/mark', (req: Request, res: Response) => {
  const { studentId, status, markedBy } = req.body;
  if (!studentId || !status) {
    return res.status(400).json({ error: 'studentId and status are required' });
  }

  StudentRepo.setAttendance(studentId, status, markedBy || 'DRIVER');
  res.json({ success: true, message: 'Attendance recorded' });
});

app.post('/api/attendance/bulk', (req: Request, res: Response) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'updates array is required' });
  }

  for (const item of updates) {
    StudentRepo.setAttendance(item.studentId, item.status, 'DRIVER');
  }

  res.json({ success: true, count: updates.length });
});

app.get('/api/attendance/summary', (req: Request, res: Response) => {
  const stats = StatsRepo.getDashboardStats();
  res.json({
    totalStudents: stats.totalStudents,
    presentCount: stats.presentStudents,
    absentCount: stats.absentStudents,
    notMarkedCount: 0,
    attendancePercentage: stats.attendancePercentage,
    date: new Date().toISOString().slice(0, 10),
    tripType: 'MORNING_PICKUP',
  });
});

// ============================================================================
// DRIVERS & PARENTS APIS
// ============================================================================
app.get('/api/drivers', (req: Request, res: Response) => {
  const drivers = DriverRepo.getAll();
  res.json({ data: drivers, count: drivers.length });
});

app.get('/api/parents', (req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM parents WHERE status = 'ACTIVE'").all() as any[];
  const data = rows.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    status: p.status,
    linkedStudentIds: p.linked_student_id ? [p.linked_student_id] : [],
    createdAt: p.created_at,
  }));
  res.json({ data, count: data.length });
});

app.get('/api/parents/:id', (req: Request, res: Response) => {
  const parentRow = db.prepare('SELECT * FROM parents WHERE id = ? OR parent_id = ?').get(req.params.id, req.params.id) as any;
  if (!parentRow) {
    return res.status(404).json({ error: 'Parent not found' });
  }

  const linkedStudents = db.prepare('SELECT * FROM students WHERE linked_parent_id = ?').all(parentRow.id) as any[];

  res.json({
    parent: {
      id: parentRow.id,
      name: parentRow.name,
      email: parentRow.email,
      phone: parentRow.phone,
      status: parentRow.status,
      linkedStudentIds: linkedStudents.map((s) => s.id),
      createdAt: parentRow.created_at,
    },
    linkedStudents: linkedStudents.map((s) => StudentRepo.getById(s.id)!),
  });
});

// ============================================================================
// TRIPS & DASHBOARD METRICS APIS
// ============================================================================
app.get('/api/trips/today', (req: Request, res: Response) => {
  const trips = TripRepo.getAll();
  res.json({ data: trips, count: trips.length });
});

app.get('/api/dashboard/metrics', (req: Request, res: Response) => {
  const stats = StatsRepo.getDashboardStats();
  const todayTrips = TripRepo.getAll();

  res.json({
    totalBuses: stats.totalBuses,
    activeBuses: stats.activeBuses,
    totalStudents: stats.totalStudents,
    activeRoutes: stats.activeRoutes,
    totalDrivers: stats.drivers,
    todayTripsCount: stats.todayTrips,
    todayTrips,
    attendanceSummary: {
      totalStudents: stats.totalStudents,
      presentCount: stats.presentStudents,
      absentCount: stats.absentStudents,
      notMarkedCount: 0,
      attendancePercentage: stats.attendancePercentage,
      date: new Date().toISOString().slice(0, 10),
      tripType: 'MORNING_PICKUP',
    },
    lastUpdated: new Date().toISOString(),
  });
});

app.get('/api/admin/stats', (req: Request, res: Response) => {
  res.json(StatsRepo.getDashboardStats());
});

app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  res.json(StatsRepo.getDashboardStats());
});

// ============================================================================
// NOTIFICATIONS APIS
// ============================================================================
app.get('/api/alerts', (req: Request, res: Response) => {
  const { role, userId } = req.query;
  const data = NotificationRepo.getAll(role ? String(role) : undefined, userId ? String(userId) : undefined);
  const unreadCount = data.filter((n) => !n.isRead).length;
  res.json({ data, unreadCount });
});

app.post('/api/alerts/:id/read', (req: Request, res: Response) => {
  NotificationRepo.markRead(req.params.id);
  res.json({ success: true });
});

// ============================================================================
// DATABASE MANAGEMENT / RESET TO CLEAN SEED
// ============================================================================
app.post('/api/admin/database/reset', (req: Request, res: Response) => {
  try {
    seedDatabase(true);
    broadcastSSE('DATABASE_RESET', { timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'Database reset to clean structured seed data.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/database/tables', (req: Request, res: Response) => {
  const tables = [
    { name: 'buses', recordCount: (db.prepare('SELECT COUNT(*) as c FROM buses').get() as any).c, primaryKey: 'id', description: 'Fleet records with live GPS and telemetry' },
    { name: 'students', recordCount: (db.prepare('SELECT COUNT(*) as c FROM students').get() as any).c, primaryKey: 'id', description: 'Unified student bus passes & boarding points' },
    { name: 'routes', recordCount: (db.prepare('SELECT COUNT(*) as c FROM routes').get() as any).c, primaryKey: 'id', description: 'Transit corridors and destination college geofence' },
    { name: 'boarding_points', recordCount: (db.prepare('SELECT COUNT(*) as c FROM boarding_points').get() as any).c, primaryKey: 'id', description: 'Pickup stops with geofence radiuses' },
    { name: 'drivers', recordCount: (db.prepare('SELECT COUNT(*) as c FROM drivers').get() as any).c, primaryKey: 'id', description: 'Verified drivers assigned to fleet buses' },
    { name: 'trips', recordCount: (db.prepare('SELECT COUNT(*) as c FROM trips').get() as any).c, primaryKey: 'id', description: 'Daily active & completed runs' },
    { name: 'bus_locations', recordCount: (db.prepare('SELECT COUNT(*) as c FROM bus_locations').get() as any).c, primaryKey: 'id', description: 'Historical location breadcrumbs' },
    { name: 'notifications', recordCount: (db.prepare('SELECT COUNT(*) as c FROM notifications').get() as any).c, primaryKey: 'id', description: 'System & geofence event alerts' },
    { name: 'attendance', recordCount: (db.prepare('SELECT COUNT(*) as c FROM attendance').get() as any).c, primaryKey: 'id', description: 'Trip boardings and RFID tap records' },
  ];
  res.json({ tables });
});

// College Info Endpoint
app.get('/api/college/info', (req: Request, res: Response) => {
  res.json({
    college: {
      collegeName: 'Tamil Nadu Institute of Technology & Science',
      collegeShortName: 'TNITS',
      district: 'Chengalpattu / Chennai',
      mainCampusAddress: 'Vandalur-Kelambakkam Road, Chennai, Tamil Nadu - 600127',
      campusLatitude: 12.8715,
      campusLongitude: 80.0825,
      campusRadiusMeters: 200,
    },
  });
});

// ============================================================================
// GEMINI TRANSIT ASSISTANT (Safe fallback if invoked)
// ============================================================================
app.post('/api/ai/transit-query', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const buses = BusRepo.getAll();
    const routes = RouteRepo.getAll();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are the Transit Operations Assistant for Tamil Nadu Institute of Technology college bus fleet.
Current live buses: ${JSON.stringify(buses.map(b => ({ bus: b.busNumber, route: b.routeName, status: b.currentStatus, speed: b.speedKmH, nextStop: b.nextStopName, eta: b.etaMinutes })))}
Routes: ${JSON.stringify(routes.map(r => ({ route: r.routeNumber, name: r.name, start: r.startPoint, end: r.endPoint })))}

Answer the user's inquiry concisely in English:
"${query}"`,
            },
          ],
        },
      ],
    });

    res.json({ answer: response.text || 'All college buses are currently operating as scheduled.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// VITE SPA MIDDLEWARE / STATIC ASSETS
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MyBus Backend] Server running at http://0.0.0.0:${PORT}`);
    console.log(`[MyBus Backend] Relational SQLite Database: ./data/mybus.db connected`);
    console.log(`[MyBus Backend] Real-Time SSE Stream active on /api/tracking/stream`);
  });
}

startServer();
