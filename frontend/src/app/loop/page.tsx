import { LoopExperience } from "@/components/loop-experience";

export const metadata = {
  title: "The Closed Loop · REWEAR-FUSED",
};

export default function LoopPage() {
  return (
    <main className="flex-1">
      <h1 className="sr-only">The Closed Loop · REWEAR-FUSED</h1>
      <LoopExperience />
    </main>
  );
}
