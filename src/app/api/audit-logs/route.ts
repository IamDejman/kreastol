import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import type { AuditLog, UserRole } from "@/types";

interface DbAuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  context: string | null;
  created_at: string;
}

function dbAuditLogToAuditLog(row: DbAuditLog): AuditLog {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    action: row.action,
    context: row.context,
    createdAt: row.created_at,
  };
}

// POST /api/audit-logs - Create a new audit log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      actorId,
      actorName,
      actorRole,
      action,
      context,
    }: {
      actorId: string;
      actorName: string;
      actorRole: UserRole;
      action: string;
      context?: string;
    } = body;

    if (!actorId || !actorName || !actorRole || !action) {
      return NextResponse.json(
        { error: "actorId, actorName, actorRole, and action are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        actor_id: actorId,
        actor_name: actorName,
        actor_role: actorRole,
        action,
        context: context ?? null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating audit log:", error);
      return NextResponse.json(
        { error: `Failed to create audit log: ${error.message}` },
        { status: 500 }
      );
    }

    const log = dbAuditLogToAuditLog(data as DbAuditLog);
    return NextResponse.json({ log }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/audit-logs:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/audit-logs - List audit logs with basic filters
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const role = url.searchParams.get("role") as UserRole | null;
    const actorId = url.searchParams.get("actorId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const search = url.searchParams.get("q");
    const page = parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
    const pageSize =
      parseInt(url.searchParams.get("pageSize") ?? "20", 10) || 20;

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (role) {
      query = query.eq("actor_role", role);
    }

    if (actorId) {
      query = query.eq("actor_id", actorId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    if (search) {
      const like = `%${search}%`;
      query = query.or(
        `actor_name.ilike.${like},action.ilike.${like},context.ilike.${like}`
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json(
        { error: `Failed to fetch audit logs: ${error.message}` },
        { status: 500 }
      );
    }

    const logs = (data || []).map((row) =>
      dbAuditLogToAuditLog(row as DbAuditLog)
    );

    return NextResponse.json({
      logs,
      total: count ?? logs.length,
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error("Error in GET /api/audit-logs:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

