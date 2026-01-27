"use client";

import Image from "next/image";
import { HOTEL_INFO } from "@/lib/constants/config";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gray-900">
      <div className="relative h-[50vh] min-h-[320px] md:h-[60vh]">
        <Image
          src="/images/hero-mobile.jpg"
          alt="No13teen"
          fill
          className="object-cover md:hidden"
          priority
          sizes="100vw"
        />
        <Image
          src="/images/hero-tablet.jpg"
          alt="No13teen"
          fill
          className="hidden object-cover md:block lg:hidden"
          priority
          sizes="100vw"
        />
        <Image
          src="/images/hero-desktop.jpg"
          alt="No13teen"
          fill
          className="hidden object-cover lg:block"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            {HOTEL_INFO.name}
          </h1>
          <p className="mt-2 max-w-xl text-lg text-white/90 md:text-xl">
            {HOTEL_INFO.tagline}
          </p>
        </div>
      </div>
    </section>
  );
}
