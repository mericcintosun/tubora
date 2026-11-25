import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <Card className="tubora-enter rotate-[0.5deg] p-8 text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">That palette is not in the box.</h2>
        <p className="mx-auto mt-3 max-w-[50ch] leading-relaxed">
          The link may be mistyped, or the plan was never saved. Open the sunset and pack a new one.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/pack?scene=marmara-dusk">Pack my tubes</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to Tubora</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
