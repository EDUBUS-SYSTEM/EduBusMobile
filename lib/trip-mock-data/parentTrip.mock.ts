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

// Mock children data with clear pickup/drop-off locations
// ONLY 2 STUDENTS -> 2 x 2 = 4 TRIPS (each student: 1 outbound + 1 inbound)
const mockChildren = [
  {
    id: 'child-001',
    name: 'Evan Miles',
    avatar: 'https://cdn.vietnam.vn/wp-content/uploads/2024/08/HIEUTHUHAI-khien-ca-Hieu-thu-nhat-cung-noi-tieng.jpg',
    className: '1B',
    // Pickup/drop-off locations for this student
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
    name: 'Lily Evans',
    avatar: 'https://www.elle.vn/wp-content/uploads/2024/01/21/567142/HIEUTHUHAI-3-scaled.jpg',
    className: '2A',
    // Pickup/drop-off locations for this student
    homePickupPoint: {
      name: 'Marble Mountains',
      address: 'Marble Mountains District, Da Nang',
    },
    schoolDropoffPoint: {
      name: 'FPT University',
      address: 'FPT University, Da Nang',
    },
  },
];

// Calculate start and end times for trips
// Outbound trip (Morning - drop off at school): 7:00 - 8:00
const morningTripStartTime = '07:00';
const morningTripEndTime = '08:00';
// Inbound trip (Afternoon - pick up from school): 17:00 - 18:00
const afternoonTripStartTime = '17:00';
const afternoonTripEndTime = '18:00';

// Extract hour from time
const getHour = (timeStr: string) => timeStr.split(':')[0];

export const mockParentTrips: ParentTripDto[] = [
  // ============================================
  // OUTBOUND (MORNING) - Students go to school
  // Pickup at home → Drop at school
  // ============================================
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    routeId: '660e8400-e29b-41d4-a716-446655440001',
    serviceDate: `${baseDate}T00:00:00.000Z`,
    plannedStartAt: makeIso(baseDate, morningTripStartTime),
    plannedEndAt: makeIso(baseDate, morningTripEndTime),
    status: 'InProgress', // Trip is in progress - can track
    scheduleName: 'Morning Shift - Drop off at school',
    childId: mockChildren[0].id,
    childName: mockChildren[0].name,
    childAvatar: mockChildren[0].avatar,
    childClassName: mockChildren[0].className,
    // OUTBOUND: Pickup at home (Dragon Bridge) - already visited
    pickupStop: {
      sequenceOrder: 1,
      pickupPointName: mockChildren[0].homePickupPoint.name,
      address: mockChildren[0].homePickupPoint.address,
      plannedAt: makeIso(baseDate, '07:05'),
      arrivedAt: makeIso(baseDate, '07:08'), // Arrived at pickup
      departedAt: makeIso(baseDate, '07:10'), // Departed from pickup
    },
    // OUTBOUND: Drop at school (FPT University) - still en route
    dropoffStop: {
      sequenceOrder: 4,
      pickupPointName: mockChildren[0].schoolDropoffPoint.name,
      address: mockChildren[0].schoolDropoffPoint.address,
      plannedAt: makeIso(baseDate, '07:55'),
    },
    totalStops: 4,
    completedStops: 1, // Finished 1 stop (pickup)
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
    scheduleName: 'Morning Shift - Drop off at school',
    childId: mockChildren[1].id,
    childName: mockChildren[1].name,
    childAvatar: mockChildren[1].avatar,
    childClassName: mockChildren[1].className,
    // OUTBOUND: Pickup at home (Marble Mountains)
    pickupStop: {
      sequenceOrder: 1,
      pickupPointName: mockChildren[1].homePickupPoint.name,
      address: mockChildren[1].homePickupPoint.address,
      plannedAt: makeIso(baseDate, '07:10'),
    },
    // OUTBOUND: Drop at school (FPT University)
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
  // RETURN (AFTERNOON) - Students leave school
  // Pickup at school → Drop at home (reverse direction)
  // ============================================
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    routeId: '660e8400-e29b-41d4-a716-446655440004',
    serviceDate: `${baseDate}T00:00:00.000Z`,
    plannedStartAt: makeIso(baseDate, afternoonTripStartTime),
    plannedEndAt: makeIso(baseDate, afternoonTripEndTime),
    status: 'Scheduled',
    scheduleName: 'Afternoon Shift - Pick up from school',
    childId: mockChildren[0].id,
    childName: mockChildren[0].name,
    childAvatar: mockChildren[0].avatar,
    childClassName: mockChildren[0].className,
    // RETURN: Pickup at school (FPT University) - reverse route
    pickupStop: {
      sequenceOrder: 1,
      pickupPointName: mockChildren[0].schoolDropoffPoint.name,
      address: mockChildren[0].schoolDropoffPoint.address,
      plannedAt: makeIso(baseDate, '17:05'),
    },
    // RETURN: Drop at home (Dragon Bridge) - reverse route
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
    scheduleName: 'Afternoon Shift - Pick up from school',
    childId: mockChildren[1].id,
    childName: mockChildren[1].name,
    childAvatar: mockChildren[1].avatar,
    childClassName: mockChildren[1].className,
    // RETURN: Pickup at school (FPT University) - reverse route
    pickupStop: {
      sequenceOrder: 1,
      pickupPointName: mockChildren[1].schoolDropoffPoint.name,
      address: mockChildren[1].schoolDropoffPoint.address,
      plannedAt: makeIso(baseDate, '17:10'),
    },
    // RETURN: Drop at home (Marble Mountains) - reverse route
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

