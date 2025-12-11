import { apiService } from '../api';

export interface EnrollmentSemesterSettingsDto {
  id: string;
  semesterName: string;
  semesterCode: string;
  academicYear: string;
  semesterStartDate: string;
  semesterEndDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  isActive: boolean;
  description?: string;
}

export const enrollmentSemesterSettingsApi = {
  async getActive(): Promise<EnrollmentSemesterSettingsDto | null> {
    try {
      const result = await apiService.get<EnrollmentSemesterSettingsDto>('/EnrollmentSemesterSettings/active');
      return result ?? null;
    } catch {
      return null;
    }
  },

  async getActiveListForParent(): Promise<EnrollmentSemesterSettingsDto[]> {
    try {
      const result = await apiService.get<EnrollmentSemesterSettingsDto[]>('/EnrollmentSemesterSettings/active-list-parent');
      return result ?? [];
    } catch {
      return [];
    }
  },
};

