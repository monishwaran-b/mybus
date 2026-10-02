import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import type { Bus, Route, BoardingPoint, Student, Driver, AttendanceRecord, AttendanceSummary, BusStatus } from '../../types/index.ts';
import { LeafletMap } from '../map/LeafletMap.tsx';
import {
  Bus as BusIcon,
  Play,
  Square,
  Navigation,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Phone,
  Radio,
  Send,
  Compass,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export const DriverPortal: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('drv-1');
  const [bus, setBus] = useState<Bus | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<BoardingPoint[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [allBuses, setAllBuses] = useState<Bus[]>([]);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Tracking Mode: LIVE GPS (Real device coordinates) vs DEMO TRACKING (Database route coordinates)
  const [trackingMode, setTrackingMode] = useState<'LIVE_GPS' | 'DEMO_TRACKING'>('DEMO_TRACKING');
  const [isGeoTracking, setIsGeoTracking] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isAutoDemoRunning, setIsAutoDemoRunning] = useState(false);
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState(0);

  // Manual / Custom GPS coordinate updater state
  const [customLat, setCustomLat] = useState<number>(12.9250);
  const [customLng, setCustomLng] = useState<number>(80.1170);
  const [customSpeed, setCustomSpeed] = useState<number>(35);

  const fetchDriverData = async (driverId: string) => {
    try {
      const [driversRes, liveRes, routesRes] = await Promise.all([
        api.getDrivers(),
        api.getLiveTracking(),
        api.getRoutes(),
      ]);

      setDrivers(driversRes.data);
      setAllBuses(liveRes.buses);
      setAllRoutes(routesRes.data);

      const currentDriver = driversRes.data.find((d) => d.id === driverId) || driversRes.data[0];
      if (currentDriver) {
        // Find bus assigned to this driver
        const assignedBus = liveRes.buses.find(
          (b) => b.driverId === currentDriver.id || b.busNumber === currentDriver.assignedBusNumber
        ) || liveRes.buses[0];

        setBus(assignedBus);
        setCustomLat(assignedBus.latitude);
        setCustomLng(assignedBus.longitude);
        setCustomSpeed(assignedBus.speedKmH);

        // Find route
        const assignedRoute = routesRes.data.find((r) => r.id === assignedBus.routeId) || routesRes.data[0];
        setRoute(assignedRoute);

        // Load stops for route
        if (assignedRoute) {
          const stopsRes = await api.getBoardingPoints(assignedRoute.id);
          setStops(stopsRes.data.sort((a, b) => a.stopOrder - b.stopOrder));
        }

        // Load students assigned to this bus
        const studRes = await api.getStudents({ busNumber: assignedBus.busNumber, limit: 100 });
        setStudents(studRes.data);

        // Load attendance
        const attRes = await api.getAttendance({ busNumber: assignedBus.busNumber });
        setAttendanceRecords(attRes.data);
      }
    } catch (e) {
      console.error('Error fetching driver console data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData(selectedDriverId);
  }, [selectedDriverId]);

  // Periodic poll to keep bus telemetry fresh
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!bus?.busNumber) return;
      try {
        const liveRes = await api.getLiveTracking();
        const updatedBus = liveRes.buses.find((b) => b.busNumber === bus.busNumber);
        if (updatedBus) {
          setBus(updatedBus);
          setAllBuses(liveRes.buses);
        }
      } catch (_) {}
    }, 3500);

    return () => clearInterval(interval);
  }, [bus?.busNumber]);

  const activeDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];

  const handleStartTrip = async () => {
    if (!bus) return;
    setIsUpdating(true);
    try {
      const res = await api.driverStartTrip(bus.busNumber);
      setBus(res.bus);
      setMessage({ text: `Transit Trip Started for ${bus.busNumber}. GPS active!`, type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage({ text: e.message || 'Failed to start trip', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStopTrip = async () => {
    if (!bus) return;
    setIsUpdating(true);
    try {
      const res = await api.driverStopTrip(bus.busNumber);
      setBus(res.bus);
      setMessage({ text: `Transit Trip Completed for ${bus.busNumber}.`, type: 'info' });
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage({ text: e.message || 'Failed to stop trip', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (status: BusStatus) => {
    if (!bus) return;
    setIsUpdating(true);
    try {
      const res = await api.driverUpdateStatus(bus.busNumber, status);
      setBus(res.bus);
      setMessage({ text: `Bus status updated to: ${status}`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage({ text: e.message || 'Failed to update status', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Cleanup GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const handleToggleLiveGps = () => {
    if (isGeoTracking) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsGeoTracking(false);
      setMessage({ text: 'Live GPS tracking stopped on device.', type: 'info' });
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Geolocation API is not supported by your browser.');
      return;
    }

    setGeoError(null);
    try {
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, speed, heading } = position.coords;
          setCustomLat(latitude);
          setCustomLng(longitude);
          const kmh = speed ? Math.round(speed * 3.6) : 32;
          setCustomSpeed(kmh);

          if (bus) {
            try {
              const res = await api.driverUpdateLocation({
                busNumber: bus.busNumber,
                latitude,
                longitude,
                speedKmH: kmh,
                heading: heading || bus.heading,
              });
              setBus(res.bus);
            } catch (_) {}
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            setGeoError('Location permission is required to start live bus tracking.');
          } else {
            setGeoError(`Location error: ${error.message}`);
          }
          setIsGeoTracking(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        }
      );

      setWatchId(id);
      setIsGeoTracking(true);
      setMessage({ text: 'Live GPS sensor connected! Transmitting real coordinates.', type: 'success' });
    } catch (_) {
      setGeoError('Location permission is required to start live bus tracking.');
    }
  };

  // Auto-run Demo Stepper
  useEffect(() => {
    if (!isAutoDemoRunning || !route || !route.waypoints || route.waypoints.length === 0 || !bus) {
      return;
    }

    const waypoints = route.waypoints;
    const interval = setInterval(() => {
      setCurrentWaypointIdx((prev) => {
        const nextIdx = (prev + 1) % waypoints.length;
        const targetPoint = waypoints[nextIdx];
        setCustomLat(targetPoint[0]);
        setCustomLng(targetPoint[1]);
        setCustomSpeed(36);

        api.driverUpdateLocation({
          busNumber: bus.busNumber,
          latitude: targetPoint[0],
          longitude: targetPoint[1],
          speedKmH: 36,
        }).then((res) => {
          setBus(res.bus);
        }).catch(() => {});

        return nextIdx;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isAutoDemoRunning, route, bus?.busNumber]);

  const handleUpdateLocation = async () => {
    if (!bus) return;
    setIsUpdating(true);
    try {
      const res = await api.driverUpdateLocation({
        busNumber: bus.busNumber,
        latitude: customLat,
        longitude: customLng,
        speedKmH: customSpeed,
        heading: bus.heading,
      });
      setBus(res.bus);
      setMessage({ text: `GPS coordinates transmitted to Central Control and Students!`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage({ text: e.message || 'Failed to update location', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStepAlongRoute = async () => {
    if (!bus || !route || !route.waypoints || route.waypoints.length === 0) return;
    setIsUpdating(true);
    try {
      // Find nearest waypoint index
      let closestIdx = 0;
      let closestDist = Infinity;
      route.waypoints.forEach((wp, idx) => {
        const d = Math.hypot(wp[0] - bus.latitude, wp[1] - bus.longitude);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = idx;
        }
      });

      const nextIdx = (closestIdx + 1) % route.waypoints.length;
      const targetPoint = route.waypoints[nextIdx];

      setCustomLat(targetPoint[0]);
      setCustomLng(targetPoint[1]);
      setCustomSpeed(38);

      const res = await api.driverUpdateLocation({
        busNumber: bus.busNumber,
        latitude: targetPoint[0],
        longitude: targetPoint[1],
        speedKmH: 38,
      });
      setBus(res.bus);
      setMessage({ text: `Advanced ${bus.busNumber} to Waypoint #${nextIdx + 1} (${targetPoint[0].toFixed(4)}, ${targetPoint[1].toFixed(4)})`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage({ text: e.message || 'Failed to advance along route', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAttendance = async (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    try {
      await api.markAttendance(studentId, status, 'DRIVER');
      // Update local state
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId || s.studentId === studentId ? { ...s, attendanceStatus: status } : s))
      );
      setAttendanceRecords((prev) =>
        prev.map((a) => (a.studentId === studentId ? { ...a, status, markedAt: new Date().toISOString() } : a))
      );
    } catch (e: any) {
      setMessage({ text: 'Failed to record attendance', type: 'error' });
    }
  };

  const handleMarkAllPresent = async () => {
    try {
      const updates = students.map((s) => ({
        studentId: s.studentId || s.id,
        status: 'PRESENT' as const,
      }));
      await api.bulkMarkAttendance(updates);
      setStudents((prev) => prev.map((s) => ({ ...s, attendanceStatus: 'PRESENT' })));
      setMessage({ text: `All ${students.length} students marked PRESENT for ${bus?.busNumber}`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage({ text: 'Bulk attendance update failed', type: 'error' });
    }
  };

  const presentCount = students.filter((s) => s.attendanceStatus === 'PRESENT').length;
  const absentCount = students.filter((s) => s.attendanceStatus === 'ABSENT').length;
  const attendancePct = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-[#f8fafc]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Loading Driver Transit Console...</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to vehicle GPS and student roster</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 font-sans">
      {/* Top Banner & Driver Selector */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 text-xs text-indigo-600 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            <span>Driver Operations & Telemetry Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Driver Module: {bus?.busNumber || 'BUS-01'}
          </h1>
          <p className="text-xs text-slate-500">
            Assigned: {activeDriver?.name || 'Driver'} ({activeDriver?.phone}) · Route: {bus?.routeName || 'Campus Transit'}
          </p>
        </div>

        {/* Driver Selector Switcher */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="text-xs font-medium text-slate-600">Select Driver / Bus:</div>
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.assignedBusNumber || 'BUS-01'} ({d.phone})
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchDriverData(selectedDriverId)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert / Notification Feedback Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : message.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Quick Trip Controls & Bus Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Assigned Bus Info */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BusIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display">{bus?.busNumber}</h3>
                <span className="text-[11px] font-mono text-slate-500">{bus?.registrationNumber}</span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                bus?.currentStatus === 'MOVING'
                  ? 'bg-emerald-50 text-emerald-700'
                  : bus?.currentStatus === 'DELAYED'
                  ? 'bg-amber-50 text-amber-700'
                  : bus?.currentStatus === 'COMPLETED'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {bus?.currentStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs font-mono">
            <div>
              <span className="text-slate-500 font-sans">Capacity:</span>
              <div className="text-slate-900 font-bold">{bus?.capacity || 50} Seats</div>
            </div>
            <div>
              <span className="text-slate-500 font-sans">Speed:</span>
              <div className="text-emerald-600 font-bold">{bus?.speedKmH || 0} km/h</div>
            </div>
            <div>
              <span className="text-slate-500 font-sans">Route Line:</span>
              <div className="text-indigo-600 font-bold">{bus?.routeNumber || 'RT-01'}</div>
            </div>
            <div>
              <span className="text-slate-500 font-sans">Next Stop:</span>
              <div className="text-slate-900 font-bold truncate">{bus?.nextStopName || 'Campus'}</div>
            </div>
          </div>

          {/* Trip Start / Stop Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleStartTrip}
              disabled={isUpdating || bus?.currentStatus === 'MOVING'}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                bus?.currentStatus === 'MOVING'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Trip</span>
            </button>
            <button
              onClick={handleStopTrip}
              disabled={isUpdating || bus?.currentStatus === 'COMPLETED'}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                bus?.currentStatus === 'COMPLETED'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop Trip</span>
            </button>
          </div>
        </div>

        {/* Card 2: Update Bus Status Panel */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Update Bus Status</h3>
            <span className="text-[11px] text-slate-500">Live sync to Admin & Students</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { status: 'MOVING' as BusStatus, label: 'Active / Moving', color: 'hover:border-emerald-500' },
              { status: 'APPROACHING_STOP' as BusStatus, label: 'Approaching Stop', color: 'hover:border-indigo-500' },
              { status: 'ARRIVED_AT_STOP' as BusStatus, label: 'Arrived at Stop', color: 'hover:border-blue-500' },
              { status: 'DELAYED' as BusStatus, label: 'Delayed (+15m)', color: 'hover:border-amber-500' },
              { status: 'STOPPED' as BusStatus, label: 'Stopped / Paused', color: 'hover:border-slate-500' },
              { status: 'COMPLETED' as BusStatus, label: 'Trip Completed', color: 'hover:border-purple-500' },
            ].map((st) => (
              <button
                key={st.status}
                onClick={() => handleUpdateStatus(st.status)}
                disabled={isUpdating}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-medium ${st.color} ${
                  bus?.currentStatus === st.status
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold ring-1 ring-indigo-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card 3: GPS Telemetry & Tracking Modes */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Location Telemetry</h3>
            {trackingMode === 'LIVE_GPS' ? (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${isGeoTracking ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {isGeoTracking ? '● SENSOR CONNECTED' : '○ GPS IDLE'}
              </span>
            ) : (
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                DEMO TRACKING
              </span>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setTrackingMode('DEMO_TRACKING');
                if (isGeoTracking) handleToggleLiveGps();
              }}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                trackingMode === 'DEMO_TRACKING'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo Tracking
            </button>
            <button
              onClick={() => {
                setTrackingMode('LIVE_GPS');
                setIsAutoDemoRunning(false);
              }}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                trackingMode === 'LIVE_GPS'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Device GPS
            </button>
          </div>

          {/* Mode 1: DEMO TRACKING (Database Route Coordinates) */}
          {trackingMode === 'DEMO_TRACKING' && (
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 leading-snug">
                <strong>Demo Mode Active:</strong> Feeds actual database route waypoints through the live tracking pipeline.
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAutoDemoRunning(!isAutoDemoRunning)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    isAutoDemoRunning
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isAutoDemoRunning ? 'Pause Auto-Transit' : 'Auto-Step Transit (3s)'}</span>
                </button>
                <button
                  onClick={handleStepAlongRoute}
                  disabled={isUpdating}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer"
                  title="Move to next route point"
                >
                  Step Next
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                <span>Waypoint #{currentWaypointIdx + 1} of {route?.waypoints?.length || 10}</span>
                <span>Lat: {customLat.toFixed(4)}, Lng: {customLng.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* Mode 2: LIVE DEVICE GPS (Browser watchPosition) */}
          {trackingMode === 'LIVE_GPS' && (
            <div className="space-y-2.5 text-xs">
              {geoError ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{geoError}</span>
                  </div>
                  <button
                    onClick={handleToggleLiveGps}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Retry Permission
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div>Status: <strong>{isGeoTracking ? 'Receiving real-time coordinates' : 'Ready to connect'}</strong></div>
                  {isGeoTracking && (
                    <div className="font-mono text-[10px] text-slate-500">
                      Coords: {customLat.toFixed(5)}, {customLng.toFixed(5)} ({customSpeed} km/h)
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleToggleLiveGps}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isGeoTracking
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isGeoTracking ? 'animate-pulse' : ''}`} />
                <span>{isGeoTracking ? 'Stop Live GPS Sensor' : 'Start Device GPS Tracking'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map View & Route Stops */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Live Map: {bus?.busNumber} on {route?.name}
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Lat: {bus?.latitude.toFixed(4)}, Lng: {bus?.longitude.toFixed(4)}
            </span>
          </div>
          <LeafletMap
            buses={bus ? [bus] : allBuses}
            selectedBusId={bus?.id}
            routes={route ? [route] : allRoutes}
            stops={stops}
            height="380px"
          />
        </div>

        {/* Assigned Route Stops Timeline */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Route Stops & Timetable</h3>
            <span className="text-xs font-mono text-indigo-600">{stops.length} Stops</span>
          </div>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {stops.map((stop, idx) => (
              <div
                key={stop.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-mono font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 truncate max-w-[140px]">{stop.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{stop.scheduledTime}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCustomLat(stop.latitude);
                    setCustomLng(stop.longitude);
                    handleUpdateLocation();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  Set Here
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student List & Attendance Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Assigned Students List ({students.length} on {bus?.busNumber})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mark student boarding attendance directly from the driver seat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-slate-600">
              Present: <strong className="text-emerald-600">{presentCount}</strong> / {students.length} ({attendancePct}%)
            </div>
            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              Mark All Present
            </button>
          </div>
        </div>

        {/* Attendance Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${attendancePct}%` }}
          />
        </div>

        {/* Student Records Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Register #</th>
                <th className="px-4 py-3">Department & Year</th>
                <th className="px-4 py-3">Boarding Point</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-center">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((stud) => {
                const isPresent = stud.attendanceStatus === 'PRESENT';
                return (
                  <tr key={stud.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                      {stud.studentId || stud.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{stud.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{stud.registerNumber}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {stud.department} · Yr {stud.year} ({stud.section || 'A'})
                    </td>
                    <td className="px-4 py-3 font-medium text-indigo-700">
                      {stud.boardingPoint || stud.boardingPointName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{stud.phone}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
                        <button
                          onClick={() => handleMarkAttendance(stud.studentId || stud.id, 'PRESENT')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(stud.studentId || stud.id, 'ABSENT')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            !isPresent
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Absent
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
  );
};
