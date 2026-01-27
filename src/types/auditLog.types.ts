import type { UserRole } from "./user.types";

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  context?: string | null;
  createdAt: string;
}

