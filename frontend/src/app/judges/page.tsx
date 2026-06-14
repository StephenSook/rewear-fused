import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { JudgesLedger } from "@/components/judges-ledger";

export const metadata = {
  title: "For the judges · REWEAR-FUSED",
};

export default function JudgesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      <div className="mt-6">
        <JudgesLedger />
      </div>
    </main>
  );
}
