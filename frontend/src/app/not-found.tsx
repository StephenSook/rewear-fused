import Link from "next/link";

export const metadata = { title: "Off the loop · REWEAR-FUSED" };

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] flex-1 place-items-center px-6 text-center">
      <div className="max-w-md">
        <span className="mono-label text-fg-muted">404 · off the loop</span>
        <h1 className="mt-3 font-display text-4xl leading-tight">This thread doesn&apos;t lead anywhere.</h1>
        <p className="mt-3 text-sm text-fg-muted">
          The page you&apos;re after isn&apos;t part of the build. Everything that matters is one click away.
        </p>
        <Link
          href="/"
          className="mono-label mt-6 inline-flex items-center gap-2 border border-rule px-5 py-2.5 transition-colors hover:text-fg"
        >
          Back to the story
        </Link>
      </div>
    </main>
  );
}
