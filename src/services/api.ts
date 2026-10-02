import type {
  Bus,
  Route,
  BoardingPoint,
  Student,
  Parent,
  Driver,
  Schedule,
  Alert,
  TrackingHistoryItem,
  FleetAnalytics,
  ActivityLog,
  User,
} from '../types/index.ts';

const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('mybus_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; application: string; version: string }>('/health'),

  // Auth
  login: (email: string, password?: string, role?: string) =>
    fetchJson<{ token: string; user: User; expiresIn: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    }),

  getCurrentUser: () => fetchJson<{ user: User }>('/auth/me'),

  // Buses
  getBuses: (params?: { routeId?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<{ data: Bus[]; count: number }>(`/buses${query ? `?${query}` : ''}`);
  },

  getBusById: (id: string) =>
    fetchJson<{ bus: Bus; route?: Route; stops: BoardingPoint[]; studentCount: number }>(`/buses/${id}`),

  createBus: (data: Partial<Bus>) =>
    fetchJson<Bus>('/buses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBus: (id: string, data: Partial<Bus>) =>
    fetchJson<Bus>(`/buses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Routes
  getRoutes: () => fetchJson<{ data: Route[]; count: number }>('/routes'),
  getRouteById: (id: string) =>
    fetchJson<{ route: Route; stops: BoardingPoint[]; buses: Bus[] }>(`/routes/${id}`),

  // Boarding Points
  getBoardingPoints: (routeId?: string) =>
    fetchJson<{ data: BoardingPoint[]; count: number }>(
      `/boarding-points${routeId ? `?routeId=${routeId}` : ''}`
    ),

  // Students
  getStudents: (params?: {
    busId?: string;
    busNumber?: string;
    routeId?: string;
    routeNumber?: string;
    search?: string;
    department?: string;
    year?: string;
    driverName?: string;
    attendanceStatus?: string;
    limit?: number;
    offset?: number;
  }) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) cleanParams[k] = String(v);
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return fetchJson<{ data: Student[]; total: number }>(`/students${query ? `?${query}` : ''}`);
  },

  searchStudents: (params: {
    query?: string;
    registerNumber?: string;
    busNumber?: string;
    routeNumber?: string;
    department?: string;
    year?: string;
    driverName?: string;
    attendanceStatus?: string;
  }) => {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') cleanParams[k] = String(v);
    });
    const query = new URLSearchParams(cleanParams).toString();
    return fetchJson<{ data: Student[]; total: number }>(`/students/search${query ? `?${query}` : ''}`);
  },

  getStudentById: (id: string) =>
    fetchJson<{ student: Student; bus?: Bus; route?: Route; boardingPoint?: BoardingPoint; parent?: Parent }>(
      `/students/${id}`
    ),

  createStudent: (data: Partial<Student>) =>
    fetchJson<{ success: boolean; student: Student }>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStudent: (id: string, data: Partial<Student>) =>
    fetchJson<{ success: boolean; student: Student }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: string) =>
    fetchJson<{ success: boolean }>(`/students/${id}`, {
      method: 'DELETE',
    }),

  // Attendance Management
  getAttendance: (params?: { date?: string; busNumber?: string; status?: string }) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) cleanParams[k] = String(v);
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return fetchJson<{ data: import('../types/index.ts').AttendanceRecord[]; total: number }>(
      `/attendance${query ? `?${query}` : ''}`
    );
  },

  markAttendance: (studentId: string, status: 'PRESENT' | 'ABSENT' | 'NOT_MARKED', markedBy?: string) =>
    fetchJson<{ success: boolean; record: import('../types/index.ts').AttendanceRecord }>('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ studentId, status, markedBy }),
    }),

  bulkMarkAttendance: (updates: Array<{ studentId: string; status: 'PRESENT' | 'ABSENT' }>) =>
    fetchJson<{ success: boolean; count: number }>('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    }),

  getAttendanceSummary: (date?: string, busNumber?: string) => {
    const cleanParams: Record<string, string> = {};
    if (date) cleanParams.date = date;
    if (busNumber) cleanParams.busNumber = busNumber;
    const query = new URLSearchParams(cleanParams).toString();
    return fetchJson<import('../types/index.ts').AttendanceSummary>(
      `/attendance/summary${query ? `?${query}` : ''}`
    );
  },

  // Trips & Metrics
  getTodayTrips: () =>
    fetchJson<{ data: import('../types/index.ts').CollegeTrip[]; count: number }>('/trips/today'),

  getDashboardMetrics: () =>
    fetchJson<{
      totalBuses: number;
      activeBuses: number;
      totalStudents: number;
      activeRoutes: number;
      totalDrivers: number;
      todayTripsCount: number;
      todayTrips: import('../types/index.ts').CollegeTrip[];
      attendanceSummary: import('../types/index.ts').AttendanceSummary;
      lastUpdated: string;
    }>('/dashboard/metrics'),

  // Driver Trip Controls
  driverUpdateStatus: (busNumber: string, status: string) =>
    fetchJson<{ success: boolean; bus: Bus }>('/driver/update-status', {
      method: 'POST',
      body: JSON.stringify({ busNumber, status }),
    }),

  driverUpdateLocation: (data: {
    busNumber: string;
    latitude: number;
    longitude: number;
    speedKmH?: number;
    heading?: number;
    nextStopName?: string;
    etaMinutes?: number;
  }) =>
    fetchJson<{ success: boolean; bus: Bus }>('/driver/update-location', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  driverStartTrip: (busNumber: string) =>
    fetchJson<{ success: boolean; bus: Bus }>('/driver/start-trip', {
      method: 'POST',
      body: JSON.stringify({ busNumber }),
    }),

  driverStopTrip: (busNumber: string) =>
    fetchJson<{ success: boolean; bus: Bus }>('/driver/stop-trip', {
      method: 'POST',
      body: JSON.stringify({ busNumber }),
    }),

  // Parents
  getParents: () => fetchJson<{ data: Parent[]; count: number }>('/parents'),
  getParentById: (id: string) =>
    fetchJson<{ parent: Parent; linkedStudents: Student[] }>(`/parents/${id}`),

  // Drivers
  getDrivers: () => fetchJson<{ data: Driver[]; count: number }>('/drivers'),

  // Schedules
  getSchedules: () => fetchJson<{ data: Schedule[]; count: number }>('/schedules'),

  // Tracking
  getLiveTracking: () =>
    fetchJson<{
      timestamp: string;
      count: number;
      simulationActive: boolean;
      simulationSpeedMultiplier: number;
      buses: Bus[];
    }>('/tracking/live'),

  getBusTracking: (busId: string) =>
    fetchJson<{
      bus: Bus;
      route?: Route;
      stops: BoardingPoint[];
      recentHistory: TrackingHistoryItem[];
    }>(`/tracking/bus/${busId}`),

  getBusHistory: (busId: string) =>
    fetchJson<{ busId: string; data: TrackingHistoryItem[]; count: number }>(
      `/tracking/history/${busId}`
    ),

  postGpsLocation: (telemetry: {
    busId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    timestamp?: string;
  }) =>
    fetchJson<{ success: boolean; busId: string; status: string }>('/tracking/location', {
      method: 'POST',
      body: JSON.stringify(telemetry),
    }),

  toggleSimulation: () =>
    fetchJson<{ isRunning: boolean; speedMultiplier: number }>('/tracking/simulation/toggle', {
      method: 'POST',
    }),

  setSimulationSpeed: (multiplier: number) =>
    fetchJson<{ speedMultiplier: number }>('/tracking/simulation/speed', {
      method: 'POST',
      body: JSON.stringify({ multiplier }),
    }),

  // Interactive Demo Methods
  simulateRfidTap: (studentId?: string) =>
    fetchJson<{
      success: boolean;
      isBoarded: boolean;
      student: Student;
      bus: Bus;
      alert: Alert;
      message: string;
    }>('/demo/rfid-tap', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),

  simulateTrafficDelay: (busId?: string) =>
    fetchJson<{
      success: boolean;
      bus: Bus;
      alert: Alert;
      detourRecommended: string;
    }>('/demo/traffic-delay', {
      method: 'POST',
      body: JSON.stringify({ busId }),
    }),

  simulateProximityTrigger: (busId?: string, stopId?: string) =>
    fetchJson<{
      success: boolean;
      bus: Bus;
      stop: BoardingPoint;
      alert: Alert;
    }>('/demo/proximity-trigger', {
      method: 'POST',
      body: JSON.stringify({ busId, stopId }),
    }),

  clearEmergencyState: () =>
    fetchJson<{ success: boolean; message: string }>('/demo/clear-emergency', {
      method: 'POST',
    }),

  resetFleetCoordinates: () =>
    fetchJson<{ success: boolean; count: number }>('/demo/reset-fleet', {
      method: 'POST',
    }),

  // Alerts
  getAlerts: (role?: string, recipientId?: string) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (recipientId) params.set('recipientId', recipientId);
    return fetchJson<{ data: Alert[]; count: number; unreadCount: number }>(
      `/alerts?${params.toString()}`
    );
  },

  markAlertRead: (id: string) =>
    fetchJson<{ success: boolean }>(`/alerts/${id}/read`, {
      method: 'PUT',
    }),

  triggerEmergencyAlert: (data: { busId?: string; title?: string; message?: string }) =>
    fetchJson<Alert>('/alerts/emergency', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Analytics & Logs
  getAnalytics: () => fetchJson<FleetAnalytics>('/reports/analytics'),
  getActivityLogs: () => fetchJson<{ data: ActivityLog[]; count: number }>('/admin/activity-logs'),

  // AI & Maps Grounding (gemini-3.5-flash with googleMaps)
  queryMapsGrounding: (prompt: string, location?: { latitude: number; longitude: number }) =>
    fetchJson<import('../types/index.ts').MapsGroundingResponse>('/ai/maps-grounding', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        latitude: location?.latitude,
        longitude: location?.longitude,
      }),
    }),

  // Voice & Audio Transcription (gemini-3.5-transcribe)
  transcribeAudio: (audioBase64: string, mimeType?: string) =>
    fetchJson<import('../types/index.ts').AudioTranscriptionResponse>('/ai/transcribe', {
      method: 'POST',
      body: JSON.stringify({
        audio: audioBase64,
        mimeType: mimeType || 'audio/webm',
      }),
    }),

  // AI Voice Chat (gemini-3.8-flash + gemini-3.8-flash-lite-tts)
  sendVoiceChat: (data: {
    message: string;
    history?: Array<{ role: 'user' | 'assistant'; text: string }>;
    language?: string;
    synthesizeSpeech?: boolean;
    voiceName?: string;
  }) =>
    fetchJson<import('../types/index.ts').VoiceChatResponse>('/ai/voice-chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Text-To-Speech (gemini-3.8-flash-lite-tts)
  generateTtsSpeech: (text: string, voiceName?: string) =>
    fetchJson<import('../types/index.ts').TextToSpeechResponse>('/ai/tts', {
      method: 'POST',
      body: JSON.stringify({ text, voiceName }),
    }),

  // College Dataset & Customization API (Tamil Nadu Colleges)
  getCollegeInfo: () =>
    fetchJson<{
      college: import('../types/index.ts').CollegeConfig;
      presets: Array<{
        id: string;
        name: string;
        district: string;
        city: string;
        routesCount: number;
        busesCount: number;
        description: string;
      }>;
    }>('/college/info'),

  updateCollegeInfo: (data: Partial<import('../types/index.ts').CollegeConfig>) =>
    fetchJson<{ success: boolean; college: import('../types/index.ts').CollegeConfig }>('/college/info', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  setCollegePreset: (presetId: string) =>
    fetchJson<{ success: boolean; college: import('../types/index.ts').CollegeConfig; routesCount: number; busesCount: number }>('/college/preset', {
      method: 'POST',
      body: JSON.stringify({ presetId }),
    }),

  addCustomRoute: (routeData: { name: string; code: string; startPoint: string; endPoint: string; description: string }) =>
    fetchJson<{ success: boolean; route: Route }>('/college/routes', {
      method: 'POST',
      body: JSON.stringify(routeData),
    }),

  addCustomStop: (stopData: { name: string; routeId: string; scheduledTime: string; latitude?: number; longitude?: number }) =>
    fetchJson<{ success: boolean; stop: BoardingPoint }>('/college/stops', {
      method: 'POST',
      body: JSON.stringify(stopData),
    }),

  uploadCollegeDataset: (dataset: {
    college?: Partial<import('../types/index.ts').CollegeConfig>;
    routes?: any[];
    stops?: any[];
    buses?: any[];
  }) =>
    fetchJson<{ success: boolean; message: string; stats: any }>('/college/dataset', {
      method: 'POST',
      body: JSON.stringify(dataset),
    }),

  deleteBus: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/buses/${id}`, {
      method: 'DELETE',
    }),

  // Database Management
  resetDatabase: () =>
    fetchJson<{ success: boolean; message: string }>('/admin/database/reset', {
      method: 'POST',
    }),

  // Real-Time Server-Sent Events (SSE) Stream
  subscribeToTrackingStream: (onMessage: (event: { type: string; payload: any }) => void) => {
    try {
      const eventSource = new EventSource('/api/tracking/stream');

      const events = [
        'BUS_LOCATION_UPDATE',
        'BUS_STATUS_UPDATE',
        'BUS_CREATED',
        'BUS_UPDATED',
        'BUS_DELETED',
        'TRIP_STARTED',
        'TRIP_COMPLETED',
        'STUDENT_CREATED',
        'STUDENT_UPDATED',
        'STUDENT_DELETED',
        'DATABASE_RESET',
      ];

      events.forEach((evtName) => {
        eventSource.addEventListener(evtName, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            onMessage({ type: evtName, payload: data });
          } catch (_) {}
        });
      });

      return () => {
        eventSource.close();
      };
    } catch (_) {
      return () => {};
    }
  },

  // Database & College Dataset Export
  getDatabaseTables: () =>
    fetchJson<{
      tables: Array<{ name: string; recordCount: number; primaryKey: string; description: string }>;
    }>('/database/tables'),

  getCollegeDatasetExport: () =>
    fetchJson<{
      collegeName: string;
      exportedAt: string;
      totalRecords: number;
      data: any[];
    }>('/college-dataset/export'),
};

