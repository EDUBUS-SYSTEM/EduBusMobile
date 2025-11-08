import { apiService } from '../api';

export interface AcademicSemesterDto {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface AcademicCalendarDto {
  id: string;
  academicYear: string;
  name: string;
  startDate: string;
  endDate: string;
  semesters: AcademicSemesterDto[];
  holidays: any[];
  schoolDays: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const academicCalendarApi = {
  async getActiveAcademicCalendars(): Promise<AcademicCalendarDto[]> {
    try {
      const calendars = await apiService.get<AcademicCalendarDto[]>('/AcademicCalendar/active');
      return calendars || [];
    } catch {
      return [];
    }
  },

  async getAcademicCalendarByYear(academicYear: string): Promise<AcademicCalendarDto | null> {
    try {
      const calendar = await apiService.get<AcademicCalendarDto>(`/AcademicCalendar/year/${encodeURIComponent(academicYear)}`);
      return calendar || null;
    } catch {
      return null;
    }
  },

  async getActiveSemesters(academicYear?: string): Promise<AcademicSemesterDto[]> {
    try {
      let calendars: AcademicCalendarDto[];
      
      if (academicYear) {
        const calendar = await this.getAcademicCalendarByYear(academicYear);
        calendars = calendar ? [calendar] : [];
      } else {
        calendars = await this.getActiveAcademicCalendars();
      }

      const semesters: AcademicSemesterDto[] = [];
      calendars.forEach(calendar => {
        const activeSemesters = calendar.semesters.filter(s => s.isActive);
        semesters.push(...activeSemesters);
      });

      return semesters;
    } catch {
      return [];
    }
  },
};

