import fs from 'fs';
import path from 'path';
import type {
  Bus,
  Route,
  BoardingPoint,
  Student,
  Driver,
  AttendanceRecord,
  AttendanceSummary,
  CollegeTrip,
  BusStatus,
} from '../types/index.ts';

// File-based persistence path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'college_bus_database.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Today's date string YYYY-MM-DD
const TODAY_STR = new Date().toISOString().split('T')[0];

interface DatabaseState {
  buses: Bus[];
  routes: Route[];
  boardingPoints: BoardingPoint[];
  drivers: Driver[];
  students: Student[];
  attendance: AttendanceRecord[];
  trips: CollegeTrip[];
  lastUpdated: string;
}

// ============================================================================
// REALISTIC SAMPLE COLLEGE DATA GENERATION (Tamil Nadu Engineering Campus)
// ============================================================================

function createInitialDatabase(): DatabaseState {
  // 1. Drivers (5 primary drivers assigned to BUS-01 through BUS-05)
  const drivers: Driver[] = [
    {
      id: 'drv-01',
      driverId: 'DRV-01',
      name: 'P. Muthuvelan',
      phone: '+91 94441 22334',
      licenseNumber: 'TN-07-20150008921',
      licenseValidity: '2028-11-30',
      assignedBusId: 'bus-01',
      assignedBusNumber: 'BUS-01',
      assignedRouteNumber: 'RT-01',
      status: 'ACTIVE',
      rating: 4.9,
      experienceYears: 12,
      currentTripStatus: 'ACTIVE',
    },
    {
      id: 'drv-02',
      driverId: 'DRV-02',
      name: 'S. Rajendran',
      phone: '+91 94442 33445',
      licenseNumber: 'TN-09-20140004512',
      licenseValidity: '2027-08-15',
      assignedBusId: 'bus-02',
      assignedBusNumber: 'BUS-02',
      assignedRouteNumber: 'RT-02',
      status: 'ACTIVE',
      rating: 4.8,
      experienceYears: 10,
      currentTripStatus: 'ACTIVE',
    },
    {
      id: 'drv-03',
      driverId: 'DRV-03',
      name: 'P. Ganesan',
      phone: '+91 94443 44556',
      licenseNumber: 'TN-01-20160009843',
      licenseValidity: '2029-03-22',
      assignedBusId: 'bus-03',
      assignedBusNumber: 'BUS-03',
      assignedRouteNumber: 'RT-03',
      status: 'ACTIVE',
      rating: 4.7,
      experienceYears: 8,
      currentTripStatus: 'DELAYED',
    },
    {
      id: 'drv-04',
      driverId: 'DRV-04',
      name: 'K. Selvakumar',
      phone: '+91 94444 55667',
      licenseNumber: 'TN-10-20130006732',
      licenseValidity: '2027-05-19',
      assignedBusId: 'bus-04',
      assignedBusNumber: 'BUS-04',
      assignedRouteNumber: 'RT-04',
      status: 'ACTIVE',
      rating: 4.9,
      experienceYears: 14,
      currentTripStatus: 'STOPPED',
    },
    {
      id: 'drv-05',
      driverId: 'DRV-05',
      name: 'V. Balaji',
      phone: '+91 94445 66778',
      licenseNumber: 'TN-14-20170001290',
      licenseValidity: '2028-09-10',
      assignedBusId: 'bus-05',
      assignedBusNumber: 'BUS-05',
      assignedRouteNumber: 'RT-05',
      status: 'ACTIVE',
      rating: 4.6,
      experienceYears: 6,
      currentTripStatus: 'COMPLETED',
    },
  ];

  // 2. Routes (RT-01 to RT-05)
  const routes: Route[] = [
    {
      id: 'route-01',
      code: 'RT-01',
      routeNumber: 'RT-01',
      name: 'Route 1 - South Express (Central to Campus)',
      description: 'Central Station via LIC Mount Road, Guindy, Airport, Pallavaram, Tambaram to College',
      startPoint: 'Chennai Central Railway Station',
      startingPoint: 'Chennai Central Railway Station',
      endPoint: 'College Main Campus Terminal',
      destination: 'College Main Campus Terminal',
      assignedBus: 'BUS-01',
      assignedBusCount: 1,
      studentCount: 22,
      totalDistanceKm: 28.5,
      estimatedTravelTime: '45 mins',
      routeStatus: 'ON_SCHEDULE',
      isActive: true,
      stops: [],
      waypoints: [
        [13.0827, 80.2707],
        [13.0604, 80.2641],
        [13.0382, 80.2458],
        [13.0067, 80.2025],
        [12.9800, 80.1630],
        [12.9675, 80.1491],
        [12.9516, 80.1462],
        [12.9249, 80.1000],
        [12.9048, 80.0890],
        [12.8710, 80.0650],
      ],
    },
    {
      id: 'route-02',
      code: 'RT-02',
      routeNumber: 'RT-02',
      name: 'Route 2 - OMR IT Corridor (Adyar to Campus)',
      description: 'Adyar via Tidel Park, Thiruvanmiyur, Sholinganallur, Siruseri SIPCOT to College',
      startPoint: 'Adyar Bus Depot',
      startingPoint: 'Adyar Bus Depot',
      endPoint: 'College Main Campus Terminal',
      destination: 'College Main Campus Terminal',
      assignedBus: 'BUS-02',
      assignedBusCount: 1,
      studentCount: 21,
      totalDistanceKm: 29.2,
      estimatedTravelTime: '50 mins',
      routeStatus: 'ON_SCHEDULE',
      isActive: true,
      stops: [],
      waypoints: [
        [13.0012, 80.2565],
        [12.9880, 80.2450],
        [12.9830, 80.2594],
        [12.9650, 80.2460],
        [12.9010, 80.2279],
        [12.8530, 80.2260],
        [12.8250, 80.2190],
        [12.8710, 80.0650],
      ],
    },
    {
      id: 'route-03',
      code: 'RT-03',
      routeNumber: 'RT-03',
      name: 'Route 3 - West Corridor (Koyambedu to Campus)',
      description: 'Koyambedu CMBT via Vadapalani, Porur, Iyyappanthangal, Poonamallee bypass to College',
      startPoint: 'Koyambedu CMBT Gate 2',
      startingPoint: 'Koyambedu CMBT Gate 2',
      endPoint: 'College Main Campus Terminal',
      destination: 'College Main Campus Terminal',
      assignedBus: 'BUS-03',
      assignedBusCount: 1,
      studentCount: 20,
      totalDistanceKm: 31.0,
      estimatedTravelTime: '55 mins',
      routeStatus: 'CONGESTED',
      isActive: true,
      stops: [],
      waypoints: [
        [13.0732, 80.1983],
        [13.0500, 80.2120],
        [13.0370, 80.2120],
        [13.0330, 80.1580],
        [13.0420, 80.1380],
        [13.0480, 80.0980],
        [12.9300, 80.0750],
        [12.8710, 80.0650],
      ],
    },
    {
      id: 'route-04',
      code: 'RT-04',
      routeNumber: 'RT-04',
      name: 'Route 4 - North Metro Express (Madhavaram to Campus)',
      description: 'Madhavaram MMBT via Anna Nagar Roundtana, Thirumangalam, Maduravoyal to College',
      startPoint: 'Madhavaram MMBT Terminal',
      startingPoint: 'Madhavaram MMBT Terminal',
      endPoint: 'College Main Campus Terminal',
      destination: 'College Main Campus Terminal',
      assignedBus: 'BUS-04',
      assignedBusCount: 1,
      studentCount: 20,
      totalDistanceKm: 34.5,
      estimatedTravelTime: '50 mins',
      routeStatus: 'ON_SCHEDULE',
      isActive: true,
      stops: [],
      waypoints: [
        [13.1480, 80.2310],
        [13.0850, 80.2100],
        [13.0830, 80.1920],
        [13.0650, 80.1700],
        [13.0100, 80.1300],
        [12.9400, 80.0900],
        [12.8710, 80.0650],
      ],
    },
    {
      id: 'route-05',
      code: 'RT-05',
      routeNumber: 'RT-05',
      name: 'Route 5 - Medavakkam & East Link (Velachery to Campus)',
      description: 'Velachery MRTS via Medavakkam Koot Road, Gowrivakkam, Camp Road, Tambaram East to College',
      startPoint: 'Velachery MRTS Station',
      startingPoint: 'Velachery MRTS Station',
      endPoint: 'College Main Campus Terminal',
      destination: 'College Main Campus Terminal',
      assignedBus: 'BUS-05',
      assignedBusCount: 1,
      studentCount: 20,
      totalDistanceKm: 24.8,
      estimatedTravelTime: '40 mins',
      routeStatus: 'ON_SCHEDULE',
      isActive: true,
      stops: [],
      waypoints: [
        [12.9780, 80.2190],
        [12.9180, 80.1910],
        [12.9160, 80.1680],
        [12.9150, 80.1420],
        [12.9249, 80.1000],
        [12.8710, 80.0650],
      ],
    },
  ];

  // 3. Boarding Points for each route
  const boardingPoints: BoardingPoint[] = [
    // Route 1
    { id: 'bp-01-1', routeId: 'route-01', name: 'Chennai Central Gate 4', latitude: 13.0827, longitude: 80.2707, radiusMeters: 100, stopOrder: 1, scheduledTime: '06:30 AM', isActive: true },
    { id: 'bp-01-2', routeId: 'route-01', name: 'LIC Mount Road', latitude: 13.0604, longitude: 80.2641, radiusMeters: 100, stopOrder: 2, scheduledTime: '06:42 AM', isActive: true },
    { id: 'bp-01-3', routeId: 'route-01', name: 'Nandanam Signal', latitude: 13.0382, longitude: 80.2458, radiusMeters: 100, stopOrder: 3, scheduledTime: '06:55 AM', isActive: true },
    { id: 'bp-01-4', routeId: 'route-01', name: 'Guindy Kathipara Junction', latitude: 13.0067, longitude: 80.2025, radiusMeters: 100, stopOrder: 4, scheduledTime: '07:10 AM', isActive: true },
    { id: 'bp-01-5', routeId: 'route-01', name: 'Meenambakkam Airport Metro', latitude: 12.9800, longitude: 80.1630, radiusMeters: 100, stopOrder: 5, scheduledTime: '07:22 AM', isActive: true },
    { id: 'bp-01-6', routeId: 'route-01', name: 'Pallavaram Bus Stand', latitude: 12.9675, longitude: 80.1491, radiusMeters: 100, stopOrder: 6, scheduledTime: '07:32 AM', isActive: true },
    { id: 'bp-01-7', routeId: 'route-01', name: 'Chromepet MIT Gate', latitude: 12.9516, longitude: 80.1462, radiusMeters: 100, stopOrder: 7, scheduledTime: '07:42 AM', isActive: true },
    { id: 'bp-01-8', routeId: 'route-01', name: 'Tambaram Sanatorium Flyover', latitude: 12.9249, longitude: 80.1000, radiusMeters: 100, stopOrder: 8, scheduledTime: '07:55 AM', isActive: true },
    { id: 'bp-01-9', routeId: 'route-01', name: 'College Main Campus Terminal', latitude: 12.8710, longitude: 80.0650, radiusMeters: 100, stopOrder: 9, scheduledTime: '08:15 AM', isActive: true },

    // Route 2
    { id: 'bp-02-1', routeId: 'route-02', name: 'Adyar Bus Depot', latitude: 13.0012, longitude: 80.2565, radiusMeters: 100, stopOrder: 1, scheduledTime: '06:35 AM', isActive: true },
    { id: 'bp-02-2', routeId: 'route-02', name: 'Tidel Park Junction', latitude: 12.9880, longitude: 80.2450, radiusMeters: 100, stopOrder: 2, scheduledTime: '06:48 AM', isActive: true },
    { id: 'bp-02-3', routeId: 'route-02', name: 'Thiruvanmiyur Signal', latitude: 12.9830, longitude: 80.2594, radiusMeters: 100, stopOrder: 3, scheduledTime: '06:58 AM', isActive: true },
    { id: 'bp-02-4', routeId: 'route-02', name: 'Perungudi Toll Plaza', latitude: 12.9650, longitude: 80.2460, radiusMeters: 100, stopOrder: 4, scheduledTime: '07:12 AM', isActive: true },
    { id: 'bp-02-5', routeId: 'route-02', name: 'Sholinganallur Junction', latitude: 12.9010, longitude: 80.2279, radiusMeters: 100, stopOrder: 5, scheduledTime: '07:28 AM', isActive: true },
    { id: 'bp-02-6', routeId: 'route-02', name: 'Navalur Vivira Mall', latitude: 12.8530, longitude: 80.2260, radiusMeters: 100, stopOrder: 6, scheduledTime: '07:42 AM', isActive: true },
    { id: 'bp-02-7', routeId: 'route-02', name: 'Siruseri SIPCOT Gate 1', latitude: 12.8250, longitude: 80.2190, radiusMeters: 100, stopOrder: 7, scheduledTime: '07:55 AM', isActive: true },
    { id: 'bp-02-8', routeId: 'route-02', name: 'College Main Campus Terminal', latitude: 12.8710, longitude: 80.0650, radiusMeters: 100, stopOrder: 8, scheduledTime: '08:20 AM', isActive: true },

    // Route 3
    { id: 'bp-03-1', routeId: 'route-03', name: 'Koyambedu CMBT Gate 2', latitude: 13.0732, longitude: 80.1983, radiusMeters: 100, stopOrder: 1, scheduledTime: '06:30 AM', isActive: true },
    { id: 'bp-03-2', routeId: 'route-03', name: 'Vadapalani Temple Stop', latitude: 13.0500, longitude: 80.2120, radiusMeters: 100, stopOrder: 2, scheduledTime: '06:45 AM', isActive: true },
    { id: 'bp-03-3', routeId: 'route-03', name: 'Ashok Pillar Junction', latitude: 13.0370, longitude: 80.2120, radiusMeters: 100, stopOrder: 3, scheduledTime: '06:58 AM', isActive: true },
    { id: 'bp-03-4', routeId: 'route-03', name: 'Porur Roundtana', latitude: 13.0330, longitude: 80.1580, radiusMeters: 100, stopOrder: 4, scheduledTime: '07:15 AM', isActive: true },
    { id: 'bp-03-5', routeId: 'route-03', name: 'Iyyappanthangal Bus Depot', latitude: 13.0420, longitude: 80.1380, radiusMeters: 100, stopOrder: 5, scheduledTime: '07:25 AM', isActive: true },
    { id: 'bp-03-6', routeId: 'route-03', name: 'Poonamallee Bypass', latitude: 13.0480, longitude: 80.0980, radiusMeters: 100, stopOrder: 6, scheduledTime: '07:40 AM', isActive: true },
    { id: 'bp-03-7', routeId: 'route-03', name: 'Mudichur Road Cut', latitude: 12.9300, longitude: 80.0750, radiusMeters: 100, stopOrder: 7, scheduledTime: '08:00 AM', isActive: true },
    { id: 'bp-03-8', routeId: 'route-03', name: 'College Main Campus Terminal', latitude: 12.8710, longitude: 80.0650, radiusMeters: 100, stopOrder: 8, scheduledTime: '08:18 AM', isActive: true },

    // Route 4
    { id: 'bp-04-1', routeId: 'route-04', name: 'Madhavaram MMBT Terminal', latitude: 13.1480, longitude: 80.2310, radiusMeters: 100, stopOrder: 1, scheduledTime: '06:30 AM', isActive: true },
    { id: 'bp-04-2', routeId: 'route-04', name: 'Anna Nagar Roundtana', latitude: 13.0850, longitude: 80.2100, radiusMeters: 100, stopOrder: 2, scheduledTime: '06:48 AM', isActive: true },
    { id: 'bp-04-3', routeId: 'route-04', name: 'Thirumangalam Signal', latitude: 13.0830, longitude: 80.1920, radiusMeters: 100, stopOrder: 3, scheduledTime: '07:00 AM', isActive: true },
    { id: 'bp-04-4', routeId: 'route-04', name: 'Maduravoyal Toll Cut', latitude: 13.0650, longitude: 80.1700, radiusMeters: 100, stopOrder: 4, scheduledTime: '07:15 AM', isActive: true },
    { id: 'bp-04-5', routeId: 'route-04', name: 'Mangadu Junction', latitude: 13.0100, longitude: 80.1300, radiusMeters: 100, stopOrder: 5, scheduledTime: '07:35 AM', isActive: true },
    { id: 'bp-04-6', routeId: 'route-04', name: 'Vandalur Outer Ring Road', latitude: 12.9400, longitude: 80.0900, radiusMeters: 100, stopOrder: 6, scheduledTime: '07:55 AM', isActive: true },
    { id: 'bp-04-7', routeId: 'route-04', name: 'College Main Campus Terminal', latitude: 12.8710, longitude: 80.0650, radiusMeters: 100, stopOrder: 7, scheduledTime: '08:15 AM', isActive: true },

    // Route 5
    { id: 'bp-05-1', routeId: 'route-05', name: 'Velachery MRTS Station', latitude: 12.9780, longitude: 80.2190, radiusMeters: 100, stopOrder: 1, scheduledTime: '06:40 AM', isActive: true },
    { id: 'bp-05-2', routeId: 'route-05', name: 'Medavakkam Koot Road', latitude: 12.9180, longitude: 80.1910, radiusMeters: 100, stopOrder: 2, scheduledTime: '06:55 AM', isActive: true },
    { id: 'bp-05-3', routeId: 'route-05', name: 'Gowrivakkam Bus Stop', latitude: 12.9160, longitude: 80.1680, radiusMeters: 100, stopOrder: 3, scheduledTime: '07:10 AM', isActive: true },
    { id: 'bp-05-4', routeId: 'route-05', name: 'Camp Road Selaiyur', latitude: 12.9150, longitude: 80.1420, radiusMeters: 100, stopOrder: 4, scheduledTime: '07:25 AM', isActive: true },
    { id: 'bp-05-5', routeId: 'route-05', name: 'Tambaram East Station', latitude: 12.9249, longitude: 80.1000, radiusMeters: 100, stopOrder: 5, scheduledTime: '07:45 AM', isActive: true },
    { id: 'bp-05-6', routeId: 'route-05', name: 'College Main Campus Terminal', latitude: 12.8710, longitude: 80.0650, radiusMeters: 100, stopOrder: 6, scheduledTime: '08:10 AM', isActive: true },
  ];

  // Attach stops to routes
  routes.forEach((r) => {
    r.stops = boardingPoints.filter((bp) => bp.routeId === r.id);
  });

  // 4. Multiple College Buses (BUS-01 through BUS-05 as specifically requested)
  const buses: Bus[] = [
    {
      id: 'bus-01',
      busNumber: 'BUS-01',
      routeNumber: 'RT-01',
      registrationNumber: 'TN-22-CY-7501',
      type: '55-Seater AC Coach',
      capacity: 55,
      driverId: 'drv-01',
      driverName: 'P. Muthuvelan',
      driverPhone: '+91 94441 22334',
      routeId: 'route-01',
      routeName: 'Route 1 - South Express',
      currentStatus: 'ACTIVE',
      latitude: 12.9675,
      longitude: 80.1491,
      speedKmH: 38,
      heading: 205,
      lastGpsUpdate: new Date().toISOString(),
      isActive: true,
      routeStatus: 'ON_SCHEDULE',
      currentStopIndex: 5,
      nextStopName: 'Pallavaram Bus Stand',
      nextStopDistanceMeters: 480,
      etaMinutes: 2,
      isSimulated: true,
    },
    {
      id: 'bus-02',
      busNumber: 'BUS-02',
      routeNumber: 'RT-02',
      registrationNumber: 'TN-22-CY-4202',
      type: '50-Seater Deluxe',
      capacity: 50,
      driverId: 'drv-02',
      driverName: 'S. Rajendran',
      driverPhone: '+91 94442 33445',
      routeId: 'route-02',
      routeName: 'Route 2 - OMR IT Corridor',
      currentStatus: 'ACTIVE',
      latitude: 12.9650,
      longitude: 80.2460,
      speedKmH: 42,
      heading: 195,
      lastGpsUpdate: new Date().toISOString(),
      isActive: true,
      routeStatus: 'ON_SCHEDULE',
      currentStopIndex: 3,
      nextStopName: 'Perungudi Toll Plaza',
      nextStopDistanceMeters: 620,
      etaMinutes: 3,
      isSimulated: true,
    },
    {
      id: 'bus-03',
      busNumber: 'BUS-03',
      routeNumber: 'RT-03',
      registrationNumber: 'TN-22-CY-1803',
      type: '48-Seater Deluxe',
      capacity: 48,
      driverId: 'drv-03',
      driverName: 'P. Ganesan',
      driverPhone: '+91 94443 44556',
      routeId: 'route-03',
      routeName: 'Route 3 - West Corridor',
      currentStatus: 'DELAYED',
      latitude: 13.0330,
      longitude: 80.1580,
      speedKmH: 14,
      heading: 235,
      lastGpsUpdate: new Date().toISOString(),
      isActive: true,
      routeStatus: 'CONGESTED',
      currentStopIndex: 3,
      nextStopName: 'Porur Roundtana',
      nextStopDistanceMeters: 850,
      etaMinutes: 7,
      isSimulated: true,
    },
    {
      id: 'bus-04',
      busNumber: 'BUS-04',
      routeNumber: 'RT-04',
      registrationNumber: 'TN-22-CY-2904',
      type: '55-Seater Standard',
      capacity: 55,
      driverId: 'drv-04',
      driverName: 'K. Selvakumar',
      driverPhone: '+91 94444 55667',
      routeId: 'route-04',
      routeName: 'Route 4 - North Metro Express',
      currentStatus: 'STOPPED',
      latitude: 13.0850,
      longitude: 80.2100,
      speedKmH: 0,
      heading: 215,
      lastGpsUpdate: new Date().toISOString(),
      isActive: true,
      routeStatus: 'ON_SCHEDULE',
      currentStopIndex: 1,
      nextStopName: 'Anna Nagar Roundtana',
      nextStopDistanceMeters: 20,
      etaMinutes: 1,
      isSimulated: true,
    },
    {
      id: 'bus-05',
      busNumber: 'BUS-05',
      routeNumber: 'RT-05',
      registrationNumber: 'TN-22-CY-5505',
      type: '50-Seater AC Coach',
      capacity: 50,
      driverId: 'drv-05',
      driverName: 'V. Balaji',
      driverPhone: '+91 94445 66778',
      routeId: 'route-05',
      routeName: 'Route 5 - Medavakkam Link',
      currentStatus: 'COMPLETED',
      latitude: 12.8710,
      longitude: 80.0650,
      speedKmH: 0,
      heading: 0,
      lastGpsUpdate: new Date().toISOString(),
      isActive: true,
      routeStatus: 'ON_SCHEDULE',
      currentStopIndex: 5,
      nextStopName: 'College Main Campus Terminal',
      nextStopDistanceMeters: 0,
      etaMinutes: 0,
      isSimulated: true,
    },
  ];

  // 5. Realistic College Students Dataset (103 Students with all required structured fields)
  const students: Student[] = [];
  const attendance: AttendanceRecord[] = [];

  const tamilNaduStudentNames = [
    'K. Vigneshwaran', 'S. Abinaya', 'M. Karthik', 'R. Priyadharshini', 'A. Aravind Kumar',
    'T. Dharshini', 'P. Naveen', 'V. Ananya', 'S. Hariharan', 'N. Meera',
    'M. Deepak', 'G. Sneha', 'D. Praveen Kumar', 'K. Janani', 'S. Ashwin',
    'R. Pooja', 'B. Sanjay', 'T. Lavanya', 'M. Gautham', 'P. Roshni',
    'A. Chetan', 'V. Nitya', 'K. Madhav', 'S. Bhavna', 'R. Tarun',
    'N. Vidhya', 'P. Varun', 'M. Divya', 'S. Pranav', 'K. Yamini',
    'C. Venkatesh', 'A. Radhika', 'G. Siddharth', 'R. Tanvi', 'S. Manoj',
    'P. Nalini', 'M. Aakash', 'D. Charu', 'K. Ishaan', 'S. Kavya',
    'T. Rahul', 'V. Zoya', 'N. Yash', 'P. Balaji', 'S. Sangeetha',
    'R. Vijay', 'M. Pavithra', 'K. Saravanan', 'A. Keerthana', 'G. Dinesh',
    'V. Malathi', 'D. Arun', 'T. Sowmya', 'S. Manikandan', 'N. Revathi',
    'P. Sivakumar', 'R. Deepika', 'M. Anand', 'K. Shanthi', 'A. Vignesh',
    'S. Gomathi', 'G. Mohan', 'V. Sumathi', 'D. Suresh', 'T. Gayathri',
    'N. Raghuram', 'P. Kausalya', 'R. Senthil', 'M. Bhuvana', 'K. Ramesh',
    'A. Usha', 'S. Murugesan', 'G. Uma', 'V. Shankar', 'D. Rohini',
    'T. Parthiban', 'N. Chitra', 'P. Jagadeesh', 'R. Vasanthi', 'M. Vinoth',
    'K. Sujatha', 'A. Elango', 'S. Preethi', 'G. Selvam', 'V. Menaka',
    'D. Baskaran', 'T. Sandhya', 'N. Jayanthi', 'P. Thangaraj', 'R. Sharmila',
    'M. Sasikumar', 'K. Nandhini', 'A. Sridhar', 'S. Hema', 'G. Srinivasan',
    'V. Geetha', 'D. Loganathan', 'T. Vani', 'N. Kalaiselvan', 'P. Manjula',
    'R. Sundar', 'M. Renuka', 'K. Natarajan',
  ];

  const depts = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Artificial Intelligence & Data Science',
    'Mechanical Engineering',
    'Electrical & Electronics Engineering',
    'Civil Engineering',
  ];

  const yearLabels = ['IV Year', 'III Year', 'II Year', 'I Year'];
  const sections = ['CSE-A', 'CSE-B', 'IT-A', 'ECE-A', 'ECE-B', 'AIDS-A', 'MECH-A', 'EEE-A', 'CIVIL-A'];

  // Map each bus to its stops
  const busStopsMap: Record<string, BoardingPoint[]> = {
    'BUS-01': boardingPoints.filter((bp) => bp.routeId === 'route-01'),
    'BUS-02': boardingPoints.filter((bp) => bp.routeId === 'route-02'),
    'BUS-03': boardingPoints.filter((bp) => bp.routeId === 'route-03'),
    'BUS-04': boardingPoints.filter((bp) => bp.routeId === 'route-04'),
    'BUS-05': boardingPoints.filter((bp) => bp.routeId === 'route-05'),
  };

  const busObjMap: Record<string, Bus> = {
    'BUS-01': buses[0],
    'BUS-02': buses[1],
    'BUS-03': buses[2],
    'BUS-04': buses[3],
    'BUS-05': buses[4],
  };

  // Generate 103 students distributed across BUS-01 to BUS-05
  tamilNaduStudentNames.forEach((name, idx) => {
    const studentNum = idx + 1;
    const studentId = `STD-2024-${String(studentNum).padStart(3, '0')}`;
    const regNum = `310621104${String(studentNum).padStart(3, '0')}`;
    const dept = depts[idx % depts.length];
    const year = yearLabels[idx % yearLabels.length];
    const section = sections[idx % sections.length];
    const phone = `+91 ${98400 + (idx % 900)} ${10000 + ((idx * 73) % 90000)}`;

    // Distribute among BUS-01 to BUS-05
    const busIdx = idx % 5;
    const busNum = `BUS-0${busIdx + 1}` as 'BUS-01' | 'BUS-02' | 'BUS-03' | 'BUS-04' | 'BUS-05';
    const bus = busObjMap[busNum];
    const routeStops = busStopsMap[busNum];
    const assignedStop = routeStops[idx % Math.max(1, routeStops.length - 1)]; // Don't pick campus as boarding point

    // Realistic attendance status: ~90% Present, 8% Absent, 2% Not Marked
    const rand = (idx * 17) % 100;
    const attStatus: 'PRESENT' | 'ABSENT' | 'NOT_MARKED' =
      rand < 88 ? 'PRESENT' : rand < 96 ? 'ABSENT' : 'NOT_MARKED';

    const newStudent: Student = {
      id: `stud-${studentNum}`,
      studentId,
      name,
      registerNumber: regNum,
      department: dept,
      year,
      section,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@college.edu.in`,
      phone,
      status: 'ACTIVE',
      assignedBusId: bus.id,
      busNumber: bus.busNumber,
      routeId: bus.routeId || 'route-01',
      routeNumber: bus.routeNumber || 'RT-01',
      routeName: bus.routeName,
      boardingPointId: assignedStop.id,
      boardingPointName: assignedStop.name,
      boardingPoint: assignedStop.name,
      dropPoint: 'College Main Campus Terminal',
      driverId: bus.driverId,
      driverName: bus.driverName,
      driverPhone: bus.driverPhone,
      busCapacity: bus.capacity,
      attendanceStatus: attStatus,
      tripDate: TODAY_STR,
      tripTime: assignedStop.scheduledTime || '07:15 AM',
      createdAt: '2024-08-01T08:00:00.000Z',
    };

    students.push(newStudent);

    // Create corresponding attendance record
    attendance.push({
      id: `att-${TODAY_STR}-${studentNum}`,
      studentId,
      studentName: name,
      registerNumber: regNum,
      department: dept,
      year,
      section,
      busNumber: bus.busNumber,
      routeNumber: bus.routeNumber || 'RT-01',
      boardingPoint: assignedStop.name,
      status: attStatus,
      tripDate: TODAY_STR,
      tripTime: assignedStop.scheduledTime || '07:15 AM',
      tripType: 'MORNING_PICKUP',
      markedAt: attStatus !== 'NOT_MARKED' ? `${TODAY_STR}T07:${String(15 + (idx % 40)).padStart(2, '0')}:00.000Z` : '',
      markedBy: attStatus === 'PRESENT' ? 'RFID_TAP' : 'DRIVER',
    });
  });

  // 6. Today's Trips (5 Trips for BUS-01 to BUS-05)
  const trips: CollegeTrip[] = buses.map((b) => {
    const busStudents = students.filter((s) => s.busNumber === b.busNumber);
    const presentCount = busStudents.filter((s) => s.attendanceStatus === 'PRESENT').length;
    const absentCount = busStudents.filter((s) => s.attendanceStatus === 'ABSENT').length;

    let tripStatus: 'NOT_STARTED' | 'ACTIVE' | 'DELAYED' | 'STOPPED' | 'COMPLETED' = 'ACTIVE';
    if (b.currentStatus === 'DELAYED') tripStatus = 'DELAYED';
    else if (b.currentStatus === 'STOPPED') tripStatus = 'STOPPED';
    else if (b.currentStatus === 'COMPLETED') tripStatus = 'COMPLETED';

    return {
      id: `trip-${TODAY_STR}-${b.busNumber.toLowerCase()}`,
      tripDate: TODAY_STR,
      tripTime: '06:30 AM',
      tripType: 'MORNING_PICKUP',
      busNumber: b.busNumber,
      routeNumber: b.routeNumber || 'RT-01',
      driverId: b.driverId || 'drv-01',
      driverName: b.driverName || 'P. Muthuvelan',
      driverPhone: b.driverPhone || '+91 94441 22334',
      status: tripStatus,
      totalStudents: busStudents.length,
      presentCount,
      absentCount,
      startTime: `${TODAY_STR}T06:30:00.000Z`,
      endTime: b.currentStatus === 'COMPLETED' ? `${TODAY_STR}T08:15:00.000Z` : undefined,
    };
  });

  return {
    buses,
    routes,
    boardingPoints,
    drivers,
    students,
    attendance,
    trips,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// SINGLETON DATABASE ENGINE (CRUD, Persistence, Search, Filter, Attendance)
// ============================================================================

class CollegeDatabase {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseState;
        if (parsed.buses && parsed.students && parsed.students.length > 50) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing database file, initializing fresh dataset:', e);
    }

    const fresh = createInitialDatabase();
    this.saveToDisk(fresh);
    return fresh;
  }

  private saveToDisk(stateToSave?: DatabaseState) {
    try {
      const data = stateToSave || this.state;
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving college database to disk:', e);
    }
  }

  // --------------------------------------------------------------------------
  // BUSES CRUD & TELEMETRY
  // --------------------------------------------------------------------------
  public getBuses(): Bus[] {
    return this.state.buses;
  }

  public getBusById(idOrBusNumber: string): Bus | undefined {
    return this.state.buses.find(
      (b) => b.id.toLowerCase() === idOrBusNumber.toLowerCase() || b.busNumber.toLowerCase() === idOrBusNumber.toLowerCase()
    );
  }

  public updateBusStatus(busNumber: string, status: BusStatus): Bus | undefined {
    const bus = this.getBusById(busNumber);
    if (!bus) return undefined;

    bus.currentStatus = status;
    bus.lastGpsUpdate = new Date().toISOString();

    // Sync corresponding driver status
    const driver = this.state.drivers.find((d) => d.id === bus.driverId || d.assignedBusNumber === bus.busNumber);
    if (driver) {
      if (status === 'COMPLETED') driver.currentTripStatus = 'COMPLETED';
      else if (status === 'DELAYED') driver.currentTripStatus = 'DELAYED';
      else if (status === 'STOPPED') driver.currentTripStatus = 'STOPPED';
      else driver.currentTripStatus = 'ACTIVE';
    }

    // Sync trip status
    const trip = this.state.trips.find((t) => t.busNumber === bus.busNumber && t.tripDate === TODAY_STR);
    if (trip) {
      if (status === 'COMPLETED') {
        trip.status = 'COMPLETED';
        trip.endTime = new Date().toISOString();
      } else if (status === 'DELAYED') {
        trip.status = 'DELAYED';
      } else if (status === 'STOPPED') {
        trip.status = 'STOPPED';
      } else {
        trip.status = 'ACTIVE';
      }
    }

    this.saveToDisk();
    return bus;
  }

  public updateBusLocation(
    busNumber: string,
    latitude: number,
    longitude: number,
    speedKmH?: number,
    heading?: number,
    nextStopName?: string,
    etaMinutes?: number
  ): Bus | undefined {
    const bus = this.getBusById(busNumber);
    if (!bus) return undefined;

    bus.latitude = latitude;
    bus.longitude = longitude;
    if (speedKmH !== undefined) bus.speedKmH = speedKmH;
    if (heading !== undefined) bus.heading = heading;
    if (nextStopName) bus.nextStopName = nextStopName;
    if (etaMinutes !== undefined) bus.etaMinutes = etaMinutes;
    bus.lastGpsUpdate = new Date().toISOString();

    this.saveToDisk();
    return bus;
  }

  public createBus(newBusData: Partial<Bus>): Bus {
    const id = `bus-${Date.now()}`;
    const busNumber = newBusData.busNumber || `BUS-0${this.state.buses.length + 1}`;
    const bus: Bus = {
      id,
      busNumber,
      registrationNumber: newBusData.registrationNumber || `TN-22-CY-${1000 + this.state.buses.length}`,
      type: newBusData.type || '50-Seater Deluxe',
      capacity: newBusData.capacity || 50,
      driverId: newBusData.driverId,
      driverName: newBusData.driverName || 'P. Muthuvelan',
      driverPhone: newBusData.driverPhone || '+91 94441 22334',
      routeId: newBusData.routeId || 'route-01',
      routeNumber: newBusData.routeNumber || 'RT-01',
      routeName: newBusData.routeName || 'Route 1 - South Express',
      currentStatus: newBusData.currentStatus || 'ACTIVE',
      latitude: newBusData.latitude || 12.9675,
      longitude: newBusData.longitude || 80.1491,
      speedKmH: newBusData.speedKmH || 35,
      heading: newBusData.heading || 0,
      lastGpsUpdate: new Date().toISOString(),
      isActive: true,
      routeStatus: 'ON_SCHEDULE',
      etaMinutes: 5,
    };

    this.state.buses.push(bus);
    this.saveToDisk();
    return bus;
  }

  // --------------------------------------------------------------------------
  // ROUTES CRUD
  // --------------------------------------------------------------------------
  public getRoutes(): Route[] {
    return this.state.routes;
  }

  public getRouteById(idOrRouteNumber: string): Route | undefined {
    return this.state.routes.find(
      (r) => r.id.toLowerCase() === idOrRouteNumber.toLowerCase() || r.routeNumber?.toLowerCase() === idOrRouteNumber.toLowerCase()
    );
  }

  public createRoute(newRouteData: Partial<Route>): Route {
    const id = `route-${Date.now()}`;
    const routeNumber = newRouteData.routeNumber || `RT-0${this.state.routes.length + 1}`;
    const route: Route = {
      id,
      code: routeNumber,
      routeNumber,
      name: newRouteData.name || `Route ${routeNumber}`,
      description: newRouteData.description || 'College Campus Route',
      startPoint: newRouteData.startPoint || 'City Terminal',
      startingPoint: newRouteData.startingPoint || newRouteData.startPoint || 'City Terminal',
      endPoint: newRouteData.endPoint || 'College Main Campus Terminal',
      destination: newRouteData.destination || newRouteData.endPoint || 'College Main Campus Terminal',
      assignedBus: newRouteData.assignedBus || 'BUS-01',
      assignedBusCount: 1,
      studentCount: 0,
      totalDistanceKm: newRouteData.totalDistanceKm || 25,
      estimatedTravelTime: newRouteData.estimatedTravelTime || '45 mins',
      routeStatus: newRouteData.routeStatus || 'ON_SCHEDULE',
      isActive: true,
      stops: [],
      waypoints: newRouteData.waypoints || [[13.0827, 80.2707], [12.8710, 80.0650]],
    };

    this.state.routes.push(route);
    this.saveToDisk();
    return route;
  }

  // --------------------------------------------------------------------------
  // STUDENTS CRUD & SEARCH/FILTER
  // --------------------------------------------------------------------------
  public getStudents(): Student[] {
    return this.state.students;
  }

  public getStudentById(idOrRegNum: string): Student | undefined {
    return this.state.students.find(
      (s) =>
        s.id.toLowerCase() === idOrRegNum.toLowerCase() ||
        s.studentId?.toLowerCase() === idOrRegNum.toLowerCase() ||
        s.registerNumber.toLowerCase() === idOrRegNum.toLowerCase()
    );
  }

  public searchStudents(params: {
    query?: string;
    registerNumber?: string;
    busNumber?: string;
    routeNumber?: string;
    department?: string;
    year?: string;
    driverName?: string;
    attendanceStatus?: string;
  }): Student[] {
    let result = this.state.students;

    // Search query (matches student name or register number)
    if (params.query) {
      const q = params.query.toLowerCase().trim();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.registerNumber.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q)
      );
    }

    if (params.registerNumber) {
      const reg = params.registerNumber.toLowerCase().trim();
      result = result.filter((s) => s.registerNumber.toLowerCase().includes(reg));
    }

    if (params.busNumber && params.busNumber !== 'ALL') {
      const bus = params.busNumber.toLowerCase().trim();
      result = result.filter((s) => s.busNumber.toLowerCase() === bus);
    }

    if (params.routeNumber && params.routeNumber !== 'ALL') {
      const route = params.routeNumber.toLowerCase().trim();
      result = result.filter(
        (s) => (s.routeNumber && s.routeNumber.toLowerCase() === route) || s.routeId.toLowerCase() === route
      );
    }

    if (params.department && params.department !== 'ALL') {
      const dept = params.department.toLowerCase().trim();
      result = result.filter((s) => s.department.toLowerCase().includes(dept));
    }

    if (params.year && params.year !== 'ALL') {
      const yr = params.year.toLowerCase().trim();
      result = result.filter((s) => String(s.year).toLowerCase().includes(yr));
    }

    if (params.driverName && params.driverName !== 'ALL') {
      const drv = params.driverName.toLowerCase().trim();
      result = result.filter((s) => s.driverName && s.driverName.toLowerCase().includes(drv));
    }

    if (params.attendanceStatus && params.attendanceStatus !== 'ALL') {
      const att = params.attendanceStatus.toUpperCase();
      result = result.filter((s) => s.attendanceStatus === att);
    }

    return result;
  }

  public createStudent(studentData: Partial<Student>): Student {
    const studentNum = this.state.students.length + 1;
    const studentId = studentData.studentId || `STD-2024-${String(studentNum).padStart(3, '0')}`;
    const registerNumber = studentData.registerNumber || `310621104${String(studentNum).padStart(3, '0')}`;
    const busNumber = studentData.busNumber || 'BUS-01';

    const assignedBus = this.getBusById(busNumber) || this.state.buses[0];

    const student: Student = {
      id: `stud-${Date.now()}`,
      studentId,
      name: studentData.name || 'New Student',
      registerNumber,
      department: studentData.department || 'Computer Science & Engineering',
      year: studentData.year || 'I Year',
      section: studentData.section || 'CSE-A',
      email: studentData.email || `${registerNumber.toLowerCase()}@college.edu.in`,
      phone: studentData.phone || '+91 98401 00000',
      status: 'ACTIVE',
      assignedBusId: assignedBus.id,
      busNumber: assignedBus.busNumber,
      routeId: assignedBus.routeId || 'route-01',
      routeNumber: assignedBus.routeNumber || 'RT-01',
      routeName: assignedBus.routeName,
      boardingPointId: studentData.boardingPointId || 'bp-01-1',
      boardingPointName: studentData.boardingPointName || studentData.boardingPoint || 'Guindy Kathipara Junction',
      boardingPoint: studentData.boardingPointName || studentData.boardingPoint || 'Guindy Kathipara Junction',
      dropPoint: 'College Main Campus Terminal',
      driverId: assignedBus.driverId,
      driverName: assignedBus.driverName,
      driverPhone: assignedBus.driverPhone,
      busCapacity: assignedBus.capacity,
      attendanceStatus: 'NOT_MARKED',
      tripDate: TODAY_STR,
      tripTime: '07:15 AM',
      createdAt: new Date().toISOString(),
    };

    this.state.students.push(student);

    // Also add attendance record
    this.state.attendance.push({
      id: `att-${TODAY_STR}-${Date.now()}`,
      studentId,
      studentName: student.name,
      registerNumber,
      department: student.department,
      year: student.year,
      section: student.section,
      busNumber: student.busNumber,
      routeNumber: student.routeNumber || 'RT-01',
      boardingPoint: student.boardingPointName,
      status: 'NOT_MARKED',
      tripDate: TODAY_STR,
      tripTime: student.tripTime || '07:15 AM',
      tripType: 'MORNING_PICKUP',
      markedAt: '',
      markedBy: 'DRIVER',
    });

    this.saveToDisk();
    return student;
  }

  public updateStudent(studentIdOrReg: string, updates: Partial<Student>): Student | undefined {
    const student = this.getStudentById(studentIdOrReg);
    if (!student) return undefined;

    if (updates.name) student.name = updates.name;
    if (updates.department) student.department = updates.department;
    if (updates.year) student.year = updates.year;
    if (updates.section) student.section = updates.section;
    if (updates.phone) student.phone = updates.phone;
    if (updates.boardingPointName || updates.boardingPoint) {
      student.boardingPointName = updates.boardingPointName || updates.boardingPoint || student.boardingPointName;
      student.boardingPoint = student.boardingPointName;
    }

    if (updates.busNumber && updates.busNumber !== student.busNumber) {
      const newBus = this.getBusById(updates.busNumber);
      if (newBus) {
        student.busNumber = newBus.busNumber;
        student.assignedBusId = newBus.id;
        student.routeId = newBus.routeId || student.routeId;
        student.routeNumber = newBus.routeNumber || student.routeNumber;
        student.routeName = newBus.routeName || student.routeName;
        student.driverId = newBus.driverId;
        student.driverName = newBus.driverName;
        student.driverPhone = newBus.driverPhone;
        student.busCapacity = newBus.capacity;
      }
    }

    if (updates.attendanceStatus) {
      student.attendanceStatus = updates.attendanceStatus;
      // Sync attendance table
      const attRecord = this.state.attendance.find(
        (a) => (a.studentId === student.studentId || a.registerNumber === student.registerNumber) && a.tripDate === TODAY_STR
      );
      if (attRecord) {
        attRecord.status = updates.attendanceStatus;
        attRecord.markedAt = new Date().toISOString();
      }
    }

    this.saveToDisk();
    return student;
  }

  public deleteStudent(studentIdOrReg: string): boolean {
    const idx = this.state.students.findIndex(
      (s) =>
        s.id.toLowerCase() === studentIdOrReg.toLowerCase() ||
        s.studentId?.toLowerCase() === studentIdOrReg.toLowerCase() ||
        s.registerNumber.toLowerCase() === studentIdOrReg.toLowerCase()
    );
    if (idx === -1) return false;

    this.state.students.splice(idx, 1);
    this.saveToDisk();
    return true;
  }

  // --------------------------------------------------------------------------
  // DRIVERS CRUD
  // --------------------------------------------------------------------------
  public getDrivers(): Driver[] {
    return this.state.drivers;
  }

  public getDriverById(idOrDriverId: string): Driver | undefined {
    return this.state.drivers.find(
      (d) => d.id.toLowerCase() === idOrDriverId.toLowerCase() || d.driverId?.toLowerCase() === idOrDriverId.toLowerCase()
    );
  }

  // --------------------------------------------------------------------------
  // ATTENDANCE MANAGEMENT
  // --------------------------------------------------------------------------
  public getAttendanceRecords(filter?: { date?: string; busNumber?: string; status?: string }): AttendanceRecord[] {
    const targetDate = filter?.date || TODAY_STR;
    let records = this.state.attendance.filter((a) => a.tripDate === targetDate);

    if (filter?.busNumber && filter.busNumber !== 'ALL') {
      records = records.filter((a) => a.busNumber.toLowerCase() === filter.busNumber?.toLowerCase());
    }

    if (filter?.status && filter.status !== 'ALL') {
      records = records.filter((a) => a.status === filter.status);
    }

    return records;
  }

  public markAttendance(
    studentId: string,
    status: 'PRESENT' | 'ABSENT' | 'NOT_MARKED',
    date: string = TODAY_STR,
    markedBy: 'DRIVER' | 'ADMIN' | 'RFID_TAP' = 'DRIVER'
  ): AttendanceRecord | undefined {
    const student = this.getStudentById(studentId);
    if (!student) return undefined;

    // Update student's current status if today
    if (date === TODAY_STR) {
      student.attendanceStatus = status;
    }

    let record = this.state.attendance.find(
      (a) =>
        (a.studentId === student.studentId || a.registerNumber === student.registerNumber) &&
        a.tripDate === date
    );

    if (record) {
      record.status = status;
      record.markedAt = new Date().toISOString();
      record.markedBy = markedBy;
    } else {
      record = {
        id: `att-${date}-${Date.now()}`,
        studentId: student.studentId || student.id,
        studentName: student.name,
        registerNumber: student.registerNumber,
        department: student.department,
        year: student.year,
        section: student.section,
        busNumber: student.busNumber,
        routeNumber: student.routeNumber || 'RT-01',
        boardingPoint: student.boardingPointName,
        status,
        tripDate: date,
        tripTime: student.tripTime || '07:15 AM',
        tripType: 'MORNING_PICKUP',
        markedAt: new Date().toISOString(),
        markedBy,
      };
      this.state.attendance.push(record);
    }

    // Update trip counts
    const trip = this.state.trips.find((t) => t.busNumber === student.busNumber && t.tripDate === date);
    if (trip) {
      const busStudents = this.state.students.filter((s) => s.busNumber === student.busNumber);
      trip.presentCount = busStudents.filter((s) => s.attendanceStatus === 'PRESENT').length;
      trip.absentCount = busStudents.filter((s) => s.attendanceStatus === 'ABSENT').length;
    }

    this.saveToDisk();
    return record;
  }

  public bulkMarkAttendance(
    updates: Array<{ studentId: string; status: 'PRESENT' | 'ABSENT' }>,
    markedBy: 'DRIVER' | 'ADMIN' | 'RFID_TAP' = 'DRIVER'
  ): number {
    let count = 0;
    updates.forEach((u) => {
      const res = this.markAttendance(u.studentId, u.status, TODAY_STR, markedBy);
      if (res) count++;
    });
    return count;
  }

  public getAttendanceSummary(date: string = TODAY_STR, busNumber?: string): AttendanceSummary {
    let records = this.state.attendance.filter((a) => a.tripDate === date);
    if (busNumber && busNumber !== 'ALL') {
      records = records.filter((a) => a.busNumber.toLowerCase() === busNumber.toLowerCase());
    }

    const totalStudents = records.length || this.state.students.length;
    const presentCount = records.filter((a) => a.status === 'PRESENT').length;
    const absentCount = records.filter((a) => a.status === 'ABSENT').length;
    const notMarkedCount = records.filter((a) => a.status === 'NOT_MARKED').length;
    const attendancePercentage =
      totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0;

    return {
      totalStudents,
      presentCount,
      absentCount,
      notMarkedCount,
      attendancePercentage,
      date,
      tripType: 'MORNING_PICKUP',
    };
  }

  // --------------------------------------------------------------------------
  // TRIPS & DASHBOARD METRICS
  // --------------------------------------------------------------------------
  public getTodayTrips(): CollegeTrip[] {
    return this.state.trips.filter((t) => t.tripDate === TODAY_STR);
  }

  public getDashboardMetrics() {
    const totalBuses = this.state.buses.length;
    const activeBuses = this.state.buses.filter((b) => b.currentStatus !== 'COMPLETED' && b.currentStatus !== 'STOPPED').length;
    const totalStudents = this.state.students.length;
    const activeRoutes = this.state.routes.filter((r) => r.isActive).length;
    const totalDrivers = this.state.drivers.length;
    const todayTrips = this.getTodayTrips();
    const attendanceSummary = this.getAttendanceSummary(TODAY_STR);

    return {
      totalBuses,
      activeBuses,
      totalStudents,
      activeRoutes,
      totalDrivers,
      todayTripsCount: todayTrips.length,
      todayTrips,
      attendanceSummary,
      lastUpdated: this.state.lastUpdated,
    };
  }
}

// Export singleton instance
export const collegeDb = new CollegeDatabase();
