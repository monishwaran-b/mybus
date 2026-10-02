import React from 'react';
import {
  X,
  Bus,
  MapPin,
  CreditCard,
  Bell,
  Navigation,
  Shield,
  Mic,
  Globe,
  Smartphone,
  PlayCircle,
  Clock,
  CheckCircle2,
  PhoneCall,
  Users,
  Info,
  ArrowRight,
} from 'lucide-react';

interface AppDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToTab?: (tab: string) => void;
}

export const AppDescriptionModal: React.FC<AppDescriptionModalProps> = ({
  isOpen,
  onClose,
  onJumpToTab,
}) => {
  if (!isOpen) return null;

  const features = [
    {
      id: 'live-tracking',
      icon: MapPin,
      iconColor: 'text-blue-600 bg-blue-50',
      title: '1. Live Bus Map (GPS Tracking)',
      badge: 'Real-Time Map',
      summary: 'See where each bus is driving on the road right now.',
      details:
        'Watch the bus move along the actual route with live speed in km/h and estimated arrival minutes. You can click any bus to see its driver name, bus number, and next stop.',
      tab: 'live-tracking',
      actionLabel: 'Open Live Bus Map',
    },
    {
      id: 'rfid-tap',
      icon: CreditCard,
      iconColor: 'text-emerald-600 bg-emerald-50',
      title: '2. Student Card Tap (Safe Boarding)',
      badge: 'Student Safety',
      summary: 'Know the exact second your child gets on or off the bus.',
      details:
        'Students tap their college smart ID card when stepping onto the bus. The system automatically records their seat and sends an instant message to parents with the exact time and stop name.',
      tab: 'demo',
      actionLabel: 'Test Card Tap in Demo',
    },
    {
      id: 'alerts',
      icon: Bell,
      iconColor: 'text-amber-600 bg-amber-50',
      title: '3. 5-Minute Arrival Notifications',
      badge: 'Never Miss Bus',
      summary: 'Get an automatic message 5 minutes before the bus reaches your stop.',
      details:
        'When the bus gets within 500 meters or 5 minutes of your pickup stop, your phone rings with a gentle chime and message: "Bus 75 is approaching your stop. Please walk to the gate."',
      tab: 'alerts',
      actionLabel: 'View Notifications',
    },
    {
      id: 'routes',
      icon: Navigation,
      iconColor: 'text-indigo-600 bg-indigo-50',
      title: '4. Bus Routes & Stop Timetables',
      badge: '5 Active Lines',
      summary: 'Clear list of every route, stop name, and morning/evening times.',
      details:
        'Covers 5 major college routes (Route 1 South Express, Route 2 OMR IT Corridor, Route 3 West Corridor, Route 4 North Metro, Route 5 Medavakkam). View every single stop order, road map, and pickup time.',
      tab: 'routes',
      actionLabel: 'See All Routes & Stops',
    },
    {
      id: 'portals',
      icon: Users,
      iconColor: 'text-purple-600 bg-purple-50',
      title: '5. Easy Portals for Everyone',
      badge: '4 Easy Views',
      summary: 'Special simple screens for Students, Parents, Drivers, and College Admins.',
      details:
        '• Student: Shows your assigned bus, walking time to stop, and digital bus pass QR.\n• Parent: Shows live tracking for your child and 1-tap call to driver.\n• Driver: Shows route checklist and stops left.\n• Admin: Shows all 10 buses and campus safety controls.',
      tab: 'portal',
      actionLabel: 'Explore Portals',
    },
    {
      id: 'sos',
      icon: PhoneCall,
      iconColor: 'text-rose-600 bg-rose-50',
      title: '6. Driver Emergency & Safety Help',
      badge: 'Safety First',
      summary: 'One-touch emergency button for instant help.',
      details:
        'If there is a breakdown, heavy roadblock, or emergency, the driver can press one button. The college office and parents get notified immediately so alternative transport can be arranged without delay.',
      tab: 'demo',
      actionLabel: 'Test Emergency SOS',
    },
    {
      id: 'voice-chat',
      icon: Mic,
      iconColor: 'text-pink-600 bg-pink-50',
      title: '7. Voice Assistant in 9 Languages',
      badge: 'Talk to App',
      summary: 'Speak naturally to ask questions about your bus in your own language.',
      details:
        'Just tap the microphone and ask: "Where is Bus 75?", "Is there any delay?", or "What time does it reach campus?" Works in English, Tamil, Hindi, Spanish, French, German, Japanese, Chinese, and Arabic.',
      tab: 'transit-ai',
      actionLabel: 'Open Voice Assistant',
    },
    {
      id: 'demo',
      icon: PlayCircle,
      iconColor: 'text-amber-600 bg-amber-50',
      title: '8. Working Demo Simulator',
      badge: 'Instant Testing',
      summary: 'Test all features right now with 1 click without waiting.',
      details:
        'Run the morning rush hour at 3x speed, test a student card tap, simulate traffic delays, or test the 5-minute arrival alert. Perfect for first-time visitors and college staff evaluations.',
      tab: 'demo',
      actionLabel: 'Open Working Demo',
    },
    {
      id: 'mobile-app',
      icon: Smartphone,
      iconColor: 'text-cyan-600 bg-cyan-50',
      title: '9. Install on Your Phone (Mobile App)',
      badge: 'Fast & Offline',
      summary: 'Add MyBus directly to your iPhone or Android home screen.',
      details:
        'Works just like a native app installed from the store! Loads fast, works offline even with poor mobile internet, and keeps bus schedules saved on your device.',
      tab: 'landing',
      actionLabel: 'Install on Phone',
    },
    {
      id: 'college-dataset',
      icon: Bus,
      iconColor: 'text-indigo-600 bg-indigo-50',
      title: '10. Tamil Nadu College Dataset Manager',
      badge: 'Student Friendly',
      summary: 'Switch to your college preset or customize your campus bus routes & stops.',
      details:
        'Choose presets like Anna University Chennai, PSG Tech Coimbatore, TCE Madurai, SRM, or SSN, or add your own college routes and stops with arrival times.',
      tab: 'tn-map',
      actionLabel: 'Open Tamil Nadu Map & Corridors',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  Everything You Can Do in MyBus
                </h2>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                  Simple Guide
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                A simple beginner's overview of all 9 features included in this app
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick summary note */}
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900 leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">What is MyBus?</strong>
              MyBus is a simple, easy-to-use college bus tracker. It helps students never miss the bus, gives parents peace of mind that their child reached safely, and helps bus drivers stay on time.
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-xs">
              All 9 Main Features
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${f.iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {f.badge}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                      <p className="text-xs font-medium text-slate-700">{f.summary}</p>
                      <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                        {f.details}
                      </p>
                    </div>

                    {onJumpToTab && (
                      <button
                        onClick={() => {
                          onJumpToTab(f.tab);
                          onClose();
                        }}
                        className="w-full pt-2 mt-2 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-between cursor-pointer group"
                      >
                        <span>{f.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Works on phones, tablets, and computers.
          </div>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
