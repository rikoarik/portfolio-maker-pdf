import type { NextRequest } from "next/server";

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

function baseUrl(): string {
  const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
  return isProd ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
}

function requireServerKey(): string {
  if (!SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured");
  }
  return SERVER_KEY;
}

function authHeader(): string {
  const key = requireServerKey();
  const token = Buffer.from(`${key}:`).toString("base64");
  return `Basic ${token}`;
}

export async function midtransPostJson<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Midtrans error ${res.status}: ${text.slice(0, 300)}`,
    );
  }
  return (await res.json()) as TResponse;
}

export function midtransDetermineOrigin(req: NextRequest): string {
  const originHeader = req.headers.get("origin");
  if (originHeader?.startsWith("http")) {
    return originHeader.replace(/\/$/, "");
  }
  const app = process.env.NEXT_PUBLIC_APP_URL;
  if (app?.startsWith("http")) {
    return app.replace(/\/$/, "");
  }
  const v = process.env.VERCEL_URL;
  if (v) {
    const full = v.startsWith("http") ? v : `https://${v}`;
    return full.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

