// Mirrors EduBusWeb/src/types/index.ts auth-related types

export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin";
    avatar?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    fullName: string;
    role: "admin" | "user" | "moderator";
    token: string;
    refreshToken: string;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: string[];
  }