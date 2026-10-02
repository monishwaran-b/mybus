import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import type { Route, BoardingPoint, Bus } from '../../types/index.ts';
import { LeafletMap } from '../map/LeafletMap.tsx';
import { MapPin, Bus as BusIcon, Clock, Users, ArrowRight, Navigation } from 'lucide-react';

export const RoutesView: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<BoardingPoint[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-1');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getRoutes(), api.getBoardingPoints(), api.getBuses()])
      .then(([rRes, sRes, bRes]) => {
        setRoutes(rRes.data);
        setStops(sRes.data);
        setBuses(bRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const routeStops = stops
    .filter((s) => s.routeId === selectedRoute?.id)
    .sort((a, b) => a.stopOrder - b.stopOrder);
  const routeBuses = buses.filter((b) => b.routeId === selectedRoute?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 font-sans">
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
          <Navigation className="w-3.5 h-3.5" />
          <span>CAMPUS BUS ROUTES</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
          Bus Routes & Pickup Stops
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          View full road paths, morning pickup times, and buses assigned to each line
        </p>
      </div>

      {routes.length === 0 && !isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Bus Routes Available</h3>
          <p className="text-xs text-slate-500 mt-1">Routes will appear here once added in the database.</p>
        </div>
      ) : (
        <>
          {/* Route Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {routes.map((r) => {
          const isSelected = r.id === selectedRouteId;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRouteId(r.id)}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-400 shadow-sm ring-1 ring-indigo-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-indigo-700">{r.code}</span>
                <span className="text-[11px] text-slate-500 font-medium">{r.stops?.length || 6} Stops</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">{r.name}</h4>
              <div className="text-[11px] text-slate-500 mt-1 truncate">
                {r.startPoint} → Campus
              </div>
            </button>
          );
        })}
      </div>

      {selectedRoute && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Stops Timeline & Assigned Buses */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {selectedRoute.routeNumber || selectedRoute.code}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{selectedRoute.status || 'Active'}</span>
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedRoute.name}</h2>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="text-slate-900 font-semibold">{selectedRoute.startPoint}</span>
                <span className="text-indigo-500 font-bold">➔</span>
                <span className="text-slate-900 font-semibold">{selectedRoute.endPoint || 'College Main Campus'}</span>
              </div>
              <p className="text-xs text-slate-500">{selectedRoute.description}</p>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Distance</span>
                  <div className="font-mono text-slate-900 font-bold">{selectedRoute.totalDistanceKm || 28} km</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Est. Travel Time</span>
                  <div className="font-mono text-indigo-700 font-bold">{selectedRoute.estimatedDurationMinutes || 45} mins</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Assigned Fleet</span>
                  <div className="font-mono text-emerald-600 font-bold">{routeBuses.length} Bus{routeBuses.length !== 1 ? 'es' : ''}</div>
                </div>
              </div>

              {/* Assigned Buses list */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-semibold text-slate-700">Buses Currently on this Route:</div>
                <div className="space-y-1.5">
                  {routeBuses.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-slate-900">{b.busNumber}</strong>
                        <span className="text-slate-500 ml-2 font-medium">({b.driverName})</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">{b.speedKmH} km/h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stops list */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Pickup Stops ({routeStops.length})</h3>
              <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-3 max-h-[360px] overflow-y-auto shadow-xs">
                {routeStops.map((stop) => (
                  <div key={stop.id} className="flex items-start gap-3 text-xs">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-mono text-[10px] mt-0.5 shrink-0 font-bold">
                      {stop.stopOrder}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{stop.name}</span>
                        <span className="font-mono text-slate-500 font-medium">{stop.scheduledTime}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Distance radius: {stop.radiusMeters}m
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Map of Route */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Route Map on Road</h3>
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <LeafletMap
                buses={routeBuses}
                routes={[selectedRoute]}
                stops={routeStops}
                highlightedRouteId={selectedRoute.id}
                height="580px"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )}
</div>
  );
};
