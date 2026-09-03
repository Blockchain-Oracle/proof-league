import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16">
      <p className="font-data text-xs uppercase tracking-widest text-ink-muted">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold">This page does not exist.</h1>
      <Link href="/" className="mt-4 inline-block border border-rule px-4 py-1.5 font-display text-sm font-semibold hover:border-ink">
        Back to the floor
      </Link>
    </div>
  );
}
