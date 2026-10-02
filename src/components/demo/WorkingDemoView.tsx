import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { api } from '../../services/api.ts';
import { soundFx } from '../../utils/audio.ts';
import type { Bus, Student, UserRole, Alert } from '../../types/index.ts';
import {
  Play,
  PlayCircle,
  Pause,
  RotateCcw,
  Zap,
  CreditCard,
  AlertTriangle,
  Siren,
  Bell,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  User,
  Radio,
  Clock,
  Compass,
  MapPin,
  Check,
  ChevronRight,
  Smartphone,
  PhoneCall,
  Activity,
  Info,
  Mic,
} from 'lucide-react';

interface WorkingDemoViewProps {
  onNavigateToTab: (tab: string) => void;
  onOpenVoiceChat?: (query?: string) => void;
}

export const WorkingDemoView: React.FC<WorkingDemoViewProps> = ({
  onNavigateToTab,
  onOpenVoiceChat,
}) => {
  const { role, switchRole } = useAuth();
  const { t } = useLanguage();

  // Fleet state
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(false);

  // Scenario 2: Student Card Tap state
  const [isStudentBoarded, setIsStudentBoarded] = useState(false);
  const [cardTapping, setCardTapping] = useState(false);
  const [lastBoardingAlert, setLastBoardingAlert] = useState<string | null>(null);

  // Scenario 3: Traffic Delay state
  const [isTrafficDelayed, setIsTrafficDelayed] = useState(false);
  const [detourInfo, setDetourInfo] = useState<string | null>(null);

  // Scenario 4: SOS Panic state
  const [isSosActive, setIsSosActive] = useState(false);

  // Scenario 5: Proximity state
  const [proximityFired, setProximityFired] = useState(false);
  const [proximityMessage, setProximityMessage] = useState<string | null>(null);

  // Guided tour
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Recent simulated events log
  const [recentLogs, setRecentLogs] = useState<Array<{ id: string; time: string; text: string; type: string }>>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text: 'Live simulation started for all 5 campus bus routes.',
      type: 'INFO',
    },
  ]);

  const addLog = (text: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' = 'INFO') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setRecentLogs((prev) => [{ id: `log-${Date.now()}-${Math.random()}`, time, text, type }, ...prev.slice(0, 15)]);
  };

  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 3500);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveTelemetry = async () => {
    try {
      const res = await api.getLiveTracking();
      setBuses(res.buses);
      setSimulationRunning(res.simulationActive);
      setSpeedMultiplier(res.simulationSpeedMultiplier);
    } catch (_) {}
  };

  // Toggle Simulation Play/Pause
  const handleToggleSimulation = async () => {
    try {
      const res = await api.toggleSimulation();
      setSimulationRunning(res.isRunning);
      addLog(`Bus movement ${res.isRunning ? 'RUNNING (sending live GPS)' : 'PAUSED'}`, 'INFO');
    } catch (err) {
      console.error(err);
    }
  };

  // Set Speed Multiplier
  const handleSpeedChange = async (multiplier: number) => {
    try {
      const res = await api.setSimulationSpeed(multiplier);
      setSpeedMultiplier(res.speedMultiplier);
      addLog(`Bus speed set to ${res.speedMultiplier}x fast-forward`, 'INFO');
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Fleet
  const handleResetFleet = async () => {
    setLoading(true);
    try {
      await api.resetFleetCoordinates();
      await api.clearEmergencyState();
      setIsSosActive(false);
      setIsTrafficDelayed(false);
      setDetourInfo(null);
      setProximityFired(false);
      setProximityMessage(null);
      await fetchLiveTelemetry();
      addLog('All 10 buses reset back to the start of their routes.', 'SUCCESS');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Scenario 2: Student RFID Tap
  const handleRfidTap = async () => {
    setCardTapping(true);
    soundFx.playCardTapSuccess();

    try {
      const res = await api.simulateRfidTap('stud-1');
      setIsStudentBoarded(res.isBoarded);
      setLastBoardingAlert(res.message);
      addLog(`Card Tapped: ${res.student.name} is now ${res.isBoarded ? 'BOARDED (Seat 14A)' : 'OFF THE BUS'} on ${res.bus.busNumber}`, 'SUCCESS');
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setCardTapping(false), 500);
    }
  };

  // Trigger Scenario 3: Traffic Delay & Detour
  const handleTrafficDelay = async () => {
    try {
      const res = await api.simulateTrafficDelay('bus-6');
      setIsTrafficDelayed(true);
      setDetourInfo(res.detourRecommended);
      soundFx.playNotificationChime();
      addLog(`Traffic Delay: Heavy traffic on ${res.bus.routeName}. ETA +14 mins.`, 'WARNING');
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Scenario 4: SOS Panic
  const handleTriggerSos = async () => {
    if (isSosActive) {
      await api.clearEmergencyState();
      setIsSosActive(false);
      addLog('Emergency cleared. Driver confirmed situation is safe.', 'INFO');
      fetchLiveTelemetry();
    } else {
      soundFx.playEmergencySiren();
      await api.triggerEmergencyAlert({
        busId: 'bus-1',
        title: 'DRIVER SOS ALARM: Bus 75',
        message: 'Driver Muthuvelan R. pressed the safety alarm button near Chromepet.',
      });
      setIsSosActive(true);
      addLog('SAFETY ALARM TRIGGERED on Bus 75! College office notified.', 'DANGER');
      fetchLiveTelemetry();
    }
  };

  // Trigger Scenario 5: Proximity Alert
  const handleProximityAlert = async () => {
    soundFx.playNotificationChime();
    try {
      const res = await api.simulateProximityTrigger('bus-1', 'bp-106');
      setProximityFired(true);
      setProximityMessage(res.alert.message);
      addLog(`5-Minute Alert: ${res.bus.busNumber} reached Pallavaram Stop!`, 'SUCCESS');
    } catch (err) {
      console.error(err);
    }
  };

  const tourSteps = [
    {
      title: '1. Live Bus Map',
      desc: 'Watch the buses move along real city streets in real time. Click any bus to see its speed and arrival time.',
      actionTab: 'live-tracking',
      actionLabel: 'Go to Bus Map',
    },
    {
      title: '2. Student Card Tap',
      desc: 'When a student gets on the bus and taps their card, parents immediately receive a confirmation message.',
      actionTab: 'demo',
      actionLabel: 'Try Card Tap Here',
    },
    {
      title: '3. Easy Portals for Everyone',
      desc: 'Students see their bus countdown, parents track their child, and the college office manages all 10 buses.',
      actionTab: 'portal',
      actionLabel: 'Open Portals',
    },
    {
      title: '4. Voice Assistant',
      desc: 'You can talk in your own language (Tamil, Hindi, English, Spanish, etc.) to ask when the bus arrives.',
      actionTab: 'transit-ai',
      actionLabel: 'Try Voice Assistant',
    },
    {
      title: '5. World Campus Map',
      desc: 'See how university bus networks run in Tokyo, London, Zurich, Dubai, and Singapore.',
      actionTab: 'world-map',
      actionLabel: 'View World Map',
    },
  ];

  return (
    <div className="flex-1 bg-[#f8fafc] text-slate-900 p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full font-sans">
      {/* Centered Top Banner (Lite, steady colors) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Interactive Working Demo</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display max-w-2xl mx-auto">
          Test All Bus Features Right Now
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          No need to wait for buses on the road. You can test live bus movements, tap a student ID card, simulate road traffic, and test emergency alerts with one click.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setShowGuidedTour(true);
              setTourStep(0);
            }}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Start 1-Minute Tour
          </button>

          <button
            onClick={() => onNavigateToTab('live-tracking')}
            className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            Open Live Bus Map
          </button>
        </div>
      </div>

      {/* Steady Controls Bar (Clean light white cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Play/Pause */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bus Movement</div>
            <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${simulationRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{simulationRunning ? 'Moving on Roads' : 'Paused'}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{buses.length} buses active</div>
          </div>
          <button
            onClick={handleToggleSimulation}
            className={`p-3 rounded-xl border transition-colors cursor-pointer ${
              simulationRunning
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={simulationRunning ? 'Pause Bus Movements' : 'Resume Bus Movements'}
          >
            {simulationRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
        </div>

        {/* Metric 2: Speed */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Speed Control</div>
          <div className="flex items-center gap-1.5 mt-2">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  speedMultiplier === s
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Metric 3: Active buses */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campus Fleet</div>
            <div className="text-base font-bold text-slate-900 mt-1">10 Buses Active</div>
            <div className="text-xs text-emerald-600 mt-0.5 font-medium">5 Routes Covered</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
            100%
          </div>
        </div>

        {/* Metric 4: Reset */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reset Buses</div>
            <div className="text-sm font-bold text-slate-800 mt-1">Start from Beginning</div>
            <div className="text-xs text-slate-500">Clears test delays</div>
          </div>
          <button
            onClick={handleResetFleet}
            disabled={loading}
            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title="Reset buses to origin"
          >
            <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5 Interactive Scenarios (Normal, plain English words) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>5 Easy Test Scenarios (Click to Try)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap any button below to see the app react with sounds and automatic messages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Scenario 1: Fast Bus Movement */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Test 1
              </span>
              <h3 className="text-base font-bold text-slate-900">Run Buses at 3x Speed</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Speeds up all 10 buses along their routes so you can watch them arrive at stops quickly without waiting.
              </p>
            </div>
            <button
              onClick={() => handleSpeedChange(3)}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Fast-Forward Buses (3x)</span>
            </button>
          </div>

          {/* Scenario 2: Student Card Tap */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Test 2
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {isStudentBoarded ? 'Status: Boarded (Seat 14A)' : 'Status: Waiting at Stop'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Tap Student ID Card</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Test the card reader chime for student <strong>Sarah Jenkins (Bus 75)</strong>. Sends an automatic message to parent Robert Jenkins.
              </p>

              {lastBoardingAlert && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                  ✓ {lastBoardingAlert}
                </div>
              )}
            </div>

            <button
              onClick={handleRfidTap}
              disabled={cardTapping}
              className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isStudentBoarded
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{isStudentBoarded ? 'Tap Again to Leave Bus' : 'Tap Card to Board Bus'}</span>
            </button>
          </div>

          {/* Scenario 3: Traffic Delay */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                Test 3
              </span>
              <h3 className="text-base font-bold text-slate-900">Simulate Road Traffic Delay</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Simulates heavy traffic on Route 3. Bus 88 turns to <strong>DELAYED (+14 min)</strong> and shows a faster alternative detour route.
              </p>

              {detourInfo && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                  ⚡ <strong>Faster Detour Found:</strong> {detourInfo}
                </div>
              )}
            </div>

            <button
              onClick={handleTrafficDelay}
              className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Road Traffic</span>
            </button>
          </div>

          {/* Scenario 4: Driver Emergency Help */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  Test 4
                </span>
                <span className="text-xs font-bold text-rose-600">
                  {isSosActive ? 'ALARM ACTIVE' : 'Normal'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Test Driver Safety Alarm</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plays the driver safety siren and alerts the college office immediately so help can be sent.
              </p>
            </div>

            <button
              onClick={handleTriggerSos}
              className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isSosActive
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
              }`}
            >
              <Siren className="w-4 h-4" />
              <span>{isSosActive ? 'Turn Off Safety Alarm' : 'Press Safety Alarm'}</span>
            </button>
          </div>

          {/* Scenario 5: 5-Minute Arrival Chime */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                Test 5
              </span>
              <h3 className="text-base font-bold text-slate-900">5-Minute Arrival Alert Chime</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Moves Bus 75 near Pallavaram Stop to trigger the phone arrival chime and notification.
              </p>

              {proximityMessage && (
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900">
                  🔔 {proximityMessage}
                </div>
              )}
            </div>

            <button
              onClick={handleProximityAlert}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Play 5-Minute Arrival Chime</span>
            </button>
          </div>

          {/* Scenario 6: Voice Assistant */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md">
                Test 6
              </span>
              <h3 className="text-base font-bold text-slate-900">Voice Assistant in 9 Languages</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Talk to the app in English, Tamil, Hindi, or Spanish. Ask: "Where is Bus 75 right now?"
              </p>
            </div>

            <button
              onClick={() => {
                if (onOpenVoiceChat) {
                  onOpenVoiceChat('Where is Bus 75 right now?');
                } else {
                  onNavigateToTab('transit-ai');
                }
              }}
              className="w-full py-2.5 px-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Ask Voice Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Switcher Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Switch Between the 4 Portal Views
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any role to see what students, parents, drivers, and admins see on their screens.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => {
              switchRole('ROLE_STUDENT');
              onNavigateToTab('portal');
            }}
            className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-white transition-all cursor-pointer space-y-2"
          >
            <div className="text-2xl">🎓</div>
            <div className="text-sm font-bold text-slate-900">Student Portal</div>
            <p className="text-xs text-slate-500">Sarah Jenkins • Bus 75</p>
          </div>

          <div
            onClick={() => {
              switchRole('ROLE_PARENT');
              onNavigateToTab('portal');
            }}
            className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-white transition-all cursor-pointer space-y-2"
          >
            <div className="text-2xl">👨‍👩‍👧</div>
            <div className="text-sm font-bold text-slate-900">Parent Portal</div>
            <p className="text-xs text-slate-500">Robert Jenkins • Child Safety</p>
          </div>

          <div
            onClick={() => {
              switchRole('ROLE_ADMIN');
              onNavigateToTab('portal');
            }}
            className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-white transition-all cursor-pointer space-y-2"
          >
            <div className="text-2xl">🛡️</div>
            <div className="text-sm font-bold text-slate-900">Admin Bus Office</div>
            <p className="text-xs text-slate-500">Dr. Vance • All 10 Buses</p>
          </div>

          <div
            onClick={() => {
              switchRole('ROLE_DRIVER');
              onNavigateToTab('portal');
            }}
            className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-white transition-all cursor-pointer space-y-2"
          >
            <div className="text-2xl">🚌</div>
            <div className="text-sm font-bold text-slate-900">Driver Portal</div>
            <p className="text-xs text-slate-500">Muthuvelan R. • Stop Checklist</p>
          </div>
        </div>
      </div>

      {/* Simulator Event Log (Steady, plain English) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Live Activity Feed</h3>
          <span className="text-xs text-slate-500">{recentLogs.length} updates</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto text-xs pr-2">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded-xl border flex items-start gap-3 ${
                log.type === 'SUCCESS'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : log.type === 'WARNING'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : log.type === 'DANGER'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">{log.time}</span>
              <span className="flex-1 font-medium">{log.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Guided Tour Modal */}
      {showGuidedTour && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Step {tourStep + 1} of {tourSteps.length}
              </span>
              <button
                onClick={() => setShowGuidedTour(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                {tourSteps[tourStep].title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {tourSteps[tourStep].desc}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setTourStep((prev) => Math.max(0, prev - 1))}
                disabled={tourStep === 0}
                className="py-2 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>

              {tourStep < tourSteps.length - 1 ? (
                <button
                  onClick={() => setTourStep((prev) => prev + 1)}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowGuidedTour(false)}
                  className="py-2 px-4 bg-indigo-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
