import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, RotateCcw, Volume2, Wifi, BatteryCharging, ChevronLeft } from 'lucide-react';

interface MobileDevicePreviewProps {
  children: React.ReactNode;
  isMobileDeviceMode: boolean;
  onToggleMobileMode: () => void;
  currentTab: string;
}

export const MobileDevicePreview: React.FC<MobileDevicePreviewProps> = ({
  children,
  isMobileDeviceMode,
  onToggleMobileMode,
  currentTab,
}) => {
  const [currentTime, setCurrentTime] = useState('9:41');
  const [deviceScale, setDeviceScale] = useState(1);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // If mobile mode is not enabled or if we are already on a physical phone screen, render children normally
  if (!isMobileDeviceMode) {
    return <>{children}</>;
  }

  return (
    <div className="hidden lg:flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6 bg-slate-100 relative overflow-hidden">
      {/* Floating Control Bar for Device Mode */}
      <div className="mb-4 flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-md z-30">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Smartphone className="w-4 h-4 text-indigo-600" />
          <span>Mobile Phone View</span>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
            iPhone Mode
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDeviceScale(0.9)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              deviceScale === 0.9 ? 'bg-indigo-100 text-indigo-800' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            90%
          </button>
          <button
            onClick={() => setDeviceScale(1)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              deviceScale === 1 ? 'bg-indigo-100 text-indigo-800' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            100%
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <button
          onClick={onToggleMobileMode}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Monitor className="w-3.5 h-3.5 text-slate-500" />
          <span>Exit to Wide Screen</span>
        </button>
      </div>

      {/* Realistic Modern Smartphone Chassis Frame */}
      <div
        style={{
          transform: `scale(${deviceScale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease-out',
        }}
        className="w-[410px] h-[840px] rounded-[52px] bg-slate-900 p-3 shadow-2xl border-[4px] border-slate-700 relative flex flex-col overflow-hidden"
      >
        {/* Exterior physical buttons mockup */}
        <div className="absolute -left-[7px] top-28 w-[3px] h-8 bg-slate-600 rounded-l-sm" />
        <div className="absolute -left-[7px] top-40 w-[3px] h-12 bg-slate-600 rounded-l-sm" />
        <div className="absolute -left-[7px] top-56 w-[3px] h-12 bg-slate-600 rounded-l-sm" />
        <div className="absolute -right-[7px] top-36 w-[3px] h-16 bg-slate-600 rounded-r-sm" />

        {/* Screen Bezel & Display */}
        <div className="w-full h-full rounded-[44px] bg-[#f8fafc] overflow-hidden flex flex-col relative border border-slate-800 shadow-inner">
          {/* iOS Top Status Bar & Dynamic Island */}
          <div className="h-11 w-full bg-white z-50 flex items-center justify-between px-7 pt-2 flex-shrink-0 select-none border-b border-slate-100">
            {/* Clock */}
            <span className="text-xs font-bold text-slate-800 tracking-tight font-mono">
              {currentTime}
            </span>

            {/* Dynamic Island */}
            <div className="w-28 h-6 bg-slate-950 rounded-full flex items-center justify-between px-2.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white font-mono font-bold tracking-tighter">
                Bus 75: 3m
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
            </div>

            {/* Icons: 5G & Battery */}
            <div className="flex items-center gap-1.5 text-slate-700">
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-mono">5G</span>
              <div className="w-5 h-2.5 rounded-sm border border-slate-700 p-0.5 flex items-center">
                <div className="h-full w-full bg-emerald-500 rounded-xs" />
              </div>
            </div>
          </div>

          {/* Inner App Container with Mobile Scrolling */}
          <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col relative pb-16 custom-scrollbar bg-[#f8fafc]">
            {children}
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="absolute bottom-1 left-0 right-0 h-4 flex items-center justify-center pointer-events-none z-50">
            <div className="w-32 h-1 bg-slate-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
