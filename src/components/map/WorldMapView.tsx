import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  MapPin,
  Clock,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Zap,
  ArrowRight,
  Mic,
  Activity,
  Navigation,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { WorldTransitHub } from '../../types/index.ts';

interface WorldMapViewProps {
  onSwitchToLocalRadar?: () => void;
  onOpenVoiceChatWithQuery?: (query: string) => void;
}

export const WORLD_HUBS: WorldTransitHub[] = [
  {
    id: 'hub-chennai',
    name: 'Chennai Campus Hub',
    city: 'Chennai',
    country: 'India',
    flag: '🇮🇳',
    coordinates: [12.871, 80.065],
    activeFleetCount: 10,
    totalPassengers: 102,
    onTimeRate: 99.4,
    timezone: 'Asia/Kolkata',
    status: 'OPTIMAL',
    primaryTransitMode: 'Smart College Buses (Live GPS)',
    description:
      'College transportation network operating Route 1 to Route 5 with real-time arrival alerts and student card check-ins.',
  },
  {
    id: 'hub-tokyo',
    name: 'Tokyo Campus Link',
    city: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    coordinates: [35.6895, 139.6917],
    activeFleetCount: 14,
    totalPassengers: 540,
    onTimeRate: 99.8,
    timezone: 'Asia/Tokyo',
    status: 'OPTIMAL',
    primaryTransitMode: 'Electric Campus Coaches',
    description:
      'High-speed university transit connecting campus labs across Tokyo with live timetable coordination.',
  },
  {
    id: 'hub-london',
    name: 'London Campus Lines',
    city: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    coordinates: [51.5074, -0.1278],
    activeFleetCount: 8,
    totalPassengers: 320,
    onTimeRate: 97.5,
    timezone: 'Europe/London',
    status: 'HEAVY_TRAFFIC',
    primaryTransitMode: 'Zero-Emission Electric Double-Decker',
    description:
      'Connecting university facilities and academic hospitals with live detour assistance.',
  },
  {
    id: 'hub-ny',
    name: 'New York Campus Shuttles',
    city: 'New York',
    country: 'United States',
    flag: '🇺🇸',
    coordinates: [40.7128, -74.006],
    activeFleetCount: 12,
    totalPassengers: 460,
    onTimeRate: 96.2,
    timezone: 'America/New_York',
    status: 'OPTIMAL',
    primaryTransitMode: 'Express Campus Shuttles',
    description:
      'Frequent cross-town student shuttles connecting student housing with main university classrooms.',
  },
  {
    id: 'hub-berlin',
    name: 'Berlin Campus Link',
    city: 'Berlin',
    country: 'Germany',
    flag: '🇩🇪',
    coordinates: [52.52, 13.405],
    activeFleetCount: 6,
    totalPassengers: 210,
    onTimeRate: 98.9,
    timezone: 'Europe/Berlin',
    status: 'OPTIMAL',
    primaryTransitMode: 'Eco Hybrid Electric Fleet',
    description:
      'Clean campus transportation network serving engineering faculties and student centers.',
  },
  {
    id: 'hub-dubai',
    name: 'Dubai University Shuttle',
    city: 'Dubai',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    coordinates: [25.2048, 55.2708],
    activeFleetCount: 9,
    totalPassengers: 380,
    onTimeRate: 99.1,
    timezone: 'Asia/Dubai',
    status: 'OPTIMAL',
    primaryTransitMode: 'Solar Air-Conditioned Shuttles',
    description:
      'Air-conditioned campus transportation running throughout Academic City with rapid charging.',
  },
  {
    id: 'hub-singapore',
    name: 'Singapore Campus Network',
    city: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    coordinates: [1.3521, 103.8198],
    activeFleetCount: 7,
    totalPassengers: 290,
    onTimeRate: 99.9,
    timezone: 'Asia/Singapore',
    status: 'OPTIMAL',
    primaryTransitMode: 'Smart Electric Shuttles',
    description:
      'Precise university shuttle network connected directly with subway and bus interchanges.',
  },
  {
    id: 'hub-sydney',
    name: 'Sydney Campus Transit',
    city: 'Sydney',
    country: 'Australia',
    flag: '🇦🇺',
    coordinates: [-33.8688, 151.2093],
    activeFleetCount: 8,
    totalPassengers: 250,
    onTimeRate: 98.2,
    timezone: 'Australia/Sydney',
    status: 'OPTIMAL',
    primaryTransitMode: 'Coastal Express Buses',
    description:
      'Oceanfront campus express servicing university marine and technology faculties.',
  },
];

export const WorldMapView: React.FC<WorldMapViewProps> = ({
  onSwitchToLocalRadar,
  onOpenVoiceChatWithQuery,
}) => {
  const { t } = useLanguage();
  const [selectedHub, setSelectedHub] = useState<WorldTransitHub>(WORLD_HUBS[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [localTimes, setLocalTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, string> = {};
      WORLD_HUBS.forEach((hub) => {
        try {
          times[hub.id] = new Intl.DateTimeFormat('en-US', {
            timeZone: hub.timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }).format(new Date());
        } catch (_) {
          times[hub.id] = '--:--';
        }
      });
      setLocalTimes(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPinStyle = (hubId: string) => {
    switch (hubId) {
      case 'hub-chennai':
        return { top: '56%', left: '69%' };
      case 'hub-tokyo':
        return { top: '42%', left: '85%' };
      case 'hub-london':
        return { top: '34%', left: '48%' };
      case 'hub-ny':
        return { top: '38%', left: '27%' };
      case 'hub-berlin':
        return { top: '30%', left: '52%' };
      case 'hub-dubai':
        return { top: '48%', left: '62%' };
      case 'hub-singapore':
        return { top: '64%', left: '78%' };
      case 'hub-sydney':
        return { top: '80%', left: '89%' };
      default:
        return { top: '50%', left: '50%' };
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] text-slate-900 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full font-sans space-y-6">
      {/* Top Header (Clean lite theme, centered copy) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>International Partner Campuses</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Global University Bus Networks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            See how smart student bus networks run in partner cities around the world, from Chennai and Tokyo to London and New York.
          </p>
        </div>

        {onSwitchToLocalRadar && (
          <button
            onClick={onSwitchToLocalRadar}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Navigation className="w-4 h-4" />
            <span>Go to Chennai Bus Map</span>
          </button>
        )}
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Partner Cities</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">8 Hubs</div>
            <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">Worldwide</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            🌍
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Buses</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">74 Buses</div>
            <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">On the road</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            🚌
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Students Riding</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-0.5">3,420</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Live check-in</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            🎓
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">On-Time Average</div>
            <div className="text-2xl font-bold font-mono text-indigo-600 mt-0.5">98.7%</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Normal conditions</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            ⏱️
          </div>
        </div>
      </div>

      {/* Main Map Viewport & Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* World Map Container */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xs group min-h-[420px] sm:min-h-[500px]">
            {/* Map image with zoom */}
            <div
              className="w-full h-full overflow-hidden flex items-center justify-center transition-transform duration-300 ease-out p-4"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src="/src/assets/images/world_map_transit_1790256810465.jpg"
                alt="Global World Transit Map"
                className="w-full h-full object-cover object-center rounded-2xl select-none pointer-events-none"
              />
            </div>

            {/* Interactive World Hub Pins */}
            {WORLD_HUBS.map((hub) => {
              const isSelected = selectedHub.id === hub.id;
              const pos = getPinStyle(hub.id);

              return (
                <div
                  key={hub.id}
                  style={pos}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-transform hover:scale-125"
                  onClick={() => setSelectedHub(hub)}
                >
                  <div className="relative flex items-center justify-center group/pin">
                    {/* Ripple aura */}
                    <span
                      className={`absolute w-8 h-8 rounded-full opacity-60 animate-ping ${
                        isSelected ? 'bg-indigo-500' : 'bg-blue-400'
                      }`}
                    />
                    {/* Pin button */}
                    <button
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold border-white ring-4 ring-indigo-500/20'
                          : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
                      }`}
                      title={`${hub.name} (${hub.country})`}
                    >
                      <span>{hub.flag}</span>
                    </button>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover/pin:flex flex-col items-center pointer-events-none whitespace-nowrap z-30">
                      <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 shadow-md font-semibold flex items-center gap-1.5">
                        <span>{hub.city}</span>
                        <span className="font-mono text-indigo-600 font-bold">({hub.activeFleetCount} buses)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs p-1.5 rounded-2xl border border-slate-200 shadow-xs z-20">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.9))}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {WORLD_HUBS.map((hub) => (
              <button
                key={hub.id}
                onClick={() => setSelectedHub(hub)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedHub.id === hub.id
                    ? 'bg-indigo-50 border-indigo-400 font-bold shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{hub.flag}</span>
                  <span className="text-[11px] font-mono text-indigo-600 font-bold">{hub.activeFleetCount} Buses</span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1 truncate">{hub.city}</div>
                <div className="text-[10px] text-slate-500 truncate">{localTimes[hub.id] || hub.country}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Hub Inspector (Clean lite card) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                  City Selected
                </span>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  <span>{selectedHub.flag}</span>
                  <span>{selectedHub.name}</span>
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedHub.city}, {selectedHub.country}</span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {selectedHub.status}
              </span>
            </div>

            {/* Local Time and Coordinates */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  <span>Local Time</span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  {localTimes[selectedHub.id] || 'Loading...'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                  <Compass className="w-3 h-3 text-indigo-600" />
                  <span>Coordinates</span>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                  {selectedHub.coordinates[0].toFixed(2)}°, {selectedHub.coordinates[1].toFixed(2)}°
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Buses Running:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedHub.activeFleetCount} Coaches</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${(selectedHub.activeFleetCount / 15) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>On-Time Performance:</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedHub.onTimeRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${selectedHub.onTimeRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Students Daily:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedHub.totalPassengers} students</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min((selectedHub.totalPassengers / 600) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 leading-relaxed">
              <div className="font-bold text-slate-900">Transit Mode: {selectedHub.primaryTransitMode}</div>
              <p className="text-[11px] text-slate-500">{selectedHub.description}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              {onOpenVoiceChatWithQuery && (
                <button
                  onClick={() =>
                    onOpenVoiceChatWithQuery(
                      `Tell me about the university bus transit in ${selectedHub.city}, ${selectedHub.country}.`
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Mic className="w-3.5 h-3.5 text-pink-600" />
                  <span>Ask Voice Assistant About {selectedHub.city}</span>
                </button>
              )}

              {selectedHub.id === 'hub-chennai' && onSwitchToLocalRadar && (
                <button
                  onClick={onSwitchToLocalRadar}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open Chennai Live Bus Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
