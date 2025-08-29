// Mirrors EduBusWeb/src/types/index.ts auth-related types

export interface User {
    id: string;
    email: string;
    name: string;
    role: "Admin" | "Driver" | "Parent";
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}
  
export interface LoginCredentials {
    email: string;
    password: string;
}
  
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    fullName: string;
    role: "Admin" | "Driver" | "Parent";
    expiresAtUtc: string;
}
  
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
    };
}