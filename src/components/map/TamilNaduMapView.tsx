import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Mic,
  Activity,
  Navigation,
  Building2,
  Bus,
} from 'lucide-react';
import type { TamilNaduTransitZone } from '../../types/index.ts';

interface TamilNaduMapViewProps {
  onSwitchToLocalRadar?: () => void;
  onOpenVoiceChatWithQuery?: (query: string) => void;
  onOpenCollegeDataset?: () => void;
}

export const TN_TRANSIT_ZONES: TamilNaduTransitZone[] = [
  {
    id: 'zone-chennai',
    name: 'Greater Chennai Metropolitan Zone',
    district: 'Chennai',
    region: 'North Tamil Nadu',
    icon: '🏛️',
    coordinates: [13.0827, 80.2707],
    activeFleetCount: 10,
    totalPassengers: 102,
    onTimeRate: 99.4,
    collegesCount: 120,
    status: 'OPTIMAL',
    primaryColleges: ['Anna University (CEG/MIT)', 'Madras Christian College', 'Loyola College', 'IIT Madras'],
    keyBusCorridors: ['Mount Road - Guindy - Tambaram', 'OMR Rajiv Gandhi IT Expressway', 'Poonamallee High Road'],
    description:
      'Largest student bus transit hub in Tamil Nadu connecting Chennai Central, Guindy Kathipara, Tambaram Sanatorium, Chromepet, and OMR IT corridors.',
  },
  {
    id: 'zone-chengalpattu',
    name: 'Chengalpattu & Kanchipuram Belt',
    district: 'Chengalpattu',
    region: 'North-Central Tamil Nadu',
    icon: '🏫',
    coordinates: [12.6939, 79.9757],
    activeFleetCount: 14,
    totalPassengers: 540,
    onTimeRate: 98.6,
    collegesCount: 45,
    status: 'OPTIMAL',
    primaryColleges: ['SRM Institute (Kattankulathur)', 'SSN College of Engineering', 'SVCE Sriperumbudur', 'Crescent University'],
    keyBusCorridors: ['GST Grand Southern Trunk Road', 'Vandalur - Kelambakkam Road', 'Sriperumbudur Industrial Highway'],
    description:
      'Major engineering campus corridor hosting tens of thousands of daily college commuters along GST Road and Rajiv Gandhi Salai.',
  },
  {
    id: 'zone-coimbatore',
    name: 'Coimbatore & Kongu Industrial Belt',
    district: 'Coimbatore',
    region: 'Western Tamil Nadu',
    icon: '🏭',
    coordinates: [11.0168, 76.9558],
    activeFleetCount: 12,
    totalPassengers: 460,
    onTimeRate: 99.1,
    collegesCount: 85,
    status: 'OPTIMAL',
    primaryColleges: ['PSG College of Technology', 'Coimbatore Institute of Technology (CIT)', 'Kumaraguru College', 'Amrita Vishwa Vidyapeetham'],
    keyBusCorridors: ['Avinashi Road Peelamedu', 'Mettupalayam Road', 'Saravanampatti IT Highway', 'Pollachi Road'],
    description:
      'The educational hub of Western Tamil Nadu with high-density campus buses connecting Gandhipuram, Peelamedu, and Saravanampatti.',
  },
  {
    id: 'zone-madurai',
    name: 'Madurai Southern Heritage Hub',
    district: 'Madurai',
    region: 'South Tamil Nadu',
    icon: '🛕',
    coordinates: [9.9252, 78.1198],
    activeFleetCount: 8,
    totalPassengers: 320,
    onTimeRate: 98.2,
    collegesCount: 40,
    status: 'OPTIMAL',
    primaryColleges: ['Thiagarajar College of Engineering (TCE)', 'Madurai Kamaraj University', 'American College', 'KLN College of Engineering'],
    keyBusCorridors: ['GST Thiruparankundram Road', 'Mattuthavani Integrated Terminal', 'Goripalayam - Periyar Bus Stand'],
    description:
      'Connecting student commuters across South Tamil Nadu with dedicated fleet lines to Thiruparankundram and Mattuthavani.',
  },
  {
    id: 'zone-trichy',
    name: 'Tiruchirappalli (Trichy) Central Hub',
    district: 'Tiruchirappalli',
    region: 'Central Tamil Nadu',
    icon: '🌉',
    coordinates: [10.7905, 78.7047],
    activeFleetCount: 7,
    totalPassengers: 280,
    onTimeRate: 99.5,
    collegesCount: 35,
    status: 'OPTIMAL',
    primaryColleges: ['National Institute of Technology (NIT Trichy)', 'Saranathan College', 'MAM College of Engineering', 'St. Joseph\'s College'],
    keyBusCorridors: ['Thanjavur Highway (NIT Thuvakudi)', 'Chatram Bus Stand', 'Thillai Nagar - BHEL Corridor'],
    description:
      'Central Tamil Nadu university transit corridor connecting students along the Cauvery basin and Thuvakudi STEM campus.',
  },
  {
    id: 'zone-salem',
    name: 'Salem & Namakkal Student Zone',
    district: 'Salem',
    region: 'North-Western Tamil Nadu',
    icon: '⛰️',
    coordinates: [11.6643, 78.146],
    activeFleetCount: 6,
    totalPassengers: 220,
    onTimeRate: 98.8,
    collegesCount: 30,
    status: 'OPTIMAL',
    primaryColleges: ['Government College of Engineering (GCE Salem)', 'Sona College of Technology', 'Vinayaka Missions'],
    keyBusCorridors: ['Bangalore NH44 Highway', 'Omalur Bypass', 'Shevapet - Old Bus Stand'],
    description:
      'Serving college students in the steel city and Namakkal educational belt with reliable morning pickup coordination.',
  },
  {
    id: 'zone-vellore',
    name: 'Vellore & Ranipet Technology Hub',
    district: 'Vellore',
    region: 'Northern Tamil Nadu',
    icon: '🏰',
    coordinates: [12.9165, 79.1325],
    activeFleetCount: 9,
    totalPassengers: 390,
    onTimeRate: 99.2,
    collegesCount: 25,
    status: 'OPTIMAL',
    primaryColleges: ['Vellore Institute of Technology (VIT)', 'Thanthai Periyar EVR College', 'Christian Medical College (CMC)'],
    keyBusCorridors: ['Katpadi Railway Link Road', 'Chennai - Bangalore National Highway', 'Arcot Road'],
    description:
      'High-capacity university bus service for institutions in Katpadi and Vellore fort corridors.',
  },
  {
    id: 'zone-tirunelveli',
    name: 'Tirunelveli & Deep South Belt',
    district: 'Tirunelveli',
    region: 'Deep South Tamil Nadu',
    icon: '🌴',
    coordinates: [8.7139, 77.7567],
    activeFleetCount: 5,
    totalPassengers: 180,
    onTimeRate: 99.0,
    collegesCount: 22,
    status: 'OPTIMAL',
    primaryColleges: ['Government College of Engineering Tirunelveli', 'Francis Xavier Engineering College', 'St. Xavier\'s College'],
    keyBusCorridors: ['Palayamkottai Bus Stand', 'Trivandrum Highway NH66', 'Vannarpettai Junction'],
    description:
      'Serving collegiate transit across the Tamirabarani river basin and Palayamkottai Oxford of South India school zones.',
  },
];

export const TamilNaduMapView: React.FC<TamilNaduMapViewProps> = ({
  onSwitchToLocalRadar,
  onOpenVoiceChatWithQuery,
  onOpenCollegeDataset,
}) => {
  const [selectedZone, setSelectedZone] = useState<TamilNaduTransitZone>(TN_TRANSIT_ZONES[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Position on a stylized Tamil Nadu map graphic
  const getPinStyle = (zoneId: string) => {
    switch (zoneId) {
      case 'zone-chennai':
        return { top: '22%', left: '78%' };
      case 'zone-chengalpattu':
        return { top: '28%', left: '73%' };
      case 'zone-vellore':
        return { top: '23%', left: '60%' };
      case 'zone-salem':
        return { top: '42%', left: '48%' };
      case 'zone-coimbatore':
        return { top: '52%', left: '26%' };
      case 'zone-trichy':
        return { top: '54%', left: '56%' };
      case 'zone-madurai':
        return { top: '70%', left: '46%' };
      case 'zone-tirunelveli':
        return { top: '86%', left: '42%' };
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
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tamil Nadu State College Transportation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Tamil Nadu College Bus Network Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            State-wide college bus tracking across Chennai, Coimbatore, Madurai, Trichy, Salem, Chengalpattu, Vellore, and Tirunelveli.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {onOpenCollegeDataset && (
            <button
              onClick={onOpenCollegeDataset}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Change College Data</span>
            </button>
          )}

          {onSwitchToLocalRadar && (
            <button
              onClick={onSwitchToLocalRadar}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Navigation className="w-4 h-4" />
              <span>Live Campus Bus Radar</span>
            </button>
          )}
        </div>
      </div>

      {/* State-wide Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">TN College Zones</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">8 Regions</div>
            <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">38 Districts Covered</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-lg">
            📍
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Engineering Colleges</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">460+</div>
            <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Autonomous & Anna Univ</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-lg">
            🏫
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">College Buses in TN</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">75 Coaches</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">GPS tracked live</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-lg">
            🚌
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">On-Time Average</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-0.5">99.2%</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Morning campus trips</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-lg">
            ⏱️
          </div>
        </div>
      </div>

      {/* Main Map Viewport & Zone Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xs group min-h-[440px] sm:min-h-[520px] flex flex-col items-center justify-center p-6">
            {/* Tamil Nadu Map Canvas SVG */}
            <div
              className="w-full h-full max-w-lg aspect-square flex items-center justify-center relative transition-transform duration-300 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Clean SVG Outline representing Tamil Nadu State */}
              <svg viewBox="0 0 400 450" className="w-full h-full text-slate-100 fill-slate-50 stroke-slate-300 stroke-2 drop-shadow-sm">
                <path
                  d="M240,30 
                     C280,35 320,60 330,85 
                     C340,110 325,130 310,145 
                     C305,170 315,190 320,215 
                     C325,240 310,265 295,290 
                     C280,315 270,340 240,370 
                     C210,400 185,420 170,430 
                     C155,425 150,400 155,375 
                     C160,350 145,325 140,300 
                     C130,270 100,260 90,235 
                     C80,210 110,195 125,175 
                     C140,155 130,135 150,110 
                     C170,85 195,60 215,45 Z"
                  className="fill-indigo-50/50 stroke-indigo-200"
                />
                {/* Coastal Bay of Bengal text marker */}
                <text x="310" y="270" className="text-[10px] fill-slate-400 font-mono select-none" transform="rotate(75, 310, 270)">
                  Bay of Bengal (வங்காள விரிகுடா)
                </text>
                {/* State Label */}
                <text x="180" y="220" className="text-[13px] font-bold fill-indigo-300 select-none text-center">
                  TAMIL NADU
                </text>
              </svg>

              {/* Interactive Zone Pins */}
              {TN_TRANSIT_ZONES.map((zone) => {
                const isSelected = selectedZone.id === zone.id;
                const pos = getPinStyle(zone.id);

                return (
                  <div
                    key={zone.id}
                    style={pos}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setSelectedZone(zone)}
                  >
                    <div className="relative flex items-center justify-center group/pin">
                      <span
                        className={`absolute w-7 h-7 rounded-full opacity-60 animate-ping ${
                          isSelected ? 'bg-indigo-500' : 'bg-emerald-400'
                        }`}
                      />
                      <button
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold border-white ring-4 ring-indigo-500/20'
                            : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
                        }`}
                        title={`${zone.name} (${zone.district})`}
                      >
                        <span>{zone.icon}</span>
                      </button>

                      <div className="absolute bottom-full mb-2 hidden group-hover/pin:flex flex-col items-center pointer-events-none whitespace-nowrap z-30">
                        <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 shadow-md font-semibold flex items-center gap-1.5">
                          <span>{zone.district}</span>
                          <span className="font-mono text-indigo-600 font-bold">({zone.activeFleetCount} buses)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1.5 rounded-2xl border border-slate-200 shadow-xs z-20">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2))}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.9))}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Zone Switcher Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {TN_TRANSIT_ZONES.map((zone) => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedZone.id === zone.id
                    ? 'bg-indigo-50 border-indigo-400 font-bold shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{zone.icon}</span>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold">{zone.activeFleetCount} Buses</span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1 truncate">{zone.district}</div>
                <div className="text-[10px] text-slate-500 truncate">{zone.collegesCount} Colleges</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Region Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedZone.region}
                </span>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <span>{selectedZone.icon}</span>
                  <span>{selectedZone.name}</span>
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>District: <strong>{selectedZone.district}</strong>, Tamil Nadu</span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {selectedZone.status}
              </span>
            </div>

            {/* Metrics */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Active College Buses:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedZone.activeFleetCount} Coaches</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${(selectedZone.activeFleetCount / 15) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>On-Time Arrival:</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedZone.onTimeRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${selectedZone.onTimeRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Colleges in Region:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedZone.collegesCount} institutions</span>
                </div>
              </div>
            </div>

            {/* Key Colleges */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Major Colleges in This Zone:</span>
              </div>
              <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px]">
                {selectedZone.primaryColleges.map((col, idx) => (
                  <li key={idx} className="truncate">{col}</li>
                ))}
              </ul>
            </div>

            {/* Key Bus Routes */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-1.5">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Key Bus Corridors:</span>
              </div>
              <p className="text-[11px] text-indigo-900 leading-relaxed">
                {selectedZone.keyBusCorridors.join(' · ')}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              {onOpenVoiceChatWithQuery && (
                <button
                  onClick={() =>
                    onOpenVoiceChatWithQuery(
                      `Tell me about the college bus routes and student transportation in ${selectedZone.district}, Tamil Nadu.`
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Mic className="w-3.5 h-3.5 text-pink-600" />
                  <span>Ask in Tamil / English about {selectedZone.district}</span>
                </button>
              )}

              {onSwitchToLocalRadar && (
                <button
                  onClick={onSwitchToLocalRadar}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Launch Live Campus Bus Radar</span>
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
