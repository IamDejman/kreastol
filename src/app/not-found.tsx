import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="font-heading text-4xl font-bold text-primary">404</h1>
      <p className="mt-2 text-gray-600">This page could not be found.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
