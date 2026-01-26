"use client";

import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { HOTEL_INFO } from "@/lib/constants/config";

export function Footer() {
  const { name, contact } = HOTEL_INFO;
  return (
    <footer className="border-t bg-gray-50 px-4 py-12 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Hotel Info */}
          <div>
            <Link href="/" className="mb-3 block">
              <h3 className="font-heading text-lg font-semibold text-primary">
                {name}
              </h3>
            </Link>
            <p className="mt-2 text-sm text-gray-600">{HOTEL_INFO.tagline}</p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <a
                  href={`tel:${contact.phone}`}
                  className="hover:text-primary transition-colors"
                >
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <a
                  href={`mailto:${contact.email}`}
                  className="hover:text-primary transition-colors break-all"
                >
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{contact.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t pt-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
