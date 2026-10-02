import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import type { Bus, Route, BoardingPoint, TrackingHistoryItem } from '../../types/index.ts';
import { LeafletMap, type MapTileStyle } from '../map/LeafletMap.tsx';
import {
  Bus as BusIcon,
  Play,
  Pause,
  RefreshCw,
  Search,
  Filter,
  Navigation,
  Clock,
  Radio,
  Sliders,
  Phone,
  Layers,
  MapPin,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  Compass,
  Sparkles,
  Mic,
  X,
} from 'lucide-react';
import { VoiceTranscriberModal } from '../voice/VoiceTranscriberModal.tsx';
import { TransitMapsAssistantView } from '../transit-ai/TransitMapsAssistantView.tsx';

export const LiveTrackingView: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<BoardingPoint[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>('bus-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [simActive, setSimActive] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [history, setHistory] = useState<TrackingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Map & Buffer display states
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('streets');
  const [showBuffers, setShowBuffers] = useState(true);
  const [showApproachingPerimeter, setShowApproachingPerimeter] = useState(true);

  // Gemini Maps Grounding & Voice modal states
  const [isMapsModalOpen, setIsMapsModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [transcribedVoiceQuery, setTranscribedVoiceQuery] = useState('');

  const fetchLive = async () => {
    try {
      const [liveRes, routesRes, stopsRes] = await Promise.all([
        api.getLiveTracking(),
        api.getRoutes(),
        api.getBoardingPoints(),
      ]);
      setBuses(liveRes.buses);
      setSimActive(liveRes.simulationActive);
      setSimSpeed(liveRes.simulationSpeedMultiplier);
      setRoutes(routesRes.data);
      setStops(stopsRes.data);
    } catch (e) {
      console.error('Error fetching live fleet data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();

    const unsubscribe = api.subscribeToTrackingStream((event) => {
      if (event.type === 'BUS_LOCATION_UPDATE' || event.type === 'BUS_STATUS_UPDATE') {
        const updatedBus: Bus = event.payload;
        setBuses((prev) => prev.map((b) => (b.busNumber === updatedBus.busNumber ? updatedBus : b)));
      } else if (event.type === 'BUS_CREATED') {
        setBuses((prev) => [...prev, event.payload]);
      } else if (event.type === 'BUS_DELETED') {
        setBuses((prev) => prev.filter((b) => b.id !== event.payload.id));
      } else if (event.type === 'DATABASE_RESET') {
        fetchLive();
      }
    });

    const interval = setInterval(fetchLive, 4000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (selectedBusId) {
      api
        .getBusHistory(selectedBusId)
        .then((res) => setHistory(res.data))
        .catch(() => {});
    }
  }, [selectedBusId]);

  const handleToggleSim = async () => {
    try {
      const res = await api.toggleSimulation();
      setSimActive(res.isRunning);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetSpeed = async (multiplier: number) => {
    try {
      const res = await api.setSimulationSpeed(multiplier);
      setSimSpeed(res.speedMultiplier);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredBuses = buses.filter((bus) => {
    const matchesSearch =
      bus.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bus.routeName && bus.routeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bus.driverName && bus.driverName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && (bus.currentStatus === 'MOVING' || bus.currentStatus === 'STARTED' || bus.currentStatus === 'APPROACHING_STOP' || bus.currentStatus === 'ARRIVED_AT_STOP')) ||
      (statusFilter === 'STOPPED' && bus.currentStatus === 'STOPPED') ||
      (statusFilter === 'DELAYED' && bus.currentStatus === 'DELAYED') ||
      (statusFilter === 'COMPLETED' && bus.currentStatus === 'COMPLETED') ||
      bus.currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedBus = buses.find((b) => b.id === selectedBusId) || buses[0];
  const selectedRoute = routes.find((r) => r.id === selectedBus?.routeId);
  const selectedStops = stops
    .filter((s) => s.routeId === selectedBus?.routeId)
    .sort((a, b) => a.stopOrder - b.stopOrder);

  // Selected bus buffer proximity calculation
  const distanceToStop = selectedBus?.nextStopDistanceMeters ?? 650;
  const isInsideArrivedBuffer =
    selectedBus?.currentStatus === 'ARRIVED_AT_STOP' || distanceToStop <= 100;
  const isInsideApproachingBuffer =
    !isInsideArrivedBuffer &&
    (selectedBus?.currentStatus === 'APPROACHING_STOP' || distanceToStop <= 500);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 font-sans">
      {/* Header & Global Radar Controls (Clean light theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE BUS GPS RADAR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
            Live College Bus Map
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time GPS locations from all {buses.length} active college buses driving right now
          </p>
        </div>

        {/* Live Simulator Toolbar & Map Layer Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Map Base Layer Selector */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 text-xs shadow-xs">
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                mapStyle === 'streets'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Real-World Street Map"
            >
              Streets
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                mapStyle === 'satellite'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Satellite Imagery"
            >
              Satellite
            </button>
          </div>

          {/* Simulator Speed / Pause */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={handleToggleSim}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                simActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {simActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{simActive ? 'Buses Moving' : 'Paused'}</span>
            </button>

            <button
              onClick={() => handleSetSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 4 : 1)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Adjust Simulation Speed"
            >
              {simSpeed}x
            </button>
          </div>

          {/* Voice Assistant Tool */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            title="Ask Voice Assistant"
          >
            <Mic className="w-3.5 h-3.5 text-pink-600" />
            <span>Voice</span>
          </button>

          <button
            onClick={fetchLive}
            title="Refresh Bus Positions"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Proximity Radial Buffer Explainer & Legend Bar (Light theme) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <CircleDot className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-900">Stop Proximity Guide:</span>{' '}
            <span className="text-slate-500">
              Circles around bus stops show when buses arrive or get close:
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100" />
            <span className="text-amber-800 font-bold">Amber:</span>
            <span className="text-slate-600">Bus Arrived at Stop</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
            <span className="text-emerald-800 font-bold">Green:</span>
            <span className="text-slate-600">Approaching (&lt;500m / 5 min away)</span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <button
              onClick={() => setShowBuffers(!showBuffers)}
              className={`text-[11px] px-2 py-0.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                showBuffers
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              Stop Circles: {showBuffers ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bus number, route, or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Buses' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'DELAYED', label: 'Delayed' },
            { id: 'STOPPED', label: 'Stopped' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout: Bus List & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Fleet List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
            <span>Click any bus to focus on map</span>
            <span className="font-mono">{filteredBuses.length} shown</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredBuses.map((bus) => {
              const isSelected = bus.id === selectedBusId;
              const busDist = bus.nextStopDistanceMeters ?? 0;
              const isArrived =
                bus.currentStatus === 'ARRIVED_AT_STOP' || busDist <= 100;
              const isApproaching =
                !isArrived &&
                (bus.currentStatus === 'APPROACHING_STOP' || busDist <= 500);

              return (
                <div
                  key={bus.id}
                  onClick={() => setSelectedBusId(bus.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-400 shadow-sm ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{bus.busNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isArrived
                          ? 'bg-amber-100 text-amber-800'
                          : isApproaching
                          ? 'bg-emerald-100 text-emerald-800'
                          : bus.currentStatus === 'DELAYED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isArrived && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                      {isApproaching && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      <span>{bus.currentStatus === 'ARRIVED_AT_STOP' ? 'At Stop' : bus.currentStatus === 'APPROACHING_STOP' ? 'Approaching' : bus.currentStatus}</span>
                    </span>
                  </div>

                  <div className="text-xs text-indigo-700 font-semibold mt-1 truncate">
                    {bus.routeName}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <div>
                      Speed: <strong className="text-emerald-700 font-mono">{bus.speedKmH} km/h</strong>
                    </div>
                    <div>
                      ETA: <strong className="text-indigo-700 font-mono">{bus.etaMinutes != null ? `${bus.etaMinutes} min` : '0 min'}</strong>
                    </div>
                    <div className="truncate">Driver: {bus.driverName}</div>
                    <div className="truncate">
                      Next: <span className="text-slate-900 font-medium">{bus.nextStopName || 'Campus'}</span>
                    </div>
                  </div>

                  {/* Buffer proximity indicator bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Stop Proximity:</span>
                    <span
                      className={`font-mono font-bold ${
                        isArrived
                          ? 'text-amber-700'
                          : isApproaching
                          ? 'text-emerald-700'
                          : 'text-indigo-600'
                      }`}
                    >
                      {isArrived
                        ? `At Stop (${busDist}m)`
                        : isApproaching
                        ? `Approaching (${busDist}m)`
                        : `${busDist}m away`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Map & Telemetry Details */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Bus Details Banner */}
          {selectedBus && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Selected Bus:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isInsideArrivedBuffer
                        ? 'bg-amber-100 text-amber-800'
                        : isInsideApproachingBuffer
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isInsideArrivedBuffer
                      ? '🟡 AT STOP'
                      : isInsideApproachingBuffer
                      ? '🟢 5-MINUTE APPROACHING ZONE'
                      : '🔵 ON ROUTE'}
                  </span>
                </div>

                <div className="text-base font-bold text-slate-900 font-display mt-0.5">
                  {selectedBus.busNumber} · {selectedBus.registrationNumber}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Driver: {selectedBus.driverName} ({selectedBus.driverPhone}) · Route: {selectedBus.routeName}
                </div>
              </div>

              <div className="flex items-center gap-5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Next Stop</span>
                  <strong className="text-slate-900">{selectedBus.nextStopName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Distance</span>
                  <strong className="text-indigo-600 font-mono">
                    {selectedBus.nextStopDistanceMeters}m
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Speed</span>
                  <strong className="text-emerald-700 font-mono">{selectedBus.speedKmH} km/h</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ETA</span>
                  <strong className="text-indigo-700 font-mono">{selectedBus.etaMinutes ?? 0}m</strong>
                </div>
              </div>
            </div>
          )}

          {/* Leaflet Map in clean light container */}
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <LeafletMap
              buses={buses}
              selectedBusId={selectedBusId}
              onSelectBus={(id) => setSelectedBusId(id)}
              routes={selectedRoute ? [selectedRoute] : routes}
              stops={selectedStops.length > 0 ? selectedStops : stops}
              highlightedRouteId={selectedBus?.routeId}
              trackingHistory={history}
              defaultTileStyle={mapStyle}
              onTileStyleChange={(s) => setMapStyle(s)}
              showBuffers={showBuffers}
              showApproachingPerimeter={showApproachingPerimeter}
              height="580px"
            />
          </div>
        </div>
      </div>

      {/* Voice Transcriber Modal */}
      <VoiceTranscriberModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptionComplete={(text) => {
          setTranscribedVoiceQuery(text);
          setIsVoiceModalOpen(false);
          setIsMapsModalOpen(true);
        }}
        title="Voice Bus Question"
        subtitle="Speak your question into the microphone to ask about bus timings."
      />

      {/* Maps Grounding Modal */}
      {isMapsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Google Maps Bus Assistant</span>
              </div>
              <button
                onClick={() => {
                  setIsMapsModalOpen(false);
                  setTranscribedVoiceQuery('');
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <TransitMapsAssistantView
                initialQuery={transcribedVoiceQuery}
                defaultBoardingPointId={selectedStops[selectedBus?.currentStopIndex || 0]?.id || selectedStops[0]?.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
