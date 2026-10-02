import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Mic,
  Search,
  Sparkles,
  ExternalLink,
  Navigation,
  Compass,
  Building,
  Shield,
  Clock,
  Coffee,
  HeartPulse,
  Bus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import type { BoardingPoint, GroundingChunk, MapsGroundingResponse } from '../../types/index.ts';
import { VoiceTranscriberModal } from '../voice/VoiceTranscriberModal.tsx';

interface TransitMapsAssistantViewProps {
  initialQuery?: string;
  defaultBoardingPointId?: string;
}

export const TransitMapsAssistantView: React.FC<TransitMapsAssistantViewProps> = ({
  initialQuery = '',
  defaultBoardingPointId,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<MapsGroundingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [stops, setStops] = useState<BoardingPoint[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string>(defaultBoardingPointId || '');
  const [useCurrentGps, setUseCurrentGps] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  useEffect(() => {
    api
      .getBoardingPoints()
      .then((res) => {
        setStops(res.data);
        if (!selectedStopId && res.data.length > 0) {
          setSelectedStopId(res.data[0].id);
        }
      })
      .catch((e) => console.error('Failed to load stops:', e));
  }, []);

  const handleToggleGps = () => {
    if (!useCurrentGps) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            setUseCurrentGps(true);
          },
          (err) => {
            console.warn('Geolocation error:', err);
            setUseCurrentGps(false);
          }
        );
      }
    } else {
      setUseCurrentGps(false);
    }
  };

  const handleSearch = async (queryText?: string) => {
    const textToSearch = (queryText || query).trim();
    if (!textToSearch) return;

    setIsLoading(true);
    setError(null);

    let locationAnchor: { latitude: number; longitude: number } | undefined = undefined;

    if (useCurrentGps && userCoords) {
      locationAnchor = userCoords;
    } else if (selectedStopId) {
      const stop = stops.find((s) => s.id === selectedStopId);
      if (stop) {
        locationAnchor = { latitude: stop.latitude, longitude: stop.longitude };
      }
    }

    try {
      const res = await api.queryMapsGrounding(textToSearch, locationAnchor);

      setResponse(res);
    } catch (err: any) {
      console.error(err);
      setError('Unable to fetch information right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      label: 'Safe Waiting Spots & Cafes',
      icon: Coffee,
      text: 'What safe waiting areas, lighted cafes, or shops are located right around this stop?',
    },
    {
      label: 'Nearest Medical & Pharmacies',
      icon: HeartPulse,
      text: 'Find nearest clinics, pharmacies, or emergency services near this stop.',
    },
    {
      label: 'Nearby Metro & Bus Links',
      icon: Bus,
      text: 'What are the main landmarks, bus stands, and railway or metro stations near here?',
    },
    {
      label: 'College Campus Facilities',
      icon: Building,
      text: 'Give directions and notable buildings near the main campus stop.',
    },
  ];

  const mapsChunks = response?.groundingChunks?.filter((c) => c.maps && c.maps.title) || [];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Top Banner (Clean lite theme, centered copy) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Map Guide & Voice Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Ask Questions About Bus Stops & Surroundings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Find safe waiting areas, nearby shops, hospitals, or transit connections around your pickup stop.
          </p>
        </div>

        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
        >
          <Mic className="w-4 h-4 text-pink-600 animate-pulse" />
          <span>Speak with Microphone</span>
        </button>
      </div>

      {/* Search & Location Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        {/* Stop Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>Choose Bus Stop to Inquire About:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStopId}
              disabled={useCurrentGps}
              onChange={(e) => setSelectedStopId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold outline-none cursor-pointer"
            >
              {stops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  Stop #{stop.stopOrder}: {stop.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleToggleGps}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                useCurrentGps
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {useCurrentGps ? 'Using Your Phone GPS' : 'Use Current GPS'}
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything (e.g. Is there a safe waiting spot or cafe near Pallavaram stop?)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Search</span>}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium">Quick Questions:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(p.text);
                handleSearch(p.text);
              }}
              className="px-3 py-1 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-slate-700 hover:text-indigo-700 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <p.icon className="w-3.5 h-3.5 text-slate-500" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {response && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Information Found Near Bus Stop</span>
          </div>

          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {response.text}
          </div>

          {/* Place Cards */}
          {mapsChunks.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Places Nearby ({mapsChunks.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {mapsChunks.map((chunk, idx) => (
                  <a
                    key={idx}
                    href={chunk.maps?.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {chunk.maps?.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {chunk.maps?.address || chunk.maps?.placeAnswerSources?.reviewSnippets?.[0]?.content || 'View verified landmark location'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 pt-1">
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice Transcriber Modal */}
      <VoiceTranscriberModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptionComplete={(text) => {
          setIsVoiceModalOpen(false);
          setQuery(text);
          handleSearch(text);
        }}
        title="Voice Question"
        subtitle="Speak your question about your bus stop or route."
      />
    </div>
  );
};
