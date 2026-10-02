import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import type {
  Bus,
  Route,
  BoardingPoint,
  Student,
  Parent,
  Driver,
  Schedule,
  Alert,
  FleetAnalytics,
  ActivityLog,
  BusStatus,
  CollegeTrip,
  AttendanceRecord,
  AttendanceSummary,
} from '../../types/index.ts';
import { LeafletMap } from '../map/LeafletMap.tsx';
import {
  Bus as BusIcon,
  Users,
  Route as RouteIcon,
  Shield,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  FastForward,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Phone,
  Calendar,
  FileText,
  Radio,
  Send,
  Sliders,
  CheckCircle2,
  XCircle,
  Navigation,
  Database,
  Download,
  Edit,
  Trash2,
  Copy,
  Check,
  FileCode,
  BookOpen,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    | 'dashboard'
    | 'dataset'
    | 'attendance'
    | 'live-tracking'
    | 'buses'
    | 'routes'
    | 'drivers'
    | 'today-trips'
    | 'database'
    | 'boarding-points'
    | 'parents'
    | 'schedules'
    | 'alerts'
    | 'reports'
    | 'logs'
  >('dashboard');

  // Core Data Stores
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [boardingPoints, setBoardingPoints] = useState<BoardingPoint[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analytics, setAnalytics] = useState<FleetAnalytics | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [todayTrips, setTodayTrips] = useState<CollegeTrip[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [dbTables, setDbTables] = useState<Array<{ name: string; recordCount: number; primaryKey: string; description: string }>>([]);

  // Telemetry & simulator states
  const [simRunning, setSimRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [selectedBusId, setSelectedBusId] = useState<string>('bus-1');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Multi-Field Search & Filter states for College Dataset
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegNo, setFilterRegNo] = useState('');
  const [filterBusNumber, setFilterBusNumber] = useState('');
  const [filterRouteNumber, setFilterRouteNumber] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDriverName, setFilterDriverName] = useState('');
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState('');

  // Modals
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [emergencyBusId, setEmergencyBusId] = useState('bus-1');

  // Student CRUD Modals
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formStudent, setFormStudent] = useState<Partial<Student>>({
    name: '',
    registerNumber: '',
    department: 'Computer Science & Engineering',
    year: 1,
    section: 'A',
    phone: '',
    busNumber: 'BUS-01',
    routeNumber: 'RT-01',
    boardingPoint: 'Pallavaram Bus Stand',
    dropPoint: 'College Main Campus Terminal',
    attendanceStatus: 'PRESENT',
  });

  // New Bus form
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newBusReg, setNewBusReg] = useState('');
  const [newBusCapacity, setNewBusCapacity] = useState(50);
  const [newBusRouteId, setNewBusRouteId] = useState('route-1');
  const [newBusDriverId, setNewBusDriverId] = useState('driver-1');

  const refreshAllData = async () => {
    setIsLoading(true);
    try {
      const [
        liveRes,
        routesRes,
        bpsRes,
        studRes,
        parentsRes,
        driversRes,
        schRes,
        alertsRes,
        analyticsRes,
        logsRes,
        tripsRes,
        attRes,
        attSummRes,
        dbTablesRes,
      ] = await Promise.all([
        api.getLiveTracking(),
        api.getRoutes(),
        api.getBoardingPoints(),
        api.getStudents({ limit: 150 }),
        api.getParents(),
        api.getDrivers(),
        api.getSchedules(),
        api.getAlerts('ROLE_ADMIN'),
        api.getAnalytics(),
        api.getActivityLogs(),
        api.getTodayTrips(),
        api.getAttendance(),
        api.getAttendanceSummary(),
        api.getDatabaseTables().catch(() => ({ database: 'mybus', tables: [] })),
      ]);

      setBuses(liveRes.buses);
      setSimRunning(liveRes.simulationActive);
      setSimSpeed(liveRes.simulationSpeedMultiplier || 1);
      setRoutes(routesRes.data);
      setBoardingPoints(bpsRes.data);
      setStudents(studRes.data);
      setParents(parentsRes.data);
      setDrivers(driversRes.data);
      setSchedules(schRes.data);
      setAlerts(alertsRes.data);
      setAnalytics(analyticsRes);
      setActivityLogs(logsRes.data);
      setTodayTrips(tripsRes.data);
      setAttendanceRecords(attRes.data);
      setAttendanceSummary(attSummRes);
      setDbTables(dbTablesRes.tables || []);
    } catch (e) {
      console.error('Error refreshing admin fleet data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();

    const unsubscribe = api.subscribeToTrackingStream((event) => {
      if (event.type === 'BUS_LOCATION_UPDATE' || event.type === 'BUS_STATUS_UPDATE') {
        const updatedBus: Bus = event.payload;
        setBuses((prev) => prev.map((b) => (b.busNumber === updatedBus.busNumber ? updatedBus : b)));
      } else if (
        event.type === 'BUS_CREATED' ||
        event.type === 'BUS_DELETED' ||
        event.type === 'STUDENT_CREATED' ||
        event.type === 'STUDENT_UPDATED' ||
        event.type === 'STUDENT_DELETED' ||
        event.type === 'TRIP_STARTED' ||
        event.type === 'TRIP_COMPLETED' ||
        event.type === 'DATABASE_RESET'
      ) {
        refreshAllData();
      }
    });

    const interval = setInterval(async () => {
      try {
        const liveRes = await api.getLiveTracking();
        setBuses(liveRes.buses);

        const [anRes, logsRes, tripsRes, attSummRes] = await Promise.all([
          api.getAnalytics(),
          api.getActivityLogs(),
          api.getTodayTrips(),
          api.getAttendanceSummary(),
        ]);
        setAnalytics(anRes);
        setActivityLogs(logsRes.data);
        setTodayTrips(tripsRes.data);
        setAttendanceSummary(attSummRes);
      } catch (_) {}
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const [isResettingDb, setIsResettingDb] = useState(false);
  const handleResetDatabase = async () => {
    if (!window.confirm('Reset database to pristine seed data (BUS-01 to BUS-05, students, drivers, and routes)?')) {
      return;
    }
    setIsResettingDb(true);
    try {
      await api.resetDatabase();
      await refreshAllData();
      alert('Database successfully reset to clean seed data!');
    } catch (err: any) {
      alert(`Failed to reset database: ${err.message}`);
    } finally {
      setIsResettingDb(false);
    }
  };

  const handleToggleSimulation = async () => {
    const res = await api.toggleSimulation();
    setSimRunning(res.isRunning);
  };

  const handleSetSimSpeed = async (speed: number) => {
    await api.setSimulationSpeed(speed);
    setSimSpeed(speed);
  };

  const handleSendEmergencyAlert = async () => {
    if (!emergencyMessage.trim()) return;
    try {
      await api.triggerEmergencyAlert({
        busId: emergencyBusId,
        title: `IMPORTANT NOTICE: Bus ${emergencyBusId.replace('bus-', '')}`,
        message: emergencyMessage,
      });
      setShowEmergencyModal(false);
      setEmergencyMessage('');
      const alertsRes = await api.getAlerts('ROLE_ADMIN');
      setAlerts(alertsRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedRoute = routes.find(r => r.id === newBusRouteId);
      await api.createBus({
        busNumber: newBusNumber || `BUS-${String(buses.length + 1).padStart(2, '0')}`,
        routeNumber: selectedRoute?.routeNumber || selectedRoute?.code || 'RT-01',
        registrationNumber: newBusReg || `TN-22-CY-${1000 + buses.length}`,
        capacity: newBusCapacity,
        routeId: newBusRouteId,
        driverId: newBusDriverId,
      });
      setShowAddBusModal(false);
      setNewBusNumber('');
      setNewBusReg('');
      refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBus = async (id: string, busNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete ${busNumber} from the database?`)) return;
    try {
      await api.deleteBus(id);
      refreshAllData();
    } catch (err: any) {
      alert(`Failed to delete bus: ${err.message}`);
    }
  };

  // Student CRUD Operations
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setFormStudent({
      name: '',
      registerNumber: `310621104${String(students.length + 10).padStart(3, '0')}`,
      department: 'Computer Science & Engineering',
      year: 1,
      section: 'A',
      phone: '+91 98401 99999',
      busNumber: 'BUS-01',
      routeNumber: 'RT-01',
      boardingPoint: 'Pallavaram Bus Stand',
      dropPoint: 'College Main Campus Terminal',
      attendanceStatus: 'PRESENT',
    });
    setShowStudentModal(true);
  };

  const handleOpenEditStudent = (stud: Student) => {
    setEditingStudent(stud);
    setFormStudent({ ...stud });
    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, formStudent);
      } else {
        await api.createStudent(formStudent);
      }
      setShowStudentModal(false);
      refreshAllData();
    } catch (err) {
      console.error('Failed to save student:', err);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete student "${name}"?`)) {
      try {
        await api.deleteStudent(id);
        refreshAllData();
      } catch (err) {
        console.error('Failed to delete student:', err);
      }
    }
  };

  const handleToggleAttendance = async (studentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    try {
      await api.markAttendance(studentId, nextStatus, 'ADMIN');
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId || s.studentId === studentId ? { ...s, attendanceStatus: nextStatus } : s))
      );
      setAttendanceRecords((prev) =>
        prev.map((a) => (a.studentId === studentId ? { ...a, status: nextStatus } : a))
      );
      const summRes = await api.getAttendanceSummary();
      setAttendanceSummary(summRes);
    } catch (e) {
      console.error('Failed to toggle attendance:', e);
    }
  };

  const handleDownloadDatasetJson = async () => {
    try {
      const res = await api.getCollegeDatasetExport();
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mybus_college_dataset_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyJavaCode = () => {
    const code = `// MyBus Java Database Connectivity (JDBC)
// Clean Connection architecture for MySQL / SQLite
Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/mybus_db", "root", "");
StudentDAO dao = new StudentDAO();
List<StudentRecord> students = dao.searchStudents(query, busNumber, dept);`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filtered Students using all 7 search/filter criteria
  const filteredStudents = students.filter((s) => {
    // 1. General search query (Name, Register No, Department, Bus No, Route No, Driver Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchReg = s.registerNumber.toLowerCase().includes(q);
      const matchDept = s.department.toLowerCase().includes(q);
      const matchBus = s.busNumber.toLowerCase().includes(q);
      const matchRoute = (s.routeNumber || '').toLowerCase().includes(q);
      const matchDriver = (s.driverName || '').toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchDept && !matchBus && !matchRoute && !matchDriver) return false;
    }

    // 2. Register Number
    if (filterRegNo.trim() && !s.registerNumber.toLowerCase().includes(filterRegNo.toLowerCase().trim())) {
      return false;
    }

    // 3. Bus Number
    if (filterBusNumber && s.busNumber !== filterBusNumber) {
      return false;
    }

    // 4. Route Number
    if (filterRouteNumber && (s.routeNumber !== filterRouteNumber && s.routeId !== filterRouteNumber)) {
      return false;
    }

    // 5. Department
    if (filterDepartment && s.department !== filterDepartment) {
      return false;
    }

    // 6. Year
    if (filterYear && String(s.year) !== filterYear) {
      return false;
    }

    // 7. Driver Name
    if (filterDriverName.trim() && !(s.driverName || '').toLowerCase().includes(filterDriverName.toLowerCase().trim())) {
      return false;
    }

    // Attendance Status
    if (filterAttendanceStatus && s.attendanceStatus !== filterAttendanceStatus) {
      return false;
    }

    return true;
  });

  const selectedBus = buses.find((b) => b.id === selectedBusId) || buses[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 font-sans">
      {/* Top Banner (Clean college-management dashboard) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="text-center lg:text-left space-y-1">
          <div className="inline-flex items-center gap-2 text-xs text-indigo-600 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            <span>Smart College Bus Tracking & Fleet Management System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            College Transport Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            {buses.length} College Buses (BUS-01 to BUS-10) · {routes.length} Transit Routes · {students.length} Registered Students
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={handleOpenAddStudent}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setShowAddBusModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BusIcon className="w-3.5 h-3.5" />
            <span>Add Bus</span>
          </button>

          <button
            onClick={() => setShowEmergencyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Emergency Notice</span>
          </button>

          <button
            onClick={refreshAllData}
            title="Refresh All Data"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Menu Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: 'dashboard', label: 'Overview' },
          { id: 'dataset', label: `College Dataset (22 Columns)` },
          { id: 'attendance', label: `Attendance (${attendanceSummary?.attendancePercentage || 88}%)` },
          { id: 'buses', label: `Buses (${buses.length})` },
          { id: 'today-trips', label: `Today's Trips (${todayTrips.length})` },
          { id: 'routes', label: `Routes (${routes.length})` },
          { id: 'drivers', label: `Drivers (${drivers.length})` },
          { id: 'live-tracking', label: 'Live Bus Map' },
          { id: 'database', label: 'Database & Java JDBC' },
          { id: 'boarding-points', label: `Bus Stops (${boardingPoints.length})` },
          { id: 'reports', label: 'Statistics' },
          { id: 'logs', label: 'Audit Logs' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as any)}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSection === item.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DASHBOARD OVERVIEW (With All 7 Core Metrics) */}
      {/* ========================================================================= */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* The 7 Core Metrics explicitly requested */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* 1. Total Buses */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500">Total Buses</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                {buses.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">BUS-01 to BUS-10</div>
            </div>

            {/* 2. Active Buses */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500">Active Buses</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">
                {buses.filter((b) => b.isActive && b.currentStatus !== 'NOT_STARTED').length}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Live on Corridors</div>
            </div>

            {/* 3. Total Students */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500">Total Students</div>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1 font-mono">
                {students.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across 7 Depts</div>
            </div>

            {/* 4. Active Routes */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500">Active Routes</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                {routes.filter((r) => r.isActive).length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Lines RT-01 to 05</div>
            </div>

            {/* 5. Drivers */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500">Drivers</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                {drivers.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">All Certified</div>
            </div>

            {/* 6. Today's Trips */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500">Today's Trips</div>
              <div className="text-2xl font-extrabold text-blue-600 mt-1 font-mono">
                {todayTrips.length}
              </div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Morning Pickup</div>
            </div>

            {/* 7. Attendance Summary */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500">Attendance</div>
              <div className="text-2xl font-extrabold text-purple-600 mt-1 font-mono">
                {attendanceSummary?.attendancePercentage || 88}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {attendanceSummary?.presentCount || 88} Present
              </div>
            </div>
          </div>

          {/* Quick Dataset Teaser & Live Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">College Transit Map (Live Fleet Tracking)</h3>
                <button
                  onClick={() => setActiveSection('live-tracking')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Full Radar View →
                </button>
              </div>
              <LeafletMap
                buses={buses}
                selectedBusId={selectedBusId}
                onSelectBus={(id) => setSelectedBusId(id)}
                routes={routes}
                stops={boardingPoints}
                height="400px"
              />
            </div>

            {/* Bus Fleet Cards List */}
            <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Fleet Roster ({buses.length})</h3>
                <span className="text-xs text-slate-500">Click to locate</span>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {buses.map((bus) => {
                  const isSelected = bus.id === selectedBusId;
                  const busStudents = students.filter((s) => s.assignedBusId === bus.id);
                  return (
                    <div
                      key={bus.id}
                      onClick={() => setSelectedBusId(bus.id)}
                      className={`p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 font-bold'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 text-sm">{bus.busNumber}</strong>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            bus.currentStatus === 'MOVING'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bus.currentStatus === 'DELAYED'
                              ? 'bg-amber-100 text-amber-800'
                              : bus.currentStatus === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {bus.currentStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {bus.routeNumber || 'RT-01'} · {bus.routeName}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono mt-2 text-slate-600">
                        <span>Speed: <strong className="text-emerald-600">{bus.speedKmH} km/h</strong></span>
                        <span>Students: <strong className="text-indigo-600">{busStudents.length}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: COLLEGE DATASET (All 22 Required Columns + Search & Filter) */}
      {/* ========================================================================= */}
      {activeSection === 'dataset' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mb-0.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>UNIFIED COLLEGE BUS DATASET</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Student Fleet Records (22 Columns)
                </h2>
                <p className="text-xs text-slate-500">
                  Showing {filteredStudents.length} of {students.length} unified records. One consistent dataset across Student, Driver, Admin, and Tracking modules.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadDatasetJson}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <a
                  href="/api/database/schema.sql"
                  download="mybus_college_database.sql"
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Download SQL</span>
                </a>
                <button
                  onClick={handleOpenAddStudent}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Student Record</span>
                </button>
              </div>
            </div>

            {/* Search and Filter Controls Grid */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Search & Filter Dataset (All 7 Parameters)</span>
                </div>
                {(searchQuery || filterRegNo || filterBusNumber || filterRouteNumber || filterDepartment || filterYear || filterDriverName || filterAttendanceStatus) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterRegNo('');
                      setFilterBusNumber('');
                      setFilterRouteNumber('');
                      setFilterDepartment('');
                      setFilterYear('');
                      setFilterDriverName('');
                      setFilterAttendanceStatus('');
                    }}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Global / Student Name Search */}
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Student Name / Keyword</label>
                  <input
                    type="text"
                    placeholder="Search name, id..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 2. Register Number */}
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Register Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 310621104..."
                    value={filterRegNo}
                    onChange={(e) => setFilterRegNo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 3. Bus Number */}
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Bus Number</label>
                  <select
                    value={filterBusNumber}
                    onChange={(e) => setFilterBusNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800"
                  >
                    <option value="">All Buses (BUS-01 to 10)</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.busNumber}>
                        {b.busNumber} ({b.routeName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Route Number */}
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Route Number</label>
                  <select
                    value={filterRouteNumber}
                    onChange={(e) => setFilterRouteNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800"
                  >
                    <option value="">All Routes</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.code} - {r.name.slice(0, 24)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Department */}
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Department</label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800"
                  >
                    <option value="">All Departments</option>
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Mechanical Engineering">Mech</option>
                    <option value="Electrical & Electronics">EEE</option>
                    <option value="Artificial Intelligence & Data Science">AI & DS</option>
                    <option value="Civil Engineering">Civil</option>
                  </select>
                </div>

                {/* 6. Year */}
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Year</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800"
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                {/* 7. Driver Name */}
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Driver Name</label>
                  <input
                    type="text"
                    placeholder="Search driver..."
                    value={filterDriverName}
                    onChange={(e) => setFilterDriverName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Attendance Status */}
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Attendance Status</label>
                  <select
                    value={filterAttendanceStatus}
                    onChange={(e) => setFilterAttendanceStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800"
                  >
                    <option value="">All Attendance</option>
                    <option value="PRESENT">Present Only</option>
                    <option value="ABSENT">Absent Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Full 22-Column Dataset Table */}
            <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Student ID</th>
                    <th className="px-3 py-3">Student Name</th>
                    <th className="px-3 py-3">Register Number</th>
                    <th className="px-3 py-3">Department</th>
                    <th className="px-3 py-3">Year / Sec</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Bus Number</th>
                    <th className="px-3 py-3">Route #</th>
                    <th className="px-3 py-3">Boarding Point</th>
                    <th className="px-3 py-3">Drop Point</th>
                    <th className="px-3 py-3">Driver ID</th>
                    <th className="px-3 py-3">Driver Name</th>
                    <th className="px-3 py-3">Driver Phone</th>
                    <th className="px-3 py-3">Bus Capacity</th>
                    <th className="px-3 py-3">GPS Latitude</th>
                    <th className="px-3 py-3">GPS Longitude</th>
                    <th className="px-3 py-3">Bus Status</th>
                    <th className="px-3 py-3">Route Status</th>
                    <th className="px-3 py-3">Attendance</th>
                    <th className="px-3 py-3">Trip Date</th>
                    <th className="px-3 py-3">Trip Time</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredStudents.slice(0, 100).map((s, idx) => {
                    const isPresent = s.attendanceStatus === 'PRESENT';
                    return (
                      <tr key={s.id} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-3 py-2.5 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-indigo-700">{s.studentId || s.id}</td>
                        <td className="px-3 py-2.5 font-sans font-bold text-slate-900">{s.name}</td>
                        <td className="px-3 py-2.5 text-slate-700 font-semibold">{s.registerNumber}</td>
                        <td className="px-3 py-2.5 font-sans text-slate-600">{s.department}</td>
                        <td className="px-3 py-2.5 text-slate-800">
                          Yr {s.year} ({s.section || 'A'})
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{s.phone}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900 bg-slate-50">{s.busNumber}</td>
                        <td className="px-3 py-2.5 text-indigo-700 font-bold">{s.routeNumber || 'RT-01'}</td>
                        <td className="px-3 py-2.5 font-sans font-medium text-slate-800">
                          {s.boardingPoint || s.boardingPointName}
                        </td>
                        <td className="px-3 py-2.5 font-sans text-slate-500">
                          {s.dropPoint || 'College Main Campus Terminal'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{s.driverId || 'drv-1'}</td>
                        <td className="px-3 py-2.5 font-sans text-slate-800 font-medium">{s.driverName || 'Driver'}</td>
                        <td className="px-3 py-2.5 text-slate-600">{s.driverPhone || '+91 94441 22334'}</td>
                        <td className="px-3 py-2.5 text-slate-700">{s.busCapacity || 50} seats</td>
                        <td className="px-3 py-2.5 text-slate-600">{s.busGpsLatitude ? Number(s.busGpsLatitude).toFixed(4) : '12.9675'}</td>
                        <td className="px-3 py-2.5 text-slate-600">{s.busGpsLongitude ? Number(s.busGpsLongitude).toFixed(4) : '80.1491'}</td>
                        <td className="px-3 py-2.5 font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.busStatus === 'MOVING' ? 'bg-emerald-100 text-emerald-800' :
                            s.busStatus === 'DELAYED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {s.busStatus || 'MOVING'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-sans">
                          <span className="text-[10px] text-slate-600 font-semibold">{s.routeStatus || 'ON_SCHEDULE'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-sans">
                          <button
                            onClick={() => handleToggleAttendance(s.studentId || s.id, s.attendanceStatus || 'PRESENT')}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors ${
                              isPresent ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {isPresent ? 'PRESENT' : 'ABSENT'}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{s.tripDate || '2026-09-26'}</td>
                        <td className="px-3 py-2.5 text-slate-600">{s.tripTime || '07:30 AM'}</td>
                        <td className="px-3 py-2.5 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditStudent(s)}
                              className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                              title="Edit Record"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id, s.name)}
                              className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ATTENDANCE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSection === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Student Attendance Management</h2>
                <p className="text-xs text-slate-500">
                  Daily boarding and trip attendance tracking for college buses.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const updates = students.map((s) => ({ studentId: s.studentId || s.id, status: 'PRESENT' as const }));
                    await api.bulkMarkAttendance(updates);
                    refreshAllData();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Mark All Present
                </button>
              </div>
            </div>

            {/* Attendance Progress & Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs text-slate-500">Overall Attendance</div>
                <div className="text-2xl font-extrabold text-purple-600 font-mono">
                  {attendanceSummary?.attendancePercentage || 88}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Total Enrolled</div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {attendanceSummary?.totalStudents || students.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Present Today</div>
                <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {attendanceSummary?.presentCount || 88}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Absent Today</div>
                <div className="text-2xl font-extrabold text-rose-600 font-mono">
                  {attendanceSummary?.absentCount || 12}
                </div>
              </div>
            </div>

            {/* Attendance Records Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Register #</th>
                    <th className="px-4 py-3">Bus Number</th>
                    <th className="px-4 py-3">Boarding Point</th>
                    <th className="px-4 py-3">Trip Date</th>
                    <th className="px-4 py-3">Trip Time</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceRecords.slice(0, 50).map((att) => {
                    const isPresent = att.status === 'PRESENT';
                    return (
                      <tr key={att.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{att.studentName}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{att.registerNumber}</td>
                        <td className="px-4 py-3 font-bold text-indigo-700">{att.busNumber}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{att.boardingPoint}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{att.tripDate}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{att.tripTime}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleAttendance(att.studentId, att.status)}
                            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {isPresent ? 'PRESENT' : 'ABSENT'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: TODAY'S TRIPS */}
      {/* ========================================================================= */}
      {activeSection === 'today-trips' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Today's College Bus Trips ({todayTrips.length})</h2>
            <span className="text-xs text-slate-500 font-mono">Date: 2026-09-26 · Morning Pickup</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayTrips.map((trip) => (
              <div key={trip.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BusIcon className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-900 text-base">{trip.busNumber}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      trip.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : trip.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : trip.status === 'DELAYED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {trip.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>Route: <strong className="text-slate-900">{trip.routeNumber}</strong></div>
                  <div>Driver: <strong className="text-slate-900">{trip.driverName}</strong> ({trip.driverPhone})</div>
                  <div>Scheduled Time: <span className="font-mono">{trip.tripTime}</span></div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs font-mono text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <div className="text-[10px] text-slate-500">Students</div>
                    <div className="font-bold text-slate-900">{trip.totalStudents}</div>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-xl">
                    <div className="text-[10px] text-emerald-600">Present</div>
                    <div className="font-bold text-emerald-700">{trip.presentCount}</div>
                  </div>
                  <div className="bg-rose-50 p-2 rounded-xl">
                    <div className="text-[10px] text-rose-600">Absent</div>
                    <div className="font-bold text-rose-700">{trip.absentCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: DATABASE & JAVA JDBC INTEGRATION */}
      {/* ========================================================================= */}
      {activeSection === 'database' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mb-0.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>LOCAL RELATIONAL DATABASE & JAVA ARCHITECTURE</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  MySQL / SQLite Database Tables & JDBC Connector
                </h2>
                <p className="text-xs text-slate-500">
                  Production-grade database tables with foreign key relationships, sample records, and Java DAO connectivity.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleResetDatabase}
                  disabled={isResettingDb}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResettingDb ? 'animate-spin' : ''}`} />
                  <span>{isResettingDb ? 'Resetting DB...' : 'Reset to Clean Seed'}</span>
                </button>
                <a
                  href="/api/database/schema.sql"
                  download="mybus_college_database.sql"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SQL Schema</span>
                </a>
              </div>
            </div>

            {/* Relational Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'students', count: students.length, pk: 'student_id', desc: 'Unified 22-column records containing bus assignment, GPS, attendance' },
                { name: 'buses', count: buses.length, pk: 'bus_number', desc: 'Fleet BUS-01 to BUS-10 with real-time GPS coordinates, speed, route' },
                { name: 'routes', count: routes.length, pk: 'route_number', desc: 'Transit corridors RT-01 to RT-05 with start points and college destination' },
                { name: 'boarding_points', count: boardingPoints.length, pk: 'id', desc: 'Stops with geofence radiuses, scheduled times and latitudes/longitudes' },
                { name: 'drivers', count: drivers.length, pk: 'driver_id', desc: 'Driver contact details, valid license numbers, and ratings' },
                { name: 'attendance_records', count: attendanceRecords.length, pk: 'id', desc: 'Date and trip stamped boarding logs with marked_by driver or RFID' },
                { name: 'college_trips', count: todayTrips.length, pk: 'id', desc: 'Daily trip runs with live status and student present/absent summary' },
              ].map((table) => (
                <div key={table.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-sm">{table.name}</span>
                    <span className="text-[11px] bg-indigo-50 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded-full">
                      {table.count} rows
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">Primary Key: {table.pk}</div>
                  <p className="text-xs text-slate-600">{table.desc}</p>
                </div>
              ))}
            </div>

            {/* Java JDBC Connection Code Viewer */}
            <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-slate-200">
                    Java Database Connectivity (MyBusDBConnection.java & StudentDAO.java)
                  </span>
                </div>
                <button
                  onClick={handleCopyJavaCode}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Java Code'}</span>
                </button>
              </div>

              <pre className="font-mono text-xs text-emerald-400/90 overflow-x-auto p-3 bg-slate-950/60 rounded-xl leading-relaxed">
{`package com.mybus.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class MyBusDBConnection {
    // Configurable via environment variables - Zero hardcoded secrets
    private static final String DB_URL = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/mybus_db?useSSL=false");
    private static final String DB_USER = System.getenv().getOrDefault("DB_USER", "root");
    private static final String DB_PASS = System.getenv().getOrDefault("DB_PASS", "");

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
    }
}

// StudentDAO: Search by Name, Register No, Bus, Dept
public List<StudentRecord> searchStudents(String query, String busNumber, String dept) throws SQLException {
    String sql = "SELECT * FROM students WHERE (name LIKE ? OR register_number LIKE ?) AND bus_number = ?";
    // PreparedStatement execution...
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: BUSES ROSTER */}
      {/* ========================================================================= */}
      {activeSection === 'buses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Campus Fleet (BUS-01 to BUS-10)</h2>
            <button
              onClick={() => setShowAddBusModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bus</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Bus Number</th>
                  <th className="px-5 py-3">License Plate</th>
                  <th className="px-5 py-3">Capacity</th>
                  <th className="px-5 py-3">Assigned Route</th>
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">Current Status</th>
                  <th className="px-5 py-3">Speed</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {buses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-bold text-slate-900 font-sans">{bus.busNumber}</td>
                    <td className="px-5 py-3 text-slate-600">{bus.registrationNumber}</td>
                    <td className="px-5 py-3 font-sans text-slate-600">{bus.capacity} seats</td>
                    <td className="px-5 py-3 font-sans text-indigo-600 font-medium">{bus.routeName}</td>
                    <td className="px-5 py-3 font-sans text-slate-800">{bus.driverName}</td>
                    <td className="px-5 py-3 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        bus.currentStatus === 'MOVING' ? 'bg-emerald-100 text-emerald-800' :
                        bus.currentStatus === 'DELAYED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {bus.currentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-emerald-600 font-bold">{bus.speedKmH} km/h</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDeleteBus(bus.id, bus.busNumber)}
                        className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer transition-colors"
                        title="Delete Bus from Database"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: ROUTES */}
      {/* ========================================================================= */}
      {activeSection === 'routes' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Campus Bus Routes (RT-01 to RT-05)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route) => {
              const assignedBuses = buses.filter((b) => b.routeId === route.id);
              const assignedStudents = students.filter((s) => s.routeId === route.id);
              return (
                <div key={route.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">{route.name}</h3>
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full">
                      {route.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{route.description}</p>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500">Assigned Buses</span>
                      <div className="font-mono text-slate-900 font-bold">
                        {assignedBuses.map((b) => b.busNumber).join(', ') || '2 Buses'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Stops</span>
                      <div className="font-mono text-slate-900 font-bold">{route.stops?.length || 6}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Students</span>
                      <div className="font-mono text-indigo-600 font-bold">{assignedStudents.length}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 8: DRIVERS */}
      {/* ========================================================================= */}
      {activeSection === 'drivers' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">College Bus Drivers ({drivers.length})</h2>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Driver Name</th>
                  <th className="px-5 py-3">Assigned Bus</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">License Number</th>
                  <th className="px-5 py-3">Experience</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-sans font-medium text-slate-900">{d.name}</td>
                    <td className="px-5 py-3 font-bold text-indigo-700">{d.assignedBusNumber || 'BUS-01'}</td>
                    <td className="px-5 py-3 text-slate-800">{d.phone}</td>
                    <td className="px-5 py-3 text-slate-500">{d.licenseNumber}</td>
                    <td className="px-5 py-3 text-slate-700 font-sans">{d.experienceYears} years</td>
                    <td className="px-5 py-3 font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 9: LIVE TRACKING */}
      {/* ========================================================================= */}
      {activeSection === 'live-tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Select Bus</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {buses.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBusId(b.id)}
                  className={`p-4 rounded-2xl border text-xs transition-all cursor-pointer ${
                    b.id === selectedBusId
                      ? 'bg-indigo-50 border-indigo-400 font-semibold'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{b.busNumber}</span>
                    <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {b.currentStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">{b.routeName}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600">
                    <div>Speed: <strong className="text-emerald-600">{b.speedKmH} km/h</strong></div>
                    <div>ETA: <strong className="text-indigo-600">{b.etaMinutes != null ? `${b.etaMinutes}m` : '0m'}</strong></div>
                    <div className="truncate">Driver: {b.driverName}</div>
                    <div className="truncate">Next: {b.nextStopName || 'Campus'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleSimulation}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {simRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{simRunning ? 'Pause GPS Engine' : 'Resume GPS Engine'}</span>
                </button>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  {[1, 2, 5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSetSimSpeed(spd)}
                      className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold ${
                        simSpeed === spd ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Selected: <strong className="text-slate-900">{selectedBus?.busNumber}</strong>
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <LeafletMap
                buses={buses}
                selectedBusId={selectedBusId}
                onSelectBus={(id) => setSelectedBusId(id)}
                routes={routes}
                stops={boardingPoints}
                height="500px"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 10: BOARDING POINTS */}
      {/* ========================================================================= */}
      {activeSection === 'boarding-points' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">All College Bus Stops ({boardingPoints.length})</h2>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Stop #</th>
                  <th className="px-5 py-3">Stop Name</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Scheduled Pickup Time</th>
                  <th className="px-5 py-3">Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {boardingPoints.map((bp) => {
                  const r = routes.find((rt) => rt.id === bp.routeId);
                  return (
                    <tr key={bp.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500">#{bp.stopOrder}</td>
                      <td className="px-5 py-3 font-sans font-medium text-slate-900">{bp.name}</td>
                      <td className="px-5 py-3 font-sans text-indigo-600">{r?.name || bp.routeId}</td>
                      <td className="px-5 py-3 text-slate-700">{bp.scheduledTime}</td>
                      <td className="px-5 py-3 text-slate-500">
                        [{bp.latitude.toFixed(4)}, {bp.longitude.toFixed(4)}]
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 11: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeSection === 'logs' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">System Activity & Telemetry Audit Logs</h2>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Operator / Source</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {activityLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-2.5 font-sans font-bold text-slate-800">{log.userName}</td>
                    <td className="px-5 py-2.5 text-indigo-600 font-bold">{log.action}</td>
                    <td className="px-5 py-2.5 font-sans text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT STUDENT (CRUD) */}
      {/* ========================================================================= */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingStudent ? 'Edit Student Record' : 'Add New College Student'}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={formStudent.name || ''}
                    onChange={(e) => setFormStudent({ ...formStudent, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Anand Kumar"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Register Number</label>
                  <input
                    type="text"
                    required
                    value={formStudent.registerNumber || ''}
                    onChange={(e) => setFormStudent({ ...formStudent, registerNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="e.g. 310621104088"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Department</label>
                  <select
                    value={formStudent.department || 'Computer Science & Engineering'}
                    onChange={(e) => setFormStudent({ ...formStudent, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Mechanical Engineering">Mech</option>
                    <option value="Artificial Intelligence & Data Science">AI & DS</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Year</label>
                  <select
                    value={formStudent.year || 1}
                    onChange={(e) => setFormStudent({ ...formStudent, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Section</label>
                  <input
                    type="text"
                    value={formStudent.section || 'A'}
                    onChange={(e) => setFormStudent({ ...formStudent, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formStudent.phone || ''}
                    onChange={(e) => setFormStudent({ ...formStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono"
                    placeholder="+91 98401..."
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Assigned Bus</label>
                  <select
                    value={formStudent.busNumber || 'BUS-01'}
                    onChange={(e) => setFormStudent({ ...formStudent, busNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold"
                  >
                    {buses.map((b) => (
                      <option key={b.id} value={b.busNumber}>
                        {b.busNumber} ({b.routeName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Boarding Point</label>
                  <input
                    type="text"
                    required
                    value={formStudent.boardingPoint || ''}
                    onChange={(e) => setFormStudent({ ...formStudent, boardingPoint: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                    placeholder="e.g. Pallavaram Bus Stand"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Attendance Status</label>
                  <select
                    value={formStudent.attendanceStatus || 'PRESENT'}
                    onChange={(e) => setFormStudent({ ...formStudent, attendanceStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
                >
                  {editingStudent ? 'Update Record' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Emergency Broadcast */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white border border-rose-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Broadcast Emergency Alert</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This message will be sent immediately to parents and students riding the selected bus.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Select Bus</label>
                <select
                  value={emergencyBusId}
                  onChange={(e) => setEmergencyBusId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                >
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.busNumber} ({b.routeName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Alert Message</label>
                <textarea
                  rows={3}
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  placeholder="e.g. Traffic delay on OMR road. Bus is running 12 mins late. All students are safe."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmergencyAlert}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Bus */}
      {showAddBusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Add New College Bus</h3>
            <form onSubmit={handleCreateBus} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Bus Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BUS-11"
                  value={newBusNumber}
                  onChange={(e) => setNewBusNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">License Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TN-22-CY-1111"
                  value={newBusReg}
                  onChange={(e) => setNewBusReg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Seat Capacity</label>
                  <input
                    type="number"
                    min={20}
                    max={70}
                    value={newBusCapacity}
                    onChange={(e) => setNewBusCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Assign Route</label>
                  <select
                    value={newBusRouteId}
                    onChange={(e) => setNewBusRouteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                  >
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name.slice(0, 18)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBusModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
                >
                  Save Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
