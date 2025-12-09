import { apiService } from '../api';
import { studentApi } from '../student/student.api';
import type { Child, CreateChildRequest, UpdateChildRequest } from './children.type';

export const childrenApi = {
  getChildrenByParent: async (parentId: string): Promise<Child[]> => {
    const response = await apiService.get<Child[]>(`/Student/parent/${parentId}`);
    return response;
  },

  getChildById: async (childId: string): Promise<Child> => {
    const response = await apiService.get<Child>(`/Student/${childId}`);
    return response;
  },

  createChild: async (childData: CreateChildRequest): Promise<Child> => {
    const response = await apiService.post<Child>('/Student', childData);
    return response;
  },

  updateChild: async (childId: string, childData: UpdateChildRequest): Promise<Child> => {
    const response = await apiService.put<Child>(`/Student/${childId}`, childData);
    return response;
  },

  formatChildForUI: (child: Child) => {
    // Generate avatar URL from studentImageId if available
    const avatarUrl = child.studentImageId
      ? studentApi.getPhotoUrl(child.id)
      : null;

    return {
      id: child.id,
      name: `${child.firstName} ${child.lastName}`,
      avatar: avatarUrl ? { uri: avatarUrl } : null,  // null instead of mock URL
      studentId: child.id,
      studentImageId: child.studentImageId,  // Pass through for StudentAvatar component
      className: child.className || "N/A",
      schoolName: child.schoolName || "FPT School",
      address: child.address || "N/A",
      status: "Being on bus",
      firstName: child.firstName,
      lastName: child.lastName,
      avatarUrl: avatarUrl,
    };
  }
};
