import { apiService } from '../api';

export interface AcademicSemester {
  id?: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface AcademicCalendar {
  id: string;
  academicYear: string;
  name: string;
  startDate: string;
  endDate: string;
  semesters: AcademicSemester[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const academicCalendarApi = {
  async getActiveAcademicCalendars(): Promise<AcademicCalendar[]> {
    try {
      const calendars = await apiService.get<AcademicCalendar[]>('/AcademicCalendar/active');
      return calendars || [];
    } catch {
      return [];
    }
  },

  async getAcademicCalendarByYear(academicYear: string): Promise<AcademicCalendar | null> {
    try {
      const calendar = await apiService.get<AcademicCalendar>(`/AcademicCalendar/year/${encodeURIComponent(academicYear)}`);
      return calendar || null;
    } catch {
      return null;
    }
  },

  async getActiveSemesters(): Promise<AcademicSemester[]> {
    try {
      const calendars = await this.getActiveAcademicCalendars();
      const allSemesters: AcademicSemester[] = [];
      
      calendars.forEach(calendar => {
        const activeSemesters = calendar.semesters.filter(s => s.isActive);
        allSemesters.push(...activeSemesters);
      });
      
      // Sort by start date
      return allSemesters.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    } catch {
      return [];
    }
  }
};

