export type UserRole = "owner" | "receptionist";

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
