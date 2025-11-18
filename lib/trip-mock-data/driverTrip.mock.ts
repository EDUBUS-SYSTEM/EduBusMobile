import { DriverTripDto } from '../trip/driverTrip.types';

const baseDate = new Date().toISOString().split('T')[0];

const makeIso = (date: string, time: string) => `${date}T${time}:00.000Z`;

// Define clear pickup/drop-off locations
// MORNING TRIP: Pick students up at home → Drop at school
const morningStops = [
  { name: 'Dragon Bridge', addr: '2 September Street, Central District, Da Nang', lat: 16.047, lng: 108.206 },
  { name: 'Marble Mountains', addr: 'Marble Mountains District, Da Nang', lat: 16.050, lng: 108.209 },
  { name: 'Coastal Park', addr: 'Coastal District, Da Nang', lat: 16.053, lng: 108.212 },
  { name: 'FPT University', addr: 'FPT University, Da Nang', lat: 16.056, lng: 108.215 }, // School - final stop
];

// AFTERNOON TRIP: Pick students up at school → Drop at home (reverse)
const afternoonStops = [
  { name: 'FPT University', addr: 'FPT University, Da Nang', lat: 16.056, lng: 108.215 }, // School - starting point
  { name: 'Coastal Park', addr: 'Coastal District, Da Nang', lat: 16.053, lng: 108.212 },
  { name: 'Marble Mountains', addr: 'Marble Mountains District, Da Nang', lat: 16.050, lng: 108.209 },
  { name: 'Dragon Bridge', addr: '2 September Street, Central District, Da Nang', lat: 16.047, lng: 108.206 }, // Home - final stop
];

// Build stops for the morning trip
const createMorningStops = (date: string, startHour: string): DriverTripDto['stops'] => {
  const times = ['05', '20', '35', '55'];
  const stopGuids = [
    'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789',
    'b2c3d4e5-f6a7-4890-b123-c4d5e6f7a890',
    'c3d4e5f6-a7b8-4901-c234-d5e6f7a8b901',
    'd4e5f6a7-b8c9-4012-d345-e6f7a8b9c012',
  ];
  return times.map((mm, idx) => ({
    sequenceOrder: idx + 1,
    pickupPointId: stopGuids[idx],
    pickupPointName: morningStops[idx].name,
    plannedAt: makeIso(date, `${startHour}:${mm}`),
    address: morningStops[idx].addr,
    latitude: morningStops[idx].lat,
    longitude: morningStops[idx].lng,
    totalStudents: 3 + idx,
    presentStudents: 0,
    absentStudents: 0,
  }));
};

// Build stops for the afternoon trip (reverse order)
const createAfternoonStops = (date: string, startHour: string): DriverTripDto['stops'] => {
  const times = ['05', '20', '35', '55'];
  const stopGuids = [
    'd4e5f6a7-b8c9-4012-d345-e6f7a8b9c012',
    'c3d4e5f6-a7b8-4901-c234-d5e6f7a8b901',
    'b2c3d4e5-f6a7-4890-b123-c4d5e6f7a890',
    'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789',
  ];
  return times.map((mm, idx) => ({
    sequenceOrder: idx + 1,
    pickupPointId: stopGuids[idx],
    pickupPointName: afternoonStops[idx].name,
    plannedAt: makeIso(date, `${startHour}:${mm}`),
    address: afternoonStops[idx].addr,
    latitude: afternoonStops[idx].lat,
    longitude: afternoonStops[idx].lng,
    totalStudents: 4 - idx, // Reverse order: from 4 down to 1
    presentStudents: 0,
    absentStudents: 0,
  }));
};

// Time window for the morning trip (drop at school)
const morningTripStartTime = '07:00';
const morningTripEndTime = '08:00';
// Time window for the afternoon trip (pick up from school)
const afternoonTripStartTime = '17:00';
const afternoonTripEndTime = '18:00';

export const mockDriverTrips: DriverTripDto[] = [
  // ============================================
  // MORNING TRIP - Bringing students to school
  // Stops: Home → School (Dragon Bridge → Marble Mountains → Coastal Park → FPT University)
  // ============================================
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    routeId: '660e8400-e29b-41d4-a716-446655440001',
    serviceDate: `${baseDate}T00:00:00.000Z`,
    plannedStartAt: makeIso(baseDate, morningTripStartTime),
    plannedEndAt: makeIso(baseDate, morningTripEndTime),
    status: 'Scheduled',
    scheduleName: 'Morning Shift - Drop off at school',
    totalStops: 4,
    completedStops: 0,
    stops: createMorningStops(baseDate, '07'),
    isOverride: false,
    overrideReason: '',
    createdAt: `${baseDate}T00:00:00.000Z`,
    updatedAt: `${baseDate}T00:00:00.000Z`,
  },
  // ============================================
  // AFTERNOON TRIP - Bringing students back home
  // Stops: School → Home (FPT University → Coastal Park → Marble Mountains → Dragon Bridge)
  // Reverse order versus the morning trip
  // ============================================
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    routeId: '660e8400-e29b-41d4-a716-446655440002',
    serviceDate: `${baseDate}T00:00:00.000Z`,
    plannedStartAt: makeIso(baseDate, afternoonTripStartTime),
    plannedEndAt: makeIso(baseDate, afternoonTripEndTime),
    status: 'Scheduled',
    scheduleName: 'Afternoon Shift - Pick up from school',
    totalStops: 4,
    completedStops: 0,
    stops: createAfternoonStops(baseDate, '17'),
    isOverride: false,
    overrideReason: '',
    createdAt: `${baseDate}T00:00:00.000Z`,
    updatedAt: `${baseDate}T00:00:00.000Z`,
  },
];


