"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Filter } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useVisibilityChange } from "@/hooks/useVisibilityChange";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { POLLING_INTERVALS } from "@/lib/constants/config";
import { ReceptionistBookingsTable } from "./ReceptionistBookingsTable";
import { ReceptionistMobileBookingsTable } from "./ReceptionistMobileBookingsTable";
import { SearchBar } from "@/components/dashboard/shared/SearchBar";
import { BookingsFilterDropdown } from "@/components/dashboard/owner/BookingsFilterDropdown";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";

export function ReceptionistDashboard() {
  const { bookings, refresh } = useBookings();
  const isVisible = useVisibilityChange();
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

  useEffect(() => {
    if (!isVisible) return;
    refresh();
    const interval = setInterval(refresh, POLLING_INTERVALS.dashboardBookings);
    return () => clearInterval(interval);
  }, [isVisible, refresh]);

  const filtered = useMemo(() => {
    let list = [...bookings];

    // Filter by room
    if (roomFilter !== "all") {
      const roomNum = parseInt(roomFilter, 10);
      list = list.filter((b) => b.roomNumber === roomNum);
    }

    // Filter by search (name, email, booking code)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.bookingCode.toLowerCase().includes(q) ||
          b.guestName.toLowerCase().includes(q) ||
          b.guestEmail.toLowerCase().includes(q) ||
          b.guestPhone.toLowerCase().includes(q)
      );
    }

    // Filter by date range (check-in date)
    if (startDate) {
      list = list.filter((b) => b.checkIn >= startDate);
    }
    if (endDate) {
      list = list.filter((b) => b.checkIn <= endDate);
    }

    // Sort by creation date (most recent first)
    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return list;
  }, [bookings, search, roomFilter, startDate, endDate]);

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
      <p className="text-gray-600">
        Recent bookings. Tap to view booking details.
      </p>
      
      <div className="relative flex w-full gap-4">
        <div className="min-w-0 flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, code…"
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

      {isMobile || isTablet ? (
        <ReceptionistMobileBookingsTable bookings={paginatedBookings} onRefresh={refresh} />
      ) : (
        <ReceptionistBookingsTable bookings={paginatedBookings} onRefresh={refresh} />
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
