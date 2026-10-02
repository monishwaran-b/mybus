import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import type { Bus, Route, BoardingPoint, Alert, TrackingHistoryItem, Student, BusStatus } from '../../types/index.ts';
import { LeafletMap } from '../map/LeafletMap.tsx';
import {
  Bus as BusIcon,
  MapPin,
  Clock,
  Bell,
  CheckCircle2,
  Navigation,
  History,
  Phone,
  User as UserIcon,
  Shield,
  Circle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Mic,
  QrCode,
} from 'lucide-react';
import { TransitMapsAssistantView } from '../transit-ai/TransitMapsAssistantView.tsx';
import { VoiceTranscriberModal } from '../voice/VoiceTranscriberModal.tsx';

const getSimpleStatusBadge = (status: BusStatus) => {
  switch (status) {
    case 'ON_TRIP':
    case 'STARTED':
    case 'MOVING':
      return { label: '🟢 ON TRIP', desc: 'In Transit', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'APPROACHING_STOP':
      return { label: '🟢 APPROACHING', desc: 'Near Stop', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'ARRIVED_AT_STOP':
      return { label: '🟡 AT STOP', desc: 'Boarding', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'STOPPED':
      return { label: '🟡 STOPPED', desc: 'Halted', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'ARRIVED_AT_COLLEGE':
    case 'AT_COLLEGE':
      return { label: '🔵 REACHED COLLEGE', desc: 'At Campus', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'COMPLETED':
      return { label: '⚪ COMPLETED', desc: 'Trip Ended', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'NOT_STARTED':
      return { label: '⚪ NOT STARTED', desc: 'At Depot', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    case 'DELAYED':
      return { label: '🟡 DELAYED', desc: 'Signal Lag', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'OFFLINE':
    default:
      return { label: '🔴 OFFLINE', desc: 'No Recent GPS', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
};

const formatLastUpdated = (dateStr?: string) => {
  if (!dateStr) return 'No GPS data';
  const sec = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
  if (sec < 5) return 'Just now';
  if (sec < 35) return `${sec}s ago`;
  if (sec < 120) return `${sec}s ago (Location delayed)`;
  return `${Math.floor(sec / 60)}m ago (Offline)`;
};

export const StudentPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracking' | 'route' | 'alerts' | 'history' | 'profile' | 'maps-ai'>('dashboard');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(user?.studentId || 'stud-1');
  const [student, setStudent] = useState<Student | null>(null);
  const [bus, setBus] = useState<Bus | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<BoardingPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<TrackingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load student list for switching
  useEffect(() => {
    api.getStudents({ limit: 100 })
      .then((res) => setAllStudents(res.data))
      .catch(() => {});
  }, []);

  // Load student data
  const loadData = async (studId: string) => {
    try {
      setError(null);
      const studRes = await api.getStudentById(studId);
      setStudent(studRes.student);
      setRoute(studRes.route || null);
      if (studRes.bus) {
        setBus(studRes.bus);
        const trackRes = await api.getBusTracking(studRes.bus.id);
        setBus(trackRes.bus);
        setStops(trackRes.stops || []);
        setHistory(trackRes.recentHistory || []);
      }

      // Fetch alerts for student
      const alertsRes = await api.getAlerts('ROLE_STUDENT', studId);
      setAlerts(alertsRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load student bus information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedStudentId);
  }, [selectedStudentId]);

  // Real-Time Server-Sent Events (SSE) Listener
  useEffect(() => {
    const unsubscribe = api.subscribeToTrackingStream((event) => {
      if (event.type === 'BUS_LOCATION_UPDATE' || event.type === 'BUS_STATUS_UPDATE') {
        const payloadBus = event.payload;
        if (payloadBus && bus && (payloadBus.busNumber === bus.busNumber || payloadBus.id === bus.id)) {
          setBus(payloadBus);
        }
      } else if (event.type === 'TRIP_STARTED' || event.type === 'TRIP_COMPLETED') {
        if (event.payload?.bus?.busNumber === bus?.busNumber) {
          setBus(event.payload.bus);
        }
      } else if (event.type === 'STUDENT_UPDATED' && event.payload?.id === student?.id) {
        setStudent(event.payload);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [bus?.busNumber, bus?.id, student?.id]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (bus?.id) {
        try {
          const trackRes = await api.getBusTracking(bus.id);
          setBus(trackRes.bus);
          setStops(trackRes.stops || []);
          setHistory(trackRes.recentHistory || []);

          const alertsRes = await api.getAlerts('ROLE_STUDENT', selectedStudentId);
          setAlerts(alertsRes.data);
        } catch (e) {
          // Polling silent error
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [bus?.id, selectedStudentId]);

  const handleToggleAttendance = async () => {
    if (!student) return;
    setIsCheckingIn(true);
    try {
      const nextStatus = student.attendanceStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
      await api.markAttendance(student.studentId || student.id, nextStatus, 'RFID_TAP');
      setStudent((prev) => prev ? { ...prev, attendanceStatus: nextStatus } : prev);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      await api.markAlertRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-[#f8fafc]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Loading Student Information...</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to live bus map</p>
      </div>
    );
  }

  if (error || !student || !bus) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-[#f8fafc]">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Unable to Connect</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Could not find your assigned bus.'}</p>
        <button
          onClick={() => loadData(selectedStudentId)}
          className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 font-sans">
      {/* Student Welcome Header & Switcher */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left space-y-1">
          <div className="inline-flex items-center gap-2 text-xs text-indigo-600 font-semibold">
            <span>Student Bus Pass</span>
            <span>·</span>
            <span className="font-mono">{student.registerNumber}</span>
            <span>·</span>
            <span className="font-mono font-bold text-slate-800">{student.studentId || 'STU-001'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Welcome, {student.name}
          </h1>
          <p className="text-xs text-slate-500">
            {student.department} · Year {student.year} ({student.section || 'A'}) · Boarding: <strong className="text-slate-800">{student.boardingPoint || student.boardingPointName}</strong>
          </p>
        </div>

        {/* Student Switcher & Quick Bus Badge */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {allStudents.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Switch Student:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-transparent text-xs font-bold text-indigo-700 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {allStudents.slice(0, 30).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.busNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
            <div>
              <div className="text-[10px] font-medium text-slate-500">Assigned Bus</div>
              <div className="text-sm font-bold text-slate-900">{bus.busNumber}</div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] font-medium text-slate-500">Bus Status</div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{bus.currentStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Clear normal English words, lite colors) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          Overview & Live Bus
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'tracking'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Full Map View</span>
        </button>

        <button
          onClick={() => setActiveTab('route')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'route'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          All Bus Stops ({stops.length})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'alerts'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <span>Notifications</span>
          {alerts.filter((a) => !a.isRead).length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {alerts.filter((a) => !a.isRead).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          Past Trip Times
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          Digital Bus Pass & Profile
        </button>

        <button
          onClick={() => setActiveTab('maps-ai')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'maps-ai'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-cyan-700 bg-cyan-50 hover:bg-cyan-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stop Surroundings (AI)</span>
        </button>
      </div>

      {/* Tab 1: Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics Cards (Steady, light, simple English) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Estimated Arrival</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">
                {bus.etaMinutes != null ? `${bus.etaMinutes} min` : '5 min'}
              </div>
              <div className="text-xs text-slate-500">To {student.boardingPoint || student.boardingPointName}</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Bus Status & Speed</span>
                <BusIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono flex items-center gap-2">
                {(() => {
                  const badge = getSimpleStatusBadge(bus.currentStatus);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  );
                })()}
                <span className="text-sm font-bold text-slate-600 font-mono">{bus.speedKmH} km/h</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                <span className="truncate">Next: <strong>{bus.nextStopName || 'Campus'}</strong></span>
                <span className="text-slate-400 font-mono text-[10px]">{formatLastUpdated(bus.lastGpsUpdate)}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Today's Attendance</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                  student.attendanceStatus === 'PRESENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {student.attendanceStatus === 'PRESENT' ? '● PRESENT' : '● ABSENT'}
                </span>
                <button
                  onClick={handleToggleAttendance}
                  disabled={isCheckingIn}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] transition-colors cursor-pointer"
                >
                  {student.attendanceStatus === 'PRESENT' ? 'Set Absent' : 'RFID Tap'}
                </button>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Trip: 2026-09-26 07:30 AM</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Driver Contact</span>
                <Phone className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-base font-bold text-slate-900 truncate">
                {bus.driverName || 'Muthuvelan R.'}
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>{bus.driverPhone || '+91 94441 22334'}</span>
                <a
                  href={`tel:${bus.driverPhone || '+919444122334'}`}
                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]"
                >
                  Call
                </a>
              </div>
            </div>
          </div>

          {/* Route & Journey Details Strip */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono font-bold">
                {student.routeNumber || 'RT-01'}
              </div>
              <div>
                <span className="font-bold text-slate-900">{route?.name || 'Campus Transit Route'}</span>
                <div className="text-slate-500 text-[11px]">
                  Boarding: <strong>{student.boardingPoint || student.boardingPointName}</strong> → Drop: <strong>{student.dropPoint || 'College Main Campus Terminal'}</strong>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px]">
              <div>Distance: <strong className="text-slate-900">{route?.totalDistanceKm || 28} km</strong></div>
              <div>Bus Capacity: <strong className="text-slate-900">{bus.capacity} seats</strong></div>
            </div>
          </div>

          {/* Live Map & Stop Timeline (Centered, clean layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Live Map - {bus.busNumber}</h3>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Updating Every 3s</span>
                </span>
              </div>
              <LeafletMap
                buses={[bus]}
                selectedBusId={bus.id}
                routes={route ? [route] : []}
                stops={stops}
                highlightedRouteId={route?.id}
                trackingHistory={history}
                height="420px"
              />
            </div>

            <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Stops</h3>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {stops.map((stop, idx) => {
                  const isUserStop = stop.id === student.boardingPointId;
                  const isCurrentTarget = bus.nextStopName === stop.name;

                  return (
                    <div
                      key={stop.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isUserStop
                          ? 'bg-indigo-50 border-indigo-300 font-semibold text-indigo-900'
                          : isCurrentTarget
                          ? 'bg-amber-50 border-amber-300 font-semibold text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span>{idx + 1}. {stop.name}</span>
                          {isUserStop && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                              Your Stop
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Scheduled: {stop.scheduledTime}
                        </div>
                      </div>

                      <div className="text-right">
                        {isCurrentTarget ? (
                          <span className="text-[11px] text-amber-700 font-bold">Bus Near</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Stop #{stop.stopOrder}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Full Screen Live Tracking */}
      {activeTab === 'tracking' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live Map: {bus.busNumber}</h2>
              <p className="text-xs text-slate-500">Route: {bus.routeName}</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-emerald-600 font-mono">● {bus.speedKmH} km/h</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-700">Next Stop: {bus.nextStopName || 'Approaching'}</span>
            </div>
          </div>

          <LeafletMap
            buses={[bus]}
            selectedBusId={bus.id}
            routes={route ? [route] : []}
            stops={stops}
            highlightedRouteId={route?.id}
            trackingHistory={history}
            height="560px"
          />
        </div>
      )}

      {/* Tab 3: Route & Stops */}
      {activeTab === 'route' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-lg font-bold text-slate-900">{route?.name}</h3>
            <p className="text-xs text-slate-500">{route?.description}</p>
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <div><strong>Start:</strong> {route?.startPoint}</div>
              <div><strong>End:</strong> {route?.endPoint}</div>
              <div><strong>Total Stops:</strong> {stops.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Stop #</th>
                  <th className="px-5 py-3">Stop Name</th>
                  <th className="px-5 py-3">Arrival Time</th>
                  <th className="px-5 py-3">Your Pickup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {stops.map((stop) => (
                  <tr
                    key={stop.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      stop.id === student.boardingPointId ? 'bg-indigo-50/50 font-bold' : ''
                    }`}
                  >
                    <td className="px-5 py-3 text-slate-500">#{stop.stopOrder}</td>
                    <td className="px-5 py-3 font-sans font-medium text-slate-900">{stop.name}</td>
                    <td className="px-5 py-3 text-slate-700">{stop.scheduledTime}</td>
                    <td className="px-5 py-3 font-sans">
                      {stop.id === student.boardingPointId ? (
                        <span className="text-indigo-600 font-bold">★ Your Stop</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Alerts */}
      {activeTab === 'alerts' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Your Notifications</h2>
            <span className="text-xs text-slate-500">Messages about your bus and stop</span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              No new alerts. Your bus is running on normal schedule.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    alert.isRead
                      ? 'bg-slate-50 border-slate-200 text-slate-600'
                      : 'bg-indigo-50/40 border-indigo-200 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{alert.title}</span>
                        {!alert.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{alert.message}</p>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(alert.createdAt).toLocaleTimeString()} · Bus: {alert.busNumber || 'N/A'}
                      </div>
                    </div>
                    {!alert.isRead && (
                      <button
                        onClick={() => handleMarkAlertRead(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Past Trip Times */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Recent Bus GPS Log</h2>
            <span className="text-xs text-slate-500 font-mono">{history.length} points logged</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Bus Speed</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {history.slice(0, 20).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5 text-emerald-600 font-bold">{item.speedKmH} km/h</td>
                    <td className="px-4 py-2.5 text-slate-700 font-sans">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Profile & Digital Bus Pass */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl font-display shadow-sm">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
              <div className="text-xs text-slate-500">{student.email}</div>
              <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Active Bus Pass (Spring 2026)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Student ID Number</span>
              <div className="font-mono text-slate-900 font-bold text-sm mt-0.5">{student.registerNumber}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Department</span>
              <div className="text-slate-900 font-bold text-sm mt-0.5">{student.department}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Assigned Bus</span>
              <div className="text-slate-900 font-bold text-sm mt-0.5">{bus.busNumber} ({bus.registrationNumber})</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Pickup Bus Stop</span>
              <div className="text-indigo-600 font-bold text-sm mt-0.5">{student.boardingPointName}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Parent Contact</span>
              <div className="text-slate-900 font-bold text-sm mt-0.5">{student.linkedParentName}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Parent Phone</span>
              <div className="font-mono text-slate-900 font-bold text-sm mt-0.5">{student.linkedParentPhone}</div>
            </div>
          </div>

          {/* Digital Bus Pass Card */}
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 text-center space-y-3">
            <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">College Digital Bus Pass</div>
            <div className="w-28 h-28 mx-auto bg-white rounded-xl p-2 border border-indigo-200 shadow-xs flex items-center justify-center">
              <QrCode className="w-24 h-24 text-slate-800" />
            </div>
            <p className="text-xs text-indigo-700">
              Show this QR code or tap your RFID college card when entering Bus {bus.busNumber}.
            </p>
          </div>
        </div>
      )}

      {/* Tab 7: AI Stop Surroundings */}
      {activeTab === 'maps-ai' && (
        <div className="pt-2">
          <TransitMapsAssistantView defaultBoardingPointId={student.boardingPointId} />
        </div>
      )}

      {/* Voice Transcriber Modal */}
      <VoiceTranscriberModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        title="Voice Question"
        subtitle="Speak your question about your college bus."
      />
    </div>
  );
};
