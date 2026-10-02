import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Bus, Route, BoardingPoint, TrackingHistoryItem } from '../../types/index.ts';
import { calculateHaversineDistanceMeters } from '../../utils/haversine.ts';
import { Layers, Eye, Compass, Map as MapIcon } from 'lucide-react';

export type MapTileStyle = 'streets' | 'satellite' | 'night';

export interface LeafletMapProps {
  buses: Bus[];
  selectedBusId?: string;
  onSelectBus?: (busId: string) => void;
  routes?: Route[];
  stops?: BoardingPoint[];
  highlightedRouteId?: string;
  trackingHistory?: TrackingHistoryItem[];
  height?: string;
  className?: string;
  defaultTileStyle?: MapTileStyle;
  showBuffers?: boolean;
  showApproachingPerimeter?: boolean;
  onTileStyleChange?: (style: MapTileStyle) => void;
}

const TILE_CONFIG: Record<
  MapTileStyle,
  {
    name: string;
    url: string;
    options: L.TileLayerOptions;
    labelOverlayUrl?: string;
    labelOptions?: L.TileLayerOptions;
  }
> = {
  streets: {
    name: 'Real-World Streets',
    // High-resolution real-world street map with roads, university campuses, parks, landmarks
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  satellite: {
    name: 'Satellite Aerial',
    // Genuine high-resolution satellite imagery from Esri World Imagery
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics',
    },
    // Reference street & boundary labels so satellite map is easy to navigate
    labelOverlayUrl:
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    labelOptions: {
      maxZoom: 19,
      opacity: 0.9,
    },
  },
  night: {
    name: 'Night Radar',
    // Clean modern dark theme for night ops
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  buses,
  selectedBusId,
  onSelectBus,
  routes = [],
  stops = [],
  highlightedRouteId,
  trackingHistory = [],
  height = '500px',
  className = '',
  defaultTileStyle = 'streets',
  showBuffers = true,
  showApproachingPerimeter = true,
  onTileStyleChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelOverlayLayerRef = useRef<L.TileLayer | null>(null);
  const busMarkersRef = useRef<Record<string, L.Marker>>({});
  const routePolylinesRef = useRef<Record<string, L.Polyline>>({});
  const stopLayersRef = useRef<L.Layer[]>([]);
  const historyPolylineRef = useRef<L.Polyline | null>(null);

  const [activeTileStyle, setActiveTileStyle] = useState<MapTileStyle>(defaultTileStyle);
  const [internalShowBuffers, setInternalShowBuffers] = useState(showBuffers);
  const [internalShowApproaching, setInternalShowApproaching] = useState(showApproachingPerimeter);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Synchronize prop changes
  useEffect(() => {
    setInternalShowBuffers(showBuffers);
  }, [showBuffers]);

  useEffect(() => {
    setInternalShowApproaching(showApproachingPerimeter);
  }, [showApproachingPerimeter]);

  // Handle tile switch
  const switchTileStyle = (style: MapTileStyle) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layer and label layer
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }
    if (labelOverlayLayerRef.current) {
      labelOverlayLayerRef.current.remove();
      labelOverlayLayerRef.current = null;
    }

    const cfg = TILE_CONFIG[style];
    const newBase = L.tileLayer(cfg.url, cfg.options).addTo(map);
    tileLayerRef.current = newBase;

    if (cfg.labelOverlayUrl) {
      const labelLayer = L.tileLayer(cfg.labelOverlayUrl, cfg.labelOptions || {}).addTo(map);
      labelOverlayLayerRef.current = labelLayer;
    }

    setActiveTileStyle(style);
    if (onTileStyleChange) {
      onTileStyleChange(style);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center around Greater Chennai / College Transit Area
    const map = L.map(mapContainerRef.current, {
      center: [12.9675, 80.1491],
      zoom: 12,
      zoomControl: false, // We'll put custom controls or standard in bottom right
      attributionControl: false,
    });

    // Add zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial base layer
    const cfg = TILE_CONFIG[activeTileStyle];
    const base = L.tileLayer(cfg.url, cfg.options).addTo(map);
    tileLayerRef.current = base;

    if (cfg.labelOverlayUrl) {
      const labelLayer = L.tileLayer(cfg.labelOverlayUrl, cfg.labelOptions || {}).addTo(map);
      labelOverlayLayerRef.current = labelLayer;
    }

    // Subtle attribution
    L.control
      .attribution({ position: 'bottomright', prefix: 'MyBus Real-World Telemetry' })
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Recenter map on selected bus when requested
  const handleRecenterSelected = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const targetBus = buses.find((b) => b.id === selectedBusId) || buses[0];
    if (targetBus) {
      map.panTo([targetBus.latitude, targetBus.longitude], { animate: true, duration: 0.8 });
    }
  };

  // Update Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous route polylines
    Object.values(routePolylinesRef.current).forEach((polyline) => polyline.remove());
    routePolylinesRef.current = {};

    routes.forEach((route) => {
      if (!route.waypoints || route.waypoints.length === 0) return;
      const isHighlighted = highlightedRouteId === route.id;

      const polyline = L.polyline(route.waypoints, {
        color: isHighlighted ? '#26d9ff' : '#7067ff',
        weight: isHighlighted ? 5 : 3.5,
        opacity: isHighlighted ? 0.95 : 0.5,
        dashArray: isHighlighted ? undefined : '6, 8',
      }).addTo(map);

      routePolylinesRef.current[route.id] = polyline;
    });
  }, [routes, highlightedRouteId]);

  // Update Boarding Points & Color-Coded Radial Buffers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous stop layers
    stopLayersRef.current.forEach((layer) => layer.remove());
    stopLayersRef.current = [];

    // Filter relevant stops based on highlighted route
    const relevantStops = stops.filter(
      (s) => !highlightedRouteId || s.routeId === highlightedRouteId
    );

    // Selected bus (if any)
    const selectedBus = buses.find((b) => b.id === selectedBusId);

    relevantStops.forEach((stop) => {
      // Find buses operating on this stop's route
      const routeBuses = buses.filter((b) => b.routeId === stop.routeId);

      // Evaluate proximity to active buses:
      // If a specific bus is selected and on this route, prioritize that bus
      let nearestBus: Bus | null = null;
      let minDistance = Infinity;

      if (selectedBus && selectedBus.routeId === stop.routeId) {
        minDistance = calculateHaversineDistanceMeters(
          selectedBus.latitude,
          selectedBus.longitude,
          stop.latitude,
          stop.longitude
        );
        nearestBus = selectedBus;
      } else {
        // Evaluate closest bus on this route
        routeBuses.forEach((b) => {
          const d = calculateHaversineDistanceMeters(
            b.latitude,
            b.longitude,
            stop.latitude,
            stop.longitude
          );
          if (d < minDistance) {
            minDistance = d;
            nearestBus = b;
          }
        });
      }

      const stopRadius = stop.radiusMeters || 100;

      // Determine proximity status:
      // 1. ARRIVED (Amber): inside stop geofence radius OR bus marked arrived at this stop
      // 2. APPROACHING (Green): within 500m approaching zone OR bus marked approaching this stop
      // 3. STANDBY (Cyan/Slate): normal scheduled
      let proximityStatus: 'ARRIVED' | 'APPROACHING' | 'STANDBY' = 'STANDBY';

      const isDirectArrived =
        nearestBus &&
        (minDistance <= stopRadius ||
          (nearestBus.currentStatus === 'ARRIVED_AT_STOP' &&
            nearestBus.nextStopName === stop.name));

      const isDirectApproaching =
        nearestBus &&
        !isDirectArrived &&
        (minDistance <= 500 ||
          (nearestBus.currentStatus === 'APPROACHING_STOP' &&
            nearestBus.nextStopName === stop.name));

      if (isDirectArrived) {
        proximityStatus = 'ARRIVED';
      } else if (isDirectApproaching) {
        proximityStatus = 'APPROACHING';
      }

      // Visual styling colors based on proximity status
      let primaryColor = '#38bdf8'; // Standby Cyan
      let fillColor = '#0284c7';
      let fillOpacity = 0.12;
      let strokeColor = '#38bdf8';
      let strokeWidth = 1.5;
      let dashArray: string | undefined = '4, 4';
      let statusLabel = 'SCHEDULED';
      let statusBadgeClass = 'background: #0284c720; color: #38bdf8; border: 1px solid #38bdf850;';

      if (proximityStatus === 'ARRIVED') {
        // Amber for Arrived
        primaryColor = '#f59e0b';
        fillColor = '#f59e0b';
        fillOpacity = 0.35;
        strokeColor = '#fbbf24';
        strokeWidth = 3;
        dashArray = undefined;
        statusLabel = 'ARRIVED IN BUFFER';
        statusBadgeClass = 'background: #f59e0b25; color: #f59e0b; border: 1px solid #f59e0b80; font-weight: 800;';
      } else if (proximityStatus === 'APPROACHING') {
        // Green for Approaching
        primaryColor = '#10b981';
        fillColor = '#10b981';
        fillOpacity = 0.25;
        strokeColor = '#34d399';
        strokeWidth = 2.5;
        dashArray = undefined;
        statusLabel = 'APPROACHING STOP';
        statusBadgeClass = 'background: #10b98125; color: #10b981; border: 1px solid #10b98180; font-weight: 800;';
      }

      // 1. Draw outer 500m approaching radar boundary if enabled and bus is approaching
      if (internalShowApproaching && proximityStatus === 'APPROACHING') {
        const approachingCircle = L.circle([stop.latitude, stop.longitude], {
          radius: 500,
          color: '#10b981',
          weight: 1.5,
          dashArray: '6, 6',
          fillColor: '#10b981',
          fillOpacity: 0.06,
        }).addTo(map);

        approachingCircle.bindTooltip(
          `<strong>500m Approaching Perimeter</strong>: ${stop.name} (${minDistance}m away)`,
          { sticky: true, className: 'leaflet-custom-tooltip' }
        );

        stopLayersRef.current.push(approachingCircle);
      }

      // 2. Visual Radial Buffer (Geographical circle matching stop.radiusMeters)
      if (internalShowBuffers) {
        const bufferCircle = L.circle([stop.latitude, stop.longitude], {
          radius: stopRadius,
          color: strokeColor,
          weight: strokeWidth,
          dashArray: dashArray,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
        }).addTo(map);

        // Rich popup explaining proximity details
        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px 10px; font-size: 12px; color: #0f172a; min-width: 210px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
              <span style="font-weight: 800; font-size: 13px; color: #0f172a;">${stop.name}</span>
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; ${statusBadgeClass}">${statusLabel}</span>
            </div>
            <div style="margin-top: 6px; font-size: 11px; color: #475569; line-height: 1.6;">
              <div>⭕ <strong>Radial Buffer:</strong> ${stopRadius}m geofence</div>
              <div>📍 <strong>Stop Order:</strong> #${stop.stopOrder} on route</div>
              <div>⏰ <strong>Scheduled:</strong> ${stop.scheduledTime || 'N/A'}</div>
              ${
                nearestBus
                  ? `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
                      🚍 <strong>${nearestBus.busNumber}:</strong> <span style="font-weight: 700; color: ${primaryColor};">${minDistance}m away</span>
                      ${nearestBus.etaMinutes != null ? `(ETA: ${nearestBus.etaMinutes} min)` : ''}
                    </div>`
                  : ''
              }
            </div>
          </div>
        `;

        bufferCircle.bindPopup(popupContent);
        stopLayersRef.current.push(bufferCircle);
      }

      // 3. Center Boarding Marker (Inner dot with sequence number)
      const centerMarkerHtml = `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            proximityStatus === 'ARRIVED'
              ? `<div style="position: absolute; inset: -3px; border-radius: 9999px; border: 2px solid #f59e0b; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>`
              : proximityStatus === 'APPROACHING'
              ? `<div style="position: absolute; inset: -2px; border-radius: 9999px; border: 1.5px solid #10b981; animation: pulse 2s infinite; opacity: 0.5;"></div>`
              : ''
          }
          <div style="width: 20px; height: 20px; border-radius: 9999px; background: ${
            proximityStatus === 'ARRIVED'
              ? '#f59e0b'
              : proximityStatus === 'APPROACHING'
              ? '#10b981'
              : '#090e1a'
          }; border: 2px solid ${
        proximityStatus === 'STANDBY' ? '#38bdf8' : '#ffffff'
      }; box-shadow: 0 2px 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
            <span style="font-family: monospace; font-size: 9px; font-weight: 800; color: ${
              proximityStatus === 'STANDBY' ? '#38bdf8' : '#ffffff'
            };">${stop.stopOrder}</span>
          </div>
        </div>
      `;

      const centerIcon = L.divIcon({
        html: centerMarkerHtml,
        className: 'custom-stop-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      const centerMarker = L.marker([stop.latitude, stop.longitude], { icon: centerIcon }).addTo(
        map
      );

      // Tooltip on hover
      centerMarker.bindTooltip(
        `<strong>Stop #${stop.stopOrder}: ${stop.name}</strong><br/>Buffer: ${stopRadius}m · Status: ${statusLabel}`,
        { sticky: true }
      );

      stopLayersRef.current.push(centerMarker);
    });
  }, [stops, buses, selectedBusId, highlightedRouteId, internalShowBuffers, internalShowApproaching]);

  // Update Tracking History Breadcrumbs for Selected Bus
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (historyPolylineRef.current) {
      historyPolylineRef.current.remove();
      historyPolylineRef.current = null;
    }

    if (trackingHistory.length > 1) {
      const latLngs = trackingHistory.map((h) => [h.latitude, h.longitude] as [number, number]);
      historyPolylineRef.current = L.polyline(latLngs, {
        color: '#35e59b',
        weight: 3,
        opacity: 0.75,
        dashArray: '3, 6',
      }).addTo(map);
    }
  }, [trackingHistory]);

  // Update Bus Live Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Track active buses in this update
    const currentBusIds = new Set(buses.map((b) => b.id));

    // Remove markers for buses that disappeared
    Object.keys(busMarkersRef.current).forEach((busId) => {
      if (!currentBusIds.has(busId)) {
        busMarkersRef.current[busId].remove();
        delete busMarkersRef.current[busId];
      }
    });

    buses.forEach((bus) => {
      const isSelected = selectedBusId === bus.id;
      const statusColor =
        bus.currentStatus === 'ARRIVED_AT_STOP'
          ? '#f59e0b' // Amber
          : bus.currentStatus === 'APPROACHING_STOP'
          ? '#10b981' // Green
          : bus.currentStatus === 'DELAYED'
          ? '#f97316'
          : bus.currentStatus === 'EMERGENCY'
          ? '#ef4444'
          : '#7067ff';

      const html = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            isSelected
              ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; border: 2.5px solid #26d9ff; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.6;"></div>`
              : ''
          }
          <div style="width: 36px; height: 36px; border-radius: 9999px; background: #070b14; border: 2.5px solid ${statusColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <svg style="width: 16px; height: 16px; fill: ${statusColor}; transform: rotate(${
        bus.heading
      }deg); transition: transform 0.5s ease;" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
            <span style="font-family: monospace; font-size: 8px; font-weight: 700; color: #f8fafc; margin-top: -2px;">${bus.busNumber.replace(
              'Bus ',
              ''
            )}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html,
        className: 'custom-bus-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
      });

      if (busMarkersRef.current[bus.id]) {
        const marker = busMarkersRef.current[bus.id];
        marker.setLatLng([bus.latitude, bus.longitude]);
        marker.setIcon(customIcon);
      } else {
        const marker = L.marker([bus.latitude, bus.longitude], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          if (onSelectBus) onSelectBus(bus.id);
        });

        marker.bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px 8px; font-size: 13px; color: #0f172a; min-width: 180px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="font-weight: 800; font-size: 14px; color: #7067ff;">${bus.busNumber}</span>
              <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${
                bus.currentStatus === 'ARRIVED_AT_STOP'
                  ? '#f59e0b20'
                  : bus.currentStatus === 'APPROACHING_STOP'
                  ? '#10b98120'
                  : '#f1f5f9'
              }; color: ${
          bus.currentStatus === 'ARRIVED_AT_STOP'
            ? '#b45309'
            : bus.currentStatus === 'APPROACHING_STOP'
            ? '#047857'
            : '#334155'
        };">${bus.currentStatus}</span>
            </div>
            <div style="margin-top: 6px; font-size: 12px; color: #475569; line-height: 1.5;">
              <div><strong>Route:</strong> ${bus.routeName || 'Assigned Route'}</div>
              <div><strong>Speed:</strong> <span style="font-family: monospace;">${bus.speedKmH} km/h</span></div>
              <div><strong>Target Stop:</strong> ${bus.nextStopName || 'En Route'}</div>
              <div><strong>Buffer Distance:</strong> <span style="font-family: monospace; font-weight: 700; color: #0284c7;">${
                bus.nextStopDistanceMeters
              }m</span></div>
              <div><strong>ETA:</strong> <span style="font-family: monospace; font-weight: 700; color: #0ea5e9;">${
                bus.etaMinutes != null ? `${bus.etaMinutes} min` : 'Calculating'
              }</span></div>
              <div><strong>Driver:</strong> ${bus.driverName || 'Assigned'}</div>
            </div>
          </div>
        `);

        busMarkersRef.current[bus.id] = marker;
      }
    });

    // Auto-center map if a bus is selected
    if (selectedBusId) {
      const selected = buses.find((b) => b.id === selectedBusId);
      if (selected) {
        map.panTo([selected.latitude, selected.longitude], { animate: true, duration: 0.8 });
      }
    }
  }, [buses, selectedBusId, onSelectBus]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      {/* Real-World Map & Layer Controls Overlay */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
        {/* Layer Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold backdrop-blur-md border border-slate-700 shadow-lg transition-colors"
            title="Change Map Style"
          >
            <Layers className="w-3.5 h-3.5 text-[#26d9ff]" />
            <span>{TILE_CONFIG[activeTileStyle].name}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-48 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl p-1.5 z-50 backdrop-blur-md space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                Real-World Base Layers
              </div>
              <button
                onClick={() => {
                  switchTileStyle('streets');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  activeTileStyle === 'streets'
                    ? 'bg-[#7067ff] text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>🗺️ Real-World Streets</span>
                {activeTileStyle === 'streets' && <span className="text-[10px]">●</span>}
              </button>

              <button
                onClick={() => {
                  switchTileStyle('satellite');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  activeTileStyle === 'satellite'
                    ? 'bg-[#7067ff] text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>🛰️ Satellite Aerial</span>
                {activeTileStyle === 'satellite' && <span className="text-[10px]">●</span>}
              </button>

              <button
                onClick={() => {
                  switchTileStyle('night');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  activeTileStyle === 'night'
                    ? 'bg-[#7067ff] text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>🌙 Night Radar</span>
                {activeTileStyle === 'night' && <span className="text-[10px]">●</span>}
              </button>
            </div>
          )}
        </div>

        {/* Radial Buffers Toggle */}
        <button
          onClick={() => setInternalShowBuffers(!internalShowBuffers)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border shadow-lg transition-colors ${
            internalShowBuffers
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
          }`}
          title="Toggle Radial Geofence Buffers around boarding points"
        >
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>Radial Buffers: {internalShowBuffers ? 'ON' : 'OFF'}</span>
        </button>

        {/* 500m Approaching Perimeter Toggle */}
        <button
          onClick={() => setInternalShowApproaching(!internalShowApproaching)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border shadow-lg transition-colors ${
            internalShowApproaching
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
          }`}
          title="Toggle 500m Approaching Alert Perimeters"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>500m Zone</span>
        </button>

        {/* Recenter button */}
        <button
          onClick={handleRecenterSelected}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium backdrop-blur-md border border-slate-700 shadow-lg transition-colors"
          title="Recenter Map to Selected Bus"
        >
          <Compass className="w-3.5 h-3.5 text-[#26d9ff]" />
          <span className="hidden sm:inline">Center Bus</span>
        </button>
      </div>

      {/* Radial Buffer Proximity Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-xl bg-slate-900/95 border border-slate-800 backdrop-blur-md shadow-2xl text-[11px] space-y-1.5 max-w-[260px] pointer-events-auto">
        <div className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Radial Buffer Status</span>
          <span className="text-[#26d9ff]">Live Radar</span>
        </div>
        <div className="grid grid-cols-1 gap-1 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-400/30" />
            <span className="font-semibold text-amber-400">Amber Buffer:</span>
            <span className="text-slate-300 text-[10px]">Arrived (&le;100m)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-400/30" />
            <span className="font-semibold text-emerald-400">Green Buffer:</span>
            <span className="text-slate-300 text-[10px]">Approaching (&le;500m)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-sky-400/30" />
            <span className="font-semibold text-sky-400">Cyan Buffer:</span>
            <span className="text-slate-300 text-[10px]">Standby Geofence</span>
          </div>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="w-full relative z-0"
      />
    </div>
  );
};
