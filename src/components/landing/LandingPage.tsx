import React from 'react';
import {
  Bus,
  MapPin,
  Bell,
  Radio,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
  Smartphone,
  PlayCircle,
  Download,
  CreditCard,
  Shield,
  PhoneCall,
  Navigation,
  Mic,
  BookOpen,
  Sparkles,
  Info,
  Building2,
  Map,
  Play,
} from 'lucide-react';
import type { Bus as BusType } from '../../types/index.ts';

interface LandingPageProps {
  onEnterPortal: (role?: 'ROLE_STUDENT' | 'ROLE_PARENT' | 'ROLE_ADMIN') => void;
  onOpenLiveTracking: () => void;
  onOpenWorldMap?: () => void;
  onOpenTamilNaduMap?: () => void;
  onOpenCollegeDataset?: () => void;
  onReplaySplash?: () => void;
  collegeName?: string;
  onOpenVoiceChat?: () => void;
  onOpenDemo?: () => void;
  onOpenGuide?: () => void;
  activeBusesCount: number;
  totalStudentsCount: number;
  totalRoutesCount: number;
  buses: BusType[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPortal,
  onOpenLiveTracking,
  onOpenWorldMap,
  onOpenTamilNaduMap,
  onOpenCollegeDataset,
  onReplaySplash,
  collegeName,
  onOpenVoiceChat,
  onOpenDemo,
  onOpenGuide,
  activeBusesCount,
  totalStudentsCount,
  totalRoutesCount,
  buses,
}) => {
  const currentCampus = collegeName || 'Anna University - CEG & MIT Campuses';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* 1. Centered Hero Section (Clean, bright, steady, beginner-friendly) */}
      <section className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          {/* Friendly status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tamil Nadu College Bus Network • Real-Time Service</span>
          </div>

          {/* Active College Switcher Banner (For College Students to customize dataset) */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 p-1.5 sm:px-4 sm:py-2 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-xs shadow-xs max-w-xl mx-auto">
            <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-slate-600">Active College:</span>
            <span className="font-bold text-indigo-900 truncate max-w-[280px]">{currentCampus}</span>
            {onOpenCollegeDataset && (
              <button
                onClick={onOpenCollegeDataset}
                className="ml-1 px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-300 transition-colors cursor-pointer text-[11px]"
              >
                Change College / Dataset
              </button>
            )}
          </div>

          {/* Centered Main Title with Normal English words */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-display">
            Track Your College Bus in Real Time
          </h1>

          {/* Centered Friendly Description */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Live GPS tracking for college students and parents across Tamil Nadu.
            Know exactly when your bus reaches your stop and receive safe boarding alerts automatically.
          </p>

          {/* Centered Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenLiveTracking}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Radio className="w-4 h-4 text-emerald-300" />
              <span>See Live Bus on Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenDemo && (
              <button
                onClick={onOpenDemo}
                className="py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Try Working Demo</span>
              </button>
            )}

            {(onOpenTamilNaduMap || onOpenWorldMap) && (
              <button
                onClick={onOpenTamilNaduMap || onOpenWorldMap}
                className="py-3 px-5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Map className="w-4 h-4 text-emerald-600" />
                <span>Tamil Nadu Map</span>
              </button>
            )}

            {onOpenCollegeDataset && (
              <button
                onClick={onOpenCollegeDataset}
                className="py-3 px-5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>My College Dataset</span>
              </button>
            )}

            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-300/80 transition-all flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>What is MyBus? (Guide)</span>
              </button>
            )}

            {onOpenVoiceChat && (
              <button
                onClick={onOpenVoiceChat}
                className="py-3 px-5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-pink-600" />
                <span>Voice Assistant</span>
              </button>
            )}
          </div>

          {/* Separated Opening Logo Intro Trigger (Explicitly separated from navigation links) */}
          {onReplaySplash && (
            <div className="pt-2">
              <button
                onClick={onReplaySplash}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Watch the opening logo animation again"
              >
                <Play className="w-3 h-3 text-indigo-500 fill-current" />
                <span>Replay Opening Logo Intro</span>
              </button>
            </div>
          )}

          {/* Centered Quick Metrics (Steady, solid, clear) */}
          <div className="pt-6 max-w-2xl mx-auto grid grid-cols-3 gap-4 border-t border-slate-100">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {activeBusesCount || 10}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Buses on the Road</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono">
                {totalRoutesCount || 5}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Campus Routes</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
                {totalStudentsCount || 102}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Students Safe</div>
            </div>
          </div>
        </div>

        {/* Steady Featured Bus Preview Card (Centered, no floating or overlapping) */}
        <div className="max-w-3xl mx-auto mt-12 rounded-3xl bg-slate-50 border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                75
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Bus 75 • South Express</h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    On Time
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Route 1: Chennai Central Station to {currentCampus}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenLiveTracking}
              className="py-2 px-4 bg-white hover:bg-slate-100 text-indigo-600 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Track Bus 75 Live</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-left">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 font-medium">Current Speed</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">42 km/h</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 font-medium">Next Bus Stop</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">Pallavaram Stand</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 font-medium">Arrival Time (ETA)</div>
              <div className="text-sm font-bold text-indigo-600 mt-0.5 font-mono">3 minutes</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 font-medium">Driver Contact</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">Muthuvelan R.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Choose Your Portal (Clean, steady cards for Student, Parent, Driver, Admin) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Who is Using the App Today?
          </h2>
          <p className="text-sm text-slate-600">
            Click your role below to view your personalized bus screen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card: Student */}
          <div
            onClick={() => onEnterPortal('ROLE_STUDENT')}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                🎓
              </div>
              <h3 className="text-lg font-bold text-slate-900">Student Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Check when your bus reaches your stop, view walking time, and use your digital bus pass QR code.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Open Student Screen</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card: Parent */}
          <div
            onClick={() => onEnterPortal('ROLE_PARENT')}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                👨‍👩‍👧
              </div>
              <h3 className="text-lg font-bold text-slate-900">Parent Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track your child's bus on the map, receive automatic pickup alerts, and contact the driver directly.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
              <span>Open Parent Screen</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card: Admin */}
          <div
            onClick={() => onEnterPortal('ROLE_ADMIN')}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                🛡️
              </div>
              <h3 className="text-lg font-bold text-slate-900">Admin Fleet Manager</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full college transportation office: monitor all 10 buses, create routes, and send campus announcements.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Open Admin Screen</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works in 3 Simple Steps (Steady & plain English) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              How MyBus Works in 3 Easy Steps
            </h2>
            <p className="text-sm text-slate-600">
              Everything happens automatically so you always know where your bus is.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center font-mono">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">GPS Follows the Bus</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Each bus sends its live location every 2.5 seconds. You can watch the icon move smoothly along the roads.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center font-mono">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">5-Minute Arrival Alert</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When the bus is 500 meters or 5 minutes from your pickup point, your phone alerts you so you can step outside calmly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center font-mono">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Student Card Tap</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Students tap their college ID when boarding. Parents get an instant message saying their child is safely on board.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Complete App Features Description Port (Prompt Requirement) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Complete App Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Everything Included in This App
          </h2>
          <p className="text-sm text-slate-600">
            Click any feature below to try it out or read how it helps you every day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 space-y-2 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Live Campus Bus Map</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full map connecting Chennai Central, Guindy, Tambaram, and campus corridors across Tamil Nadu with live speeds.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 space-y-2 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">College Dataset Customizer</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select your college preset (Anna Univ, PSG Tech, TCE Madurai, SRM, SSN) or add your custom campus routes & stops.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 space-y-2 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Student ID Card Tap</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Safe student check-in with card tap sounds and instant confirmation SMS to parents.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 space-y-2 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">5-Minute Stop Alerts</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatic alerts when the bus is approaching your stop. No more standing in rain or heat.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 space-y-2 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Campus Routes & Stops Timetable</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete timetable with morning pickup and evening departure times for all college boarding stops.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 space-y-2 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Voice Assistant in 9 Languages</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Speak in English, Tamil, Hindi, etc., to ask "When will my bus arrive?" or "Is there any delay?"
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 space-y-2 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Emergency Help & Driver SOS</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              One-touch driver safety button that immediately alerts the college control office.
            </p>
          </div>
        </div>

        {onOpenGuide && (
          <div className="text-center pt-2">
            <button
              onClick={onOpenGuide}
              className="py-2.5 px-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Complete Feature Guide Modal</span>
            </button>
          </div>
        )}
      </section>

      {/* 5. Mobile App & Working Demo Banner (Steady, clean light styling) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-indigo-50/60 border-t border-slate-200">
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-indigo-100 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Phone Ready</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 font-display">
              Use MyBus on Your Mobile Phone
            </h3>
            <p className="text-sm text-slate-600 max-w-md">
              Add MyBus directly to your iPhone or Android home screen for one-tap tracking with offline support.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {onOpenDemo && (
              <button
                onClick={onOpenDemo}
                className="py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Try Demo Hub</span>
              </button>
            )}

            <button
              onClick={onOpenLiveTracking}
              className="py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Open Live Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Simple Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500 space-y-2">
        <p className="font-medium text-slate-700">MyBus • Smart College Bus Tracking</p>
        <p>Simple, safe, and reliable transportation for students, parents, and drivers.</p>
      </footer>
    </div>
  );
};
