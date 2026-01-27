import { MobileHeader } from "@/components/layout/MobileHeader";
import { Header } from "@/components/layout/Header";
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

      <main>
        <CalendarSection />
        <AmenitiesSection />
        <PoliciesSection />
      </main>

      <Footer />
    </>
  );
}
