export interface AttendanceUpdatedEvent {
  tripId: string;
  stopId: string;
  // Optional stop-level timing info from backend
  arrivedAt?: string | null;
  departedAt?: string | null;
  timestamp?: string; // overall event timestamp
  attendance: {
    tripId: string;
    stopId: string;
    studentId: string;
    studentName: string;
    boardStatus?: string | null;
    alightStatus?: string | null;
    boardedAt?: string | null;
    alightedAt?: string | null;
    arrivedAt?: string | null;  // Stop-level timing in attendance object
    departedAt?: string | null; // Stop-level timing in attendance object
    state?: string;
    timestamp?: string;
  };
}