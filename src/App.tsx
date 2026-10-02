import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { Navbar } from './components/common/Navbar.tsx';
import { MobileBottomNav } from './components/common/MobileBottomNav.tsx';
import { MobileDevicePreview } from './components/common/MobileDevicePreview.tsx';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt.tsx';
import { AppIntroSplash } from './components/common/AppIntroSplash.tsx';
import { AppDescriptionModal } from './components/guide/AppDescriptionModal.tsx';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { StudentPortal } from './components/student/StudentPortal.tsx';
import { ParentPortal } from './components/parent/ParentPortal.tsx';
import { AdminPortal } from './components/admin/AdminPortal.tsx';
import { DriverPortal } from './components/driver/DriverPortal.tsx';
import { LiveTrackingView } from './components/tracking/LiveTrackingView.tsx';
import { TamilNaduMapView } from './components/map/TamilNaduMapView.tsx';
import { RoutesView } from './components/routes/RoutesView.tsx';
import { AlertsView } from './components/alerts/AlertsView.tsx';
import { TransitMapsAssistantView } from './components/transit-ai/TransitMapsAssistantView.tsx';
import { WorkingDemoView } from './components/demo/WorkingDemoView.tsx';
import { LoginModal } from './components/auth/LoginModal.tsx';
import { AiVoiceChatModal } from './components/voice/AiVoiceChatModal.tsx';
import { CollegeDatasetManagerModal } from './components/college/CollegeDatasetManagerModal.tsx';
import { api } from './services/api.ts';
import type { Bus, UserRole, CollegeConfig } from './types/index.ts';

function MainApp() {
  const { role, switchRole } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [voiceChatInitialQuery, setVoiceChatInitialQuery] = useState<string | undefined>(undefined);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [isMobileDeviceMode, setIsMobileDeviceMode] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState(false);
  const [collegeConfig, setCollegeConfig] = useState<CollegeConfig | null>(null);

  // Live telemetry summary for landing page metrics
  const [buses, setBuses] = useState<Bus[]>([]);
  const [totalStudents, setTotalStudents] = useState(102);
  const [totalRoutes, setTotalRoutes] = useState(5);

  useEffect(() => {
    // Initial fetch of fleet metrics and college configuration
    api
      .getCollegeInfo()
      .then((res) => setCollegeConfig(res.college))
      .catch((e) => console.error(e));

    api
      .getLiveTracking()
      .then((res) => setBuses(res.buses))
      .catch((e) => console.error(e));

    api
      .getStudents({ limit: 1 })
      .then((res) => setTotalStudents(res.total))
      .catch(() => {});

    api
      .getRoutes()
      .then((res) => setTotalRoutes(res.count))
      .catch(() => {});

    // Alerts count
    api
      .getAlerts()
      .then((res) => setUnreadAlerts(res.unreadCount))
      .catch(() => {});
  }, []);

  const handleEnterPortal = (targetRole?: UserRole) => {
    if (targetRole) {
      switchRole(targetRole);
    }
    setCurrentTab('portal');
  };

  const handleOpenVoiceChat = (initialQuery?: string) => {
    setVoiceChatInitialQuery(initialQuery);
    setIsVoiceChatOpen(true);
  };

  // Render view contents
  const renderTabContent = () => {
    switch (currentTab) {
      case 'landing':
        return (
          <LandingPage
            onEnterPortal={handleEnterPortal}
            onOpenLiveTracking={() => setCurrentTab('live-tracking')}
            onOpenWorldMap={() => setCurrentTab('tn-map')}
            onOpenTamilNaduMap={() => setCurrentTab('tn-map')}
            onOpenCollegeDataset={() => setIsCollegeModalOpen(true)}
            onReplaySplash={() => setShowSplash(true)}
            collegeName={collegeConfig?.collegeName}
            onOpenVoiceChat={() => handleOpenVoiceChat()}
            onOpenDemo={() => setCurrentTab('demo')}
            onOpenGuide={() => setIsGuideOpen(true)}
            activeBusesCount={buses.length}
            totalStudentsCount={totalStudents}
            totalRoutesCount={totalRoutes}
            buses={buses}
          />
        );

      case 'demo':
        return (
          <WorkingDemoView
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onOpenVoiceChat={(query) => handleOpenVoiceChat(query)}
          />
        );

      case 'live-tracking':
        return <LiveTrackingView />;

      case 'tn-map':
      case 'world-map':
        return (
          <TamilNaduMapView
            onSwitchToLocalRadar={() => setCurrentTab('live-tracking')}
            onOpenVoiceChatWithQuery={(q) => handleOpenVoiceChat(q)}
            onOpenCollegeDataset={() => setIsCollegeModalOpen(true)}
          />
        );

      case 'driver':
        return <DriverPortal />;

      case 'portal':
        return (
          <>
            {role === 'ROLE_ADMIN' && <AdminPortal />}
            {role === 'ROLE_PARENT' && <ParentPortal />}
            {role === 'ROLE_STUDENT' && <StudentPortal />}
            {role === 'ROLE_DRIVER' && <DriverPortal />}
          </>
        );

      case 'routes':
        return <RoutesView />;

      case 'alerts':
        return <AlertsView />;

      case 'transit-ai':
        return <TransitMapsAssistantView />;

      default:
        return (
          <LandingPage
            onEnterPortal={handleEnterPortal}
            onOpenLiveTracking={() => setCurrentTab('live-tracking')}
            onOpenWorldMap={() => setCurrentTab('tn-map')}
            onOpenTamilNaduMap={() => setCurrentTab('tn-map')}
            onOpenCollegeDataset={() => setIsCollegeModalOpen(true)}
            onReplaySplash={() => setShowSplash(true)}
            collegeName={collegeConfig?.collegeName}
            onOpenVoiceChat={() => handleOpenVoiceChat()}
            onOpenDemo={() => setCurrentTab('demo')}
            onOpenGuide={() => setIsGuideOpen(true)}
            activeBusesCount={buses.length}
            totalStudentsCount={totalStudents}
            totalRoutesCount={totalRoutes}
            buses={buses}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900 pb-16 lg:pb-0">
      {/* Intro Splash Screen (Logo opens first, then content appears) */}
      {showSplash && (
        <AppIntroSplash onComplete={() => setShowSplash(false)} />
      )}

      {/* Top Navbar (Clean light theme & centered container) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        unreadAlertCount={unreadAlerts}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenVoiceChat={() => handleOpenVoiceChat()}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenCollegeDataset={() => setIsCollegeModalOpen(true)}
        collegeName={collegeConfig?.collegeName}
        collegeShortName={collegeConfig?.shortName}
        onReplaySplash={() => setShowSplash(true)}
        isMobileDeviceMode={isMobileDeviceMode}
        onToggleMobileMode={() => setIsMobileDeviceMode(!isMobileDeviceMode)}
      />

      {/* Main Content Area (supports wrapping inside mobile phone frame when toggled on desktop) */}
      <MobileDevicePreview
        isMobileDeviceMode={isMobileDeviceMode}
        onToggleMobileMode={() => setIsMobileDeviceMode(false)}
        currentTab={currentTab}
      >
        <main className="flex-1 flex flex-col w-full">
          {renderTabContent()}
        </main>
      </MobileDevicePreview>

      {/* Mobile Bottom Dock (always present on phone screens) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        unreadAlertCount={unreadAlerts}
        onOpenVoiceChat={() => handleOpenVoiceChat()}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenCollegeDataset={() => setIsCollegeModalOpen(true)}
      />

      {/* College Bus Dataset Manager Modal (Custom College Routes, Stops & Presets for Tamil Nadu) */}
      <CollegeDatasetManagerModal
        isOpen={isCollegeModalOpen}
        onClose={() => setIsCollegeModalOpen(false)}
        onCollegeUpdated={(updated) => {
          setCollegeConfig(updated);
          api.getRoutes().then((res) => setTotalRoutes(res.count)).catch(() => {});
        }}
      />

      {/* Description Guide Modal ("discription port which inform about eveerything that it has") */}
      <AppDescriptionModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onJumpToTab={(tab) => setCurrentTab(tab)}
      />

      {/* PWA Install Prompt Banner & Instructions Modal */}
      <PwaInstallPrompt />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        defaultRole={role}
      />

      {/* AI Voice Chat Modal */}
      <AiVoiceChatModal
        isOpen={isVoiceChatOpen}
        onClose={() => {
          setIsVoiceChatOpen(false);
          setVoiceChatInitialQuery(undefined);
        }}
        initialQuery={voiceChatInitialQuery}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
