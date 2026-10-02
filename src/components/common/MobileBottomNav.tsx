import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  Home,
  MapPin,
  Sparkles,
  Globe,
  Shield,
  Menu,
  X,
  Bell,
  Navigation,
  Mic,
  Languages,
  PlayCircle,
  Radio,
  BookOpen,
  Building2,
  Map,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadAlertCount?: number;
  onOpenVoiceChat?: () => void;
  onOpenLogin?: () => void;
  onOpenGuide?: () => void;
  onOpenCollegeDataset?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  unreadAlertCount = 0,
  onOpenVoiceChat,
  onOpenLogin,
  onOpenGuide,
  onOpenCollegeDataset,
}) => {
  const { role, switchRole, isAuthenticated } = useAuth();
  const { language, setLanguage, availableLanguages, currentLanguageOption } = useLanguage();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const handleTabClick = (tabId: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    onSelectTab(tabId);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer when 'More' is tapped */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsMoreMenuOpen(false)}
          />

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  MB
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">All App Features</h3>
                  <p className="text-[11px] text-slate-500">Quick shortcuts to every tool</p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Voice Card */}
            <div
              onClick={() => {
                setIsMoreMenuOpen(false);
                if (onOpenVoiceChat) onOpenVoiceChat();
              }}
              className="p-3.5 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <Mic className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Voice Assistant
                    <span className="text-[9px] bg-pink-600 text-white font-bold px-1.5 py-0.2 rounded">
                      SPEAK
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600">Ask questions in 9 languages</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-pink-700 bg-white px-2.5 py-1 rounded-lg border border-pink-200 shadow-xs">
                Talk
              </span>
            </div>

            {/* App Guide Card */}
            {onOpenGuide && (
              <div
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenGuide();
                }}
                className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      What is MyBus? (Full Guide)
                    </h4>
                    <p className="text-[11px] text-slate-600">Simple explanation of all 9 features</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-xs">
                  Read
                </span>
              </div>
            )}

            {/* College Dataset Card */}
            {onOpenCollegeDataset && (
              <div
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenCollegeDataset();
                }}
                className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      College Bus Dataset
                    </h4>
                    <p className="text-[11px] text-slate-600">Change college, add routes & stops</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-xs">
                  Edit
                </span>
              </div>
            )}

            {/* Navigation Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleTabClick('routes')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                  currentTab === 'routes'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Routes & Stops</div>
                  <div className="text-[10px] text-slate-500">5 Lines Timetable</div>
                </div>
              </button>

              <button
                onClick={() => handleTabClick('alerts')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                  currentTab === 'alerts'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center relative">
                  <Bell className="w-4 h-4" />
                  {unreadAlertCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Notifications</div>
                  <div className="text-[10px] text-slate-500">
                    {unreadAlertCount > 0 ? `${unreadAlertCount} new` : 'All clear'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTabClick('demo')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                  currentTab === 'demo'
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <PlayCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Working Demo</div>
                  <div className="text-[10px] text-amber-700">1-Click Simulator</div>
                </div>
              </button>

              <button
                onClick={() => handleTabClick('tn-map')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                  currentTab === 'tn-map' || currentTab === 'world-map'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Tamil Nadu Map</div>
                  <div className="text-[10px] text-slate-500">Colleges & Zones</div>
                </div>
              </button>
            </div>

            {/* Role Switcher */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                Switch Active Screen
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    switchRole('ROLE_STUDENT');
                    handleTabClick('portal');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition-all ${
                    role === 'ROLE_STUDENT'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => {
                    switchRole('ROLE_PARENT');
                    handleTabClick('portal');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition-all ${
                    role === 'ROLE_PARENT'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Parent
                </button>
                <button
                  onClick={() => {
                    switchRole('ROLE_ADMIN');
                    handleTabClick('portal');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition-all ${
                    role === 'ROLE_ADMIN'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="w-full flex items-center justify-between text-xs text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium">Language:</span>
                  <span className="font-bold text-indigo-700">
                    {currentLanguageOption.flag} {currentLanguageOption.nativeName}
                  </span>
                </div>
                <span className="text-[11px] text-indigo-600 font-bold">Change</span>
              </button>

              {showLangPicker && (
                <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-200">
                  {availableLanguages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangPicker(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-[11px] flex items-center justify-center gap-1.5 ${
                        language === l.code
                          ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span className="truncate">{l.nativeName.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sign in button if not logged in */}
            {!isAuthenticated && onOpenLogin && (
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Sign In to Your Account
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fixed Bottom Dock Navigation (Visible on mobile/tablet < lg) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-md pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {/* Tab 1: Home */}
          <button
            onClick={() => handleTabClick('landing')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative ${
              currentTab === 'landing' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Home</span>
            {currentTab === 'landing' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600" />
            )}
          </button>

          {/* Tab 2: Live Bus Map */}
          <button
            onClick={() => handleTabClick('live-tracking')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative ${
              currentTab === 'live-tracking' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-[10px] font-medium tracking-tight">Bus Map</span>
            {currentTab === 'live-tracking' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600" />
            )}
          </button>

          {/* Tab 3: Working Demo (Central Button) */}
          <button
            onClick={() => handleTabClick('demo')}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative group"
          >
            <div
              className={`w-10 h-10 -mt-3 rounded-2xl flex items-center justify-center shadow-md transition-transform active:scale-95 ${
                currentTab === 'demo'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/30'
                  : 'bg-amber-400 text-slate-900 font-bold'
              }`}
            >
              <PlayCircle className="w-5 h-5" />
            </div>
            <span
              className={`text-[9px] font-bold tracking-tight uppercase ${
                currentTab === 'demo' ? 'text-amber-700' : 'text-slate-600'
              }`}
            >
              Demo
            </span>
          </button>

          {/* Tab 4: Routes */}
          <button
            onClick={() => handleTabClick('routes')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative ${
              currentTab === 'routes' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Navigation className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Routes</span>
            {currentTab === 'routes' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600" />
            )}
          </button>

          {/* Tab 5: Portal */}
          <button
            onClick={() => handleTabClick('portal')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative ${
              currentTab === 'portal' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Portal</span>
            {currentTab === 'portal' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600" />
            )}
          </button>

          {/* Tab 6: More Menu Drawer */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center w-11 h-full gap-1 transition-colors relative ${
              isMoreMenuOpen ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="More Options"
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
