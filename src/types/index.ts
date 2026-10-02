export type UserRole = 'ROLE_STUDENT' | 'ROLE_PARENT' | 'ROLE_ADMIN' | 'ROLE_DRIVER';

export type BusStatus =
  | 'NOT_STARTED'
  | 'ON_TRIP'
  | 'AT_COLLEGE'
  | 'STARTED'
  | 'MOVING'
  | 'ACTIVE'
  | 'APPROACHING_STOP'
  | 'ARRIVED_AT_STOP'
  | 'ARRIVED_AT_COLLEGE'
  | 'STOPPED'
  | 'DELAYED'
  | 'OFFLINE'
  | 'COMPLETED'
  | 'EMERGENCY';

export type AlertType =
  | 'BUS_STARTED'
  | 'BUS_APPROACHING'
  | 'BUS_ARRIVED'
  | 'BUS_DELAYED'
  | 'BUS_OFFLINE'
  | 'ROUTE_CHANGE'
  | 'EMERGENCY'
  | 'SYSTEM_NOTIFICATION';

export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  studentId?: string; // If student
  parentId?: string;  // If parent
  driverId?: string;  // If driver
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface BoardingPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g. 100 for arrival, 500 for approaching
  routeId: string;
  stopOrder: number;
  scheduledTime?: string;
  isActive: boolean;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  routeNumber?: string;
  description: string;
  startPoint: string;
  startingPoint?: string;
  endPoint: string;
  destination?: string;
  collegeLat?: number;
  collegeLng?: number;
  collegeRadiusMeters?: number;
  stops: BoardingPoint[];
  isActive: boolean;
  status?: string;
  assignedBus?: string;
  assignedBusCount?: number;
  studentCount?: number;
  totalDistanceKm?: number;
  estimatedDurationMinutes?: number;
  estimatedTravelTime?: string;
  routeStatus?: 'ON_SCHEDULE' | 'DELAYED' | 'CONGESTED' | 'ACTIVE';
  waypoints?: [number, number][]; // Polyline coordinates
}

export interface Driver {
  id: string;
  driverId?: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseValidity: string;
  assignedBusId?: string;
  assignedBusNumber?: string;
  assignedRouteNumber?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  rating?: number;
  experienceYears?: number;
  currentTripStatus?: 'NOT_STARTED' | 'ACTIVE' | 'DELAYED' | 'STOPPED' | 'COMPLETED';
}

export interface Bus {
  id: string;
  busNumber: string;
  routeNumber?: string;
  registrationNumber: string;
  type: string; // e.g., '40-Seater AC Coach', '55-Seater Standard'
  capacity: number;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  routeId?: string;
  routeName?: string;
  currentStatus: BusStatus;
  latitude: number;
  longitude: number;
  speedKmH: number;
  heading: number; // 0-360 degrees
  lastGpsUpdate: string;
  isActive: boolean;
  routeStatus?: 'ON_SCHEDULE' | 'DELAYED' | 'CONGESTED' | 'ACTIVE';
  currentStopIndex?: number;
  nextStopName?: string;
  nextStopDistanceMeters?: number;
  etaMinutes?: number;
  isSimulated?: boolean;
}

export interface Student {
  id: string;
  studentId?: string;
  name: string;
  registerNumber: string;
  department: string;
  year: number | string;
  section?: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  assignedBusId: string;
  busNumber: string;
  routeId: string;
  routeNumber?: string;
  routeName?: string;
  boardingPointId: string;
  boardingPointName: string;
  boardingPoint?: string;
  dropPoint?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  busCapacity?: number;
  busGpsLatitude?: number;
  busGpsLongitude?: number;
  busStatus?: BusStatus | string;
  routeStatus?: string;
  attendanceStatus?: 'PRESENT' | 'ABSENT' | 'NOT_MARKED';
  tripDate?: string;
  tripTime?: string;
  linkedParentId?: string;
  linkedParentName?: string;
  linkedParentPhone?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  department: string;
  year: number | string;
  section?: string;
  busNumber: string;
  routeNumber: string;
  boardingPoint: string;
  status: 'PRESENT' | 'ABSENT' | 'NOT_MARKED';
  tripDate: string;
  tripTime: string;
  tripType: 'MORNING_PICKUP' | 'EVENING_DROP';
  markedAt: string;
  markedBy: 'DRIVER' | 'ADMIN' | 'RFID_TAP';
}

export interface AttendanceSummary {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  notMarkedCount: number;
  attendancePercentage: number;
  date: string;
  tripType: string;
}

export interface CollegeTrip {
  id: string;
  tripDate: string;
  tripTime: string;
  tripType: 'MORNING_PICKUP' | 'EVENING_DROP';
  busNumber: string;
  routeNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  status: 'NOT_STARTED' | 'ACTIVE' | 'DELAYED' | 'STOPPED' | 'COMPLETED';
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  startTime?: string;
  endTime?: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  linkedStudentIds: string[];
  linkedStudents?: Student[];
  createdAt: string;
}

export interface Schedule {
  id: string;
  tripType: 'MORNING_PICKUP' | 'EVENING_DROP' | 'SPECIAL_EVENT';
  startTime: string; // e.g. "06:45 AM"
  expectedEndTime: string; // e.g. "08:15 AM"
  routeId: string;
  routeName: string;
  busId: string;
  busNumber: string;
  activeDays: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface TrackingHistoryItem {
  id: string;
  busId: string;
  busNumber: string;
  latitude: number;
  longitude: number;
  speedKmH: number;
  heading: number;
  timestamp: string;
  source: 'SIMULATOR' | 'HARDWARE_GPS' | 'MOBILE_APP' | 'DRIVER_TELEMETRY';
  status: BusStatus;
}

export interface Alert {
  id: string;
  recipientId?: string;
  recipientRole?: UserRole | 'ALL';
  type: AlertType;
  title: string;
  message: string;
  busId?: string;
  busNumber?: string;
  routeId?: string;
  routeName?: string;
  boardingPointId?: string;
  boardingPointName?: string;
  studentId?: string;
  studentName?: string;
  priority: AlertPriority;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName: string;
  action: string;
  category: 'AUTH' | 'TRACKING' | 'FLEET' | 'ALERT' | 'SYSTEM';
  details: string;
  ipAddress?: string;
}

export interface FleetAnalytics {
  totalBuses: number;
  activeBuses: number;
  delayedBuses: number;
  offlineBuses: number;
  totalStudents: number;
  totalParents: number;
  totalRoutes: number;
  totalDrivers: number;
  fleetUtilizationPct: number;
  averageSpeedKmH: number;
  statusCounts: Record<BusStatus, number>;
  studentsByRoute: { routeName: string; studentCount: number; busCount: number }[];
  alertsByType: Record<string, number>;
}

export interface GroundingChunkMaps {
  uri?: string;
  title?: string;
  placeAnswerSources?: {
    reviewSnippets?: Array<{
      content?: string;
      sourceTitle?: string;
      sourceUri?: string;
    }>;
  };
  address?: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: GroundingChunkMaps;
}

export interface MapsGroundingResponse {
  text: string;
  groundingChunks?: GroundingChunk[];
  searchQueries?: string[];
  error?: string;
}

export interface AudioTranscriptionResponse {
  transcription: string;
  error?: string;
}

export interface VoiceChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioBase64?: string;
  timestamp: string;
  language?: string;
}

export interface VoiceChatResponse {
  reply: string;
  audioBase64?: string;
  language?: string;
  error?: string;
}

export interface TextToSpeechResponse {
  audioBase64?: string;
  mimeType?: string;
  error?: string;
}

export interface TamilNaduTransitZone {
  id: string;
  name: string;
  district: string;
  region: string;
  icon: string;
  coordinates: [number, number]; // [lat, lng]
  activeFleetCount: number;
  totalPassengers: number;
  onTimeRate: number;
  collegesCount: number;
  status: 'OPTIMAL' | 'HEAVY_TRAFFIC' | 'MAINTENANCE' | 'ADVERSE_WEATHER';
  primaryColleges: string[];
  keyBusCorridors: string[];
  description: string;
}

export interface CollegeConfig {
  collegeId: string;
  collegeName: string;
  shortName: string;
  state: string;
  district: string;
  city: string;
  campusAddress: string;
  helplinePhone: string;
  establishedYear?: number;
}

export interface WorldTransitHub {
  id: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  coordinates: [number, number]; // [lat, lng]
  activeFleetCount: number;
  totalPassengers: number;
  onTimeRate: number;
  timezone: string;
  status: 'OPTIMAL' | 'HEAVY_TRAFFIC' | 'MAINTENANCE' | 'ADVERSE_WEATHER';
  primaryTransitMode: string;
  description: string;
}
