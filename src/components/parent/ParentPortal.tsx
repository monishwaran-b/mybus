import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import type { Bus, Route, BoardingPoint, Alert, TrackingHistoryItem, Student, Parent } from '../../types/index.ts';
import { LeafletMap } from '../map/LeafletMap.tsx';
import {
  ShieldCheck,
  MapPin,
  Clock,
  Bell,
  Bus as BusIcon,
  Phone,
  User as UserIcon,
  Circle,
  AlertCircle,
  RefreshCw,
  Navigation,
  Sparkles,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { TransitMapsAssistantView } from '../transit-ai/TransitMapsAssistantView.tsx';

export const ParentPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'child' | 'tracking' | 'route' | 'alerts' | 'history' | 'profile' | 'maps-ai'>('dashboard');

  const [parent, setParent] = useState<Parent | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [bus, setBus] = useState<Bus | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<BoardingPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<TrackingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const parentRes = await api.getParentById(user?.parentId || 'parent-1');
      setParent(parentRes.parent);

      if (parentRes.linkedStudents && parentRes.linkedStudents.length > 0) {
        const stud = parentRes.linkedStudents[0];
        setSelectedStudent(stud);

        const studDetail = await api.getStudentById(stud.id);
        setRoute(studDetail.route || null);
        if (studDetail.bus) {
          setBus(studDetail.bus);
          const trackRes = await api.getBusTracking(studDetail.bus.id);
          setBus(trackRes.bus);
          setStops(trackRes.stops || []);
          setHistory(trackRes.recentHistory || []);
        }
      }

      const alertsRes = await api.getAlerts('ROLE_PARENT', user?.parentId || 'parent-1');
      setAlerts(alertsRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load child bus tracking data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

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
        api.getAlerts('ROLE_PARENT', user?.parentId || 'parent-1').then((res) => setAlerts(res.data)).catch(() => {});
      }
    });

    const interval = setInterval(async () => {
      if (bus?.id) {
        try {
          const trackRes = await api.getBusTracking(bus.id);
          setBus(trackRes.bus);
          setStops(trackRes.stops || []);
          setHistory(trackRes.recentHistory || []);

          const alertsRes = await api.getAlerts('ROLE_PARENT', user?.parentId || 'parent-1');
          setAlerts(alertsRes.data);
        } catch (_) {}
      }
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user, bus?.id, bus?.busNumber]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-[#f8fafc]">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Loading Parent Portal...</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to your child's bus</p>
      </div>
    );
  }

  if (error || !selectedStudent || !bus) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-[#f8fafc]">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Unable to Connect</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Could not find your child\'s assigned bus.'}</p>
        <button
          onClick={loadData}
          className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 font-sans">
      {/* Parent Welcome Header (Clean lite card, centered copy) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left space-y-1">
          <div className="inline-flex items-center gap-2 text-xs text-purple-600 font-semibold">
            <span>Parent Bus Tracker</span>
            <span>·</span>
            <span className="text-emerald-600 font-bold">Safe & Private</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Parent Portal: {parent?.name || 'Robert Jenkins'}
          </h1>
          <p className="text-xs text-slate-500">
            Tracking bus for: <strong className="text-slate-800">{selectedStudent.name}</strong> ({selectedStudent.registerNumber}) · Stop: <strong className="text-slate-800">{selectedStudent.boardingPointName}</strong>
          </p>
        </div>

        {/* Quick Driver Contact Button */}
        <div className="flex items-center gap-3">
          <a
            href={`tel:${bus.driverPhone || '+919444122334'}`}
            className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-purple-600" />
            <span>Call Driver ({bus.driverName || 'Muthuvelan'})</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          Child Safety & Map
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'tracking'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Full Live Map</span>
        </button>

        <button
          onClick={() => setActiveTab('route')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'route'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          Bus Stops & Times
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'alerts'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <span>Pickup Alerts</span>
          {alerts.filter((a) => !a.isRead).length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {alerts.filter((a) => !a.isRead).length}
            </span>
          )}
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
          <span>Stop Area (AI Guide)</span>
        </button>
      </div>

      {/* Tab 1: Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Arrival to Your Stop</span>
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-extrabold text-purple-600 font-mono">
                {bus.etaMinutes != null ? `${bus.etaMinutes} min` : '4 min'}
              </div>
              <div className="text-xs text-slate-500">Stop: {selectedStudent.boardingPointName}</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Student Check-In</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>On Board Bus</span>
              </div>
              <div className="text-xs text-slate-500">Card tapped at 07:42 AM</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Assigned Bus</span>
                <BusIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {bus.busNumber}
              </div>
              <div className="text-xs text-slate-500">Speed: {bus.speedKmH} km/h</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Driver Contact</span>
                <Phone className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-base font-bold text-slate-900 truncate">
                {bus.driverName || 'Muthuvelan R.'}
              </div>
              <div className="text-xs text-slate-500">{bus.driverPhone || '+91 94441 22334'}</div>
            </div>
          </div>

          {/* Live Map Preview & Safety Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Your Child's Bus on Road Map</h3>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time Live</span>
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
              <h3 className="text-sm font-bold text-slate-900">5-Minute Arrival Alert</h3>
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-purple-600" />
                  <span>Automatic SMS & App Chime</span>
                </div>
                <p className="leading-relaxed">
                  You will receive an automatic chime and message 5 minutes before Bus {bus.busNumber} reaches <strong>{selectedStudent.boardingPointName}</strong>.
                </p>
              </div>

              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pt-2">Upcoming Stops</h4>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
                {stops.slice(0, 5).map((stop, idx) => (
                  <div
                    key={stop.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      stop.id === selectedStudent.boardingPointId
                        ? 'bg-purple-50 border-purple-300 font-bold text-purple-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{idx + 1}. {stop.name}</span>
                    <span className="font-mono text-slate-500">{stop.scheduledTime}</span>
                  </div>
                ))}
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

      {/* Tab 3: Route Stops */}
      {activeTab === 'route' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">{route?.name}</h3>
            <p className="text-xs text-slate-500 mt-1">{route?.description}</p>
          </div>
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Stop #</th>
                <th className="px-5 py-3">Stop Name</th>
                <th className="px-5 py-3">Scheduled Time</th>
                <th className="px-5 py-3">Child Pickup Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {stops.map((stop) => (
                <tr
                  key={stop.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    stop.id === selectedStudent.boardingPointId ? 'bg-purple-50/60 font-bold' : ''
                  }`}
                >
                  <td className="px-5 py-3 text-slate-500">#{stop.stopOrder}</td>
                  <td className="px-5 py-3 font-sans font-medium text-slate-900">{stop.name}</td>
                  <td className="px-5 py-3 text-slate-700">{stop.scheduledTime}</td>
                  <td className="px-5 py-3 font-sans">
                    {stop.id === selectedStudent.boardingPointId ? (
                      <span className="text-purple-700 font-bold">★ Your Child's Stop</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Alerts */}
      {activeTab === 'alerts' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Notifications & Boarding Updates</h2>
            <span className="text-xs text-slate-500">Real-time check-ins</span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              No recent alerts. Everything is normal.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{alert.title}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Maps AI */}
      {activeTab === 'maps-ai' && (
        <div className="pt-2">
          <TransitMapsAssistantView defaultBoardingPointId={selectedStudent.boardingPointId} />
        </div>
      )}
    </div>
  );
};
