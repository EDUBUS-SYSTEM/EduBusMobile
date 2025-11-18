import { apiService } from "../api";
import type {
  CreateStudentAbsenceRequestPayload,
  StudentAbsenceRequestListResponse,
  StudentAbsenceRequestResponse,
} from "./studentAbsenceRequest.type";

const BASE_PATH = "/student-absence-requests";

export const studentAbsenceRequestApi = {
  getByParent: async (): Promise<StudentAbsenceRequestListResponse> => {
    return apiService.get<StudentAbsenceRequestListResponse>(
      `${BASE_PATH}/parents/me`,
    );
  },
  getByStudent: async (
    studentId: string,
  ): Promise<StudentAbsenceRequestListResponse> => {
    return apiService.get<StudentAbsenceRequestListResponse>(
      `${BASE_PATH}/students/${studentId}`,
    );
  },
  create: async (
    payload: CreateStudentAbsenceRequestPayload,
  ): Promise<StudentAbsenceRequestResponse> => {
    return apiService.post<StudentAbsenceRequestResponse>(
      `${BASE_PATH}/parent`,
      payload,
    );
  },
};


