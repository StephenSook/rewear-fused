import { NextResponse, type NextRequest } from "next/server";
import { GTIN_TO_GARMENT } from "@/lib/gs1";

/**
 * GS1 Digital Link resolver. A scanned passport QR lands on
 * /01/<gtin>/21/<serial> and is resolved to the live passport view for that
 * garment. This is the resolver a brand like Carter's runs for its own EU
 * Digital Product Passport; here it makes the scannable QR actually open the
 * passport from any phone, on any deployment.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gtin: string; serial: string }> },
) {
  const { gtin } = await params;
  const garmentId = GTIN_TO_GARMENT[gtin];
  // Resolve to the garment's own single-product passport page; unknown GTINs
  // fall back to the passport index.
  const url = new URL(garmentId ? `/passport/${garmentId}` : "/passport", req.url);
  return NextResponse.redirect(url, 307);
}
