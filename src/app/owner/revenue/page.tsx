"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Filter } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { RevenueChart } from "@/components/dashboard/owner/RevenueChart";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { BookingsFilterDropdown } from "@/components/dashboard/owner/BookingsFilterDropdown";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/formatters";
import { useAuthStore } from "@/store/authStore";
import { supabaseService } from "@/lib/services/supabaseService";

export default function OwnerRevenuePage() {
  const { bookings } = useBookings();
  const currentUser = useAuthStore((s) => s.user);
  const [roomFilter, setRoomFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  
  const filtered = useMemo(() => {
    let list = [...bookings];
    
    // Filter by room
    if (roomFilter !== "all") {
      const roomNum = parseInt(roomFilter, 10);
      list = list.filter((b) => b.roomNumber === roomNum);
    }
    
    // Filter by date range (payment date)
    if (startDate) {
      list = list.filter((b) => {
        if (!b.paymentDate) return false;
        return b.paymentDate >= startDate;
      });
    }
    if (endDate) {
      list = list.filter((b) => {
        if (!b.paymentDate) return false;
        return b.paymentDate <= endDate;
      });
    }
    
    return list;
  }, [bookings, roomFilter, startDate, endDate]);
  
  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((s, b) => s + b.totalAmount, 0);
    const totalBookings = filtered.length;
    const averageBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    return {
      totalRevenue,
      totalBookings,
      averageBooking,
    };
  }, [filtered]);

  const hasActiveFilters = Boolean(roomFilter !== "all" || startDate || endDate);

  // Audit: owner viewed revenue analytics
  useEffect(() => {
    if (!currentUser) return;
    supabaseService
      .createAuditLog({
        actorId: currentUser.dbId,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "view_owner_revenue",
        context: "/owner/revenue",
      })
      .catch((error) => {
        console.error("Failed to write audit log (view_owner_revenue):", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.dbId]);

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
      <div>
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Revenue
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of all booking revenue
        </p>
      </div>
      
      <div className="relative flex justify-end">
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
      
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats.totalRevenue)}
        />
        <StatCard 
          title="Total Bookings" 
          value={stats.totalBookings}
        />
      </div>
      
      <RevenueChart bookings={filtered} />
    </div>
  );
}
