import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { UserRole } from '../../types/index.ts';
import {
  Bus,
  Shield,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  MapPin,
  Mic,
  PlayCircle,
  Smartphone,
  BookOpen,
  Building2,
  Play,
  Map,
} from 'lucide-react';
import { VoiceTranscriberModal } from '../voice/VoiceTranscriberModal.tsx';
import { AiVoiceChatModal } from '../voice/AiVoiceChatModal.tsx';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadAlertCount?: number;
  onOpenLogin?: () => void;
  onOpenVoiceChat?: () => void;
  onOpenGuide?: () => void;
  onReplaySplash?: () => void;
  onOpenCollegeDataset?: () => void;
  collegeName?: string;
  collegeShortName?: string;
  isMobileDeviceMode?: boolean;
  onToggleMobileMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  unreadAlertCount = 0,
  onOpenLogin,
  onOpenVoiceChat,
  onOpenGuide,
  onReplaySplash,
  onOpenCollegeDataset,
  collegeName,
  collegeShortName,
  isMobileDeviceMode = false,
  onToggleMobileMode,
}) => {
  const { user, role, switchRole, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, availableLanguages, currentLanguageOption, t } = useLanguage();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'ROLE_ADMIN':
        return 'Admin';
      case 'ROLE_STUDENT':
        return 'Student';
      case 'ROLE_PARENT':
        return 'Parent';
      case 'ROLE_DRIVER':
        return 'Driver';
      default:
        return 'User';
    }
  };

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-white border-b border-slate-200/90 shadow-xs px-3 sm:px-6">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-3">
        {/* Zone 1: Logo & App Name (Clean brand block, NO mingling with nav tabs) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('landing')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none group flex-shrink-0 cursor-pointer"
            title="MyBus Tamil Nadu Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Bus className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
                MyBus
              </span>
              <span className="text-[10px] text-slate-500 -mt-1 font-medium hidden sm:inline">
                Tamil Nadu College Bus
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Well-separated, clean spacing) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs xl:text-sm font-semibold text-slate-600">
          <button
            onClick={() => onSelectTab('landing')}
            className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap hover:text-slate-900 cursor-pointer ${
              currentTab === 'landing' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-600'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => onSelectTab('live-tracking')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors whitespace-nowrap hover:text-slate-900 cursor-pointer ${
              currentTab === 'live-tracking' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-600'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Bus Map</span>
          </button>

          <button
            onClick={() => onSelectTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'demo'
                ? 'bg-amber-100 text-amber-900 font-bold'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100/80'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Working Demo</span>
          </button>

          <button
            onClick={() => onSelectTab('portal')}
            className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap hover:text-slate-900 cursor-pointer ${
              currentTab === 'portal' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-600'
            }`}
          >
            {role === 'ROLE_ADMIN'
              ? 'Admin Portal'
              : role === 'ROLE_PARENT'
              ? 'Parent Portal'
              : role === 'ROLE_DRIVER'
              ? 'Driver Portal'
              : 'Student Portal'}
          </button>

          <button
            onClick={() => onSelectTab('routes')}
            className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap hover:text-slate-900 cursor-pointer ${
              currentTab === 'routes' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-600'
            }`}
          >
            Routes & Stops
          </button>

          <button
            onClick={() => onSelectTab('tn-map')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors whitespace-nowrap hover:text-slate-900 cursor-pointer ${
              currentTab === 'tn-map' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-600'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tamil Nadu Map</span>
          </button>

          <button
            onClick={() => onSelectTab('alerts')}
            className={`relative px-2 py-1 rounded-lg transition-colors whitespace-nowrap hover:text-slate-900 cursor-pointer ${
              currentTab === 'alerts' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-600'
            }`}
          >
            <span>Notifications</span>
            {unreadAlertCount > 0 && (
              <span className="ml-1 text-xs text-rose-600 font-mono font-bold">
                ({unreadAlertCount})
              </span>
            )}
          </button>

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 transition-colors whitespace-nowrap cursor-pointer px-2 py-1"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>App Guide</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Actions (College Data, Play Intro, Voice Assistant, Role switcher, Language, Login) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Custom College Data Button */}
          {onOpenCollegeDataset && (
            <button
              onClick={onOpenCollegeDataset}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Change your college name, routes, or load dataset"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden xl:inline">{collegeShortName ? `${collegeShortName} Data` : 'College Data'}</span>
              <span className="xl:hidden">College</span>
            </button>
          )}

          {/* Vertical divider to distinctly isolate utility buttons from navigation */}
          {onReplaySplash && <div className="h-5 w-px bg-slate-200 hidden md:block mx-0.5" />}

          {/* Separated Play Intro Button (Far right action, completely distinct from Home) */}
          {onReplaySplash && (
            <button
              onClick={onReplaySplash}
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-700 font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Replay opening logo animation"
            >
              <Play className="w-3 h-3 text-indigo-600 fill-current" />
              <span>Play Intro</span>
            </button>
          )}

          {/* Mobile Phone Mode Switcher (Desktop only) */}
          {onToggleMobileMode && (
            <button
              onClick={onToggleMobileMode}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isMobileDeviceMode
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={isMobileDeviceMode ? 'Switch to Full Screen View' : 'Preview as Mobile App'}
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden xl:inline">{isMobileDeviceMode ? 'Full Screen' : 'Mobile View'}</span>
              <span className="xl:hidden">{isMobileDeviceMode ? 'Full' : 'Mobile'}</span>
            </button>
          )}

          {/* Voice Assistant Button */}
          <button
            onClick={() => {
              if (onOpenVoiceChat) {
                onOpenVoiceChat();
              } else {
                setIsVoiceChatOpen(true);
              }
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Ask Voice Assistant"
          >
            <Mic className="w-3.5 h-3.5 text-pink-600 animate-pulse" />
            <span className="hidden sm:inline">Voice Assistant</span>
            <span className="sm:hidden">Voice</span>
          </button>

          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs text-slate-700 font-medium transition-colors cursor-pointer"
              title="Change Language"
            >
              <span className="text-sm">{currentLanguageOption.flag}</span>
              <span className="hidden sm:inline text-xs">{currentLanguageOption.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div
                onMouseLeave={() => setShowLangMenu(false)}
                className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                  Choose Language
                </div>
                {availableLanguages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      language === l.code
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{l.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>{getRoleLabel(role)}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div
                onMouseLeave={() => setShowRoleMenu(false)}
                className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                  Switch Active Portal
                </div>
                <button
                  onClick={() => {
                    switchRole('ROLE_STUDENT');
                    setShowRoleMenu(false);
                    onSelectTab('portal');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    role === 'ROLE_STUDENT'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Student Portal</div>
                    <div className="text-[10px] text-slate-500">Sarah Jenkins • BUS-01</div>
                  </div>
                  <span className="text-xs">🎓</span>
                </button>

                <button
                  onClick={() => {
                    switchRole('ROLE_DRIVER');
                    setShowRoleMenu(false);
                    onSelectTab('portal');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    role === 'ROLE_DRIVER'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Driver Portal</div>
                    <div className="text-[10px] text-slate-500">Muthuvelan R. • BUS-01 Trip & GPS</div>
                  </div>
                  <span className="text-xs">🚌</span>
                </button>

                <button
                  onClick={() => {
                    switchRole('ROLE_PARENT');
                    setShowRoleMenu(false);
                    onSelectTab('portal');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    role === 'ROLE_PARENT'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Parent Portal</div>
                    <div className="text-[10px] text-slate-500">Robert Jenkins • Child Safety</div>
                  </div>
                  <span className="text-xs">👨‍👩‍👧</span>
                </button>

                <button
                  onClick={() => {
                    switchRole('ROLE_ADMIN');
                    setShowRoleMenu(false);
                    onSelectTab('portal');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    role === 'ROLE_ADMIN'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Admin Bus Manager</div>
                    <div className="text-[10px] text-slate-500">Dr. Vance • All 10 Buses</div>
                  </div>
                  <span className="text-xs">🛡️</span>
                </button>
              </div>
            )}
          </div>

          {/* User Sign In / Account */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => logout()}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 sm:px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Global AI Voice Chat Modal */}
      <AiVoiceChatModal
        isOpen={isVoiceChatOpen}
        onClose={() => setIsVoiceChatOpen(false)}
      />

      {/* Quick Dictate Modal */}
      <VoiceTranscriberModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onTranscriptionComplete={(text) => {
          setIsVoiceOpen(false);
          setIsVoiceChatOpen(true);
        }}
        title="Quick Voice Command"
        subtitle="Speak your command or inquiry to check bus status."
      />
    </header>
  );
};
