import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { db, readUpload, syncDb } from "@/lib/db";
import { can } from "@/lib/permissions";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

export async function GET(req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  // Only our generated names: uuid + known extension. Blocks any path traversal.
  if (!/^[0-9a-f-]{36}\.(png|jpg|webp)$/.test(name)) return new Response("Not found", { status: 404 });

  await syncDb();
  const ad = db().ads.find((a) => a.image === name);
  if (!ad) return new Response("Not found", { status: 404 });

  const download = req.nextUrl.searchParams.get("download") === "1";
  if (download) {
    // Downloading is for signed-in users, and only when the client made the ad adoptable.
    const user = await getUser();
    if (!ad.adoptable || !can(user, "ad.download")) return new Response("Forbidden", { status: 403 });
  }

  const bytes = await readUpload(name);
  if (!bytes) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": TYPES[name.split(".").pop() as string],
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };
  if (download) headers["Content-Disposition"] = `attachment; filename="${ad.title.replace(/[^\w.-]+/g, "_").slice(0, 40)}.${name.split(".").pop()}"`;
  return new Response(new Uint8Array(bytes), { headers });
}
