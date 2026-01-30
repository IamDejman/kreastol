"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Filter } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { SearchBar } from "@/components/dashboard/shared/SearchBar";
import { BookingsTable } from "@/components/dashboard/owner/BookingsTable";
import { MobileBookingsTable } from "@/components/dashboard/owner/MobileBookingsTable";
import { ExportButton } from "@/components/dashboard/owner/ExportButton";
import { BookingsFilterDropdown } from "@/components/dashboard/owner/BookingsFilterDropdown";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/formatters";
import { useAuthStore } from "@/store/authStore";
import { supabaseService } from "@/lib/services/supabaseService";

export default function OwnerBookingsPage() {
  const { bookings, refresh } = useBookings();
  const currentUser = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  
  const ITEMS_PER_PAGE = 10;

  // Audit: owner viewed bookings dashboard
  useEffect(() => {
    if (!currentUser) return;
    supabaseService
      .createAuditLog({
        actorId: currentUser.dbId,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "view_owner_bookings",
        context: "/owner/bookings",
      })
      .catch((error) => {
        console.error("Failed to write audit log (view_owner_bookings):", error);
      });
    // fire once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.dbId]);

  const filtered = useMemo(() => {
    let list = [...bookings];

    if (roomFilter !== "all") {
      const roomNum = parseInt(roomFilter, 10);
      list = list.filter((b) => b.roomNumber === roomNum);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.bookingCode.toLowerCase().includes(q) ||
          b.guestName.toLowerCase().includes(q) ||
          b.guestEmail.toLowerCase().includes(q)
      );
    }

    // Filter by date range (check-in date)
    if (startDate) {
      list = list.filter((b) => b.checkIn >= startDate);
    }
    if (endDate) {
      list = list.filter((b) => b.checkIn <= endDate);
    }

    // Sort by: 1) Check-in date (upcoming first)
    //          2) Created date (most recent first)
    list.sort((a, b) => {
      // First, sort by check-in date (upcoming first)
      const checkInDiff = new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
      if (checkInDiff !== 0) return checkInDiff;

      // Then, sort by created date (most recent first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [bookings, roomFilter, search, startDate, endDate]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roomFilter, search, startDate, endDate]);

  const stats = useMemo(() => {
    const totalBookings = filtered.length;
    const totalRevenue = filtered.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalNights = filtered.reduce((sum, b) => sum + b.nights, 0);
    
    return {
      totalBookings,
      totalRevenue,
      totalNights,
    };
  }, [filtered]);

  const hasActiveFilters = Boolean(roomFilter !== "all" || startDate || endDate);

  const handleApplyFilters = (filters: { roomFilter: string; startDate: string; endDate: string }) => {
    setRoomFilter(filters.roomFilter);
    setStartDate(filters.startDate);
    setEndDate(filters.endDate);
  };

  const handleClearFilters = () => {
    setRoomFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-primary">
        Bookings
      </h1>
      
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard 
          title="Total bookings" 
          value={stats.totalBookings}
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats.totalRevenue)}
          subtitle={`From ${stats.totalBookings} booking${stats.totalBookings !== 1 ? 's' : ''}`}
        />
        <StatCard 
          title="Total nights" 
          value={stats.totalNights}
        />
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <ExportButton bookings={filtered} />
        </div>
        
        <div className="relative flex w-full gap-4">
          <div className="min-w-0 flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by code, guest…"
            />
          </div>
          <div className="flex-shrink-0">
            <Button
              ref={filterButtonRef}
              variant="secondary"
              size="sm"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={hasActiveFilters ? "border-primary text-primary" : ""}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
                  {[roomFilter !== "all" ? 1 : 0, startDate ? 1 : 0, endDate ? 1 : 0].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </Button>
          </div>
          
          <BookingsFilterDropdown
            isOpen={isFilterDropdownOpen}
            onClose={() => setIsFilterDropdownOpen(false)}
            buttonRef={filterButtonRef}
            roomFilter={roomFilter}
            startDate={startDate}
            endDate={endDate}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </div>
      
      {isMobile || isTablet ? (
        <MobileBookingsTable bookings={paginatedBookings} onRefresh={refresh} />
      ) : (
        <BookingsTable bookings={paginatedBookings} onRefresh={refresh} />
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
