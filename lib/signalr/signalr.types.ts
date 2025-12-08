export interface AttendanceUpdatedEvent {
  tripId: string;
  stopId: string;
  arrivedAt?: string | null;
  departedAt?: string | null;
  timestamp?: string; 
  attendance: {
    tripId: string;
    stopId: string;
    studentId: string;
    studentName: string;
    boardStatus?: string | null;
    alightStatus?: string | null;
    boardedAt?: string | null;
    alightedAt?: string | null;
    arrivedAt?: string | null;  
    departedAt?: string | null; 
    state?: string;
    timestamp?: string;
  };
}

export interface StopsReorderedEvent {
  tripId: string;
  stops: Array<{
    pickupPointId: string;
    sequenceOrder: number;
    address?: string;
    arrivedAt?: string | null;
    departedAt?: string | null;
  }>;
  timestamp: string;
}

export interface TripStatusChangedEvent {
  tripId: string;
  status: string;
  startTime?: string;
  endTime?: string;
  timestamp: string;
}
