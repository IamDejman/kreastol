import Link from "next/link";
import { BackButton } from "@/components/layout/BackButton";
import { HOTEL_INFO } from "@/lib/constants/config";

export default function PoliciesPage() {
  const { policies } = HOTEL_INFO;
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <BackButton href="/" label="Back to home" className="mb-6" />
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Policies
        </h1>
        <div className="mt-6 space-y-6 rounded-xl bg-white p-6 shadow-sm">
          <section>
            <h2 className="text-sm font-semibold text-gray-500">
              Check-in / Check-out
            </h2>
            <p className="mt-1 text-foreground">
              Check-in: {policies.checkInTime} · Check-out:{" "}
              {policies.checkOutTime}
            </p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-gray-500">ID Required</h2>
            <p className="mt-1 text-foreground">{policies.idRequired}</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-gray-500">
              Children & Pets
            </h2>
            <p className="mt-1 text-foreground">
              Children: {policies.childrenAllowed ? "Allowed" : "Not allowed"} ·
              Pets: {policies.petsAllowed ? "Allowed" : "Not allowed"}
            </p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-gray-500">
              Cancellation
            </h2>
            <p className="mt-1 text-foreground">
              {policies.cancellationPolicy}
            </p>
          </section>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="text-primary hover:underline">
            Return home
          </Link>
        </p>
      </div>
    </div>
  );
}
