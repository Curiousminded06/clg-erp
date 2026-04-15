export type Role = 'admin' | 'faculty' | 'student';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
  role: Role;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}
