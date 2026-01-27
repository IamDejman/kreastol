export type UserRole = "owner" | "receptionist";

export type UserStatus = "active" | "inactive";

export interface User {
  /**
   * Numeric id derived from the underlying UUID.
   * Used mainly for display and client-side logic.
   */
  id: number;
  /**
   * Raw UUID string from the database users.id column.
   * Needed for precise updates and audit logging.
   */
  dbId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
