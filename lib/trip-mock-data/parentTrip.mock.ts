import type { ParentTripDto } from '../trip/parentTrip.types';
const baseDate = new Date().toISOString().split('T')[0];

const makeIso = (date: string, time: string) => `${date}T${time}:00.000Z`;

// Calculate future time to allow starting trip
const getFutureTime = (minutesFromNow: number): string => {
  const now = new Date();
  const future = new Date(now.getTime() + minutesFromNow * 60 * 1000);
  const hours = String(future.getHours()).padStart(2, '0');
  const mins = String(future.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
};

// Mock children data với địa điểm đón/trả rõ ràng
// CHỈ CÓ 2 HỌC SINH → 2 × 2 = 4 CHUYẾN (mỗi học sinh: 1 chuyến đi + 1 chuyến về)
const mockChildren = [
  {
    id: 'child-001',
    name: 'Tran Minh Hieu',
    avatar: 'https://cdn.vietnam.vn/wp-content/uploads/2024/08/HIEUTHUHAI-khien-ca-Hieu-thu-nhat-cung-noi-tieng.jpg',
    className: '1B',
    // Địa điểm đón/trả của học sinh này
    homePickupPoint: {
      name: 'Dragon Bridge',
      address: '2 Thang 9 Street, Hai Chau, Da Nang',
    },
    schoolDropoffPoint: {
      name: 'FPT University',
      address: 'FPT University, Da Nang',
    },
  },
  {
    id: 'child-002',
    name: 'Tran Quang Huy',
    avatar: 'https://www.elle.vn/wp-content/uploads/2024/01/21/567142/HIEUTHUHAI-3-scaled.jpg',
    className: '2A',
    // Địa điểm đón/trả của học sinh này
    homePickupPoint: {
      name: 'Ngu Hanh Son',
      address: 'Ngu Hanh Son District, Da Nang',
    },
    schoolDropoffPoint: {
      name: 'FPT University',
      address: 'FPT University, Da Nang',
    },
  },
];

// Calculate start and end times for trips
// Chuyến đi (Morning - đưa đến trường): 7:00 - 8:00
const morningTripStartTime = '07:00';
const morningTripEndTime = '08:00';
// Chuyến về (Afternoon - đón từ trường): 17:00 - 18:00
const afternoonTripStartTime = '17:00';
const afternoonTripEndTime = '18:00';

// Extract hour from time
const getHour = (timeStr: string) => timeStr.split(':')[0];

export const mockParentTrips: ParentTripDto[] = [
  // ============================================
  // CHUYẾN ĐI (MORNING) - Đưa học sinh đến trường
  // Đón ở nhà → Trả ở trường
  // ============================================
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    routeId: '660e8400-e29b-41d4-a716-446655440001',
    serviceDate: `${baseDate}T00:00:00.000Z`,
    plannedStartAt: makeIso(baseDate, morningTripStartTime),
    plannedEndAt: makeIso(baseDate, morningTripEndTime),
    status: 'InProgress', // CHUYẾN ĐANG DIỄN RA - CÓ THỂ TRACKING
    scheduleName: 'Morning Shift - Đưa đến trường',
    childId: mockChildren[0].id,
    childName: mockChildren[0].name,
    childAvatar: mockChildren[0].avatar,
    childClassName: mockChildren[0].className,
    // CHUYẾN ĐI: Đón ở nhà (Dragon Bridge) - ĐÃ ĐẾN VÀ ĐÃ RỜI
    pickupStop: {
      sequenceOrder: 1,
      pickupPointName: mockChildren[0].homePickupPoint.name,
      address: mockChildren[0].homePickupPoint.address,
      plannedAt: makeIso(baseDate, '07:05'),
      arrivedAt: makeIso(baseDate, '07:08'), // Đã đến điểm đón
      departedAt: makeIso(baseDate, '07:10'), // Đã rời điểm đón
    },
    // CHUYẾN ĐI: Trả ở trường (FPT University) - ĐANG TRÊN ĐƯỜNG ĐẾN
    dropoffStop: {
      sequenceOrder: 4,
      pickupPointName: mockChildren[0].schoolDropoffPoint.name,
      address: mockChildren[0].schoolDropoffPoint.address,
      plannedAt: makeIso(baseDate, '07:55'),
    },
    totalStops: 4,
    completedStops: 1, // Đã hoàn thành 1 điểm dừng (pickup)
    createdAt: `${baseDate}T00:00:00.000Z`,
    updatedAt: `${baseDate}T00:00:00.000Z`,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    routeId: '660e8400-e29b-41d4-a716-446655440002',
    serviceDate: `${baseDate}T00:00:00.000Z`,
    plannedStartAt: makeIso(baseDate, morningTripStartTime),
    plannedEndAt: makeIso(baseDate, morningTripEndTime),
    status: 'Scheduled',
    scheduleName: 'Morning Shift - Đưa đến trường',
    childId: mockChildren[1].id,
    childName: mockChildren[1].name,
    childAvatar: mockChildren[1].avatar,
    childClassName: mockChildren[1].className,
    // CHUYẾN ĐI: Đón ở nhà (Ngu Hanh Son)
    pickupStop: {
      sequenceOrder: 1,
      pickupPointName: mockChildren[1].homePickupPoint.name,
      address: mockChildren[1].homePickupPoint.address,
      plannedAt: makeIso(baseDate, '07:10'),
    },
    // CHUYẾN ĐI: Trả ở trường (FPT University)
    dropoffStop: {
      sequenceOrder: 3,
      pickupPointName: mockChildren[1].schoolDropoffPoint.name,
      address: mockChildren[1].schoolDropoffPoint.address,
      plannedAt: makeIso(baseDate, '07:50'),
    },
    totalStops: 4,
    completedStops: 0,
    createdAt: `${baseDate}T00:00:00.000Z`,
    updatedAt: `${baseDate}T00:00:00.000Z`,
  },
  // ============================================
  // CHUYẾN VỀ (AFTERNOON) - Đón học sinh từ trường
  // Đón ở trường → Trả ở nhà (NGƯỢC LẠI chuyến đi)
  // ============================================
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    routeId: '660e8400-e29b-41d4-a716-446655440004',
    serviceDate: `${baseDate}T00:00:00.000Z`,
    plannedStartAt: makeIso(baseDate, afternoonTripStartTime),
    plannedEndAt: makeIso(baseDate, afternoonTripEndTime),
    status: 'Scheduled',
    scheduleName: 'Afternoon Shift - Đón từ trường',
    childId: mockChildren[0].id,
    childName: mockChildren[0].name,
    childAvatar: mockChildren[0].avatar,
    childClassName: mockChildren[0].className,
    // CHUYẾN VỀ: Đón ở trường (FPT University) - NGƯỢC LẠI chuyến đi
    pickupStop: {
      sequenceOrder: 1,
      pickupPointName: mockChildren[0].schoolDropoffPoint.name,
      address: mockChildren[0].schoolDropoffPoint.address,
      plannedAt: makeIso(baseDate, '17:05'),
    },
    // CHUYẾN VỀ: Trả ở nhà (Dragon Bridge) - NGƯỢC LẠI chuyến đi
    dropoffStop: {
      sequenceOrder: 4,
      pickupPointName: mockChildren[0].homePickupPoint.name,
      address: mockChildren[0].homePickupPoint.address,
      plannedAt: makeIso(baseDate, '17:55'),
    },
    totalStops: 4,
    completedStops: 0,
    createdAt: `${baseDate}T00:00:00.000Z`,
    updatedAt: `${baseDate}T00:00:00.000Z`,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    routeId: '660e8400-e29b-41d4-a716-446655440005',
    serviceDate: `${baseDate}T00:00:00.000Z`,
    plannedStartAt: makeIso(baseDate, afternoonTripStartTime),
    plannedEndAt: makeIso(baseDate, afternoonTripEndTime),
    status: 'Scheduled',
    scheduleName: 'Afternoon Shift - Đón từ trường',
    childId: mockChildren[1].id,
    childName: mockChildren[1].name,
    childAvatar: mockChildren[1].avatar,
    childClassName: mockChildren[1].className,
    // CHUYẾN VỀ: Đón ở trường (FPT University) - NGƯỢC LẠI chuyến đi
    pickupStop: {
      sequenceOrder: 1,
      pickupPointName: mockChildren[1].schoolDropoffPoint.name,
      address: mockChildren[1].schoolDropoffPoint.address,
      plannedAt: makeIso(baseDate, '17:10'),
    },
    // CHUYẾN VỀ: Trả ở nhà (Ngu Hanh Son) - NGƯỢC LẠI chuyến đi
    dropoffStop: {
      sequenceOrder: 3,
      pickupPointName: mockChildren[1].homePickupPoint.name,
      address: mockChildren[1].homePickupPoint.address,
      plannedAt: makeIso(baseDate, '17:50'),
    },
    totalStops: 4,
    completedStops: 0,
    createdAt: `${baseDate}T00:00:00.000Z`,
    updatedAt: `${baseDate}T00:00:00.000Z`,
  },
];

