import React, { useState, useEffect } from 'react';
import { Bus, Sparkles, ArrowRight } from 'lucide-react';

interface AppIntroSplashProps {
  onComplete: () => void;
}

export const AppIntroSplash: React.FC<AppIntroSplashProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'logo' | 'title' | 'fadeout'>('logo');

  useEffect(() => {
    // Stage 1: Logo pops in first
    const t1 = setTimeout(() => {
      setStage('title');
    }, 600);

    // Stage 2: Content appears, then prepare fadeout
    const t2 = setTimeout(() => {
      setStage('fadeout');
    }, 1900);

    // Stage 3: Smooth complete
    const t3 = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Soft warm light background accent */}
      <div className="absolute inset-0 bg-radial from-indigo-50/70 via-white to-slate-50 pointer-events-none" />

      <div className="relative flex flex-col items-center text-center p-6 max-w-sm mx-auto">
        {/* Step 1: Logo opens first with bounce and glow */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 transform transition-all duration-700 scale-100 animate-in zoom-in-50">
            <Bus className="w-12 h-12 sm:w-14 sm:h-14 animate-pulse" />
          </div>
          {/* Subtle radar beacon ring */}
          <div className="absolute -inset-2 rounded-3xl border-2 border-indigo-400/40 animate-ping pointer-events-none" />
        </div>

        {/* Step 2: Content opens after the logo */}
        <div
          className={`space-y-2 transition-all duration-700 transform ${
            stage !== 'logo'
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Smart College Bus Tracker</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
            MyBus
          </h1>

          <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
            Easy live bus tracking for students, parents, and drivers.
          </p>

          {/* Simple progress bar */}
          <div className="pt-4 flex flex-col items-center gap-2">
            <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" style={{ width: '80%' }} />
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Opening live bus map...</span>
          </div>
        </div>

        {/* Quick skip button */}
        <button
          onClick={onComplete}
          className="mt-8 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer py-1 px-3 rounded-lg hover:bg-slate-100"
        >
          <span>Skip to App</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
