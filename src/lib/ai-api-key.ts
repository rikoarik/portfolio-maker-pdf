import { prisma } from "@/lib/db";

export async function resolveGeminiApiKeyForUser(
  userId?: string | null,
): Promise<string | null> {
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiApiKey: true },
    });
    const userKey = user?.aiApiKey?.trim();
    if (userKey) return userKey;
  }
  const fallback = process.env.GEMINI_API_KEY?.trim();
  return fallback || null;
}
