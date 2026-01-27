"use client";

import { useMemo, useState, useEffect } from "react";
import { useBookings } from "@/hooks/useBookings";
import { SearchBar } from "@/components/dashboard/shared/SearchBar";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { Pagination } from "@/components/ui/Pagination";
import type { Booking } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { supabaseService } from "@/lib/services/supabaseService";

interface GuestSummary {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  totalBookings: number;
  totalNights: number;
  totalRevenue: number;
  firstStay: string;
  lastStay: string;
}

function buildGuestSummaries(bookings: Booking[]): GuestSummary[] {
  const map = new Map<string, GuestSummary>();

  for (const b of bookings) {
    // Treat guests with the same email but different names as separate guests.
    // This matches the business requirement where name+email uniquely identify a guest.
    const key = `${b.guestEmail.toLowerCase()}|${b.guestName
      .trim()
      .toLowerCase()}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        guestName: b.guestName,
        guestEmail: b.guestEmail,
        guestPhone: b.guestPhone,
        totalBookings: 1,
        totalNights: b.nights,
        totalRevenue: b.totalAmount,
        firstStay: b.checkIn,
        lastStay: b.checkOut,
      });
    } else {
      existing.totalBookings += 1;
      existing.totalNights += b.nights;
      existing.totalRevenue += b.totalAmount;
      existing.firstStay =
        b.checkIn < existing.firstStay ? b.checkIn : existing.firstStay;
      existing.lastStay =
        b.checkOut > existing.lastStay ? b.checkOut : existing.lastStay;
    }
  }

  return Array.from(map.values());
}

export default function OwnerGuestsPage() {
  const { bookings } = useBookings();
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Audit: owner viewed guests analytics
  useEffect(() => {
    if (!currentUser) return;
    supabaseService
      .createAuditLog({
        actorId: currentUser.dbId,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "view_owner_guests",
        context: "/owner/guests",
      })
      .catch((error) => {
        console.error("Failed to write audit log (view_owner_guests):", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.dbId]);

  const guests = useMemo(() => buildGuestSummaries(bookings), [bookings]);

  const filteredGuests = useMemo(() => {
    let list = [...guests];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.guestName.toLowerCase().includes(q) ||
          g.guestEmail.toLowerCase().includes(q) ||
          g.guestPhone.toLowerCase().includes(q)
      );
    }

    // Order by total nights desc, then total bookings desc
    list.sort((a, b) => {
      if (b.totalNights !== a.totalNights) {
        return b.totalNights - a.totalNights;
      }
      return b.totalBookings - a.totalBookings;
    });

    return list;
  }, [guests, search]);

  const paginatedGuests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredGuests.slice(startIndex, endIndex);
  }, [filteredGuests, currentPage]);

  const totalPages = Math.ceil(filteredGuests.length / ITEMS_PER_PAGE) || 1;

  const stats = useMemo(() => {
    const totalGuests = guests.length;
    const totalNights = guests.reduce((sum, g) => sum + g.totalNights, 0);
    const totalRevenue = guests.reduce((sum, g) => sum + g.totalRevenue, 0);

    return { totalGuests, totalNights, totalRevenue };
  }, [guests]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Guests
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total guests" value={stats.totalGuests} />
        <StatCard title="Total nights" value={stats.totalNights} />
        <StatCard title="Total revenue" value={`₦${stats.totalRevenue.toLocaleString()}`} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center gap-4">
          <div className="min-w-0 flex-1">
            <SearchBar
              value={search}
              onChange={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, phone…"
            />
          </div>
        </div>
      </div>

      {paginatedGuests.length === 0 ? (
        <div className="rounded-xl border bg-gray-50 p-8 text-center text-gray-500">
          No guests found.
        </div>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border bg-white">
          <div
            className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none md:hidden"
            aria-hidden="true"
          />
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Total bookings</th>
                <th className="px-4 py-3 font-medium">Total nights</th>
                <th className="px-4 py-3 font-medium">Total revenue</th>
                <th className="px-4 py-3 font-medium">First stay</th>
                <th className="px-4 py-3 font-medium">Last stay</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGuests.map((g) => (
                <tr
                  key={`${g.guestEmail.toLowerCase()}|${g.guestName
                    .trim()
                    .toLowerCase()}`}
                  className="border-b last:border-0"
                >
                  <td className="px-4 py-3">{g.guestName}</td>
                  <td className="px-4 py-3">{g.guestEmail}</td>
                  <td className="px-4 py-3">{g.guestPhone}</td>
                  <td className="px-4 py-3">{g.totalBookings}</td>
                  <td className="px-4 py-3">{g.totalNights}</td>
                  <td className="px-4 py-3">
                    ₦{g.totalRevenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{g.firstStay}</td>
                  <td className="px-4 py-3">{g.lastStay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

