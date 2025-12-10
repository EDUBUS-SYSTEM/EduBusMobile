import { apiService } from '../api';
import {
  CreateTripIncidentPayload,
  TripIncident,
  TripIncidentListResponse,
} from './tripIncident.types';

const BASE_URL = '/trip-incidents';

const reasonToCode: Record<CreateTripIncidentPayload['reason'], number> = {
  VehicleIssue: 0,
  StudentIssue: 1,
  RouteBlocked: 2,
  Weather: 3,
  SafetyConcern: 4,
  IoTDeviceIssue: 5,
  Other: 6,
};

const codeToReason: Record<number, CreateTripIncidentPayload['reason']> = {
  0: 'VehicleIssue',
  1: 'StudentIssue',
  2: 'RouteBlocked',
  3: 'Weather',
  4: 'SafetyConcern',
  5: 'IoTDeviceIssue',
  6: 'Other',
};

const normalizeReasonFromServer = (reason: number | string): CreateTripIncidentPayload['reason'] => {
  if (typeof reason === 'number') {
    return codeToReason[reason] ?? 'Other';
  }
  return (reason as CreateTripIncidentPayload['reason']) ?? 'Other';
};

const statusCodeToText: Record<number, TripIncident['status']> = {
  0: 'Open',
  1: 'Acknowledged',
  2: 'Resolved',
};

const normalizeStatusFromServer = (status: number | string): TripIncident['status'] => {
  if (typeof status === 'number') {
    return statusCodeToText[status] ?? 'Open';
  }
  return (status as TripIncident['status']) ?? 'Open';
};

const extractFirstModelError = (errors: any) => {
  if (!errors || typeof errors !== 'object') return null;
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;
  const val = errors[firstKey];
  if (Array.isArray(val) && val.length > 0) return String(val[0]);
  if (typeof val === 'string') return val;
  return null;
};

const buildErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data;
  const modelError = extractFirstModelError(data?.errors);
  if (modelError) return modelError;

  const message =
    data?.message ||
    data?.error ||
    error?.message ||
    fallback;
  return message;
};

export const tripIncidentApi = {
  create: async (
    tripId: string,
    payload: CreateTripIncidentPayload
  ): Promise<TripIncident> => {
    try {
      const body: CreateTripIncidentPayload = {
        reason: payload.reason,
        title: payload.title ?? undefined,
        description: payload.description ?? undefined,
      };
      const serverBody = {
        ...body,
        reason: reasonToCode[body.reason],
      };
      const created = await apiService.post<TripIncident>(
        `${BASE_URL}/trips/${tripId}`,
        serverBody
      );
      return {
        ...created,
        reason: normalizeReasonFromServer(created.reason as any),
        status: normalizeStatusFromServer(created.status as any),
      };
    } catch (error: any) {
      throw new Error(
        buildErrorMessage(
          error,
          'Unable to submit the incident report. Please try again.'
        )
      );
    }
  },

  getByTrip: async (
    tripId: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<TripIncidentListResponse> => {
    try {
      const response = await apiService.get<TripIncidentListResponse>(
        `${BASE_URL}/trips/${tripId}`,
        { page, perPage }
      );
      return {
        ...response,
        data: (response.data || []).map((item) => ({
          ...item,
          reason: normalizeReasonFromServer(item.reason as any),
          status: normalizeStatusFromServer(item.status as any),
        })),
      };
    } catch (error: any) {
      throw new Error(
        buildErrorMessage(
          error,
          'Unable to load incident reports. Please try again.'
        )
      );
    }
  },

  getById: async (incidentId: string): Promise<TripIncident> => {
    try {
      const incident = await apiService.get<TripIncident>(`${BASE_URL}/${incidentId}`);
      return {
        ...incident,
        reason: normalizeReasonFromServer(incident.reason as any),
        status: normalizeStatusFromServer(incident.status as any),
      };
    } catch (error: any) {
      throw new Error(
        buildErrorMessage(
          error,
          'Unable to load the incident report. Please try again.'
        )
      );
    }
  },
};

