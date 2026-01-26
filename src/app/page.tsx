import { MobileHeader } from "@/components/layout/MobileHeader";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { CalendarSection } from "@/components/landing/CalendarSection";
import { AmenitiesSection } from "@/components/landing/AmenitiesSection";
import { PoliciesSection } from "@/components/landing/PoliciesSection";
import { Footer } from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileHeader />
      </div>
      <div className="hidden md:block">
        <Header />
      </div>

      <main className="pb-16 md:pb-0">
        <CalendarSection />
        <AmenitiesSection />
        <PoliciesSection />
      </main>

      <Footer />

      <BottomNav />
    </>
  );
}
