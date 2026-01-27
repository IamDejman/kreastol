import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

// GET /api/blocked-rooms - Get all blocked rooms
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("blocked_rooms")
      .select("room_number, blocked_date")
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

    const result: Record<number, string[]> = {};
    (data || []).forEach((row: { room_number: number; blocked_date: string }) => {
      const roomNum = row.room_number;
      const dateStr = row.blocked_date.split("T")[0]; // Extract date part
      if (!result[roomNum]) {
        result[roomNum] = [];
      }
      if (!result[roomNum].includes(dateStr)) {
        result[roomNum].push(dateStr);
      }
    });

    // Sort dates for each room
    Object.keys(result).forEach((roomNum) => {
      result[Number(roomNum)].sort();
    });

    return NextResponse.json({ blockedRooms: result });
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
    const { roomNumber, dates, reason } = await request.json();
    
    if (!roomNumber || !dates || !Array.isArray(dates)) {
      return NextResponse.json(
        { error: "roomNumber and dates array are required" },
        { status: 400 }
      );
    }

    const records = dates.map((date: string) => ({
      room_number: roomNumber,
      blocked_date: date,
      reason: reason || null,
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
    const { roomNumber, dates } = await request.json();
    
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/blocked-rooms:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
