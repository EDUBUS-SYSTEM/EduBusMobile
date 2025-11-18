import { apiService } from "../api";
import type {
  CreateStudentAbsenceRequestPayload,
  StudentAbsenceRequestResponse,
} from "./studentAbsenceRequest.type";

const BASE_PATH = "/student-absence-requests";

export const studentAbsenceRequestApi = {
  getByParent: async (
    parentId: string,
  ): Promise<StudentAbsenceRequestResponse[]> => {
    return apiService.get<StudentAbsenceRequestResponse[]>(
      `${BASE_PATH}/parents/${parentId}`,
    );
  },
  getByStudent: async (
    studentId: string,
  ): Promise<StudentAbsenceRequestResponse[]> => {
    return apiService.get<StudentAbsenceRequestResponse[]>(
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


