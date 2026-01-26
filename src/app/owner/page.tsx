"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

export default function OwnerPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/owner/bookings");
  }, [router]);
  
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
