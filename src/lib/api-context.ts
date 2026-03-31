import { headers } from "next/headers";

export async function getRequestId(): Promise<string> {
  const h = await headers();
  return h.get("x-request-id") ?? h.get("X-Request-Id") ?? "no-request-id";
}
