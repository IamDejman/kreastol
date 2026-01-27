import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

async function logAuditAction(params: {
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
  action: string;
  context?: string;
}) {
  const { actorId, actorName, actorRole, action, context } = params;
  if (!actorId || !actorName || !actorRole) return;

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    actor_name: actorName,
    actor_role: actorRole,
    action,
    context: context ?? null,
  });

  if (error) {
    console.error("Failed to write audit log (blocked-rooms):", error);
  }
}

// GET /api/blocked-rooms - Get all blocked rooms (optionally filtered by room)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomNumberParam = searchParams.get("roomNumber");
    const roomNumberFilter = roomNumberParam ? Number(roomNumberParam) : null;

    const { data, error } = await supabase
      .from("blocked_rooms")
      .select("room_number, blocked_date, reason")
      .gte("blocked_date", new Date().toISOString().split("T")[0]); // Only future/present dates

    if (error) {
      console.error("Error fetching blocked rooms:", error);
      if (error.message?.includes("relation") || error.code === "42P01") {
        return NextResponse.json({ blockedRooms: {} }, { status: 200 });
      }
      return NextResponse.json(
        { error: `Failed to fetch blocked rooms: ${error.message}` },
        { status: 500 }
      );
    }

    type BlockedRow = {
      room_number: number;
      blocked_date: string;
      reason: string | null;
    };

    const rows: BlockedRow[] = (data || []) as BlockedRow[];

    // Optional filter by room number if query param is provided
    const filteredRows =
      roomNumberFilter != null
        ? rows.filter((row) => row.room_number === roomNumberFilter)
        : rows;

    const blockedRooms: Record<number, string[]> = {};
    const blockedRoomDetails: Record<
      number,
      { date: string; reason: string | null }[]
    > = {};

    filteredRows.forEach((row) => {
      const roomNum = row.room_number;
      const dateStr = row.blocked_date.split("T")[0]; // Extract date part

      if (!blockedRooms[roomNum]) {
        blockedRooms[roomNum] = [];
      }
      if (!blockedRooms[roomNum].includes(dateStr)) {
        blockedRooms[roomNum].push(dateStr);
      }

      if (!blockedRoomDetails[roomNum]) {
        blockedRoomDetails[roomNum] = [];
      }
      // Allow duplicate dates in details if reasons differ; consumer can decide how to handle
      blockedRoomDetails[roomNum].push({
        date: dateStr,
        reason: row.reason,
      });
    });

    // Sort dates for each room
    Object.keys(blockedRooms).forEach((roomNum) => {
      blockedRooms[Number(roomNum)].sort();
    });

    Object.keys(blockedRoomDetails).forEach((roomNum) => {
      blockedRoomDetails[Number(roomNum)].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    });

    return NextResponse.json({ blockedRooms, blockedRoomDetails });
  } catch (error: any) {
    console.error("Error in GET /api/blocked-rooms:", error);
    if (error?.message?.includes("Failed to fetch") || error?.message?.includes("ERR_NAME_NOT_RESOLVED")) {
      return NextResponse.json({ blockedRooms: {} }, { status: 200 });
    }
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/blocked-rooms - Block room dates
export async function POST(request: NextRequest) {
  try {
    const { roomNumber, dates, reason, actor } = await request.json();
    
    if (!roomNumber || !dates || !Array.isArray(dates)) {
      return NextResponse.json(
        { error: "roomNumber and dates array are required" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "Reason for blocking is required" },
        { status: 400 }
      );
    }

    const cleanedReason = reason.trim();

    const records = dates.map((date: string) => ({
      room_number: roomNumber,
      blocked_date: date,
      reason: cleanedReason,
    }));

    const { error } = await supabase.from("blocked_rooms").upsert(records, {
      onConflict: "room_number,blocked_date",
    });

    if (error) {
      console.error("Error blocking room:", error);
      return NextResponse.json(
        { error: `Failed to block room: ${error.message}` },
        { status: 500 }
      );
    }

    // Audit: staff blocked room dates
    if (actor) {
      const { id, name, role } = actor as {
        id?: string;
        name?: string;
        role?: UserRole;
      };
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      const rangeLabel =
        dates.length === 1 ? firstDate : `${firstDate} - ${lastDate}`;

      await logAuditAction({
        actorId: id,
        actorName: name,
        actorRole: role,
        action: "block_room_dates",
        context: `room ${roomNumber}: ${rangeLabel} (${dates.length} night${
          dates.length !== 1 ? "s" : ""
        }) - ${cleanedReason}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in POST /api/blocked-rooms:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/blocked-rooms - Unblock room dates
export async function DELETE(request: NextRequest) {
  try {
    const { roomNumber, dates, actor } = await request.json();
    
    if (!roomNumber || !dates || !Array.isArray(dates)) {
      return NextResponse.json(
        { error: "roomNumber and dates array are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("blocked_rooms")
      .delete()
      .eq("room_number", roomNumber)
      .in("blocked_date", dates);

    if (error) {
      console.error("Error unblocking room:", error);
      return NextResponse.json(
        { error: `Failed to unblock room: ${error.message}` },
        { status: 500 }
      );
    }

    // Audit: staff unblocked room dates
    if (actor) {
      const { id, name, role } = actor as {
        id?: string;
        name?: string;
        role?: UserRole;
      };

      await logAuditAction({
        actorId: id,
        actorName: name,
        actorRole: role,
        action: "unblock_room_dates",
        context: `room ${roomNumber}: ${dates.join(", ")}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/blocked-rooms:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
