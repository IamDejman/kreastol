import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";
import { HOTEL_INFO } from "@/lib/constants/config";

export default function ContactPage() {
  const { contact } = HOTEL_INFO;
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <BackButton href="/" label="Back to home" className="mb-6" />
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Contact
        </h1>
        <div className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary" />
            <a
              href={`tel:${contact.phone}`}
              className="text-foreground hover:text-primary"
            >
              {contact.phone}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <a
              href={`mailto:${contact.email}`}
              className="text-foreground hover:text-primary"
            >
              {contact.email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-foreground">{contact.address}</span>
          </div>
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
