import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { MonoLabel } from "@/components/instrument";
import { PassportExplorer } from "@/components/passport-explorer";
import { Reveal } from "@/components/reveal";
import { getGarments } from "@/lib/data";

/** Pre-render a clean passport page per garment (the QR scan target). */
export function generateStaticParams() {
  return getGarments().map((g) => ({ garmentId: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ garmentId: string }>;
}) {
  const { garmentId } = await params;
  const g = getGarments().find((x) => x.id === garmentId);
  return {
    title: g
      ? `${g.name} · Digital Recyclability Passport`
      : "Digital Recyclability Passport · REWEAR-FUSED",
  };
}

/**
 * Single-product Digital Recyclability Passport, the page a scanned GS1 QR
 * resolves to. Shows one garment's passport, compliance routing, scannable link,
 * and the in-browser credential verification, the way a real brand DPP behaves
 * (no garment picker).
 */
export default async function GarmentPassportPage({
  params,
}: {
  params: Promise<{ garmentId: string }>;
}) {
  const { garmentId } = await params;
  const garment = getGarments().find((g) => g.id === garmentId);
  if (!garment) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <Link
        href="/passport"
        className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> All garments
      </Link>

      <Reveal>
        <header className="mt-6 mb-10">
          <MonoLabel>Engine C · Digital Recyclability Passport</MonoLabel>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            {garment.name}
          </h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            The EU-ESPR-aligned passport for this exact garment: its compliance routing
            against real US and EU chemical regulation, a scannable GS1 Digital Link, and
            a cryptographically verifiable Ed25519 credential you can check in your browser.
            This is what a scanned product resolves to.
          </p>
        </header>
      </Reveal>

      <PassportExplorer initialGarmentId={garmentId} hidePicker />
    </main>
  );
}
