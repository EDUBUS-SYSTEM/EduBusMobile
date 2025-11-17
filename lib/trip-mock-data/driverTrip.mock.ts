import { DriverTripDto } from '../trip/driverTrip.types';

const baseDate = new Date().toISOString().split('T')[0];

const makeIso = (date: string, time: string) => `${date}T${time}:00.000Z`;

// Định nghĩa các điểm đón/trả rõ ràng
// CHUYẾN ĐI (Morning): Đón học sinh ở nhà → Trả ở trường
const morningStops = [
  { name: 'Dragon Bridge', addr: '2 Thang 9 Street, Hai Chau, Da Nang', lat: 16.047, lng: 108.206 },
  { name: 'Ngu Hanh Son', addr: 'Ngu Hanh Son District, Da Nang', lat: 16.050, lng: 108.209 },
  { name: 'Son Tra Beach', addr: 'Son Tra District, Da Nang', lat: 16.053, lng: 108.212 },
  { name: 'FPT University', addr: 'FPT University, Da Nang', lat: 16.056, lng: 108.215 }, // Trường - điểm cuối
];

// CHUYẾN VỀ (Afternoon): Đón học sinh ở trường → Trả ở nhà (NGƯỢC LẠI)
const afternoonStops = [
  { name: 'FPT University', addr: 'FPT University, Da Nang', lat: 16.056, lng: 108.215 }, // Trường - điểm đầu
  { name: 'Son Tra Beach', addr: 'Son Tra District, Da Nang', lat: 16.053, lng: 108.212 },
  { name: 'Ngu Hanh Son', addr: 'Ngu Hanh Son District, Da Nang', lat: 16.050, lng: 108.209 },
  { name: 'Dragon Bridge', addr: '2 Thang 9 Street, Hai Chau, Da Nang', lat: 16.047, lng: 108.206 }, // Nhà - điểm cuối
];

// Tạo stops cho chuyến đi (Morning)
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

// Tạo stops cho chuyến về (Afternoon) - NGƯỢC LẠI
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
    totalStudents: 4 - idx, // Ngược lại: từ 4 xuống 1
    presentStudents: 0,
    absentStudents: 0,
  }));
};

// Thời gian chuyến đi (Morning - đưa đến trường)
const morningTripStartTime = '07:00';
const morningTripEndTime = '08:00';
// Thời gian chuyến về (Afternoon - đón từ trường)
const afternoonTripStartTime = '17:00';
const afternoonTripEndTime = '18:00';

export const mockDriverTrips: DriverTripDto[] = [
  // ============================================
  // CHUYẾN ĐI (MORNING) - Đưa học sinh đến trường
  // Stops: Nhà → Trường (Dragon Bridge → Ngu Hanh Son → Son Tra Beach → FPT University)
  // ============================================
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    routeId: '660e8400-e29b-41d4-a716-446655440001',
    serviceDate: `${baseDate}T00:00:00.000Z`,
    plannedStartAt: makeIso(baseDate, morningTripStartTime),
    plannedEndAt: makeIso(baseDate, morningTripEndTime),
    status: 'Scheduled',
    scheduleName: 'Morning Shift - Đưa đến trường',
    totalStops: 4,
    completedStops: 0,
    stops: createMorningStops(baseDate, '07'),
    isOverride: false,
    overrideReason: '',
    createdAt: `${baseDate}T00:00:00.000Z`,
    updatedAt: `${baseDate}T00:00:00.000Z`,
  },
  // ============================================
  // CHUYẾN VỀ (AFTERNOON) - Đón học sinh từ trường
  // Stops: Trường → Nhà (FPT University → Son Tra Beach → Ngu Hanh Son → Dragon Bridge)
  // NGƯỢC LẠI so với chuyến đi
  // ============================================
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    routeId: '660e8400-e29b-41d4-a716-446655440002',
    serviceDate: `${baseDate}T00:00:00.000Z`,
    plannedStartAt: makeIso(baseDate, afternoonTripStartTime),
    plannedEndAt: makeIso(baseDate, afternoonTripEndTime),
    status: 'Scheduled',
    scheduleName: 'Afternoon Shift - Đón từ trường',
    totalStops: 4,
    completedStops: 0,
    stops: createAfternoonStops(baseDate, '17'),
    isOverride: false,
    overrideReason: '',
    createdAt: `${baseDate}T00:00:00.000Z`,
    updatedAt: `${baseDate}T00:00:00.000Z`,
  },
];


