import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { MonoLabel } from "@/components/instrument";
import { PassportExplorer } from "@/components/passport-explorer";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "Digital Recyclability Passport · REWEAR-FUSED",
};

export default function PassportPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Reveal>
        <header className="mt-6 mb-10">
          <MonoLabel>Engine C · the demo floor</MonoLabel>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            Digital Recyclability Passport
          </h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Pick a garment. The router classifies it clear, lab-test, or divert
            against real US and EU chemical regulation, and emits a scannable
            GS1 Digital Link passport. This is the product Carter&apos;s can deploy
            in Year 1 while the molecular loop validates in Year 2.
          </p>
        </header>
      </Reveal>

      <PassportExplorer />
    </main>
  );
}
