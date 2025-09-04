// Types cho children/student API
export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  parentId: string;
  classId?: string;
  className?: string;
  schoolName?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChildRequest {
  firstName: string;
  lastName: string;
  parentId: string;
  avatarUrl?: string;
  classId?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface UpdateChildRequest {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  classId?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface ChildrenListResponse {
  children: Child[];
  totalCount: number;
}
