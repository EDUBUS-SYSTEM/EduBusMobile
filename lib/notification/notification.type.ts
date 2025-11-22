export enum NotificationType {
  DriverLeaveRequest = 1,
  ReplacementSuggestion = 2,
  LeaveApproval = 3,
  ConflictDetected = 4,
  ReplacementAccepted = 5,
  ReplacementRejected = 6,
  SystemAlert = 7,
  MaintenanceReminder = 8,
  ScheduleChange = 9,
  EmergencyNotification = 10,
  TripInfo = 11,
}

export const getNotificationTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.DriverLeaveRequest:
      return 'Driver Leave Request';
    case NotificationType.ReplacementSuggestion:
      return 'Replacement Suggestion';
    case NotificationType.LeaveApproval:
      return 'Leave Approval';
    case NotificationType.ConflictDetected:
      return 'Conflict Detected';
    case NotificationType.ReplacementAccepted:
      return 'Replacement Accepted';
    case NotificationType.ReplacementRejected:
      return 'Replacement Rejected';
    case NotificationType.SystemAlert:
      return 'System Alert';
    case NotificationType.MaintenanceReminder:
      return 'Maintenance Reminder';
    case NotificationType.ScheduleChange:
      return 'Schedule Change';
    case NotificationType.EmergencyNotification:
      return 'Emergency Notification';
    case NotificationType.TripInfo:
      return 'Trip Information';
    default:
      return 'Notification';
  }
};

export const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.EmergencyNotification:
      return 'warning';
    case NotificationType.TripInfo:
      return 'bus';
    case NotificationType.ScheduleChange:
      return 'calendar';
    case NotificationType.SystemAlert:
      return 'information-circle';
    case NotificationType.MaintenanceReminder:
      return 'construct';
    case NotificationType.DriverLeaveRequest:
    case NotificationType.LeaveApproval:
      return 'person';
    default:
      return 'notifications';
  }
};