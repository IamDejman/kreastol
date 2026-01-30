import { MobileHeader } from "@/components/layout/MobileHeader";
import { Header } from "@/components/layout/Header";
import { CustomerBookingWidget } from "@/components/booking/CustomerBookingWidget";
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
        <CustomerBookingWidget />
      </main>

      <Footer />
    </>
  );
}
