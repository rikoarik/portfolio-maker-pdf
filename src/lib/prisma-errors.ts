import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { jsonError } from "@/lib/http";

/** Maps Prisma P1001 (DB unreachable) to a JSON 503 for API routes. */
export function dbUnreachableResponse(e: unknown): NextResponse | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P1001") {
    return jsonError(
      503,
      "database_unreachable",
      "Tidak dapat menyambung ke database Postgres. Pastikan DATABASE_URL memakai Session pooler dari Supabase (Dashboard → Database). Setelah mengubah .env, restart server dev. Lihat README.",
    );
  }
  return null;
}
