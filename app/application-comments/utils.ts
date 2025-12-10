import type {
  AbsenceRequestStatus,
  RawAbsenceRequestStatus,
} from "@/lib/parent/studentAbsenceRequest.type";
import { formatDate, formatDateTime } from "@/utils/date.utils";

export const STATUS_STYLES: Record<
  AbsenceRequestStatus,
  { label: string; color: string; background: string }
> = {
  Pending: { label: "Pending", color: "#DB8903", background: "#FFF3D6" },
  Approved: { label: "Approved", color: "#0E9F6E", background: "#E7F6EF" },
  Rejected: { label: "Rejected", color: "#D03050", background: "#FFE5EA" },
};

const NUMERIC_STATUS_MAP: Record<number, AbsenceRequestStatus> = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
};

const UNKNOWN_STATUS_STYLE = {
  label: "Unknown",
  color: "#6B7280",
  background: "#E5E7EB",
};

const normalizeStatus = (
  status: RawAbsenceRequestStatus | null | undefined,
): AbsenceRequestStatus | undefined => {
  if (typeof status === "string" && STATUS_STYLES[status as AbsenceRequestStatus]) {
    return status as AbsenceRequestStatus;
  }

  if (typeof status === "number") {
    return NUMERIC_STATUS_MAP[status];
  }

  return undefined;
};

export const getStatusStyle = (
  status: RawAbsenceRequestStatus | null | undefined,
) => {
  const normalized = normalizeStatus(status);
  if (normalized) {
    return STATUS_STYLES[normalized];
  }

  return {
    ...UNKNOWN_STATUS_STYLE,
    ...(typeof status === "string" && status
      ? { label: status }
      : {}),
  };
};

export const formatDateLabel = (date: Date) => formatDate(date);

export const formatRangeLabel = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();

  if (sameDay) return formatDateLabel(startDate);

  return `${formatDateLabel(startDate)} -> ${formatDateLabel(endDate)}`;
};

export const formatSubmittedAt = (value: string) => formatDateTime(value);


